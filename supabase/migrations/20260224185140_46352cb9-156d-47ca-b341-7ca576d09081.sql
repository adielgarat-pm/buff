
-- Create email_logs table
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  profile_id UUID REFERENCES public.profiles(id),
  email_to TEXT NOT NULL,
  template_key TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT
);

-- Index for cooldown checks
CREATE INDEX idx_email_logs_profile_sent ON public.email_logs(profile_id, sent_at DESC);

-- RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view email logs
CREATE POLICY "Admins can view email logs"
  ON public.email_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Edge functions (service role) insert via service key, no RLS policy needed for insert
-- But we add one for the cron/edge function context
CREATE POLICY "Service can insert email logs"
  ON public.email_logs
  FOR INSERT
  WITH CHECK (true);
