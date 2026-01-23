import { Phase, PHASES, getPhaseConfig } from '@/types/phase';
import { cn } from '@/lib/utils';

interface PhaseNavigationProps {
  activePhase: Phase;
  currentPhase: Phase;
  onPhaseChange: (phase: Phase) => void;
  phaseStats: Record<Phase, { completed: number; total: number }>;
}

export function PhaseNavigation({ 
  activePhase, 
  currentPhase, 
  onPhaseChange,
  phaseStats 
}: PhaseNavigationProps) {
  return (
    <div className="flex gap-1 p-1 bg-secondary/50 rounded-2xl backdrop-blur-sm">
      {PHASES.map((phase) => {
        const isActive = activePhase === phase.id;
        const isCurrent = currentPhase === phase.id;
        const stats = phaseStats[phase.id];
        const isComplete = stats.total > 0 && stats.completed === stats.total;
        
        return (
          <button
            key={phase.id}
            onClick={() => onPhaseChange(phase.id)}
            className={cn(
              "relative flex-1 flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-300",
              isActive 
                ? "bg-card shadow-lg" 
                : "hover:bg-secondary/80",
              isCurrent && !isActive && "ring-1 ring-primary/30"
            )}
          >
            {/* Current phase indicator */}
            {isCurrent && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
            
            {/* Icon */}
            <span className="text-lg mb-1">{phase.icon}</span>
            
            {/* Label */}
            <span className={cn(
              "text-xs font-medium transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}>
              {phase.shortLabel}
            </span>
            
            {/* Stats */}
            {stats.total > 0 && (
              <span className={cn(
                "text-[10px] mt-0.5",
                isComplete ? "text-primary" : "text-muted-foreground"
              )}>
                {stats.completed}/{stats.total}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
