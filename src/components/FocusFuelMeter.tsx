import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Zap, Battery, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FocusFuelMeterProps {
  earned: number;
  goal: number;
  buffsActivated?: number;
  className?: string;
}

// Milestone badges that unlock at certain levels
const SKILL_BADGES = [
  { level: 1, name: 'First Spark', nameHe: 'ניצוץ ראשון', icon: '⚡', description: 'Started your journey', descriptionHe: 'התחלת את המסע' },
  { level: 2, name: 'Getting Warmed Up', nameHe: 'מתחממים', icon: '🔥', description: 'Building momentum', descriptionHe: 'בונים תנופה' },
  { level: 3, name: 'On a Roll', nameHe: 'בזרימה', icon: '🎯', description: 'Consistency is key', descriptionHe: 'עקביות היא המפתח' },
  { level: 4, name: 'Focus Fighter', nameHe: 'לוחם מיקוד', icon: '💪', description: 'Pushing through', descriptionHe: 'ממשיכים קדימה' },
  { level: 5, name: 'Persistence Pro', nameHe: 'מקצוען התמדה', icon: '🏆', description: 'Never giving up', descriptionHe: 'לא מוותרים' },
];

export function FocusFuelMeter({ earned, goal, buffsActivated = 0, className }: FocusFuelMeterProps) {
  const { language, t } = useLanguage();
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastMilestone, setLastMilestone] = useState(0);
  
  const percent = goal > 0 ? Math.min((earned / goal) * 100, 100) : 0;
  const isHalfway = percent >= 50;
  const isAlmostFull = percent >= 80;
  const isFull = percent >= 100;
  
  // Determine current milestone
  const currentMilestone = isFull ? 100 : isAlmostFull ? 80 : isHalfway ? 50 : 0;
  
  // Calculate skill badge level (every 20% = 1 badge, max 5)
  const badgeLevel = Math.min(Math.floor(percent / 20) + 1, 5);
  const currentBadge = SKILL_BADGES[badgeLevel - 1];
  
  // Trigger celebration on milestone
  useEffect(() => {
    if (currentMilestone > lastMilestone) {
      setShowCelebration(true);
      setLastMilestone(currentMilestone);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
      setTimeout(() => setShowCelebration(false), 2000);
    }
  }, [currentMilestone, lastMilestone]);
  
  // Get status text
  const getStatusText = () => {
    if (isFull) {
      return language === 'he' ? '⚡ טעון במלואו! זמן להפסקה?' : '⚡ Fully Charged! Time for a break?';
    }
    if (isAlmostFull) {
      return language === 'he' ? '🔥 כמעט שם! המשך כך!' : '🔥 Almost there! Keep going!';
    }
    if (isHalfway) {
      return language === 'he' ? '💪 חצי דרך! מצוין!' : '💪 Halfway there! Excellent!';
    }
    return language === 'he' ? '⏳ רמת מיקוד: נטען...' : '⏳ Focus Level: Charging...';
  };

  // Color based on fill level
  const getMeterColor = () => {
    if (isFull) return 'from-buff via-buff to-primary';
    if (isAlmostFull) return 'from-primary via-buff/80 to-buff/60';
    if (isHalfway) return 'from-primary/80 via-primary to-buff/40';
    return 'from-primary/60 via-primary/80 to-primary';
  };

  return (
    <div className={cn("relative", className)}>
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="animate-ping">
            <Sparkles className="w-8 h-8 text-buff" />
          </div>
        </div>
      )}
      
      {/* Main Container - Compact */}
      <div className={cn(
        "rounded-2xl p-3 border transition-all duration-500",
        isFull 
          ? "bg-buff/10 border-buff/40 shadow-[0_0_20px_rgba(57,255,20,0.3)]" 
          : "bg-gradient-card border-border"
      )}>
        {/* Compact Layout - Horizontal */}
        <div className="flex items-center gap-3">
          {/* Circular Meter - Smaller */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="14"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#fuelGradient)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${percent * 3.27} 327`}
                className="transition-all duration-700 ease-out"
                style={{
                  filter: isFull ? 'drop-shadow(0 0 8px rgba(57,255,20,0.8))' : 
                          isAlmostFull ? 'drop-shadow(0 0 4px rgba(57,255,20,0.5))' : 'none'
                }}
              />
              <defs>
                <linearGradient id="fuelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--buff))" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center Percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                "text-sm font-bold",
                isFull ? "text-buff" : "text-foreground"
              )}>
                {Math.round(percent)}%
              </span>
            </div>
          </div>
          
          {/* Badge & Status - Compact */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{currentBadge?.icon || '⚡'}</span>
              <span className="font-bold text-sm text-foreground truncate">
                {language === 'he' ? currentBadge?.nameHe : currentBadge?.name}
              </span>
            </div>
            
            <p className={cn(
              "text-xs truncate",
              isFull ? "text-buff" : "text-muted-foreground"
            )}>
              {getStatusText()}
            </p>
            
            {/* Milestone Dots - Inline */}
            <div className="flex gap-1.5 mt-1.5">
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
            </div>
          </div>
          
          {/* Buffs Counter - Compact */}
          {buffsActivated > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-buff/20 border border-buff/30 flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-buff" />
              <span className="text-xs font-bold text-buff">{buffsActivated}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
