import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ArrowRight, Brain, Sparkles, Backpack, Headphones, GraduationCap,
  Sunrise, BookOpen, Bus, Rocket, Check, Gamepad2, Zap, Palette, Heart, Star,
  Users, User, Loader2, Globe, Lock, Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import buffLogoNoBg from '@/assets/buff-logo-no-bg.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  type OnboardingLang, getT, setOnboardingLang, getOnboardingLang,
  getStruggleLabels, getMotivationLabels,
} from './translations';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnOnboardingData {
  role: 'parent' | 'teen' | '';
  childName: string;
  ageGroup: '6-9' | '10-14' | '15-18' | '';
  struggles: string[];
  motivations: string[];
}

// Steps: 0=Hook+Role, 1=Identity, 2=Struggles, 'analysis'=interstitial, 3=Motivators, 'auth'=signup, 4=Reveal
type EnStep = 0 | 1 | 2 | 'analysis' | 3 | 'auth' | 4;

const STEP_ORDER: EnStep[] = [0, 1, 2, 'analysis', 3, 'auth', 4];
const STORAGE_KEY = 'buff_en_onboarding_v5';
const AUTH_RETURN_KEY = 'buff_onboarding_auth_return';

// ─── Storage helpers ──────────────────────────────────────────────────────────

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_RETURN_KEY);
  } catch { /* ignore */ }
}

function saveSession(data: EnOnboardingData, step: EnStep, lang: OnboardingLang) {
  if (step === 0 || step === 'analysis') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step, lang, savedAt: Date.now() }));
  } catch { /* ignore */ }
}

function loadSession(): { data: EnOnboardingData; step: EnStep; lang?: OnboardingLang } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: EnOnboardingData; step: EnStep; lang?: OnboardingLang };
    const idx = STEP_ORDER.indexOf(parsed.step);
    if (idx > 0 && idx < STEP_ORDER.length - 1 && parsed.step !== 'analysis') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function hasSession(): boolean {
  return loadSession() !== null;
}

/** Mark that we're returning from OAuth */
function markAuthReturn() {
  try { localStorage.setItem(AUTH_RETURN_KEY, 'true'); } catch { /* ignore */ }
}

function isAuthReturn(): boolean {
  try { return localStorage.getItem(AUTH_RETURN_KEY) === 'true'; } catch { return false; }
}

function clearAuthReturn() {
  try { localStorage.removeItem(AUTH_RETURN_KEY); } catch { /* ignore */ }
}

// ─── Initial state ────────────────────────────────────────────────────────────

function emptyData(): EnOnboardingData {
  return { role: '', childName: '', ageGroup: '', struggles: [], motivations: [] };
}

// ─── Static option data ───────────────────────────────────────────────────────

const STRUGGLE_ICONS: Record<string, React.ElementType> = {
  morning: Sunrise, homework: BookOpen, transitions: Bus, initiation: Rocket,
};

const MOTIVATION_ICONS: Record<string, React.ElementType> = {
  gaming: Gamepad2, movement: Zap, creative: Palette, connection: Heart,
};

const AGE_GROUPS = ['6-9', '10-14', '15-18'] as const;

const AGE_ICONS: Record<string, React.ElementType> = {
  '6-9': Backpack, '10-14': GraduationCap, '15-18': Headphones,
};

// ─── Animation config ─────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
};

const slideTrans = { duration: 0.3, ease: 'easeOut' as const };

// ─── Confetti helper ──────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  'hsl(var(--primary))', '#F59E0B', '#10B981', '#EF4444',
  '#3B82F6', '#EC4899', '#8B5CF6',
];

function ConfettiBurst() {
  const pieces = Array.from({ length: 22 }, (_, i) => i);
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map(i => {
        const x = Math.random() * 100;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const delay = Math.random() * 0.5;
        const size = 6 + Math.random() * 8;
        return (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: '-10px',
              width: size,
              height: size,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              background: color,
            }}
            animate={{ y: ['0vh', '110vh'], rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)], opacity: [1, 0.8, 0] }}
            transition={{ duration: 1.4 + Math.random() * 0.8, delay, ease: 'easeIn' }}
          />
        );
      })}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EnOnboardingFlowProps {
  onComplete: (data: EnOnboardingData) => Promise<void>;
  /** If true, skip the auth step (user already authenticated) */
  skipAuth?: boolean;
  /** Initial language override */
  initialLang?: OnboardingLang;
}

