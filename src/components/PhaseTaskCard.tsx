import { useState, useRef } from 'react';
import { Task } from '@/types/task';
import { Check, Clock, Zap, Book, Calendar, Sparkles, Home, Activity, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { STRATEGIES, getStrategyById } from '@/data/cogFunStrategies';
import { BuffActivationModal } from './BuffActivationModal';
import { ConfettiEffect } from './ConfettiEffect';
import { XPFlyAnimation } from './XPFlyAnimation';
import { CoreSyncAnimation } from './CoreSyncAnimation';
import { isProtocolTask, getEffectiveCredits } from '@/utils/protocolTaskUtils';
import { CATEGORY_LABELS_HE, TaskCategory } from '@/types/task';

interface PhaseTaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onBuffActivated?: () => void;
}

// Category icons for new 5-category system
const categoryIcons: Record<TaskCategory, typeof Book> = {
  learning: Book,
  organization: Calendar,
  'self-care': Sparkles,
  responsibility: Home,
  movement: Activity,
};

// Category color classes for new 5-category system
const categoryColors: Record<TaskCategory, string> = {
  learning: 'text-learning bg-learning/20',
  organization: 'text-organization bg-organization/20',
  'self-care': 'text-self-care bg-self-care/20',
  responsibility: 'text-responsibility bg-responsibility/20',
  movement: 'text-movement bg-movement/20',
};

// Special icons for specific tasks
const getTaskIcon = (task: Task) => {
  // Protocol tasks get cyberpunk CPU icon
  if (isProtocolTask(task)) {
    return Cpu;
  }
  return categoryIcons[task.category] || Sparkles;
};

// Get a random strategy for the task
const getRandomStrategy = (strategyId?: string | null) => {
  if (strategyId) {
    const strategy = getStrategyById(strategyId);
    if (strategy) return strategy;
  }
  // Return a random strategy
  return STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];
};

