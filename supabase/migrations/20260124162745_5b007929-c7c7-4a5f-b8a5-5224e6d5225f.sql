-- Allow authenticated users to create families (for parent signup)
CREATE POLICY "Users can create families"
ON public.families
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow parents to update their family name
CREATE POLICY "Parents can update their family"
ON public.families
FOR UPDATE
TO authenticated
USING (id = get_my_family_id())
WITH CHECK (id = get_my_family_id());