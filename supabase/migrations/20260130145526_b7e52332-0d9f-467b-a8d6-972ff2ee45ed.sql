
CREATE OR REPLACE FUNCTION public.get_admin_app_pulse()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
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
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

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

  -- Active children in last 7 days (completed at least one task)
  SELECT COUNT(DISTINCT daily_progress.child_id) INTO v_active_children_7d
  FROM daily_progress
  WHERE daily_progress.completed = true 
    AND daily_progress.child_id IS NOT NULL
    AND (daily_progress.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date;

  -- Total tasks
  SELECT COUNT(*) INTO v_total_tasks FROM tasks;

  -- Total completions (all time)
  SELECT COUNT(*) INTO v_total_completions 
  FROM daily_progress WHERE completed = true;

  -- Completions today
  SELECT COUNT(*) INTO v_completions_today
  FROM daily_progress 
  WHERE completed = true AND date = to_char(CURRENT_DATE, 'YYYY-MM-DD');

  -- Completions in last 7 days
  SELECT COUNT(*) INTO v_completions_7d
  FROM daily_progress
  WHERE completed = true 
    AND (daily_progress.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date;

  -- Potential today (tasks * active children)
  SELECT COUNT(*) INTO v_potential_today
  FROM daily_progress
  WHERE date = to_char(CURRENT_DATE, 'YYYY-MM-DD');

  -- Potential 7 days
  SELECT COUNT(*) INTO v_potential_7d
  FROM daily_progress
  WHERE (date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date;

  -- Active children TODAY (completed at least one task or lesson today)
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
  SELECT COUNT(*) INTO v_shared_device_children
  FROM profiles WHERE role = 'child' AND user_id IS NULL;

  SELECT COUNT(*) INTO v_separate_device_children
  FROM profiles WHERE role = 'child' AND user_id IS NOT NULL;

  -- Marketing consent
  SELECT COUNT(*) INTO v_marketing_consent_count
  FROM profiles WHERE marketing_consent = true;

  SELECT ARRAY_AGG(DISTINCT u.email) INTO v_marketing_emails
  FROM profiles p
  JOIN auth.users u ON p.user_id = u.id
  WHERE p.marketing_consent = true AND u.email IS NOT NULL;

  -- Recent signups (last 7 days)
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
    ORDER BY u.created_at DESC
    LIMIT 50
  ) signup_data;

  -- Weekly trends (last 8 weeks)
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

  -- Star families (top 10 by completion count in last 7 days)
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

  -- PWA installation stats
  SELECT json_build_object(
    'total_impressions', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'impression'),
    'total_installs', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'install'),
    'installs_7d', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'install' AND created_at >= NOW() - INTERVAL '7 days'),
    'impressions_7d', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'impression' AND created_at >= NOW() - INTERVAL '7 days'),
    'dismiss_temporary', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'dismiss_temporary'),
    'dismiss_permanent', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'dismiss_permanent'),
    'by_os', (
      SELECT json_agg(json_build_object('os', os, 'count', cnt))
      FROM (
        SELECT os, COUNT(*) as cnt
        FROM pwa_events
        WHERE event_type = 'install' AND os IS NOT NULL
        GROUP BY os
      ) os_stats
    ),
    'by_browser', (
      SELECT json_agg(json_build_object('browser', browser, 'count', cnt))
      FROM (
        SELECT browser, COUNT(*) as cnt
        FROM pwa_events
        WHERE event_type = 'install' AND browser IS NOT NULL
        GROUP BY browser
      ) browser_stats
    )
  ) INTO v_pwa_stats;

  RETURN json_build_object(
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
