import { useMemo } from 'react';
import { DailyProgress, StoreReward, TaskCategory, WeeklySummaryData, Task } from '@/types/task';

const getLastSaturday = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // If today is Saturday (6), return today; otherwise go back to last Saturday
  const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  const lastSaturday = new Date(today);
  lastSaturday.setDate(today.getDate() - daysToSubtract);
  lastSaturday.setHours(0, 0, 0, 0);
  return lastSaturday;
};

const getWeekRange = (): { start: Date; end: Date } => {
  const end = getLastSaturday();
  const start = new Date(end);
  start.setDate(end.getDate() - 6); // 7 days including Saturday
  return { start, end };
};

const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getDayLabel = (dateKey: string): string => {
  const date = new Date(dateKey);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

export function useWeeklySummary(tasks: Task[], storeRewards: StoreReward[]): WeeklySummaryData {
  return useMemo(() => {
    const { start, end } = getWeekRange();
    const weekStartDate = formatDateKey(start);
    const weekEndDate = formatDateKey(end);

    let totalCreditsEarned = 0;
    const tasksByCategory: Record<TaskCategory, number> = {
      learning: 0,
      organization: 0,
      'self-care': 0,
      responsibility: 0,
      movement: 0,
    };
    const dailyCredits: { day: string; credits: number }[] = [];

    // Iterate through each day of the week
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateKey = formatDateKey(currentDate);
      const storedProgress = localStorage.getItem(`progress_${dateKey}`);
      
      if (storedProgress) {
        const progress: DailyProgress = JSON.parse(storedProgress);
        totalCreditsEarned += progress.earnedCredits;
        
        // Count completed tasks by category
        progress.completedTasks.forEach(taskId => {
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            tasksByCategory[task.category]++;
          }
        });
        
        // Also count lessons as learning category
        tasksByCategory.learning += progress.completedLessons?.length || 0;
        
        dailyCredits.push({
          day: getDayLabel(dateKey),
          credits: progress.earnedCredits,
        });
      } else {
        dailyCredits.push({
          day: getDayLabel(dateKey),
          credits: 0,
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Find rewards redeemed this week
    const redeemedRewards = storeRewards.filter(reward => {
      if (!reward.claimed || !reward.claimedAt) return false;
      const claimedDate = new Date(reward.claimedAt);
      return claimedDate >= start && claimedDate <= end;
    });

    return {
      weekStartDate,
      weekEndDate,
      totalCreditsEarned,
      redeemedRewards,
      tasksByCategory,
      dailyCredits,
    };
  }, [tasks, storeRewards]);
}

export function isSaturday(): boolean {
  return new Date().getDay() === 6;
}
