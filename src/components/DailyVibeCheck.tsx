import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Gift, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from './ui/button';
import { VibeLevel } from '@/hooks/useVibeCheck';
import { cn } from '@/lib/utils';

interface DailyVibeCheckProps {
  show: boolean;
  isTeen: boolean;
  childName?: string;
  onSubmit: (level: VibeLevel, enableLowPower?: boolean) => void;
  onSendSOS: () => void;
  onDismiss: () => void;
}

// Kid emoji faces (6-11)
const KID_EMOJIS: { level: VibeLevel; emoji: string; labelEn: string; labelHe: string; color: string }[] = [
  { level: 5, emoji: '😄', labelEn: 'Amazing!', labelHe: 'מדהים!', color: 'bg-green-500/20 border-green-500/40' },
  { level: 4, emoji: '🙂', labelEn: 'Good', labelHe: 'טוב', color: 'bg-emerald-500/20 border-emerald-500/40' },
  { level: 3, emoji: '😐', labelEn: 'Okay', labelHe: 'ככה ככה', color: 'bg-yellow-500/20 border-yellow-500/40' },
  { level: 2, emoji: '😔', labelEn: 'Not great', labelHe: 'לא משהו', color: 'bg-orange-500/20 border-orange-500/40' },
  { level: 1, emoji: '😢', labelEn: 'Tough', labelHe: 'קשה', color: 'bg-red-500/20 border-red-500/40' },
];

// Teen energy bars (12-17)
const TEEN_BARS: { level: VibeLevel; labelEn: string; labelHe: string; color: string }[] = [
  { level: 5, labelEn: 'Full Power', labelHe: 'אנרגיה מלאה', color: 'bg-green-500' },
  { level: 4, labelEn: 'Good Energy', labelHe: 'אנרגיה טובה', color: 'bg-emerald-500' },
  { level: 3, labelEn: 'Neutral', labelHe: 'ניטרלי', color: 'bg-yellow-500' },
  { level: 2, labelEn: 'Low Battery', labelHe: 'סוללה נמוכה', color: 'bg-orange-500' },
  { level: 1, labelEn: 'Depleted', labelHe: 'מרוקן', color: 'bg-red-500' },
];

