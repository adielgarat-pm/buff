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

      {/* Single centered stage label */}
      <div className="flex-1 text-center">
        <h2 className="text-base font-bold text-foreground">
          {language === 'he' ? 'שלב' : 'Stage'}: {phaseLabel}
          {isCurrent && <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse ms-2 align-middle" />}
        </h2>
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
