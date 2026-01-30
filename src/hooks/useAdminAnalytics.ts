import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RecentSignup {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  has_profile: boolean;
  profile_role: string | null;
  display_name: string | null;
  has_family: boolean;
}

interface WeeklyTrend {
  week_start: string;
  completions: number;
  active_children: number;
}

interface RecentReward {
  title: string;
  claimed_at: string | null;
}

interface StarFamily {
  family_id: string;
  family_name: string;
  family_code: string;
  child_count: number;
  completion_count: number;
  completion_rate: number;
  recent_rewards: RecentReward[];
}

interface SchoolQuestStats {
  families_with_timetable: number;
  total_lesson_completions: number;
  lesson_completions_7d: number;
  children_with_quest_enabled: number;
}

interface AppPulseData {
  total_families: number;
  families_without_children: number;
  total_profiles: number;
  total_parents: number;
  total_children: number;
  active_children_7d: number;
  total_tasks: number;
  total_completions: number;
  completions_today: number;
  completions_7d: number;
  potential_today: number;
  potential_7d: number;
  logins_24h: number;
  shared_device_children: number;
  separate_device_children: number;
  recent_signups: RecentSignup[];
  weekly_trends: WeeklyTrend[];
  star_families: StarFamily[];
  school_quest_stats: SchoolQuestStats;
}

export function useAdminAnalytics(isAdmin: boolean) {
  const [data, setData] = useState<AppPulseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: rpcError } = await supabase.rpc('get_admin_app_pulse');

      if (rpcError) {
        console.error('Error fetching admin analytics:', rpcError);
        setError('Failed to load analytics');
        return;
      }

      // Type guard for the result
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        const jsonResult = result as Record<string, unknown>;
        if (jsonResult.error) {
          setError(String(jsonResult.error));
          return;
        }
        setData(jsonResult as unknown as AppPulseData);
      }
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, fetchAnalytics]);

  // Calculate derived metrics
  const completionRateToday = data 
    ? data.potential_today > 0 
      ? Math.round((data.completions_today / data.potential_today) * 100)
      : 0
    : 0;

  const completionRate7d = data 
    ? data.potential_7d > 0 
      ? Math.round((data.completions_7d / data.potential_7d) * 100)
      : 0
    : 0;

  const activeChildrenRate = data
    ? data.total_children > 0
      ? Math.round((data.active_children_7d / data.total_children) * 100)
      : 0
    : 0;

  const conversionRate = data
    ? data.total_profiles > 0
      ? Math.round((data.total_children / data.total_profiles) * 100)
      : 0
    : 0;

  const familiesWithoutChildrenRate = data
    ? data.total_families > 0
      ? Math.round((data.families_without_children / data.total_families) * 100)
      : 0
    : 0;

  // Points utilization rate
  const pointsUtilization = data
    ? data.potential_7d > 0
      ? Math.round((data.completions_7d / data.potential_7d) * 100)
      : 0
    : 0;

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
    completionRateToday,
    completionRate7d,
    activeChildrenRate,
    conversionRate,
    familiesWithoutChildrenRate,
    pointsUtilization,
  };
}
