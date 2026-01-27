-- Create a secure function to switch user's family and cleanup orphaned families
CREATE OR REPLACE FUNCTION public.switch_user_family(p_new_family_code TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_current_family_id UUID;
  v_new_family_id UUID;
  v_member_count INTEGER;
  v_profile_id UUID;
BEGIN
  -- Get the calling user's auth id
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'לא מחובר');
  END IF;

  -- Get user's current profile and family
  SELECT id, family_id INTO v_profile_id, v_current_family_id
  FROM public.profiles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'פרופיל לא נמצא');
  END IF;

  -- Look up the new family by short_code
  SELECT id INTO v_new_family_id
  FROM public.families
  WHERE short_code = UPPER(TRIM(p_new_family_code));

  IF v_new_family_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'קוד משפחה לא תקין');
  END IF;

  -- Don't allow switching to the same family
  IF v_new_family_id = v_current_family_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'אתה כבר חבר במשפחה הזו');
  END IF;

  -- Update user's profile to the new family
  UPDATE public.profiles
  SET family_id = v_new_family_id, updated_at = NOW()
  WHERE id = v_profile_id;

  -- Check if the old family has any remaining members
  IF v_current_family_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_member_count
    FROM public.profiles
    WHERE family_id = v_current_family_id;

    -- If no members left, clean up the orphaned family
    IF v_member_count = 0 THEN
      -- Delete app_settings for the old family
      DELETE FROM public.app_settings WHERE family_id = v_current_family_id;
      
      -- Delete credit_vault entries (no children linked)
      DELETE FROM public.credit_vault WHERE family_id = v_current_family_id;
      
      -- Delete store_rewards (no children linked)
      DELETE FROM public.store_rewards WHERE family_id = v_current_family_id;
      
      -- Delete tasks (no children linked)
      DELETE FROM public.tasks WHERE family_id = v_current_family_id;
      
      -- Delete timetables (no children linked)
      DELETE FROM public.timetables WHERE family_id = v_current_family_id;
      
      -- Delete daily_progress (no children linked)
      DELETE FROM public.daily_progress WHERE family_id = v_current_family_id;
      
      -- Delete lesson_progress (no children linked)
      DELETE FROM public.lesson_progress WHERE family_id = v_current_family_id;
      
      -- Finally delete the family itself
      DELETE FROM public.families WHERE id = v_current_family_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'new_family_id', v_new_family_id);
END;
$function$;