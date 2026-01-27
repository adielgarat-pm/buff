-- Fix 1: Ensure the child onboarding trigger exists
-- The function exists but the trigger is missing

DROP TRIGGER IF EXISTS create_default_tasks_for_child_trigger ON public.profiles;

CREATE TRIGGER create_default_tasks_for_child_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_tasks_for_child();

-- Fix 2: The family INSERT is failing because users are authenticated 
-- but the RLS policy check happens BEFORE the trigger runs
-- The current policy "Users can create families" has: WITH CHECK (auth.uid() IS NOT NULL)
-- But the issue is that new Google OAuth users don't have a profile yet when creating a family
-- So the policy should work... but let's verify it's permissive

-- Drop and recreate the INSERT policy to be PERMISSIVE (the default)
DROP POLICY IF EXISTS "Users can create families" ON public.families;

CREATE POLICY "Users can create families" 
ON public.families 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- This allows any authenticated user to create a family
-- The trigger will handle setting the short_code