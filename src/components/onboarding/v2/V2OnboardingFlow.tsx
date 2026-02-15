import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageStep } from './steps/LanguageStep';
import { QuizStep } from './steps/QuizStep';
import { RoadmapStep } from './steps/RoadmapStep';
import { AuthStep } from './steps/AuthStep';
import buffLogo from '@/assets/buff-logo.png';

export interface V2QuizData {
  language: 'en' | 'he';
  childName: string;
  childAge: string;
  morningChallenge: string;
  successGoal: string;
}

export type V2Step = 'language' | 'quiz' | 'roadmap' | 'auth';

interface V2OnboardingFlowProps {
  /** Called after auth completes — navigates to dashboard */
  onComplete: () => void;
}

const STEP_ORDER: V2Step[] = ['language', 'quiz', 'roadmap', 'auth'];

export function V2OnboardingFlow({ onComplete }: V2OnboardingFlowProps) {
  const { t, isRTL } = useLanguage();
  const [currentStep, setCurrentStep] = useState<V2Step>('language');
  const [quizData, setQuizData] = useState<V2QuizData>({
    language: 'en',
    childName: '',
    childAge: '',
    morningChallenge: '',
    successGoal: '',
  });

  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEP_ORDER.length) * 100;

  const goNext = useCallback(() => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[idx + 1]);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(STEP_ORDER[idx - 1]);
    }
  }, [currentStep]);

  const updateQuizData = useCallback((updates: Partial<V2QuizData>) => {
    setQuizData(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <div
      className="min-h-[100dvh] bg-background flex flex-col"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-center pt-4 pb-2">
        <img src={buffLogo} alt="BUFF" className="h-10" />
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-4">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1">
          {t('v2.stepOf').replace('{current}', String(stepIndex + 1)).replace('{total}', String(STEP_ORDER.length))}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-8">
        {currentStep === 'language' && (
          <LanguageStep
            value={quizData.language}
            onChange={(lang) => updateQuizData({ language: lang })}
            onNext={goNext}
          />
        )}

        {currentStep === 'quiz' && (
          <QuizStep
            data={quizData}
            onChange={updateQuizData}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 'roadmap' && (
          <RoadmapStep
            data={quizData}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 'auth' && (
          <AuthStep
            data={quizData}
            onComplete={onComplete}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );
}
