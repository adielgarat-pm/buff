CREATE OR REPLACE FUNCTION public.get_admin_app_pulse()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_families INT;
  v_families_without_children INT;
  v_total_profiles INT;
  v_total_parents INT;
  v_total_children INT;
  v_active_children_7d INT;
  v_total_tasks INT;
  v_total_completions INT;
  v_completions_today INT;
  v_completions_7d INT;
  v_potential_today INT;
  v_potential_7d INT;
  v_logins_24h INT;
  v_shared_device_children INT;
  v_separate_device_children INT;
  v_recent_signups JSONB;
  v_weekly_trends JSONB;
  v_star_families JSONB;
  v_school_quest_stats JSONB;
BEGIN
  -- Check if user has admin role
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Basic counts
  SELECT COUNT(*) INTO v_total_families FROM families;

  -- Families without children
  SELECT COUNT(*) INTO v_families_without_children
  FROM families f
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.family_id = f.id 
    AND p.role = 'child'
  );

  SELECT COUNT(*) INTO v_total_profiles FROM profiles;
  SELECT COUNT(*) INTO v_total_parents FROM profiles WHERE role = 'parent';
  SELECT COUNT(*) INTO v_total_children FROM profiles WHERE role = 'child';

  -- Active children in last 7 days
  SELECT COUNT(DISTINCT dp.child_id) INTO v_active_children_7d
  FROM daily_progress dp
  WHERE dp.completed = true
    AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date;

  SELECT COUNT(*) INTO v_total_tasks FROM tasks;
  SELECT COUNT(*) INTO v_total_completions FROM daily_progress WHERE completed = true;

  -- Completions today
  SELECT COUNT(*) INTO v_completions_today
  FROM daily_progress
  WHERE completed = true
    AND (date::date) = CURRENT_DATE;

  -- Completions last 7 days
  SELECT COUNT(*) INTO v_completions_7d
  FROM daily_progress
  WHERE completed = true
    AND (date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date;

  -- Potential completions
  SELECT COUNT(*) INTO v_potential_today
  FROM daily_progress
  WHERE (date::date) = CURRENT_DATE;

  SELECT COUNT(*) INTO v_potential_7d
  FROM daily_progress
  WHERE (date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date;

  -- Logins in last 24h (placeholder)
  v_logins_24h := 0;

  -- Device configuration
  SELECT COUNT(*) INTO v_shared_device_children
  FROM profiles WHERE role = 'child' AND user_id IS NULL;

  SELECT COUNT(*) INTO v_separate_device_children
  FROM profiles WHERE role = 'child' AND user_id IS NOT NULL;

  -- Recent signups with profile status
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'user_id', u.id,
      'email', u.email,
      'created_at', u.created_at,
      'last_sign_in_at', u.last_sign_in_at,
      'has_profile', (p.id IS NOT NULL),
      'profile_role', p.role,
      'display_name', p.display_name,
      'has_family', (p.family_id IS NOT NULL)
    ) ORDER BY u.created_at DESC
  ), '[]'::jsonb) INTO v_recent_signups
  FROM auth.users u
  LEFT JOIN profiles p ON p.user_id = u.id
  WHERE u.created_at >= NOW() - INTERVAL '7 days'
  LIMIT 20;

  -- Weekly trends (last 4 weeks)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'week_start', week_data.week_start,
      'completions', week_data.completions,
      'active_children', week_data.active_children
    ) ORDER BY week_data.week_start
  ), '[]'::jsonb) INTO v_weekly_trends
  FROM (
    SELECT 
      date_trunc('week', (dp.date::date))::date as week_start,
      COUNT(*) FILTER (WHERE dp.completed = true) as completions,
      COUNT(DISTINCT dp.child_id) FILTER (WHERE dp.completed = true) as active_children
    FROM daily_progress dp
    WHERE (dp.date::date) >= (CURRENT_DATE - INTERVAL '28 days')::date
    GROUP BY date_trunc('week', (dp.date::date))
  ) week_data;

  -- Star families with parent email (top 10 by completion count)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'family_id', star_data.family_id,
      'family_name', star_data.family_name,
      'family_code', star_data.family_code,
      'parent_email', star_data.parent_email,
      'child_count', star_data.child_count,
      'completion_count', star_data.completion_count,
      'completion_rate', star_data.completion_rate,
      'recent_rewards', COALESCE(star_data.recent_rewards_json, '[]'::jsonb)
    ) ORDER BY star_data.completion_count DESC
  ), '[]'::jsonb) INTO v_star_families
  FROM (
    SELECT 
      f.id as family_id,
      f.name as family_name,
      f.short_code as family_code,
      (
        SELECT u.email 
        FROM profiles pp 
        JOIN auth.users u ON u.id = pp.user_id
        WHERE pp.family_id = f.id AND pp.role = 'parent'
        LIMIT 1
      ) as parent_email,
      (SELECT COUNT(*) FROM profiles p WHERE p.family_id = f.id AND p.role = 'child') as child_count,
      (SELECT COUNT(*) FROM daily_progress dp WHERE dp.family_id = f.id AND dp.completed = true AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date) as completion_count,
      CASE 
        WHEN (SELECT COUNT(*) FROM daily_progress dp WHERE dp.family_id = f.id AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date) > 0 
        THEN ROUND(((SELECT COUNT(*) FROM daily_progress dp WHERE dp.family_id = f.id AND dp.completed = true AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date)::NUMERIC / 
                    (SELECT COUNT(*) FROM daily_progress dp WHERE dp.family_id = f.id AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date)) * 100)
        ELSE 0 
      END as completion_rate,
      (
        SELECT jsonb_agg(jsonb_build_object('title', sr.title, 'claimed_at', sr.claimed_at))
        FROM (
          SELECT title, claimed_at 
          FROM store_rewards 
          WHERE family_id = f.id AND claimed = true
          ORDER BY claimed_at DESC
          LIMIT 3
        ) sr
      ) as recent_rewards_json
    FROM families f
    ORDER BY (SELECT COUNT(*) FROM daily_progress dp WHERE dp.family_id = f.id AND dp.completed = true AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date) DESC
    LIMIT 10
  ) star_data;

  -- School Quest stats
  SELECT jsonb_build_object(
    'families_with_timetable', (SELECT COUNT(DISTINCT family_id) FROM timetables),
    'total_lesson_completions', (SELECT COUNT(*) FROM lesson_progress WHERE completed = true),
    'lesson_completions_7d', (SELECT COUNT(*) FROM lesson_progress WHERE completed = true AND (date::date) >= (CURRENT_DATE - INTERVAL '7 days')::date),
    'children_with_quest_enabled', (SELECT COUNT(*) FROM profiles WHERE role = 'child' AND school_quest_enabled = true)
  ) INTO v_school_quest_stats;

  RETURN jsonb_build_object(
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
    'recent_signups', v_recent_signups,
    'weekly_trends', v_weekly_trends,
    'star_families', v_star_families,
    'school_quest_stats', v_school_quest_stats
  );
END;
$function$;