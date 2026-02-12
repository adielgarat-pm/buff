import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChildPet, PetState, EvolutionStage } from '@/hooks/useChildPet';
import { useSubscription } from '@/hooks/useSubscription';
import { Progress } from './ui/progress';
import { Sparkles, Moon, Zap, Heart, Flame, Shield, Ticket } from 'lucide-react';
import Lottie from 'lottie-react';
import { playCreditDing } from '@/utils/celebrationAudio';

const PET_SKINS: Record<string, { emoji: string; nameKey: string }> = {
  dragon: { emoji: '🐉', nameKey: 'pet.skin.dragon' },
  robot: { emoji: '🤖', nameKey: 'pet.skin.robot' },
  cat: { emoji: '🐱', nameKey: 'pet.skin.cat' },
  fox: { emoji: '🦊', nameKey: 'pet.skin.fox' },
  unicorn: { emoji: '🦄', nameKey: 'pet.skin.unicorn' },
  owl: { emoji: '🦉', nameKey: 'pet.skin.owl' },
  bear: { emoji: '🐻', nameKey: 'pet.skin.bear' },
  dino: { emoji: '🦖', nameKey: 'pet.skin.dino' },
};

// Evolution stage visuals
const EVOLUTION_VISUALS: Record<EvolutionStage, { emoji: string; labelKey: string; glowColor: string }> = {
  egg: { emoji: '🥚', labelKey: 'pet.stage.egg', glowColor: 'from-muted/20' },
  hatchling: { emoji: '🐣', labelKey: 'pet.stage.hatchling', glowColor: 'from-primary/20' },
  scout: { emoji: '⚡', labelKey: 'pet.stage.scout', glowColor: 'from-primary/30' },
  guardian: { emoji: '🛡️', labelKey: 'pet.stage.guardian', glowColor: 'from-accent/30' },
};

const GREETING_KEYS = [
  'pet.greeting.ready',
  'pet.greeting.awesome',
  'pet.greeting.mission',
  'pet.greeting.believe',
];

const CELEBRATION_URL = 'https://assets2.lottiefiles.com/packages/lf20_u4yrau.json';

interface PetDisplayProps {
  childName?: string;
  childId?: string;
  justCompletedTask?: boolean;
  onTaskCompletionAck?: () => void;
}

