import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Timetable, StoreReward } from '@/types/task';

export interface ChildProgress {
  childId: string;
  displayName: string;
  todayEarned: number;
  dailyGoal: number;
  tasksCompleted: number;
  tasksTotal: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  totalBalance: number;
  schoolQuestEnabled: boolean;
}

interface ChildData {
  tasks: Task[];
  timetable: Timetable;
  storeRewards: StoreReward[];
  dailyGoal: number;
  totalBalance: number;
  schoolQuestEnabled: boolean;
}

const getTodayKey = () => new Date().toISOString().split('T')[0];

export function useChildProgress() {
  const { familyId } = useAuth();
  const [childrenProgress, setChildrenProgress] = useState<ChildProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChildrenProgress = useCallback(async () => {
    if (!familyId) {
      setLoading(false);
      return;
    }

    const todayKey = getTodayKey();

    try {
      // Fetch all children in the family
      const { data: children } = await supabase
        .from('profiles')
        .select('*')
        .eq('family_id', familyId)
        .eq('role', 'child');

      if (!children || children.length === 0) {
        setChildrenProgress([]);
        setLoading(false);
        return;
      }

      // Daily goal is now per-child, stored in profiles table

      // Build progress for each child
      const progressPromises = children.map(async (child) => {
        // Fetch tasks assigned ONLY to this child (not shared ones)
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('family_id', familyId)
          .eq('assigned_to', child.id);

        // Fetch today's progress for this specific child only
        const { data: progressData } = await supabase
          .from('daily_progress')
          .select('*')
          .eq('family_id', familyId)
          .eq('date', todayKey)
          .eq('child_id', child.id);

        // Fetch lesson progress for this specific child only
        const { data: lessonProgressData } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('family_id', familyId)
          .eq('date', todayKey)
          .eq('child_id', child.id);

        // Fetch credit vault - try child-specific first, then family vault
        let vaultBalance = 0;
        const { data: childVaultData } = await supabase
          .from('credit_vault')
          .select('*')
          .eq('family_id', familyId)
          .eq('child_id', child.id)
          .maybeSingle();

        if (childVaultData) {
          vaultBalance = childVaultData.total_balance || 0;
        } else {
          // Fall back to family vault
          const { data: familyVaultData } = await supabase
            .from('credit_vault')
            .select('*')
            .eq('family_id', familyId)
            .is('child_id', null)
            .maybeSingle();
          vaultBalance = familyVaultData?.total_balance || 0;
        }

        const completedTaskIds = new Set(
          progressData?.filter(p => p.completed).map(p => p.task_id) || []
        );

        const tasksTotal = tasksData?.length || 0;
        const tasksCompleted = tasksData?.filter(t => completedTaskIds.has(t.id)).length || 0;
        const taskCredits = tasksData
          ?.filter(t => completedTaskIds.has(t.id))
          .reduce((sum, t) => sum + t.credits, 0) || 0;

        // Fixed 8 lessons per school day (only if school quest enabled)
        const schoolQuestEnabled = child.school_quest_enabled ?? true;
        const lessonsTotal = schoolQuestEnabled ? 8 : 0;
        const lessonsCompleted = schoolQuestEnabled ? (lessonProgressData?.filter(l => l.completed).length || 0) : 0;
        const lessonCredits = schoolQuestEnabled 
          ? (lessonProgressData
              ?.filter(l => l.completed)
              .reduce((sum, l) => sum + (l.credits || 10), 0) || 0)
          : 0;

        return {
          childId: child.id,
          displayName: child.display_name,
          todayEarned: taskCredits + lessonCredits,
          dailyGoal: child.daily_goal || 100,
          tasksCompleted,
          tasksTotal,
          lessonsCompleted,
          lessonsTotal,
          totalBalance: vaultBalance,
          schoolQuestEnabled,
        };
      });

      const progress = await Promise.all(progressPromises);
      setChildrenProgress(progress);
    } catch (error) {
      console.error('Error fetching children progress:', error);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchChildrenProgress();
  }, [fetchChildrenProgress]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!familyId) return;

    const channel = supabase
      .channel('children-progress')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_progress' }, () => {
        fetchChildrenProgress();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_progress' }, () => {
        fetchChildrenProgress();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_vault' }, () => {
        fetchChildrenProgress();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, fetchChildrenProgress]);

  return { childrenProgress, loading, refetch: fetchChildrenProgress };
}

