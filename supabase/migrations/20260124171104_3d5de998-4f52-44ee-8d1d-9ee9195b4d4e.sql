-- Drop the existing restrictive policies and create permissive ones
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view family members via function" ON public.profiles;

-- Create a single permissive SELECT policy that allows viewing own profile OR family members
CREATE POLICY "Users can view own and family profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR family_id = get_my_family_id()
);