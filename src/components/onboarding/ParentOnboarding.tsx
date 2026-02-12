import { useState, useCallback, useEffect } from 'react';
import { OnboardingProgress } from './OnboardingProgress';
import { Step1Profile, GradeOption } from './steps/Step1Profile';
import { Step2FocusArea, FocusArea } from './steps/Step2FocusArea';
import { Step3SchoolFeature, SchoolFeature } from './steps/Step3SchoolFeature';
import { Step4FirstTask } from './steps/Step4FirstTask';
import { Step5Rewards } from './steps/Step5Rewards';
import { Step6ParentTip } from './steps/Step6ParentTip';
import { usePersistentOnboarding } from '@/hooks/usePersistentOnboarding';
import { step1Schema } from '@/schemas/onboarding';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import buffLogo from '@/assets/buff-logo.png';

export interface OnboardingData {
  childName: string;
  birthDate?: Date;
  grade?: GradeOption;
  focusArea: FocusArea;
  schoolFeature: SchoolFeature;
  firstTask: string;
  weekendReward: string;
  childProfileId?: string; // Set after Step 1 early commit
}

interface ParentOnboardingProps {
  onComplete: (data: OnboardingData) => Promise<void>;
}

const TOTAL_STEPS = 6;

export function ParentOnboarding({ onComplete }: ParentOnboardingProps) {
  const { profile } = useAuth();
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
      const nextStep = Math.min(draft.lastCompletedStep + 1, TOTAL_STEPS);
      setCurrentStep(nextStep);
    }
  }, [isHydrated, draft.lastCompletedStep]);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, TOTAL_STEPS)));
  }, []);

  // Step 1: Early commit — INSERT child profile immediately
  const handleStep1Complete = async (stepData: { childName: string; birthDate?: Date; grade?: GradeOption }) => {
    // Validate with Zod
    const result = step1Schema.safeParse(stepData);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || 'נתונים לא תקינים');
      return;
    }

    if (!profile?.family_id) {
      toast.error('לא נמצאה משפחה. נסו לרענן את הדף.');
      return;
    }

    // Check if we already created a child profile (resuming flow)
    if (draft.childProfileId) {
      // Just update local draft and move on
      updateDraft({
        childName: stepData.childName,
        birthDate: stepData.birthDate?.toISOString(),
        grade: stepData.grade,
      });
      completeStep(1);
      goToStep(2);
      return;
    }

    setIsLoading(true);
    try {
      // INSERT child profile early — triggers default tasks/rewards/credit_vault
      const { data: childProfile, error: childError } = await supabase
        .from('profiles')
        .insert({
          display_name: stepData.childName,
          role: 'child' as const,
          family_id: profile.family_id,
          daily_goal: 70,
          ...(stepData.birthDate ? { birth_date: format(stepData.birthDate, 'yyyy-MM-dd') } : {}),
        })
        .select('id')
        .single();

      if (childError) throw childError;

      // Set parent as activated
      await supabase
        .from('profiles')
        .update({ is_activated: true, onboarding_step: 1 })
        .eq('id', profile.id);

      // Save child profile ID + data to draft
      updateDraft({
        childName: stepData.childName,
        birthDate: stepData.birthDate?.toISOString(),
        grade: stepData.grade,
        childProfileId: childProfile.id,
      });
      completeStep(1);
      goToStep(2);
    } catch (error: any) {
      console.error('Step 1 commit failed:', error);
      toast.error('שגיאה ביצירת הפרופיל. בדקו את החיבור לאינטרנט ונסו שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  // Steps 2-5: UPDATE the existing child profile
  const handleStepUpdate = async (
    step: number,
    updates: Partial<{
      focusArea: FocusArea;
      schoolFeature: SchoolFeature;
      firstTask: string;
      weekendReward: string;
    }>,
    nextStep: number
  ) => {
    // Update local draft
    updateDraft(updates);

    // Update child profile in DB if applicable (steps 2-3 affect child profile)
    if (draft.childProfileId && (updates.schoolFeature !== undefined)) {
      try {
        await supabase
          .from('profiles')
          .update({
            school_quest_enabled: updates.schoolFeature === 'school_quest',
            bag_prep_enabled: updates.schoolFeature === 'evening_prep',
          })
          .eq('id', draft.childProfileId);
      } catch (e) {
        console.warn('Failed to update child profile:', e);
      }
    }

    // Update parent's onboarding_step
    if (profile?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ onboarding_step: step })
          .eq('id', profile.id);
      } catch (e) {
        console.warn('Failed to update onboarding step:', e);
      }
    }

    completeStep(step);
    goToStep(nextStep);
  };

  const handleComplete = async () => {
    const birthDate = getBirthDate();
    if (!draft.childName || !draft.focusArea || !draft.schoolFeature) {
      return;
    }

    setIsLoading(true);
    try {
      await onComplete({
        childName: draft.childName,
        birthDate: birthDate,
        grade: draft.grade ?? undefined,
        focusArea: draft.focusArea,
        schoolFeature: draft.schoolFeature,
        firstTask: draft.firstTask || 'לפתור תרגיל אחד',
        weekendReward: draft.weekendReward || 'בילוי משותף',
        childProfileId: draft.childProfileId,
      });
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
              grade: draft.grade ?? undefined,
            }}
            onNext={handleStep1Complete}
            isLoading={isLoading}
          />
        )}
        
        {currentStep === 2 && (
          <Step2FocusArea
            childName={draft.childName}
            initialValue={draft.focusArea}
            onNext={(stepData) => handleStepUpdate(2, { focusArea: stepData.focusArea }, 3)}
            onBack={() => goToStep(1)}
          />
        )}
        
        {currentStep === 3 && (
          <Step3SchoolFeature
            initialValue={draft.schoolFeature}
            focusArea={draft.focusArea}
            onNext={(stepData) => handleStepUpdate(3, { schoolFeature: stepData.schoolFeature }, 4)}
            onBack={() => goToStep(2)}
          />
        )}
        
        {currentStep === 4 && (
          <Step4FirstTask
            initialValue={draft.firstTask}
            onNext={(stepData) => handleStepUpdate(4, { firstTask: stepData.firstTask }, 5)}
            onBack={() => goToStep(3)}
          />
        )}
        
        {currentStep === 5 && (
          <Step5Rewards
            initialValue={draft.weekendReward}
            onNext={(stepData) => handleStepUpdate(5, { weekendReward: stepData.weekendReward }, 6)}
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