// ─── Root component ───────────────────────────────────────────────────────────

export function EnOnboardingFlow({ onComplete, skipAuth, initialLang }: EnOnboardingFlowProps) {
  // Language state
  const [lang, setLang] = useState<OnboardingLang>(() => {
    const saved = loadSession();
    if (saved?.lang) return saved.lang;
    if (initialLang) return initialLang;
    const stored = localStorage.getItem('buff-language');
    return stored === 'he' ? 'he' : 'en';
  });

  // Sync language to module-level state
  useEffect(() => {
    setOnboardingLang(lang);
    localStorage.setItem('buff-language', lang);
  }, [lang]);

  // Check for OAuth return — if user just came back from Google, jump to reveal
  const authReturnDetected = useRef(isAuthReturn());

  // Check for a resumable session once (before first render)
  const resumableSession = useRef(loadSession());
  const [hasResumable] = useState(() => hasSession());

  // Initialise from saved session (or fresh)
  const [formData, setFormData] = useState<EnOnboardingData>(() =>
    resumableSession.current ? resumableSession.current.data : emptyData()
  );
  const [step, setStep] = useState<EnStep>(() => {
    // If returning from OAuth, jump straight to reveal
    if (authReturnDetected.current) return 4;
    if (resumableSession.current) return resumableSession.current.step;
    return 0;
  });
  const [dir, setDir] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isRestoredSession = useRef(resumableSession.current !== null || authReturnDetected.current);

  // Check auth status on mount + listen for changes
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);

      // If user just signed in (email signup or login) — advance to reveal
      if ((event === 'SIGNED_IN') && session?.user) {
        // Small delay to let state settle
        setTimeout(() => {
          setDir(1);
          isRestoredSession.current = false;
          setStep(4);
        }, 300);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle OAuth return: clear flag and sync data
  useEffect(() => {
    if (authReturnDetected.current) {
      clearAuthReturn();
      authReturnDetected.current = false;
    }
  }, []);

  // Auto-save
  useEffect(() => {
    saveSession(formData, step, lang);
  }, [formData, step, lang]);

  // ── Field helpers ───────────────────────────────────────────────────────────

  const updateField = useCallback(<K extends keyof EnOnboardingData>(
    key: K, value: EnOnboardingData[K],
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleArray = useCallback((key: 'struggles' | 'motivations', val: string) => {
    setFormData(prev => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val],
      };
    });
  }, []);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goTo = useCallback((target: EnStep, direction = 1) => {
    setDir(direction);
    setStep(target);
    isRestoredSession.current = false;
  }, []);

  const goNext = useCallback((override?: EnStep) => {
    if (override !== undefined && (typeof override !== 'number' && override !== 'analysis' && override !== 'auth')) {
      setDir(1);
      setStep(s => {
        isRestoredSession.current = false;
        let nextStep = STEP_ORDER[Math.min(STEP_ORDER.indexOf(s) + 1, STEP_ORDER.length - 1)];
        // Skip auth step if already authenticated or skipAuth
        if (nextStep === 'auth' && (isAuthenticated || skipAuth)) {
          nextStep = 4;
        }
        return nextStep;
      });
      return;
    }
    if (override !== undefined) { goTo(override, 1); return; }
    setDir(1);
    setStep(s => {
      isRestoredSession.current = false;
      let nextStep = STEP_ORDER[Math.min(STEP_ORDER.indexOf(s) + 1, STEP_ORDER.length - 1)];
      if (nextStep === 'auth' && (isAuthenticated || skipAuth)) {
        nextStep = 4;
      }
      return nextStep;
    });
  }, [goTo, isAuthenticated, skipAuth]);

  const goBack = useCallback(() => {
    setDir(-1);
    isRestoredSession.current = false;
    setStep(s => {
      const idx = STEP_ORDER.indexOf(s);
      let prev = STEP_ORDER[Math.max(idx - 1, 0)];
      if (prev === 'analysis') prev = 2;
      if (prev === 'auth' && (isAuthenticated || skipAuth)) prev = 3;
      return prev;
    });
  }, [isAuthenticated, skipAuth]);

  const startFresh = useCallback(() => {
    clearSession();
    resumableSession.current = null;
    isRestoredSession.current = false;
    setFormData(emptyData());
    setDir(1);
    setStep(0);
  }, []);

  const handleResume = useCallback(() => {
    const saved = loadSession();
    if (saved) {
      setFormData(saved.data);
      if (saved.lang) {
        setLang(saved.lang);
        setOnboardingLang(saved.lang);
      }
      isRestoredSession.current = false;
      goTo(saved.step, 1);
    }
  }, [goTo]);

  // ── Validation ──────────────────────────────────────────────────────────────

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 0: return formData.role === 'parent';
      case 1: return formData.childName.trim().length >= 2 && formData.ageGroup !== '';
      case 2: return formData.struggles.length >= 1;
      case 3: return formData.motivations.length >= 1;
      case 'auth': return isAuthenticated;
      case 4: return true;
      default: return false;
    }
  }, [step, formData, isAuthenticated]);

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleLaunch = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onComplete(formData);
      clearSession();
    } finally {
      setIsSubmitting(false);
    }
  }, [onComplete, formData]);

  // ── Progress bar ────────────────────────────────────────────────────────────

  const progressMap: Record<string, number> = {
    '0': 0, '1': 20, '2': 40, 'analysis': 40, '3': 60, 'auth': 80, '4': 100,
  };
  const progress = progressMap[String(step)] ?? 0;
  const snapProgress = isRestoredSession.current;
  const showBack = STEP_ORDER.indexOf(step) > 0 && step !== 'analysis' && step !== 4;

  const t = getT();
  const isRTL = lang === 'he';

  // ── Step content renderer ───────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <StepHook
            formData={formData}
            updateField={updateField}
            onNext={goNext}
            hasResumable={hasResumable}
            onResume={handleResume}
            onStartFresh={startFresh}
            canProceed={canProceed()}
            lang={lang}
            onLangChange={setLang}
          />
        );
      case 1:
        return (
          <StepIdentity
            formData={formData}
            updateField={updateField}
            canProceed={canProceed()}
            onNext={goNext}
            lang={lang}
          />
        );
      case 2:
        return (
          <StepFriction
            formData={formData}
            toggle={toggleArray}
            canProceed={canProceed()}
            onNext={() => goNext('analysis')}
            lang={lang}
          />
        );
      case 'analysis':
        return (
          <StepAnalysis
            childName={formData.childName.trim() || (lang === 'he' ? 'ילדך' : 'your child')}
            onDone={() => goNext(3)}
            lang={lang}
          />
        );
      case 3:
        return (
          <StepMotivators
            formData={formData}
            toggle={toggleArray}
            canProceed={canProceed()}
            onNext={() => {
              if (isAuthenticated || skipAuth) {
                goNext(4);
              } else {
                goNext('auth');
              }
            }}
            lang={lang}
          />
        );
      case 'auth':
        return (
          <StepAuth
            childName={formData.childName.trim() || (lang === 'he' ? 'ילדך' : 'your child')}
            lang={lang}
          />
        );
      case 4:
        return (
          <StepReveal
            formData={formData}
            onLaunch={handleLaunch}
            isSubmitting={isSubmitting}
            lang={lang}
          />
        );
      default:
        return null;
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-center px-5 pt-5 pb-2 shrink-0 relative">
        {showBack && (
          <button
            onClick={goBack}
            className={`absolute ${isRTL ? 'right-5' : 'left-5'} flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors`}
          >
            <ChevronLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t.back}
          </button>
        )}
        <img src={buffLogoNoBg} alt="BUFF" className="h-9" />
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-2 pb-4 shrink-0">
        <div className="h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={snapProgress ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={String(step)}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTrans}
            className="absolute inset-0 overflow-y-auto px-5 pb-32"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════


