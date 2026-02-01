import { Progress } from '@/components/ui/progress';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

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
  // Don't show if setup is complete
  if (progressPercent >= 100) return null;

  return (
    <button
      onClick={onContinueSetup}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/10 border border-accent/30 hover:bg-accent/15 transition-colors text-right"
      dir="rtl"
    >
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            נשאר רק עוד קצת כדי להשלים את הגדרת BUFF
          </span>
          <span className="text-sm font-bold text-accent">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        
        {missingSteps.length > 0 && (
          <p className="text-xs text-muted-foreground">
            חסר: {missingSteps.join(', ')}
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
  const steps = [
    { key: 'hasChildren', label: 'הוספת ילד', weight: 40 },
    { key: 'hasTasks', label: 'הגדרת משימות', weight: 30 },
    { key: 'hasRewards', label: 'הגדרת פרסים', weight: 20 },
    { key: 'hasTimetable', label: 'מערכת שעות', weight: 10 },
  ] as const;

  let completedWeight = 0;
  const missing: string[] = [];

  for (const step of steps) {
    if (params[step.key]) {
      completedWeight += step.weight;
    } else {
      missing.push(step.label);
    }
  }

  return {
    percent: completedWeight,
    missing,
  };
}
