import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface WeeklyGoalRingProps {
  currentPercentage: number;
  goalPercentage?: number;
}

export function WeeklyGoalRing({ 
  currentPercentage, 
  goalPercentage = 70 
}: WeeklyGoalRingProps) {
  const { t } = useLanguage();
  
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (currentPercentage / 100) * circumference;
  const goalOffset = circumference - (goalPercentage / 100) * circumference;
  const isAboveGoal = currentPercentage >= goalPercentage;
  const progressColor = isAboveGoal ? '156 64% 55%' : '258 73% 76%';

  const getMessage = () => {
    if (currentPercentage >= 100) return t('weeklyGoal.perfect');
    if (currentPercentage >= goalPercentage) return t('weeklyGoal.goalReached');
    if (currentPercentage >= goalPercentage - 15) return t('weeklyGoal.almostThere');
    return t('weeklyGoal.keepGoing');
  };

  return (
    <div className="bg-card/50 rounded-2xl p-6 border border-border/50">
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-bold text-foreground mb-4">{t('weeklyGoal.title')}</h3>
        
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={goalOffset} strokeLinecap="round" className="opacity-50" />
            <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`hsl(${progressColor})`} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeLinecap="round" initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: progressOffset }} transition={{ duration: 1.5, ease: "easeOut" }} style={{ filter: `drop-shadow(0 0 8px hsl(${progressColor} / 0.5))` }} />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span className="text-3xl font-black" style={{ color: `hsl(${progressColor})` }} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 200 }}>
              {Math.round(currentPercentage)}%
            </motion.span>
            <span className="text-xs text-muted-foreground mt-1">
              {t('weeklyGoal.outOf')} {goalPercentage}%
            </span>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-4 text-center">
          <span className="text-lg font-semibold">{getMessage()}</span>
        </motion.div>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: `hsl(${progressColor})` }} />
            <span>{t('weeklyGoal.progress')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span>{t('weeklyGoal.goal70')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
