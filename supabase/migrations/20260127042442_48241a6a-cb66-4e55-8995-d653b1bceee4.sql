-- Create function to get orphaned users (users without profiles)
CREATE OR REPLACE FUNCTION public.get_admin_orphaned_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id as user_id,
    u.email,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE p.id IS NULL
    AND public.has_role(auth.uid(), 'admin')
  ORDER BY u.created_at DESC
$$;