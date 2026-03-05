import { Phase, PHASES, getPhaseConfig } from '@/types/phase';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const { language, t, isRTL } = useLanguage();

  // Filter out school phase if disabled
  const visiblePhases = PHASES.filter(phase => {
    if (phase.id === 'school' && !schoolQuestEnabled) return false;
    return true;
  });

  const currentIndex = visiblePhases.findIndex(p => p.id === activePhase);
  const activeConfig = getPhaseConfig(activePhase);
  const stats = phaseStats[activePhase];
  const isComplete = stats.total > 0 && stats.completed === stats.total;
  const isCurrent = activePhase === currentPhase;

  const phaseLabel = language === 'he' ? activeConfig.labelHe : activeConfig.label;

  const goNext = () => {
    const next = visiblePhases[(currentIndex + 1) % visiblePhases.length];
    if (navigator.vibrate) navigator.vibrate(10);
    onPhaseChange(next.id);
  };

  const goPrev = () => {
    const prev = visiblePhases[(currentIndex - 1 + visiblePhases.length) % visiblePhases.length];
    if (navigator.vibrate) navigator.vibrate(10);
    onPhaseChange(prev.id);
  };

  const LeftArrow = isRTL ? ChevronRight : ChevronLeft;
  const RightArrow = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center justify-between gap-2 px-1">
      {/* Previous stage */}
      <button
        onClick={goPrev}
        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors touch-target active:scale-90"
      >
        <LeftArrow className="w-5 h-5" />
      </button>

      {/* Current stage indicator */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{activeConfig.icon}</span>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('stage.current')}
              </span>
              {isCurrent && (
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <h2 className="text-base font-bold text-foreground leading-tight">
              {phaseLabel}
            </h2>
          </div>
        </div>

        {/* Simple progress dots */}
        {stats.total > 0 && (
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(stats.total, 12) }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  i < stats.completed
                    ? "bg-primary shadow-[0_0_4px_hsl(var(--primary)/0.5)]"
                    : "bg-secondary"
                )}
              />
            ))}
            {isComplete && (
              <span className="text-xs ms-1.5 text-primary font-semibold">✓</span>
            )}
          </div>
        )}
      </div>

      {/* Next stage */}
      <button
        onClick={goNext}
        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors touch-target active:scale-90"
      >
        <RightArrow className="w-5 h-5" />
      </button>
    </div>
  );
}