export function useChildData(childId: string | null) {
  const { familyId } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timetable, setTimetable] = useState<Timetable>({});
  const [storeRewards, setStoreRewards] = useState<StoreReward[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(100);
  const [schoolQuestEnabled, setSchoolQuestEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const todayKey = getTodayKey();

  const fetchChildData = useCallback(async () => {
    if (!familyId || !childId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch tasks ONLY assigned to this child (strict isolation - no shared tasks)
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .eq('assigned_to', childId)
        .order('time');

      // Fetch today's progress ONLY for this specific child
      const { data: progressData } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('family_id', familyId)
        .eq('date', todayKey)
        .eq('child_id', childId);

      // Fetch timetable ONLY for this child
      const { data: timetableData } = await supabase
        .from('timetables')
        .select('*')
        .eq('family_id', familyId)
        .eq('assigned_to', childId)
        .maybeSingle();

      // Fetch store rewards ONLY for this child
      const { data: rewardsData } = await supabase
        .from('store_rewards')
        .select('*')
        .eq('family_id', familyId)
        .eq('assigned_to', childId);

      // Fetch credit vault for this specific child
      const { data: vaultData } = await supabase
        .from('credit_vault')
        .select('*')
        .eq('family_id', familyId)
        .eq('child_id', childId)
        .maybeSingle();

      // Fetch child's daily goal and school quest setting from profile
      const { data: childProfile } = await supabase
        .from('profiles')
        .select('daily_goal, school_quest_enabled')
        .eq('id', childId)
        .single();

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

      if (timetableData?.data) {
        setTimetable(timetableData.data as unknown as Timetable);
      }

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

      if (vaultData) {
        setTotalBalance(vaultData.total_balance);
      }

      // Set child's daily goal and school quest setting
      setDailyGoal(childProfile?.daily_goal || 100);
      setSchoolQuestEnabled(childProfile?.school_quest_enabled ?? true);
    } catch (error) {
      console.error('Error fetching child data:', error);
    } finally {
      setLoading(false);
    }
  }, [familyId, childId, todayKey]);

  useEffect(() => {
    setLoading(true);
    fetchChildData();
  }, [fetchChildData]);

  // Task management functions
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'completed' | 'completedAt'>) => {
    if (!familyId || !childId) return;

    const { data } = await supabase
      .from('tasks')
      .insert({
        family_id: familyId,
        assigned_to: childId,
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
        assignedTo: data.assigned_to || undefined,
        strategyId: data.strategy_id || undefined,
      }].sort((a, b) => a.time.localeCompare(b.time)));
    }
  }, [familyId, childId]);

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

  const deleteTask = useCallback(async (taskId: string) => {
    if (!familyId) return;

    setTasks(prev => prev.filter(t => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  }, [familyId]);

  // Timetable management
  const updateTimetable = useCallback(async (newTimetable: Timetable) => {
    if (!familyId || !childId) return;

    setTimetable(newTimetable);

    // Check if a timetable exists for this child
    const { data: existing } = await supabase
      .from('timetables')
      .select('id')
      .eq('family_id', familyId)
      .eq('assigned_to', childId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('timetables')
        .update({ data: JSON.parse(JSON.stringify(newTimetable)) })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('timetables')
        .insert({
          family_id: familyId,
          assigned_to: childId,
          data: JSON.parse(JSON.stringify(newTimetable)),
        });
    }
  }, [familyId, childId]);

  // Store rewards management
  const updateStoreRewards = useCallback(async (rewards: StoreReward[]) => {
    if (!familyId || !childId) return;

    setStoreRewards(rewards);

    // Delete rewards for this child and re-insert
    await supabase
      .from('store_rewards')
      .delete()
      .eq('family_id', familyId)
      .eq('assigned_to', childId);

    await supabase.from('store_rewards').insert(
      rewards.map(r => ({
        id: r.id,
        family_id: familyId,
        assigned_to: childId,
        title: r.title,
        price: r.price,
        emoji: r.icon,
        claimed: r.claimed,
        claimed_at: r.claimedAt || null,
      }))
    );
  }, [familyId, childId]);

  // Initialize child data if needed
  const initializeChildData = useCallback(async () => {
    if (!familyId || !childId) return;

    // Create credit vault for child if doesn't exist
    const { data: vaultExists } = await supabase
      .from('credit_vault')
      .select('id')
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .maybeSingle();

    if (!vaultExists) {
      await supabase
        .from('credit_vault')
        .insert({ family_id: familyId, child_id: childId, total_balance: 0 });
    }

    await fetchChildData();
  }, [familyId, childId, fetchChildData]);

  // Update child's daily goal
  const updateDailyGoal = useCallback(async (goal: number) => {
    if (!childId) return;

    setDailyGoal(goal);

    await supabase
      .from('profiles')
      .update({ daily_goal: goal })
      .eq('id', childId);
  }, [childId]);

  // Toggle school quest module for child
  const toggleSchoolQuestEnabled = useCallback(async (enabled: boolean) => {
    if (!childId) return;

    setSchoolQuestEnabled(enabled);

    await supabase
      .from('profiles')
      .update({ school_quest_enabled: enabled })
      .eq('id', childId);
  }, [childId]);

  return {
    tasks,
    timetable,
    storeRewards,
    totalBalance,
    dailyGoal,
    schoolQuestEnabled,
    loading,
    addTask,
    updateTask,
    deleteTask,
    updateTimetable,
    updateStoreRewards,
    updateDailyGoal,
    toggleSchoolQuestEnabled,
    initializeChildData,
    refetch: fetchChildData,
  };
}
