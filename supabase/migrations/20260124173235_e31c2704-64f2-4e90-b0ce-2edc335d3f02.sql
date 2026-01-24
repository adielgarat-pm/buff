-- Add daily_goal column to profiles table for per-child goals
ALTER TABLE public.profiles 
ADD COLUMN daily_goal integer NOT NULL DEFAULT 100;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.daily_goal IS 'Individual daily credit goal for each child';