// ─── Step 0: The Hook + Role Segmentation ─────────────────────────────────────

interface StepHookProps {
  formData: EnOnboardingData;
  updateField: <K extends keyof EnOnboardingData>(key: K, value: EnOnboardingData[K]) => void;
  onNext: () => void;
  hasResumable: boolean;
  onResume: () => void;
  onStartFresh: () => void;
  canProceed: boolean;
  lang: OnboardingLang;
  onLangChange: (lang: OnboardingLang) => void;
}

function StepHook({ formData, updateField, onNext, hasResumable, onResume, onStartFresh, canProceed, lang, onLangChange }: StepHookProps) {
  const t = getT();

  return (
    <div className="flex flex-col items-center gap-5 pt-4 max-w-xs mx-auto text-center">

      {/* Language toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="self-end"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const next = lang === 'en' ? 'he' : 'en';
            onLangChange(next);
            setOnboardingLang(next);
          }}
          className="rounded-2xl gap-1.5 h-8 px-3 text-xs"
        >
          <Globe className="w-3.5 h-3.5" />
          {t.hook.langToggle}
        </Button>
      </motion.div>

      {/* Brain illustration */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 240, damping: 22 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/15"
      >
        <span className="text-4xl select-none">🧠✨</span>
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.13 }}
        className="space-y-2"
      >
        <h1 className="text-2xl font-bold text-foreground leading-snug whitespace-pre-line">
          {t.hook.headline}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t.hook.subHeadline}
        </p>
      </motion.div>

      {/* Trust badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.22 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/25 bg-primary/5"
      >
        <span className="text-xs text-primary font-semibold">{t.hook.trustBadge}</span>
      </motion.div>

      {/* Role segmentation */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full space-y-3"
      >
        <p className="text-sm font-semibold text-foreground">{t.hook.roleQuestion}</p>

        <div className="grid grid-cols-2 gap-3 w-full">
          {/* Parent option */}
          <button
            onClick={() => updateField('role', 'parent')}
            className={`flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl border-2 transition-all duration-200 ${
              formData.role === 'parent'
                ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                : 'border-border hover:border-primary/40 bg-background'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              formData.role === 'parent' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <div className="text-center">
              <p className={`text-sm font-bold leading-none ${formData.role === 'parent' ? 'text-primary' : 'text-foreground'}`}>
                {t.hook.roleParentLabel}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{t.hook.roleParentSub}</p>
            </div>
            {formData.role === 'parent' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
              </motion.div>
            )}
          </button>

          {/* Teen option */}
          <button
            onClick={() => updateField('role', 'teen')}
            className={`flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl border-2 transition-all duration-200 ${
              formData.role === 'teen'
                ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                : 'border-border hover:border-primary/40 bg-background'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              formData.role === 'teen' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div className="text-center">
              <p className={`text-sm font-bold leading-none ${formData.role === 'teen' ? 'text-primary' : 'text-foreground'}`}>
                {t.hook.roleTeenLabel}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{t.hook.roleTeenSub}</p>
            </div>
            {formData.role === 'teen' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
              </motion.div>
            )}
          </button>
        </div>

        {/* Teen redirect message */}
        <AnimatePresence>
          {formData.role === 'teen' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="w-full rounded-2xl border border-border bg-muted/40 px-4 py-3 text-start"
            >
              <p className="text-sm font-semibold text-foreground">{t.hook.teenTitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.hook.teenMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Resume banner */}
      <AnimatePresence>
        {hasResumable && formData.role !== 'teen' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: 0.35, duration: 0.25 }}
            className="w-full rounded-2xl border border-primary/30 bg-primary/8 px-4 py-3 flex flex-col gap-2 text-start"
          >
            <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 shrink-0" />
              {t.hook.resumeBanner}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onResume}
                className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                {t.hook.resumeBtn}
              </button>
              <button
                onClick={onStartFresh}
                className="h-9 px-3 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                {t.hook.startFreshBtn}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full space-y-2"
      >
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
          className={`w-full h-14 rounded-2xl text-base font-semibold gap-2 transition-all duration-300 ${
            canProceed
              ? 'shadow-[0_6px_24px_-4px_hsl(var(--primary)/0.45),0_2px_8px_-2px_hsl(var(--primary)/0.25)] opacity-100'
              : 'opacity-35 shadow-none'
          }`}
        >
          {t.hook.cta}
          <ArrowRight className={`w-4 h-4 ${lang === 'he' ? 'rotate-180' : ''}`} />
        </Button>
        <p className="text-xs text-muted-foreground">{t.hook.footer}</p>
      </motion.div>

      {/* Founder caption */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="text-[10px] text-muted-foreground/50 tracking-wide pb-4"
      >
        {t.hook.founder}
      </motion.p>
    </div>
  );
}

