-- Drop existing RESTRICTIVE policies on families table
DROP POLICY IF EXISTS "Users can create families" ON public.families;
DROP POLICY IF EXISTS "Users can view their family" ON public.families;
DROP POLICY IF EXISTS "Parents can update their family" ON public.families;

-- Create PERMISSIVE policies (default behavior, allows access)
-- INSERT: Any authenticated user can create a family
CREATE POLICY "Users can create families"
ON public.families
FOR INSERT
TO authenticated
WITH CHECK (true);

-- SELECT: Users can view their own family (linked via profiles)
CREATE POLICY "Users can view their family"
ON public.families
FOR SELECT
TO authenticated
USING (id = get_my_family_id());

-- UPDATE: Users can update their own family
CREATE POLICY "Users can update their family"
ON public.families
FOR UPDATE
TO authenticated
USING (id = get_my_family_id())
WITH CHECK (id = get_my_family_id());

-- Also ensure profiles UPDATE policy allows setting family_id
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());