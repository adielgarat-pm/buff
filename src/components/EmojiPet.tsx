import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription, ProSettings } from '@/hooks/useSubscription';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmojiPetProps {
  isHappy?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** If true, interactions count toward rest period */
  interactive?: boolean;
}

const PET_TYPES: Record<string, string> = {
  dragon: '🐉',
  cat: '🐱',
  dog: '🐶',
  fox: '🦊',
  owl: '🦉',
  unicorn: '🦄',
  bear: '🐻',
  puppy: '🐶',
  ginger_cat: '🐈',
  rabbit: '🐰',
  panda: '🐼',
  default: '🐾',
};

const REST_KEY = 'buff_pet_rest';
const REST_DURATION_MS = 15 * 60 * 1000; // 15 minutes rest
const MAX_INTERACTIONS = 8; // After 8 taps, pet rests

interface RestState {
  interactionCount: number;
  restingUntil: number | null;
}

function getRestState(): RestState {
  try {
    const stored = localStorage.getItem(REST_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { interactionCount: 0, restingUntil: null };
}

function saveRestState(state: RestState) {
  localStorage.setItem(REST_KEY, JSON.stringify(state));
}

export function EmojiPet({ isHappy = false, size = 'md', interactive = false }: EmojiPetProps) {
  const { proSettings } = useSubscription();
  const { t } = useLanguage();
  const petType = proSettings?.virtualPet?.type || 'default';
  const petName = proSettings?.virtualPet?.name || 'Buddy';
  const petLevel = proSettings?.virtualPet?.level || 1;
  const emoji = PET_TYPES[petType] || PET_TYPES.default;

  const [restState, setRestState] = useState<RestState>(getRestState);
  const [isResting, setIsResting] = useState(false);
  const [showReaction, setShowReaction] = useState(false);

  // Check if pet is currently resting
  useEffect(() => {
    const state = getRestState();
    if (state.restingUntil && Date.now() < state.restingUntil) {
      setIsResting(true);
      const remaining = state.restingUntil - Date.now();
      const timer = setTimeout(() => {
        setIsResting(false);
        const newState = { interactionCount: 0, restingUntil: null };
        saveRestState(newState);
        setRestState(newState);
      }, remaining);
      return () => clearTimeout(timer);
    } else if (state.restingUntil) {
      // Rest period expired
      const newState = { interactionCount: 0, restingUntil: null };
      saveRestState(newState);
      setRestState(newState);
      setIsResting(false);
    }
  }, []);

  const handleInteraction = useCallback(() => {
    if (!interactive || isResting) return;

    const state = getRestState();
    const newCount = state.interactionCount + 1;

    if (newCount >= MAX_INTERACTIONS) {
      // Enter rest period
      const restUntil = Date.now() + REST_DURATION_MS;
      const newState = { interactionCount: newCount, restingUntil: restUntil };
      saveRestState(newState);
      setRestState(newState);
      setIsResting(true);

      // Auto-wake after rest period
      setTimeout(() => {
        setIsResting(false);
        const resetState = { interactionCount: 0, restingUntil: null };
        saveRestState(resetState);
        setRestState(resetState);
      }, REST_DURATION_MS);
    } else {
      // Show a brief reaction
      setShowReaction(true);
      setTimeout(() => setShowReaction(false), 1200);
      const newState = { ...state, interactionCount: newCount };
      saveRestState(newState);
      setRestState(newState);
    }
  }, [interactive, isResting]);

  const sizeClasses = {
    sm: 'text-4xl',
    md: 'text-6xl',
    lg: 'text-8xl',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className={`${sizeClasses[size]} ${interactive && !isResting ? 'cursor-pointer' : ''}`}
        onClick={handleInteraction}
        animate={
          isResting
            ? {
                y: [0, -2, 0],
                rotate: [0, 1, -1, 0],
                scale: [1, 0.95, 1],
              }
            : isHappy || showReaction
            ? {
                y: [0, -12, 0, -8, 0],
                rotate: [0, -5, 5, -3, 0],
                scale: [1, 1.1, 1, 1.05, 1],
              }
            : {
                y: [0, -4, 0],
                rotate: [0, 2, -2, 0],
              }
        }
        transition={
          isResting
            ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            : isHappy || showReaction
            ? { duration: 1.2, ease: 'easeInOut' }
            : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
        }
        style={isResting ? { filter: 'grayscale(0.4)', opacity: 0.7 } : undefined}
      >
        {isResting ? '😴' : emoji}
      </motion.div>

      {/* Pet name + level badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-1.5"
      >
        <span className="text-sm font-bold text-foreground">{petName}</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
          Lv.{petLevel}
        </span>
      </motion.div>

      {/* Resting message */}
      <AnimatePresence>
        {isResting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="px-4 py-2 rounded-2xl bg-muted border border-border text-center max-w-[200px]"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {t('pet.resting')}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('pet.restEncouragement')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Happy reaction speech bubble */}
      <AnimatePresence>
        {(isHappy || showReaction) && !isResting && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ delay: isHappy ? 0.6 : 0, type: 'spring', stiffness: 300 }}
            className="px-3 py-1.5 rounded-2xl bg-primary/15 border border-primary/25 text-sm font-medium text-primary"
          >
            {isHappy ? `✨ ${t('pet.happyReaction')} ✨` : '💚'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
