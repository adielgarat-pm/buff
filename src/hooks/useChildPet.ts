import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface PetState {
  level: number;
  experience: number;
  energy_level: number;
  current_skin: string;
  last_interaction: string | null;
}

const DEFAULT_PET_STATE: PetState = {
  level: 1,
  experience: 0,
  energy_level: 50,
  current_skin: 'dragon',
  last_interaction: null,
};

// XP thresholds per level (cumulative)
const LEVEL_THRESHOLDS = [0, 50, 120, 220, 350, 520, 730, 1000, 1350, 1800];
const MAX_LEVEL = LEVEL_THRESHOLDS.length;

// Rest period config
const REST_DURATION_MS = 5 * 60 * 1000; // 5 minutes of active interaction triggers rest
const REST_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes rest

const PET_REST_KEY = 'buff_pet_session';

interface SessionState {
  activeStartTime: number | null;
  restingUntil: number | null;
}

function getSessionState(): SessionState {
  try {
    const stored = localStorage.getItem(PET_REST_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { activeStartTime: null, restingUntil: null };
}

function saveSessionState(state: SessionState) {
  localStorage.setItem(PET_REST_KEY, JSON.stringify(state));
}

export function useChildPet(childId?: string) {
  const { profile, familyId } = useAuth();
  const effectiveChildId = childId || profile?.id;

  const [petState, setPetState] = useState<PetState>(DEFAULT_PET_STATE);
  const [isResting, setIsResting] = useState(false);
  const [loading, setLoading] = useState(true);
  const restTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const activeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Load pet state from DB
  useEffect(() => {
    if (!effectiveChildId) return;

    const loadPetState = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('pet_state')
        .eq('id', effectiveChildId)
        .single();

      if (data?.pet_state) {
        setPetState(data.pet_state as unknown as PetState);
      }
      setLoading(false);
    };

    loadPetState();
  }, [effectiveChildId]);

  // Manage time-based rest period
  useEffect(() => {
    const session = getSessionState();

    // Check if currently resting
    if (session.restingUntil && Date.now() < session.restingUntil) {
      setIsResting(true);
      const remaining = session.restingUntil - Date.now();
      restTimerRef.current = setTimeout(() => {
        setIsResting(false);
        saveSessionState({ activeStartTime: null, restingUntil: null });
      }, remaining);
      return;
    }

    // If rest expired, clear it
    if (session.restingUntil) {
      saveSessionState({ activeStartTime: null, restingUntil: null });
      setIsResting(false);
    }

    // Start tracking active time
    if (!session.activeStartTime) {
      saveSessionState({ ...session, activeStartTime: Date.now() });
    }

    // Check if active time exceeds limit
    const checkActive = () => {
      const s = getSessionState();
      if (s.activeStartTime && Date.now() - s.activeStartTime >= REST_DURATION_MS) {
        const restUntil = Date.now() + REST_COOLDOWN_MS;
        saveSessionState({ activeStartTime: null, restingUntil: restUntil });
        setIsResting(true);
        restTimerRef.current = setTimeout(() => {
          setIsResting(false);
          saveSessionState({ activeStartTime: null, restingUntil: null });
        }, REST_COOLDOWN_MS);
      }
    };

    activeTimerRef.current = setTimeout(checkActive, REST_DURATION_MS);

    return () => {
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
    };
  }, []);

  // Save pet state to DB
  const savePetState = useCallback(async (newState: PetState) => {
    if (!effectiveChildId) return;
    setPetState(newState);

    await supabase
      .from('profiles')
      .update({ pet_state: newState as unknown as Json })
      .eq('id', effectiveChildId);
  }, [effectiveChildId]);

  // Grant XP and check for level up
  const grantExperience = useCallback(async (xp: number) => {
    const newXp = petState.experience + xp;
    let newLevel = petState.level;

    // Check for level up
    while (newLevel < MAX_LEVEL && newXp >= LEVEL_THRESHOLDS[newLevel]) {
      newLevel++;
    }

    const newEnergy = Math.min(100, petState.energy_level + 15);
    const leveledUp = newLevel > petState.level;

    const newState: PetState = {
      ...petState,
      experience: newXp,
      level: newLevel,
      energy_level: newEnergy,
      last_interaction: new Date().toISOString(),
    };

    await savePetState(newState);
    return { leveledUp, newLevel };
  }, [petState, savePetState]);

  // Called when a task is completed
  const onTaskCompleted = useCallback(async (credits: number) => {
    // XP is proportional to credits earned
    const xp = Math.max(5, Math.round(credits * 0.5));
    const result = await grantExperience(xp);

    // Wake pet from rest if it was resting (task completed = earned interaction)
    if (isResting) {
      setIsResting(false);
      saveSessionState({ activeStartTime: Date.now(), restingUntil: null });
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
    }

    return result;
  }, [grantExperience, isResting]);

  // Record an interaction (tap)
  const recordInteraction = useCallback(async () => {
    if (isResting) return;

    const newState: PetState = {
      ...petState,
      last_interaction: new Date().toISOString(),
    };
    await savePetState(newState);
  }, [petState, savePetState, isResting]);

  // XP progress toward next level
  const currentLevelThreshold = LEVEL_THRESHOLDS[petState.level - 1] || 0;
  const nextLevelThreshold = petState.level < MAX_LEVEL
    ? LEVEL_THRESHOLDS[petState.level]
    : LEVEL_THRESHOLDS[MAX_LEVEL - 1];
  const xpInLevel = petState.experience - currentLevelThreshold;
  const xpNeeded = nextLevelThreshold - currentLevelThreshold;
  const xpProgress = xpNeeded > 0 ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 100;

  return {
    petState,
    isResting,
    loading,
    onTaskCompleted,
    recordInteraction,
    grantExperience,
    xpProgress,
    xpInLevel,
    xpNeeded,
  };
}
