import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const GRACE_PERIOD_END = new Date('2026-05-01T23:59:59');

const SIMULATE_PRO_KEY = 'buff_simulate_pro';

export interface ProSettings {
  theme?: string;
  avatarUrl?: string;
  virtualPet?: {
    name?: string;
    type?: string;
    level?: number;
  };
}

export function useSubscription() {
  const { profile } = useAuth();

  const [simulatePro, setSimulateProState] = useState(() => {
    try { return localStorage.getItem(SIMULATE_PRO_KEY) === 'true'; } catch { return false; }
  });

  const setSimulatePro = useCallback((value: boolean) => {
    setSimulateProState(value);
    try { localStorage.setItem(SIMULATE_PRO_KEY, String(value)); } catch {}
  }, []);

  const isGracePeriod = new Date() < GRACE_PERIOD_END;
  const isPro = profile?.is_pro ?? false;
  const isLifetimeAccess = profile?.is_lifetime_access ?? false;
  const isProUser = simulatePro || isPro || isLifetimeAccess || isGracePeriod;
  const proSettings: ProSettings = (profile?.pro_settings as ProSettings) ?? {};

  return { isPro, isLifetimeAccess, isProUser, isGracePeriod, proSettings, simulatePro, setSimulatePro };
}
