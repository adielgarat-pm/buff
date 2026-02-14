-- Add child_preferences JSONB column to profiles for child autonomy settings
-- Stores: theme, pet_enabled, age_mode ('kid' | 'teen'), child_onboarding_completed
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS child_preferences jsonb DEFAULT '{"theme": "mint", "pet_enabled": true, "age_mode": "kid", "child_onboarding_completed": false}'::jsonb;