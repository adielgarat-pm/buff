-- Add school_quest_enabled column to profiles table for per-child configuration
ALTER TABLE public.profiles 
ADD COLUMN school_quest_enabled boolean NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.school_quest_enabled IS 'Whether the School Quest module is enabled for this child';