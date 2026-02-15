-- Change default language to English for new profiles and families
ALTER TABLE public.profiles ALTER COLUMN preferred_language SET DEFAULT 'en';
ALTER TABLE public.families ALTER COLUMN preferred_language SET DEFAULT 'en';