-- Re-create missing triggers required for registration flows

-- 1) Ensure families.short_code is auto-generated on insert
DROP TRIGGER IF EXISTS set_family_short_code_trigger ON public.families;
CREATE TRIGGER set_family_short_code_trigger
BEFORE INSERT ON public.families
FOR EACH ROW
EXECUTE FUNCTION public.set_family_short_code();

-- 2) Auto-seed child defaults (tasks, rewards, vault) when a child profile is created
DROP TRIGGER IF EXISTS create_default_tasks_for_child_trigger ON public.profiles;
CREATE TRIGGER create_default_tasks_for_child_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_default_tasks_for_child();
