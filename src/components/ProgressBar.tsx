import { cn } from '@/lib/utils';
import { Trophy, Zap, Star } from 'lucide-react';

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
        ? 'bg-buff/10 border-buff/30 shadow-buff-glow' 
        : 'bg-gradient-card border-border'
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-2xl',
            isComplete ? 'bg-buff/20' : 'bg-primary/20'
          )}>
            {isComplete ? (
              <Trophy className="w-5 h-5 text-buff" />
            ) : (
              <Zap className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h2 className="font-display font-bold text-foreground tracking-wide">Daily XP</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isComplete ? 'Level Complete! 🎉' : 'Keep powering up!'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={cn(
            'text-3xl font-display font-bold',
            isComplete ? 'text-buff' : 'text-gradient'
          )}>
            {earned}
          </span>
          <span className="text-muted-foreground text-lg">/{goal}</span>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">XP</p>
        </div>
      </div>

      {/* XP Progress Bar - Gamified */}
      <div className="relative h-5 bg-secondary rounded-full overflow-hidden border border-border">
        {/* Background shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-xp-shimmer" />
        
        {/* XP Fill */}
        <div 
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out',
            isComplete ? 'bg-gradient-buff' : 'bg-gradient-xp',
            percent > 0 && 'animate-progress-fill'
          )}
          style={{ width: `${percent}%` }}
        />
        
        {/* Glow effect on progress */}
        {percent > 0 && (
          <div 
            className={cn(
              'absolute inset-y-0 rounded-full blur-sm',
              isComplete ? 'bg-buff/50' : 'bg-buff/40'
            )}
            style={{ 
              width: `${percent}%`,
              left: 0,
            }}
          />
        )}

        {/* XP Milestone markers */}
        <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none">
          {[25, 50, 75].map((milestone) => (
            <div
              key={milestone}
              className={cn(
                'w-1 h-3 rounded-full',
                percent >= milestone ? 'bg-buff-foreground/50' : 'bg-muted-foreground/30'
              )}
              style={{ marginLeft: `${milestone - 2}%` }}
            />
          ))}
        </div>
      </div>

      {/* XP Stats Row */}
      <div className="flex justify-between items-center mt-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="w-3 h-3" />
          <span>0 XP</span>
        </div>
        <div className={cn(
          'px-3 py-1 rounded-full text-sm font-bold',
          isComplete 
            ? 'bg-buff/20 text-buff' 
            : 'bg-primary/20 text-primary'
        )}>
          {Math.round(percent)}%
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="w-3 h-3" />
          <span>{goal} XP</span>
        </div>
      </div>
    </div>
  );
}