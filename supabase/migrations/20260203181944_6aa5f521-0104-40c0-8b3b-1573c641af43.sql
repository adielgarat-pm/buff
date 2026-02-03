-- Enable realtime for profiles table so avatar updates sync across devices
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;