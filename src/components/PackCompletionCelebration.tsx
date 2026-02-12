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

    const duration = 1200;
    const steps = 30;
    const increment = creditsEarned / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), creditsEarned);
      setAnimatedCredits(current);

      if (step % 5 === 0) {
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
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-background to-accent/20 backdrop-blur-md" />

        {/* Lottie Confetti Layer */}
        {lottieData && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <Lottie
              animationData={lottieData}
              loop={true}
              className="absolute inset-0 w-full h-full"
              style={{ opacity: 0.8 }}
            />
          </div>
        )}

        {/* Content */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, y: 80 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.2 }}
          className="relative z-10 flex flex-col items-center text-center px-6 py-8 max-w-sm w-full mx-4"
        >
          {/* Trophy Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mb-6"
          >
            <Trophy className="w-10 h-10 text-primary" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-black text-foreground mb-2"
          >
            {t('celebration.greatJob')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg font-bold text-primary mb-1"
          >
            {childName || t('celebration.champ')}!
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-muted-foreground mb-6"
          >
            {t('celebration.focusMuscles')}
          </motion.p>

          {/* Credit Vault Animation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-card/80 border border-primary/30 shadow-lg mb-6"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
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

          {/* Emoji Pet */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mb-8"
          >
            <EmojiPet isHappy={true} size="lg" />
          </motion.div>

          {/* Close Button - appears after 3s */}
          <AnimatePresence>
            {showCloseBtn && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
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
