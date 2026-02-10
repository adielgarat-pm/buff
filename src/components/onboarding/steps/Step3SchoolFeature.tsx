import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { OnboardingCard } from '../OnboardingCard';
import { School, Moon, Focus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type SchoolFeature = 'school_quest' | 'evening_prep';

interface Step3SchoolFeatureProps {
  initialValue?: SchoolFeature;
  onNext: (data: { schoolFeature: SchoolFeature }) => void;
  onBack: () => void;
}

export function Step3SchoolFeature({ initialValue, onNext, onBack }: Step3SchoolFeatureProps) {
  const { t, isRTL } = useLanguage();
  const [selected, setSelected] = useState<SchoolFeature | null>(initialValue || null);

  useEffect(() => {
    if (initialValue) setSelected(initialValue);
  }, [initialValue]);

  const handleNext = () => {
    if (selected) {
      onNext({ schoolFeature: selected });
    }
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
            <School className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-base font-bold text-foreground">
            {t('onboarding.step3.title')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('onboarding.step3.subtitle')}
          </p>
        </div>

        <div className="space-y-2">
          <OnboardingCard
            emoji="🎯"
            title={t('onboarding.step3.schoolQuest')}
            description={t('onboarding.step3.schoolQuestDesc')}
            selected={selected === 'school_quest'}
            onClick={() => setSelected('school_quest')}
          >
            <div className="mt-1.5 flex items-center gap-2 text-xs text-success">
              <Focus className="w-3.5 h-3.5" />
              <span>{t('onboarding.step3.schoolQuestHint')}</span>
            </div>
          </OnboardingCard>

          <OnboardingCard
            emoji="🌙"
            title={t('onboarding.step3.eveningPrep')}
            description={t('onboarding.step3.eveningPrepDesc')}
            selected={selected === 'evening_prep'}
            onClick={() => setSelected('evening_prep')}
          >
            <div className="mt-1.5 flex items-center gap-2 text-xs text-success">
              <Moon className="w-3.5 h-3.5" />
              <span>{t('onboarding.step3.eveningPrepHint')}</span>
            </div>
          </OnboardingCard>
        </div>

        <div className="p-2.5 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground">
            {t('onboarding.step3.note')}
          </p>
        </div>
      </div>

      <div className="px-5 pb-6 pt-3 flex-shrink-0 bg-background">
        <Button 
          onClick={handleNext}
          disabled={!selected}
          className="w-full h-11 font-bold rounded-xl bg-gradient-to-l from-primary to-success"
        >
          {t('onboarding.step3.cta')}
        </Button>
      </div>
    </div>
  );
}
