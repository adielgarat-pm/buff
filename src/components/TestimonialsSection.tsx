import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface Review {
  id: string;
  display_name: string;
  rating: number;
  review_text: string;
  created_at: string;
}

export function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const { language } = useLanguage();
  const isRTL = language === 'he';

  useEffect(() => {
    async function fetchReviews() {
      const { data } = await supabase
        .from('reviews')
        .select('id, display_name, rating, review_text, created_at')
        .eq('status', 'approved')
        .gte('rating', 4)
        .order('created_at', { ascending: false })
        .limit(6);
      if (data) setReviews(data);
    }
    fetchReviews();
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-card/50">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-wide mb-4 text-center">
          {isRTL ? 'מה הורים אומרים' : 'What Parents Say'}
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          {isRTL ? 'משפחות אמיתיות, שינויים אמיתיים' : 'Real families, real transformations'}
        </p>

        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-background rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">
                "{review.review_text}"
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                — {review.display_name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
