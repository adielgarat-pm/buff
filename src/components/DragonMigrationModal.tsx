import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChildPet } from '@/hooks/useChildPet';
import { Button } from './ui/button';
import { Sparkles, Check } from 'lucide-react';

const MIGRATION_PETS = [
  { id: 'puppy',      emoji: '🐶', nameKey: 'pet.skin.puppy' },
  { id: 'ginger_cat', emoji: '🐈', nameKey: 'pet.skin.ginger_cat' },
  { id: 'rabbit',     emoji: '🐰', nameKey: 'pet.skin.rabbit' },
  { id: 'panda',      emoji: '🐼', nameKey: 'pet.skin.panda' },
  { id: 'capybara',   emoji: '🐹', nameKey: 'pet.skin.capybara' },
];

interface DragonMigrationModalProps {
  childId?: string;
}

export function DragonMigrationModal({ childId }: DragonMigrationModalProps) {
  const { t, isRTL } = useLanguage();
  const { petState, changeSkin } = useChildPet(childId);
  const [selected, setSelected] = useState('puppy');
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show if user still has the dragon skin
  if (dismissed || petState.current_skin !== 'dragon') return null;

  const handleConfirm = async () => {
    setSaving(true);
    await changeSkin(selected);
    setSaving(false);
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm bg-card border border-primary/30 rounded-2xl p-6 shadow-lg"
      >
        <div className="text-center space-y-4">
          <div className="text-5xl">🐾</div>
          <h2 className="text-xl font-bold text-foreground">
            {isRTL ? 'בחר/י חיית מחמד חדשה!' : 'Pick Your New Pet!'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? 'הדרקון יצא לחופשה. בחר/י חיית מחמד חדשה שתגדל איתך!'
              : 'The dragon has retired. Choose a new buddy to grow with!'}
          </p>

          <div className="grid grid-cols-5 gap-2">
            {MIGRATION_PETS.map((pet) => (
              <motion.button
                key={pet.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => setSelected(pet.id)}
                className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
                  selected === pet.id
                    ? 'bg-primary/15 border-2 border-primary shadow-[0_0_12px_-4px_hsl(var(--primary)/0.5)]'
                    : 'bg-secondary/50 border border-border/60 hover:border-primary/40'
                }`}
              >
                {selected === pet.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow"
                  >
                    <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
                  </motion.div>
                )}
                <span className="text-2xl">{pet.emoji}</span>
                <span className="text-[9px] font-medium text-muted-foreground leading-none text-center">
                  {t(pet.nameKey)}
                </span>
              </motion.button>
            ))}
          </div>

          <Button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold rounded-xl"
          >
            <Sparkles className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {saving
              ? (isRTL ? 'שומר...' : 'Saving...')
              : (isRTL ? 'יאללה!' : "Let's Go!")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
