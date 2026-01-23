import { useState } from 'react';
import { Task, TaskCategory } from '@/types/task';
import { Pill, Droplets, Apple, BookOpen, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
}

const categoryConfig: Record<TaskCategory, { icon: typeof Pill; colorClass: string; bgClass: string }> = {
  medication: { icon: Pill, colorClass: 'text-medication', bgClass: 'bg-medication/20' },
  hygiene: { icon: Droplets, colorClass: 'text-hygiene', bgClass: 'bg-hygiene/20' },
  nutrition: { icon: Apple, colorClass: 'text-nutrition', bgClass: 'bg-nutrition/20' },
  school: { icon: BookOpen, colorClass: 'text-school', bgClass: 'bg-school/20' },
};

export function TaskCard({ task, onComplete, onUncomplete }: TaskCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const config = categoryConfig[task.category];
  const Icon = config.icon;

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
        'rounded-xl p-4 border',
        task.completed 
          ? 'bg-secondary/50 border-border/50 opacity-60' 
          : 'bg-gradient-card border-border hover:border-primary/50 hover:shadow-glow'
      )}
      onClick={handleClick}
      style={{ animationDelay: `${parseInt(task.id) * 50}ms` }}
    >
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {[...Array(8)].map((_, i) => (
            <Sparkles
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
        <div className={cn('p-3 rounded-lg', config.bgClass)}>
          <Icon className={cn('w-5 h-5', config.colorClass)} />
        </div>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold text-foreground transition-all',
            task.completed && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </h3>
          <p className="text-sm text-muted-foreground">{task.time}</p>
        </div>

        {/* Credits Badge */}
        <div className={cn(
          'px-3 py-1.5 rounded-full text-sm font-bold transition-all',
          task.completed 
            ? 'bg-success/20 text-success' 
            : 'bg-primary/20 text-primary'
        )}>
          +{task.credits}
        </div>

        {/* Completion Indicator */}
        <div className={cn(
          'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all',
          task.completed 
            ? 'bg-success border-success' 
            : 'border-muted-foreground/30 group-hover:border-primary'
        )}>
          {task.completed && (
            <Check className={cn(
              'w-5 h-5 text-success-foreground',
              isAnimating && 'animate-check-bounce'
            )} />
          )}
        </div>
      </div>
    </div>
  );
}