// ─── Step 1: Identity ─────────────────────────────────────────────────────────

interface StepIdentityProps {
  formData: EnOnboardingData;
  updateField: <K extends keyof EnOnboardingData>(key: K, value: EnOnboardingData[K]) => void;
  canProceed: boolean;
  onNext: () => void;
  lang: OnboardingLang;
}

function StepIdentity({ formData, updateField, canProceed, onNext, lang }: StepIdentityProps) {
  const t = getT();
  const trimmedName = formData.childName.trim();
  const ageMeta = formData.ageGroup ? t.identity.ageMeta[formData.ageGroup] : null;

  return (
    <div className="flex flex-col gap-8 pt-6 max-w-sm mx-auto pb-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="space-y-1.5"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.identity.stepLabel}</p>
        <h2 className="text-2xl font-bold text-foreground leading-tight">{t.identity.headline}</h2>
        <p className="text-sm text-muted-foreground">{t.identity.subHeadline}</p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="space-y-2"
      >
        <label htmlFor="child-name" className="text-sm font-semibold text-foreground">
          {t.identity.nameLabel}
        </label>
        <Input
          id="child-name"
          value={formData.childName}
          onChange={e => updateField('childName', e.target.value)}
          placeholder={t.identity.namePlaceholder}
          className="h-12 text-base rounded-xl border-2 focus-visible:ring-primary focus-visible:border-primary"
          autoFocus
          maxLength={40}
          dir={lang === 'he' ? 'rtl' : 'ltr'}
          onKeyDown={e => { if (e.key === 'Enter' && canProceed) onNext(); }}
        />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.26 }}
        className="space-y-3"
      >
        <label className="text-sm font-semibold text-foreground">
          {trimmedName ? t.identity.ageLabelDynamic(trimmedName) : t.identity.ageLabel}
        </label>

        <div className="grid grid-cols-3 gap-3">
          {AGE_GROUPS.map(ag => {
            const Icon = AGE_ICONS[ag];
            const selected = formData.ageGroup === ag;
            return (
              <button
                key={ag}
                onClick={() => updateField('ageGroup', ag)}
                className={`flex flex-col items-center gap-1.5 py-5 px-2 rounded-2xl border-2 text-sm font-semibold transition-all duration-200 ${
                  selected
                    ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'border-border hover:border-primary/40 text-foreground bg-background'
                }`}
              >
                <Icon className={`w-5 h-5 ${selected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span>{ag}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {ageMeta && (
            <motion.p
              key={formData.ageGroup}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-xs text-primary font-medium bg-primary/8 rounded-xl px-3 py-2.5"
            >
              {ageMeta.hint}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.34 }}
      >
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
          className={`w-full h-14 rounded-2xl text-base font-semibold gap-2 transition-all duration-300 ${
            canProceed
              ? 'shadow-[0_6px_24px_-4px_hsl(var(--primary)/0.45),0_2px_8px_-2px_hsl(var(--primary)/0.25)] opacity-100'
              : 'opacity-35 shadow-none'
          }`}
        >
          {t.identity.cta}
          <ArrowRight className={`w-4 h-4 ${lang === 'he' ? 'rotate-180' : ''}`} />
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Step 2: Struggles (Friction) ─────────────────────────────────────────────

interface StepFrictionProps {
  formData: EnOnboardingData;
  toggle: (key: 'struggles' | 'motivations', val: string) => void;
  canProceed: boolean;
  onNext: () => void;
  lang: OnboardingLang;
}

function StepFriction({ formData, toggle, canProceed, onNext, lang }: StepFrictionProps) {
  const t = getT();
  const name = formData.childName.trim() || (lang === 'he' ? 'ילדך' : 'your child');

  return (
    <div className="flex flex-col gap-4 pt-3 max-w-sm mx-auto pb-4">
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">{t.struggles.stepLabel}</p>
        <h2 className="text-xl font-bold text-foreground leading-snug">
          {t.struggles.headline(name)}
        </h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.struggles.subHeadline}</p>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 self-start">
        <span className="text-[11px] text-primary font-semibold">{t.struggles.empathyBadge}</span>
      </div>

      <div className="space-y-2">
        {t.struggles.options.map(({ key, label, sub }) => {
          const Icon = STRUGGLE_ICONS[key];
          const selected = formData.struggles.includes(key);
          return (
            <motion.button
              key={key}
              onClick={() => toggle('struggles', key)}
              whileTap={{ scale: 0.985 }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-start transition-all duration-200 ${
                selected
                  ? 'border-primary bg-primary/8 shadow-sm shadow-primary/10'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-none ${selected ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>
              </div>
              <AnimatePresence>
                {selected && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <Button
        onClick={onNext}
        disabled={!canProceed}
        size="lg"
        className={`w-full h-12 rounded-2xl text-sm font-semibold gap-2 transition-all duration-300 ${
          canProceed ? 'shadow-md shadow-primary/25 opacity-100' : 'opacity-40 shadow-none'
        }`}
      >
        {t.struggles.cta}
        <ArrowRight className={`w-4 h-4 ${lang === 'he' ? 'rotate-180' : ''}`} />
      </Button>
    </div>
  );
}

// ─── Analysis interstitial ────────────────────────────────────────────────────

interface StepAnalysisProps {
  childName: string;
  onDone: () => void;
  lang: OnboardingLang;
}

function StepAnalysis({ childName, onDone, lang }: StepAnalysisProps) {
  const t = getT();
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [ringProgress, setRingProgress] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setPhraseIdx(prev => Math.min(prev + 1, t.analysis.phrases.length - 1));
    }, 1000);
    const doneTimer = setTimeout(() => {
      clearInterval(phraseTimer);
      onDoneRef.current();
    }, 3000);
    return () => { clearInterval(phraseTimer); clearTimeout(doneTimer); };
  }, []);

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const pct = Math.min(((ts - start) / 3000) * 100, 100);
      setRingProgress(pct);
      if (pct < 100) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const R = 44;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 max-w-xs mx-auto text-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-32 h-32"
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle
            cx="50" cy="50" r={R} fill="none"
            stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - ringProgress / 100)}
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="w-9 h-9 text-primary" />
          </div>
        </motion.div>
      </motion.div>

      <div className="space-y-3 min-h-[4rem] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phraseIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="text-base font-semibold text-foreground leading-snug"
          >
            {t.analysis.phrases[phraseIdx](childName)}
          </motion.p>
        </AnimatePresence>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary inline-block"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground px-6 leading-relaxed">{t.analysis.engineCaption}</p>
    </div>
  );
}

// ─── Step 3: Motivators ───────────────────────────────────────────────────────

interface StepMotivatorsProps {
  formData: EnOnboardingData;
  toggle: (key: 'struggles' | 'motivations', val: string) => void;
  canProceed: boolean;
  onNext: () => void;
  lang: OnboardingLang;
}

function StepMotivators({ formData, toggle, canProceed, onNext, lang }: StepMotivatorsProps) {
  const t = getT();
  const name = formData.childName.trim() || (lang === 'he' ? 'ילדך' : 'your child');

  return (
    <div className="flex flex-col gap-4 pt-3 max-w-sm mx-auto pb-4">
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">{t.motivators.stepLabel}</p>
        <h2 className="text-xl font-bold text-foreground leading-snug">
          {t.motivators.headline(name)}
        </h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.motivators.subHeadline}</p>
      </div>

      <div className="space-y-2">
        {t.motivators.options.map(({ key, label, sub }) => {
          const Icon = MOTIVATION_ICONS[key];
          const selected = formData.motivations.includes(key);
          return (
            <motion.button
              key={key}
              onClick={() => toggle('motivations', key)}
              whileTap={{ scale: 0.985 }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-start transition-all duration-200 ${
                selected
                  ? 'border-primary bg-primary/8 shadow-sm shadow-primary/10'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-none ${selected ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>
              </div>
              <AnimatePresence>
                {selected && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <Button
        onClick={onNext}
        disabled={!canProceed}
        size="lg"
        className={`w-full h-12 rounded-2xl text-sm font-semibold gap-2 transition-all duration-300 ${
          canProceed ? 'shadow-md shadow-primary/25 opacity-100' : 'opacity-40 shadow-none'
        }`}
      >
        {t.motivators.cta(name)}
        <ArrowRight className={`w-4 h-4 ${lang === 'he' ? 'rotate-180' : ''}`} />
      </Button>
    </div>
  );
}

// ─── Step Auth: Embedded Signup/Login ──────────────────────────────────────────

interface StepAuthProps {
  childName: string;
  lang: OnboardingLang;
}

function StepAuth({ childName, lang }: StepAuthProps) {
  const t = getT();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signup' && (!email || !password || !displayName)) {
      toast.error(t.auth.errorFillFields);
      return;
    }
    if (mode === 'login' && (!email || !password)) {
      toast.error(t.auth.errorFillFields);
      return;
    }
    if (password.length < 6) {
      toast.error(t.auth.errorPasswordMin);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/onboarding',
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        toast.success(t.auth.successCreated);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t.auth.successLogin);
      }
      // The onAuthStateChange listener in the parent will advance to step 4
    } catch (err: any) {
      toast.error(err.message || t.auth.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    // Save session and mark that we're going to OAuth
    markAuthReturn();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/onboarding',
      },
    });
    if (error) {
      clearAuthReturn();
      toast.error(error.message || t.auth.errorGeneric);
    }
  };

  const name = childName || (lang === 'he' ? 'ילדך' : 'your child');

  return (
    <div className="flex flex-col gap-5 pt-4 max-w-sm mx-auto pb-6">
      {/* Hero */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center space-y-2"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground leading-snug">
          {t.auth.headline(name)}
        </h2>
        <p className="text-sm text-muted-foreground">{t.auth.subHeadline}</p>
      </motion.div>

      {/* Google button */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-2xl h-12 text-sm font-semibold gap-2"
          onClick={handleGoogleAuth}
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t.auth.googleCta}
        </Button>
      </motion.div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground">{t.auth.divider}</span>
        </div>
      </div>

      {/* Email form */}
      <motion.form
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        onSubmit={handleEmailAuth}
        className="space-y-3"
      >
        {mode === 'signup' && (
          <div className="space-y-1">
            <Label htmlFor="auth-name" className="text-xs">{t.auth.nameLabel}</Label>
            <Input
              id="auth-name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={t.auth.namePlaceholder}
              disabled={loading}
              className="h-10 rounded-xl"
              dir={lang === 'he' ? 'rtl' : 'ltr'}
            />
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="auth-email" className="text-xs">{t.auth.emailLabel}</Label>
          <Input
            id="auth-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t.auth.emailPlaceholder}
            disabled={loading}
            className="h-10 rounded-xl"
            dir="ltr"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="auth-password" className="text-xs">{t.auth.passwordLabel}</Label>
          <Input
            id="auth-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t.auth.passwordPlaceholder}
            disabled={loading}
            className="h-10 rounded-xl"
            dir="ltr"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-2xl text-sm font-semibold gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.auth.ctaLoading}
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              {mode === 'signup' ? t.auth.cta : t.auth.ctaLogin}
            </>
          )}
        </Button>
      </motion.form>

      {/* Toggle login/signup */}
      <button
        onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
        className="text-xs text-primary font-medium hover:underline"
      >
        {mode === 'signup' ? t.auth.loginToggle : t.auth.signupToggle}
      </button>
    </div>
  );
}

// ─── Step 4: The Reveal ───────────────────────────────────────────────────────

interface StepRevealProps {
  formData: EnOnboardingData;
  onLaunch: () => void;
  isSubmitting: boolean;
  lang: OnboardingLang;
}

function StepReveal({ formData, onLaunch, isSubmitting, lang }: StepRevealProps) {
  const t = getT();
  const [phase, setPhase] = useState<'loading' | 'reveal'>('loading');
  const [loadingPct, setLoadingPct] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const struggleLabels = getStruggleLabels(lang);
  const motivationLabels = getMotivationLabels(lang);

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const DURATION = 3000;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const pct = Math.min(((ts - start) / DURATION) * 100, 100);
      setLoadingPct(pct);
      if (pct < 100) {
        frame = requestAnimationFrame(tick);
      } else {
        setPhase('reveal');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2400);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const name = formData.childName.trim() || (lang === 'he' ? 'ילדך' : 'Your child');
  const struggles = formData.struggles.map(s => struggleLabels[s] || s);
  const motivations = formData.motivations.map(m => motivationLabels[m] || m);
  const forecast = t.reveal.forecast[formData.ageGroup || '6-9'] ?? t.reveal.forecast['6-9'];

  const loadingPhrase =
    loadingPct < 40 ? t.reveal.loadingPhrases[0](name)
    : loadingPct < 75 ? t.reveal.loadingPhrases[1](name)
    : t.reveal.loadingPhrases[2](name);

  return (
    <>
      {showConfetti && <ConfettiBurst />}

      <div className="flex flex-col gap-5 pt-4 max-w-sm mx-auto pb-6">
        <AnimatePresence mode="wait">
          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center gap-6 min-h-[70vh] text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <Sparkles className="w-9 h-9 text-primary" />
              </motion.div>

              <div className="space-y-2 w-full max-w-[260px]">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingPhrase}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-semibold text-foreground"
                  >
                    {loadingPhrase}
                  </motion.p>
                </AnimatePresence>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${loadingPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t.reveal.loadingCaption}</p>
              </div>
            </motion.div>
          )}

          {phase === 'reveal' && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-4"
            >
              <div className="space-y-1 text-center">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                  className="text-4xl mb-2 select-none"
                >
                  🎁
                </motion.div>
                <h2 className="text-xl font-bold text-foreground leading-snug">
                  {t.reveal.headline(name)}
                </h2>
                <p className="text-xs text-muted-foreground">{t.reveal.sub(name)}</p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/5 to-primary/10 p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">{t.reveal.planOverview}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{t.reveal.focusLabel}</p>
                    {struggles.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {struggles.map(s => (
                          <span key={s} className="text-[11px] font-semibold text-foreground bg-background/70 rounded-lg px-2 py-1 border border-border/50 leading-tight">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-xs text-muted-foreground">{t.reveal.allAreas}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{t.reveal.fuelLabel}</p>
                    {motivations.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {motivations.map(m => (
                          <span key={m} className="text-[11px] font-semibold text-foreground bg-background/70 rounded-lg px-2 py-1 border border-border/50 leading-tight">
                            {m}
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-xs text-muted-foreground">{t.reveal.allTypes}</span>}
                  </div>
                </div>

                <div className="border-t border-primary/15" />

                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">📈</span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    <span className="font-semibold text-foreground">{t.reveal.successForecast}</span>
                    {forecast}
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="flex justify-center"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                  <Brain className="w-3 h-3" />
                  {t.reveal.methodPill}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="space-y-2"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 0 0 hsl(var(--primary) / 0.35)',
                      '0 0 0 12px hsl(var(--primary) / 0)',
                      '0 0 0 0 hsl(var(--primary) / 0)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 0.6 }}
                  className="rounded-2xl"
                >
                  <Button
                    onClick={onLaunch}
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full h-14 rounded-2xl text-base font-bold gap-2 shadow-lg shadow-primary/30"
                  >
                    {isSubmitting ? t.reveal.ctaLoading : (
                      <>
                        {t.reveal.cta(name)}
                        <ArrowRight className={`w-5 h-5 ${lang === 'he' ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </Button>
                </motion.div>
                <p className="text-xs text-muted-foreground text-center">{t.reveal.trialDisclaimer}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
