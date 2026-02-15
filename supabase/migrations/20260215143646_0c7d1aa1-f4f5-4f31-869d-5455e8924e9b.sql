
-- Add preferred_language to families table (default 'he' for existing families)
ALTER TABLE public.families 
ADD COLUMN preferred_language text NOT NULL DEFAULT 'he';

-- Update the trigger function to be language-aware
CREATE OR REPLACE FUNCTION public.create_default_tasks_for_child()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_daily_goal integer;
  v_smart_goal integer;
  v_lang text;
BEGIN
  -- Only create tasks for child profiles that have a family_id
  IF NEW.role = 'child' AND NEW.family_id IS NOT NULL THEN
    -- Get the child's daily goal (default 100)
    v_daily_goal := COALESCE(NEW.daily_goal, 100);
    -- Calculate smart goal (70% of daily goal)
    v_smart_goal := (v_daily_goal * 70) / 100;
    
    -- Get family's preferred language
    SELECT preferred_language INTO v_lang
    FROM public.families
    WHERE id = NEW.family_id;
    
    v_lang := COALESCE(v_lang, 'he');

    IF v_lang = 'en' THEN
      -- ENGLISH default tasks
      INSERT INTO public.tasks (family_id, assigned_to, title, category, time, credits, icon, description, schedule_days)
      VALUES 
        (NEW.family_id, NEW.id, 'Get Dressed & Shoes', 'self-care', '07:00', 15, '👕', 'Get dressed and ready for the morning', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'Breakfast & Meds', 'self-care', '07:30', 10, '🍳', 'Eat breakfast and take medication', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'Bag Check', 'organization', '08:00', 10, '🎒', 'Make sure all supplies are in the bag', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'Unpack Bag', 'organization', '16:00', 15, '📚', 'Unpack bag and take out documents', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'Start Homework', 'learning', '17:00', 20, '✏️', 'Begin homework', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'Prepare for Tomorrow', 'organization', '20:00', 15, '📋', 'Prepare clothes and bag for tomorrow', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'Screens Off 1hr Before Bed', 'self-care', '20:30', 25, '📵', 'Turn off phone and TV', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'Shower & Brush Teeth', 'self-care', '21:00', 15, '🚿', 'Take a shower and brush teeth', ARRAY[0,1,2,3,4,5]);

      -- English default rewards
      INSERT INTO public.store_rewards (family_id, assigned_to, title, emoji, price, claimed)
      VALUES 
        (NEW.family_id, NEW.id, '15 Extra Screen Minutes', '📱', v_smart_goal * 1, false),
        (NEW.family_id, NEW.id, 'Skip an Annoying Chore', '🎉', v_smart_goal * 2, false),
        (NEW.family_id, NEW.id, 'Movie & Popcorn Night', '🎬', v_smart_goal * 4, false),
        (NEW.family_id, NEW.id, 'Pizza or Sushi Night', '🍕', v_smart_goal * 5, false),
        (NEW.family_id, NEW.id, 'Fun Day Out', '🎢', v_smart_goal * 10, false);
    ELSE
      -- HEBREW default tasks (original)
      INSERT INTO public.tasks (family_id, assigned_to, title, category, time, credits, icon, description, schedule_days)
      VALUES 
        (NEW.family_id, NEW.id, 'התלבשות ונעליים', 'self-care', '07:00', 15, '👕', 'להתלבש ולהתארגן לבוקר', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'ארוחת בוקר ותרופות', 'self-care', '07:30', 10, '🍳', 'לאכול ארוחת בוקר ולקחת תרופות', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'בדיקת תיק', 'organization', '08:00', 10, '🎒', 'לוודא שכל הציוד בתיק', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'פריקת תיק', 'organization', '16:00', 15, '📚', 'לפרוק את התיק ולהוציא מסמכים', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'התחלת שיעורי בית', 'learning', '17:00', 20, '✏️', 'להתחיל בשיעורי הבית', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'הכנה למחר', 'organization', '20:00', 15, '📋', 'להכין בגדים ותיק למחר', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'כיבוי מסכים שעה לפני השינה', 'self-care', '20:30', 25, '📵', 'לכבות טלפון וטלוויזיה', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'מקלחת וצחצוח שיניים', 'self-care', '21:00', 15, '🚿', 'להתקלח ולצחצח שיניים', ARRAY[0,1,2,3,4,5]);

      -- Hebrew default rewards
      INSERT INTO public.store_rewards (family_id, assigned_to, title, emoji, price, claimed)
      VALUES 
        (NEW.family_id, NEW.id, 'עוד 15 דקות מסך', '📱', v_smart_goal * 1, false),
        (NEW.family_id, NEW.id, 'פטור ממטלה מעצבנת', '🎉', v_smart_goal * 2, false),
        (NEW.family_id, NEW.id, 'ערב סרט ופופקורן', '🎬', v_smart_goal * 4, false),
        (NEW.family_id, NEW.id, 'ערב פיצה או סושי', '🍕', v_smart_goal * 5, false),
        (NEW.family_id, NEW.id, 'יום כיף', '🎢', v_smart_goal * 10, false);
    END IF;

    -- Create a credit vault for the new child
    INSERT INTO public.credit_vault (family_id, child_id, total_balance, last_updated_date)
    VALUES (NEW.family_id, NEW.id, 0, NULL)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;
