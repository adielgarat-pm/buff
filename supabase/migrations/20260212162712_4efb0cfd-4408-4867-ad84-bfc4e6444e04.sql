-- Add is_activated column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_activated boolean NOT NULL DEFAULT false;

-- Update existing parents who already have children as activated
UPDATE public.profiles p
SET is_activated = true
WHERE p.role = 'parent' 
  AND EXISTS (
    SELECT 1 FROM public.profiles c 
    WHERE c.family_id = p.family_id AND c.role = 'child'
  );
