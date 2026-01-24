-- Create families table for grouping parent + child
CREATE TABLE public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Family',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for users (parent or child)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'child' CHECK (role IN ('parent', 'child')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table (family-scoped)
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('medication', 'hygiene', 'nutrition', 'school')),
  credits INTEGER NOT NULL DEFAULT 10,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_progress table (tracks completions per day)
CREATE TABLE public.daily_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, date, task_id)
);

-- Create lesson_progress table (tracks lesson completions)
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  lesson_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  credits INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, date, lesson_key)
);

-- Create credit_vault table (total balance)
CREATE TABLE public.credit_vault (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE UNIQUE,
  total_balance INTEGER NOT NULL DEFAULT 0,
  last_updated_date TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create store_rewards table
CREATE TABLE public.store_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎁',
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timetable table
CREATE TABLE public.timetables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE UNIQUE,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app_settings table
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE UNIQUE,
  app_title TEXT NOT NULL DEFAULT 'Daily Quests',
  daily_goal INTEGER NOT NULL DEFAULT 100,
  lesson_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can access their family's data
CREATE POLICY "Users can view their family" ON public.families
  FOR SELECT USING (
    id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view family members" ON public.profiles
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Tasks policies
CREATE POLICY "Users can view family tasks" ON public.tasks
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Parents can manage tasks" ON public.tasks
  FOR ALL USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
  );

-- Daily progress policies
CREATE POLICY "Users can view family progress" ON public.daily_progress
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage family progress" ON public.daily_progress
  FOR ALL USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Lesson progress policies
CREATE POLICY "Users can view lesson progress" ON public.lesson_progress
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage lesson progress" ON public.lesson_progress
  FOR ALL USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Credit vault policies
CREATE POLICY "Users can view family vault" ON public.credit_vault
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage family vault" ON public.credit_vault
  FOR ALL USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Store rewards policies
CREATE POLICY "Users can view family rewards" ON public.store_rewards
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage family rewards" ON public.store_rewards
  FOR ALL USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Timetable policies
CREATE POLICY "Users can view family timetable" ON public.timetables
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage family timetable" ON public.timetables
  FOR ALL USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

-- App settings policies
CREATE POLICY "Users can view family settings" ON public.app_settings
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Parents can manage settings" ON public.app_settings
  FOR ALL USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent')
  );

-- Enable realtime for all tables that need syncing
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_vault;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timetables;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_vault_updated_at
  BEFORE UPDATE ON public.credit_vault
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timetables_updated_at
  BEFORE UPDATE ON public.timetables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();