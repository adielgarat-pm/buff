-- Update the default app title from 'Daily Quests' to 'Buff'
ALTER TABLE public.app_settings 
ALTER COLUMN app_title SET DEFAULT 'Buff';