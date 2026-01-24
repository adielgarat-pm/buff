import { useState, useEffect, useCallback } from 'react';
import { Task, DailyProgress, Reward, Lesson, Timetable, WEEK_DAYS, PeriodInfo, WeekDay, StoreReward, VaultData } from '@/types/task';

const DEFAULT_TASKS: Omit<Task, 'completed' | 'completedAt'>[] = [
  { id: '1', title: 'Morning Meds', time: '08:00', category: 'medication', credits: 5 },
  { id: '2', title: 'Breakfast', time: '08:30', category: 'nutrition', credits: 15 },
  { id: '3', title: 'Hydration Check', time: '12:00', category: 'nutrition', credits: 5 },
  { id: '4', title: 'Homework Check', time: '14:00', category: 'school', credits: 15, hideOnWeekend: true },
  { id: '5', title: 'Study Session', time: '16:00', category: 'school', credits: 30 },
  { id: '6', title: 'Shower', time: '20:00', category: 'hygiene', credits: 20 },
  { id: '7', title: 'Evening Meds', time: '21:00', category: 'medication', credits: 5 },
];

// Weekend is Friday (5) and Saturday (6)
const isWeekend = (): boolean => {
  const day = new Date().getDay();
  return day === 5 || day === 6; // Friday = 5, Saturday = 6
};

const DEFAULT_LESSONS: Omit<Lesson, 'completed'>[] = [
  { id: 'lesson1', label: 'P1', credits: 10 },
  { id: 'lesson2', label: 'P2', credits: 10 },
  { id: 'lesson3', label: 'P3', credits: 10 },
  { id: 'lesson4', label: 'P4', credits: 10 },
  { id: 'lesson5', label: 'P5', credits: 10 },
  { id: 'lesson6', label: 'P6', credits: 10 },
  { id: 'lesson7', label: 'P7', credits: 10 },
  { id: 'lesson8', label: 'P8', credits: 10 },
];

const DEFAULT_PERIOD_TIMES = [
  '08:00', '08:50', '09:40', '10:40', '11:30', '12:20', '13:10', '14:00'
];

const createDefaultTimetable = (): Timetable => {
  const timetable: Timetable = {};
  WEEK_DAYS.forEach(day => {
    timetable[day] = DEFAULT_PERIOD_TIMES.map(time => ({
      subject: '',
      startTime: time,
    }));
  });
  return timetable;
};

const DEFAULT_REWARDS: Reward[] = [
  { id: 'r1', title: '30 min Gaming', requiredCredits: 50, icon: '🎮' },
  { id: 'r2', title: 'Extra Screen Time', requiredCredits: 100, icon: '📱' },
  { id: 'r3', title: 'Choose Dinner', requiredCredits: 125, icon: '🍕' },
  { id: 'r4', title: 'Weekend Activity', requiredCredits: 150, icon: '🎯' },
];

const DEFAULT_STORE_REWARDS: StoreReward[] = [
  { id: 'store1', title: 'New Gaming Mouse', icon: '🖱️', price: 2000, claimed: false },
  { id: 'store2', title: 'Movie Night Out', icon: '🎬', price: 1000, claimed: false },
  { id: 'store3', title: 'New Game', icon: '🎮', price: 3000, claimed: false },
];

const DAILY_GOAL = 150;

const getTodayKey = () => new Date().toISOString().split('T')[0];

