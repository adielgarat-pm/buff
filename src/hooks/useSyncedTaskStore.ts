import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task, DailyProgress, Reward, Lesson, Timetable, WEEK_DAYS, PeriodInfo, WeekDay, StoreReward, VaultData } from '@/types/task';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const DEFAULT_REWARDS: Reward[] = [
  { id: 'r1', title: '30 min Gaming', requiredCredits: 50, icon: '🎮' },
  { id: 'r2', title: 'Extra Screen Time', requiredCredits: 100, icon: '📱' },
  { id: 'r3', title: 'Choose Dinner', requiredCredits: 125, icon: '🍕' },
  { id: 'r4', title: 'Weekend Activity', requiredCredits: 150, icon: '🎯' },
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

const isWeekend = (): boolean => {
  const day = new Date().getDay();
  return day === 5 || day === 6;
};

const getTodayKey = () => new Date().toISOString().split('T')[0];

const getTodayWeekDay = (): WeekDay | null => {
  const dayIndex = new Date().getDay();
  if (dayIndex >= 0 && dayIndex <= 4) {
    return WEEK_DAYS[dayIndex];
  }
  return null;
};

export function useSyncedTaskStore() {
  const { familyId } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>(DEFAULT_LESSONS.map(l => ({ ...l, completed: false })));
  const [timetable, setTimetable] = useState<Timetable>({});
  const [rewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [dailyGoal, setDailyGoal] = useState(100);
  const [appTitle, setAppTitle] = useState('Daily Quests');
  const [lessonRemindersEnabled, setLessonRemindersEnabled] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [storeRewards, setStoreRewards] = useState<StoreReward[]>([]);
  const [loading, setLoading] = useState(true);

  const todayKey = getTodayKey();

  // Fetch all family data
  const fetchFamilyData = useCallback(async () => {
    if (!familyId) return;

    try {
      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .order('time');

      // Fetch today's progress
      const { data: progressData } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('family_id', familyId)
        .eq('date', todayKey);

      // Fetch today's lesson progress
      const { data: lessonProgressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('family_id', familyId)
        .eq('date', todayKey);

      // Fetch credit vault
      const { data: vaultData } = await supabase
        .from('credit_vault')
        .select('*')
        .eq('family_id', familyId)
        .maybeSingle();

      // Fetch store rewards
      const { data: rewardsData } = await supabase
        .from('store_rewards')
        .select('*')
        .eq('family_id', familyId);

      // Fetch timetable
      const { data: timetableData } = await supabase
        .from('timetables')
        .select('*')
        .eq('family_id', familyId)
        .maybeSingle();

      // Fetch app settings
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('family_id', familyId)
        .maybeSingle();

      // Map tasks with completion status
      const completedTaskIds = new Set(
        progressData?.filter(p => p.completed).map(p => p.task_id) || []
      );

      const mappedTasks: Task[] = (tasksData || []).map(t => ({
        id: t.id,
        title: t.title,
        time: t.time,
        category: t.category as Task['category'],
        credits: t.credits,
        description: t.description || undefined,
        icon: t.icon || undefined,
        completed: completedTaskIds.has(t.id),
      }));

      setTasks(mappedTasks);

      // Map lessons with completion status
      const completedLessonKeys = new Set(
        lessonProgressData?.filter(l => l.completed).map(l => l.lesson_key) || []
      );

      setLessons(DEFAULT_LESSONS.map(l => ({
        ...l,
        completed: completedLessonKeys.has(l.id),
      })));

      if (vaultData) {
        setTotalBalance(vaultData.total_balance);
      }

      if (rewardsData) {
        setStoreRewards(rewardsData.map(r => ({
          id: r.id,
          title: r.title,
          price: r.price,
          icon: r.emoji,
          claimed: r.claimed,
          claimedAt: r.claimed_at || undefined,
        })));
      }

      if (timetableData?.data) {
        setTimetable(timetableData.data as unknown as Timetable);
      }

      if (settingsData) {
        setAppTitle(settingsData.app_title);
        setDailyGoal(settingsData.daily_goal);
        setLessonRemindersEnabled(settingsData.lesson_reminders_enabled);
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
    } finally {
      setLoading(false);
    }
  }, [familyId, todayKey]);

  // Initial fetch
  useEffect(() => {
    if (familyId) {
      fetchFamilyData();
    } else {
      setLoading(false);
    }
  }, [familyId, fetchFamilyData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!familyId) return;

    const channel = supabase
      .channel('family-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_progress', filter: `family_id=eq.${familyId}` },
        (payload: RealtimePostgresChangesPayload<{ task_id: string; completed: boolean; date: string }>) => {
          if (payload.new && 'date' in payload.new && payload.new.date === todayKey) {
            const { task_id, completed } = payload.new as { task_id: string; completed: boolean };
            setTasks(prev => prev.map(t =>
              t.id === task_id ? { ...t, completed } : t
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lesson_progress', filter: `family_id=eq.${familyId}` },
        (payload: RealtimePostgresChangesPayload<{ lesson_key: string; completed: boolean; date: string }>) => {
          if (payload.new && 'date' in payload.new && payload.new.date === todayKey) {
            const { lesson_key, completed } = payload.new as { lesson_key: string; completed: boolean };
            setLessons(prev => prev.map(l =>
              l.id === lesson_key ? { ...l, completed } : l
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'credit_vault', filter: `family_id=eq.${familyId}` },
        (payload: RealtimePostgresChangesPayload<{ total_balance: number }>) => {
          if (payload.new && 'total_balance' in payload.new) {
            setTotalBalance((payload.new as { total_balance: number }).total_balance);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_rewards', filter: `family_id=eq.${familyId}` },
        () => {
          // Refetch all rewards on any change
          fetchFamilyData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `family_id=eq.${familyId}` },
        () => {
          fetchFamilyData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: `family_id=eq.${familyId}` },
        (payload: RealtimePostgresChangesPayload<{ app_title: string; daily_goal: number; lesson_reminders_enabled: boolean }>) => {
          if (payload.new && 'app_title' in payload.new) {
            const data = payload.new as { app_title: string; daily_goal: number; lesson_reminders_enabled: boolean };
            setAppTitle(data.app_title);
            setDailyGoal(data.daily_goal);
            setLessonRemindersEnabled(data.lesson_reminders_enabled);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timetables', filter: `family_id=eq.${familyId}` },
        (payload: RealtimePostgresChangesPayload<{ data: Timetable }>) => {
          if (payload.new && 'data' in payload.new) {
            setTimetable((payload.new as { data: Timetable }).data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, todayKey, fetchFamilyData]);

  // Complete task
  const completeTask = useCallback(async (taskId: string) => {
    if (!familyId) return;

    // Optimistic update
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: true, completedAt: new Date() } : task
    ));

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Upsert progress
    await supabase
      .from('daily_progress')
      .upsert({
        family_id: familyId,
        date: todayKey,
        task_id: taskId,
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'family_id,date,task_id' });

    // Update vault balance
    const newBalance = totalBalance + task.credits;
    await supabase
      .from('credit_vault')
      .update({ total_balance: newBalance, last_updated_date: todayKey })
      .eq('family_id', familyId);
  }, [familyId, todayKey, tasks, totalBalance]);

  // Uncomplete task
  const uncompleteTask = useCallback(async (taskId: string) => {
    if (!familyId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: false, completedAt: undefined } : t
    ));

    // Update progress
    await supabase
      .from('daily_progress')
      .upsert({
        family_id: familyId,
        date: todayKey,
        task_id: taskId,
        completed: false,
        completed_at: null,
      }, { onConflict: 'family_id,date,task_id' });

    // Update vault balance
    const newBalance = Math.max(0, totalBalance - task.credits);
    await supabase
      .from('credit_vault')
      .update({ total_balance: newBalance, last_updated_date: todayKey })
      .eq('family_id', familyId);
  }, [familyId, todayKey, tasks, totalBalance]);

  // Toggle lesson
  const toggleLesson = useCallback(async (lessonId: string) => {
    if (!familyId) return;

    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const newCompleted = !lesson.completed;

    // Optimistic update
    setLessons(prev => prev.map(l =>
      l.id === lessonId ? { ...l, completed: newCompleted } : l
    ));

    // Upsert lesson progress
    await supabase
      .from('lesson_progress')
      .upsert({
        family_id: familyId,
        date: todayKey,
        lesson_key: lessonId,
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
        credits: lesson.credits,
      }, { onConflict: 'family_id,date,lesson_key' });

    // Update vault balance
    const creditChange = newCompleted ? lesson.credits : -lesson.credits;
    const newBalance = Math.max(0, totalBalance + creditChange);
    await supabase
      .from('credit_vault')
      .update({ total_balance: newBalance, last_updated_date: todayKey })
      .eq('family_id', familyId);
  }, [familyId, todayKey, lessons, totalBalance]);

  // Update task (parent only)
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!familyId) return;

    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ));

    await supabase
      .from('tasks')
      .update({
        title: updates.title,
        time: updates.time,
        category: updates.category,
        credits: updates.credits,
        description: updates.description,
        icon: updates.icon,
      })
      .eq('id', taskId);
  }, [familyId]);

  // Add task (parent only)
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'completed' | 'completedAt'>) => {
    if (!familyId) return;

    const { data } = await supabase
      .from('tasks')
      .insert({
        family_id: familyId,
        title: task.title,
        time: task.time,
        category: task.category,
        credits: task.credits,
        description: task.description,
        icon: task.icon,
      })
      .select()
      .single();

    if (data) {
      setTasks(prev => [...prev, {
        id: data.id,
        title: data.title,
        time: data.time,
        category: data.category as Task['category'],
        credits: data.credits,
        description: data.description || undefined,
        completed: false,
      }].sort((a, b) => a.time.localeCompare(b.time)));
    }
  }, [familyId]);

  // Delete task (parent only)
  const deleteTask = useCallback(async (taskId: string) => {
    if (!familyId) return;

    setTasks(prev => prev.filter(t => t.id !== taskId));

    await supabase.from('tasks').delete().eq('id', taskId);
  }, [familyId]);

  // Update daily goal
  const updateDailyGoal = useCallback(async (goal: number) => {
    if (!familyId) return;

    setDailyGoal(goal);

    await supabase
      .from('app_settings')
      .update({ daily_goal: goal })
      .eq('family_id', familyId);
  }, [familyId]);

  // Update app title
  const updateAppTitle = useCallback(async (title: string) => {
    if (!familyId) return;

    setAppTitle(title);

    await supabase
      .from('app_settings')
      .update({ app_title: title })
      .eq('family_id', familyId);
  }, [familyId]);

  // Update timetable
  const updateTimetable = useCallback(async (newTimetable: Timetable) => {
    if (!familyId) return;

    setTimetable(newTimetable);

    await supabase
      .from('timetables')
      .update({ data: JSON.parse(JSON.stringify(newTimetable)) })
      .eq('family_id', familyId);
  }, [familyId]);

  // Toggle lesson reminders
  const toggleLessonReminders = useCallback(async (enabled: boolean) => {
    if (!familyId) return;

    setLessonRemindersEnabled(enabled);

    await supabase
      .from('app_settings')
      .update({ lesson_reminders_enabled: enabled })
      .eq('family_id', familyId);
  }, [familyId]);

  // Redeem store reward
  const redeemStoreReward = useCallback(async (rewardId: string) => {
    if (!familyId) return;

    const reward = storeRewards.find(r => r.id === rewardId);
    if (!reward || reward.claimed || totalBalance < reward.price) return;

    const newBalance = totalBalance - reward.price;

    // Optimistic update
    setTotalBalance(newBalance);
    setStoreRewards(prev => prev.map(r =>
      r.id === rewardId ? { ...r, claimed: true, claimedAt: new Date().toISOString() } : r
    ));

    // Update database
    await supabase
      .from('store_rewards')
      .update({ claimed: true, claimed_at: new Date().toISOString() })
      .eq('id', rewardId);

    await supabase
      .from('credit_vault')
      .update({ total_balance: newBalance })
      .eq('family_id', familyId);
  }, [familyId, storeRewards, totalBalance]);

  // Update store rewards
  const updateStoreRewards = useCallback(async (rewards: StoreReward[]) => {
    if (!familyId) return;

    setStoreRewards(rewards);

    // Delete all and re-insert (simpler than upsert logic)
    await supabase.from('store_rewards').delete().eq('family_id', familyId);
    await supabase.from('store_rewards').insert(
      rewards.map(r => ({
        id: r.id,
        family_id: familyId,
        title: r.title,
        price: r.price,
        emoji: r.icon,
        claimed: r.claimed,
        claimed_at: r.claimedAt || null,
      }))
    );
  }, [familyId]);

  // Get today's schedule from timetable
  const todayWeekDay = getTodayWeekDay();
  const todaySchedule: PeriodInfo[] = todayWeekDay ? (timetable[todayWeekDay] || []) : [];

  // Create dynamic lessons based on today's actual schedule
  const todayLessons = useMemo(() => {
    return todaySchedule
      .filter(period => period.subject)
      .map((period, index) => {
        const lessonId = `lesson_${index}`;
        const existingLesson = lessons.find(l => l.id === lessonId);
        return {
          id: lessonId,
          label: period.subject,
          displayLabel: period.subject,
          startTime: period.startTime,
          credits: 10,
          completed: existingLesson?.completed || false,
        };
      });
  }, [todaySchedule, lessons]);

  // Filter tasks based on weekend visibility
  const visibleTasks = isWeekend()
    ? tasks.filter(t => !t.hideOnWeekend)
    : tasks;

  const taskCredits = visibleTasks.filter(t => t.completed).reduce((sum, t) => sum + t.credits, 0);
  const lessonCredits = isWeekend() ? 0 : todayLessons.filter(l => l.completed).reduce((sum, l) => sum + l.credits, 0);
  const earnedCredits = taskCredits + lessonCredits;
  const totalPossibleCredits = visibleTasks.reduce((sum, t) => sum + t.credits, 0) + (isWeekend() ? 0 : todayLessons.reduce((sum, l) => sum + l.credits, 0));
  const progressPercent = dailyGoal > 0 ? Math.min((earnedCredits / dailyGoal) * 100, 100) : 0;
  const unlockedRewards = rewards.filter(r => earnedCredits >= r.requiredCredits);

  return {
    loading,
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
  };
}
