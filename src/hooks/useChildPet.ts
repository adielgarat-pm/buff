import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

// Evolution stages
export type EvolutionStage = 'egg' | 'hatchling' | 'scout' | 'guardian';

export interface PetState {
  level: number;
  experience: number;
  energy_level: number;
  current_skin: string;
  last_interaction: string | null;
  // Evolution system
  evolution_stage: EvolutionStage;
  evolution_days_count: number;
  daily_streak: number;
  rest_cards_balance: number;
  last_task_completion_date: string | null;
}

const DEFAULT_PET_STATE: PetState = {
  level: 1,
  experience: 0,
  energy_level: 50,
  current_skin: 'dragon',
  last_interaction: null,
  evolution_stage: 'egg',
  evolution_days_count: 0,
  daily_streak: 0,
  rest_cards_balance: 1, // Start with 1 free rest card
  last_task_completion_date: null,
};

// Evolution thresholds (days of actual task completion)
const EVOLUTION_THRESHOLDS: Record<EvolutionStage, number> = {
  egg: 0,
  hatchling: 3,
  scout: 7,
  guardian: 13,
};

function getEvolutionStage(days: number): EvolutionStage {
  if (days >= 13) return 'guardian';
  if (days >= 7) return 'scout';
  if (days >= 3) return 'hatchling';
  return 'egg';
}

function getNextEvolutionThreshold(stage: EvolutionStage): number {
  if (stage === 'egg') return 3;
  if (stage === 'hatchling') return 7;
  if (stage === 'scout') return 13;
  return 13; // guardian is max
}

// XP thresholds per level (cumulative)
const LEVEL_THRESHOLDS = [0, 50, 120, 220, 350, 520, 730, 1000, 1350, 1800];
const MAX_LEVEL = LEVEL_THRESHOLDS.length;

