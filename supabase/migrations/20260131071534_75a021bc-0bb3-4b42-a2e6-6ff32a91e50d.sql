-- First, drop the existing check constraint on category
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_category_check;

-- Update existing tasks with the new category values
UPDATE public.tasks
SET category = CASE
    WHEN category = 'school' THEN 'learning'
    WHEN category = 'nutrition' THEN 'self-care'
    WHEN category = 'hygiene' THEN 'self-care'
    WHEN category = 'medication' THEN 'self-care'
    WHEN category = 'math' THEN 'learning'
    WHEN category = 'coding' THEN 'learning'
    ELSE category
END
WHERE category IN ('school', 'nutrition', 'hygiene', 'medication', 'math', 'coding');

-- Add new check constraint for the 5-category system
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_category_check 
CHECK (category IN ('learning', 'organization', 'self-care', 'responsibility', 'movement'));

-- Update the create_default_tasks_for_child function to use new categories
CREATE OR REPLACE FUNCTION public.create_default_tasks_for_child()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_daily_goal integer;
  v_smart_goal integer;
BEGIN
  -- Only create tasks for child profiles that have a family_id
  IF NEW.role = 'child' AND NEW.family_id IS NOT NULL THEN
    -- Get the child's daily goal (default 100)
    v_daily_goal := COALESCE(NEW.daily_goal, 100);
    -- Calculate smart goal (70% of daily goal)
    v_smart_goal := (v_daily_goal * 70) / 100;
    
    -- SCHOOL DAY TEMPLATE (Morning tasks - using new 5-category system)
    INSERT INTO public.tasks (family_id, assigned_to, title, category, time, credits, icon, description)
    VALUES 
      (NEW.family_id, NEW.id, 'התלבשות ונעליים', 'self-care', '07:00', 15, '👕', 'להתלבש ולהתארגן לבוקר'),
      (NEW.family_id, NEW.id, 'ארוחת בוקר ותרופות', 'self-care', '07:30', 10, '🍳', 'לאכול ארוחת בוקר ולקחת תרופות'),
      (NEW.family_id, NEW.id, 'בדיקת תיק', 'organization', '08:00', 10, '🎒', 'לוודא שכל הציוד בתיק');
    
    -- SCHOOL DAY TEMPLATE (Afternoon tasks)
    INSERT INTO public.tasks (family_id, assigned_to, title, category, time, credits, icon, description)
    VALUES 
      (NEW.family_id, NEW.id, 'פריקת תיק', 'organization', '16:00', 15, '📚', 'לפרוק את התיק ולהוציא מסמכים'),
      (NEW.family_id, NEW.id, 'התחלת שיעורי בית', 'learning', '17:00', 20, '✏️', 'להתחיל בשיעורי הבית');
    
    -- SCHOOL DAY TEMPLATE (Evening tasks)
    INSERT INTO public.tasks (family_id, assigned_to, title, category, time, credits, icon, description)
    VALUES 
      (NEW.family_id, NEW.id, 'הכנה למחר', 'organization', '20:00', 15, '📋', 'להכין בגדים ותיק למחר'),
      (NEW.family_id, NEW.id, 'כיבוי מסכים שעה לפני השינה', 'self-care', '20:30', 25, '📵', 'לכבות טלפון וטלוויזיה'),
      (NEW.family_id, NEW.id, 'מקלחת וצחצוח שיניים', 'self-care', '21:00', 15, '🚿', 'להתקלח ולצחצח שיניים');

    -- Create a credit vault for the new child
    INSERT INTO public.credit_vault (family_id, child_id, total_balance, last_updated_date)
    VALUES (NEW.family_id, NEW.id, 0, NULL)
    ON CONFLICT DO NOTHING;
    
    -- Create default rewards based on "Days of Success" (using smart goal = 70% of daily goal)
    INSERT INTO public.store_rewards (family_id, assigned_to, title, emoji, price, claimed)
    VALUES 
      (NEW.family_id, NEW.id, 'עוד 15 דקות מסך', '📱', v_smart_goal * 1, false),
      (NEW.family_id, NEW.id, 'פטור ממטלה מעצבנת', '🎉', v_smart_goal * 2, false),
      (NEW.family_id, NEW.id, 'ערב סרט ופופקורן', '🎬', v_smart_goal * 4, false),
      (NEW.family_id, NEW.id, 'ערב פיצה או סושי', '🍕', v_smart_goal * 5, false),
      (NEW.family_id, NEW.id, 'יום כיף', '🎢', v_smart_goal * 10, false);
  END IF;
  
  RETURN NEW;
END;
$function$;