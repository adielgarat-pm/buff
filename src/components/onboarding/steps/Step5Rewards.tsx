import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Star, TrendingUp, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Step5RewardsProps {
  initialValue?: string;
  onNext: (data: { weekendReward: string }) => void;
  onBack: () => void;
}

export function Step5Rewards({ initialValue, onNext, onBack }: Step5RewardsProps) {
  const { t, isRTL } = useLanguage();
  const [weekendReward, setWeekendReward] = useState(initialValue || '');

  useEffect(() => {
    if (initialValue) setWeekendReward(initialValue);
  }, [initialValue]);

  const handleNext = () => {
    onNext({ weekendReward: weekendReward.trim() || t('onboarding.step5.defaultReward') });
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex-1 px-5 py-3 space-y-3 overflow-y-auto">
        <div className="text-center space-y-1 relative">
          <button
            type="button"
            onClick={onBack}
            className={`absolute ${isRTL ? 'right-0 -mr-1.5' : 'left-0 -ml-1.5'} top-0 p-1.5 rounded-full hover:bg-muted transition-colors`}
            aria-label={t('onboarding.step1.back')}
          >
            <BackArrow className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-base font-bold text-foreground">
            {t('onboarding.step5.title')}
          </h1>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-start gap-2 p-2 rounded-xl bg-card border border-border">
            <Star className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: t('onboarding.step5.tip1') }} />
          </div>
          
          <div className="flex items-start gap-2 p-2 rounded-xl bg-card border border-border">
            <TrendingUp className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: t('onboarding.step5.tip2') }} />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-muted/50 border border-border space-y-1">
          <p className="text-sm font-medium text-foreground">{t('onboarding.step5.rewardIdeas')}</p>
          <div className="flex flex-wrap gap-1.5">
            {[t('onboarding.step5.reward1'), t('onboarding.step5.reward2'), t('onboarding.step5.reward3'), t('onboarding.step5.reward4')].map((reward) => (
              <span 
                key={reward} 
                className="text-xs px-2 py-0.5 rounded-full bg-background border border-border"
              >
                {reward}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="weekendReward" className="block font-semibold text-sm">
            {t('onboarding.step5.label')}
          </Label>
          <Input
            id="weekendReward"
            value={weekendReward}
            onChange={(e) => setWeekendReward(e.target.value)}
            placeholder={t('onboarding.step5.placeholder')}
            className="h-11 text-base"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
      </div>

      <div className="px-5 pb-6 pt-3 flex-shrink-0 bg-background">
        <Button 
          onClick={handleNext}
          className="w-full h-11 font-bold rounded-xl bg-gradient-to-l from-primary to-success"
        >
          {t('onboarding.step5.cta')}
        </Button>
      </div>
    </div>
  );
}
