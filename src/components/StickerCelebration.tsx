import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const STICKER_VISUALS: Record<string, { emoji: string; gradient: string }> = {
  star: { emoji: '⭐', gradient: 'from-yellow-400 to-amber-500' },
  heart: { emoji: '💖', gradient: 'from-pink-400 to-rose-500' },
  fire: { emoji: '🔥', gradient: 'from-orange-400 to-red-500' },
  rocket: { emoji: '🚀', gradient: 'from-blue-400 to-indigo-500' },
  crown: { emoji: '👑', gradient: 'from-yellow-300 to-amber-400' },
  muscle: { emoji: '💪', gradient: 'from-emerald-400 to-green-500' },
};

interface StickerCelebrationProps {
  show: boolean;
  stickerType: string;
  message?: string | null;
  onDismiss: () => void;
}

export function StickerCelebration({ show, stickerType, message, onDismiss }: StickerCelebrationProps) {
  const { t } = useLanguage();
  const visual = STICKER_VISUALS[stickerType] || STICKER_VISUALS.star;
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; delay: number; size: number }[]>([]);

  useEffect(() => {
    if (show) {
      setSparkles(
        Array.from({ length: 20 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 0.5,
          size: 8 + Math.random() * 16,
        })),
      );
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Sparkles */}
          {sparkles.map((s) => (
            <motion.div
              key={s.id}
              className="absolute text-yellow-300 pointer-events-none"
              style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], y: [0, -40] }}
              transition={{ duration: 1.5, delay: s.delay, repeat: Infinity, repeatDelay: 1 }}
            >
              ✨
            </motion.div>
          ))}

          {/* Main content */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 px-8"
            initial={{ scale: 0.3, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.3, y: 50 }}
            transition={{ type: 'spring', damping: 12, stiffness: 150 }}
          >
            {/* Giant sticker emoji */}
            <motion.div
              className="text-8xl"
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, -5, 5, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {visual.emoji}
            </motion.div>

            {/* Message */}
            <motion.div
              className="text-center space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${visual.gradient}`}>
                {t('sticker.fromParent')}
              </h2>
              {message && (
                <p className="text-lg text-white/90 max-w-xs">{message}</p>
              )}
              <p className="text-white/60 text-sm mt-4">{t('sticker.tapToDismiss')}</p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
