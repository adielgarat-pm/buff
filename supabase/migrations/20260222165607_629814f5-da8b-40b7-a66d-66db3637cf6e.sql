
-- =====================================================
-- 1. Stickers table: parent → child celebrations
-- =====================================================
CREATE TABLE public.stickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id),
  from_parent_id UUID NOT NULL REFERENCES public.profiles(id),
  to_child_id UUID NOT NULL REFERENCES public.profiles(id),
  sticker_type TEXT NOT NULL DEFAULT 'star',
  message TEXT,
  is_seen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;

-- Parents can insert stickers for children in their family
CREATE POLICY "Parents can send stickers"
ON public.stickers FOR INSERT
WITH CHECK (
  family_id = get_my_family_id()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'parent'
  )
);

-- Parents can view stickers in their family
CREATE POLICY "Parents can view family stickers"
ON public.stickers FOR SELECT
USING (
  family_id = get_my_family_id()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'parent'
  )
);

-- Children can view stickers sent to them
CREATE POLICY "Children can view their stickers"
ON public.stickers FOR SELECT
USING (
  family_id = get_my_family_id()
  AND to_child_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Children can mark their stickers as seen
CREATE POLICY "Children can mark stickers seen"
ON public.stickers FOR UPDATE
USING (
  family_id = get_my_family_id()
  AND to_child_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
  family_id = get_my_family_id()
  AND to_child_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Parents can also mark stickers as seen (for shared-device children)
CREATE POLICY "Parents can update stickers"
ON public.stickers FOR UPDATE
USING (
  family_id = get_my_family_id()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'parent'
  )
)
WITH CHECK (
  family_id = get_my_family_id()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'parent'
  )
);

-- Enable realtime for stickers
ALTER PUBLICATION supabase_realtime ADD TABLE public.stickers;

-- =====================================================
-- 2. Milestone notification trigger
--    Fires when a child reaches 10, 25, 50, 100 total completions
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_parent_on_quest_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_completions INTEGER;
  v_child_name TEXT;
  v_parent_id UUID;
  v_milestone INTEGER;
BEGIN
  IF NEW.completed = true AND NEW.child_id IS NOT NULL THEN
    -- Count total completed tasks for this child (all time)
    SELECT COUNT(*) INTO v_total_completions
    FROM daily_progress
    WHERE child_id = NEW.child_id AND completed = true;

    -- Check if we hit a milestone
    v_milestone := NULL;
    IF v_total_completions = 10 THEN v_milestone := 10;
    ELSIF v_total_completions = 25 THEN v_milestone := 25;
    ELSIF v_total_completions = 50 THEN v_milestone := 50;
    ELSIF v_total_completions = 100 THEN v_milestone := 100;
    END IF;

    IF v_milestone IS NOT NULL THEN
      SELECT display_name INTO v_child_name
      FROM profiles WHERE id = NEW.child_id;

      SELECT id INTO v_parent_id
      FROM profiles
      WHERE family_id = NEW.family_id AND role = 'parent'
      LIMIT 1;

      IF v_parent_id IS NOT NULL THEN
        -- Dedup
        IF NOT EXISTS (
          SELECT 1 FROM notifications
          WHERE family_id = NEW.family_id
            AND child_id = NEW.child_id
            AND type = 'quest_milestone'
            AND entity_name = v_milestone::text
        ) THEN
          INSERT INTO notifications (family_id, parent_id, type, child_id, child_name, entity_id, entity_name, is_read)
          VALUES (NEW.family_id, v_parent_id, 'quest_milestone', NEW.child_id, COALESCE(v_child_name, ''), NULL, v_milestone::text, false);
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_quest_milestone
AFTER INSERT ON public.daily_progress
FOR EACH ROW
EXECUTE FUNCTION public.notify_parent_on_quest_milestone();
