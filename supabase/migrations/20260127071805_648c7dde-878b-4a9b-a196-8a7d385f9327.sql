-- Fix: Add default to short_code column so INSERT works without providing a value
-- The trigger will still run but this ensures the NOT NULL constraint is satisfied

ALTER TABLE public.families 
ALTER COLUMN short_code SET DEFAULT public.generate_family_short_code();

-- Also ensure the trigger runs even if a value is provided (for safety)
-- But the default should handle most cases now