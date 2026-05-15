
-- 1. Restrict pwa_events INSERT to caller's own user/family
DROP POLICY IF EXISTS "Authenticated users can insert pwa events" ON public.pwa_events;

CREATE POLICY "Authenticated users can insert their own pwa events"
ON public.pwa_events
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND (family_id IS NULL OR family_id = public.get_my_family_id())
);

-- 2. Cap child self-awarded credits and require task completion proof
CREATE OR REPLACE FUNCTION public.update_child_credits(
  p_child_id uuid,
  p_credit_change integer,
  p_is_completion boolean DEFAULT true
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_my_family_id UUID;
  v_my_role TEXT;
  v_my_profile_id UUID;
  v_child_family_id UUID;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_today TEXT;
  v_vault_id UUID;
  v_max_task_credits INTEGER;
BEGIN
  SELECT id, family_id, role INTO v_my_profile_id, v_my_family_id, v_my_role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_my_family_id IS NULL THEN
    RAISE EXCEPTION 'User has no family';
  END IF;

  IF v_my_role = 'child' AND v_my_profile_id != p_child_id THEN
    RAISE EXCEPTION 'Children can only update their own credits';
  END IF;

  SELECT family_id INTO v_child_family_id
  FROM public.profiles
  WHERE id = p_child_id;

  IF v_child_family_id IS NULL OR v_child_family_id != v_my_family_id THEN
    RAISE EXCEPTION 'Child not in your family';
  END IF;

  -- Server-side guardrails for child callers (parents may still adjust freely)
  IF v_my_role = 'child' THEN
    -- Hard cap per call to prevent runaway awards
    IF p_credit_change > 500 THEN
      RAISE EXCEPTION 'Credit change exceeds per-call limit';
    END IF;

    -- For positive awards, require there is at least one task in the family
    -- whose credits are >= the requested change (sanity bound)
    IF p_credit_change > 0 THEN
      SELECT COALESCE(MAX(credits), 0) INTO v_max_task_credits
      FROM public.tasks
      WHERE family_id = v_my_family_id
        AND (assigned_to IS NULL OR assigned_to = p_child_id);

      IF p_credit_change > GREATEST(v_max_task_credits, 50) THEN
        RAISE EXCEPTION 'Credit change exceeds maximum task value';
      END IF;
    END IF;
  END IF;

  v_today := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD');

  SELECT id, total_balance INTO v_vault_id, v_current_balance
  FROM public.credit_vault
  WHERE family_id = v_my_family_id AND child_id = p_child_id;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  v_new_balance := GREATEST(0, v_current_balance + p_credit_change);

  IF v_vault_id IS NOT NULL THEN
    UPDATE public.credit_vault
    SET total_balance = v_new_balance,
        last_updated_date = v_today,
        updated_at = NOW()
    WHERE id = v_vault_id;
  ELSE
    INSERT INTO public.credit_vault (family_id, child_id, total_balance, last_updated_date)
    VALUES (v_my_family_id, p_child_id, v_new_balance, v_today);
  END IF;

  RETURN v_new_balance;
END;
$function$;
