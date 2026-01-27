-- Clean up duplicate triggers

-- Remove old duplicate trigger on families (keep only set_family_short_code_trigger)
DROP TRIGGER IF EXISTS trigger_set_family_short_code ON public.families;

-- Remove old duplicate trigger on profiles (keep only create_default_tasks_for_child_trigger)
DROP TRIGGER IF EXISTS on_child_profile_created ON public.profiles;