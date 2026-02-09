-- Drop and recreate the function with reward price update logic
CREATE OR REPLACE FUNCTION public.update_child_profile_settings(
  p_child_id uuid,
  p_daily_goal integer DEFAULT NULL,
  p_school_quest_enabled boolean DEFAULT NULL,
  p_birth_date date DEFAULT NULL,
  p_avatar text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_my_family_id uuid;
  v_my_role text;
  v_child_family_id uuid;
  v_old_daily_goal integer;
  v_smart_goal integer;
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

  SELECT family_id, daily_goal
    INTO v_child_family_id, v_old_daily_goal
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

  IF p_birth_date IS NOT NULL THEN
    IF p_birth_date > CURRENT_DATE THEN
      RAISE EXCEPTION 'Invalid birth date';
    END IF;
    IF p_birth_date < DATE '2000-01-01' THEN
      RAISE EXCEPTION 'Invalid birth date';
    END IF;
  END IF;

  -- Validate avatar (simple check - should be a short string)
  IF p_avatar IS NOT NULL AND LENGTH(p_avatar) > 20 THEN
    RAISE EXCEPTION 'Invalid avatar';
  END IF;

  -- Update the child profile
  UPDATE public.profiles
  SET
    daily_goal = COALESCE(p_daily_goal, daily_goal),
    school_quest_enabled = COALESCE(p_school_quest_enabled, school_quest_enabled),
    birth_date = COALESCE(p_birth_date, birth_date),
    avatar = COALESCE(p_avatar, avatar),
    updated_at = NOW()
  WHERE id = p_child_id;

  -- If daily goal changed, update reward prices proportionally
  -- Logic: Rewards are priced based on 70% of daily goal × day tiers (1, 2, 4, 5, 10)
  IF p_daily_goal IS NOT NULL AND p_daily_goal <> v_old_daily_goal AND v_old_daily_goal > 0 THEN
    v_smart_goal := ROUND((p_daily_goal * 70) / 100);
    
    -- Update all unclaimed rewards for this child proportionally
    -- Calculate new price based on the ratio of new/old goals
    UPDATE public.store_rewards
    SET price = GREATEST(
      v_smart_goal,
      ROUND((price::numeric / (v_old_daily_goal * 0.7)) * (p_daily_goal * 0.7))::integer
    )
    WHERE assigned_to = p_child_id
      AND claimed = false
      AND family_id = v_my_family_id;
  END IF;
END;
$$;