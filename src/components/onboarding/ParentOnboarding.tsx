import { useState, useCallback } from 'react';
import { OnboardingProgress } from './OnboardingProgress';
import { Step1Profile } from './steps/Step1Profile';
import { Step2FocusArea, FocusArea } from './steps/Step2FocusArea';
import { Step3SchoolFeature, SchoolFeature } from './steps/Step3SchoolFeature';
import { Step4FirstTask } from './steps/Step4FirstTask';
import { Step5Rewards } from './steps/Step5Rewards';
import { Step6ParentTip } from './steps/Step6ParentTip';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData>>({});

  const updateData = useCallback((newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, TOTAL_STEPS)));
  }, []);

  const handleComplete = async () => {
    if (!data.childName || !data.birthDate || !data.focusArea || !data.schoolFeature) {
      return;
    }

    setIsLoading(true);
    try {
      await onComplete({
        childName: data.childName,
        birthDate: data.birthDate,
        focusArea: data.focusArea,
        schoolFeature: data.schoolFeature,
        firstTask: data.firstTask || 'לפתור תרגיל אחד',
        weekendReward: data.weekendReward || 'בילוי משותף',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              childName: data.childName,
              birthDate: data.birthDate,
            }}
            onNext={(stepData) => {
              updateData(stepData);
              goToStep(2);
            }}
          />
        )}
        
        {currentStep === 2 && (
          <Step2FocusArea
            initialValue={data.focusArea}
            onNext={(stepData) => {
              updateData(stepData);
              goToStep(3);
            }}
            onBack={() => goToStep(1)}
          />
        )}
        
        {currentStep === 3 && (
          <Step3SchoolFeature
            initialValue={data.schoolFeature}
            onNext={(stepData) => {
              updateData(stepData);
              goToStep(4);
            }}
            onBack={() => goToStep(2)}
          />
        )}
        
        {currentStep === 4 && (
          <Step4FirstTask
            initialValue={data.firstTask}
            onNext={(stepData) => {
              updateData(stepData);
              goToStep(5);
            }}
            onBack={() => goToStep(3)}
          />
        )}
        
        {currentStep === 5 && (
          <Step5Rewards
            initialValue={data.weekendReward}
            onNext={(stepData) => {
              updateData(stepData);
              goToStep(6);
            }}
            onBack={() => goToStep(4)}
          />
        )}
        
        {currentStep === 6 && (
          <Step6ParentTip
            onComplete={handleComplete}
            onBack={() => goToStep(5)}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
