import { useAuth } from '@/contexts/AuthContext';

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

  const isPro = profile?.is_pro ?? false;
  const isLifetimeAccess = profile?.is_lifetime_access ?? false;
  const isProUser = isPro || isLifetimeAccess;
  const proSettings: ProSettings = (profile?.pro_settings as ProSettings) ?? {};

  return { isPro, isLifetimeAccess, isProUser, proSettings };
}
