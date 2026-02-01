import { cn } from '@/lib/utils';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="w-full px-4 pt-4 pb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">שלב {currentStep} מתוך {totalSteps}</span>
        <span className="text-xs font-medium text-primary">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-l from-primary to-success transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
