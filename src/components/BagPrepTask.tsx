import { Backpack, ChevronLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BagPrepTaskProps {
  credits: number;
  isCompleted: boolean;
  onClick: () => void;
}

export function BagPrepTask({ credits, isCompleted, onClick }: BagPrepTaskProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl border-2 transition-all",
        "flex items-center gap-4 text-right",
        isCompleted
          ? "bg-primary/10 border-primary/30"
          : "bg-gradient-to-r from-buff/10 to-primary/5 border-buff/40 hover:border-buff/60 hover:shadow-lg"
      )}
    >
      <div className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
        isCompleted ? "bg-primary/20" : "bg-buff/20"
      )}>
        <Backpack className={cn(
          "w-7 h-7",
          isCompleted ? "text-primary" : "text-buff"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-bold text-lg",
            isCompleted ? "text-primary" : "text-foreground"
          )}>
            מכינים תיק למחר
          </h3>
          {!isCompleted && <Sparkles className="w-4 h-4 text-buff animate-pulse" />}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isCompleted ? "התיק מוכן! ✨" : "בדוק את הציוד הנדרש למחר"}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <div className={cn(
          "px-3 py-1.5 rounded-full font-bold text-sm",
          isCompleted
            ? "bg-primary/20 text-primary"
            : "bg-buff/20 text-buff"
        )}>
          {isCompleted ? "✓" : `+${credits}`}
        </div>
        {!isCompleted && <ChevronLeft className="w-5 h-5 text-muted-foreground" />}
      </div>
    </button>
  );
}