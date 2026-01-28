-- Create a unique index for bag prep progress to enable upsert
-- This allows the bag prep completion to use ON CONFLICT properly
CREATE UNIQUE INDEX IF NOT EXISTS daily_progress_unique_family_task_date_child 
ON public.daily_progress (family_id, task_id, date, child_id) 
WHERE child_id IS NOT NULL;

-- Also create one for when child_id is NULL (family-level tasks)
CREATE UNIQUE INDEX IF NOT EXISTS daily_progress_unique_family_task_date_null_child 
ON public.daily_progress (family_id, task_id, date) 
WHERE child_id IS NULL;