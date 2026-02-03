-- Create a secure function to delete a child and all related data
CREATE OR REPLACE FUNCTION public.delete_child_profile(p_child_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_family_id UUID;
  v_my_role TEXT;
  v_child_family_id UUID;
  v_child_name TEXT;
BEGIN
  -- Get caller's info
  SELECT family_id, role INTO v_my_family_id, v_my_role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_my_family_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'לא מחובר למשפחה');
  END IF;

  -- Only parents can delete children
  IF v_my_role != 'parent' THEN
    RETURN jsonb_build_object('success', false, 'error', 'רק הורים יכולים למחוק ילדים');
  END IF;

  -- Get child's family and validate
  SELECT family_id, display_name INTO v_child_family_id, v_child_name
  FROM public.profiles
  WHERE id = p_child_id AND role = 'child';

  IF v_child_family_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'הילד לא נמצא');
  END IF;

  IF v_child_family_id != v_my_family_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'הילד לא שייך למשפחה שלך');
  END IF;

  -- Delete all related data in order (respecting foreign keys)
  
  -- 1. Delete daily progress
  DELETE FROM public.daily_progress WHERE child_id = p_child_id;
  
  -- 2. Delete lesson progress
  DELETE FROM public.lesson_progress WHERE child_id = p_child_id;
  
  -- 3. Delete lesson reflections
  DELETE FROM public.lesson_reflections WHERE child_id = p_child_id;
  
  -- 4. Delete credit vault
  DELETE FROM public.credit_vault WHERE child_id = p_child_id;
  
  -- 5. Delete store rewards assigned to child
  DELETE FROM public.store_rewards WHERE assigned_to = p_child_id;
  
  -- 6. Delete tasks assigned to child
  DELETE FROM public.tasks WHERE assigned_to = p_child_id;
  
  -- 7. Delete timetables assigned to child
  DELETE FROM public.timetables WHERE assigned_to = p_child_id;
  
  -- 8. Finally delete the child profile
  DELETE FROM public.profiles WHERE id = p_child_id;

  RETURN jsonb_build_object('success', true, 'deleted_name', v_child_name);
END;
$$;