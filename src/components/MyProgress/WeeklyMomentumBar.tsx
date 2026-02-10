import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface WeeklyMomentumBarProps {
  category: string;
  categoryIcon: string;
  completedDays: boolean[];
  color: string;
}

const DAY_LABELS_HE = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const DAY_LABELS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function WeeklyMomentumBar({ 
  category, 
  categoryIcon, 
  completedDays,
  color 
}: WeeklyMomentumBarProps) {
  const { t, language } = useLanguage();
  const completedCount = completedDays.filter(Boolean).length;
  const dayLabels = language === 'he' ? DAY_LABELS_HE : DAY_LABELS_EN;

  return (
    <div className="bg-card/50 rounded-2xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{categoryIcon}</span>
          <span className="font-semibold text-foreground">{category}</span>
        </div>
        <span className="text-sm font-medium" style={{ color: `hsl(${color})` }}>
          {completedCount} {t('myProgress.outOf7')}
        </span>
      </div>

      <div className="flex items-center justify-between gap-1">
        {completedDays.map((isCompleted, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                isCompleted ? "shadow-buff-glow" : "bg-secondary/50"
              )}
              style={{
                background: isCompleted ? `hsl(${color})` : undefined,
                boxShadow: isCompleted ? `0 0 12px hsl(${color} / 0.6), 0 0 24px hsl(${color} / 0.3)` : undefined,
              }}
            >
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.1, type: "spring", stiffness: 500 }}
                  className="w-2 h-2 bg-black/30 rounded-full"
                />
              )}
            </motion.div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {dayLabels[index]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
