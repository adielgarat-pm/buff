import { useState } from 'react';
import { Task, TaskCategory } from '@/types/task';
import { Book, CalendarCheck, Sparkles as SparklesIcon, Home, Zap, Check, Cookie, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStrategyById, STRATEGY_CATEGORIES } from '@/data/cogFunStrategies';
import { useLanguage } from '@/contexts/LanguageContext';
import { translateTitle } from '@/utils/displayTranslation';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
}

const categoryConfig: Record<TaskCategory, { icon: typeof Book; colorClass: string; bgClass: string }> = {
  learning: { icon: Book, colorClass: 'text-learning', bgClass: 'bg-learning/20' },
  organization: { icon: CalendarCheck, colorClass: 'text-organization', bgClass: 'bg-organization/20' },
  'self-care': { icon: SparklesIcon, colorClass: 'text-self-care', bgClass: 'bg-self-care/20' },
  responsibility: { icon: Home, colorClass: 'text-responsibility', bgClass: 'bg-responsibility/20' },
  movement: { icon: Zap, colorClass: 'text-movement', bgClass: 'bg-movement/20' },
};

// Special icons for specific tasks
const getTaskIcon = (task: Task) => {
  if (task.title.toLowerCase().includes('snack')) {
    return Cookie;
  }
  return categoryConfig[task.category].icon;
};

export function TaskCard({ task, onComplete, onUncomplete }: TaskCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBuffTip, setShowBuffTip] = useState(false);
  const [showBuffActivated, setShowBuffActivated] = useState(false);
  const { language } = useLanguage();
  const displayTitle = translateTitle(task.title, language);
  
  const config = categoryConfig[task.category];
  const Icon = getTaskIcon(task);
  const buff = task.strategyId ? getStrategyById(task.strategyId) : null;

  const handleClick = () => {
    if (task.completed) {
      onUncomplete(task.id);
    } else {
      setIsAnimating(true);
      setShowConfetti(true);
      
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      setTimeout(() => {
        onComplete(task.id);
        setIsAnimating(false);
      }, 400);
      
      setTimeout(() => {
        setShowConfetti(false);
      }, 800);
    }
  };

  return (
    <div
      className={cn(
        'relative group cursor-pointer transition-all duration-300 animate-slide-up',
        'rounded-2xl p-4 border',
        task.completed 
          ? 'bg-secondary/50 border-border/50 opacity-60' 
          : 'bg-gradient-card border-border hover:border-primary/50 hover:shadow-glow',
        buff && !task.completed && 'buff-active-glow animate-buff-pulse'
      )}
      onClick={handleClick}
      style={{ animationDelay: `${parseInt(task.id) * 50}ms` }}
    >
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {[...Array(8)].map((_, i) => (
            <SparklesIcon
              key={i}
              className="absolute text-primary animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 50}ms`,
                transform: `scale(${0.5 + Math.random() * 0.5})`,
              }}
              size={16}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Category Icon */}
        <div className={cn('p-3 rounded-2xl', config.bgClass)}>
          <Icon className={cn('w-5 h-5', config.colorClass)} />
        </div>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              'font-semibold text-foreground transition-all',
              task.completed && 'line-through text-muted-foreground'
            )}>
              {displayTitle}
            </h3>
            {/* Daily Buff Power-up Icon */}
            {buff && !task.completed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!showBuffTip) {
                    setShowBuffActivated(true);
                    setTimeout(() => setShowBuffActivated(false), 1500);
                  }
                  setShowBuffTip(!showBuffTip);
                }}
                className={cn(
                  'p-1.5 rounded-xl transition-all hover:scale-110',
                  showBuffTip 
                    ? 'bg-buff/30 text-buff shadow-buff-glow' 
                    : 'bg-buff/20 text-buff animate-buff-pulse'
                )}
                aria-label="Activate daily buff"
              >
                <Zap className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{task.time}</p>
        </div>

        {/* Credits Badge */}
        <div className={cn(
          'px-3 py-1.5 rounded-2xl text-sm font-bold transition-all',
          task.completed 
            ? 'bg-buff/20 text-buff' 
            : 'bg-primary/20 text-primary'
        )}>
          +{task.credits}
        </div>

        {/* Completion Indicator */}
        <div className={cn(
          'w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all',
          task.completed 
            ? 'bg-buff border-buff' 
            : 'border-muted-foreground/30 group-hover:border-primary'
        )}>
          {task.completed && (
            <Check className={cn(
              'w-5 h-5 text-buff-foreground',
              isAnimating && 'animate-check-bounce'
            )} />
          )}
        </div>
      </div>

      {/* Buff Activated Message */}
      {showBuffActivated && (
        <div className="mt-3 p-3 rounded-2xl bg-gradient-buff border border-buff/40 animate-slide-up text-center shadow-buff-glow">
          <p className="font-display font-bold text-buff-foreground text-sm flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 fill-current" />
            Buff Activated!
            <Zap className="w-4 h-4 fill-current" />
          </p>
        </div>
      )}

      {/* Daily Buff Tip Popup */}
      {buff && showBuffTip && !showBuffActivated && (
        <div 
          className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-buff/15 to-buff/5 border border-buff/30 animate-slide-up shadow-buff-glow"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{buff.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold text-buff text-sm tracking-wide">
                  {buff.title}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBuffTip(false);
                  }}
                  className="p-1.5 rounded-xl hover:bg-buff/20 text-buff"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                {buff.tip}
              </p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-buff" />
                {STRATEGY_CATEGORIES[buff.category].label}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
