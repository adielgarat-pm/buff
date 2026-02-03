import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task, DailyProgress, Reward, Lesson, Timetable, WEEK_DAYS, PeriodInfo, WeekDay, StoreReward, VaultData } from '@/types/task';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { getEffectiveCredits } from '@/utils/protocolTaskUtils';

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

export function useSyncedTaskStore(viewingAsChildId?: string) {
  const { familyId, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>(DEFAULT_LESSONS.map(l => ({ ...l, completed: false })));
  const [timetable, setTimetable] = useState<Timetable>({});
  const [rewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [dailyGoal, setDailyGoal] = useState(100);
  const [appTitle, setAppTitle] = useState('BUFF');
  const [lessonRemindersEnabled, setLessonRemindersEnabled] = useState(true);
  const [fridayEnabled, setFridayEnabled] = useState(false);
  const [schoolQuestEnabled, setSchoolQuestEnabled] = useState(true);
  const [bagPrepEnabled, setBagPrepEnabled] = useState(true);
  const [bagPrepCredits, setBagPrepCredits] = useState(20);
  const [bagPrepCompleted, setBagPrepCompleted] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [storeRewards, setStoreRewards] = useState<StoreReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [childBirthDate, setChildBirthDate] = useState<string | null>(null);
  const [childDisplayName, setChildDisplayName] = useState<string | null>(null);
  const [childAvatar, setChildAvatar] = useState<string>('🚀');
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
  // When viewing as child, use the child's ID for data filtering
  const effectiveChildId = viewingAsChildId || (isParent ? null : profile?.id);
  const profileId = profile?.id;

  // Fetch all family data - filtered by role or viewing child
  const fetchFamilyData = useCallback(async () => {
    if (!familyId || !profileId) return;

    // Determine if we're viewing as a specific child
    const isViewingAsChild = !!effectiveChildId;

    try {
      // Fetch tasks - filter by assigned child when viewing as child
      let tasksQuery = supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .order('time');

      // When viewing as a specific child, show ONLY their assigned tasks (not shared ones)
      if (isViewingAsChild && effectiveChildId) {
        tasksQuery = tasksQuery.eq('assigned_to', effectiveChildId);
      }

      const { data: tasksData } = await tasksQuery;

      // Fetch today's progress - filter by child when viewing as child
      let progressQuery = supabase
        .from('daily_progress')
        .select('*')
        .eq('family_id', familyId)
        .eq('date', todayKey);

      if (isViewingAsChild && effectiveChildId) {
        progressQuery = progressQuery.eq('child_id', effectiveChildId);
      }

      const { data: progressData } = await progressQuery;

      // Fetch today's lesson progress - filter by child when viewing as child
      let lessonProgressQuery = supabase
        .from('lesson_progress')
        .select('*')
        .eq('family_id', familyId)
        .eq('date', todayKey);

      if (isViewingAsChild && effectiveChildId) {
        lessonProgressQuery = lessonProgressQuery.eq('child_id', effectiveChildId);
      }

      const { data: lessonProgressData } = await lessonProgressQuery;

      // Fetch credit vault - use child-specific vault when viewing as child
      let vaultQuery = supabase
        .from('credit_vault')
        .select('*')
        .eq('family_id', familyId);
      
      if (isViewingAsChild && effectiveChildId) {
        vaultQuery = vaultQuery.eq('child_id', effectiveChildId);
      } else {
        vaultQuery = vaultQuery.is('child_id', null);
      }
      
      const { data: vaultData } = await vaultQuery.maybeSingle();

      // Fetch store rewards - filter by child when viewing as child
      let rewardsQuery = supabase
        .from('store_rewards')
        .select('*')
        .eq('family_id', familyId);
      
      if (isViewingAsChild && effectiveChildId) {
        rewardsQuery = rewardsQuery.eq('assigned_to', effectiveChildId);
      }

      const { data: rewardsData } = await rewardsQuery;

      // Fetch timetable - filter by child when viewing as child
      let timetableQuery = supabase
        .from('timetables')
        .select('*')
        .eq('family_id', familyId);

      if (isViewingAsChild && effectiveChildId) {
        timetableQuery = timetableQuery.eq('assigned_to', effectiveChildId);
      }

      const { data: timetableData } = await timetableQuery.maybeSingle();

      // Fetch app settings
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('family_id', familyId)
        .maybeSingle();

      // Fetch child's settings from profile (if viewing as child)
      if (isViewingAsChild && effectiveChildId) {
        const { data: childProfileData } = await supabase
          .from('profiles')
          .select('school_quest_enabled, bag_prep_enabled, bag_prep_credits, birth_date, display_name, avatar')
          .eq('id', effectiveChildId)
          .single();
        
        setSchoolQuestEnabled(childProfileData?.school_quest_enabled ?? true);
        setBagPrepEnabled(childProfileData?.bag_prep_enabled ?? true);
        setBagPrepCredits(childProfileData?.bag_prep_credits ?? 20);
        setChildBirthDate(childProfileData?.birth_date ?? null);
        setChildDisplayName(childProfileData?.display_name ?? null);
        setChildAvatar(childProfileData?.avatar ?? '🚀');
      }

      // Check if bag prep is completed today
      if (isViewingAsChild && effectiveChildId) {
        const bagPrepTaskId = `bag_prep_${effectiveChildId}`;
        const { data: bagPrepProgress } = await supabase
          .from('daily_progress')
          .select('completed')
          .eq('family_id', familyId)
          .eq('task_id', bagPrepTaskId)
          .eq('date', todayKey)
          .eq('child_id', effectiveChildId)
          .maybeSingle();
        
        setBagPrepCompleted(bagPrepProgress?.completed ?? false);
      }

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
        scheduleDays: t.schedule_days || [0, 1, 2, 3, 4],
      }));

      setTasks(mappedTasks);

      // Map lessons with completion status from database
      // Use the actual lesson_keys from DB to track completion
      const lessonProgressMap = new Map<string, boolean>();
      lessonProgressData?.forEach(l => {
        if (l.completed) {
          lessonProgressMap.set(l.lesson_key, true);
        }
      });

      // Create lessons array from DB progress data AND default lessons
      // This ensures dynamic lesson IDs (lesson_0, lesson_1) are tracked
      const dynamicLessons: Lesson[] = [];
      lessonProgressData?.forEach(l => {
        dynamicLessons.push({
          id: l.lesson_key,
          label: l.lesson_key,
          credits: l.credits || 10,
          completed: l.completed,
        });
      });
      
      // Also include default lessons for any that aren't in DB yet
      DEFAULT_LESSONS.forEach(l => {
        if (!dynamicLessons.find(dl => dl.id === l.id)) {
          dynamicLessons.push({
            ...l,
            completed: lessonProgressMap.has(l.id),
          });
        }
      });

      setLessons(dynamicLessons);

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
      const vaultId = vaultData?.id;
      
      // If vault was last updated today, use calculated credits
      // Otherwise, add today's credits to the stored balance
      let finalBalance = storedBalance;
      
      if (lastUpdatedDate === todayKey) {
        // Same day - recalculate from scratch for accuracy
        // The stored balance should already include today's progress
        // Only update if there's a mismatch (safety sync)
        finalBalance = storedBalance;
        
        // Sync if calculated differs significantly from stored (edge case fix)
        if (Math.abs(storedBalance - calculatedTodayCredits) > 0 && familyId && !lastUpdatedDate) {
          // Only sync if we don't have a last_updated_date yet
          finalBalance = calculatedTodayCredits;
        }
      } else if (lastUpdatedDate && lastUpdatedDate < todayKey) {
        // New day detected! 
        // The storedBalance already contains the historical total
        // We need to add ONLY today's newly earned credits
        finalBalance = storedBalance + calculatedTodayCredits;
        
        // Update vault with new day's progress - use correct child filter
        if (familyId && vaultId) {
          supabase
            .from('credit_vault')
            .update({ total_balance: finalBalance, last_updated_date: todayKey })
            .eq('id', vaultId)
            .then(() => console.log('Vault updated for new day:', finalBalance));
        } else if (familyId && isViewingAsChild && effectiveChildId) {
          // Create vault if it doesn't exist for this child
          supabase
            .from('credit_vault')
            .insert({ family_id: familyId, child_id: effectiveChildId, total_balance: finalBalance, last_updated_date: todayKey })
            .then(() => console.log('Created child vault for new day:', finalBalance));
        }
      } else if (!lastUpdatedDate && storedBalance === 0) {
        // First time - use calculated (fresh start)
        finalBalance = calculatedTodayCredits;
        
        // Initialize vault with today's date
        if (familyId && vaultId) {
          supabase
            .from('credit_vault')
            .update({ total_balance: finalBalance, last_updated_date: todayKey })
            .eq('id', vaultId)
            .then(() => console.log('Vault initialized:', finalBalance));
        }
      } else {
        // Has balance but no date - preserve the balance (migration case)
        finalBalance = storedBalance;
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
  }, [familyId, profileId, effectiveChildId, todayKey]);

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

    // Use effectiveChildId for filtering realtime updates when viewing as child
    const targetChildId = effectiveChildId;

    const channel = supabase
      .channel('family-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_progress', filter: `family_id=eq.${familyId}` },
        (payload: RealtimePostgresChangesPayload<{ task_id: string; completed: boolean; date: string; child_id: string | null }>) => {
          if (payload.new && 'date' in payload.new && payload.new.date === todayKey) {
            const newData = payload.new as { task_id: string; completed: boolean; child_id: string | null };
            // Only update if this matches the effective child (or if parent with no specific child)
            if (targetChildId) {
              // Viewing as specific child - only accept updates for that child
              if (newData.child_id === targetChildId) {
                const { task_id, completed } = newData;
                setTasks(prev => prev.map(t =>
                  t.id === task_id ? { ...t, completed } : t
                ));
              }
            } else if (isParent) {
              // Parent not viewing as child - accept all updates
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
            if (targetChildId) {
              if (newData.child_id === targetChildId) {
                const { lesson_key, completed } = newData;
                setLessons(prev => prev.map(l =>
                  l.id === lesson_key ? { ...l, completed } : l
                ));
              }
            } else if (isParent) {
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
            if (targetChildId) {
              if (newData.child_id === targetChildId) {
                setTotalBalance(newData.total_balance);
              }
            } else if (isParent && !newData.child_id) {
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
            if (targetChildId) {
              if (newData.assigned_to === targetChildId) {
                setTimetable(newData.data);
              }
            } else if (isParent) {
              setTimetable(newData.data);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, profileId, isParent, effectiveChildId, todayKey, fetchFamilyData]);

  // Complete task - now includes child_id (uses effectiveChildId for viewing as child)
  const completeTask = useCallback(async (taskId: string) => {
    if (!familyId || !profileId) return;

    // Use effectiveChildId to support "view as child" mode
    const targetChildId = effectiveChildId || null;

    // Optimistic update
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: true, completedAt: new Date() } : task
    ));

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Insert or update progress with specific child_id
    // Use delete + insert pattern for proper child_id handling
    await supabase
      .from('daily_progress')
      .delete()
      .eq('family_id', familyId)
      .eq('date', todayKey)
      .eq('task_id', taskId)
      .eq('child_id', targetChildId);

    await supabase
      .from('daily_progress')
      .insert({
        family_id: familyId,
        date: todayKey,
        task_id: taskId,
        child_id: targetChildId,
        completed: true,
        completed_at: new Date().toISOString(),
      });

    // Calculate effective credits (1.5x for protocol tasks)
    const effectiveCredits = getEffectiveCredits(task);

    // Update vault balance using secure RPC function
    const newBalance = totalBalance + effectiveCredits;
    
    if (targetChildId) {
      // Use secure RPC function for credit updates
      const { data: updatedBalance, error } = await supabase
        .rpc('update_child_credits', {
          p_child_id: targetChildId,
          p_credit_change: effectiveCredits,
          p_is_completion: true
        });
      
      if (error) {
        console.error('Error updating credits:', error);
        // Fallback for parents (they have direct access)
        if (isParent) {
          const { data: childVault } = await supabase
            .from('credit_vault')
            .select('id')
            .eq('family_id', familyId)
            .eq('child_id', targetChildId)
            .maybeSingle();

          if (childVault) {
            await supabase
              .from('credit_vault')
              .update({ total_balance: newBalance, last_updated_date: todayKey })
              .eq('id', childVault.id);
          } else {
            await supabase
              .from('credit_vault')
              .insert({ family_id: familyId, child_id: targetChildId, total_balance: newBalance, last_updated_date: todayKey });
          }
        }
      }
    } else {
      // Update family vault (parent only)
      await supabase
        .from('credit_vault')
        .update({ total_balance: newBalance, last_updated_date: todayKey })
        .eq('family_id', familyId)
        .is('child_id', null);
    }
      
    // Update local state
    setTotalBalance(newBalance);
  }, [familyId, profileId, effectiveChildId, todayKey, tasks, totalBalance]);

  // Uncomplete task
  const uncompleteTask = useCallback(async (taskId: string) => {
    if (!familyId || !profileId) return;

    // Use effectiveChildId to support "view as child" mode
    const targetChildId = effectiveChildId || null;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: false, completedAt: undefined } : t
    ));

    // Delete and re-insert with completed=false
    // Handle null child_id properly - use .is() for null, .eq() for non-null
    let deleteQuery = supabase
      .from('daily_progress')
      .delete()
      .eq('family_id', familyId)
      .eq('date', todayKey)
      .eq('task_id', taskId);
    
    if (targetChildId) {
      deleteQuery = deleteQuery.eq('child_id', targetChildId);
    } else {
      deleteQuery = deleteQuery.is('child_id', null);
    }
    
    await deleteQuery;

    await supabase
      .from('daily_progress')
      .insert({
        family_id: familyId,
        date: todayKey,
        task_id: taskId,
        child_id: targetChildId,
        completed: false,
        completed_at: null,
      });

    // Update vault balance using secure RPC function
    const newBalance = Math.max(0, totalBalance - task.credits);
    
    if (targetChildId) {
      // Use secure RPC function for credit updates (negative for uncomplete)
      const { error } = await supabase
        .rpc('update_child_credits', {
          p_child_id: targetChildId,
          p_credit_change: -task.credits,
          p_is_completion: false
        });
      
      if (error) {
        console.error('Error updating credits:', error);
        // Fallback for parents
        if (isParent) {
          await supabase
            .from('credit_vault')
            .update({ total_balance: newBalance, last_updated_date: todayKey })
            .eq('family_id', familyId)
            .eq('child_id', targetChildId);
        }
      }
    } else {
      await supabase
        .from('credit_vault')
        .update({ total_balance: newBalance, last_updated_date: todayKey })
        .eq('family_id', familyId)
        .is('child_id', null);
    }
    
    setTotalBalance(newBalance);
  }, [familyId, profileId, effectiveChildId, todayKey, tasks, totalBalance]);

  // Toggle lesson - works with dynamic lesson IDs from todayLessons
  const toggleLesson = useCallback(async (lessonId: string, lessonCredits: number = 10) => {
    if (!familyId || !profileId) return;

    // Use effectiveChildId to support "view as child" mode
    // For children, this should always be their own profile.id
    const targetChildId = effectiveChildId || profileId;

    // Check if lesson is already completed by looking at lesson_progress data
    // We track completion state per lessonId in the lessons state
    const existingLesson = lessons.find(l => l.id === lessonId);
    const wasCompleted = existingLesson?.completed || false;
    const newCompleted = !wasCompleted;

    // Optimistic update - update the lessons state to track this lessonId
    setLessons(prev => {
      const existing = prev.find(l => l.id === lessonId);
      if (existing) {
        return prev.map(l => l.id === lessonId ? { ...l, completed: newCompleted } : l);
      } else {
        // Add this dynamic lesson ID to the tracked lessons
        return [...prev, { id: lessonId, label: lessonId, credits: lessonCredits, completed: newCompleted }];
      }
    });

    // Delete existing record with proper null handling
    if (targetChildId) {
      await supabase
        .from('lesson_progress')
        .delete()
        .eq('family_id', familyId)
        .eq('date', todayKey)
        .eq('lesson_key', lessonId)
        .eq('child_id', targetChildId);
    } else {
      await supabase
        .from('lesson_progress')
        .delete()
        .eq('family_id', familyId)
        .eq('date', todayKey)
        .eq('lesson_key', lessonId)
        .is('child_id', null);
    }

    await supabase
      .from('lesson_progress')
      .insert({
        family_id: familyId,
        date: todayKey,
        lesson_key: lessonId,
        child_id: targetChildId,
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
        credits: lessonCredits,
      });

    // Update vault balance using secure RPC function
    const creditChange = newCompleted ? lessonCredits : -lessonCredits;
    const newBalance = Math.max(0, totalBalance + creditChange);
    
    if (targetChildId) {
      // Use secure RPC function for credit updates
      const { error } = await supabase
        .rpc('update_child_credits', {
          p_child_id: targetChildId,
          p_credit_change: creditChange,
          p_is_completion: newCompleted
        });
      
      if (error) {
        console.error('Error updating credits:', error);
        // Fallback for parents
        if (isParent) {
          await supabase
            .from('credit_vault')
            .update({ total_balance: newBalance, last_updated_date: todayKey })
            .eq('family_id', familyId)
            .eq('child_id', targetChildId);
        }
      }
    } else {
      await supabase
        .from('credit_vault')
        .update({ total_balance: newBalance, last_updated_date: todayKey })
        .eq('family_id', familyId)
        .is('child_id', null);
    }
      
    setTotalBalance(newBalance);
  }, [familyId, profileId, effectiveChildId, todayKey, lessons, totalBalance]);

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
        schedule_days: updates.scheduleDays || [0, 1, 2, 3, 4],
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
        schedule_days: task.scheduleDays || [0, 1, 2, 3, 4],
        assigned_to: task.assignedTo || null,
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
        scheduleDays: data.schedule_days || [0, 1, 2, 3, 4],
        assignedTo: data.assigned_to || undefined,
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

    // Optimistic update
    const newBalance = totalBalance - reward.price;
    setTotalBalance(newBalance);
    setStoreRewards(prev => prev.map(r =>
      r.id === rewardId ? { ...r, claimed: true, claimedAt: new Date().toISOString() } : r
    ));

    try {
      // Update store_rewards to mark as claimed
      const { error: rewardError } = await supabase
        .from('store_rewards')
        .update({ claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', rewardId);

      if (rewardError) {
        console.error('Error claiming reward:', rewardError);
        // Revert optimistic update
        setTotalBalance(totalBalance);
        setStoreRewards(prev => prev.map(r =>
          r.id === rewardId ? { ...r, claimed: false, claimedAt: undefined } : r
        ));
        return;
      }

      // Use the secure RPC function to deduct credits (works for both parents and children)
      // The RPC handles RLS bypass via SECURITY DEFINER
      const targetChildId = isParent ? (reward.assignedTo || profileId) : profileId;
      
      const { data: updatedBalance, error: creditError } = await supabase
        .rpc('update_child_credits', {
          p_child_id: targetChildId,
          p_credit_change: -reward.price,
          p_is_completion: false
        });

      if (creditError) {
        console.error('Error deducting credits:', creditError);
        // Revert optimistic update - but keep reward as claimed since that succeeded
        setTotalBalance(totalBalance);
        return;
      }

      // Sync with actual balance from server
      if (typeof updatedBalance === 'number') {
        setTotalBalance(updatedBalance);
      }

      console.log(`Reward redeemed: ${reward.title}, new balance: ${updatedBalance}`);
    } catch (err) {
      console.error('Unexpected error redeeming reward:', err);
      // Revert optimistic updates
      setTotalBalance(totalBalance);
      setStoreRewards(prev => prev.map(r =>
        r.id === rewardId ? { ...r, claimed: false, claimedAt: undefined } : r
      ));
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
  // Only include lessons where subject has actual content (not empty/whitespace)
  const todayLessons = useMemo(() => {
    return todaySchedule
      .filter(period => period.subject && period.subject.trim() !== '')
      .map((period, index) => {
        const lessonId = `lesson_${index}`;
        const existingLesson = lessons.find(l => l.id === lessonId);
        // Only include equipment if it has actual content
        const equipment = period.equipment?.trim() || '';
        return {
          id: lessonId,
          label: period.subject,
          displayLabel: period.subject,
          startTime: period.startTime,
          equipment: equipment || undefined, // undefined if empty so hasEquipment check works
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
  
  // Smart 70% Goal: Calculate the finish line as 70% of today's total possible credits
  const smartGoal = Math.round(totalPossibleCredits * 0.7);
  // Use the smart goal if it's set, otherwise fall back to the configured daily goal
  const effectiveGoal = totalPossibleCredits > 0 ? smartGoal : dailyGoal;
  
  const progressPercent = effectiveGoal > 0 ? Math.min((earnedCredits / effectiveGoal) * 100, 100) : 0;
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

  // Complete bag prep task
  const completeBagPrep = useCallback(async () => {
    if (!familyId || !effectiveChildId) return;
    
    const bagPrepTaskId = `bag_prep_${effectiveChildId}`;
    
    // Optimistic update
    setBagPrepCompleted(true);
    setTotalBalance(prev => prev + bagPrepCredits);
    
    try {
      // Record the completion
      await supabase
        .from('daily_progress')
        .upsert({
          family_id: familyId,
          task_id: bagPrepTaskId,
          date: todayKey,
          child_id: effectiveChildId,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'family_id,task_id,date,child_id' });
      
      // Update credits using the RPC
      await supabase.rpc('update_child_credits', {
        p_child_id: effectiveChildId,
        p_credit_change: bagPrepCredits,
        p_is_completion: true,
      });
    } catch (error) {
      console.error('Error completing bag prep:', error);
      // Revert on error
      setBagPrepCompleted(false);
      setTotalBalance(prev => prev - bagPrepCredits);
    }
  }, [familyId, effectiveChildId, todayKey, bagPrepCredits]);

  // Undo bag prep completion
  const undoBagPrep = useCallback(async () => {
    if (!familyId || !effectiveChildId) return;
    
    const bagPrepTaskId = `bag_prep_${effectiveChildId}`;
    
    // Optimistic update
    setBagPrepCompleted(false);
    setTotalBalance(prev => Math.max(0, prev - bagPrepCredits));
    
    try {
      // Remove the completion record
      await supabase
        .from('daily_progress')
        .delete()
        .eq('family_id', familyId)
        .eq('task_id', bagPrepTaskId)
        .eq('date', todayKey)
        .eq('child_id', effectiveChildId);
      
      // Deduct credits using the RPC
      await supabase.rpc('update_child_credits', {
        p_child_id: effectiveChildId,
        p_credit_change: -bagPrepCredits,
        p_is_completion: false,
      });
    } catch (error) {
      console.error('Error undoing bag prep:', error);
      // Revert on error
      setBagPrepCompleted(true);
      setTotalBalance(prev => prev + bagPrepCredits);
    }
  }, [familyId, effectiveChildId, todayKey, bagPrepCredits]);

  // Update child's avatar (child can update their own)
  const updateChildAvatar = useCallback(async (newAvatar: string) => {
    if (!effectiveChildId) return;

    // Optimistic update
    const previousAvatar = childAvatar;
    setChildAvatar(newAvatar);

    try {
      // Children can directly update their own profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar: newAvatar, updated_at: new Date().toISOString() })
        .eq('id', effectiveChildId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating avatar:', error);
      // Revert on error
      setChildAvatar(previousAvatar);
      throw error;
    }
  }, [effectiveChildId, childAvatar]);

  return {
    loading,
    tasks: visibleTasks,
    lessons,
    todayLessons,
    timetable,
    todaySchedule,
    rewards,
    dailyGoal,
    smartGoal,
    effectiveGoal,
    appTitle,
    earnedCredits,
    totalPossibleCredits,
    progressPercent,
    unlockedRewards,
    isCurrentlyWeekend,
    lessonRemindersEnabled,
    fridayEnabled,
    schoolQuestEnabled,
    bagPrepEnabled,
    bagPrepCredits,
    bagPrepCompleted,
    totalBalance,
    storeRewards,
    buffsActivatedToday,
    childBirthDate,
    childDisplayName,
    childAvatar,
    updateChildAvatar,
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
    completeBagPrep,
    undoBagPrep,
    refetch: fetchFamilyData,
  };
}
