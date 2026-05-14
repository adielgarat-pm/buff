
-- Fix 1: store_rewards — restrict ALL to parents only (children keep SELECT via existing narrower policies)
DROP POLICY IF EXISTS "Users can manage family rewards" ON public.store_rewards;
CREATE POLICY "Parents can manage family rewards"
ON public.store_rewards FOR ALL TO authenticated
USING (
  family_id = public.get_my_family_id()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
)
WITH CHECK (
  family_id = public.get_my_family_id()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
);

-- Fix 2: daily_progress — children can only INSERT/UPDATE their own; parents can manage all family progress
DROP POLICY IF EXISTS "Users can manage their progress" ON public.daily_progress;
CREATE POLICY "Children can manage their own progress"
ON public.daily_progress FOR ALL TO authenticated
USING (
  family_id = public.get_my_family_id()
  AND child_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
  family_id = public.get_my_family_id()
  AND child_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "Parents can manage all family progress"
ON public.daily_progress FOR ALL TO authenticated
USING (
  family_id = public.get_my_family_id()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
)
WITH CHECK (
  family_id = public.get_my_family_id()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
);

-- Fix 3: lesson_progress — same pattern as daily_progress
DROP POLICY IF EXISTS "Users can manage their lesson progress" ON public.lesson_progress;
CREATE POLICY "Children can manage their own lesson progress"
ON public.lesson_progress FOR ALL TO authenticated
USING (
  family_id = public.get_my_family_id()
  AND child_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
  family_id = public.get_my_family_id()
  AND child_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "Parents can manage all family lesson progress"
ON public.lesson_progress FOR ALL TO authenticated
USING (
  family_id = public.get_my_family_id()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
)
WITH CHECK (
  family_id = public.get_my_family_id()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
);

-- Fix 4: notifications — restrict INSERT to parents only
DROP POLICY IF EXISTS "Family members can insert notifications" ON public.notifications;
CREATE POLICY "Parents can insert family notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (
  family_id = public.get_my_family_id()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
);

-- Fix 5: reviews — create a public-safe view without internal UUIDs, drop public table policy
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT id, display_name, display_name_en, rating, review_text, translated_text_en, status, created_at
FROM public.reviews
WHERE status = 'approved';

GRANT SELECT ON public.public_reviews TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;
