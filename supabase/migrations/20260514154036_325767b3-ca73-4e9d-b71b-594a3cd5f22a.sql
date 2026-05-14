
-- Revoke execute from anon on all public SECURITY DEFINER functions; grant to authenticated.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT 'public.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef=true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
  END LOOP;
END$$;

-- Tighten families INSERT: only allow creating a family for yourself when you don't have one yet
DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;
CREATE POLICY "Authenticated users can create their first family"
ON public.families FOR INSERT TO authenticated
WITH CHECK (public.get_my_family_id() IS NULL);

-- Tighten pwa_events INSERT: require authenticated caller
DROP POLICY IF EXISTS "Anyone can insert pwa events" ON public.pwa_events;
CREATE POLICY "Authenticated users can insert pwa events"
ON public.pwa_events FOR INSERT TO authenticated
WITH CHECK (true);
