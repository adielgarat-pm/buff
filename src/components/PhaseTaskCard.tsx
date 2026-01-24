import { useState, useRef } from 'react';
import { Task } from '@/types/task';
import { Check, Clock, Pill, Droplets, Apple, BookOpen, Cookie, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { STRATEGIES, getStrategyById } from '@/data/cogFunStrategies';
import { BuffActivationModal } from './BuffActivationModal';
import { ConfettiEffect } from './ConfettiEffect';
import { XPFlyAnimation } from './XPFlyAnimation';

interface PhaseTaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onBuffActivated?: () => void;
}

const categoryIcons = {
  medication: Pill,
  hygiene: Droplets,
  nutrition: Apple,
  school: BookOpen,
};

const categoryColors = {
  medication: 'text-rose-400 bg-rose-500/20',
  hygiene: 'text-sky-400 bg-sky-500/20',
  nutrition: 'text-emerald-400 bg-emerald-500/20',
  school: 'text-violet-400 bg-violet-500/20',
};

const categoryLabelsHe: Record<string, string> = {
  medication: 'תרופות',
  hygiene: 'היגיינה',
  nutrition: 'תזונה',
  school: 'לימודים',
};

// Special icons for specific tasks
const getTaskIcon = (task: Task) => {
  if (task.title.toLowerCase().includes('snack')) {
    return Cookie;
  }
  return categoryIcons[task.category];
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
  const cardRef = useRef<HTMLDivElement>(null);
  
  const Icon = getTaskIcon(task);
  const colorClasses = categoryColors[task.category];
  const categoryLabel = language === 'he' ? categoryLabelsHe[task.category] : task.category;
  const strategy = getRandomStrategy(task.strategyId);

  const handleComplete = () => {
    if (task.completed) {
      onUncomplete(task.id);
      return;
    }

    // Trigger completion
    onComplete(task.id);
    setWasJustCompleted(true);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 100]);
    }

    // Show effects for high-value tasks (15+ credits)
    if (task.credits >= 15) {
      setShowConfetti(true);
      setShowXPFly(true);
    } else {
      setShowXPFly(true);
    }

    // Reset animation state
    setTimeout(() => setWasJustCompleted(false), 1000);
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
          "quest-card w-full p-5 rounded-2xl border transition-all duration-300",
          "hover:scale-[1.02] active:scale-[0.98]",
          task.completed
            ? "bg-buff/10 border-buff/30"
            : "bg-card border-border hover:border-primary/50",
          wasJustCompleted && "animate-quest-complete bg-gradient-to-r from-buff/20 via-primary/20 to-buff/20"
        )}
      >
        <div className="flex items-start gap-4">
          {/* Checkbox Button */}
          <button
            onClick={handleComplete}
            className={cn(
              "relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
              task.completed
                ? "bg-buff border-buff"
                : "border-muted-foreground/50 hover:border-buff hover:bg-buff/10"
            )}
          >
            {task.completed && (
              <Check className="w-5 h-5 text-buff-foreground animate-check-bounce" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                "text-lg font-semibold transition-all",
                task.completed 
                  ? "text-muted-foreground line-through" 
                  : "text-foreground"
              )}>
                {task.title}
              </h3>
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{task.time}</span>
              </div>
              
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs",
                colorClasses
              )}>
                <Icon className="w-3 h-3" />
                <span className="capitalize">{categoryLabel}</span>
              </div>
            </div>
          </div>

          {/* Right side: Buff button + Credits */}
          <div className="flex flex-col items-end gap-2">
            {/* Credits */}
            <div className={cn(
              "text-right",
              task.completed ? "text-buff" : "text-muted-foreground"
            )}>
              <span className="text-xl font-bold">+{task.credits}</span>
              <p className="text-xs">XP</p>
            </div>

            {/* Buff Button - Lightning Bolt */}
            {!task.completed && (
              <button
                onClick={handleBuffClick}
                className={cn(
                  "buff-button-glow p-2.5 rounded-xl bg-buff/20 border border-buff/50 transition-all",
                  "hover:bg-buff/30 hover:scale-110 active:scale-95"
                )}
                title={language === 'he' ? 'הפעל באף' : 'Activate Buff'}
              >
                <Zap className="w-5 h-5 text-buff animate-buff-lightning" />
              </button>
            )}
          </div>
        </div>
      </div>

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
          credits={task.credits} 
          sourceRef={getCardPosition()}
          onComplete={() => setShowXPFly(false)} 
        />
      )}
    </>
  );
}