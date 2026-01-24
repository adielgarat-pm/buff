-- Add unique constraint for child-specific progress tracking
-- First, clean up any duplicate entries
DELETE FROM daily_progress a USING daily_progress b
WHERE a.id > b.id 
  AND a.family_id = b.family_id 
  AND a.date = b.date 
  AND a.task_id = b.task_id 
  AND COALESCE(a.child_id::text, '') = COALESCE(b.child_id::text, '');

-- Add unique constraint including child_id (allows null child_id for family-wide tasks)
CREATE UNIQUE INDEX IF NOT EXISTS daily_progress_family_date_task_child_idx 
ON daily_progress (family_id, date, task_id, COALESCE(child_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Same for lesson_progress
DELETE FROM lesson_progress a USING lesson_progress b
WHERE a.id > b.id 
  AND a.family_id = b.family_id 
  AND a.date = b.date 
  AND a.lesson_key = b.lesson_key 
  AND COALESCE(a.child_id::text, '') = COALESCE(b.child_id::text, '');

CREATE UNIQUE INDEX IF NOT EXISTS lesson_progress_family_date_lesson_child_idx 
ON lesson_progress (family_id, date, lesson_key, COALESCE(child_id, '00000000-0000-0000-0000-000000000000'::uuid));