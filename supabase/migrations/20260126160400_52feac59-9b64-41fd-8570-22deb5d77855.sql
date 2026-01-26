-- Seed default tasks for existing child profiles that have NO tasks
INSERT INTO public.tasks (family_id, assigned_to, title, category, time, credits, icon, description)
SELECT 
  p.family_id,
  p.id,
  t.title,
  t.category,
  t.time,
  t.credits,
  t.icon,
  t.description
FROM public.profiles p
CROSS JOIN (
  VALUES 
    -- SCHOOL DAY TEMPLATE (Morning)
    ('התלבשות ונעליים', 'hygiene', 'morning', 15, '👕', 'להתלבש ולהתארגן לבוקר'),
    ('ארוחת בוקר ותרופות', 'nutrition', 'morning', 10, '🍳', 'לאכול ארוחת בוקר ולקחת תרופות'),
    ('בדיקת תיק', 'school', 'morning', 10, '🎒', 'לוודא שכל הציוד בתיק'),
    -- SCHOOL DAY TEMPLATE (Afternoon)
    ('פריקת תיק', 'school', 'afternoon', 15, '📚', 'לפרוק את התיק ולהוציא מסמכים'),
    ('התחלת שיעורי בית', 'school', 'afternoon', 20, '✏️', 'להתחיל בשיעורי הבית'),
    -- SCHOOL DAY TEMPLATE (Evening)
    ('הכנה למחר', 'school', 'evening', 15, '📋', 'להכין בגדים ותיק למחר'),
    ('כיבוי מסכים שעה לפני השינה', 'hygiene', 'evening', 25, '📵', 'לכבות טלפון וטלוויזיה'),
    ('מקלחת וצחצוח שיניים', 'hygiene', 'evening', 15, '🚿', 'להתקלח ולצחצח שיניים')
) AS t(title, category, time, credits, icon, description)
WHERE p.role = 'child' 
  AND p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.assigned_to = p.id
  );

-- Seed default rewards for existing child profiles that have NO rewards
INSERT INTO public.store_rewards (family_id, assigned_to, title, emoji, price, claimed)
SELECT 
  p.family_id,
  p.id,
  r.title,
  r.emoji,
  ((p.daily_goal * 70) / 100) * r.multiplier,
  false
FROM public.profiles p
CROSS JOIN (
  VALUES 
    -- 1 Success Day (1x smart goal)
    ('עוד 15 דקות מסך', '📱', 1),
    -- 2 Success Days (2x smart goal)
    ('פטור ממטלה מעצבנת', '🎉', 2),
    -- 4 Success Days (4x smart goal)
    ('ערב סרט ופופקורן', '🎬', 4),
    -- 5 Success Days (5x smart goal)
    ('ערב פיצה או סושי', '🍕', 5),
    -- 10 Success Days (10x smart goal)
    ('יום כיף', '🎢', 10)
) AS r(title, emoji, multiplier)
WHERE p.role = 'child' 
  AND p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.store_rewards 
    WHERE store_rewards.assigned_to = p.id
  );

-- Create credit vaults for existing child profiles that don't have one
INSERT INTO public.credit_vault (family_id, child_id, total_balance, last_updated_date)
SELECT p.family_id, p.id, 0, NULL
FROM public.profiles p
WHERE p.role = 'child' 
  AND p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.credit_vault 
    WHERE credit_vault.child_id = p.id
  )
ON CONFLICT DO NOTHING;