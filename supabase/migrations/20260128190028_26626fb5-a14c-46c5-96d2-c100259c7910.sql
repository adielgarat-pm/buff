-- Add bag prep settings to profiles table (per-child settings)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bag_prep_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS bag_prep_credits integer NOT NULL DEFAULT 20;

-- Add bag prep completion tracking to daily_progress
-- We'll use a special task_id convention: 'bag_prep_<child_id>_<date>'
-- No schema change needed since we use existing daily_progress table