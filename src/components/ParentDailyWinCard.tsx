import { motion } from 'framer-motion';
import { TrendingUp, Heart, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ParentDailyWinCardProps {
  childName: string;
  creditsEarned: number;
  tasksCompleted: number;
  totalTasks: number;
  onViewInsight?: () => void;
  onDismiss?: () => void;
}

export function ParentDailyWinCard({
  childName,
  creditsEarned,
  tasksCompleted,
  totalTasks,
  onViewInsight,
  onDismiss,
}: ParentDailyWinCardProps) {
  const { t } = useLanguage();
  const completionPct = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 20 }}
      className="rounded-2xl bg-card border border-accent/30 p-5 space-y-4 overflow-hidden relative"
    >
      {/* Subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />

      <div className="relative flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-sm">
            🎉 {t('dailyWin.title')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {childName} {t('dailyWin.completedTasks').replace('{count}', String(tasksCompleted)).replace('{total}', String(totalTasks))}
          </p>
        </div>
        <div className="text-end shrink-0">
          <span className="text-xl font-black text-primary">+{creditsEarned}</span>
          <p className="text-[10px] text-muted-foreground">XP</p>
        </div>
      </div>

      {/* Momentum bar */}
      <div className="relative">
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {t('dailyWin.momentum')}: {completionPct}%
        </p>
      </div>

      {/* Coaching tip */}
      <div className="flex gap-2.5 p-3 rounded-xl bg-secondary/50 border border-border">
        <Heart className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">{t('dailyWin.coachingTitle')}: </span>
          {t('dailyWin.coachingTip').replace('{name}', childName)}
        </div>
      </div>

      {/* View Deep Insight button */}
      {onViewInsight && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewInsight}
          className="w-full justify-between text-xs text-primary hover:text-primary hover:bg-primary/5"
        >
          {t('dailyWin.viewInsight')}
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
}
