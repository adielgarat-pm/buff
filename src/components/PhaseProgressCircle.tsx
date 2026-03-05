import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { PhaseConfig } from '@/types/phase';

interface PhaseProgressCircleProps {
  phase: PhaseConfig;
  completed: number;
  total: number;
  earnedCredits: number;
  totalCredits: number;
}

export function PhaseProgressCircle({ 
  phase, 
  completed, 
  total, 
  earnedCredits,
  totalCredits 
}: PhaseProgressCircleProps) {
  const { t } = useLanguage();
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = completed === total && total > 0;

  return (
    <div className="w-full space-y-2">
      {/* Visual progress bar — replaces raw numbers */}
      <div className="relative h-3 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            isComplete
              ? "bg-gradient-to-r from-primary to-buff shadow-[0_0_12px_hsl(var(--buff)/0.5)]"
              : "bg-gradient-to-r from-primary/80 to-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Minimal label */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
        <span>
          {completed} / {total} {t('focus.remaining').replace('remaining', '').trim() || ''}
        </span>
        {isComplete && (
          <span className="text-primary font-semibold">
            {t('stage.complete')}
          </span>
        )}
      </div>
    </div>
  );
}
