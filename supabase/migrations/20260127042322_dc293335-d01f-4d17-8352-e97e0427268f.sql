-- Create the missing trigger that auto-generates family short codes
CREATE TRIGGER set_family_short_code_trigger
  BEFORE INSERT ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.set_family_short_code();