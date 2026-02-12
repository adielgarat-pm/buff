import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { X, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmojiPet } from './EmojiPet';
import { playCelebrationChime, playCreditDing } from '@/utils/celebrationAudio';
import { useLanguage } from '@/contexts/LanguageContext';

// Lottie confetti animation data (inline lightweight version)
const CONFETTI_URL = 'https://assets2.lottiefiles.com/packages/lf20_u4yrau.json';

interface PackCompletionCelebrationProps {
  show: boolean;
  childName?: string;
  creditsEarned: number;
  onDismiss: () => void;
}

export function PackCompletionCelebration({
  show,
  childName,
  creditsEarned,
  onDismiss,
}: PackCompletionCelebrationProps) {
  const { t } = useLanguage();
  const [animatedCredits, setAnimatedCredits] = useState(0);
  const [showCloseBtn, setShowCloseBtn] = useState(false);
  const [lottieData, setLottieData] = useState<object | null>(null);
  const hasPlayedSound = useRef(false);

  // Load Lottie JSON
  useEffect(() => {
    if (show && !lottieData) {
      fetch(CONFETTI_URL)
        .then(r => r.json())
        .then(setLottieData)
        .catch(() => {}); // Graceful fallback
    }
  }, [show, lottieData]);

  // Play celebration chime
  useEffect(() => {
    if (show && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      playCelebrationChime();
    }
    if (!show) {
      hasPlayedSound.current = false;
    }
  }, [show]);

  // Animate credit counter
  useEffect(() => {
    if (!show) {
      setAnimatedCredits(0);
      return;
    }

    // Gentle credit count-up - fewer dings, calmer pacing
    const duration = 1800;
    const steps = 20;
    const increment = creditsEarned / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), creditsEarned);
      setAnimatedCredits(current);

      // Only play ding at start, midpoint, and end - not gambling-like
      if (step === 1 || step === Math.floor(steps / 2) || step === steps) {
        playCreditDing();
      }

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedCredits(creditsEarned);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [show, creditsEarned]);

  // Show close button after 3 seconds
  useEffect(() => {
    if (show) {
      setShowCloseBtn(false);
      const timer = setTimeout(() => setShowCloseBtn(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center"
      >
        {/* Calm background - soft gradient, no flashing */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-primary/10 backdrop-blur-sm" />

        {/* Lottie Confetti Layer - reduced opacity for calmness */}
        {lottieData && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <Lottie
              animationData={lottieData}
              loop={false}
              className="absolute inset-0 w-full h-full"
              style={{ opacity: 0.5 }}
            />
          </div>
        )}

        {/* Content */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 0.3 }}
          className="relative z-10 flex flex-col items-center text-center px-6 py-8 max-w-sm w-full mx-4"
        >
          {/* Trophy Icon - gentle entrance */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 150, damping: 15 }}
            className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center mb-6"
          >
            <Trophy className="w-10 h-10 text-primary" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-2xl font-black text-foreground mb-2"
          >
            {t('celebration.greatJob')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-lg font-bold text-primary mb-1"
          >
            {childName || t('celebration.champ')}!
          </motion.p>

          {/* Effort reinforcement - clear connection to hard work */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-muted-foreground mb-6"
          >
            {t('celebration.effortMessage')}
          </motion.p>

          {/* Credit Vault Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9, type: 'spring', damping: 20 }}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-card/80 border border-primary/20 shadow-md mb-6"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="text-start">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('celebration.creditsEarned')}
              </p>
              <p className="text-3xl font-black text-primary tabular-nums">
                +{animatedCredits}
              </p>
            </div>
          </motion.div>

          {/* Emoji Pet - calm happy state */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mb-8"
          >
            <EmojiPet isHappy={true} size="lg" />
          </motion.div>

          {/* Close Button - appears after 3s */}
          <AnimatePresence>
            {showCloseBtn && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <Button
                  onClick={onDismiss}
                  className="w-full h-12 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90"
                >
                  {t('celebration.continue')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Always-available close X */}
          <button
            onClick={onDismiss}
            className="absolute top-0 end-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
