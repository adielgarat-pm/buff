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
  const proSettings: ProSettings = (profile?.pro_settings as ProSettings) ?? {};

  return { isPro, proSettings };
}
