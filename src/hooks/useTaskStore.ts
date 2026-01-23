import { useState, useEffect, useCallback } from 'react';
import { Task, DailyProgress, Reward } from '@/types/task';

const DEFAULT_TASKS: Omit<Task, 'completed' | 'completedAt'>[] = [
  { id: '1', title: 'Morning Meds', time: '08:00', category: 'medication', credits: 15 },
  { id: '2', title: 'Breakfast', time: '08:30', category: 'nutrition', credits: 10 },
  { id: '3', title: 'Brush Teeth (AM)', time: '09:00', category: 'hygiene', credits: 5 },
  { id: '4', title: 'Hydration Check', time: '12:00', category: 'nutrition', credits: 5 },
  { id: '5', title: 'Lunch', time: '12:30', category: 'nutrition', credits: 10 },
  { id: '6', title: 'Homework Session', time: '16:00', category: 'school', credits: 25 },
  { id: '7', title: 'Evening Meds', time: '18:00', category: 'medication', credits: 15 },
  { id: '8', title: 'Dinner', time: '19:00', category: 'nutrition', credits: 10 },
  { id: '9', title: 'Shower', time: '21:00', category: 'hygiene', credits: 10 },
  { id: '10', title: 'Brush Teeth (PM)', time: '21:30', category: 'hygiene', credits: 5 },
];

const DEFAULT_REWARDS: Reward[] = [
  { id: 'r1', title: '30 min Gaming', requiredCredits: 50, icon: '🎮' },
  { id: 'r2', title: 'Extra Screen Time', requiredCredits: 75, icon: '📱' },
  { id: 'r3', title: 'Choose Dinner', requiredCredits: 100, icon: '🍕' },
  { id: 'r4', title: 'Weekend Activity', requiredCredits: 110, icon: '🎯' },
];

const DAILY_GOAL = 110;

const getTodayKey = () => new Date().toISOString().split('T')[0];

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [dailyGoal, setDailyGoal] = useState(DAILY_GOAL);

  // Initialize tasks from localStorage or defaults
  useEffect(() => {
    const todayKey = getTodayKey();
    const storedProgress = localStorage.getItem(`progress_${todayKey}`);
    const storedTasks = localStorage.getItem('customTasks');
    const storedRewards = localStorage.getItem('customRewards');
    const storedGoal = localStorage.getItem('dailyGoal');

    const baseTasks = storedTasks ? JSON.parse(storedTasks) : DEFAULT_TASKS;
    
    if (storedProgress) {
      const progress: DailyProgress = JSON.parse(storedProgress);
      setTasks(baseTasks.map((task: Omit<Task, 'completed' | 'completedAt'>) => ({
        ...task,
        completed: progress.completedTasks.includes(task.id),
      })));
    } else {
      setTasks(baseTasks.map((task: Omit<Task, 'completed' | 'completedAt'>) => ({
        ...task,
        completed: false,
      })));
    }

    if (storedRewards) {
      setRewards(JSON.parse(storedRewards));
    }

    if (storedGoal) {
      setDailyGoal(parseInt(storedGoal, 10));
    }
  }, []);

  // Save progress whenever tasks change
  useEffect(() => {
    if (tasks.length === 0) return;
    
    const todayKey = getTodayKey();
    const progress: DailyProgress = {
      date: todayKey,
      earnedCredits: tasks.filter(t => t.completed).reduce((sum, t) => sum + t.credits, 0),
      completedTasks: tasks.filter(t => t.completed).map(t => t.id),
    };
    localStorage.setItem(`progress_${todayKey}`, JSON.stringify(progress));
  }, [tasks]);

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

  const earnedCredits = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.credits, 0);
  const totalPossibleCredits = tasks.reduce((sum, t) => sum + t.credits, 0);
  const progressPercent = dailyGoal > 0 ? Math.min((earnedCredits / dailyGoal) * 100, 100) : 0;
  const unlockedRewards = rewards.filter(r => earnedCredits >= r.requiredCredits);

  return {
    tasks,
    rewards,
    dailyGoal,
    earnedCredits,
    totalPossibleCredits,
    progressPercent,
    unlockedRewards,
    completeTask,
    uncompleteTask,
    updateTask,
    addTask,
    deleteTask,
    updateDailyGoal,
  };
}
