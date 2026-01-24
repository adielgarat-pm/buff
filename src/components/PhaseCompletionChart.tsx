import { PhaseInsight } from '@/hooks/useParentInsights';
import { cn } from '@/lib/utils';
import { PHASES } from '@/types/phase';

interface PhaseCompletionChartProps {
  phaseInsights: PhaseInsight[];
}

export function PhaseCompletionChart({ phaseInsights }: PhaseCompletionChartProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {PHASES.map(phase => {
        const insight = phaseInsights.find(p => p.phase === phase.id);
        const rate = insight?.avgCompletionRate || 0;
        const isLow = rate < 50;
        const isMedium = rate >= 50 && rate < 70;
        
        return (
          <div 
            key={phase.id}
            className="flex flex-col items-center p-3 rounded-xl bg-secondary/30 border border-border"
          >
            <span className="text-2xl mb-1">{phase.icon}</span>
            <p className="text-xs text-muted-foreground text-center mb-2">
              {phase.shortLabel}
            </p>
            
            {/* Circular progress indicator */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-muted/30"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={`${(rate / 100) * 125.6} 125.6`}
                  strokeLinecap="round"
                  className={cn(
                    'transition-all duration-500',
                    isLow ? 'text-rose-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn(
                  'text-xs font-bold',
                  isLow ? 'text-rose-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'
                )}>
                  {Math.round(rate)}%
                </span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mt-1">
              {insight?.taskCount || 0} tasks
            </p>
          </div>
        );
      })}
    </div>
  );
}
