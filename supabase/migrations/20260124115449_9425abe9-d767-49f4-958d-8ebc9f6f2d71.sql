-- Add assigned_to column to tasks table for per-child task assignment
ALTER TABLE public.tasks 
ADD COLUMN assigned_to UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add assigned_to column to timetables table for per-child schedules
ALTER TABLE public.timetables 
ADD COLUMN assigned_to UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add assigned_to column to store_rewards table for per-child rewards
ALTER TABLE public.store_rewards 
ADD COLUMN assigned_to UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add child_id to daily_progress for per-child tracking
ALTER TABLE public.daily_progress 
ADD COLUMN child_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add child_id to lesson_progress for per-child tracking
ALTER TABLE public.lesson_progress 
ADD COLUMN child_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add child_id to credit_vault for per-child balance tracking
ALTER TABLE public.credit_vault 
ADD COLUMN child_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_timetables_assigned_to ON public.timetables(assigned_to);
CREATE INDEX idx_store_rewards_assigned_to ON public.store_rewards(assigned_to);
CREATE INDEX idx_daily_progress_child_id ON public.daily_progress(child_id);
CREATE INDEX idx_lesson_progress_child_id ON public.lesson_progress(child_id);
CREATE INDEX idx_credit_vault_child_id ON public.credit_vault(child_id);

-- Update RLS policies for tasks to support per-child filtering
DROP POLICY IF EXISTS "Users can view family tasks" ON public.tasks;
DROP POLICY IF EXISTS "Parents can manage tasks" ON public.tasks;

-- Children see only tasks assigned to them (or unassigned family tasks)
CREATE POLICY "Children can view their tasks"
ON public.tasks
FOR SELECT
USING (
  family_id = get_my_family_id() 
  AND (
    assigned_to IS NULL 
    OR assigned_to = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
);

-- Parents can view all family tasks
CREATE POLICY "Parents can view all family tasks"
ON public.tasks
FOR SELECT
USING (
  family_id = get_my_family_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'parent'
  )
);

-- Parents can manage all family tasks
CREATE POLICY "Parents can manage tasks"
ON public.tasks
FOR ALL
USING (
  family_id = get_my_family_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'parent'
  )
);

-- Update RLS policies for timetables
DROP POLICY IF EXISTS "Users can view family timetable" ON public.timetables;
DROP POLICY IF EXISTS "Users can manage family timetable" ON public.timetables;

-- Children see only their timetable (or unassigned family timetable)
CREATE POLICY "Children can view their timetable"
ON public.timetables
FOR SELECT
USING (
  family_id = get_my_family_id()
  AND (
    assigned_to IS NULL 
    OR assigned_to = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
);

-- Parents can view all family timetables
CREATE POLICY "Parents can view all family timetables"
ON public.timetables
FOR SELECT
USING (
  family_id = get_my_family_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'parent'
  )
);

-- Parents can manage all family timetables
CREATE POLICY "Parents can manage timetables"
ON public.timetables
FOR ALL
USING (
  family_id = get_my_family_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'parent'
  )
);

-- Update RLS policies for store_rewards
DROP POLICY IF EXISTS "Users can view family rewards" ON public.store_rewards;
DROP POLICY IF EXISTS "Users can manage family rewards" ON public.store_rewards;

-- Children see only their rewards (or unassigned family rewards)
CREATE POLICY "Children can view their rewards"
ON public.store_rewards
FOR SELECT
USING (
  family_id = get_my_family_id()
  AND (
    assigned_to IS NULL 
    OR assigned_to = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
);

-- Parents can view all family rewards
CREATE POLICY "Parents can view all family rewards"
ON public.store_rewards
FOR SELECT
USING (
  family_id = get_my_family_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'parent'
  )
);

-- Parents/children can manage family rewards (redeem)
CREATE POLICY "Users can manage family rewards"
ON public.store_rewards
FOR ALL
USING (family_id = get_my_family_id());

-- Update RLS policies for daily_progress
DROP POLICY IF EXISTS "Users can view family progress" ON public.daily_progress;
DROP POLICY IF EXISTS "Users can manage family progress" ON public.daily_progress;

-- Children see only their progress
CREATE POLICY "Children can view their progress"
ON public.daily_progress
FOR SELECT
USING (
  family_id = get_my_family_id()
  AND (
    child_id IS NULL 
    OR child_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
);

-- Parents can view all family progress
CREATE POLICY "Parents can view all family progress"
ON public.daily_progress
FOR SELECT
USING (
  family_id = get_my_family_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'parent'
  )
);

-- Users can manage their own progress
CREATE POLICY "Users can manage their progress"
ON public.daily_progress
FOR ALL
USING (family_id = get_my_family_id());

-- Update RLS policies for lesson_progress
DROP POLICY IF EXISTS "Users can view lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can manage lesson progress" ON public.lesson_progress;

-- Children see only their lesson progress
CREATE POLICY "Children can view their lesson progress"
ON public.lesson_progress
FOR SELECT
USING (
  family_id = get_my_family_id()
  AND (
    child_id IS NULL 
    OR child_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
);

-- Parents can view all family lesson progress
CREATE POLICY "Parents can view all family lesson progress"
ON public.lesson_progress
FOR SELECT
USING (
  family_id = get_my_family_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'parent'
  )
);

-- Users can manage their lesson progress
CREATE POLICY "Users can manage their lesson progress"
ON public.lesson_progress
FOR ALL
USING (family_id = get_my_family_id());

-- Update RLS policies for credit_vault
DROP POLICY IF EXISTS "Users can view family vault" ON public.credit_vault;
DROP POLICY IF EXISTS "Users can manage family vault" ON public.credit_vault;

-- Children see only their vault
CREATE POLICY "Children can view their vault"
ON public.credit_vault
FOR SELECT
USING (
  family_id = get_my_family_id()
  AND (
    child_id IS NULL 
    OR child_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
);

-- Parents can view all family vaults
CREATE POLICY "Parents can view all family vaults"
ON public.credit_vault
FOR SELECT
USING (
  family_id = get_my_family_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'parent'
  )
);

-- Users can manage their vault
CREATE POLICY "Users can manage their vault"
ON public.credit_vault
FOR ALL
USING (family_id = get_my_family_id());