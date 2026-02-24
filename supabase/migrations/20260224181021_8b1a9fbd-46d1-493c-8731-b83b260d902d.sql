
-- Drop the old date-parameter overload that conflicts with the text-parameter version
DROP FUNCTION IF EXISTS public.get_admin_app_pulse_v2(date, date, boolean);