export function DailyVibeCheck({ show, isTeen, childName, onSubmit, onSendSOS, onDismiss }: DailyVibeCheckProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [selected, setSelected] = useState<VibeLevel | null>(null);
  const [showLowPowerMenu, setShowLowPowerMenu] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  if (!show) return null;

  const handleSelect = (level: VibeLevel) => {
    setSelected(level);
    if (level <= 2) {
      setShowLowPowerMenu(true);
    } else {
      // Auto-submit for good vibes
      setTimeout(() => onSubmit(level), 400);
    }
  };

  const handleLowPowerChoice = (choice: 'lowPower' | 'instantBuff' | 'sos' | 'skip') => {
    if (!selected) return;

    switch (choice) {
      case 'lowPower':
        onSubmit(selected, true);
        break;
      case 'instantBuff':
        onSubmit(selected, false);
        // Navigate to store handled by parent
        break;
      case 'sos':
        onSendSOS();
        setSosSent(true);
        setTimeout(() => {
          onSubmit(selected, false);
        }, 1500);
        break;
      case 'skip':
        onSubmit(selected, false);
        break;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-xl flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-sm space-y-6"
        >
          {/* Dismiss */}
          <div className="flex justify-end">
            <button onClick={onDismiss} className="p-2 text-muted-foreground hover:text-foreground rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!showLowPowerMenu ? (
            <>
              {/* Title */}
              <div className="text-center space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="text-5xl"
                >
                  {isTeen ? '⚡' : '💛'}
                </motion.div>
                <h2 className="text-xl font-bold text-foreground">
                  {isTeen
                    ? (isHe ? 'מה רמת האנרגיה?' : 'Current Energy Level')
                    : (isHe ? 'איך הלב שלי היום?' : 'How is my heart today?')
                  }
                </h2>
                {childName && (
                  <p className="text-sm text-muted-foreground">
                    {isHe ? `בוקר טוב, ${childName}!` : `Good morning, ${childName}!`}
                  </p>
                )}
              </div>

              {/* Selection */}
              {isTeen ? (
                /* Teen: Energy bars */
                <div className="space-y-2">
                  {TEEN_BARS.map((bar) => (
                    <motion.button
                      key={bar.level}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelect(bar.level)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all",
                        selected === bar.level
                          ? "border-primary bg-primary/10 scale-[1.02]"
                          : "border-border bg-card hover:border-primary/30"
                      )}
                    >
                      {/* Energy bar visual */}
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-3 h-8 rounded-sm transition-all",
                              i <= bar.level ? bar.color : "bg-secondary"
                            )}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-sm text-foreground">
                        {isHe ? bar.labelHe : bar.labelEn}
                      </span>
                    </motion.button>
                  ))}
                </div>
              ) : (
                /* Kids: Emoji faces */
                <div className="flex justify-center gap-3">
                  {KID_EMOJIS.map((emoji) => (
                    <motion.button
                      key={emoji.level}
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => handleSelect(emoji.level)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all",
                        selected === emoji.level
                          ? "border-primary bg-primary/10 scale-110"
                          : `${emoji.color} hover:scale-105`
                      )}
                    >
                      <span className="text-4xl">{emoji.emoji}</span>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {isHe ? emoji.labelHe : emoji.labelEn}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Low Power Menu */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-center space-y-2">
                <span className="text-4xl">
                  {selected === 1 ? '💙' : '🧡'}
                </span>
                <h3 className="text-lg font-bold text-foreground">
                  {isHe ? 'הכל בסדר. יש אפשרויות:' : "That's okay. You have options:"}
                </h3>
              </div>

              <div className="space-y-3">
                {/* Low Power Mode */}
                <Button
                  onClick={() => handleLowPowerChoice('lowPower')}
                  variant="outline"
                  className="w-full h-auto py-3 flex items-start gap-3 text-start rounded-2xl border-primary/30 hover:bg-primary/5"
                >
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">
                      {isHe ? '🛡️ מצב חיסכון' : '🛡️ Low Power Mode'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isHe ? 'רק משימות חובה היום' : 'Only must-do missions today'}
                    </p>
                  </div>
                </Button>

                {/* Instant Buff */}
                <Button
                  onClick={() => handleLowPowerChoice('instantBuff')}
                  variant="outline"
                  className="w-full h-auto py-3 flex items-start gap-3 text-start rounded-2xl border-accent/30 hover:bg-accent/5"
                >
                  <Gift className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">
                      {isHe ? '🎁 באף מיידי' : '🎁 Instant Buff'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isHe ? 'להשתמש בפרס קטן עכשיו' : 'Use a small reward right now'}
                    </p>
                  </div>
                </Button>

                {/* Parent SOS */}
                <Button
                  onClick={() => handleLowPowerChoice('sos')}
                  variant="outline"
                  disabled={sosSent}
                  className="w-full h-auto py-3 flex items-start gap-3 text-start rounded-2xl border-destructive/30 hover:bg-destructive/5"
                >
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">
                      {sosSent
                        ? (isHe ? '✓ נשלח להורה' : '✓ Sent to parent')
                        : (isHe ? '🆘 SOS להורה' : '🆘 Parent SOS')
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isHe ? 'שליחת התראה להורה' : 'Send a notification to parent'}
                    </p>
                  </div>
                </Button>

                {/* Skip */}
                <Button
                  onClick={() => handleLowPowerChoice('skip')}
                  variant="ghost"
                  className="w-full text-muted-foreground"
                >
                  {isHe ? 'לא צריך, אני בסדר' : "I'm fine, skip"}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
