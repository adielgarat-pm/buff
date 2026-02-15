
-- Add preferred_language to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'he';

-- Add a comment for clarity
COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred language (he or en)';
