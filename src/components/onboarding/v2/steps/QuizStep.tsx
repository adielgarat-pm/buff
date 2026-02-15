import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { V2QuizData } from '../V2OnboardingFlow';

interface QuizStepProps {
  data: V2QuizData;
  onChange: (updates: Partial<V2QuizData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const CHALLENGE_OPTIONS_EN = [
  { key: 'getting_up', emoji: '⏰', label: 'Getting out of bed' },
  { key: 'getting_ready', emoji: '👕', label: 'Getting dressed & ready' },
  { key: 'remembering', emoji: '🎒', label: 'Remembering everything' },
  { key: 'starting_homework', emoji: '📚', label: 'Starting homework' },
];

const CHALLENGE_OPTIONS_HE = [
  { key: 'getting_up', emoji: '⏰', label: 'לקום בבוקר' },
  { key: 'getting_ready', emoji: '👕', label: 'להתארגן ולצאת' },
  { key: 'remembering', emoji: '🎒', label: 'לזכור הכל' },
  { key: 'starting_homework', emoji: '📚', label: 'להתחיל שיעורי בית' },
];

const GOAL_OPTIONS_EN = [
  { key: 'independence', emoji: '🦸', label: 'More independence' },
  { key: 'confidence', emoji: '💪', label: 'More confidence' },
  { key: 'organization', emoji: '📋', label: 'Better organization' },
  { key: 'calm_mornings', emoji: '🌅', label: 'Calmer mornings' },
];

const GOAL_OPTIONS_HE = [
  { key: 'independence', emoji: '🦸', label: 'עצמאות' },
  { key: 'confidence', emoji: '💪', label: 'ביטחון עצמי' },
  { key: 'organization', emoji: '📋', label: 'ארגון טוב יותר' },
  { key: 'calm_mornings', emoji: '🌅', label: 'בקרים רגועים' },
];

export function QuizStep({ data, onChange, onNext, onBack }: QuizStepProps) {
  const { t, isRTL } = useLanguage();
  const [subStep, setSubStep] = useState(0);

  const challenges = data.language === 'he' ? CHALLENGE_OPTIONS_HE : CHALLENGE_OPTIONS_EN;
  const goals = data.language === 'he' ? GOAL_OPTIONS_HE : GOAL_OPTIONS_EN;

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  const canProceed = () => {
    switch (subStep) {
      case 0: return data.childName.trim().length > 0;
      case 1: return data.childAge.trim().length > 0;
      case 2: return data.morningChallenge.length > 0;
      case 3: return data.successGoal.length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (subStep < 3) {
      setSubStep(s => s + 1);
    } else {
      onNext();
    }
  };

  const handleBack = () => {
    if (subStep > 0) {
      setSubStep(s => s - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-4 max-w-sm mx-auto">
      {/* Back button */}
      <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors self-start">
        <BackIcon className="w-4 h-4" />
        {t('v2.back')}
      </button>

      {/* Sub-step 0: Child name */}
      {subStep === 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-xl font-bold text-foreground">{t('v2.quizNameTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('v2.quizNameDesc')}</p>
          <div className="space-y-2">
            <Label htmlFor="child-name">{t('v2.childNameLabel')}</Label>
            <Input
              id="child-name"
              value={data.childName}
              onChange={(e) => onChange({ childName: e.target.value })}
              placeholder={t('v2.childNamePlaceholder')}
              className="h-12 text-base rounded-xl"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Sub-step 1: Age */}
      {subStep === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-xl font-bold text-foreground">
            {t('v2.quizAgeTitle').replace('{name}', data.childName)}
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {['6-8', '9-11', '12-14', '15-17'].map((range) => (
              <button
                key={range}
                onClick={() => onChange({ childAge: range })}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  data.childAge === range
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sub-step 2: Morning challenge */}
      {subStep === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-xl font-bold text-foreground">
            {t('v2.quizChallengeTitle').replace('{name}', data.childName)}
          </h2>
          <p className="text-sm text-muted-foreground">{t('v2.quizChallengeDesc')}</p>
          <div className="space-y-2">
            {challenges.map((opt) => (
              <button
                key={opt.key}
                onClick={() => onChange({ morningChallenge: opt.key })}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-start transition-all ${
                  data.morningChallenge === opt.key
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="font-medium text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sub-step 3: Success goal */}
      {subStep === 3 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-xl font-bold text-foreground">
            {t('v2.quizGoalTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('v2.quizGoalDesc')}</p>
          <div className="space-y-2">
            {goals.map((opt) => (
              <button
                key={opt.key}
                onClick={() => onChange({ successGoal: opt.key })}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-start transition-all ${
                  data.successGoal === opt.key
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="font-medium text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Continue button */}
      <Button
        onClick={handleNext}
        disabled={!canProceed()}
        className="w-full rounded-2xl h-12 text-base mt-2"
        size="lg"
      >
        {subStep < 3 ? t('v2.continue') : t('v2.seeMyPlan')}
      </Button>
    </div>
  );
}
