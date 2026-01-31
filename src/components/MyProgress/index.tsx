import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { WeeklyMomentumBar } from './WeeklyMomentumBar';
import { WeeklyGoalRing } from './WeeklyGoalRing';
import { TicketWallet } from './TicketWallet';

interface MyProgressProps {
  onClose?: () => void;
  // Weekly stats by category - each has 7 days of completion data
  weeklyStats?: {
    math: boolean[];
    coding: boolean[];
    other: boolean[];
  };
  weeklyCompletionRate?: number; // 0-100
  restTickets?: number;
}

// Category configurations with colors (HSL without hsl() wrapper)
const CATEGORIES = [
  { 
    id: 'math', 
    label: 'מתמטיקה', 
    icon: '🧮',
    color: '183 100% 50%', // Neon Cyan
  },
  { 
    id: 'coding', 
    label: 'קוד', 
    icon: '💻',
    color: '112 100% 54%', // Electric Green
  },
  { 
    id: 'other', 
    label: 'אחר', 
    icon: '📚',
    color: '38 92% 50%', // Orange/Warning
  },
] as const;

export function MyProgress({ 
  onClose, 
  weeklyStats,
  weeklyCompletionRate = 0,
  restTickets = 2,
}: MyProgressProps) {
  // Default mock data if not provided
  const stats = useMemo(() => weeklyStats || {
    math: [true, true, false, true, true, false, false],
    coding: [true, false, true, true, false, true, false],
    other: [true, true, true, false, true, false, false],
  }, [weeklyStats]);

  // Calculate overall completion if not provided
  const overallRate = useMemo(() => {
    if (weeklyCompletionRate > 0) return weeklyCompletionRate;
    
    const allDays = [...stats.math, ...stats.coding, ...stats.other];
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

      {/* Weekly Momentum Bars */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h3 className="text-lg font-bold text-foreground">מומנטום שבועי</h3>
        
        {CATEGORIES.map((category, index) => (
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
        ))}
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
