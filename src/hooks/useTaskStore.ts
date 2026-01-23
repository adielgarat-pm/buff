import { useState, useEffect, useCallback } from 'react';
import { Task, DailyProgress, Reward, Lesson, Timetable, WEEK_DAYS, PeriodInfo, WeekDay } from '@/types/task';

const DEFAULT_TASKS: Omit<Task, 'completed' | 'completedAt'>[] = [
  { id: '1', title: 'Morning Meds', time: '08:00', category: 'medication', credits: 5 },
  { id: '2', title: 'Breakfast', time: '08:30', category: 'nutrition', credits: 15 },
  { id: '3', title: 'Hydration Check', time: '12:00', category: 'nutrition', credits: 5 },
  { id: '4', title: 'Homework Check', time: '14:00', category: 'school', credits: 15 },
  { id: '5', title: 'Study Session', time: '16:00', category: 'school', credits: 30 },
  { id: '6', title: 'Shower', time: '20:00', category: 'hygiene', credits: 20 },
  { id: '7', title: 'Evening Meds', time: '21:00', category: 'medication', credits: 5 },
];

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
  const [lessonRemindersEnabled, setLessonRemindersEnabled] = useState(true);

  // Initialize tasks, lessons, and timetable from localStorage or defaults
  useEffect(() => {
    const todayKey = getTodayKey();
    const storedProgress = localStorage.getItem(`progress_${todayKey}`);
    const storedTasks = localStorage.getItem('customTasks');
    const storedRewards = localStorage.getItem('customRewards');
    const storedGoal = localStorage.getItem('dailyGoal');
    const storedTimetable = localStorage.getItem('timetable');
    const storedLessonReminders = localStorage.getItem('lessonRemindersEnabled');

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
      })));
    } else {
      setTasks(baseTasks.map((task: Omit<Task, 'completed' | 'completedAt'>) => ({
        ...task,
        completed: false,
      })));
      setLessons(DEFAULT_LESSONS.map((lesson) => ({
        ...lesson,
        completed: false,
      })));
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
  }, []);

  // Save progress whenever tasks or lessons change
  useEffect(() => {
    if (tasks.length === 0) return;
    
    const todayKey = getTodayKey();
    const taskCredits = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.credits, 0);
    const lessonCredits = lessons.filter(l => l.completed).reduce((sum, l) => sum + l.credits, 0);
    const progress: DailyProgress = {
      date: todayKey,
      earnedCredits: taskCredits + lessonCredits,
      completedTasks: tasks.filter(t => t.completed).map(t => t.id),
      completedLessons: lessons.filter(l => l.completed).map(l => l.id),
    };
    localStorage.setItem(`progress_${todayKey}`, JSON.stringify(progress));
  }, [tasks, lessons]);

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

  const toggleLesson = useCallback((lessonId: string) => {
    setLessons(prev => prev.map(lesson =>
      lesson.id === lessonId
        ? { ...lesson, completed: !lesson.completed }
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

  const taskCredits = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.credits, 0);
  const lessonCredits = lessons.filter(l => l.completed).reduce((sum, l) => sum + l.credits, 0);
  const earnedCredits = taskCredits + lessonCredits;
  const totalPossibleCredits = tasks.reduce((sum, t) => sum + t.credits, 0) + lessons.reduce((sum, l) => sum + l.credits, 0);
  const progressPercent = dailyGoal > 0 ? Math.min((earnedCredits / dailyGoal) * 100, 100) : 0;
  const unlockedRewards = rewards.filter(r => earnedCredits >= r.requiredCredits);

  return {
    tasks,
    lessons,
    todayLessons,
    timetable,
    todaySchedule,
    rewards,
    dailyGoal,
    earnedCredits,
    totalPossibleCredits,
    progressPercent,
    unlockedRewards,
    lessonRemindersEnabled,
    completeTask,
    uncompleteTask,
    updateTask,
    addTask,
    deleteTask,
    updateDailyGoal,
    toggleLesson,
    updateTimetable,
    toggleLessonReminders,
  };
}
