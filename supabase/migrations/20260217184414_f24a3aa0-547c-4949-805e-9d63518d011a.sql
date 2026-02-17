
-- Create in-app notifications table for parents
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'reward_redeemed', -- 'reward_redeemed' | 'task_completed'
  child_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL DEFAULT '',
  entity_id UUID, -- task_id or reward_id
  entity_name TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast unread queries per family
CREATE INDEX idx_notifications_family_unread ON public.notifications(family_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_parent ON public.notifications(parent_id, is_read, created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Parents can view their own family's notifications
CREATE POLICY "Parents can view family notifications"
  ON public.notifications
  FOR SELECT
  USING (
    family_id = get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  );

-- Parents can mark notifications as read (UPDATE only is_read)
CREATE POLICY "Parents can update notification read status"
  ON public.notifications
  FOR UPDATE
  USING (
    family_id = get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  )
  WITH CHECK (
    family_id = get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  );

-- Service role / children can insert (children trigger the event)
CREATE POLICY "Family members can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    family_id = get_my_family_id()
  );

-- Enable realtime for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
