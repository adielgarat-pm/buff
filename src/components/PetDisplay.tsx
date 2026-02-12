import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChildPet, PetState } from '@/hooks/useChildPet';
import { useSubscription } from '@/hooks/useSubscription';
import { Progress } from './ui/progress';
import { Sparkles, Moon, Zap, Heart } from 'lucide-react';
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

// Greetings the pet says when tapped
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
  /** Set true when a task was just completed to trigger energy glow */
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
    onTaskCompleted,
    recordInteraction,
    xpProgress,
    xpInLevel,
    xpNeeded,
  } = useChildPet(childId);

  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingText, setGreetingText] = useState('');
  const [showEnergyGlow, setShowEnergyGlow] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [lottieData, setLottieData] = useState<object | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const petName = proSettings?.virtualPet?.name || 'Buddy';
  const skin = PET_SKINS[petState.current_skin] || PET_SKINS.dragon;

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

  // Energy level determines animation intensity
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

      {/* Pro Lottie celebration on task complete */}
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
              ? {
                  y: [0, -3, 0],
                  scale: [0.95, 0.92, 0.95],
                }
              : isHighEnergy
              ? {
                  y: [0, -10, 0, -6, 0],
                  scale: [1, 1.05, 1, 1.03, 1],
                }
              : {
                  y: [0, -6, 0],
                  scale: [1, 1.02, 1],
                }
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
          {isResting ? '😴' : skin.emoji}
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

      {/* Pet Name + Level */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-sm font-bold text-foreground">{petName}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
          Lv.{petState.level}
        </span>
      </div>

      {/* XP Progress Bar */}
      <div className="w-full max-w-[180px] mt-2">
        <Progress value={xpProgress} className="h-1.5" />
        <p className="text-[10px] text-muted-foreground text-center mt-0.5">
          {xpInLevel}/{xpNeeded} XP
        </p>
      </div>

      {/* Energy Level Bar */}
      <div className="flex items-center gap-1.5 mt-2">
        <Zap className="w-3 h-3 text-primary" />
        <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${energyLevel}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">{energyLevel}%</span>
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

      {/* Level Up notification */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            {t('pet.levelUp')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
