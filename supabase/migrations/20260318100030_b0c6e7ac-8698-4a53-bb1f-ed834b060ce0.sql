
CREATE OR REPLACE FUNCTION public.get_admin_family_drilldown(p_family_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_children jsonb;
  v_tasks jsonb;
  v_rewards jsonb;
  v_timetables jsonb;
  v_tracking jsonb;
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

  -- Get tracking data: per-child stats for last 7 days
  SELECT COALESCE(jsonb_agg(child_tracking), '[]'::jsonb)
  INTO v_tracking
  FROM (
    SELECT jsonb_build_object(
      'child_id', p.id,
      'child_name', p.display_name,
      'total_completed_7d', COALESCE(stats.completed_count, 0),
      'total_potential_7d', COALESCE(stats.potential_count, 0),
      'completion_rate_7d', CASE 
        WHEN COALESCE(stats.potential_count, 0) > 0 
        THEN ROUND((COALESCE(stats.completed_count, 0)::numeric / stats.potential_count) * 100)
        ELSE 0 
      END,
      'total_completed_all', COALESCE(all_stats.all_completed, 0),
      'first_completion', all_stats.first_completed_at,
      'last_completion', all_stats.last_completed_at,
      'daily_breakdown', COALESCE(daily.breakdown, '[]'::jsonb),
      'category_breakdown', COALESCE(cats.breakdown, '[]'::jsonb),
      'streak_days', COALESCE(streak.current_streak, 0)
    ) as child_tracking
    FROM profiles p
    LEFT JOIN LATERAL (
      SELECT 
        COUNT(*) FILTER (WHERE dp.completed = true) as completed_count,
        COUNT(*) as potential_count
      FROM daily_progress dp
      WHERE dp.child_id = p.id 
        AND (dp.date::date) >= (CURRENT_DATE - INTERVAL '6 days')
    ) stats ON true
    LEFT JOIN LATERAL (
      SELECT 
        COUNT(*) FILTER (WHERE dp2.completed = true) as all_completed,
        MIN(dp2.completed_at) as first_completed_at,
        MAX(dp2.completed_at) as last_completed_at
      FROM daily_progress dp2
      WHERE dp2.child_id = p.id AND dp2.completed = true
    ) all_stats ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object('date', d.day_date, 'completed', d.day_completed, 'potential', d.day_potential)
        ORDER BY d.day_date
      ) as breakdown
      FROM (
        SELECT 
          dp3.date as day_date,
          COUNT(*) FILTER (WHERE dp3.completed = true) as day_completed,
          COUNT(*) as day_potential
        FROM daily_progress dp3
        WHERE dp3.child_id = p.id 
          AND (dp3.date::date) >= (CURRENT_DATE - INTERVAL '6 days')
        GROUP BY dp3.date
      ) d
    ) daily ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object('category', c.cat, 'completed', c.cat_completed)
        ORDER BY c.cat_completed DESC
      ) as breakdown
      FROM (
        SELECT 
          t.category as cat,
          COUNT(*) FILTER (WHERE dp4.completed = true) as cat_completed
        FROM daily_progress dp4
        JOIN tasks t ON t.id = dp4.task_id
        WHERE dp4.child_id = p.id 
          AND (dp4.date::date) >= (CURRENT_DATE - INTERVAL '6 days')
        GROUP BY t.category
      ) c
    ) cats ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(DISTINCT dp5.date)::integer as current_streak
      FROM daily_progress dp5
      WHERE dp5.child_id = p.id 
        AND dp5.completed = true
        AND (dp5.date::date) >= (CURRENT_DATE - INTERVAL '13 days')
        AND NOT EXISTS (
          SELECT 1 FROM daily_progress dp6
          WHERE dp6.child_id = p.id
            AND dp6.date = dp5.date
            AND dp6.completed = false
        )
    ) streak ON true
    WHERE p.family_id = p_family_id AND p.role = 'child'
  ) sub;

  -- Build result
  result := jsonb_build_object(
    'children', v_children,
    'tasks', v_tasks,
    'rewards', v_rewards,
    'timetables', v_timetables,
    'tracking', v_tracking
  );

  RETURN result;
END;
$function$;
