-- Create lesson reflections table for storing child notes on lessons
CREATE TABLE public.lesson_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  child_id UUID NOT NULL,
  date TEXT NOT NULL,
  lesson_key TEXT NOT NULL,
  subject TEXT,
  reflection TEXT,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, child_id, date, lesson_key)
);

-- Enable RLS
ALTER TABLE public.lesson_reflections ENABLE ROW LEVEL SECURITY;

-- Children can view and manage their own reflections
CREATE POLICY "Children can view their reflections"
ON public.lesson_reflections
FOR SELECT
USING (
  family_id = get_my_family_id() 
  AND child_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);

CREATE POLICY "Children can create their reflections"
ON public.lesson_reflections
FOR INSERT
WITH CHECK (
  family_id = get_my_family_id() 
  AND child_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);

CREATE POLICY "Children can update their reflections"
ON public.lesson_reflections
FOR UPDATE
USING (
  family_id = get_my_family_id() 
  AND child_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Parents can view all family reflections
CREATE POLICY "Parents can view all family reflections"
ON public.lesson_reflections
FOR SELECT
USING (
  family_id = get_my_family_id() 
  AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'parent')
);

-- Add trigger for updated_at
CREATE TRIGGER update_lesson_reflections_updated_at
  BEFORE UPDATE ON public.lesson_reflections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();