
-- Recreate public_reviews view as SECURITY INVOKER (not DEFINER)
DROP VIEW IF EXISTS public.public_reviews;
CREATE OR REPLACE VIEW public.public_reviews WITH (security_invoker = true) AS
SELECT id, display_name, display_name_en, rating, review_text, translated_text_en, status, created_at
FROM public.reviews
WHERE status = 'approved';

GRANT SELECT ON public.public_reviews TO anon, authenticated;
