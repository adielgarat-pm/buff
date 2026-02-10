-- Drop the old 4-parameter overload that's causing ambiguity
DROP FUNCTION IF EXISTS public.update_child_profile_settings(uuid, integer, boolean, date);
