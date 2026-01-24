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

const isWeekend = (fridayEnabled: boolean = false): boolean => {
  const day = new Date().getDay();
  // Friday (5) is weekend only if fridayEnabled is false
  if (day === 5) return !fridayEnabled;
  return day === 6; // Saturday is always weekend
};

const getTodayKey = () => new Date().toISOString().split('T')[0];

const getTodayWeekDay = (fridayEnabled: boolean = false): WeekDay | null => {
  const dayIndex = new Date().getDay();
  // Sunday (0) to Thursday (4) are always school days
  if (dayIndex >= 0 && dayIndex <= 4) {
    return WEEK_DAYS[dayIndex];
  }
  // Friday (5) is a school day only if enabled
  if (dayIndex === 5 && fridayEnabled) {
    return 'friday';
  }
  return null;
};

export function useSyncedTaskStore() {
  const { familyId, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>(DEFAULT_LESSONS.map(l => ({ ...l, completed: false })));
  const [timetable, setTimetable] = useState<Timetable>({});
  const [rewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [dailyGoal, setDailyGoal] = useState(100);
  const [appTitle, setAppTitle] = useState('Daily Quests');
  const [lessonRemindersEnabled, setLessonRemindersEnabled] = useState(true);
  const [fridayEnabled, setFridayEnabled] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [storeRewards, setStoreRewards] = useState<StoreReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [buffsActivatedToday, setBuffsActivatedToday] = useState(() => {
    const saved = localStorage.getItem(`buffs_${getTodayKey()}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  // Function to track buff activation
  const activateBuff = useCallback(() => {
    setBuffsActivatedToday(prev => {
      const newCount = prev + 1;
      localStorage.setItem(`buffs_${getTodayKey()}`, String(newCount));
      return newCount;
    });
  }, []);

  const todayKey = getTodayKey();
  const isParent = profile?.role === 'parent';
  const profileId = profile?.id;

  // Fetch all family data - filtered by role
  const fetchFamilyData = useCallback(async () => {
    if (!familyId || !profileId) return;

    try {
      // For children, filter tasks by assigned_to (their id or null for shared)
      // For parents, get all tasks
      let tasksQuery = supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .order('time');

      // RLS already filters this, but we make it explicit for clarity
      // Children will only see tasks assigned to them or unassigned (via RLS)

      const { data: tasksData } = await tasksQuery;

      // Fetch today's progress
      // For children, filter by child_id
      let progressQuery = supabase
        .from('daily_progress')
        .select('*')
        .eq('family_id', familyId)
        .eq('date', todayKey);

      if (!isParent) {
        progressQuery = progressQuery.or(`child_id.is.null,child_id.eq.${profileId}`);
      }

      const { data: progressData } = await progressQuery;

      // Fetch today's lesson progress
      let lessonProgressQuery = supabase
        .from('lesson_progress')
        .select('*')
        .eq('family_id', familyId)
        .eq('date', todayKey);

      if (!isParent) {
        lessonProgressQuery = lessonProgressQuery.or(`child_id.is.null,child_id.eq.${profileId}`);
      }

      const { data: lessonProgressData } = await lessonProgressQuery;

      // Fetch credit vault - always use the family vault (child_id is null)
      const { data: vaultData } = await supabase
        .from('credit_vault')
        .select('*')
        .eq('family_id', familyId)
        .is('child_id', null)
        .maybeSingle();

      // Fetch store rewards
      const { data: rewardsData } = await supabase
        .from('store_rewards')
        .select('*')
        .eq('family_id', familyId);

      // Fetch timetable - for children, get their specific one or shared
      let timetableQuery = supabase
        .from('timetables')
        .select('*')
        .eq('family_id', familyId);

      if (!isParent) {
        timetableQuery = timetableQuery.or(`assigned_to.is.null,assigned_to.eq.${profileId}`);
      }

      const { data: timetableData } = await timetableQuery.maybeSingle();

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
        assignedTo: t.assigned_to || undefined,
        strategyId: t.strategy_id || undefined,
      }));

      setTasks(mappedTasks);

      // Map lessons with completion status
      const completedLessonKeys = new Set(
        lessonProgressData?.filter(l => l.completed).map(l => l.lesson_key) || []
      );

      const mappedLessons = DEFAULT_LESSONS.map(l => ({
        ...l,
        completed: completedLessonKeys.has(l.id),
      }));

      setLessons(mappedLessons);

      // Calculate actual earned credits from completed tasks and lessons
      const completedTaskCredits = mappedTasks
        .filter(t => t.completed)
        .reduce((sum, t) => sum + t.credits, 0);
      
      const completedLessonCredits = lessonProgressData
        ?.filter(l => l.completed)
        .reduce((sum, l) => sum + (l.credits || 0), 0) || 0;
      
      const calculatedTodayCredits = completedTaskCredits + completedLessonCredits;
      
      // Get vault balance and sync if needed
      const storedBalance = vaultData?.total_balance || 0;
      const lastUpdatedDate = vaultData?.last_updated_date;
      
      // If vault was last updated today, use calculated credits
      // Otherwise, add today's credits to the stored balance
      let finalBalance = storedBalance;
      
      if (lastUpdatedDate === todayKey) {
        // Same day - recalculate from scratch for accuracy
        // Find yesterday's balance by subtracting what was earned today based on vault
        // Actually, for simplicity, trust the calculated credits for today
        finalBalance = calculatedTodayCredits;
        
        // Update vault if there's a mismatch
        if (storedBalance !== calculatedTodayCredits && familyId) {
          supabase
            .from('credit_vault')
            .update({ total_balance: calculatedTodayCredits, last_updated_date: todayKey })
            .eq('family_id', familyId)
            .is('child_id', null)
            .then(() => console.log('Vault synced:', calculatedTodayCredits));
        }
      } else if (lastUpdatedDate && lastUpdatedDate < todayKey) {
        // New day - keep historical balance and add today's credits
        finalBalance = storedBalance + calculatedTodayCredits;
        
        // Update vault with new day's progress
        if (familyId) {
          supabase
            .from('credit_vault')
            .update({ total_balance: finalBalance, last_updated_date: todayKey })
            .eq('family_id', familyId)
            .is('child_id', null)
            .then(() => console.log('Vault updated for new day:', finalBalance));
        }
      } else {
        // First time or no date - use calculated
        finalBalance = calculatedTodayCredits;
      }
      
      setTotalBalance(finalBalance);

      if (rewardsData) {
        setStoreRewards(rewardsData.map(r => ({
          id: r.id,
          title: r.title,
          price: r.price,
          icon: r.emoji,
          claimed: r.claimed,
          claimedAt: r.claimed_at || undefined,
          assignedTo: r.assigned_to || undefined,
        })));
      }

      if (timetableData?.data) {
        const loadedTimetable = timetableData.data as unknown as Timetable;
        // Ensure friday exists in timetable
        if (!loadedTimetable.friday) {
          loadedTimetable.friday = [];
        }
        setTimetable(loadedTimetable);
      }

      if (settingsData) {
        setAppTitle(settingsData.app_title);
        setDailyGoal(settingsData.daily_goal);
        setLessonRemindersEnabled(settingsData.lesson_reminders_enabled);
        setFridayEnabled(settingsData.friday_enabled ?? false);
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
    } finally {
      setLoading(false);
    }
  }, [familyId, profileId, isParent, todayKey]);

  // Initial fetch
  useEffect(() => {
    if (familyId && profileId) {
      fetchFamilyData();
    } else {
      setLoading(false);
    }
  }, [familyId, profileId, fetchFamilyData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!familyId) return;

    const channel = supabase
      .channel('family-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_progress', filter: `family_id=eq.${familyId}` },
        (payload: RealtimePostgresChangesPayload<{ task_id: string; completed: boolean; date: string; child_id: string | null }>) => {
          if (payload.new && 'date' in payload.new && payload.new.date === todayKey) {
            const newData = payload.new as { task_id: string; completed: boolean; child_id: string | null };
            // Only update if this is for the current user (child) or if parent
            if (isParent || !newData.child_id || newData.child_id === profileId) {
              const { task_id, completed } = newData;
              setTasks(prev => prev.map(t =>
                t.id === task_id ? { ...t, completed } : t
              ));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lesson_progress', filter: `family_id=eq.${familyId}` },
        (payload: RealtimePostgresChangesPayload<{ lesson_key: string; completed: boolean; date: string; child_id: string | null }>) => {
          if (payload.new && 'date' in payload.new && payload.new.date === todayKey) {
            const newData = payload.new as { lesson_key: string; completed: boolean; child_id: string | null };
            if (isParent || !newData.child_id || newData.child_id === profileId) {
              const { lesson_key, completed } = newData;
              setLessons(prev => prev.map(l =>
                l.id === lesson_key ? { ...l, completed } : l
              ));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'credit_vault', filter: `family_id=eq.${familyId}` },
        (payload: RealtimePostgresChangesPayload<{ total_balance: number; child_id: string | null }>) => {
          if (payload.new && 'total_balance' in payload.new) {
            const newData = payload.new as { total_balance: number; child_id: string | null };
            if (isParent || !newData.child_id || newData.child_id === profileId) {
              setTotalBalance(newData.total_balance);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_rewards', filter: `family_id=eq.${familyId}` },
        () => {
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
        (payload: RealtimePostgresChangesPayload<{ data: Timetable; assigned_to: string | null }>) => {
          if (payload.new && 'data' in payload.new) {
            const newData = payload.new as { data: Timetable; assigned_to: string | null };
            if (isParent || !newData.assigned_to || newData.assigned_to === profileId) {
              setTimetable(newData.data);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, profileId, isParent, todayKey, fetchFamilyData]);

  // Complete task - now includes child_id
  const completeTask = useCallback(async (taskId: string) => {
    if (!familyId || !profileId) return;

    // Optimistic update
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: true, completedAt: new Date() } : task
    ));

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Upsert progress with child_id
    await supabase
      .from('daily_progress')
      .upsert({
        family_id: familyId,
        date: todayKey,
        task_id: taskId,
        child_id: isParent ? null : profileId,
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'family_id,date,task_id' });

    // Update vault balance - always use the family vault for simplicity
    const newBalance = totalBalance + task.credits;
    
    await supabase
      .from('credit_vault')
      .update({ total_balance: newBalance, last_updated_date: todayKey })
      .eq('family_id', familyId)
      .is('child_id', null);
      
    // Update local state
    setTotalBalance(newBalance);
  }, [familyId, profileId, isParent, todayKey, tasks, totalBalance]);

  // Uncomplete task
  const uncompleteTask = useCallback(async (taskId: string) => {
    if (!familyId || !profileId) return;

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
        child_id: isParent ? null : profileId,
        completed: false,
        completed_at: null,
      }, { onConflict: 'family_id,date,task_id' });

    // Update vault balance
    const newBalance = Math.max(0, totalBalance - task.credits);
    
    if (isParent) {
      await supabase
        .from('credit_vault')
        .update({ total_balance: newBalance, last_updated_date: todayKey })
        .eq('family_id', familyId)
        .is('child_id', null);
    } else {
      await supabase
        .from('credit_vault')
        .update({ total_balance: newBalance, last_updated_date: todayKey })
        .eq('family_id', familyId)
        .eq('child_id', profileId);
    }
  }, [familyId, profileId, isParent, todayKey, tasks, totalBalance]);

  // Toggle lesson
  const toggleLesson = useCallback(async (lessonId: string) => {
    if (!familyId || !profileId) return;

    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const newCompleted = !lesson.completed;

    // Optimistic update
    setLessons(prev => prev.map(l =>
      l.id === lessonId ? { ...l, completed: newCompleted } : l
    ));

    // Upsert lesson progress with child_id
    await supabase
      .from('lesson_progress')
      .upsert({
        family_id: familyId,
        date: todayKey,
        lesson_key: lessonId,
        child_id: isParent ? null : profileId,
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
        credits: lesson.credits,
      }, { onConflict: 'family_id,date,lesson_key' });

    // Update vault balance - use family vault
    const creditChange = newCompleted ? lesson.credits : -lesson.credits;
    const newBalance = Math.max(0, totalBalance + creditChange);
    
    await supabase
      .from('credit_vault')
      .update({ total_balance: newBalance, last_updated_date: todayKey })
      .eq('family_id', familyId)
      .is('child_id', null);
      
    setTotalBalance(newBalance);
  }, [familyId, profileId, isParent, todayKey, lessons, totalBalance]);

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
        strategy_id: updates.strategyId || null,
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
        strategy_id: task.strategyId || null,
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
        strategyId: data.strategy_id || undefined,
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

    // Update timetable where assigned_to is null (family-level timetable)
    const { error } = await supabase
      .from('timetables')
      .update({ data: JSON.parse(JSON.stringify(newTimetable)), updated_at: new Date().toISOString() })
      .eq('family_id', familyId)
      .is('assigned_to', null);
    
    if (error) {
      console.error('Failed to update timetable:', error);
    } else {
      console.log('Timetable updated successfully');
    }
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
    if (!familyId || !profileId) return;

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

    if (isParent) {
      await supabase
        .from('credit_vault')
        .update({ total_balance: newBalance })
        .eq('family_id', familyId)
        .is('child_id', null);
    } else {
      await supabase
        .from('credit_vault')
        .update({ total_balance: newBalance })
        .eq('family_id', familyId)
        .eq('child_id', profileId);
    }
  }, [familyId, profileId, isParent, storeRewards, totalBalance]);

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
  const todayWeekDay = getTodayWeekDay(fridayEnabled);
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
  const isCurrentlyWeekend = isWeekend(fridayEnabled);
  const visibleTasks = isCurrentlyWeekend
    ? tasks.filter(t => !t.hideOnWeekend)
    : tasks;

  const taskCredits = visibleTasks.filter(t => t.completed).reduce((sum, t) => sum + t.credits, 0);
  const lessonCredits = isCurrentlyWeekend ? 0 : todayLessons.filter(l => l.completed).reduce((sum, l) => sum + l.credits, 0);
  const earnedCredits = taskCredits + lessonCredits;
  const totalPossibleCredits = visibleTasks.reduce((sum, t) => sum + t.credits, 0) + (isCurrentlyWeekend ? 0 : todayLessons.reduce((sum, l) => sum + l.credits, 0));
  const progressPercent = dailyGoal > 0 ? Math.min((earnedCredits / dailyGoal) * 100, 100) : 0;
  const unlockedRewards = rewards.filter(r => earnedCredits >= r.requiredCredits);

  // Toggle Friday enabled
  const toggleFridayEnabled = useCallback(async (enabled: boolean) => {
    if (!familyId) return;
    
    setFridayEnabled(enabled);
    
    await supabase
      .from('app_settings')
      .update({ friday_enabled: enabled })
      .eq('family_id', familyId);
  }, [familyId]);

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
    fridayEnabled,
    totalBalance,
    storeRewards,
    buffsActivatedToday,
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
    toggleFridayEnabled,
    redeemStoreReward,
    updateStoreRewards,
    activateBuff,
  };
}
