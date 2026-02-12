
-- Add is_pro boolean column with default false
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;

-- Add pro_settings JSONB column for themes, avatars, virtual pet data etc.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pro_settings jsonb DEFAULT '{}'::jsonb;
