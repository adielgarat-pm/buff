import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, differenceInDays } from 'date-fns';

const DISMISS_DURATION_DAYS = 7;
const BUYMEACOFFEE_URL = 'https://buymeacoffee.com/buffboost';

interface BuffBoostState {
  isLoading: boolean;
  shouldShow: boolean;
  streakDays: number;
  eveningMissionCount: number;
  hasSupported: boolean;
  childName: string;
}

/**
 * BuffBoost Endorsement Hook
 * Tracks user engagement and shows community support prompt at the right moment
 */
export function useBuffBoost() {
  const { profile, familyId } = useAuth();
  const [state, setState] = useState<BuffBoostState>({
    isLoading: true,
    shouldShow: false,
    streakDays: 0,
    eveningMissionCount: 0,
    hasSupported: false,
    childName: '',
  });

  // Fetch engagement metrics and check if we should show the prompt
  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id || !familyId) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Get profile data including dismiss status
        const { data: profileData } = await supabase
          .from('profiles')
          .select('buff_boost_supported, buff_boost_dismissed_at')
          .eq('id', profile.id)
          .single();

        const hasSupported = profileData?.buff_boost_supported || false;
        const dismissedAt = profileData?.buff_boost_dismissed_at;

        // Check if dismissed recently (within 7 days)
        let isDismissedRecently = false;
        if (dismissedAt) {
          const daysSinceDismiss = differenceInDays(new Date(), new Date(dismissedAt));
          isDismissedRecently = daysSinceDismiss < DISMISS_DURATION_DAYS;
        }

        // If already supported or dismissed recently, don't show
        if (hasSupported || isDismissedRecently) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            shouldShow: false,
            hasSupported,
          }));
          return;
        }

        // Get child name for the first child in family
        const { data: children } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('family_id', familyId)
          .eq('role', 'child')
          .limit(1);

        const childName = children?.[0]?.display_name || 'הילד/ה';

        // Calculate streak (consecutive days with completed tasks)
        const today = new Date();
        const dates: string[] = [];
        for (let i = 0; i < 14; i++) {
          dates.push(format(subDays(today, i), 'yyyy-MM-dd'));
        }

        const { data: progressData } = await supabase
          .from('daily_progress')
          .select('date, completed')
          .eq('family_id', familyId)
          .eq('completed', true)
          .in('date', dates);

        // Count streak days
        const completedDates = new Set(progressData?.map(p => p.date) || []);
        let streakDays = 0;
        for (let i = 0; i < 14; i++) {
          const dateStr = format(subDays(today, i), 'yyyy-MM-dd');
          if (completedDates.has(dateStr)) {
            streakDays++;
          } else if (i > 0) {
            // Allow today to be incomplete
            break;
          }
        }

        // Count evening missions (bag prep / night prep tasks)
        const { data: eveningTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('family_id', familyId)
          .or('time.gte.19:00,category.eq.organization');

        const eveningTaskIds = eveningTasks?.map(t => t.id) || [];

        let eveningMissionCount = 0;
        if (eveningTaskIds.length > 0) {
          const { count } = await supabase
            .from('daily_progress')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', familyId)
            .eq('completed', true)
            .in('task_id', eveningTaskIds);

          eveningMissionCount = count || 0;
        }

        // Determine if we should show the prompt
        const shouldShow = streakDays >= 5 || eveningMissionCount >= 3;

        console.log('[BuffBoost] Stats:', { streakDays, eveningMissionCount, shouldShow, hasSupported, isDismissedRecently });

        setState({
          isLoading: false,
          shouldShow,
          streakDays,
          eveningMissionCount,
          hasSupported,
          childName,
        });
      } catch (error) {
        console.error('Error fetching BuffBoost data:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchData();
  }, [profile?.id, familyId]);

  // Handle support button click
  const handleSupport = useCallback(async () => {
    // Open BuyMeACoffee in new tab
    window.open(BUYMEACOFFEE_URL, '_blank');

    // Mark as supported in database
    if (profile?.id) {
      await supabase
        .from('profiles')
        .update({ buff_boost_supported: true })
        .eq('id', profile.id);

      setState(prev => ({
        ...prev,
        shouldShow: false,
        hasSupported: true,
      }));
    }

    return true; // Indicates support was clicked
  }, [profile?.id]);

  // Handle dismiss (snooze for 7 days)
  const handleDismiss = useCallback(async () => {
    if (profile?.id) {
      await supabase
        .from('profiles')
        .update({ buff_boost_dismissed_at: new Date().toISOString() })
        .eq('id', profile.id);

      setState(prev => ({
        ...prev,
        shouldShow: false,
      }));
    }
  }, [profile?.id]);

  return {
    ...state,
    handleSupport,
    handleDismiss,
    buyMeACoffeeUrl: BUYMEACOFFEE_URL,
  };
}
