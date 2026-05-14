
-- Add detected_lang to public_reviews view so the landing page can show language toggle
DROP VIEW IF EXISTS public.public_reviews;
CREATE OR REPLACE VIEW public.public_reviews WITH (security_invoker = true) AS
SELECT id, display_name, display_name_en, rating, review_text, translated_text_en, detected_lang, status, created_at
FROM public.reviews
WHERE status = 'approved';

GRANT SELECT ON public.public_reviews TO anon, authenticated;
