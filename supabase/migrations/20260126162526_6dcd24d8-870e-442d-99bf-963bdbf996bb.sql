-- 1. Add birth_date to profiles for age calculation
ALTER TABLE public.profiles 
ADD COLUMN birth_date date;

-- 2. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 3. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- 4. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. RLS policy for user_roles - only admins can view
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Create admin view function to get all families data (security definer)
CREATE OR REPLACE FUNCTION public.get_admin_families_overview()
RETURNS TABLE (
  family_id uuid,
  family_name text,
  family_code text,
  family_created_at timestamptz,
  parent_count bigint,
  child_count bigint,
  children_info jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    f.id as family_id,
    f.name as family_name,
    f.short_code as family_code,
    f.created_at as family_created_at,
    (SELECT COUNT(*) FROM profiles p WHERE p.family_id = f.id AND p.role = 'parent') as parent_count,
    (SELECT COUNT(*) FROM profiles p WHERE p.family_id = f.id AND p.role = 'child') as child_count,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', p.id,
        'display_name', p.display_name,
        'birth_date', p.birth_date,
        'created_at', p.created_at
      )), '[]'::jsonb)
      FROM profiles p 
      WHERE p.family_id = f.id AND p.role = 'child'
    ) as children_info
  FROM families f
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY f.created_at DESC
$$;