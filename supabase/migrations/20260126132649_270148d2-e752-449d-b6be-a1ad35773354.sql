-- Drop and recreate the trigger function with both School Day and Off Day templates
CREATE OR REPLACE FUNCTION public.create_default_tasks_for_child()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create tasks for child profiles that have a family_id
  IF NEW.role = 'child' AND NEW.family_id IS NOT NULL THEN
    -- SCHOOL DAY TEMPLATE (Morning tasks - time: 'morning')
    INSERT INTO public.tasks (family_id, assigned_to, title, category, time, credits, icon, description)
    VALUES 
      (NEW.family_id, NEW.id, 'התלבשות ונעליים', 'hygiene', 'morning', 15, '👕', 'להתלבש ולהתארגן לבוקר'),
      (NEW.family_id, NEW.id, 'ארוחת בוקר ותרופות', 'nutrition', 'morning', 10, '🍳', 'לאכול ארוחת בוקר ולקחת תרופות'),
      (NEW.family_id, NEW.id, 'בדיקת תיק', 'school', 'morning', 10, '🎒', 'לוודא שכל הציוד בתיק');
    
    -- SCHOOL DAY TEMPLATE (Afternoon tasks - time: 'afternoon')
    INSERT INTO public.tasks (family_id, assigned_to, title, category, time, credits, icon, description)
    VALUES 
      (NEW.family_id, NEW.id, 'פריקת תיק', 'school', 'afternoon', 15, '📚', 'לפרוק את התיק ולהוציא מסמכים'),
      (NEW.family_id, NEW.id, 'התחלת שיעורי בית', 'school', 'afternoon', 20, '✏️', 'להתחיל בשיעורי הבית');
    
    -- SCHOOL DAY TEMPLATE (Evening tasks - time: 'evening')
    INSERT INTO public.tasks (family_id, assigned_to, title, category, time, credits, icon, description)
    VALUES 
      (NEW.family_id, NEW.id, 'הכנה למחר', 'school', 'evening', 15, '📋', 'להכין בגדים ותיק למחר'),
      (NEW.family_id, NEW.id, 'כיבוי מסכים שעה לפני השינה', 'hygiene', 'evening', 25, '📵', 'לכבות טלפון וטלוויזיה'),
      (NEW.family_id, NEW.id, 'מקלחת וצחצוח שיניים', 'hygiene', 'evening', 15, '🚿', 'להתקלח ולצחצח שיניים');

    -- Create a credit vault for the new child
    INSERT INTO public.credit_vault (family_id, child_id, total_balance, last_updated_date)
    VALUES (NEW.family_id, NEW.id, 0, NULL)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_child_profile_created ON public.profiles;
CREATE TRIGGER on_child_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_tasks_for_child();