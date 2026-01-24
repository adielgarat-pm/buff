-- Fix: create secure RPC for parents to update child settings (daily_goal / school_quest_enabled)

DROP FUNCTION IF EXISTS public.update_child_profile_settings(uuid, integer, boolean);

CREATE OR REPLACE FUNCTION public.update_child_profile_settings(
  p_child_id uuid,
  p_daily_goal integer DEFAULT NULL,
  p_school_quest_enabled boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_family_id uuid;
  v_my_role text;
  v_child_family_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT family_id, role
    INTO v_my_family_id, v_my_role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_my_family_id IS NULL THEN
    RAISE EXCEPTION 'No family';
  END IF;

  IF v_my_role IS DISTINCT FROM 'parent' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT family_id
    INTO v_child_family_id
  FROM public.profiles
  WHERE id = p_child_id
  LIMIT 1;

  IF v_child_family_id IS NULL OR v_child_family_id <> v_my_family_id THEN
    RAISE EXCEPTION 'Child not in your family';
  END IF;

  -- Server-side validation
  IF p_daily_goal IS NOT NULL AND (p_daily_goal < 10 OR p_daily_goal > 1000) THEN
    RAISE EXCEPTION 'Invalid daily goal';
  END IF;

  UPDATE public.profiles
  SET
    daily_goal = COALESCE(p_daily_goal, daily_goal),
    school_quest_enabled = COALESCE(p_school_quest_enabled, school_quest_enabled)
  WHERE id = p_child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_child_profile_settings(uuid, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_child_profile_settings(uuid, integer, boolean) TO authenticated;
