
-- Drop the old constraint that only allows one timetable per family
ALTER TABLE public.timetables DROP CONSTRAINT IF EXISTS timetables_family_id_key;

-- Create a new unique index that allows one timetable per child per family
CREATE UNIQUE INDEX IF NOT EXISTS timetables_family_child_unique ON public.timetables (family_id, COALESCE(assigned_to, '00000000-0000-0000-0000-000000000000'));
