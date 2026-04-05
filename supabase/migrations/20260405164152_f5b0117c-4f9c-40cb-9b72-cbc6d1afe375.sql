CREATE OR REPLACE FUNCTION public.get_admin_profiles_overview()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        p.is_activated,
        p.marketing_consent,
        COALESCE(p.onboarding_step, 0) as onboarding_step,
        p.created_at,
        f.name as family_name,
        f.short_code as family_code,
        p.preferred_language,
        u.email
      FROM profiles p
      LEFT JOIN families f ON f.id = p.family_id
      LEFT JOIN auth.users u ON u.id = p.user_id
    ) profile_data
  );
END;
$function$;