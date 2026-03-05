import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Zap, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FocusFuelMeterProps {
  earned: number;
  goal: number;
  totalPossible?: number;
  isWeekend?: boolean;
  buffsActivated?: number;
  className?: string;
}

const SKILL_BADGES = [
  { level: 1, name: 'First Spark', nameHe: 'ניצוץ ראשון', icon: '⚡' },
  { level: 2, name: 'Getting Warmed Up', nameHe: 'מתחממים', icon: '🔥' },
  { level: 3, name: 'On a Roll', nameHe: 'בזרימה', icon: '🎯' },
  { level: 4, name: 'Focus Fighter', nameHe: 'לוחם מיקוד', icon: '💪' },
  { level: 5, name: 'Persistence Pro', nameHe: 'מקצוען התמדה', icon: '🏆' },
];

export function FocusFuelMeter({ earned, goal, totalPossible = 0, isWeekend = false, buffsActivated = 0, className }: FocusFuelMeterProps) {
  const { language, t } = useLanguage();
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastMilestone, setLastMilestone] = useState(0);
  
  const percent = goal > 0 ? Math.min((earned / goal) * 100, 100) : 0;
  const isFull = percent >= 100;
  const isAlmostFull = percent >= 80;
  const isHalfway = percent >= 50;
  
  const currentMilestone = isFull ? 100 : isAlmostFull ? 80 : isHalfway ? 50 : 0;
  const badgeLevel = Math.min(Math.floor(percent / 20) + 1, 5);
  const currentBadge = SKILL_BADGES[badgeLevel - 1];
  
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
        <div className="flex items-center gap-3">
          {/* Badge icon */}
          <div className="flex-shrink-0 text-2xl">
            {currentBadge?.icon || '⚡'}
          </div>
          
          {/* Progress bar + label */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground truncate">
                {language === 'he' ? currentBadge?.nameHe : currentBadge?.name}
              </span>
              {buffsActivated > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-buff/20 border border-buff/30 flex-shrink-0">
                  <Zap className="w-3 h-3 text-buff" />
                  <span className="text-xs font-bold text-buff">{buffsActivated}</span>
                </div>
              )}
            </div>
            
            {/* Clean progress bar — no raw numbers */}
            <div className="relative h-3 w-full rounded-full bg-secondary overflow-hidden">
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
            
            {/* Milestone dots */}
            <div className="flex items-center gap-1.5">
              {[25, 50, 75, 100].map((milestone) => (
                <div
                  key={milestone}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    percent >= milestone 
                      ? "bg-buff shadow-[0_0_4px_rgba(57,255,20,0.8)]" 
                      : "bg-secondary"
                  )}
                />
              ))}
              <span className="text-[10px] text-muted-foreground ms-auto">
                {isWeekend 
                  ? (language === 'he' ? '🌴 חופש' : '🌴 Off') 
                  : (language === 'he' ? '📚 לימודים' : '📚 School')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