const getTodayWeekDay = (): WeekDay | null => {
  const dayIndex = new Date().getDay();
  if (dayIndex >= 0 && dayIndex <= 4) {
    return WEEK_DAYS[dayIndex];
  }
  return null;
};

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [timetable, setTimetable] = useState<Timetable>(createDefaultTimetable);
  const [rewards, setRewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [dailyGoal, setDailyGoal] = useState(DAILY_GOAL);
  const [appTitle, setAppTitle] = useState('Daily Quests');
  const [lessonRemindersEnabled, setLessonRemindersEnabled] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [storeRewards, setStoreRewards] = useState<StoreReward[]>(DEFAULT_STORE_REWARDS);
  const [lastVaultDate, setLastVaultDate] = useState<string>('');
  const [respectfulLearningBonus, setRespectfulLearningBonus] = useState(false);
  const [lessonNotes, setLessonNotes] = useState<Record<string, string>>({});

  // Initialize tasks, lessons, timetable, and vault from localStorage or defaults
  useEffect(() => {
    const todayKey = getTodayKey();
    const storedProgress = localStorage.getItem(`progress_${todayKey}`);
    const storedTasks = localStorage.getItem('customTasks');
    const storedRewards = localStorage.getItem('customRewards');
    const storedGoal = localStorage.getItem('dailyGoal');
    const storedTimetable = localStorage.getItem('timetable');
    const storedLessonReminders = localStorage.getItem('lessonRemindersEnabled');
    const storedVault = localStorage.getItem('creditVault');
    const storedStoreRewards = localStorage.getItem('storeRewards');
    const storedAppTitle = localStorage.getItem('appTitle');

    const baseTasks = storedTasks ? JSON.parse(storedTasks) : DEFAULT_TASKS;
    
    if (storedProgress) {
      const progress: DailyProgress = JSON.parse(storedProgress);
      setTasks(baseTasks.map((task: Omit<Task, 'completed' | 'completedAt'>) => ({
        ...task,
        completed: progress.completedTasks.includes(task.id),
      })));
      setLessons(DEFAULT_LESSONS.map((lesson) => ({
        ...lesson,
        completed: progress.completedLessons?.includes(lesson.id) || false,
        note: progress.lessonNotes?.[lesson.id] || undefined,
      })));
      setRespectfulLearningBonus(progress.respectfulLearningBonus || false);
      setLessonNotes(progress.lessonNotes || {});
    } else {
      setTasks(baseTasks.map((task: Omit<Task, 'completed' | 'completedAt'>) => ({
        ...task,
        completed: false,
      })));
      setLessons(DEFAULT_LESSONS.map((lesson) => ({
        ...lesson,
        completed: false,
      })));
      setRespectfulLearningBonus(false);
      setLessonNotes({});
    }

    if (storedRewards) {
      setRewards(JSON.parse(storedRewards));
    }

    if (storedGoal) {
      setDailyGoal(parseInt(storedGoal, 10));
    }

    if (storedTimetable) {
      setTimetable(JSON.parse(storedTimetable));
    }

    if (storedLessonReminders !== null) {
      setLessonRemindersEnabled(JSON.parse(storedLessonReminders));
    }

    // Load vault data
    if (storedVault) {
      const vault: VaultData = JSON.parse(storedVault);
      setTotalBalance(vault.totalBalance);
      setLastVaultDate(vault.lastUpdatedDate);
    }

    if (storedStoreRewards) {
      setStoreRewards(JSON.parse(storedStoreRewards));
    }

    if (storedAppTitle) {
      setAppTitle(storedAppTitle);
    }
  }, []);

  // Save progress and update vault whenever tasks or lessons change
  useEffect(() => {
    if (tasks.length === 0) return;
    
    const todayKey = getTodayKey();
    const taskCredits = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.credits, 0);
    const lessonCredits = lessons.filter(l => l.completed).reduce((sum, l) => sum + l.credits, 0);
    const bonusCredits = respectfulLearningBonus ? 20 : 0;
    const todayEarned = taskCredits + lessonCredits + bonusCredits;
    
    const progress: DailyProgress = {
      date: todayKey,
      earnedCredits: todayEarned,
      completedTasks: tasks.filter(t => t.completed).map(t => t.id),
      completedLessons: lessons.filter(l => l.completed).map(l => l.id),
      respectfulLearningBonus,
      lessonNotes,
    };
    localStorage.setItem(`progress_${todayKey}`, JSON.stringify(progress));

    // Update vault balance - add today's credits if not already added
    if (lastVaultDate !== todayKey) {
      // New day, add the full earned credits
      const newBalance = totalBalance + todayEarned;
      setTotalBalance(newBalance);
      setLastVaultDate(todayKey);
      const vault: VaultData = {
        totalBalance: newBalance,
        lastUpdatedDate: todayKey,
        storeRewards,
      };
      localStorage.setItem('creditVault', JSON.stringify(vault));
    } else {
      // Same day, recalculate based on current tasks
      // Get yesterday's vault balance (before today's credits)
      const storedVault = localStorage.getItem('creditVault');
      if (storedVault) {
        const prevVault: VaultData = JSON.parse(storedVault);
        const prevProgress = localStorage.getItem(`progress_${todayKey}`);
        const prevEarned = prevProgress ? JSON.parse(prevProgress).earnedCredits : 0;
        
        // Only update if credits changed
        if (prevEarned !== todayEarned) {
          const baseBalance = prevVault.totalBalance - prevEarned + todayEarned;
          setTotalBalance(baseBalance);
          const vault: VaultData = {
            totalBalance: baseBalance,
            lastUpdatedDate: todayKey,
            storeRewards,
          };
          localStorage.setItem('creditVault', JSON.stringify(vault));
        }
      }
    }
  }, [tasks, lessons, respectfulLearningBonus, lessonNotes]);

  const completeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: true, completedAt: new Date() }
        : task
    ));
  }, []);

  const uncompleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: false, completedAt: undefined }
        : task
    ));
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      const baseTasks = updated.map(({ completed, completedAt, ...rest }) => rest);
      localStorage.setItem('customTasks', JSON.stringify(baseTasks));
      return updated;
    });
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'completed' | 'completedAt'>) => {
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}`,
      completed: false,
    };
    setTasks(prev => {
      const updated = [...prev, newTask].sort((a, b) => a.time.localeCompare(b.time));
      const baseTasks = updated.map(({ completed, completedAt, ...rest }) => rest);
      localStorage.setItem('customTasks', JSON.stringify(baseTasks));
      return updated;
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== taskId);
      const baseTasks = updated.map(({ completed, completedAt, ...rest }) => rest);
      localStorage.setItem('customTasks', JSON.stringify(baseTasks));
      return updated;
    });
  }, []);

  const updateDailyGoal = useCallback((goal: number) => {
    setDailyGoal(goal);
    localStorage.setItem('dailyGoal', goal.toString());
  }, []);

  const updateAppTitle = useCallback((title: string) => {
    setAppTitle(title);
    localStorage.setItem('appTitle', title);
  }, []);

  const toggleLesson = useCallback((lessonId: string) => {
    setLessons(prev => prev.map(lesson =>
      lesson.id === lessonId
        ? { ...lesson, completed: !lesson.completed }
        : lesson
    ));
  }, []);

  const toggleRespectfulLearningBonus = useCallback(() => {
    setRespectfulLearningBonus(prev => !prev);
  }, []);

  const updateLessonNote = useCallback((lessonId: string, note: string) => {
    setLessonNotes(prev => ({
      ...prev,
      [lessonId]: note,
    }));
    setLessons(prev => prev.map(lesson =>
      lesson.id === lessonId
        ? { ...lesson, note }
        : lesson
    ));
  }, []);

  const updateTimetable = useCallback((newTimetable: Timetable) => {
    setTimetable(newTimetable);
    localStorage.setItem('timetable', JSON.stringify(newTimetable));
  }, []);

  const toggleLessonReminders = useCallback((enabled: boolean) => {
    setLessonRemindersEnabled(enabled);
    localStorage.setItem('lessonRemindersEnabled', JSON.stringify(enabled));
  }, []);

  const redeemStoreReward = useCallback((rewardId: string) => {
    const reward = storeRewards.find(r => r.id === rewardId);
    if (!reward || reward.claimed || totalBalance < reward.price) return;

    const newBalance = totalBalance - reward.price;
    const updatedRewards = storeRewards.map(r =>
      r.id === rewardId ? { ...r, claimed: true, claimedAt: new Date().toISOString() } : r
    );

    setTotalBalance(newBalance);
    setStoreRewards(updatedRewards);

    const vault: VaultData = {
      totalBalance: newBalance,
      lastUpdatedDate: lastVaultDate,
      storeRewards: updatedRewards,
    };
    localStorage.setItem('creditVault', JSON.stringify(vault));
    localStorage.setItem('storeRewards', JSON.stringify(updatedRewards));
  }, [storeRewards, totalBalance, lastVaultDate]);

  const updateStoreRewards = useCallback((rewards: StoreReward[]) => {
    setStoreRewards(rewards);
    localStorage.setItem('storeRewards', JSON.stringify(rewards));
    
    const vault: VaultData = {
      totalBalance,
      lastUpdatedDate: lastVaultDate,
      storeRewards: rewards,
    };
    localStorage.setItem('creditVault', JSON.stringify(vault));
  }, [totalBalance, lastVaultDate]);

  // Get today's schedule from timetable
  const todayWeekDay = getTodayWeekDay();
  const todaySchedule: PeriodInfo[] = todayWeekDay ? (timetable[todayWeekDay] || []) : [];

  // Create dynamic lessons based on today's timetable
  const todayLessons = lessons.map((lesson, index) => {
    const periodInfo = todaySchedule[index];
    const subject = periodInfo?.subject || '';
    return {
      ...lesson,
      label: subject || `P${index + 1}`,
      displayLabel: subject ? `${subject}` : `Period ${index + 1}`,
    };
  });

  // Filter tasks based on weekend visibility
  const visibleTasks = isWeekend() 
    ? tasks.filter(t => !t.hideOnWeekend) 
    : tasks;

  const taskCredits = visibleTasks.filter(t => t.completed).reduce((sum, t) => sum + t.credits, 0);
  const lessonCredits = isWeekend() ? 0 : lessons.filter(l => l.completed).reduce((sum, l) => sum + l.credits, 0);
  const bonusCredits = respectfulLearningBonus && !isWeekend() ? 20 : 0;
  const earnedCredits = taskCredits + lessonCredits + bonusCredits;
  const totalPossibleCredits = visibleTasks.reduce((sum, t) => sum + t.credits, 0) + (isWeekend() ? 0 : lessons.reduce((sum, l) => sum + l.credits, 0)) + (isWeekend() ? 0 : 20);
  const progressPercent = dailyGoal > 0 ? Math.min((earnedCredits / dailyGoal) * 100, 100) : 0;
  const unlockedRewards = rewards.filter(r => earnedCredits >= r.requiredCredits);

  return {
    tasks: visibleTasks,
    lessons,
    todayLessons,
    timetable,
    todaySchedule,
    rewards,
    dailyGoal,
    appTitle,
    earnedCredits,
    totalPossibleCredits,
    progressPercent,
    unlockedRewards,
    lessonRemindersEnabled,
    totalBalance,
    storeRewards,
    respectfulLearningBonus,
    lessonNotes,
    completeTask,
    uncompleteTask,
    updateTask,
    addTask,
    deleteTask,
    updateDailyGoal,
    updateAppTitle,
    toggleLesson,
    updateTimetable,
    toggleLessonReminders,
    redeemStoreReward,
    updateStoreRewards,
    toggleRespectfulLearningBonus,
    updateLessonNote,
  };
}
