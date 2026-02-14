import { Phase, PHASES, getPhaseConfig } from '@/types/phase';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface PhaseNavigationProps {
  activePhase: Phase;
  currentPhase: Phase;
  onPhaseChange: (phase: Phase) => void;
  phaseStats: Record<Phase, { completed: number; total: number }>;
  schoolQuestEnabled?: boolean;
  isTeen?: boolean;
}

export function PhaseNavigation({ 
  activePhase, 
  currentPhase, 
  onPhaseChange,
  phaseStats,
  schoolQuestEnabled = true,
  isTeen = false,
}: PhaseNavigationProps) {
  const { language } = useLanguage();

  // Teen terminology: "missions" → "objectives"
  const TEEN_LABELS_HE: Record<Phase, string> = {
    morning: 'בוקר',
    school: 'לימודים',
    afternoon: 'אחה״צ',
    evening: 'ערב',
  };
  const TEEN_LABELS_EN: Record<Phase, string> = {
    morning: 'AM Ops',
    school: 'School',
    afternoon: 'PM Ops',
    evening: 'Night Ops',
  };

  const handlePhaseChange = (phase: Phase) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onPhaseChange(phase);
  };

  // Filter out school phase if disabled
  const visiblePhases = PHASES.filter(phase => {
    if (phase.id === 'school' && !schoolQuestEnabled) return false;
    return true;
  });
  
  return (
    <div className="flex gap-1 p-1.5 bg-secondary/50 rounded-2xl backdrop-blur-sm">
      {visiblePhases.map((phase) => {
        const isActive = activePhase === phase.id;
        const isCurrent = currentPhase === phase.id;
        const stats = phaseStats[phase.id];
        const isComplete = stats.total > 0 && stats.completed === stats.total;
        const label = isTeen
          ? (language === 'he' ? TEEN_LABELS_HE[phase.id] : TEEN_LABELS_EN[phase.id])
          : (language === 'he' ? phase.shortLabelHe : phase.shortLabel);
        
        return (
          <button
            key={phase.id}
            onClick={() => handlePhaseChange(phase.id)}
            className={cn(
              "relative flex-1 flex flex-col items-center min-h-[64px] py-2.5 px-1 rounded-xl transition-all duration-200",
              "touch-feedback active:scale-95",
              isActive 
                ? "bg-card shadow-lg" 
                : "active:bg-secondary/80",
              isCurrent && !isActive && "ring-1 ring-primary/30"
            )}
          >
            {/* Current phase indicator */}
            {isCurrent && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
            
            {/* Icon */}
            <span className="text-xl mb-0.5">{phase.icon}</span>
            
            {/* Label */}
            <span className={cn(
              "text-[11px] font-semibold transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}>
              {label}
            </span>
            
            {/* Stats */}
            {stats.total > 0 && (
              <span className={cn(
                "text-[10px] font-medium mt-0.5",
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