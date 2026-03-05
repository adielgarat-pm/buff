import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, CATEGORY_LABELS, CATEGORY_LABELS_HE, TaskCategory } from '@/types/task';
import { Check, Clock, Zap, Book, Calendar, Sparkles, Home, Activity, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { STRATEGIES, getStrategyById } from '@/data/cogFunStrategies';
import { translateTitle } from '@/utils/displayTranslation';
import { BuffActivationModal } from './BuffActivationModal';
import { ConfettiEffect } from './ConfettiEffect';
import { XPFlyAnimation } from './XPFlyAnimation';
import { CoreSyncAnimation } from './CoreSyncAnimation';
import { isProtocolTask, getEffectiveCredits } from '@/utils/protocolTaskUtils';

interface FocusCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onBuffActivated?: () => void;
  /** Key to trigger slide-in animation on task change */
  animationKey: string;
}

const categoryIcons: Record<TaskCategory, typeof Book> = {
  learning: Book,
  organization: Calendar,
  'self-care': Sparkles,
  responsibility: Home,
  movement: Activity,
};

const categoryColors: Record<TaskCategory, string> = {
  learning: 'text-learning bg-learning/20',
  organization: 'text-organization bg-organization/20',
  'self-care': 'text-self-care bg-self-care/20',
  responsibility: 'text-responsibility bg-responsibility/20',
  movement: 'text-movement bg-movement/20',
};

const getTaskIcon = (task: Task) => {
  if (isProtocolTask(task)) return Cpu;
  return categoryIcons[task.category] || Sparkles;
};

const getRandomStrategy = (strategyId?: string | null) => {
  if (strategyId) {
    const strategy = getStrategyById(strategyId);
    if (strategy) return strategy;
  }
  return STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];
};

export function FocusCard({ task, onComplete, onUncomplete, onBuffActivated, animationKey }: FocusCardProps) {
  const { language } = useLanguage();
  const [showBuffModal, setShowBuffModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXPFly, setShowXPFly] = useState(false);
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
    : (language === 'he' ? CATEGORY_LABELS_HE[task.category] : CATEGORY_LABELS[task.category]);
  const strategy = getRandomStrategy(task.strategyId);

  const handleComplete = () => {
    if (task.completed) {
      onUncomplete(task.id);
      return;
    }
    if (isProtocol) {
      setShowCoreSync(true);
      return;
    }
    completeTaskWithEffects();
  };

  const completeTaskWithEffects = () => {
    onComplete(task.id);
    if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
    if (effectiveCredits >= 15 || isProtocol) {
      setShowConfetti(true);
    }
    setShowXPFly(true);
  };

  const handleCoreSyncComplete = () => {
    setShowCoreSync(false);
    completeTaskWithEffects();
  };

  const handleBuffClick = () => {
    setShowBuffModal(true);
    onBuffActivated?.();
    if (navigator.vibrate) navigator.vibrate(50);
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
      <AnimatePresence mode="wait">
        <motion.div
          key={animationKey}
          ref={cardRef}
          initial={{ opacity: 0, x: 80, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -80, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            "w-full rounded-2xl border-2 p-6 flex flex-col items-center gap-5 text-center",
            isProtocol
              ? "bg-protocol-cyan/5 border-protocol-cyan/40 shadow-protocol-glow"
              : "bg-card border-primary/30 shadow-lg"
          )}
        >
          {/* Category Badge */}
          <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold", colorClasses)}>
            <Icon className="w-4 h-4" />
            <span className="capitalize">{categoryLabel}</span>
          </div>

          {/* Mission Title */}
          <h2 className={cn(
            "text-xl font-bold leading-snug",
            isProtocol ? "text-protocol-cyan" : "text-foreground"
          )}>
            {translateTitle(task.title, language)}
          </h2>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]" dir={language === 'he' ? 'rtl' : 'ltr'}>
              📝 {task.description}
            </p>
          )}

          {/* Time */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{task.time}</span>
          </div>

          {/* Buffs reward */}
          <div className={cn(
            "text-2xl font-extrabold",
            isProtocol ? "text-protocol-cyan" : "text-primary"
          )}>
            +{effectiveCredits} {language === 'he' ? 'באפים' : 'Buffs'}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-2">
            {/* Buff Button */}
            <button
              onClick={handleBuffClick}
              className={cn(
                "p-3 rounded-xl border-2 transition-all active:scale-90",
                isProtocol
                  ? "bg-protocol-purple/20 border-protocol-purple/50"
                  : "bg-buff/20 border-buff/50"
              )}
              title={language === 'he' ? 'הפעל באף' : 'Activate Buff'}
            >
              <Zap className={cn("w-5 h-5 animate-buff-lightning", isProtocol ? "text-protocol-purple" : "text-buff")} />
            </button>

            {/* Done Button — big and centered */}
            <button
              onClick={handleComplete}
              className={cn(
                "w-16 h-16 rounded-full border-3 flex items-center justify-center transition-all active:scale-90",
                "shadow-lg",
                task.completed
                  ? "bg-buff border-buff shadow-[0_0_20px_rgba(var(--buff-rgb),0.5)]"
                  : isProtocol
                    ? "border-protocol-cyan/60 animate-pulse-slow shadow-[0_0_12px_rgba(var(--protocol-cyan-rgb,0,200,200),0.3)]"
                    : "border-primary animate-pulse-slow shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
              )}
            >
              {task.completed ? (
                <Check className="w-8 h-8 text-buff-foreground animate-check-bounce" />
              ) : (
                <span className={cn("w-4 h-4 rounded-full", isProtocol ? "bg-protocol-cyan/40" : "bg-primary/40")} />
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <CoreSyncAnimation isActive={showCoreSync} credits={effectiveCredits} onComplete={handleCoreSyncComplete} />
      {showBuffModal && <BuffActivationModal strategy={strategy} onClose={() => setShowBuffModal(false)} />}
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      {showXPFly && <XPFlyAnimation credits={effectiveCredits} sourceRef={getCardPosition()} onComplete={() => setShowXPFly(false)} />}
    </>
  );
}
