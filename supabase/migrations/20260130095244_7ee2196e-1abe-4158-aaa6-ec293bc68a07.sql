-- Update admin function to include credit balance and birth_date
CREATE OR REPLACE FUNCTION public.get_admin_family_drilldown(p_family_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_children jsonb;
  v_tasks jsonb;
  v_rewards jsonb;
  v_timetables jsonb;
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Get children with credit balance and birth_date
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'display_name', p.display_name,
      'daily_goal', p.daily_goal,
      'school_quest_enabled', p.school_quest_enabled,
      'bag_prep_enabled', p.bag_prep_enabled,
      'birth_date', p.birth_date,
      'credit_balance', COALESCE(cv.total_balance, 0)
    )
  ), '[]'::jsonb)
  INTO v_children
  FROM profiles p
  LEFT JOIN credit_vault cv ON cv.child_id = p.id
  WHERE p.family_id = p_family_id AND p.role = 'child';

  -- Get tasks
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'title', t.title,
      'category', t.category,
      'time', t.time,
      'credits', t.credits,
      'icon', t.icon,
      'assigned_to', t.assigned_to
    ) ORDER BY t.time
  ), '[]'::jsonb)
  INTO v_tasks
  FROM tasks t
  WHERE t.family_id = p_family_id;

  -- Get rewards
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'title', r.title,
      'emoji', r.emoji,
      'price', r.price,
      'claimed', r.claimed,
      'claimed_at', r.claimed_at,
      'assigned_to', r.assigned_to
    ) ORDER BY r.price
  ), '[]'::jsonb)
  INTO v_rewards
  FROM store_rewards r
  WHERE r.family_id = p_family_id;

  -- Get timetables
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', tt.id,
      'assigned_to', tt.assigned_to,
      'data', tt.data,
      'updated_at', tt.updated_at
    )
  ), '[]'::jsonb)
  INTO v_timetables
  FROM timetables tt
  WHERE tt.family_id = p_family_id;

  -- Build result
  result := jsonb_build_object(
    'children', v_children,
    'tasks', v_tasks,
    'rewards', v_rewards,
    'timetables', v_timetables
  );

  RETURN result;
END;
$$;