import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { WeeklyMomentumBar } from './WeeklyMomentumBar';
import { WeeklyGoalRing } from './WeeklyGoalRing';
import { TicketWallet } from './TicketWallet';
import { TaskCategory } from '@/types/task';

interface MyProgressProps {
  onClose?: () => void;
  // Weekly stats by category - each has 7 days of completion data
  weeklyStats?: {
    learning: boolean[];
    organization: boolean[];
    'self-care': boolean[];
    responsibility: boolean[];
    movement: boolean[];
  };
  weeklyCompletionRate?: number; // 0-100
  restTickets?: number;
  // Active categories - only these will be shown
  activeCategories?: TaskCategory[];
}

// 5-Category configurations with colors (HSL without hsl() wrapper)
const CATEGORIES = [
  { 
    id: 'learning' as TaskCategory, 
    label: 'למידה', 
    labelEn: 'Learning',
    icon: '📚',
    color: '217 91% 60%', // Blue
  },
  { 
    id: 'organization' as TaskCategory, 
    label: 'התארגנות', 
    labelEn: 'Organization',
    icon: '📅',
    color: '25 95% 53%', // Orange
  },
  { 
    id: 'self-care' as TaskCategory, 
    label: 'טיפול עצמי', 
    labelEn: 'Self-Care',
    icon: '✨',
    color: '330 80% 60%', // Pink
  },
  { 
    id: 'responsibility' as TaskCategory, 
    label: 'בית ואחריות', 
    labelEn: 'Responsibility',
    icon: '🏠',
    color: '271 81% 56%', // Purple
  },
  { 
    id: 'movement' as TaskCategory, 
    label: 'גוף ותנועה', 
    labelEn: 'Movement',
    icon: '⚡',
    color: '142 76% 36%', // Green
  },
] as const;

export function MyProgress({ 
  onClose, 
  weeklyStats,
  weeklyCompletionRate = 0,
  restTickets = 2,
  activeCategories,
}: MyProgressProps) {
  // Default mock data if not provided - now with 5 categories
  const stats = useMemo(() => weeklyStats || {
    learning: [true, true, false, true, true, false, false],
    organization: [true, false, true, true, false, true, false],
    'self-care': [true, true, true, false, true, false, false],
    responsibility: [false, true, false, true, true, false, true],
    movement: [true, false, true, false, false, true, false],
  }, [weeklyStats]);

  // Filter categories to only show active ones (with at least one task)
  const visibleCategories = useMemo(() => {
    if (!activeCategories || activeCategories.length === 0) {
      // If no filter provided, show all (for backwards compatibility)
      return CATEGORIES;
    }
    return CATEGORIES.filter(cat => activeCategories.includes(cat.id));
  }, [activeCategories]);

  // Calculate overall completion if not provided
  const overallRate = useMemo(() => {
    if (weeklyCompletionRate > 0) return weeklyCompletionRate;
    
    const allDays = [
      ...stats.learning, 
      ...stats.organization, 
      ...stats['self-care'], 
      ...stats.responsibility, 
      ...stats.movement
    ];
    const completedDays = allDays.filter(Boolean).length;
    return Math.round((completedDays / allDays.length) * 100);
  }, [weeklyCompletionRate, stats]);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">ההתקדמות שלי</h2>
            <p className="text-sm text-muted-foreground">סיכום שבועי</p>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        )}
      </motion.div>

      {/* Weekly Goal Ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <WeeklyGoalRing currentPercentage={overallRate} goalPercentage={70} />
      </motion.div>

      {/* Weekly Momentum Bars - Only show active categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h3 className="text-lg font-bold text-foreground">מומנטום שבועי</h3>
        
        {visibleCategories.length > 0 ? (
          visibleCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <WeeklyMomentumBar
                category={category.label}
                categoryIcon={category.icon}
                completedDays={stats[category.id]}
                color={category.color}
              />
            </motion.div>
          ))
        ) : (
          /* Empty State - No active tasks */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-card/30 rounded-2xl p-8 border border-border/30 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-lg font-bold text-foreground mb-2">
              אין משימות פעילות כרגע
            </h4>
            <p className="text-sm text-muted-foreground">
              זמן מצוין להטעין מצברים! 🔋✨
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Ticket Wallet */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <TicketWallet restTickets={restTickets} maxTickets={3} />
      </motion.div>
    </div>
  );
}
