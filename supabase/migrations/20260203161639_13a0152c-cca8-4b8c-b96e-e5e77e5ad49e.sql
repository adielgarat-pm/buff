-- Add daily_win_reward field to profiles table for customizable "Daily Success" bonus
ALTER TABLE public.profiles 
ADD COLUMN daily_win_reward integer NOT NULL DEFAULT 20;

-- Add a constraint to ensure reasonable values (5-100)
ALTER TABLE public.profiles 
ADD CONSTRAINT check_daily_win_reward_range 
CHECK (daily_win_reward >= 5 AND daily_win_reward <= 100);