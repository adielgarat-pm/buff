import { useAuth } from '@/contexts/AuthContext';

export const GRACE_PERIOD_END = new Date('2026-02-20T23:59:59');

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

  const isGracePeriod = new Date() < GRACE_PERIOD_END;
  const isPro = profile?.is_pro ?? false;
  const isLifetimeAccess = profile?.is_lifetime_access ?? false;
  const isProUser = isPro || isLifetimeAccess || isGracePeriod;
  const proSettings: ProSettings = (profile?.pro_settings as ProSettings) ?? {};

  return { isPro, isLifetimeAccess, isProUser, isGracePeriod, proSettings };
}
