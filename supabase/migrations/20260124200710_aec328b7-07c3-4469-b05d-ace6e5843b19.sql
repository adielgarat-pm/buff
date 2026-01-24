
-- Drop the old constraint that only allows one credit vault per family
ALTER TABLE public.credit_vault DROP CONSTRAINT IF EXISTS credit_vault_family_id_key;

-- Create a new unique index that allows one credit vault per child per family
CREATE UNIQUE INDEX IF NOT EXISTS credit_vault_family_child_unique ON public.credit_vault (family_id, COALESCE(child_id, '00000000-0000-0000-0000-000000000000'));
