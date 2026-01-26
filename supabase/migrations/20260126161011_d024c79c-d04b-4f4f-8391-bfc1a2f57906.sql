-- =============================================
-- Create secure credit update function
-- =============================================

CREATE OR REPLACE FUNCTION public.update_child_credits(
  p_child_id UUID,
  p_credit_change INTEGER,
  p_is_completion BOOLEAN DEFAULT TRUE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_my_family_id UUID;
  v_my_role TEXT;
  v_my_profile_id UUID;
  v_child_family_id UUID;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_today TEXT;
  v_vault_id UUID;
BEGIN
  -- Get caller's info
  SELECT id, family_id, role INTO v_my_profile_id, v_my_family_id, v_my_role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_my_family_id IS NULL THEN
    RAISE EXCEPTION 'User has no family';
  END IF;

  -- Validate: either parent, or child updating their own vault
  IF v_my_role = 'child' AND v_my_profile_id != p_child_id THEN
    RAISE EXCEPTION 'Children can only update their own credits';
  END IF;

  -- Validate child belongs to same family
  SELECT family_id INTO v_child_family_id
  FROM public.profiles
  WHERE id = p_child_id;

  IF v_child_family_id IS NULL OR v_child_family_id != v_my_family_id THEN
    RAISE EXCEPTION 'Child not in your family';
  END IF;

  v_today := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD');

  -- Get current balance and vault id
  SELECT id, total_balance INTO v_vault_id, v_current_balance
  FROM public.credit_vault
  WHERE family_id = v_my_family_id AND child_id = p_child_id;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  -- Calculate new balance (never go negative)
  v_new_balance := GREATEST(0, v_current_balance + p_credit_change);

  -- Update or insert vault
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
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_child_credits TO authenticated;

-- =============================================
-- Fix Credit Vault RLS policies
-- =============================================

-- Drop ALL existing policies on credit_vault
DROP POLICY IF EXISTS "Users can manage their vault" ON public.credit_vault;
DROP POLICY IF EXISTS "Children can view their vault" ON public.credit_vault;
DROP POLICY IF EXISTS "Parents can view all family vaults" ON public.credit_vault;
DROP POLICY IF EXISTS "Parents can manage family vaults" ON public.credit_vault;
DROP POLICY IF EXISTS "Children can view own vault" ON public.credit_vault;

-- Parents can fully manage all family vaults
CREATE POLICY "Parents can manage family vaults"
ON public.credit_vault
FOR ALL
USING (
  family_id = get_my_family_id() 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'parent'
  )
);

-- Children can only VIEW their own vault
CREATE POLICY "Children can view own vault"
ON public.credit_vault
FOR SELECT
USING (
  family_id = get_my_family_id() 
  AND child_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);