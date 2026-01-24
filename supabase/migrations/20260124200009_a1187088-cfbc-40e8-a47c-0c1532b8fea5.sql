-- Fix linter WARN: Function Search Path Mutable
CREATE OR REPLACE FUNCTION public.generate_family_short_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
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

-- Fix linter WARN: RLS Policy Always True (families INSERT)
DROP POLICY IF EXISTS "Users can create families" ON public.families;
CREATE POLICY "Users can create families"
ON public.families
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
