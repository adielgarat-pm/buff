-- Add onboarding_step column to profiles table for progress tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_data jsonb DEFAULT '{}'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN public.profiles.onboarding_step IS 'Last completed onboarding step (0 = not started, 6 = complete)';
COMMENT ON COLUMN public.profiles.onboarding_data IS 'Partial onboarding data saved in real-time';