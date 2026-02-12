import { useState, useEffect, useCallback, useRef } from 'react';
import { Task } from '@/types/task';

interface UsePackCompletionProps {
  tasks: Task[];
  isProUser: boolean;
}

interface PackCompletionState {
  showCelebration: boolean;
  creditsEarned: number;
  childName?: string;
  dismissCelebration: () => void;
}

export function usePackCompletion({ tasks, isProUser }: UsePackCompletionProps): PackCompletionState {
  const [showCelebration, setShowCelebration] = useState(false);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const prevAllCompleteRef = useRef(false);
  const todayKey = new Date().toISOString().split('T')[0];
  const dismissedKeyRef = useRef(`celebration_dismissed_${todayKey}`);

  // Check if all of today's tasks are complete
  const currentDayOfWeek = new Date().getDay();
  const todayTasks = tasks.filter(task => {
    const scheduleDays = task.scheduleDays || [0, 1, 2, 3, 4, 5];
    return scheduleDays.includes(currentDayOfWeek);
  });

  const allComplete = todayTasks.length > 0 && todayTasks.every(t => t.completed);
  const totalCredits = todayTasks.reduce((sum, t) => sum + t.credits, 0);

  useEffect(() => {
    // Trigger celebration when tasks transition from not-all-complete to all-complete
    if (allComplete && !prevAllCompleteRef.current && isProUser) {
      const dismissed = localStorage.getItem(dismissedKeyRef.current);
      if (!dismissed) {
        setCreditsEarned(totalCredits);
        setShowCelebration(true);
      }
    }
    prevAllCompleteRef.current = allComplete;
  }, [allComplete, isProUser, totalCredits]);

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
    localStorage.setItem(dismissedKeyRef.current, 'true');
  }, []);

  return {
    showCelebration,
    creditsEarned,
    dismissCelebration,
  };
}
