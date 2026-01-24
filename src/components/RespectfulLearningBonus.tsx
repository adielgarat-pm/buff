import { Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RespectfulLearningBonusProps {
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function RespectfulLearningBonus({ isActive, onToggle, disabled }: RespectfulLearningBonusProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "w-full p-4 rounded-2xl border transition-all duration-300",
        isActive
          ? "bg-gradient-to-r from-success/20 to-primary/20 border-success/50 shadow-glow"
          : "bg-card border-border hover:border-success/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-xl transition-colors",
          isActive ? "bg-success/30" : "bg-secondary"
        )}>
          <Heart className={cn(
            "w-6 h-6 transition-colors",
            isActive ? "text-success fill-success" : "text-muted-foreground"
          )} />
        </div>
        
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-semibold transition-colors",
              isActive ? "text-success" : "text-foreground"
            )}>
              Respectful Learning Bonus
            </h3>
            {isActive && <Sparkles className="w-4 h-4 text-success animate-pulse" />}
          </div>
          <p className="text-sm text-muted-foreground">
            No interruptions or complaints today
          </p>
        </div>
        
        <div className={cn(
          "px-3 py-1.5 rounded-full text-sm font-bold transition-all",
          isActive 
            ? "bg-success text-success-foreground" 
            : "bg-secondary text-muted-foreground"
        )}>
          +20
        </div>
      </div>
    </button>
  );
}
