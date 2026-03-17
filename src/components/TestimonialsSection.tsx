import { useEffect, useState } from 'react';
import { Star, Languages } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  display_name: string;
  rating: number;
  review_text: string;
  detected_lang: string;
  translated_text_en: string | null;
  created_at: string;
}

const heMonths = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const enMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const { language } = useLanguage();
  const isRTL = language === 'he';

  useEffect(() => {
    async function fetchReviews() {
      const { data } = await supabase
        .from('reviews')
        .select('id, display_name, rating, review_text, detected_lang, translated_text_en, created_at')
        .eq('status', 'approved')
        .gte('rating', 4)
        .order('created_at', { ascending: false })
        .limit(6);
      if (data) setReviews(data as Review[]);
    }
    fetchReviews();
  }, []);

  if (reviews.length === 0) return null;

  const getDisplayText = (review: Review) => {
    if (isRTL) return review.review_text;
    if (review.detected_lang === 'he' && review.translated_text_en) {
      return showOriginal[review.id] ? review.review_text : review.translated_text_en;
    }
    return review.review_text;
  };

  const getDisplayName = (review: Review) => {
    // In English UI with Hebrew review that has a translation, we could show a transliterated name
    // For now just show the original name as-is
    return review.display_name;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = isRTL ? heMonths[d.getMonth()] : enMonths[d.getMonth()];
    return `${month} ${d.getFullYear()}`;
  };

  const isTranslated = (review: Review) =>
    !isRTL &&
    review.detected_lang === 'he' &&
    review.translated_text_en &&
    !showOriginal[review.id];

  const canToggle = (review: Review) =>
    !isRTL && review.detected_lang === 'he' && review.translated_text_en;

  const toggleOriginal = (id: string) => {
    setShowOriginal((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
              </div>
              <p
                className={cn(
                  'text-sm text-foreground leading-relaxed mb-3',
                  showOriginal[review.id] && review.detected_lang === 'he' && 'text-right dir-rtl'
                )}
                dir={showOriginal[review.id] && review.detected_lang === 'he' ? 'rtl' : undefined}
              >
                "{getDisplayText(review)}"
              </p>

              {canToggle(review) && (
                <button
                  onClick={() => toggleOriginal(review.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-3"
                >
                  <Languages className="w-3 h-3" />
                  {isTranslated(review)
                    ? 'Translated from Hebrew · View Original'
                    : 'View Translation'}
                </button>
              )}

              <p className="text-xs text-muted-foreground font-medium">
                — {getDisplayName(review)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
