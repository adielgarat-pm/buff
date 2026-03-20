
-- Create child_vibes table to track daily mood/energy check-ins
CREATE TABLE public.child_vibes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  vibe_level INTEGER NOT NULL CHECK (vibe_level >= 1 AND vibe_level <= 5),
  vibe_type TEXT NOT NULL DEFAULT 'emoji',
  low_power_mode BOOLEAN NOT NULL DEFAULT false,
  parent_sos_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_id, date)
);

-- Enable RLS
ALTER TABLE public.child_vibes ENABLE ROW LEVEL SECURITY;

-- Children can view and manage their own vibes
CREATE POLICY "Children can manage own vibes"
  ON public.child_vibes FOR ALL
  USING (family_id = get_my_family_id() AND child_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1))
  WITH CHECK (family_id = get_my_family_id() AND child_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1));

-- Parents can view all family vibes
CREATE POLICY "Parents can view family vibes"
  ON public.child_vibes FOR SELECT
  USING (family_id = get_my_family_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'parent'));

-- Parents can manage family vibes (for shared device)
CREATE POLICY "Parents can manage family vibes"
  ON public.child_vibes FOR ALL
  USING (family_id = get_my_family_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'parent'))
  WITH CHECK (family_id = get_my_family_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'parent'));

-- Enable realtime for parent SOS
ALTER PUBLICATION supabase_realtime ADD TABLE public.child_vibes;
