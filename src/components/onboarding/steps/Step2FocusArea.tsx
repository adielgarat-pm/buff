import { OnboardingCard } from '../OnboardingCard';
import { Target, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type FocusArea = 'homework' | 'project' | 'fitness' | 'home';

interface Step2FocusAreaProps {
  initialValue?: FocusArea;
  onNext: (data: { focusArea: FocusArea }) => void;
  onBack: () => void;
}

export function Step2FocusArea({ initialValue, onNext, onBack }: Step2FocusAreaProps) {
  const { t, isRTL } = useLanguage();

  const FOCUS_OPTIONS: { id: FocusArea; emoji: string; titleKey: string; descKey: string }[] = [
    { id: 'homework', emoji: '🎓', titleKey: 'onboarding.step2.homework', descKey: 'onboarding.step2.homeworkDesc' },
    { id: 'project', emoji: '🚀', titleKey: 'onboarding.step2.project', descKey: 'onboarding.step2.projectDesc' },
    { id: 'fitness', emoji: '⚡', titleKey: 'onboarding.step2.fitness', descKey: 'onboarding.step2.fitnessDesc' },
    { id: 'home', emoji: '🏠', titleKey: 'onboarding.step2.home', descKey: 'onboarding.step2.homeDesc' },
  ];

  const handleSelect = (focusArea: FocusArea) => {
    onNext({ focusArea });
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
            <Target className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-base font-bold text-foreground leading-tight">
            {t('onboarding.step2.title')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('onboarding.step2.subtitle')}
          </p>
        </div>

        <div className="space-y-1.5">
          {FOCUS_OPTIONS.map((option) => (
            <OnboardingCard
              key={option.id}
              emoji={option.emoji}
              title={t(option.titleKey)}
              description={t(option.descKey)}
              selected={initialValue === option.id}
              onClick={() => handleSelect(option.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
