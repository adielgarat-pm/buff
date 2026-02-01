import { useState, useCallback, useEffect } from 'react';
import { OnboardingProgress } from './OnboardingProgress';
import { Step1Profile } from './steps/Step1Profile';
import { Step2FocusArea, FocusArea } from './steps/Step2FocusArea';
import { Step3SchoolFeature, SchoolFeature } from './steps/Step3SchoolFeature';
import { Step4FirstTask } from './steps/Step4FirstTask';
import { Step5Rewards } from './steps/Step5Rewards';
import { Step6ParentTip } from './steps/Step6ParentTip';
import { usePersistentOnboarding } from '@/hooks/usePersistentOnboarding';
import buffLogo from '@/assets/buff-logo.png';

export interface OnboardingData {
  childName: string;
  birthDate: Date;
  focusArea: FocusArea;
  schoolFeature: SchoolFeature;
  firstTask: string;
  weekendReward: string;
}

interface ParentOnboardingProps {
  onComplete: (data: OnboardingData) => Promise<void>;
}

const TOTAL_STEPS = 6;

export function ParentOnboarding({ onComplete }: ParentOnboardingProps) {
  const { 
    draft, 
    isHydrated, 
    updateDraft, 
    completeStep, 
    clearDraft,
    getBirthDate 
  } = usePersistentOnboarding();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Restore step from persistent state on hydration
  useEffect(() => {
    if (isHydrated && draft.lastCompletedStep > 0) {
      // Go to the next uncompleted step (or the last one if all completed)
      const nextStep = Math.min(draft.lastCompletedStep + 1, TOTAL_STEPS);
      setCurrentStep(nextStep);
    }
  }, [isHydrated, draft.lastCompletedStep]);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, TOTAL_STEPS)));
  }, []);

  const handleComplete = async () => {
    const birthDate = getBirthDate();
    if (!draft.childName || !birthDate || !draft.focusArea || !draft.schoolFeature) {
      return;
    }

    setIsLoading(true);
    try {
      await onComplete({
        childName: draft.childName,
        birthDate: birthDate,
        focusArea: draft.focusArea,
        schoolFeature: draft.schoolFeature,
        firstTask: draft.firstTask || 'לפתור תרגיל אחד',
        weekendReward: draft.weekendReward || 'בילוי משותף',
      });
      // Clear the draft after successful completion
      await clearDraft();
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading skeleton while hydrating
  if (!isHydrated) {
    return (
      <div className="theme-parent-zen h-full bg-background flex flex-col items-center justify-center" dir="rtl">
        <img src={buffLogo} alt="BUFF" className="h-12 animate-pulse" />
        <p className="text-muted-foreground mt-4 text-sm">טוען נתונים...</p>
      </div>
    );
  }

  return (
    <div className="theme-parent-zen h-full bg-background flex flex-col" dir="rtl">
      {/* Header with Logo */}
      <div className="flex items-center justify-center pt-4 pb-2">
        <img src={buffLogo} alt="BUFF" className="h-10" />
      </div>

      {/* Progress Bar */}
      <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {currentStep === 1 && (
          <Step1Profile
            initialData={{
              childName: draft.childName,
              birthDate: getBirthDate(),
            }}
            onNext={(stepData) => {
              updateDraft({
                childName: stepData.childName,
                birthDate: stepData.birthDate.toISOString(),
              });
              completeStep(1);
              goToStep(2);
            }}
          />
        )}
        
        {currentStep === 2 && (
          <Step2FocusArea
            initialValue={draft.focusArea}
            onNext={(stepData) => {
              updateDraft({ focusArea: stepData.focusArea });
              completeStep(2);
              goToStep(3);
            }}
            onBack={() => goToStep(1)}
          />
        )}
        
        {currentStep === 3 && (
          <Step3SchoolFeature
            initialValue={draft.schoolFeature}
            onNext={(stepData) => {
              updateDraft({ schoolFeature: stepData.schoolFeature });
              completeStep(3);
              goToStep(4);
            }}
            onBack={() => goToStep(2)}
          />
        )}
        
        {currentStep === 4 && (
          <Step4FirstTask
            initialValue={draft.firstTask}
            onNext={(stepData) => {
              updateDraft({ firstTask: stepData.firstTask });
              completeStep(4);
              goToStep(5);
            }}
            onBack={() => goToStep(3)}
          />
        )}
        
        {currentStep === 5 && (
          <Step5Rewards
            initialValue={draft.weekendReward}
            onNext={(stepData) => {
              updateDraft({ weekendReward: stepData.weekendReward });
              completeStep(5);
              goToStep(6);
            }}
            onBack={() => goToStep(4)}
          />
        )}
        
        {currentStep === 6 && (
          <Step6ParentTip
            childName={draft.childName || 'הילד/ה'}
            onComplete={handleComplete}
            onBack={() => goToStep(5)}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
