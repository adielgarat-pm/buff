-- Enhanced Admin Analytics Function with Weekly Trends, Family Styles, and Star Families
-- Drop and recreate the function with enhanced analytics

CREATE OR REPLACE FUNCTION public.get_admin_app_pulse()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
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
  v_recent_signups JSON;
  v_today TEXT;
  v_weekly_trends JSON;
  v_star_families JSON;
  v_school_quest_stats JSON;
BEGIN
  -- Get today's date as text (matching the date format in daily_progress)
  v_today := to_char(NOW(), 'YYYY-MM-DD');

  -- Total families
  SELECT COUNT(*) INTO v_total_families FROM public.families;

  -- Families without children
  SELECT COUNT(*) INTO v_families_without_children
  FROM public.families f
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.family_id = f.id AND p.role = 'child'
  );

  -- Total profiles
  SELECT COUNT(*) INTO v_total_profiles FROM public.profiles;

  -- Total parents
  SELECT COUNT(*) INTO v_total_parents FROM public.profiles WHERE role = 'parent';

  -- Total children
  SELECT COUNT(*) INTO v_total_children FROM public.profiles WHERE role = 'child';

  -- Active children in last 7 days (at least one completion)
  SELECT COUNT(DISTINCT dp.child_id) INTO v_active_children_7d
    FROM public.daily_progress dp
    WHERE dp.completed = true
      AND dp.completed_at >= NOW() - INTERVAL '7 days'
      AND dp.child_id IS NOT NULL;

  -- Total tasks created
  SELECT COUNT(*) INTO v_total_tasks FROM public.tasks;

  -- Total completions (all time)
  SELECT 
    (SELECT COUNT(*) FROM public.daily_progress WHERE completed = true) +
    (SELECT COUNT(*) FROM public.lesson_progress WHERE completed = true)
  INTO v_total_completions;

  -- Completions TODAY
  SELECT COUNT(*) INTO v_completions_today 
  FROM public.daily_progress 
  WHERE completed = true AND date = v_today;

  -- Completions in last 7 days
  SELECT COUNT(*) INTO v_completions_7d 
  FROM public.daily_progress 
  WHERE completed = true 
    AND date >= to_char(NOW() - INTERVAL '7 days', 'YYYY-MM-DD');

  -- Potential completions TODAY (tasks × active children)
  SELECT COALESCE(
    (SELECT COUNT(*) FROM public.tasks) * GREATEST(v_total_children, 1),
    0
  ) INTO v_potential_today;

  -- Potential completions 7 days (tasks × children × 7)
  v_potential_7d := v_potential_today * 7;

  -- Logins in last 24 hours (from auth.users)
  SELECT COUNT(*) INTO v_logins_24h
    FROM auth.users
    WHERE last_sign_in_at >= NOW() - INTERVAL '24 hours';

  -- Shared device children (no user_id)
  SELECT COUNT(*) INTO v_shared_device_children
    FROM public.profiles
    WHERE role = 'child' AND user_id IS NULL;

  -- Separate device children (have user_id)
  SELECT COUNT(*) INTO v_separate_device_children
    FROM public.profiles
    WHERE role = 'child' AND user_id IS NOT NULL;

  -- Recent signups (last 10 from auth.users with profile status)
  SELECT COALESCE(json_agg(signup_data ORDER BY signup_data.created_at DESC), '[]'::json)
  INTO v_recent_signups
  FROM (
    SELECT 
      u.id::text as user_id,
      u.email,
      u.created_at::text,
      u.last_sign_in_at::text,
      CASE WHEN p.id IS NOT NULL THEN true ELSE false END as has_profile,
      p.role as profile_role,
      p.display_name,
      CASE WHEN p.family_id IS NOT NULL THEN true ELSE false END as has_family
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    ORDER BY u.created_at DESC
    LIMIT 10
  ) signup_data;

  -- Weekly completion trends (last 30 days by week)
  SELECT COALESCE(json_agg(trend_data ORDER BY trend_data.week_start), '[]'::json)
  INTO v_weekly_trends
  FROM (
    SELECT 
      date_trunc('week', dp.completed_at)::date::text as week_start,
      COUNT(*) as completions,
      COUNT(DISTINCT dp.child_id) as active_children
    FROM public.daily_progress dp
    WHERE dp.completed = true
      AND dp.completed_at >= NOW() - INTERVAL '30 days'
    GROUP BY date_trunc('week', dp.completed_at)
    ORDER BY week_start
  ) trend_data;

  -- Star families (top 10 by engagement)
  SELECT COALESCE(json_agg(star_data ORDER BY star_data.completion_count DESC), '[]'::json)
  INTO v_star_families
  FROM (
    SELECT 
      f.id::text as family_id,
      f.name as family_name,
      f.short_code as family_code,
      COUNT(DISTINCT CASE WHEN p.role = 'child' THEN p.id END) as child_count,
      COUNT(dp.id) as completion_count,
      ROUND(
        CASE 
          WHEN COUNT(t.id) * GREATEST(COUNT(DISTINCT CASE WHEN p.role = 'child' THEN p.id END), 1) > 0 
          THEN (COUNT(CASE WHEN dp.completed THEN 1 END)::numeric / 
                (COUNT(t.id) * GREATEST(COUNT(DISTINCT CASE WHEN p.role = 'child' THEN p.id END), 1) * 7)::numeric) * 100
          ELSE 0
        END
      , 0) as completion_rate,
      (
        SELECT COALESCE(json_agg(json_build_object('title', sr.title, 'claimed_at', sr.claimed_at)), '[]'::json)
        FROM public.store_rewards sr
        WHERE sr.family_id = f.id AND sr.claimed = true
        ORDER BY sr.claimed_at DESC
        LIMIT 3
      ) as recent_rewards
    FROM public.families f
    LEFT JOIN public.profiles p ON p.family_id = f.id
    LEFT JOIN public.tasks t ON t.family_id = f.id
    LEFT JOIN public.daily_progress dp ON dp.family_id = f.id 
      AND dp.completed_at >= NOW() - INTERVAL '7 days'
    GROUP BY f.id, f.name, f.short_code
    HAVING COUNT(DISTINCT CASE WHEN p.role = 'child' THEN p.id END) > 0
    ORDER BY completion_count DESC
    LIMIT 10
  ) star_data;

  -- School Quest stats
  SELECT json_build_object(
    'families_with_timetable', (SELECT COUNT(DISTINCT family_id) FROM public.timetables WHERE data != '{}'::jsonb),
    'total_lesson_completions', (SELECT COUNT(*) FROM public.lesson_progress WHERE completed = true),
    'lesson_completions_7d', (SELECT COUNT(*) FROM public.lesson_progress WHERE completed = true AND completed_at >= NOW() - INTERVAL '7 days'),
    'children_with_quest_enabled', (SELECT COUNT(*) FROM public.profiles WHERE role = 'child' AND school_quest_enabled = true)
  ) INTO v_school_quest_stats;

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