import { motion } from 'framer-motion';
import { useSubscription, ProSettings } from '@/hooks/useSubscription';

interface EmojiPetProps {
  isHappy?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PET_TYPES: Record<string, string> = {
  dragon: '🐉',
  cat: '🐱',
  dog: '🐶',
  fox: '🦊',
  owl: '🦉',
  unicorn: '🦄',
  bear: '🐻',
  default: '🐾',
};

export function EmojiPet({ isHappy = false, size = 'md' }: EmojiPetProps) {
  const { proSettings } = useSubscription();
  const petType = proSettings?.virtualPet?.type || 'default';
  const petName = proSettings?.virtualPet?.name || 'Buddy';
  const petLevel = proSettings?.virtualPet?.level || 1;
  const emoji = PET_TYPES[petType] || PET_TYPES.default;

  const sizeClasses = {
    sm: 'text-4xl',
    md: 'text-6xl',
    lg: 'text-8xl',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className={sizeClasses[size]}
        animate={
          isHappy
            ? {
                y: [0, -20, 0, -15, 0, -8, 0],
                rotate: [0, -10, 10, -10, 10, -5, 0],
                scale: [1, 1.2, 1, 1.15, 1, 1.08, 1],
              }
            : {
                y: [0, -4, 0],
                rotate: [0, 2, -2, 0],
              }
        }
        transition={
          isHappy
            ? { duration: 1.4, ease: 'easeInOut' }
            : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {emoji}
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

      {/* Happy reaction speech bubble */}
      {isHappy && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
          className="px-3 py-1.5 rounded-2xl bg-primary/15 border border-primary/25 text-sm font-medium text-primary"
        >
          ✨ Woohoo! ✨
        </motion.div>
      )}
    </div>
  );
}
