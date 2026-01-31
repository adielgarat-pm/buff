-- Allow parents to update child profiles in their family
CREATE POLICY "Parents can update child profiles in their family"
ON public.profiles
FOR UPDATE
USING (
  -- The profile being updated is a child with no user_id (placeholder profile)
  user_id IS NULL AND role = 'child' AND
  -- The current user is a parent in the same family
  EXISTS (
    SELECT 1 FROM public.profiles parent_profile
    WHERE parent_profile.user_id = auth.uid()
      AND parent_profile.role = 'parent'
      AND parent_profile.family_id = profiles.family_id
  )
)
WITH CHECK (
  -- Same check for the update
  user_id IS NULL AND role = 'child' AND
  EXISTS (
    SELECT 1 FROM public.profiles parent_profile
    WHERE parent_profile.user_id = auth.uid()
      AND parent_profile.role = 'parent'
      AND parent_profile.family_id = profiles.family_id
  )
);