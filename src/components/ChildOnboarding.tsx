import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/hooks/useSubscription';
import { ChildPreferences, ChildTheme, AgeMode } from '@/hooks/useChildPreferences';
import { Sparkles, Zap, Leaf, Gamepad2, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface ChildOnboardingProps {
  childName?: string;
  onComplete: (prefs: ChildPreferences) => void;
}

type Step = 'age' | 'mode' | 'theme' | 'ready';

export function ChildOnboarding({ childName, onComplete }: ChildOnboardingProps) {
  const { t, language } = useLanguage();
  const { isProUser } = useSubscription();
  const [step, setStep] = useState<Step>('age');
  const [age, setAge] = useState<number | null>(null);
  const [ageMode, setAgeMode] = useState<AgeMode>('kid');
  const [theme, setTheme] = useState<ChildTheme>('mint');
  const [petEnabled, setPetEnabled] = useState(true);

  const isRTL = language === 'he';
  const name = childName || (isRTL ? 'חבר/ה' : 'friend');

  const handleAgeSubmit = useCallback(() => {
    if (age === null) return;
    if (age >= 12) {
      // Teens default to teen mode, skip mode selection
      setAgeMode('teen');
      setPetEnabled(false);
      setStep('theme');
    } else {
      // Kids get to choose mode
      if (isProUser) {
        setStep('mode');
      } else {
        setAgeMode('kid');
        setPetEnabled(false);
        setStep('theme');
      }
    }
  }, [age, isProUser]);

  const handleModeSelect = useCallback((mode: 'egg' | 'pro') => {
    if (mode === 'egg') {
      setAgeMode('kid');
      setPetEnabled(true);
    } else {
      setAgeMode('teen');
      setPetEnabled(false);
    }
    setStep('theme');
  }, []);

  const handleThemeSelect = useCallback((t: ChildTheme) => {
    setTheme(t);
    setStep('ready');
  }, []);

  const handleFinish = useCallback(() => {
    onComplete({
      theme,
      pet_enabled: petEnabled,
      age_mode: ageMode,
      child_onboarding_completed: true,
    });
  }, [theme, petEnabled, ageMode, onComplete]);

  const slideVariant = {
    enter: { opacity: 0, x: isRTL ? -40 : 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isRTL ? 40 : -40 },
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {(['age', 'mode', 'theme', 'ready'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                step === s ? 'bg-primary scale-125' : i < ['age', 'mode', 'theme', 'ready'].indexOf(step) ? 'bg-primary/50' : 'bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Age */}
          {step === 'age' && (
            <motion.div
              key="age"
              variants={slideVariant}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center space-y-6"
            >
              <div className="text-6xl mb-2">👋</div>
              <h1 className="text-2xl font-bold text-foreground">
                {isRTL ? `היי ${name}!` : `Hey ${name}!`}
              </h1>
              <p className="text-muted-foreground">
                {isRTL ? 'כמה אתה בן/בת?' : 'How old are you?'}
              </p>

              {/* Age picker - grid of common ages */}
              <div className="grid grid-cols-4 gap-2">
                {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((a) => (
                  <button
                    key={a}
                    onClick={() => setAge(a)}
                    className={`py-3 rounded-xl text-lg font-bold transition-all ${
                      age === a
                        ? 'bg-primary text-primary-foreground scale-105 shadow-lg'
                        : 'bg-card border border-border text-foreground hover:border-primary/50'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleAgeSubmit}
                disabled={age === null}
                className="w-full h-12 text-lg font-bold rounded-2xl"
              >
                {isRTL ? 'קדימה!' : "Let's go!"} <ChevronRight className="w-5 h-5 ms-1" />
              </Button>
            </motion.div>
          )}

          {/* STEP 2: Mode (egg vs pro) — only for kids under 12 with Pro */}
          {step === 'mode' && (
            <motion.div
              key="mode"
              variants={slideVariant}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center space-y-6"
            >
              <h1 className="text-2xl font-bold text-foreground">
                {isRTL ? 'איך תרצה לשחק?' : 'How do you want to play?'}
              </h1>

              <div className="space-y-3">
                {/* Hatching Mode */}
                <button
                  onClick={() => handleModeSelect('egg')}
                  className="w-full p-5 rounded-2xl bg-card border-2 border-border hover:border-primary text-start transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">🥚</span>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">
                        {isRTL ? 'מצב בקיעה' : 'Hatching Mode'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isRTL
                          ? 'גדל את השותף שלך ממש מהביצה!'
                          : 'Grow your partner from an egg!'}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Pro Mode */}
                <button
                  onClick={() => handleModeSelect('pro')}
                  className="w-full p-5 rounded-2xl bg-card border-2 border-border hover:border-primary text-start transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">⚡</span>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">
                        {isRTL ? 'מצב פרו' : 'Pro Mode'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isRTL
                          ? 'ללא ביצה, רק משימות ורמות'
                          : 'No egg, just missions and levels'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Theme */}
          {step === 'theme' && (
            <motion.div
              key="theme"
              variants={slideVariant}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center space-y-6"
            >
              <h1 className="text-2xl font-bold text-foreground">
                {isRTL ? 'בחר את הסגנון שלך' : 'Pick your style'}
              </h1>

              <div className="space-y-3">
                {/* Mint / Nature */}
                <button
                  onClick={() => handleThemeSelect('mint')}
                  className={`w-full p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                    theme === 'mint' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-success/30 to-success/10 flex items-center justify-center">
                      <Leaf className="w-7 h-7 text-success-foreground" />
                    </div>
                    <div className="text-start">
                      <h3 className="font-bold text-lg text-foreground">
                        {isRTL ? 'טבעי' : 'Natural'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'רגוע, ירוק ונעים' : 'Calm, green and cozy'}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Gamer */}
                <button
                  onClick={() => handleThemeSelect('gamer')}
                  className={`w-full p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                    theme === 'gamer' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/40 to-accent/20 flex items-center justify-center">
                      <Gamepad2 className="w-7 h-7 text-accent-foreground" />
                    </div>
                    <div className="text-start">
                      <h3 className="font-bold text-lg text-foreground">
                        {isRTL ? 'גיימר' : 'Gamer'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'כהה, ניאון ואנרגטי' : 'Dark, neon and energetic'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Ready */}
          {step === 'ready' && (
            <motion.div
              key="ready"
              variants={slideVariant}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-7xl"
              >
                {petEnabled ? '🥚' : '⚡'}
              </motion.div>

              <h1 className="text-2xl font-bold text-foreground">
                {isRTL ? 'הכל מוכן!' : 'All set!'}
              </h1>
              <p className="text-muted-foreground">
                {isRTL
                  ? ageMode === 'kid'
                    ? 'המשימות שלך מחכות. כל אחת מקרבת אותך להצלחה!'
                    : 'המטרות שלך מחכות. בואו נתחיל!'
                  : ageMode === 'kid'
                    ? 'Your missions are waiting. Each one brings you closer!'
                    : 'Your objectives are ready. Let\'s go!'}
              </p>

              <Button
                onClick={handleFinish}
                className="w-full h-14 text-lg font-bold rounded-2xl"
              >
                <Sparkles className="w-5 h-5 me-2" />
                {isRTL ? 'יאללה!' : 'Let\'s Go!'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