export function PetDisplay({ childName, childId, justCompletedTask, onTaskCompletionAck }: PetDisplayProps) {
  const { t } = useLanguage();
  const { isProUser, proSettings } = useSubscription();
  const {
    petState,
    isResting,
    loading,
    recordInteraction,
    xpProgress,
    xpInLevel,
    xpNeeded,
    evolutionProgress,
    evolutionDaysInStage,
    evolutionDaysNeeded,
  } = useChildPet(childId);

  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingText, setGreetingText] = useState('');
  const [showEnergyGlow, setShowEnergyGlow] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [lottieData, setLottieData] = useState<object | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const petName = proSettings?.virtualPet?.name || 'Buddy';
  const skin = PET_SKINS[petState.current_skin] || PET_SKINS.dragon;
  const stage = EVOLUTION_VISUALS[petState.evolution_stage];
  const isMaxEvolution = petState.evolution_stage === 'guardian';

  // For egg stage, show the egg emoji; for higher stages show the pet skin
  const displayEmoji = petState.evolution_stage === 'egg' ? '🥚' : skin.emoji;

  // Load Lottie for Pro celebrations
  useEffect(() => {
    if (isProUser && !lottieData) {
      fetch(CELEBRATION_URL)
        .then(r => r.json())
        .then(setLottieData)
        .catch(() => {});
    }
  }, [isProUser, lottieData]);

  // Handle task completion glow
  useEffect(() => {
    if (justCompletedTask) {
      setShowEnergyGlow(true);
      setShowCelebration(true);
      playCreditDing();

      const glowTimer = setTimeout(() => {
        setShowEnergyGlow(false);
        setShowCelebration(false);
        onTaskCompletionAck?.();
      }, 2500);

      return () => clearTimeout(glowTimer);
    }
  }, [justCompletedTask, onTaskCompletionAck]);

  // Tap to greet
  const handleTap = useCallback(() => {
    if (isResting) return;

    recordInteraction();
    const key = GREETING_KEYS[Math.floor(Math.random() * GREETING_KEYS.length)];
    const greeting = t(key).replace('{name}', childName || t('celebration.champ'));
    setGreetingText(greeting);
    setShowGreeting(true);

    setTimeout(() => setShowGreeting(false), 3000);
  }, [isResting, recordInteraction, t, childName]);

  const energyLevel = petState.energy_level;
  const isHighEnergy = energyLevel >= 70;

  if (loading) return null;

  return (
    <div className="relative flex flex-col items-center py-4">
      {/* Energy Glow Background */}
      <AnimatePresence>
        {showEnergyGlow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.6, scale: 1.5 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 rounded-3xl bg-gradient-radial from-primary/30 to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Pro Lottie celebration */}
      <AnimatePresence>
        {showCelebration && isProUser && lottieData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl"
          >
            <Lottie animationData={lottieData} loop={false} className="w-full h-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet Container */}
      <div className="relative">
        {/* Pet Emoji with breathing/floating animation */}
        <motion.button
          onClick={handleTap}
          disabled={isResting}
          className="text-7xl focus:outline-none cursor-pointer disabled:cursor-default select-none"
          animate={
            isResting
              ? { y: [0, -3, 0], scale: [0.95, 0.92, 0.95] }
              : isHighEnergy
              ? { y: [0, -10, 0, -6, 0], scale: [1, 1.05, 1, 1.03, 1] }
              : { y: [0, -6, 0], scale: [1, 1.02, 1] }
          }
          transition={
            isResting
              ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              : isHighEnergy
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }
          style={isResting ? { filter: 'grayscale(0.4)', opacity: 0.6 } : undefined}
          whileTap={!isResting ? { scale: 1.15 } : undefined}
        >
          {isResting ? '😴' : displayEmoji}
        </motion.button>

        {/* Energy indicator dot */}
        {!isResting && (
          <motion.div
            className={`absolute -bottom-1 start-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${
              isHighEnergy ? 'bg-green-400' : energyLevel >= 30 ? 'bg-yellow-400' : 'bg-muted-foreground/40'
            }`}
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Pet Name + Level + Stage Badge */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-sm font-bold text-foreground">{petName}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
          Lv.{petState.level}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground font-semibold flex items-center gap-1">
          {stage.emoji} {t(stage.labelKey)}
        </span>
      </div>

      {/* Evolution Progress */}
      <div className="w-full max-w-[200px] mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
            {isMaxEvolution ? (
              <><Shield className="w-3 h-3" /> {t('pet.maxEvolution')}</>
            ) : (
              <><Sparkles className="w-3 h-3" /> {t('pet.evolutionProgress')}</>
            )}
          </span>
        </div>
        <Progress value={evolutionProgress} className="h-2" />
        {!isMaxEvolution && (
          <p className="text-[10px] text-muted-foreground text-center mt-0.5">
            {evolutionDaysInStage}/{evolutionDaysNeeded} {t('pet.daysToEvolve')}
          </p>
        )}
      </div>

      {/* Streak + Rest Cards row */}
      <div className="flex items-center gap-4 mt-2">
        {/* Daily Streak */}
        <div className="flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-bold text-foreground">{petState.daily_streak}</span>
          <span className="text-[10px] text-muted-foreground">{t('pet.streak')}</span>
        </div>

        {/* Rest Cards */}
        <div className="flex items-center gap-1">
          <Ticket className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">{petState.rest_cards_balance}</span>
          <span className="text-[10px] text-muted-foreground">{t('pet.restCards')}</span>
        </div>

        {/* Energy */}
        <div className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">{energyLevel}%</span>
        </div>
      </div>

      {/* XP Progress Bar (smaller, secondary) */}
      <div className="w-full max-w-[160px] mt-2">
        <Progress value={xpProgress} className="h-1" />
        <p className="text-[10px] text-muted-foreground text-center mt-0.5">
          {xpInLevel}/{xpNeeded} XP
        </p>
      </div>

      {/* Greeting Bubble */}
      <AnimatePresence>
        {showGreeting && !isResting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -5 }}
            className="mt-3 px-4 py-2 rounded-2xl bg-card border border-border shadow-sm max-w-[220px]"
          >
            <p className="text-xs text-foreground text-center font-medium">
              {greetingText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resting Message */}
      <AnimatePresence>
        {isResting && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 px-4 py-3 rounded-2xl bg-muted border border-border text-center max-w-[240px]"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Moon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">{t('pet.restingTitle')}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('pet.restMessage')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest Card Used Message */}
      {/* Level Up notification */}
      <AnimatePresence>
        {showEvolution && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            {t('pet.evolved')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
