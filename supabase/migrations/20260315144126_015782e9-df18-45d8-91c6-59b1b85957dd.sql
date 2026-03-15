ALTER TABLE public.reviews 
ADD COLUMN detected_lang text NOT NULL DEFAULT 'he',
ADD COLUMN translated_text_en text DEFAULT NULL;