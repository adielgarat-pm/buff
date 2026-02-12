import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StuckOnboardingItem {
  family_id: string;
  family_code: string;
  created_at: string;
  parent_email: string | null;
  onboarding_step: number;
  is_activated: boolean;
}

interface FunnelData {
  total_signups: number;
  activated_families: number;
  engaged_families: number;
  active_families_7d: number;
}

interface RedFlagsData {
  stuck_onboarding: StuckOnboardingItem[];
  churn_risk: number;
  low_engagement: number;
}

interface DailyTrend {
  date: string;
  new_signups: number;
  active_families: number;
}

interface CategoryCompletion {
  category: string;
  completions: number;
  potential: number;
}

interface RecentSignup {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  has_profile: boolean;
  profile_role: string | null;
  display_name: string | null;
  has_family: boolean;
  onboarding_step: number;
  is_activated: boolean;
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

interface ChildStats {
  child_id: string;
  display_name: string;
  completion_count: number;
  potential_count: number;
  completion_rate: number;
}

interface StarFamily {
  family_id: string;
  family_name: string;
  family_code: string;
  parent_email: string | null;
  parent_marketing_consent: boolean | null;
  children: ChildStats[];
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

interface PWAStats {
  total_impressions: number;
  total_installs: number;
  installs_7d: number;
  impressions_7d: number;
  dismiss_temporary: number;
  dismiss_permanent: number;
  by_os: Array<{ os: string; count: number }> | null;
  by_browser: Array<{ browser: string; count: number }> | null;
}

export interface AppPulseDataV2 {
  funnel: FunnelData;
  red_flags: RedFlagsData;
  daily_trends: DailyTrend[];
  category_completions: CategoryCompletion[];
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
  marketing_consent_count: number;
  marketing_emails: string[];
  recent_signups: RecentSignup[];
  weekly_trends: WeeklyTrend[];
  star_families: StarFamily[];
  school_quest_stats: SchoolQuestStats;
  pwa_stats: PWAStats;
}

export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

export function useAdminAnalyticsV2(isAdmin: boolean) {
  const [data, setData] = useState<AppPulseDataV2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangePreset>('30d');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [excludeTestAccounts, setExcludeTestAccounts] = useState(false);

  const getDateRange = useCallback(() => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: customStartDate.toISOString().split('T')[0],
            end: customEndDate.toISOString().split('T')[0],
          };
        }
        startDate.setDate(endDate.getDate() - 30);
        break;
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  }, [dateRange, customStartDate, customEndDate]);

  const fetchAnalytics = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange();
      
      const { data: result, error: rpcError } = await supabase.rpc('get_admin_app_pulse_v2', {
        p_start_date: start,
        p_end_date: end,
        p_exclude_test_accounts: excludeTestAccounts,
      });

      if (rpcError) {
        console.error('Error fetching admin analytics v2:', rpcError);
        setError('Failed to load analytics');
        return;
      }

      if (result && typeof result === 'object' && !Array.isArray(result)) {
        const jsonResult = result as Record<string, unknown>;
        if (jsonResult.error) {
          setError(String(jsonResult.error));
          return;
        }
        setData(jsonResult as unknown as AppPulseDataV2);
      }
    } catch (err) {
      console.error('Error fetching admin analytics v2:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, getDateRange, excludeTestAccounts]);

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

  // Funnel conversion rates
  const funnelRates = data?.funnel ? {
    signupToActivated: data.funnel.total_signups > 0 
      ? Math.round((data.funnel.activated_families / data.funnel.total_signups) * 100)
      : 0,
    activatedToEngaged: data.funnel.activated_families > 0
      ? Math.round((data.funnel.engaged_families / data.funnel.activated_families) * 100)
      : 0,
    engagedToActive: data.funnel.engaged_families > 0
      ? Math.round((data.funnel.active_families_7d / data.funnel.engaged_families) * 100)
      : 0,
  } : { signupToActivated: 0, activatedToEngaged: 0, engagedToActive: 0 };

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
    dateRange,
    setDateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    excludeTestAccounts,
    setExcludeTestAccounts,
    completionRateToday,
    completionRate7d,
    activeChildrenRate,
    funnelRates,
  };
}
