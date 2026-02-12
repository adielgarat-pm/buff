
-- Admin function to list all profiles with pro status
CREATE OR REPLACE FUNCTION public.get_admin_profiles_overview()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  RETURN (
    SELECT json_agg(profile_data ORDER BY profile_data.created_at DESC)
    FROM (
      SELECT
        p.id,
        p.user_id,
        p.display_name,
        p.role,
        p.family_id,
        p.is_pro,
        p.is_lifetime_access,
        p.created_at,
        f.name as family_name,
        f.short_code as family_code,
        u.email
      FROM profiles p
      LEFT JOIN families f ON f.id = p.family_id
      LEFT JOIN auth.users u ON u.id = p.user_id
    ) profile_data
  );
END;
$$;

-- Admin function to toggle pro status for a profile
CREATE OR REPLACE FUNCTION public.admin_set_pro_status(
  p_profile_id uuid,
  p_is_pro boolean DEFAULT NULL,
  p_is_lifetime_access boolean DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  UPDATE profiles
  SET
    is_pro = COALESCE(p_is_pro, is_pro),
    is_lifetime_access = COALESCE(p_is_lifetime_access, is_lifetime_access),
    updated_at = NOW()
  WHERE id = p_profile_id;

  RETURN json_build_object('success', true);
END;
$$;
