import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FocusArea } from '@/components/onboarding/steps/Step2FocusArea';
import { SchoolFeature } from '@/components/onboarding/steps/Step3SchoolFeature';
import { GradeOption } from '@/components/onboarding/steps/Step1Profile';

const STORAGE_KEY = 'buff_onboarding_draft';
const DEBOUNCE_MS = 500;

export interface OnboardingDraft {
  childName?: string;
  birthDate?: string; // ISO string for serialization
  grade?: GradeOption;
  focusArea?: FocusArea;
  schoolFeature?: SchoolFeature;
  firstTask?: string;
  weekendReward?: string;
  childProfileId?: string; // Set after Step 1 early commit
  lastCompletedStep: number;
  updatedAt: string;
}

const getEmptyDraft = (): OnboardingDraft => ({
  lastCompletedStep: 0,
  updatedAt: new Date().toISOString(),
});

/**
 * Zero-Loss Persistence Hook
 * Saves onboarding data in real-time to both localStorage (instant) and Supabase (debounced)
 */
export function usePersistentOnboarding() {
  const { user, profile } = useAuth();
  const [draft, setDraft] = useState<OnboardingDraft>(getEmptyDraft);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate from localStorage instantly, then optionally merge from Supabase
  useEffect(() => {
    // Phase 1: Restore from localStorage immediately — no async wait
    let mergedDraft = getEmptyDraft();
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData) as OnboardingDraft;
        // Only restore if genuinely in-progress (has a childProfileId and step < 6)
        const isActiveSession =
          parsed.childProfileId &&
          parsed.lastCompletedStep > 0 &&
          parsed.lastCompletedStep < 6;
        if (isActiveSession) {
          mergedDraft = { ...mergedDraft, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to parse localStorage onboarding draft:', e);
    }

    // Mark as hydrated immediately — no more loading screen
    setDraft(mergedDraft);
    setIsHydrated(true);

    // Phase 2: Optionally sync from Supabase in the background (won't block UI)
    if (user && profile?.id) {
      const profileId = profile.id;
      (async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_step, onboarding_data')
            .eq('id', profileId)
            .single();

          if (!error && data) {
            const dbStep = data.onboarding_step || 0;
            const dbData = (data.onboarding_data || {}) as Partial<OnboardingDraft>;

            // Only merge if DB has a more recent in-progress session
            const isActiveDbSession =
              dbStep > 0 &&
              dbStep < 6 &&
              dbData.childProfileId;

            if (isActiveDbSession) {
              setDraft(prev => {
                const dbUpdatedAt = dbData.updatedAt || '1970-01-01';
                if (dbUpdatedAt > prev.updatedAt || dbStep > prev.lastCompletedStep) {
                  return {
                    ...prev,
                    ...dbData,
                    lastCompletedStep: Math.max(dbStep, prev.lastCompletedStep),
                    updatedAt: dbUpdatedAt > prev.updatedAt ? dbUpdatedAt : prev.updatedAt,
                  };
                }
                return prev;
              });
            }
          }
        } catch (e) {
          console.warn('Failed to fetch onboarding data from Supabase:', e);
        }
      })();
    }
  }, [user, profile?.id]);

  // Save to localStorage immediately
  const saveToLocalStorage = useCallback((newDraft: OnboardingDraft) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDraft));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, []);

  // Save to Supabase (debounced)
  const saveToSupabase = useCallback(async (newDraft: OnboardingDraft) => {
    if (!user || !profile?.id) return;

    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_step: newDraft.lastCompletedStep,
          onboarding_data: JSON.parse(JSON.stringify(newDraft)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Failed to save onboarding data to Supabase:', error);
      }
    } catch (e) {
      console.error('Error saving to Supabase:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [user, profile?.id]);

  // Update draft with real-time persistence
  const updateDraft = useCallback((updates: Partial<OnboardingDraft>) => {
    setDraft(prev => {
      const newDraft: OnboardingDraft = {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // 1. Save to localStorage immediately (sync, instant)
      saveToLocalStorage(newDraft);

      // 2. Debounce save to Supabase
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveToSupabase(newDraft);
      }, DEBOUNCE_MS);

      return newDraft;
    });
  }, [saveToLocalStorage, saveToSupabase]);

  // Mark step as completed (uses functional update to avoid stale closure)
  const completeStep = useCallback((step: number) => {
    setDraft(prev => {
      const newStep = Math.max(prev.lastCompletedStep, step);
      if (newStep === prev.lastCompletedStep) return prev;
      const newDraft: OnboardingDraft = {
        ...prev,
        lastCompletedStep: newStep,
        updatedAt: new Date().toISOString(),
      };
      saveToLocalStorage(newDraft);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveToSupabase(newDraft), DEBOUNCE_MS);
      return newDraft;
    });
  }, [saveToLocalStorage, saveToSupabase]);

  // Clear draft after successful onboarding
  const clearDraft = useCallback(async () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }

    if (user && profile?.id) {
      try {
        await supabase
          .from('profiles')
          .update({
            onboarding_step: 6, // Mark as complete
            onboarding_data: {},
          })
          .eq('id', profile.id);
      } catch (e) {
        console.warn('Failed to clear Supabase onboarding data:', e);
      }
    }

    setDraft(getEmptyDraft());
  }, [user, profile?.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Convert stored ISO string back to Date for components
  const getBirthDate = useCallback((): Date | undefined => {
    if (!draft.birthDate) return undefined;
    try {
      return new Date(draft.birthDate);
    } catch {
      return undefined;
    }
  }, [draft.birthDate]);

  // Helper to set birthDate from Date object
  const setBirthDate = useCallback((date: Date) => {
    updateDraft({ birthDate: date.toISOString() });
  }, [updateDraft]);

  return {
    draft,
    isHydrated,
    isSyncing,
    updateDraft,
    completeStep,
    clearDraft,
    getBirthDate,
    setBirthDate,
  };
}
