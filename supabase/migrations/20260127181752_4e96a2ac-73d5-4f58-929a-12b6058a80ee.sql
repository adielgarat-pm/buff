-- Admin Analytics RPC: Get comprehensive app pulse metrics
CREATE OR REPLACE FUNCTION public.get_admin_app_pulse()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_families INTEGER;
  v_total_profiles INTEGER;
  v_total_parents INTEGER;
  v_total_children INTEGER;
  v_active_children_7d INTEGER;
  v_total_tasks INTEGER;
  v_total_completions INTEGER;
  v_logins_24h INTEGER;
  v_shared_device_children INTEGER;
  v_separate_device_children INTEGER;
  v_recent_signups JSONB;
BEGIN
  -- Check admin role
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Total families
  SELECT COUNT(*) INTO v_total_families FROM public.families;

  -- Total profiles
  SELECT COUNT(*) INTO v_total_profiles FROM public.profiles;

  -- Total parents
  SELECT COUNT(*) INTO v_total_parents FROM public.profiles WHERE role = 'parent';

  -- Total children
  SELECT COUNT(*) INTO v_total_children FROM public.profiles WHERE role = 'child';

  -- Active children (completed at least one quest in last 7 days)
  SELECT COUNT(DISTINCT child_id) INTO v_active_children_7d
  FROM public.daily_progress
  WHERE completed = true
    AND completed_at >= NOW() - INTERVAL '7 days'
    AND child_id IS NOT NULL;

  -- Add lesson progress active children
  SELECT v_active_children_7d + COUNT(DISTINCT lp.child_id) INTO v_active_children_7d
  FROM public.lesson_progress lp
  WHERE lp.completed = true
    AND lp.completed_at >= NOW() - INTERVAL '7 days'
    AND lp.child_id IS NOT NULL
    AND lp.child_id NOT IN (
      SELECT DISTINCT dp.child_id 
      FROM public.daily_progress dp 
      WHERE dp.completed = true 
        AND dp.completed_at >= NOW() - INTERVAL '7 days'
        AND dp.child_id IS NOT NULL
    );

  -- Total tasks created
  SELECT COUNT(*) INTO v_total_tasks FROM public.tasks;

  -- Total completions (daily_progress + lesson_progress)
  SELECT 
    (SELECT COUNT(*) FROM public.daily_progress WHERE completed = true) +
    (SELECT COUNT(*) FROM public.lesson_progress WHERE completed = true)
  INTO v_total_completions;

  -- Logins in last 24 hours (from auth.users)
  SELECT COUNT(*) INTO v_logins_24h
  FROM auth.users
  WHERE last_sign_in_at >= NOW() - INTERVAL '24 hours';

  -- Shared device children (user_id is NULL)
  SELECT COUNT(*) INTO v_shared_device_children
  FROM public.profiles
  WHERE role = 'child' AND user_id IS NULL;

  -- Separate device children (user_id is NOT NULL)
  SELECT COUNT(*) INTO v_separate_device_children
  FROM public.profiles
  WHERE role = 'child' AND user_id IS NOT NULL;

  -- Recent 10 signups with onboarding status
  SELECT COALESCE(jsonb_agg(signup_data ORDER BY signup_data->>'created_at' DESC), '[]'::jsonb)
  INTO v_recent_signups
  FROM (
    SELECT jsonb_build_object(
      'user_id', u.id,
      'email', u.email,
      'created_at', u.created_at,
      'last_sign_in_at', u.last_sign_in_at,
      'has_profile', (p.id IS NOT NULL),
      'profile_role', p.role,
      'display_name', p.display_name,
      'has_family', (p.family_id IS NOT NULL)
    ) as signup_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    ORDER BY u.created_at DESC
    LIMIT 10
  ) sub;

  RETURN jsonb_build_object(
    'total_families', v_total_families,
    'total_profiles', v_total_profiles,
    'total_parents', v_total_parents,
    'total_children', v_total_children,
    'active_children_7d', v_active_children_7d,
    'total_tasks', v_total_tasks,
    'total_completions', v_total_completions,
    'logins_24h', v_logins_24h,
    'shared_device_children', v_shared_device_children,
    'separate_device_children', v_separate_device_children,
    'recent_signups', v_recent_signups
  );
END;
$$;