
-- Trigger function: create notification when a task is completed
CREATE OR REPLACE FUNCTION public.notify_parent_on_task_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_child_name TEXT;
  v_task_name TEXT;
  v_parent_id UUID;
BEGIN
  -- Only act on completed tasks with a child_id
  IF NEW.completed = true AND NEW.child_id IS NOT NULL THEN
    -- Get child name
    SELECT display_name INTO v_child_name
    FROM profiles WHERE id = NEW.child_id;

    -- Get task name
    SELECT title INTO v_task_name
    FROM tasks WHERE id = NEW.task_id;

    -- Get the first parent in the family
    SELECT id INTO v_parent_id
    FROM profiles
    WHERE family_id = NEW.family_id AND role = 'parent'
    LIMIT 1;

    IF v_parent_id IS NOT NULL THEN
      -- Dedup: skip if notification already exists for this task+child today
      IF NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE family_id = NEW.family_id
          AND entity_id = NEW.task_id
          AND child_id = NEW.child_id
          AND type = 'task_completed'
          AND created_at::date = CURRENT_DATE
      ) THEN
        INSERT INTO notifications (family_id, parent_id, type, child_id, child_name, entity_id, entity_name, is_read)
        VALUES (NEW.family_id, v_parent_id, 'task_completed', NEW.child_id, COALESCE(v_child_name, ''), NEW.task_id, COALESCE(v_task_name, 'quest'), false);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger function: create notification when a reward is redeemed
CREATE OR REPLACE FUNCTION public.notify_parent_on_reward_redeemed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_child_name TEXT;
  v_parent_id UUID;
BEGIN
  -- Only act when claimed flips false → true
  IF NEW.claimed = true AND (OLD.claimed IS DISTINCT FROM true) AND NEW.assigned_to IS NOT NULL THEN
    -- Get child name
    SELECT display_name INTO v_child_name
    FROM profiles WHERE id = NEW.assigned_to;

    -- Get the first parent in the family
    SELECT id INTO v_parent_id
    FROM profiles
    WHERE family_id = NEW.family_id AND role = 'parent'
    LIMIT 1;

    IF v_parent_id IS NOT NULL THEN
      -- Dedup
      IF NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE family_id = NEW.family_id
          AND entity_id = NEW.id
          AND type = 'reward_redeemed'
          AND created_at::date = CURRENT_DATE
      ) THEN
        INSERT INTO notifications (family_id, parent_id, type, child_id, child_name, entity_id, entity_name, is_read)
        VALUES (NEW.family_id, v_parent_id, 'reward_redeemed', NEW.assigned_to, COALESCE(v_child_name, ''), NEW.id, COALESCE(NEW.title, ''), false);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trg_notify_task_completed
AFTER INSERT ON public.daily_progress
FOR EACH ROW
EXECUTE FUNCTION public.notify_parent_on_task_completion();

CREATE TRIGGER trg_notify_reward_redeemed
AFTER UPDATE ON public.store_rewards
FOR EACH ROW
EXECUTE FUNCTION public.notify_parent_on_reward_redeemed();
