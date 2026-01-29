import { Backpack, ChevronLeft, Sparkles, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GearMasterTaskProps {
  type: 'night' | 'morning';
  credits: number;
  isCompleted: boolean;
  onClick: () => void;
}

/**
 * Task card for Gear Master - shown in phase views
 * Night Mission: Awards credits (19:00)
 * Morning Safety Net: No credits (07:00)
 */
export function GearMasterTask({ type, credits, isCompleted, onClick }: GearMasterTaskProps) {
  const isNight = type === 'night';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl border-2 transition-all",
        "flex items-center gap-4 text-right",
        isCompleted
          ? "bg-primary/10 border-primary/30"
          : isNight
            ? "bg-gradient-to-r from-buff/10 to-primary/5 border-buff/40 hover:border-buff/60 hover:shadow-lg"
            : "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50"
      )}
    >
      <div className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
        isCompleted ? "bg-primary/20" : isNight ? "bg-buff/20" : "bg-amber-500/20"
      )}>
        <Backpack className={cn(
          "w-7 h-7",
          isCompleted ? "text-primary" : isNight ? "text-buff" : "text-amber-500"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-bold text-lg",
            isCompleted ? "text-primary" : "text-foreground"
          )}>
            {isNight ? "משימת הלילה" : "תזכורת ציוד"}
          </h3>
          {!isCompleted && isNight && <Zap className="w-4 h-4 text-buff animate-pulse" />}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isCompleted 
            ? "התיק מוכן! ✨" 
            : isNight 
              ? "הכן את הציוד למחר עכשיו"
              : "בדוק שהכל בתיק לפני שיוצאים"
          }
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <div className={cn(
          "px-3 py-1.5 rounded-full font-bold text-sm",
          isCompleted
            ? "bg-primary/20 text-primary"
            : isNight
              ? "bg-buff/20 text-buff"
              : "bg-muted text-muted-foreground"
        )}>
          {isCompleted ? "✓" : isNight ? `+${credits}` : "0"}
        </div>
        {!isCompleted && <ChevronLeft className="w-5 h-5 text-muted-foreground" />}
      </div>
    </button>
  );
}
