
CREATE OR REPLACE FUNCTION get_admin_app_pulse_v2(
  p_start_date text DEFAULT NULL,
  p_end_date text DEFAULT NULL,
  p_exclude_test_accounts boolean DEFAULT false
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
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
  v_logins_24h integer;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  v_end_date := COALESCE(p_end_date::date, CURRENT_DATE);
  v_start_date := COALESCE(p_start_date::date, CURRENT_DATE - INTERVAL '30 days');

  -- FUNNEL METRICS
  SELECT COUNT(*) INTO v_total_signups
  FROM families f
  WHERE (f.created_at::date) >= v_start_date AND (f.created_at::date) <= v_end_date
    AND (NOT p_exclude_test_accounts OR NOT EXISTS (
      SELECT 1 FROM profiles p JOIN auth.users u ON p.user_id = u.id WHERE p.family_id = f.id AND (u.email ILIKE ANY(v_test_emails))
    ));

  SELECT COUNT(DISTINCT f.id) INTO v_activated_families
  FROM families f
  WHERE (f.created_at::date) >= v_start_date AND (f.created_at::date) <= v_end_date
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.family_id = f.id AND p.role = 'child')
    AND (NOT p_exclude_test_accounts OR NOT EXISTS (
      SELECT 1 FROM profiles p2 JOIN auth.users u ON p2.user_id = u.id WHERE p2.family_id = f.id AND (u.email ILIKE ANY(v_test_emails))
    ));

  -- ENGAGED: family has ANY entity (task, reward, or completed onboarding/activated)
  SELECT COUNT(DISTINCT f.id) INTO v_engaged_families
  FROM families f
  WHERE (f.created_at::date) >= v_start_date AND (f.created_at::date) <= v_end_date
    AND (
      EXISTS (SELECT 1 FROM tasks t WHERE t.family_id = f.id)
      OR EXISTS (SELECT 1 FROM store_rewards sr WHERE sr.family_id = f.id)
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.family_id = f.id AND p.is_activated = true)
    )
    AND (NOT p_exclude_test_accounts OR NOT EXISTS (
      SELECT 1 FROM profiles p JOIN auth.users u ON p.user_id = u.id WHERE p.family_id = f.id AND (u.email ILIKE ANY(v_test_emails))
    ));

  SELECT COUNT(DISTINCT f.id) INTO v_active_families_7d
  FROM families f
  WHERE (f.created_at::date) >= v_start_date AND (f.created_at::date) <= v_end_date
    AND EXISTS (
      SELECT 1 FROM daily_progress dp JOIN profiles p ON dp.child_id = p.id
      WHERE p.family_id = f.id AND dp.completed = true AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date
    )
    AND (NOT p_exclude_test_accounts OR NOT EXISTS (
      SELECT 1 FROM profiles p2 JOIN auth.users u ON p2.user_id = u.id WHERE p2.family_id = f.id AND (u.email ILIKE ANY(v_test_emails))
    ));

  -- RED FLAGS
  SELECT json_agg(stuck_data) INTO v_stuck_onboarding
  FROM (
    SELECT 
      f.id as family_id, f.short_code as family_code, f.created_at,
      u.email as parent_email,
      COALESCE(p.onboarding_step, 0) as onboarding_step,
      p.is_activated
    FROM families f
    LEFT JOIN profiles p ON p.family_id = f.id AND p.role = 'parent'
    LEFT JOIN auth.users u ON p.user_id = u.id
    WHERE f.created_at < (NOW() - INTERVAL '24 hours')
      AND (f.created_at::date) >= v_start_date AND (f.created_at::date) <= v_end_date
      AND COALESCE(p.onboarding_step, 0) < 6
      AND (NOT p_exclude_test_accounts OR u.email IS NULL OR NOT (u.email ILIKE ANY(v_test_emails)))
    ORDER BY COALESCE(p.onboarding_step, 0) ASC, f.created_at DESC
    LIMIT 50
  ) stuck_data;

  SELECT COUNT(DISTINCT f.id) INTO v_churn_risk
  FROM families f
  WHERE (f.created_at::date) >= v_start_date AND (f.created_at::date) <= v_end_date
    AND EXISTS (
      SELECT 1 FROM daily_progress dp JOIN profiles p ON dp.child_id = p.id
      WHERE p.family_id = f.id AND dp.completed = true AND (dp.date::date) < (CURRENT_DATE - INTERVAL '4 days')::date
    )
    AND NOT EXISTS (
      SELECT 1 FROM daily_progress dp2 JOIN profiles p2 ON dp2.child_id = p2.id
      WHERE p2.family_id = f.id AND dp2.completed = true AND (dp2.date::date) >= (CURRENT_DATE - INTERVAL '4 days')::date
    )
    AND (NOT p_exclude_test_accounts OR NOT EXISTS (
      SELECT 1 FROM profiles p3 JOIN auth.users u ON p3.user_id = u.id WHERE p3.family_id = f.id AND (u.email ILIKE ANY(v_test_emails))
    ));

  SELECT COUNT(DISTINCT f.id) INTO v_low_engagement
  FROM families f
  WHERE (f.created_at::date) >= v_start_date AND (f.created_at::date) <= v_end_date
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.family_id = f.id AND p.role = 'child')
    AND NOT EXISTS (
      SELECT 1 FROM daily_progress dp JOIN profiles p ON dp.child_id = p.id
      WHERE p.family_id = f.id AND dp.completed = true
    )
    AND (NOT p_exclude_test_accounts OR NOT EXISTS (
      SELECT 1 FROM profiles p2 JOIN auth.users u ON p2.user_id = u.id WHERE p2.family_id = f.id AND (u.email ILIKE ANY(v_test_emails))
    ));

  -- DAILY TRENDS
  SELECT json_agg(trend_data ORDER BY trend_data.date) INTO v_daily_trends
  FROM (
    SELECT 
      d.date::text as date,
      COALESCE(s.new_signups, 0) as new_signups,
      COALESCE(a.active_families, 0) as active_families
    FROM generate_series(v_start_date, v_end_date, '1 day'::interval) d(date)
    LEFT JOIN (
      SELECT (created_at::date) as signup_date, COUNT(*) as new_signups
      FROM families GROUP BY (created_at::date)
    ) s ON s.signup_date = d.date::date
    LEFT JOIN (
      SELECT (dp.date::date) as activity_date, COUNT(DISTINCT p.family_id) as active_families
      FROM daily_progress dp JOIN profiles p ON dp.child_id = p.id
      WHERE dp.completed = true
      GROUP BY (dp.date::date)
    ) a ON a.activity_date = d.date::date
  ) trend_data;

  -- CATEGORY COMPLETIONS
  SELECT json_agg(cat_data) INTO v_category_completions
  FROM (
    SELECT t.category, 
      COUNT(CASE WHEN dp.completed = true THEN 1 END) as completions,
      COUNT(*) as potential
    FROM tasks t
    LEFT JOIN daily_progress dp ON dp.task_id = t.id AND (dp.date::date) >= v_start_date AND (dp.date::date) <= v_end_date
    GROUP BY t.category
    ORDER BY completions DESC
  ) cat_data;

  -- GENERAL STATS
  SELECT COUNT(*) INTO v_total_families FROM families;
  
  SELECT COUNT(*) INTO v_families_without_children
  FROM families f
  WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.family_id = f.id AND p.role = 'child');

  SELECT COUNT(*) INTO v_total_profiles FROM profiles;
  SELECT COUNT(*) INTO v_total_parents FROM profiles WHERE role = 'parent';
  SELECT COUNT(*) INTO v_total_children FROM profiles WHERE role = 'child';

  SELECT COUNT(DISTINCT dp.child_id) INTO v_active_children_7d
  FROM daily_progress dp
  WHERE dp.completed = true AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date;

  SELECT COUNT(*) INTO v_total_tasks FROM tasks;

  SELECT COUNT(*) INTO v_total_completions FROM daily_progress WHERE completed = true;

  SELECT COUNT(*) INTO v_completions_today
  FROM daily_progress WHERE completed = true AND date = to_char(CURRENT_DATE, 'YYYY-MM-DD');

  SELECT COUNT(*) INTO v_completions_7d
  FROM daily_progress WHERE completed = true AND (date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date;

  -- POTENTIAL = number of tasks that COULD have been completed
  SELECT COUNT(*) INTO v_potential_today
  FROM tasks t
  JOIN profiles p ON (t.assigned_to = p.id OR (t.assigned_to IS NULL AND t.family_id = p.family_id))
  WHERE p.role = 'child'
    AND EXTRACT(DOW FROM CURRENT_DATE) = ANY(t.schedule_days);

  SELECT COUNT(*) INTO v_potential_7d
  FROM tasks t
  JOIN profiles p ON (t.assigned_to = p.id OR (t.assigned_to IS NULL AND t.family_id = p.family_id))
  CROSS JOIN generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d(day)
  WHERE p.role = 'child'
    AND EXTRACT(DOW FROM d.day) = ANY(t.schedule_days);

  -- LOGINS 24H
  SELECT COUNT(DISTINCT id) INTO v_logins_24h
  FROM auth.users
  WHERE last_sign_in_at >= (NOW() - INTERVAL '24 hours');

  -- DEVICE SPLIT
  SELECT COUNT(*) INTO v_shared_device_children FROM profiles WHERE role = 'child' AND user_id IS NULL;
  SELECT COUNT(*) INTO v_separate_device_children FROM profiles WHERE role = 'child' AND user_id IS NOT NULL;

  -- MARKETING
  SELECT COUNT(*) INTO v_marketing_consent_count FROM profiles WHERE marketing_consent = true;
  SELECT ARRAY_AGG(u.email) INTO v_marketing_emails
  FROM profiles p JOIN auth.users u ON p.user_id = u.id
  WHERE p.marketing_consent = true AND u.email IS NOT NULL;

  -- RECENT SIGNUPS
  SELECT json_agg(signup_data ORDER BY signup_data.created_at DESC) INTO v_recent_signups
  FROM (
    SELECT 
      u.id as user_id,
      u.email,
      u.created_at,
      u.last_sign_in_at,
      (p.id IS NOT NULL) as has_profile,
      p.role as profile_role,
      p.display_name,
      (p.family_id IS NOT NULL) as has_family,
      COALESCE(p.onboarding_step, 0) as onboarding_step,
      COALESCE(p.is_activated, false) as is_activated
    FROM auth.users u
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.created_at >= (NOW() - INTERVAL '7 days')
    ORDER BY u.created_at DESC
    LIMIT 20
  ) signup_data;

  -- WEEKLY TRENDS
  SELECT json_agg(wt ORDER BY wt.week_start) INTO v_weekly_trends
  FROM (
    SELECT 
      date_trunc('week', dp.date::date)::date::text as week_start,
      COUNT(CASE WHEN dp.completed THEN 1 END) as completions,
      COUNT(DISTINCT dp.child_id) as active_children
    FROM daily_progress dp
    WHERE (dp.date::date) >= v_start_date AND (dp.date::date) <= v_end_date
    GROUP BY date_trunc('week', dp.date::date)
  ) wt;

  -- STAR FAMILIES
  SELECT json_agg(sf ORDER BY sf.completion_rate DESC) INTO v_star_families
  FROM (
    SELECT 
      f.id as family_id,
      f.name as family_name,
      f.short_code as family_code,
      (SELECT u.email FROM profiles pp JOIN auth.users u ON pp.user_id = u.id WHERE pp.family_id = f.id AND pp.role = 'parent' LIMIT 1) as parent_email,
      (SELECT pp.marketing_consent FROM profiles pp WHERE pp.family_id = f.id AND pp.role = 'parent' LIMIT 1) as parent_marketing_consent,
      (SELECT json_agg(child_info) FROM (
        SELECT 
          cp.id as child_id,
          cp.display_name,
          COUNT(CASE WHEN dp.completed THEN 1 END) as completion_count,
          COUNT(dp.id) as potential_count,
          CASE WHEN COUNT(dp.id) > 0 THEN ROUND(COUNT(CASE WHEN dp.completed THEN 1 END)::numeric / COUNT(dp.id) * 100) ELSE 0 END as completion_rate
        FROM profiles cp
        LEFT JOIN daily_progress dp ON dp.child_id = cp.id AND (dp.date::date) >= v_start_date AND (dp.date::date) <= v_end_date
        WHERE cp.family_id = f.id AND cp.role = 'child'
        GROUP BY cp.id, cp.display_name
      ) child_info) as children,
      (SELECT COUNT(*) FROM profiles cp WHERE cp.family_id = f.id AND cp.role = 'child') as child_count,
      COUNT(CASE WHEN dp.completed THEN 1 END) as completion_count,
      CASE WHEN COUNT(dp.id) > 0 THEN ROUND(COUNT(CASE WHEN dp.completed THEN 1 END)::numeric / COUNT(dp.id) * 100) ELSE 0 END as completion_rate,
      (SELECT json_agg(rr) FROM (
        SELECT json_build_object('title', sr.title, 'claimed_at', sr.claimed_at) as rr
        FROM store_rewards sr WHERE sr.family_id = f.id AND sr.claimed = true
        ORDER BY sr.claimed_at DESC LIMIT 5
      ) sub) as recent_rewards
    FROM families f
    JOIN profiles p ON p.family_id = f.id AND p.role = 'child'
    LEFT JOIN daily_progress dp ON dp.child_id = p.id AND (dp.date::date) >= v_start_date AND (dp.date::date) <= v_end_date
    WHERE (f.created_at::date) >= v_start_date AND (f.created_at::date) <= v_end_date
    GROUP BY f.id, f.name, f.short_code
    HAVING COUNT(CASE WHEN dp.completed THEN 1 END) > 0
    ORDER BY completion_rate DESC
    LIMIT 20
  ) sf;

  -- SCHOOL QUEST STATS
  SELECT json_build_object(
    'families_with_timetable', (SELECT COUNT(DISTINCT family_id) FROM timetables),
    'total_lesson_completions', (SELECT COUNT(*) FROM lesson_progress WHERE completed = true),
    'lesson_completions_7d', (SELECT COUNT(*) FROM lesson_progress WHERE completed = true AND (date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date),
    'children_with_quest_enabled', (SELECT COUNT(*) FROM profiles WHERE role = 'child' AND school_quest_enabled = true)
  ) INTO v_school_quest_stats;

  -- PWA STATS
  SELECT json_build_object(
    'total_impressions', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'impression'),
    'total_installs', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'install'),
    'installs_7d', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'install' AND created_at >= (NOW() - INTERVAL '7 days')),
    'impressions_7d', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'impression' AND created_at >= (NOW() - INTERVAL '7 days')),
    'dismiss_temporary', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'dismiss_temporary'),
    'dismiss_permanent', (SELECT COUNT(*) FROM pwa_events WHERE event_type = 'dismiss_permanent'),
    'by_os', (SELECT json_agg(os_data) FROM (SELECT os, COUNT(*) as count FROM pwa_events WHERE event_type = 'install' AND os IS NOT NULL GROUP BY os ORDER BY count DESC) os_data),
    'by_browser', (SELECT json_agg(browser_data) FROM (SELECT browser, COUNT(*) as count FROM pwa_events WHERE event_type = 'install' AND browser IS NOT NULL GROUP BY browser ORDER BY count DESC) browser_data)
  ) INTO v_pwa_stats;

  RETURN json_build_object(
    'funnel', json_build_object(
      'total_signups', v_total_signups,
      'activated_families', v_activated_families,
      'engaged_families', v_engaged_families,
      'active_families_7d', v_active_families_7d
    ),
    'red_flags', json_build_object(
      'stuck_onboarding', COALESCE(v_stuck_onboarding, '[]'::json),
      'churn_risk', v_churn_risk,
      'low_engagement', v_low_engagement
    ),
    'daily_trends', COALESCE(v_daily_trends, '[]'::json),
    'category_completions', COALESCE(v_category_completions, '[]'::json),
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
    'logins_24h', v_logins_24h,
    'shared_device_children', v_shared_device_children,
    'separate_device_children', v_separate_device_children,
    'marketing_consent_count', v_marketing_consent_count,
    'marketing_emails', to_json(COALESCE(v_marketing_emails, ARRAY[]::text[])),
    'recent_signups', COALESCE(v_recent_signups, '[]'::json),
    'weekly_trends', COALESCE(v_weekly_trends, '[]'::json),
    'star_families', COALESCE(v_star_families, '[]'::json),
    'school_quest_stats', v_school_quest_stats,
    'pwa_stats', v_pwa_stats
  );
END;
$$;
