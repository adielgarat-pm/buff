import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { playCelebrationChime } from '@/utils/celebrationAudio';

interface DigitalTicketModalProps {
  show: boolean;
  rewardTitle: string;
  rewardIcon: string;
  onDismiss: () => void;
}

export function DigitalTicketModal({ show, rewardTitle, rewardIcon, onDismiss }: DigitalTicketModalProps) {
  const { t } = useLanguage();
  const [showClose, setShowClose] = useState(false);

  useEffect(() => {
    if (show) {
      playCelebrationChime();
      const timer = setTimeout(() => setShowClose(true), 1500);
      return () => clearTimeout(timer);
    }
    setShowClose(false);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
          onClick={showClose ? onDismiss : undefined}
        >
          <motion.div
            initial={{ scale: 0.3, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ticket shape */}
            <div
              className="relative bg-gradient-to-br from-primary via-primary/90 to-accent rounded-3xl p-1 shadow-2xl"
              style={{
                filter: 'drop-shadow(0 0 30px hsl(var(--primary) / 0.5))',
              }}
            >
              <div className="bg-card rounded-[22px] p-6 relative overflow-hidden">
                {/* Sparkle particles */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                  className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-accent/20 to-transparent rounded-full"
                />

                {/* Ticket notches */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-black/70 rounded-full" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-black/70 rounded-full" />

                {/* Dashed line */}
                <div className="absolute left-8 right-8 top-1/2 border-t-2 border-dashed border-primary/20 -translate-y-1/2 pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 text-center space-y-4">
                  {/* Top: celebration */}
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold text-primary uppercase tracking-wider">
                      {t('ticket.loot')}
                    </span>
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>

                  {/* Big icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    className="text-7xl py-4"
                  >
                    {rewardIcon}
                  </motion.div>

                  {/* Reward name */}
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xl font-black text-foreground"
                  >
                    {rewardTitle}
                  </motion.h2>

                  {/* "You got it!" */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-lg font-bold text-primary"
                  >
                    {t('ticket.youGotIt')}
                  </motion.p>

                  {/* Show to parent hint */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-xs text-muted-foreground"
                  >
                    {t('ticket.showToParent')}
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Close button */}
            {showClose && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={onDismiss}
                className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-lg"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
