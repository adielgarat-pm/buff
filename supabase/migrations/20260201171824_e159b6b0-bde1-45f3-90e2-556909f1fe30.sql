-- Add BuffBoost tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS buff_boost_dismissed_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS buff_boost_supported boolean NOT NULL DEFAULT false;

-- Comments for clarity
COMMENT ON COLUMN public.profiles.buff_boost_dismissed_at IS 'When the user dismissed the BuffBoost prompt (null = never dismissed)';
COMMENT ON COLUMN public.profiles.buff_boost_supported IS 'Whether the user has clicked to support the community';