// Rest period config
const REST_DURATION_MS = 5 * 60 * 1000;
const REST_COOLDOWN_MS = 15 * 60 * 1000;

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

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function normalizePetState(raw: Record<string, unknown>): PetState {
  return {
    level: (raw.level as number) ?? DEFAULT_PET_STATE.level,
    experience: (raw.experience as number) ?? DEFAULT_PET_STATE.experience,
    energy_level: (raw.energy_level as number) ?? DEFAULT_PET_STATE.energy_level,
    current_skin: (raw.current_skin as string) ?? DEFAULT_PET_STATE.current_skin,
    last_interaction: (raw.last_interaction as string | null) ?? null,
    evolution_stage: (raw.evolution_stage as EvolutionStage) ?? getEvolutionStage((raw.evolution_days_count as number) ?? 0),
    evolution_days_count: (raw.evolution_days_count as number) ?? 0,
    daily_streak: (raw.daily_streak as number) ?? 0,
    rest_cards_balance: (raw.rest_cards_balance as number) ?? 1,
    last_task_completion_date: (raw.last_task_completion_date as string | null) ?? null,
  };
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
        const loaded = normalizePetState(data.pet_state as Record<string, unknown>);
        // Check if streak needs updating (missed day without rest card)
        const processed = checkStreakOnLoad(loaded);
        if (processed !== loaded) {
          // Save the updated state back
          await supabase
            .from('profiles')
            .update({ pet_state: processed as unknown as Json })
            .eq('id', effectiveChildId);
        }
        setPetState(processed);
      }
      setLoading(false);
    };

    loadPetState();
  }, [effectiveChildId]);

  // Check streak on load - auto-consume rest card if day was missed
  function checkStreakOnLoad(state: PetState): PetState {
    const today = getTodayKey();
    const lastDate = state.last_task_completion_date;
    
    if (!lastDate || lastDate === today) return state;

    // Calculate days between last completion and today
    const last = new Date(lastDate);
    const now = new Date(today);
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return state; // Yesterday = no gap

    // There's a gap - check if we have rest cards to cover it
    let streak = state.daily_streak;
    let restCards = state.rest_cards_balance;
    const missedDays = diffDays - 1; // Days between last and today (exclusive)
    let cardsConsumed = 0;

    for (let i = 0; i < missedDays; i++) {
      if (restCards > 0) {
        restCards--;
        cardsConsumed++;
      } else {
        streak = 0; // Streak broken
        break;
      }
    }

    if (streak !== state.daily_streak || restCards !== state.rest_cards_balance) {
      // Fire event if rest cards hit 0 after consumption
      if (cardsConsumed > 0 && restCards === 0) {
        window.dispatchEvent(new CustomEvent('rest-card-depleted', {
          detail: { childId: effectiveChildId }
        }));
      }
      return {
        ...state,
        daily_streak: streak,
        rest_cards_balance: restCards,
      };
    }

    return state;
  }

  // Manage time-based rest period (screen time limit)
  useEffect(() => {
    const session = getSessionState();

    if (session.restingUntil && Date.now() < session.restingUntil) {
      setIsResting(true);
      const remaining = session.restingUntil - Date.now();
      restTimerRef.current = setTimeout(() => {
        setIsResting(false);
        saveSessionState({ activeStartTime: null, restingUntil: null });
      }, remaining);
      return;
    }

    if (session.restingUntil) {
      saveSessionState({ activeStartTime: null, restingUntil: null });
      setIsResting(false);
    }

    if (!session.activeStartTime) {
      saveSessionState({ ...session, activeStartTime: Date.now() });
    }

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

  // Called when a task is completed - handles streak + evolution + XP
  const onTaskCompleted = useCallback(async (credits: number) => {
    const today = getTodayKey();
    const xp = Math.max(5, Math.round(credits * 0.5));

    // Calculate new streak and evolution days
    let newStreak = petState.daily_streak;
    let newEvoDays = petState.evolution_days_count;
    const lastDate = petState.last_task_completion_date;

    // Only increment once per day
    if (lastDate !== today) {
      if (lastDate) {
        const last = new Date(lastDate);
        const now = new Date(today);
        const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          // Consecutive day
          newStreak += 1;
        } else if (diffDays > 1) {
          // Gap - rest cards may have been consumed on load, but if streak is still alive, continue
          newStreak = petState.daily_streak > 0 ? petState.daily_streak + 1 : 1;
        }
      } else {
        newStreak = 1; // First ever completion
      }
      newEvoDays += 1;
    }

    const newStage = getEvolutionStage(newEvoDays);
    const newXp = petState.experience + xp;
    let newLevel = petState.level;
    while (newLevel < MAX_LEVEL && newXp >= LEVEL_THRESHOLDS[newLevel]) {
      newLevel++;
    }

    // Award rest card: 1 per 5 evolution days
    let newRestCards = petState.rest_cards_balance;
    const prevCardMilestone = Math.floor(petState.evolution_days_count / 5);
    const newCardMilestone = Math.floor(newEvoDays / 5);
    if (newCardMilestone > prevCardMilestone) {
      newRestCards += (newCardMilestone - prevCardMilestone);
    }

    const evolved = newStage !== petState.evolution_stage;

    const newState: PetState = {
      ...petState,
      experience: newXp,
      level: newLevel,
      energy_level: Math.min(100, petState.energy_level + 15),
      last_interaction: new Date().toISOString(),
      evolution_stage: newStage,
      evolution_days_count: newEvoDays,
      daily_streak: newStreak,
      rest_cards_balance: newRestCards,
      last_task_completion_date: today,
    };

    await savePetState(newState);

    // Wake pet from rest if resting
    if (isResting) {
      setIsResting(false);
      saveSessionState({ activeStartTime: Date.now(), restingUntil: null });
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
    }

    return { leveledUp: newLevel > petState.level, newLevel, evolved, newStage };
  }, [petState, savePetState, isResting]);

  // Use a rest card manually
  const useRestCard = useCallback(async () => {
    if (petState.rest_cards_balance <= 0) return false;

    const newBalance = petState.rest_cards_balance - 1;
    const newState: PetState = {
      ...petState,
      rest_cards_balance: newBalance,
    };
    await savePetState(newState);

    // Notify parent if last card was used
    if (newBalance === 0) {
      window.dispatchEvent(new CustomEvent('rest-card-depleted', {
        detail: { childId: effectiveChildId }
      }));
    }

    return true;
  }, [petState, savePetState, effectiveChildId]);

  // Add rest cards (parent grant or store purchase)
  const addRestCards = useCallback(async (count: number) => {
    const newState: PetState = {
      ...petState,
      rest_cards_balance: petState.rest_cards_balance + count,
    };
    await savePetState(newState);
  }, [petState, savePetState]);

  // Change pet skin
  const changeSkin = useCallback(async (skinId: string) => {
    const newState: PetState = { ...petState, current_skin: skinId };
    await savePetState(newState);
  }, [petState, savePetState]);

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

  // Evolution progress
  const nextEvolutionDays = getNextEvolutionThreshold(petState.evolution_stage);
  const currentEvolutionDays = EVOLUTION_THRESHOLDS[petState.evolution_stage];
  const evolutionDaysInStage = petState.evolution_days_count - currentEvolutionDays;
  const evolutionDaysNeeded = nextEvolutionDays - currentEvolutionDays;
  const evolutionProgress = petState.evolution_stage === 'guardian'
    ? 100
    : Math.min(100, (evolutionDaysInStage / evolutionDaysNeeded) * 100);

  return {
    petState,
    isResting,
    loading,
    onTaskCompleted,
    recordInteraction,
    grantExperience,
    useRestCard,
    addRestCards,
    changeSkin,
    xpProgress,
    xpInLevel,
    xpNeeded,
    evolutionProgress,
    evolutionDaysInStage,
    evolutionDaysNeeded,
    nextEvolutionDays,
  };
}
