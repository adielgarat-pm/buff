-- Set REPLICA IDENTITY FULL so the 'old' row is available in realtime payloads
-- This is critical for detecting claimed: false -> true transitions
ALTER TABLE public.store_rewards REPLICA IDENTITY FULL;
ALTER TABLE public.daily_progress REPLICA IDENTITY FULL;