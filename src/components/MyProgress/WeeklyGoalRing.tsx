import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface WeeklyGoalRingProps {
  currentPercentage: number; // 0-100
  goalPercentage?: number; // Default 70%
}

export function WeeklyGoalRing({ 
  currentPercentage, 
  goalPercentage = 70 
}: WeeklyGoalRingProps) {
  const { t } = useLanguage();
  
  // SVG dimensions
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke offsets
  const progressOffset = circumference - (currentPercentage / 100) * circumference;
  const goalOffset = circumference - (goalPercentage / 100) * circumference;
  
  // Determine color based on progress - Pastel theme colors
  const isAboveGoal = currentPercentage >= goalPercentage;
  const progressColor = isAboveGoal 
    ? '156 64% 55%' // Soft mint green
    : '258 73% 76%'; // Pastel purple

  const getMessage = () => {
    if (currentPercentage >= 100) return '🏆 מושלם!';
    if (currentPercentage >= goalPercentage) return '🎯 הגעת ליעד!';
    if (currentPercentage >= goalPercentage - 15) return '💪 כמעט שם!';
    return '🚀 המשך/י כך!';
  };

  return (
    <div className="bg-card/50 rounded-2xl p-6 border border-border/50">
      <div className="flex flex-col items-center">
        {/* Header */}
        <h3 className="text-lg font-bold text-foreground mb-4">יעד שבועי</h3>
        
        {/* Ring Container */}
        <div className="relative">
          <svg
            width={size}
            height={size}
            className="transform -rotate-90"
          >
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth={strokeWidth}
            />
            
            {/* Goal marker (70% line) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted-foreground) / 0.3)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={goalOffset}
              strokeLinecap="round"
              className="opacity-50"
            />
            
            {/* Progress arc */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={`hsl(${progressColor})`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: progressOffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                filter: `drop-shadow(0 0 8px hsl(${progressColor} / 0.5))`,
              }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-3xl font-black"
              style={{ color: `hsl(${progressColor})` }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              {Math.round(currentPercentage)}%
            </motion.span>
            <span className="text-xs text-muted-foreground mt-1">
              מתוך {goalPercentage}%
            </span>
          </div>
        </div>

        {/* Motivational message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-center"
        >
          <span className="text-lg font-semibold">{getMessage()}</span>
        </motion.div>

        {/* Goal indicator legend */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ background: `hsl(${progressColor})` }}
            />
            <span>התקדמות</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span>יעד 70%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
