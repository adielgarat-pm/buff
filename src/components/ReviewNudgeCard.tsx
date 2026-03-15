import { useState, useEffect } from 'react';
import { Star, X, Send, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import buffLogo from '@/assets/buff-logo-no-bg.png';

const SUCCESS_TAGS = [
  { emoji: '🔥', en: 'Motivation', he: 'מוטיבציה', featured: true },
  { emoji: '🧘', en: 'Fewer Shouts', he: 'פחות צעקות' },
  { emoji: '☀️', en: 'Morning Independence', he: 'עצמאות בבוקר' },
  { emoji: '😊', en: 'Smiling Child', he: 'ילדים מחייכים' },
  { emoji: '☕', en: 'Quiet Coffee Time', he: 'זמן לקפה בבוקר' },
  { emoji: '🚀', en: 'Zero Friction', he: 'אפס חיכוך' },
] as const;

type Step = 'prompt' | 'stars' | 'tags' | 'text' | 'thanks';

export function ReviewNudgeCard() {
  const { user, profile } = useAuth();
  const { language, t } = useLanguage();
  const isHe = language === 'he';
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('prompt');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    const createdAt = new Date(user.created_at);
    const daysSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) return;

    const dismissed = localStorage.getItem('buff-review-dismissed');
    if (dismissed) return;

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

  const handleStarTap = (star: number) => {
    setRating(star);
    // Auto-advance to tags after brief delay
    setTimeout(() => setStep('tags'), 300);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!user || !profile || rating === 0) return;
    setSubmitting(true);

    // Combine tags + optional text into review_text
    const tagLabels = selectedTags.join(', ');
    const fullText = [tagLabels, text.trim()].filter(Boolean).join(' — ');

    const { error } = await supabase.from('reviews').insert({
      family_id: profile.family_id!,
      user_id: user.id,
      display_name: profile.display_name || 'Parent',
      rating,
      review_text: fullText,
      status: 'pending',
    });

    // Track review_submitted flag in onboarding_data
    if (!error) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('onboarding_data')
        .eq('id', profile.id)
        .single();

      const existingData = typeof currentProfile?.onboarding_data === 'object' && currentProfile?.onboarding_data !== null
        ? currentProfile.onboarding_data
        : {};

      await supabase
        .from('profiles')
        .update({
          onboarding_data: {
            ...existingData,
            review_submitted: true,
            review_submitted_at: new Date().toISOString(),
          } as any,
        })
        .eq('id', profile.id);
    }

    setSubmitting(false);
    if (error) {
      toast({ title: isHe ? 'שגיאה' : 'Error', description: error.message, variant: 'destructive' });
    } else {
      setStep('thanks');
      localStorage.setItem('buff-review-dismissed', Date.now().toString());
    }
  };

  if (!visible || profile?.role !== 'parent') return null;

  return (
    <Card className="border-primary/20 bg-primary/5 overflow-hidden">
      <CardContent className="pt-5 pb-4">
        {/* Step: Initial Prompt */}
        {step === 'prompt' && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <img src={buffLogo} alt="BUFF" className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-sm font-semibold">
                  {isHe ? '🌟 נהנים מ-BUFF? ספרו לנו!' : '🌟 Enjoying BUFF? Let us know!'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isHe ? 'עזרו למשפחות אחרות לגלות את BUFF' : 'Help other families discover BUFF'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => setStep('stars')}>
                {isHe ? 'דרגו אותנו' : 'Rate Us'}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Star Rating (one-tap) */}
        {step === 'stars' && (
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {isHe ? 'איך הייתם מדרגים את BUFF?' : 'How would you rate BUFF?'}
              </p>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStarTap(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 transition-all hover:scale-125 active:scale-95"
                >
                  <Star
                    className={cn(
                      'w-9 h-9 transition-colors',
                      s <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {isHe ? 'לחצו על כוכב כדי להמשיך' : 'Tap a star to continue'}
            </p>
          </div>
        )}

        {/* Step: Success Tags */}
        {step === 'tags' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {isHe ? 'מה ה-Win הכי גדול שלכם?' : "What's your biggest win?"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isHe ? 'בחרו כמה שתרצו (לא חובה)' : 'Select as many as you like (optional)'}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Rating display */}
            <div className="flex justify-center gap-0.5 mb-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    'w-4 h-4',
                    s <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'
                  )}
                />
              ))}
            </div>

            {/* Tags grid */}
            <div className={cn('flex flex-wrap gap-2', isHe ? 'justify-end' : 'justify-start')}>
              {SUCCESS_TAGS.map((tag) => {
                const label = `${tag.emoji} ${isHe ? tag.he : tag.en}`;
                const isSelected = selectedTags.includes(label);
                return (
                  <button
                    key={tag.en}
                    onClick={() => toggleTag(label)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      'hover:scale-105 active:scale-95',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'featured' in tag && tag.featured
                          ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                          : 'bg-background border-border text-foreground hover:border-primary/40'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setStep('text')}
              >
                {isHe ? 'הוסיפו מילים' : 'Add a note'}
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting}
              >
                <Send className="w-3.5 h-3.5" />
                {submitting
                  ? isHe ? 'שולח...' : 'Sending...'
                  : isHe ? 'שליחה' : 'Submit'}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Optional text */}
        {step === 'text' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {isHe ? 'רוצים להוסיף עוד?' : 'Want to share more?'}
              </p>
              <Button size="sm" variant="ghost" onClick={() => setStep('tags')}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Show selected tags */}
            {selectedTags.length > 0 && (
              <div className={cn('flex flex-wrap gap-1.5', isHe ? 'justify-end' : 'justify-start')}>
                {selectedTags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <Textarea
              placeholder={isHe ? 'ספרו לנו על החוויה שלכם...' : 'Tell us about your experience...'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-center">
              {isHe ? '⭐ הכוכבים והתגיות מספיקים! הטקסט הוא בונוס' : '⭐ Stars & tags are enough! Text is a bonus'}
            </p>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
            >
              <Send className="w-4 h-4" />
              {submitting
                ? isHe ? 'שולח...' : 'Sending...'
                : isHe ? 'שליחה' : 'Submit Review'}
            </Button>
          </div>
        )}

        {/* Step: Thank You / Parent Reward */}
        {step === 'thanks' && (
          <div className="text-center space-y-3 py-2">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-base font-bold">
                {isHe ? 'תודה ששיתפתם את הקסם! 💚' : 'Thank you for sharing the magic! 💚'}
              </p>
              <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                {isHe
                  ? 'אנחנו עוקבים אחרי התרומה שלכם כדי לפתוח מודולים ובונוסים בלעדיים להורים בקרוב.'
                  : "We're tracking your contributions to unlock exclusive parent-only modules and treats soon."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-medium">
              <Heart className="w-3.5 h-3.5 fill-primary" />
              {isHe ? 'חבר/ת BUFF VIP' : 'BUFF VIP Member'}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setVisible(false)}>
              {isHe ? 'סגור' : 'Close'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
