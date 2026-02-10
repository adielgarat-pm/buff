import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cake, PartyPopper, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfettiEffect } from './ConfettiEffect';
import { useLanguage } from '@/contexts/LanguageContext';

interface BirthdayCelebrationProps {
  show: boolean;
  childName?: string;
  age?: number | null;
  onDismiss: () => void;
}

export function BirthdayCelebration({ show, childName, age, onDismiss }: BirthdayCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiWave, setConfettiWave] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    if (show) {
      setShowConfetti(true);
      setConfettiWave(1);
      const wave2 = setTimeout(() => setConfettiWave(2), 800);
      const wave3 = setTimeout(() => setConfettiWave(3), 1600);
      return () => { clearTimeout(wave2); clearTimeout(wave3); };
    }
  }, [show]);

  if (!show) return null;

  return (
    <>
      <ConfettiEffect trigger={confettiWave >= 1} />
      <ConfettiEffect trigger={confettiWave >= 2} />
      <ConfettiEffect trigger={confettiWave >= 3} />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="relative bg-gradient-to-br from-primary/20 via-background to-accent/20 border-2 border-primary/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onDismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center gap-4 mb-4">
              <motion.div animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}>
                <PartyPopper className="w-10 h-10 text-yellow-400" />
              </motion.div>
              <motion.div animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Cake className="w-14 h-14 text-primary" />
              </motion.div>
              <motion.div animate={{ y: [0, -10, 0], rotate: [5, -5, 5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}>
                <Sparkles className="w-10 h-10 text-yellow-400" />
              </motion.div>
            </div>

            <motion.h1
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-primary mb-2"
            >
              {t('birthday.title')}
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-xl font-bold text-foreground mb-2">
              {childName ? `${childName}!` : t('birthday.forYou')}
            </motion.p>

            {age && (
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7, type: 'spring' }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-4">
                <span className="text-2xl">🎂</span>
                <span className="text-lg font-bold text-primary">{age} {t('birthday.years')}</span>
              </motion.div>
            )}

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-muted-foreground mb-6">
              {t('birthday.wish')}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
              <Button onClick={onDismiss} className="w-full h-12 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-yellow-500 hover:opacity-90">
                {t('birthday.thanks')}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
