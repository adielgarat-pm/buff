-- Re-create the trigger for generating family short codes
-- The trigger is missing which causes INSERT to fail because short_code is NOT NULL

-- First, ensure the function exists
CREATE OR REPLACE FUNCTION public.set_family_short_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Only generate if short_code is not provided
  IF NEW.short_code IS NULL OR NEW.short_code = '' THEN
    LOOP
      new_code := generate_family_short_code();
      SELECT EXISTS(SELECT 1 FROM families WHERE short_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.short_code := new_code;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_family_short_code_trigger ON public.families;

CREATE TRIGGER set_family_short_code_trigger
  BEFORE INSERT ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.set_family_short_code();