export function PhaseTaskCard({ task, onComplete, onUncomplete, onBuffActivated }: PhaseTaskCardProps) {
  const { language } = useLanguage();
  const [showBuffModal, setShowBuffModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXPFly, setShowXPFly] = useState(false);
  const [wasJustCompleted, setWasJustCompleted] = useState(false);
  const [showCoreSync, setShowCoreSync] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const isProtocol = isProtocolTask(task);
  const effectiveCredits = getEffectiveCredits(task);
  const Icon = getTaskIcon(task);
  const colorClasses = isProtocol 
    ? 'text-protocol-cyan bg-protocol-cyan/20' 
    : categoryColors[task.category];
  const categoryLabel = isProtocol 
    ? (language === 'he' ? 'פרוטוקול' : 'Protocol')
    : (language === 'he' ? CATEGORY_LABELS_HE[task.category] : task.category);
  const strategy = getRandomStrategy(task.strategyId);

  const handleComplete = () => {
    if (task.completed) {
      onUncomplete(task.id);
      return;
    }

    // Protocol tasks use special Core Sync animation
    if (isProtocol) {
      setShowCoreSync(true);
      return;
    }

    // Standard completion flow
    completeTaskWithEffects();
  };

  const completeTaskWithEffects = () => {
    // Trigger completion
    onComplete(task.id);
    setWasJustCompleted(true);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 100]);
    }

    // Show effects for high-value tasks (15+ credits) or protocol tasks
    if (effectiveCredits >= 15 || isProtocol) {
      setShowConfetti(true);
      setShowXPFly(true);
    } else {
      setShowXPFly(true);
    }

    // Reset animation state
    setTimeout(() => setWasJustCompleted(false), 1000);
  };

  const handleCoreSyncComplete = () => {
    setShowCoreSync(false);
    completeTaskWithEffects();
  };

  const handleBuffClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBuffModal(true);
    
    // Track buff activation
    onBuffActivated?.();
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const getCardPosition = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return undefined;
  };

  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          "quest-card w-full p-3 rounded-xl border transition-all duration-200",
          "active:scale-[0.98] touch-feedback",
          task.completed
            ? "bg-buff/10 border-buff/30"
            : isProtocol
              ? "bg-protocol-cyan/5 border-protocol-cyan/40 shadow-protocol-glow"
              : "bg-card border-border active:border-primary/50",
          wasJustCompleted && "animate-quest-complete bg-gradient-to-r from-buff/20 via-primary/20 to-buff/20"
        )}
      >
        {/* Compact single-row layout */}
        <div className="flex items-center gap-2.5 flex-row-reverse">
        {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className={cn(
                "text-sm font-semibold transition-all leading-tight text-start truncate",
                task.completed 
                  ? "text-muted-foreground line-through" 
                  : isProtocol
                    ? "text-protocol-cyan"
                    : "text-foreground"
              )}>
                {task.title}
              </h3>
              
              {/* Credits - Compact */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {isProtocol && !task.completed && (
                  <span className="text-[10px] text-protocol-purple font-medium">1.5x</span>
                )}
                <span className={cn(
                  "text-sm font-bold",
                  task.completed ? "text-buff" : isProtocol ? "text-protocol-cyan" : "text-muted-foreground"
                )}>
                  +{effectiveCredits}
                </span>
              </div>
            </div>
            
            {/* Task Notes - Only show if present */}
            {task.description && !task.completed && (
              <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-tight line-clamp-1 text-start" dir="rtl">
                📝 {task.description}
              </p>
            )}
            
            {/* Metadata row - Compact */}
            <div className="flex items-center gap-2 mt-1 flex-row-reverse justify-end">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{task.time}</span>
              </div>
              
              <div className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px]",
                colorClasses
              )}>
                <Icon className="w-3 h-3" />
                <span className="capitalize font-medium">{categoryLabel}</span>
              </div>
            </div>
          </div>

          {/* Buff Button - Smaller */}
          {!task.completed && (
            <button
              onClick={handleBuffClick}
              className={cn(
                "p-2 rounded-lg border transition-all touch-target flex-shrink-0",
                "active:scale-90",
                isProtocol 
                  ? "bg-protocol-purple/20 border-protocol-purple/50 active:bg-protocol-purple/30"
                  : "bg-buff/20 border-buff/50 active:bg-buff/30"
              )}
              title={language === 'he' ? 'הפעל באף' : 'Activate Buff'}
            >
              <Zap className={cn(
                "w-4 h-4 animate-buff-lightning",
                isProtocol ? "text-protocol-purple" : "text-buff"
              )} />
            </button>
          )}

          {/* Checkbox Button - Smaller */}
          <button
            onClick={handleComplete}
            className={cn(
              "relative w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 touch-target",
              "active:scale-90",
              task.completed
                ? "bg-buff border-buff"
                : isProtocol
                  ? "border-protocol-cyan/50 active:border-protocol-cyan active:bg-protocol-cyan/10"
                  : "border-muted-foreground/50 active:border-buff active:bg-buff/10"
            )}
          >
            {task.completed && (
              <Check className="w-5 h-5 text-buff-foreground animate-check-bounce" />
            )}
          </button>
        </div>
      </div>

      {/* Core Sync Animation (for Protocol tasks) */}
      <CoreSyncAnimation
        isActive={showCoreSync}
        credits={effectiveCredits}
        onComplete={handleCoreSyncComplete}
      />

      {/* Buff Activation Modal */}
      {showBuffModal && (
        <BuffActivationModal 
          strategy={strategy} 
          onClose={() => setShowBuffModal(false)} 
        />
      )}

      {/* Confetti Effect */}
      <ConfettiEffect 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />

      {/* XP Fly Animation */}
      {showXPFly && (
        <XPFlyAnimation 
          credits={effectiveCredits} 
          sourceRef={getCardPosition()}
          onComplete={() => setShowXPFly(false)} 
        />
      )}
    </>
  );
}
