-- Add friday_enabled setting to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN friday_enabled boolean NOT NULL DEFAULT false;