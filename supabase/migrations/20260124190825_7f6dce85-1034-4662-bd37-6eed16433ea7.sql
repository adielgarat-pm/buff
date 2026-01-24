-- Add short_code column to families table for easier sharing
ALTER TABLE public.families
ADD COLUMN short_code TEXT UNIQUE;

-- Create function to generate random 6-character alphanumeric code
CREATE OR REPLACE FUNCTION public.generate_family_short_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create trigger to auto-generate short_code on family creation
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
  -- Generate a unique short code
  LOOP
    new_code := generate_family_short_code();
    SELECT EXISTS(SELECT 1 FROM families WHERE short_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  NEW.short_code := new_code;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_family_short_code
BEFORE INSERT ON public.families
FOR EACH ROW
WHEN (NEW.short_code IS NULL)
EXECUTE FUNCTION public.set_family_short_code();

-- Backfill existing families with short codes
UPDATE public.families 
SET short_code = generate_family_short_code()
WHERE short_code IS NULL;

-- Make short_code NOT NULL after backfill
ALTER TABLE public.families
ALTER COLUMN short_code SET NOT NULL;

-- Create index for faster lookups by short_code
CREATE INDEX idx_families_short_code ON public.families(short_code);