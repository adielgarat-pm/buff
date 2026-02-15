
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
        (NEW.family_id, NEW.id, 'חיוך נוצץ', 'self-care', '07:00', 15, '😁', 'צחצוח שיניים', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'אלוף התארגנות', 'self-care', '07:15', 15, '👕', 'להתלבש ולהתארגן', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'הכנה להצלחה', 'organization', '07:30', 10, '🎒', 'לארוז תיק לבית הספר', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'זמן פוקוס', 'learning', '16:00', 20, '📚', 'שיעורי בית / זמן למידה', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'גדילה בריאה', 'self-care', '19:00', 10, '🥗', 'לסיים ארוחת ערב', ARRAY[0,1,2,3,4,5]),
        (NEW.family_id, NEW.id, 'מטעינים מצברים', 'self-care', '21:00', 15, '🌙', 'שגרת שינה', ARRAY[0,1,2,3,4,5]);

      INSERT INTO public.store_rewards (family_id, assigned_to, title, emoji, price, claimed)
      VALUES 
        (NEW.family_id, NEW.id, 'פס חופש', '⏰', v_smart_goal * 1, false),
        (NEW.family_id, NEW.id, 'דייט של כיף', '☕', v_smart_goal * 2, false),
        (NEW.family_id, NEW.id, 'שדרוג דיגיטלי', '🎮', v_smart_goal * 3, false),
        (NEW.family_id, NEW.id, 'השף של הבית', '👨‍🍳', v_smart_goal * 4, false),
        (NEW.family_id, NEW.id, 'ערב קולנוע', '🎬', v_smart_goal * 5, false),
        (NEW.family_id, NEW.id, 'ערב גורמה ביתי', '🍕', v_smart_goal * 7, false);
    END IF;

    INSERT INTO public.credit_vault (family_id, child_id, total_balance, last_updated_date)
    VALUES (NEW.family_id, NEW.id, 0, NULL)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;
