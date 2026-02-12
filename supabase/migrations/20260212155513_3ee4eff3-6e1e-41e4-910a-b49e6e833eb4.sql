
-- Add is_lifetime_access boolean column with default false
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_lifetime_access boolean NOT NULL DEFAULT false;
