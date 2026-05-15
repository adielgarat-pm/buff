-- Replace the profiles INSERT policy to prevent role escalation via duplicate parent profile
DROP POLICY IF EXISTS "Users can insert their profile" ON public.profiles;

CREATE POLICY "Users can insert their profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Case 1: Inserting own profile (onboarding) — only if no profile exists yet for this user
  (
    user_id = auth.uid()
    AND role IN ('parent', 'child')
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  )
  OR
  -- Case 2: Parent creating a shared-device child profile in their own family
  (
    user_id IS NULL
    AND role = 'child'
    AND family_id = public.get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'parent'
    )
  )
);