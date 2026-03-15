import { useState, useEffect } from 'react';
import { Star, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

export function ReviewNudgeCard() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [visible, setVisible] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    // Show only after 7 days of usage
    const createdAt = new Date(profile.created_at);
    const daysSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) return;

    // Check if already submitted or dismissed
    const dismissed = localStorage.getItem('buff-review-dismissed');
    if (dismissed) return;

    // Check if user already submitted a review
    supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user?.id ?? '')
      .limit(1)
      .then(({ data }) => {
        if (!data || data.length === 0) setVisible(true);
      });
  }, [profile, user]);

  const handleDismiss = () => {
    localStorage.setItem('buff-review-dismissed', Date.now().toString());
    setVisible(false);
  };

  const handleSubmit = async () => {
    if (!user || !profile || rating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      family_id: profile.family_id!,
      user_id: user.id,
      display_name: profile.display_name || 'Parent',
      rating,
      review_text: text.trim(),
      status: 'pending',
    });
    setSubmitting(false);
    if (error) {
      toast({ title: isHe ? 'שגיאה' : 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isHe ? 'תודה! 💚' : 'Thank you! 💚', description: isHe ? 'הביקורת שלך נשלחה' : 'Your review has been submitted' });
      setVisible(false);
      localStorage.setItem('buff-review-dismissed', Date.now().toString());
    }
  };

  if (!visible || profile?.role !== 'parent') return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-5 pb-4">
        {!showForm ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">
                {isHe ? '🌟 נהנים מ-BUFF? ספרו לנו!' : '🌟 Enjoying BUFF? Let us know!'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isHe ? 'עזרו למשפחות אחרות לגלות את BUFF' : 'Help other families discover BUFF'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => setShowForm(true)}>
                {isHe ? 'כתבו ביקורת' : 'Write a Review'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{isHe ? 'איך הייתם מדרגים את BUFF?' : 'How would you rate BUFF?'}</p>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      s <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder={isHe ? 'ספרו לנו על החוויה שלכם...' : 'Tell us about your experience...'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || text.trim().length < 5 || submitting}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? (isHe ? 'שולח...' : 'Sending...') : (isHe ? 'שלחו ביקורת' : 'Submit Review')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
