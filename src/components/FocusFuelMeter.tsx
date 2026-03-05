import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface FocusFuelMeterProps {
  earned: number;
  goal: number;
  totalPossible?: number;
  isWeekend?: boolean;
  buffsActivated?: number;
  className?: string;
}


export function FocusFuelMeter({ earned, goal, className }: FocusFuelMeterProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastMilestone, setLastMilestone] = useState(0);
  
  const percent = goal > 0 ? Math.min((earned / goal) * 100, 100) : 0;
  const isFull = percent >= 100;
  const isAlmostFull = percent >= 80;
  const isHalfway = percent >= 50;
  
  const currentMilestone = isFull ? 100 : isAlmostFull ? 80 : isHalfway ? 50 : 0;
  
  useEffect(() => {
    if (currentMilestone > lastMilestone) {
      setShowCelebration(true);
      setLastMilestone(currentMilestone);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  }, [currentMilestone, lastMilestone]);

  return (
    <div className={cn("relative", className)}>
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="animate-ping">
            <Sparkles className="w-8 h-8 text-buff" />
          </div>
        </div>
      )}
      
      <div className={cn(
        "rounded-2xl p-3 border transition-all duration-500",
        isFull 
          ? "bg-buff/10 border-buff/40 shadow-[0_0_20px_rgba(57,255,20,0.3)]" 
          : "bg-gradient-card border-border"
      )}>
        {/* Simple progress bar only — no text, no badges, no numbers */}
        <div className="relative h-4 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              isFull
                ? "bg-gradient-to-r from-primary to-buff shadow-[0_0_8px_rgba(57,255,20,0.6)]"
                : isAlmostFull
                  ? "bg-gradient-to-r from-primary to-buff/70"
                  : "bg-gradient-to-r from-primary/80 to-primary"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
