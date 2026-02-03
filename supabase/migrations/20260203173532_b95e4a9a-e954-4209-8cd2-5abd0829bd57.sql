-- Add avatar column to profiles table for child emoji avatars
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '🚀';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.avatar IS 'Emoji avatar for child profiles';