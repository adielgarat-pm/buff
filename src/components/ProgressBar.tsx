import { cn } from '@/lib/utils';
import { Trophy, Zap } from 'lucide-react';

interface ProgressBarProps {
  earned: number;
  goal: number;
  percent: number;
}

export function ProgressBar({ earned, goal, percent }: ProgressBarProps) {
  const isComplete = percent >= 100;

  return (
    <div className={cn(
      'rounded-2xl p-6 border transition-all duration-500 glow-overlay',
      isComplete 
        ? 'bg-success/10 border-success/30 shadow-glow' 
        : 'bg-gradient-card border-border'
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isComplete ? 'bg-success/20' : 'bg-primary/20'
          )}>
            {isComplete ? (
              <Trophy className="w-5 h-5 text-success" />
            ) : (
              <Zap className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-foreground">Daily Progress</h2>
            <p className="text-sm text-muted-foreground">
              {isComplete ? 'Goal reached! 🎉' : 'Keep going, you got this!'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={cn(
            'text-3xl font-bold',
            isComplete ? 'text-success' : 'text-gradient'
          )}>
            {earned}
          </span>
          <span className="text-muted-foreground text-lg">/{goal}</span>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Credits</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out',
            isComplete ? 'bg-gradient-success' : 'bg-gradient-primary',
            percent > 0 && 'animate-progress-fill'
          )}
          style={{ width: `${percent}%` }}
        />
        
        {/* Glow effect on progress */}
        {percent > 0 && (
          <div 
            className={cn(
              'absolute inset-y-0 rounded-full blur-sm',
              isComplete ? 'bg-success/50' : 'bg-primary/50'
            )}
            style={{ 
              width: `${percent}%`,
              left: 0,
            }}
          />
        )}
      </div>

      {/* Percentage */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-muted-foreground">0%</span>
        <span className={cn(
          'text-sm font-semibold',
          isComplete ? 'text-success' : 'text-primary'
        )}>
          {Math.round(percent)}%
        </span>
        <span className="text-xs text-muted-foreground">100%</span>
      </div>
    </div>
  );
}
