-- Allow children to be registered without their own device (user_id = NULL)
-- This is a non-destructive change - existing records remain intact

-- Step 1: Make user_id nullable for children without devices
ALTER TABLE public.profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Update the default tasks trigger to handle NULL user_id
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
    
    -- Create default rewards based on "Days of Success" (using smart goal = 70% of daily goal)
    -- The "Dopamine Bridge" - tiered rewards for sustained motivation
    INSERT INTO public.store_rewards (family_id, assigned_to, title, emoji, price, claimed)
    VALUES 
      -- 1 Success Day (1x smart goal)
      (NEW.family_id, NEW.id, 'עוד 15 דקות מסך', '📱', v_smart_goal * 1, false),
      -- 2 Success Days (2x smart goal)
      (NEW.family_id, NEW.id, 'פטור ממטלה מעצבנת', '🎉', v_smart_goal * 2, false),
      -- 4 Success Days (4x smart goal)
      (NEW.family_id, NEW.id, 'ערב סרט ופופקורן', '🎬', v_smart_goal * 4, false),
      -- 5 Success Days (5x smart goal)
      (NEW.family_id, NEW.id, 'ערב פיצה או סושי', '🍕', v_smart_goal * 5, false),
      -- 10 Success Days (10x smart goal)
      (NEW.family_id, NEW.id, 'יום כיף', '🎢', v_smart_goal * 10, false);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Step 3: Update the INSERT policy for profiles to allow parent-created children (without user_id)
DROP POLICY IF EXISTS "Users can insert their profile" ON public.profiles;

CREATE POLICY "Users can insert their profile" ON public.profiles
FOR INSERT WITH CHECK (
  -- Allow users to insert their own profile
  user_id = auth.uid()
  OR
  -- Allow parents to create child profiles without user_id (for children without devices)
  (
    user_id IS NULL 
    AND role = 'child' 
    AND family_id = get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'parent'
    )
  )
);

-- Step 4: Add unique constraint for user_id only when not null
-- This prevents duplicate user_id entries while allowing multiple NULL values
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique 
ON public.profiles (user_id) 
WHERE user_id IS NOT NULL;