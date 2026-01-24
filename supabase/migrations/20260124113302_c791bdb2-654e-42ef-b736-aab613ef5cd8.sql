-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view family members" ON public.profiles;

-- Create a non-recursive policy using auth.uid() directly
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

-- Create a function to safely get family_id without recursion
CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Create policy to view family members using the function
CREATE POLICY "Users can view family members via function"
ON public.profiles
FOR SELECT
USING (family_id = public.get_my_family_id());

-- Update other tables to use the function instead of subqueries
-- Fix tasks policies
DROP POLICY IF EXISTS "Users can view family tasks" ON public.tasks;
CREATE POLICY "Users can view family tasks"
ON public.tasks
FOR SELECT
USING (family_id = public.get_my_family_id());

DROP POLICY IF EXISTS "Parents can manage tasks" ON public.tasks;
CREATE POLICY "Parents can manage tasks"
ON public.tasks
FOR ALL
USING (
  family_id = public.get_my_family_id() 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
);

-- Fix app_settings policies
DROP POLICY IF EXISTS "Users can view family settings" ON public.app_settings;
CREATE POLICY "Users can view family settings"
ON public.app_settings
FOR SELECT
USING (family_id = public.get_my_family_id());

DROP POLICY IF EXISTS "Parents can manage settings" ON public.app_settings;
CREATE POLICY "Parents can manage settings"
ON public.app_settings
FOR ALL
USING (
  family_id = public.get_my_family_id()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
);

-- Fix credit_vault policies
DROP POLICY IF EXISTS "Users can view family vault" ON public.credit_vault;
DROP POLICY IF EXISTS "Users can manage family vault" ON public.credit_vault;
CREATE POLICY "Users can view family vault"
ON public.credit_vault
FOR SELECT
USING (family_id = public.get_my_family_id());

CREATE POLICY "Users can manage family vault"
ON public.credit_vault
FOR ALL
USING (family_id = public.get_my_family_id());

-- Fix daily_progress policies
DROP POLICY IF EXISTS "Users can view family progress" ON public.daily_progress;
DROP POLICY IF EXISTS "Users can manage family progress" ON public.daily_progress;
CREATE POLICY "Users can view family progress"
ON public.daily_progress
FOR SELECT
USING (family_id = public.get_my_family_id());

CREATE POLICY "Users can manage family progress"
ON public.daily_progress
FOR ALL
USING (family_id = public.get_my_family_id());

-- Fix lesson_progress policies
DROP POLICY IF EXISTS "Users can view lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can manage lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can view lesson progress"
ON public.lesson_progress
FOR SELECT
USING (family_id = public.get_my_family_id());

CREATE POLICY "Users can manage lesson progress"
ON public.lesson_progress
FOR ALL
USING (family_id = public.get_my_family_id());

-- Fix store_rewards policies
DROP POLICY IF EXISTS "Users can view family rewards" ON public.store_rewards;
DROP POLICY IF EXISTS "Users can manage family rewards" ON public.store_rewards;
CREATE POLICY "Users can view family rewards"
ON public.store_rewards
FOR SELECT
USING (family_id = public.get_my_family_id());

CREATE POLICY "Users can manage family rewards"
ON public.store_rewards
FOR ALL
USING (family_id = public.get_my_family_id());

-- Fix timetables policies
DROP POLICY IF EXISTS "Users can view family timetable" ON public.timetables;
DROP POLICY IF EXISTS "Users can manage family timetable" ON public.timetables;
CREATE POLICY "Users can view family timetable"
ON public.timetables
FOR SELECT
USING (family_id = public.get_my_family_id());

CREATE POLICY "Users can manage family timetable"
ON public.timetables
FOR ALL
USING (family_id = public.get_my_family_id());

-- Fix families policies
DROP POLICY IF EXISTS "Users can view their family" ON public.families;
CREATE POLICY "Users can view their family"
ON public.families
FOR SELECT
USING (id = public.get_my_family_id());