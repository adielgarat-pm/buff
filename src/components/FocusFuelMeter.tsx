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
            <Sparkles className="w-12 h-12 text-buff" />
          </div>
        </div>
      )}
      
      {/* Main Container */}
      <div className={cn(
        "rounded-2xl p-6 border transition-all duration-500",
        isFull 
          ? "bg-buff/10 border-buff/40 shadow-[0_0_30px_rgba(173,255,47,0.3)]" 
          : "bg-gradient-card border-border"
      )}>
        {/* Header with Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              isFull 
                ? "bg-buff/30 shadow-[0_0_20px_rgba(173,255,47,0.5)]" 
                : "bg-primary/20"
            )}>
              <span className="text-2xl">{currentBadge?.icon || '⚡'}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'he' ? 'תג כישורים' : 'Skill Badge'}
              </p>
              <p className="font-bold text-foreground">
                {language === 'he' ? currentBadge?.nameHe : currentBadge?.name}
              </p>
            </div>
          </div>
          
          {/* Buffs Activated Counter */}
          {buffsActivated > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-buff/20 border border-buff/30">
              <Zap className="w-4 h-4 text-buff" />
              <span className="text-sm font-bold text-buff">
                {buffsActivated} {language === 'he' ? 'באפים' : 'Buffs'}
              </span>
            </div>
          )}
        </div>
        
        {/* Focus Fuel Meter - Circular Battery Design */}
        <div className="relative flex justify-center py-6">
          <div className="relative w-36 h-36">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="12"
              />
              
              {/* Progress Circle with Gradient */}
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#fuelGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${percent * 3.27} 327`}
                className="transition-all duration-700 ease-out"
                style={{
                  filter: isFull ? 'drop-shadow(0 0 10px rgba(173,255,47,0.8))' : 
                          isAlmostFull ? 'drop-shadow(0 0 6px rgba(173,255,47,0.5))' : 'none'
                }}
              />
              
              {/* Gradient Definition */}
              <defs>
                <linearGradient id="fuelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="50%" stopColor="hsl(var(--buff))" />
                  <stop offset="100%" stopColor="hsl(var(--buff))" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Battery className={cn(
                "w-8 h-8 mb-1 transition-colors duration-300",
                isFull ? "text-buff" : isAlmostFull ? "text-buff/80" : "text-primary"
              )} />
              <span className={cn(
                "text-3xl font-bold transition-colors duration-300",
                isFull ? "text-buff" : "text-foreground"
              )}>
                {Math.round(percent)}%
              </span>
            </div>
            
            {/* Spark Animation for Buff Bonus */}
            {buffsActivated > 0 && (
              <div className="absolute -top-2 -right-2">
                <div className="relative">
                  <Zap className="w-8 h-8 text-buff animate-pulse" />
                  <div className="absolute inset-0 animate-ping">
                    <Zap className="w-8 h-8 text-buff/50" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Status Text */}
        <div className={cn(
          "text-center py-3 px-4 rounded-xl transition-all duration-300",
          isFull 
            ? "bg-buff/20 border border-buff/30" 
            : "bg-secondary/50"
        )}>
          <p className={cn(
            "font-medium transition-colors",
            isFull ? "text-buff" : "text-foreground"
          )}>
            {getStatusText()}
          </p>
        </div>
        
        {/* Milestone Progress Dots */}
        <div className="flex justify-center gap-3 mt-4">
          {[25, 50, 75, 100].map((milestone) => (
            <div
              key={milestone}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                percent >= milestone 
                  ? "bg-buff shadow-[0_0_8px_rgba(173,255,47,0.8)]" 
                  : "bg-secondary"
              )}
            />
          ))}
        </div>
        
        {/* Daily Reset Message */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          {language === 'he' 
            ? '🌅 המד מתאפס כל בוקר - כל יום הוא התחלה חדשה!'
            : '🌅 Meter resets every morning - every day is a fresh start!'
          }
        </p>
      </div>
    </div>
  );
}
