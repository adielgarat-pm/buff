import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export type ChildTheme = 'mint' | 'gamer';
export type AgeMode = 'kid' | 'teen';

export interface ChildPreferences {
  theme: ChildTheme;
  pet_enabled: boolean;
  age_mode: AgeMode;
  child_onboarding_completed: boolean;
}

const DEFAULT_PREFERENCES: ChildPreferences = {
  theme: 'mint',
  pet_enabled: true,
  age_mode: 'kid',
  child_onboarding_completed: false,
};

export function useChildPreferences(childId?: string) {
  const { profile } = useAuth();
  const effectiveId = childId || profile?.id;

  const [preferences, setPreferences] = useState<ChildPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!effectiveId) return;

    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('child_preferences')
        .eq('id', effectiveId)
        .single();

      if (data?.child_preferences) {
        const raw = data.child_preferences as Record<string, unknown>;
        setPreferences({
          theme: (raw.theme as ChildTheme) || 'mint',
          pet_enabled: raw.pet_enabled !== false,
          age_mode: (raw.age_mode as AgeMode) || 'kid',
          child_onboarding_completed: !!raw.child_onboarding_completed,
        });
      }
      setLoading(false);
    };

    load();
  }, [effectiveId]);

  const savePreferences = useCallback(async (newPrefs: ChildPreferences) => {
    if (!effectiveId) return;
    setPreferences(newPrefs);

    await supabase
      .from('profiles')
      .update({ child_preferences: newPrefs as unknown as Json })
      .eq('id', effectiveId);
  }, [effectiveId]);

  const updatePreference = useCallback(async <K extends keyof ChildPreferences>(
    key: K,
    value: ChildPreferences[K]
  ) => {
    const newPrefs = { ...preferences, [key]: value };
    await savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  // Computed: theme class name
  const themeClass = preferences.theme === 'gamer' ? 'theme-child-gamer' : 'theme-child-playful';

  // Computed: should show pet
  const showPet = preferences.pet_enabled;

  // Computed: terminology mode
  const isTeen = preferences.age_mode === 'teen';

  return {
    preferences,
    loading,
    themeClass,
    showPet,
    isTeen,
    savePreferences,
    updatePreference,
    needsOnboarding: !preferences.child_onboarding_completed,
  };
}
