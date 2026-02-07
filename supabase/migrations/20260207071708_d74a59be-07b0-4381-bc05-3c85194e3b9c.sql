-- Enhanced admin analytics function with date filtering and funnel data
CREATE OR REPLACE FUNCTION public.get_admin_app_pulse_v2(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_exclude_test_accounts boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_start_date date;
  v_end_date date;
  v_total_signups integer;
  v_activated_families integer;
  v_engaged_families integer;
  v_active_families_7d integer;
  v_stuck_onboarding json;
  v_churn_risk integer;
  v_low_engagement integer;
  v_daily_trends json;
  v_category_completions json;
  v_total_families integer;
  v_families_without_children integer;
  v_total_profiles integer;
  v_total_parents integer;
  v_total_children integer;
  v_active_children_7d integer;
  v_total_tasks integer;
  v_total_completions integer;
  v_completions_today integer;
  v_completions_7d integer;
  v_potential_today integer;
  v_potential_7d integer;
  v_active_children_today integer;
  v_shared_device_children integer;
  v_separate_device_children integer;
  v_marketing_consent_count integer;
  v_marketing_emails text[];
  v_recent_signups json;
  v_weekly_trends json;
  v_star_families json;
  v_school_quest_stats json;
  v_pwa_stats json;
  v_test_emails text[] := ARRAY['test@', 'demo@', '@test.com', '@example.com'];
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Default date range: last 30 days if not specified
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);
  v_start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');

  -- FUNNEL METRICS (based on signup date filter for cohort analysis)
  
  -- Total signups (families created in date range)
  SELECT COUNT(*) INTO v_total_signups
  FROM families f
  WHERE (f.created_at::date) >= v_start_date 
    AND (f.created_at::date) <= v_end_date
    AND (NOT p_exclude_test_accounts OR NOT EXISTS (
      SELECT 1 FROM profiles p 
      JOIN auth.users u ON p.user_id = u.id 
      WHERE p.family_id = f.id 
        AND (u.email ILIKE ANY(v_test_emails))
    ));

  -- Activated families (have at least 1 child) - cohort from signup date
  SELECT COUNT(DISTINCT f.id) INTO v_activated_families
  FROM families f
  WHERE (f.created_at::date) >= v_start_date 
    AND (f.created_at::date) <= v_end_date
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.family_id = f.id AND p.role = 'child')
    AND (NOT p_exclude_test_accounts OR NOT EXISTS (
      SELECT 1 FROM profiles p2 
      JOIN auth.users u ON p2.user_id = u.id 
      WHERE p2.family_id = f.id 
        AND (u.email ILIKE ANY(v_test_emails))
    ));

  -- Engaged families (have at least 1 task created) - cohort from signup date
  SELECT COUNT(DISTINCT f.id) INTO v_engaged_families
  FROM families f
  WHERE (f.created_at::date) >= v_start_date 
    AND (f.created_at::date) <= v_end_date
    AND EXISTS (SELECT 1 FROM tasks t WHERE t.family_id = f.id)
    AND (NOT p_exclude_test_accounts OR NOT EXISTS (
      SELECT 1 FROM profiles p 
      JOIN auth.users u ON p.user_id = u.id 
      WHERE p.family_id = f.id 
        AND (u.email ILIKE ANY(v_test_emails))
    ));

  -- Active families in last 7 days (completed at least 1 task) - cohort from signup date
  SELECT COUNT(DISTINCT f.id) INTO v_active_families_7d
  FROM families f
  WHERE (f.created_at::date) >= v_start_date 
    AND (f.created_at::date) <= v_end_date
    AND EXISTS (
      SELECT 1 FROM daily_progress dp 
      JOIN profiles p ON dp.child_id = p.id
      WHERE p.family_id = f.id 
        AND dp.completed = true 
        AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date
    )
    AND (NOT p_exclude_test_accounts OR NOT EXISTS (
      SELECT 1 FROM profiles p2 
      JOIN auth.users u ON p2.user_id = u.id 
      WHERE p2.family_id = f.id 
        AND (u.email ILIKE ANY(v_test_emails))
    ));

  -- RED FLAGS / ATTENTION NEEDED

  -- Stuck in onboarding: signed up > 24h ago but no child added
  SELECT json_agg(stuck_data) INTO v_stuck_onboarding
  FROM (
    SELECT 
      f.id as family_id,
      f.short_code as family_code,
      f.created_at,
      u.email as parent_email
    FROM families f
    LEFT JOIN profiles p ON p.family_id = f.id AND p.role = 'parent'
    LEFT JOIN auth.users u ON p.user_id = u.id
    WHERE f.created_at < (NOW() - INTERVAL '24 hours')
      AND NOT EXISTS (SELECT 1 FROM profiles c WHERE c.family_id = f.id AND c.role = 'child')
      AND (NOT p_exclude_test_accounts OR u.email IS NULL OR NOT (u.email ILIKE ANY(v_test_emails)))
    ORDER BY f.created_at DESC
    LIMIT 50
  ) stuck_data;

  -- Churn risk: families that WERE active but haven't completed in last 4 days
  SELECT COUNT(DISTINCT f.id) INTO v_churn_risk
  FROM families f
  WHERE EXISTS (
    -- Was active before (completed something before 4 days ago)
    SELECT 1 FROM daily_progress dp 
    JOIN profiles p ON dp.child_id = p.id
    WHERE p.family_id = f.id 
      AND dp.completed = true 
      AND (dp.date::date) < (CURRENT_DATE - INTERVAL '4 days')::date
  )
  AND NOT EXISTS (
    -- But no activity in last 4 days
    SELECT 1 FROM daily_progress dp2 
    JOIN profiles p2 ON dp2.child_id = p2.id
    WHERE p2.family_id = f.id 
      AND dp2.completed = true 
      AND (dp2.date::date) >= (CURRENT_DATE - INTERVAL '4 days')::date
  );

  -- Low engagement: families with child but 0 tasks
  SELECT COUNT(DISTINCT f.id) INTO v_low_engagement
  FROM families f
  WHERE EXISTS (SELECT 1 FROM profiles p WHERE p.family_id = f.id AND p.role = 'child')
    AND NOT EXISTS (SELECT 1 FROM tasks t WHERE t.family_id = f.id);

  -- Daily trends (signups vs active for chart)
  SELECT json_agg(trend_data ORDER BY trend_data.date DESC) INTO v_daily_trends
  FROM (
    SELECT 
      d.date,
      (SELECT COUNT(*) FROM families f WHERE (f.created_at::date) = d.date) as new_signups,
      (SELECT COUNT(DISTINCT p.family_id) 
       FROM daily_progress dp
       JOIN profiles p ON dp.child_id = p.id
       WHERE dp.completed = true AND (dp.date::date) = d.date) as active_families
    FROM generate_series(v_start_date, v_end_date, '1 day'::interval) d(date)
  ) trend_data;

  -- Task completions by category (last 7 days)
  SELECT json_agg(cat_data) INTO v_category_completions
  FROM (
    SELECT 
      t.category,
      COUNT(*) FILTER (WHERE dp.completed = true) as completions,
      COUNT(*) as potential
    FROM daily_progress dp
    JOIN tasks t ON dp.task_id = t.id
    WHERE (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date
    GROUP BY t.category
  ) cat_data;

  -- EXISTING METRICS (kept for backward compatibility)
  
  -- Total families
  SELECT COUNT(*) INTO v_total_families FROM families;

  -- Families without children
  SELECT COUNT(*) INTO v_families_without_children
  FROM families f
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.family_id = f.id AND p.role = 'child'
  );

  -- Total profiles
  SELECT COUNT(*) INTO v_total_profiles FROM profiles;

  -- Total parents
  SELECT COUNT(*) INTO v_total_parents FROM profiles WHERE role = 'parent';

  -- Total children
  SELECT COUNT(*) INTO v_total_children FROM profiles WHERE role = 'child';

  -- Active children in last 7 days
  SELECT COUNT(DISTINCT daily_progress.child_id) INTO v_active_children_7d
  FROM daily_progress
  WHERE daily_progress.completed = true 
    AND daily_progress.child_id IS NOT NULL
    AND (daily_progress.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date;

  -- Total tasks
  SELECT COUNT(*) INTO v_total_tasks FROM tasks;

  -- Total completions
  SELECT COUNT(*) INTO v_total_completions FROM daily_progress WHERE completed = true;

  -- Completions today
  SELECT COUNT(*) INTO v_completions_today
  FROM daily_progress WHERE completed = true AND date = to_char(CURRENT_DATE, 'YYYY-MM-DD');

  -- Completions in last 7 days
  SELECT COUNT(*) INTO v_completions_7d
  FROM daily_progress
  WHERE completed = true AND (date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date;

  -- Potential today
  SELECT COUNT(*) INTO v_potential_today
  FROM daily_progress WHERE date = to_char(CURRENT_DATE, 'YYYY-MM-DD');

  -- Potential 7 days
  SELECT COUNT(*) INTO v_potential_7d
  FROM daily_progress WHERE (date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date;

  -- Active children today
  SELECT COUNT(DISTINCT active_child) INTO v_active_children_today
  FROM (
    SELECT daily_progress.child_id as active_child
    FROM daily_progress
    WHERE daily_progress.completed = true 
      AND daily_progress.child_id IS NOT NULL
      AND daily_progress.date = to_char(CURRENT_DATE, 'YYYY-MM-DD')
    UNION
    SELECT lesson_progress.child_id as active_child
    FROM lesson_progress
    WHERE lesson_progress.completed = true 
      AND lesson_progress.child_id IS NOT NULL
      AND lesson_progress.date = to_char(CURRENT_DATE, 'YYYY-MM-DD')
  ) active_users;

  -- Device configuration
  SELECT COUNT(*) INTO v_shared_device_children FROM profiles WHERE role = 'child' AND user_id IS NULL;
  SELECT COUNT(*) INTO v_separate_device_children FROM profiles WHERE role = 'child' AND user_id IS NOT NULL;

  -- Marketing consent
  SELECT COUNT(*) INTO v_marketing_consent_count FROM profiles WHERE marketing_consent = true;

  SELECT ARRAY_AGG(DISTINCT u.email) INTO v_marketing_emails
  FROM profiles p
  JOIN auth.users u ON p.user_id = u.id
  WHERE p.marketing_consent = true AND u.email IS NOT NULL;

  -- Recent signups
  SELECT json_agg(signup_data) INTO v_recent_signups
  FROM (
    SELECT 
      u.id as user_id,
      u.email,
      u.created_at,
      u.last_sign_in_at,
      CASE WHEN p.id IS NOT NULL THEN true ELSE false END as has_profile,
      p.role as profile_role,
      p.display_name,
      CASE WHEN p.family_id IS NOT NULL THEN true ELSE false END as has_family
    FROM auth.users u
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.created_at >= (NOW() - INTERVAL '7 days')
      AND (NOT p_exclude_test_accounts OR NOT (u.email ILIKE ANY(v_test_emails)))
    ORDER BY u.created_at DESC
    LIMIT 50
  ) signup_data;

  -- Weekly trends
  SELECT json_agg(trend_data ORDER BY week_start DESC) INTO v_weekly_trends
  FROM (
    SELECT 
      date_trunc('week', (date::date))::date as week_start,
      COUNT(*) FILTER (WHERE completed = true) as completions,
      COUNT(DISTINCT child_id) FILTER (WHERE completed = true) as active_children
    FROM daily_progress
    WHERE (date::date) >= (CURRENT_DATE - INTERVAL '8 weeks')::date
    GROUP BY date_trunc('week', (date::date))::date
  ) trend_data;

  -- Star families
  SELECT json_agg(family_data) INTO v_star_families
  FROM (
    SELECT 
      f.id as family_id,
      f.name as family_name,
      f.short_code as family_code,
      (SELECT u.email FROM profiles p2 JOIN auth.users u ON p2.user_id = u.id WHERE p2.family_id = f.id AND p2.role = 'parent' LIMIT 1) as parent_email,
      (SELECT p2.marketing_consent FROM profiles p2 WHERE p2.family_id = f.id AND p2.role = 'parent' LIMIT 1) as parent_marketing_consent,
      (
        SELECT json_agg(child_stats)
        FROM (
          SELECT 
            p.id as child_id,
            p.display_name,
            COUNT(*) FILTER (WHERE dp.completed = true) as completion_count,
            COUNT(*) as potential_count,
            CASE 
              WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE dp.completed = true)::numeric / COUNT(*)::numeric) * 100)
              ELSE 0 
            END as completion_rate
          FROM profiles p
          LEFT JOIN daily_progress dp ON dp.child_id = p.id 
            AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date
          WHERE p.family_id = f.id AND p.role = 'child'
          GROUP BY p.id, p.display_name
        ) child_stats
      ) as children,
      (SELECT COUNT(*) FROM profiles WHERE family_id = f.id AND role = 'child') as child_count,
      COALESCE(
        (SELECT COUNT(*) FROM daily_progress dp 
         JOIN profiles p ON dp.child_id = p.id 
         WHERE p.family_id = f.id 
           AND dp.completed = true 
           AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date),
        0
      ) as completion_count,
      CASE 
        WHEN (SELECT COUNT(*) FROM daily_progress dp 
              JOIN profiles p ON dp.child_id = p.id 
              WHERE p.family_id = f.id 
                AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date) > 0 
        THEN ROUND(
          (SELECT COUNT(*) FROM daily_progress dp 
           JOIN profiles p ON dp.child_id = p.id 
           WHERE p.family_id = f.id 
             AND dp.completed = true 
             AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date)::numeric /
          (SELECT COUNT(*) FROM daily_progress dp 
           JOIN profiles p ON dp.child_id = p.id 
           WHERE p.family_id = f.id 
             AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date)::numeric * 100
        )
        ELSE 0 
      END as completion_rate,
      (
        SELECT json_agg(reward_data ORDER BY reward_data.claimed_at DESC)
        FROM (
          SELECT sr.title, sr.claimed_at
          FROM store_rewards sr
          WHERE sr.family_id = f.id AND sr.claimed = true
          ORDER BY sr.claimed_at DESC
          LIMIT 5
        ) reward_data
      ) as recent_rewards
    FROM families f
    WHERE EXISTS (SELECT 1 FROM profiles WHERE family_id = f.id AND role = 'child')
    ORDER BY (
      SELECT COUNT(*) FROM daily_progress dp 
      JOIN profiles p ON dp.child_id = p.id 
      WHERE p.family_id = f.id 
        AND dp.completed = true 
        AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date
    ) DESC
    LIMIT 10
  ) family_data;

  -- School Quest stats
  SELECT json_build_object(
    'families_with_timetable', (SELECT COUNT(DISTINCT family_id) FROM timetables WHERE data != '{}'::jsonb),
    'total_lesson_completions', (SELECT COUNT(*) FROM lesson_progress WHERE completed = true),
    'lesson_completions_7d', (SELECT COUNT(*) FROM lesson_progress WHERE completed = true AND (date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date),
    'children_with_quest_enabled', (SELECT COUNT(*) FROM profiles WHERE role = 'child' AND school_quest_enabled = true)
  ) INTO v_school_quest_stats;

  -- PWA stats
  SELECT json_build_object(
    'total_impressions', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'impression'),
    'total_installs', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'install'),
    'installs_7d', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'install' AND created_at >= NOW() - INTERVAL '7 days'),
    'impressions_7d', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'impression' AND created_at >= NOW() - INTERVAL '7 days'),
    'dismiss_temporary', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'dismiss_temporary'),
    'dismiss_permanent', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'dismiss_permanent'),
    'by_os', (
      SELECT json_agg(json_build_object('os', os, 'count', cnt))
      FROM (SELECT os, COUNT(*) as cnt FROM pwa_events WHERE event_type = 'install' AND os IS NOT NULL GROUP BY os) os_stats
    ),
    'by_browser', (
      SELECT json_agg(json_build_object('browser', browser, 'count', cnt))
      FROM (SELECT browser, COUNT(*) as cnt FROM pwa_events WHERE event_type = 'install' AND browser IS NOT NULL GROUP BY browser) browser_stats
    )
  ) INTO v_pwa_stats;

  RETURN json_build_object(
    -- New funnel metrics
    'funnel', json_build_object(
      'total_signups', v_total_signups,
      'activated_families', v_activated_families,
      'engaged_families', v_engaged_families,
      'active_families_7d', v_active_families_7d
    ),
    -- Red flags
    'red_flags', json_build_object(
      'stuck_onboarding', COALESCE(v_stuck_onboarding, '[]'::json),
      'churn_risk', v_churn_risk,
      'low_engagement', v_low_engagement
    ),
    -- Trend data
    'daily_trends', COALESCE(v_daily_trends, '[]'::json),
    'category_completions', COALESCE(v_category_completions, '[]'::json),
    -- Existing metrics
    'total_families', v_total_families,
    'families_without_children', v_families_without_children,
    'total_profiles', v_total_profiles,
    'total_parents', v_total_parents,
    'total_children', v_total_children,
    'active_children_7d', v_active_children_7d,
    'total_tasks', v_total_tasks,
    'total_completions', v_total_completions,
    'completions_today', v_completions_today,
    'completions_7d', v_completions_7d,
    'potential_today', v_potential_today,
    'potential_7d', v_potential_7d,
    'logins_24h', v_active_children_today,
    'shared_device_children', v_shared_device_children,
    'separate_device_children', v_separate_device_children,
    'marketing_consent_count', v_marketing_consent_count,
    'marketing_emails', COALESCE(v_marketing_emails, ARRAY[]::text[]),
    'recent_signups', COALESCE(v_recent_signups, '[]'::json),
    'weekly_trends', COALESCE(v_weekly_trends, '[]'::json),
    'star_families', COALESCE(v_star_families, '[]'::json),
    'school_quest_stats', v_school_quest_stats,
    'pwa_stats', v_pwa_stats
  );
END;
$function$;