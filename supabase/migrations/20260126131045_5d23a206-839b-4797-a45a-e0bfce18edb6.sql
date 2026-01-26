-- Function to create default tasks for a new child
CREATE OR REPLACE FUNCTION public.create_default_tasks_for_child()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create tasks for child profiles that have a family_id
  IF NEW.role = 'child' AND NEW.family_id IS NOT NULL THEN
    -- Morning tasks
    INSERT INTO public.tasks (family_id, assigned_to, title, category, time, credits, icon)
    VALUES 
      (NEW.family_id, NEW.id, 'התלבשות ונעליים', 'hygiene', 'morning', 15, '👕'),
      (NEW.family_id, NEW.id, 'ארוחת בוקר ותרופות', 'nutrition', 'morning', 10, '🍳'),
      (NEW.family_id, NEW.id, 'בדיקת תיק', 'school', 'morning', 10, '🎒');
    
    -- Afternoon tasks
    INSERT INTO public.tasks (family_id, assigned_to, title, category, time, credits, icon)
    VALUES 
      (NEW.family_id, NEW.id, 'פריקת תיק', 'school', 'afternoon', 15, '📚'),
      (NEW.family_id, NEW.id, 'התחלת שיעורי בית', 'school', 'afternoon', 20, '✏️');
    
    -- Evening tasks
    INSERT INTO public.tasks (family_id, assigned_to, title, category, time, credits, icon)
    VALUES 
      (NEW.family_id, NEW.id, 'הכנה למחר', 'school', 'evening', 15, '📋'),
      (NEW.family_id, NEW.id, 'כיבוי מסכים שעה לפני השינה', 'hygiene', 'evening', 25, '📵'),
      (NEW.family_id, NEW.id, 'מקלחת וצחצוח שיניים', 'hygiene', 'evening', 15, '🚿');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new child profiles
DROP TRIGGER IF EXISTS on_child_profile_created ON public.profiles;
CREATE TRIGGER on_child_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_tasks_for_child();