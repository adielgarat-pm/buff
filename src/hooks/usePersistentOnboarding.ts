import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FocusArea } from '@/components/onboarding/steps/Step2FocusArea';
import { SchoolFeature } from '@/components/onboarding/steps/Step3SchoolFeature';

const STORAGE_KEY = 'buff_onboarding_draft';
const DEBOUNCE_MS = 500;

export interface OnboardingDraft {
  childName?: string;
  birthDate?: string; // ISO string for serialization
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

  // Hydrate from localStorage and Supabase on mount
  useEffect(() => {
    const hydrate = async () => {
      let mergedDraft = getEmptyDraft();

      // 1. Check localStorage first (instant)
      try {
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
          const parsed = JSON.parse(localData) as OnboardingDraft;
          mergedDraft = { ...mergedDraft, ...parsed };
        }
      } catch (e) {
        console.warn('Failed to parse localStorage onboarding draft:', e);
      }

      // 2. Check Supabase if user is logged in (might be more recent)
      if (user && profile?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_step, onboarding_data')
            .eq('id', profile.id)
            .single();

          if (!error && data) {
            const dbStep = data.onboarding_step || 0;
            const dbData = (data.onboarding_data || {}) as Partial<OnboardingDraft>;
            
            // Merge: take the more recent data
            const dbUpdatedAt = dbData.updatedAt || '1970-01-01';
            if (dbUpdatedAt > mergedDraft.updatedAt || dbStep > mergedDraft.lastCompletedStep) {
              mergedDraft = {
                ...mergedDraft,
                ...dbData,
                lastCompletedStep: Math.max(dbStep, mergedDraft.lastCompletedStep),
                updatedAt: dbUpdatedAt > mergedDraft.updatedAt ? dbUpdatedAt : mergedDraft.updatedAt,
              };
            }
          }
        } catch (e) {
          console.warn('Failed to fetch onboarding data from Supabase:', e);
        }
      }

      setDraft(mergedDraft);
      setIsHydrated(true);
    };

    hydrate();
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

  // Mark step as completed
  const completeStep = useCallback((step: number) => {
    updateDraft({ lastCompletedStep: Math.max(draft.lastCompletedStep, step) });
  }, [draft.lastCompletedStep, updateDraft]);

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
