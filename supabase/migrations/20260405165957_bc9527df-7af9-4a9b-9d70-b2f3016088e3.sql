DROP FUNCTION IF EXISTS public.get_admin_families_overview();

CREATE FUNCTION public.get_admin_families_overview()
RETURNS TABLE(
  family_id uuid,
  family_name text,
  family_code text,
  family_created_at timestamptz,
  parent_count bigint,
  child_count bigint,
  children_info jsonb,
  parents_info jsonb
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
    ) as children_info,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'display_name', p.display_name,
        'email', u.email,
        'preferred_language', p.preferred_language,
        'marketing_consent', p.marketing_consent
      )), '[]'::jsonb)
      FROM profiles p
      LEFT JOIN auth.users u ON u.id = p.user_id
      WHERE p.family_id = f.id AND p.role = 'parent'
    ) as parents_info
  FROM families f
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY f.created_at DESC
$$;