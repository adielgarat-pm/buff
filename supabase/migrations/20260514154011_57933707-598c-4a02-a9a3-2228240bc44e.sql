
-- Fix 1: profiles SELECT - restrict to own family or admin
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view family profiles"
ON public.profiles FOR SELECT TO authenticated
USING (family_id = public.get_my_family_id() OR public.has_role(auth.uid(), 'admin'));

-- Fix 2: profiles UPDATE - prevent role escalation
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1)
  AND (is_pro IS NOT DISTINCT FROM (SELECT p.is_pro FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1))
  AND (is_lifetime_access IS NOT DISTINCT FROM (SELECT p.is_lifetime_access FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1))
);

-- Fix 3: families SELECT - restrict to own family or admin
DROP POLICY IF EXISTS "Authenticated users can view families" ON public.families;
CREATE POLICY "Users can view their own family"
ON public.families FOR SELECT TO authenticated
USING (id = public.get_my_family_id() OR public.has_role(auth.uid(), 'admin'));

-- Fix 4: families UPDATE - restrict to parent of that family
DROP POLICY IF EXISTS "Authenticated users can update families" ON public.families;
CREATE POLICY "Parents can update their family"
ON public.families FOR UPDATE TO authenticated
USING (
  id = public.get_my_family_id()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
)
WITH CHECK (id = public.get_my_family_id());

-- Fix 5: email_logs INSERT - drop overly-permissive policy.
-- Service role used by edge functions bypasses RLS, so no policy is needed for inserts.
DROP POLICY IF EXISTS "Service can insert email logs" ON public.email_logs;

-- Fix 6: Restrict EXECUTE on SECURITY DEFINER helpers to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_my_family_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_family_id() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
