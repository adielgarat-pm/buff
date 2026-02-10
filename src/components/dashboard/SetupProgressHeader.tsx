import { Progress } from '@/components/ui/progress';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SetupProgressHeaderProps {
  progressPercent: number;
  missingSteps: string[];
  onContinueSetup: () => void;
}

export function SetupProgressHeader({ 
  progressPercent, 
  missingSteps, 
  onContinueSetup 
}: SetupProgressHeaderProps) {
  const { t, isRTL } = useLanguage();

  if (progressPercent >= 100) return null;

  return (
    <button
      onClick={onContinueSetup}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/10 border border-accent/30 hover:bg-accent/15 transition-colors text-right"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {t('setup.almostDone')}
          </span>
          <span className="text-sm font-bold text-accent">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        
        {missingSteps.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t('setup.missing')}: {missingSteps.join(', ')}
          </p>
        )}
      </div>
      
      <ChevronLeft className="w-5 h-5 text-accent flex-shrink-0" />
    </button>
  );
}

// Helper to calculate setup progress
export function calculateSetupProgress(params: {
  hasChildren: boolean;
  hasTasks: boolean;
  hasRewards: boolean;
  hasTimetable: boolean;
}): { percent: number; missing: string[] } {
  // Note: labels here are used by SetupProgressHeader which will translate them
  const steps = [
    { key: 'hasChildren', labelKey: 'setup.addChild', weight: 40 },
    { key: 'hasTasks', labelKey: 'setup.configureTasks', weight: 30 },
    { key: 'hasRewards', labelKey: 'setup.configureRewards', weight: 20 },
    { key: 'hasTimetable', labelKey: 'setup.timetable', weight: 10 },
  ] as const;

  let completedWeight = 0;
  const missing: string[] = [];

  for (const step of steps) {
    if (params[step.key]) {
      completedWeight += step.weight;
    } else {
      missing.push(step.labelKey);
    }
  }

  return {
    percent: completedWeight,
    missing,
  };
}
