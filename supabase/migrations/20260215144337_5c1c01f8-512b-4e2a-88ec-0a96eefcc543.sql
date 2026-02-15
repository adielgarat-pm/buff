
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
  IF NEW.role = 'child' AND NEW.family_id IS NOT NULL THEN
    v_daily_goal := COALESCE(NEW.daily_goal, 100);
    v_smart_goal := (v_daily_goal * 70) / 100;
    
    SELECT preferred_language INTO v_lang
    FROM public.families
    WHERE id = NEW.family_id;
    
    v_lang := COALESCE(v_lang, 'he');

    IF v_lang = 'en' THEN
      INSERT INTO public.tasks (family_id, assigned_to, title, category, time, credits, icon, description, schedule_days)
      VALUES 
        (NEW.family_id, NEW.id, 'Sparkling Smile', 'self-care', '07:00', 15, '😁', 'Brush teeth', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'Getting Ready Hero', 'self-care', '07:15', 15, '👕', 'Get dressed', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'Success Prep', 'organization', '07:30', 10, '🎒', 'Pack school bag', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'Focus Mode', 'learning', '16:00', 20, '📚', 'Homework/Study time', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'Healthy Growth', 'self-care', '19:00', 10, '🥗', 'Finish dinner', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'Recharging My Battery', 'self-care', '21:00', 15, '🌙', 'Bedtime routine', ARRAY[0,1,2,3,4,5]);

      INSERT INTO public.store_rewards (family_id, assigned_to, title, emoji, price, claimed)
      VALUES 
        (NEW.family_id, NEW.id, 'The Freedom Pass', '⏰', v_smart_goal * 1, false),
        (NEW.family_id, NEW.id, 'Coffee/Treat Date', '☕', v_smart_goal * 2, false),
        (NEW.family_id, NEW.id, 'The Digital Power-Up', '🎮', v_smart_goal * 3, false),
        (NEW.family_id, NEW.id, 'Chef''s Choice', '👨‍🍳', v_smart_goal * 4, false),
        (NEW.family_id, NEW.id, 'Cinema Night', '🎬', v_smart_goal * 5, false),
        (NEW.family_id, NEW.id, 'Gourmet Night In', '🍕', v_smart_goal * 7, false);
    ELSE
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

      INSERT INTO public.store_rewards (family_id, assigned_to, title, emoji, price, claimed)
      VALUES 
        (NEW.family_id, NEW.id, 'עוד 15 דקות מסך', '📱', v_smart_goal * 1, false),
        (NEW.family_id, NEW.id, 'פטור ממטלה מעצבנת', '🎉', v_smart_goal * 2, false),
        (NEW.family_id, NEW.id, 'ערב סרט ופופקורן', '🎬', v_smart_goal * 4, false),
        (NEW.family_id, NEW.id, 'ערב פיצה או סושי', '🍕', v_smart_goal * 5, false),
        (NEW.family_id, NEW.id, 'יום כיף', '🎢', v_smart_goal * 10, false);
    END IF;

    INSERT INTO public.credit_vault (family_id, child_id, total_balance, last_updated_date)
    VALUES (NEW.family_id, NEW.id, 0, NULL)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;
