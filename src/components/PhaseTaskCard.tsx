import { Task } from '@/types/task';
import { Check, Clock, Pill, Droplets, Apple, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhaseTaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
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

export function PhaseTaskCard({ task, onComplete, onUncomplete }: PhaseTaskCardProps) {
  const Icon = categoryIcons[task.category];
  const colorClasses = categoryColors[task.category];

  const handleClick = () => {
    if (task.completed) {
      onUncomplete(task.id);
    } else {
      onComplete(task.id);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full p-5 rounded-2xl border transition-all duration-300 text-left",
        "hover:scale-[1.02] active:scale-[0.98]",
        task.completed
          ? "bg-primary/10 border-primary/30"
          : "bg-card border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div className={cn(
          "relative w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
          task.completed
            ? "bg-primary border-primary"
            : "border-muted-foreground/50 hover:border-primary"
        )}>
          {task.completed && (
            <Check className="w-4 h-4 text-primary-foreground animate-check-bounce" />
          )}
        </div>

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
              <span className="capitalize">{task.category}</span>
            </div>
          </div>
        </div>

        {/* Credits */}
        <div className={cn(
          "text-right flex-shrink-0",
          task.completed ? "text-primary" : "text-muted-foreground"
        )}>
          <span className="text-xl font-bold">+{task.credits}</span>
          <p className="text-xs">credits</p>
        </div>
      </div>
    </button>
  );
}
