import React, { useState, useCallback, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ArrowRight, Brain, Sparkles, Backpack, Headphones, GraduationCap,
  Sunrise, BookOpen, Bus, Rocket, Check, Gamepad2, Zap, Palette, Heart, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import buffLogoNoBg from '@/assets/buff-logo-no-bg.png';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnOnboardingData {
  childName: string;
  ageGroup: '6-9' | '10-14' | '15-18' | '';
  struggles: string[];
  motivations: string[];
}

type EnStep = 0 | 1 | 2 | 'analysis' | 3 | 4;

const STEP_ORDER: EnStep[] = [0, 1, 2, 'analysis', 3, 4];
const TOTAL_STEPS = 5; // Hook=0%, Identity=25%, Struggles=50%, Motivators=75%, Reveal=100%
const STORAGE_KEY = 'buff_en_onboarding_v3';

// ─── Storage helpers ──────────────────────────────────────────────────────────

function clearSession() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

function saveSession(data: EnOnboardingData, step: EnStep) {
  if (step === 'analysis') return; // transient — never persist
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step })); } catch {}
}

function loadSession(): { data: EnOnboardingData; step: EnStep } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: EnOnboardingData; step: EnStep };
    const idx = STEP_ORDER.indexOf(parsed.step);
    // Only restore if genuinely mid-flow (steps 1–3, not analysis)
    if (idx > 0 && idx < STEP_ORDER.length - 1 && parsed.step !== 'analysis') {
      return parsed;
    }
    clearSession();
    return null;
  } catch {
    clearSession();
    return null;
  }
}

// ─── Initial state ────────────────────────────────────────────────────────────

function emptyData(): EnOnboardingData {
  return { childName: '', ageGroup: '', struggles: [], motivations: [] };
}

// ─── Static option data ───────────────────────────────────────────────────────

const STRUGGLE_OPTIONS = [
  { key: 'morning',     Icon: Sunrise,   label: 'Morning Routine',     sub: 'The race against the clock' },
  { key: 'homework',    Icon: BookOpen,  label: 'Homework & Focus',    sub: 'Taming the study monster' },
  { key: 'transitions', Icon: Bus,       label: 'Transitions & School', sub: "The 'shifting gears' struggle" },
  { key: 'initiation',  Icon: Rocket,    label: 'Getting Started',     sub: "Breaking through the 'I can't' wall" },
] as const;

const MOTIVATION_OPTIONS = [
  { key: 'gaming',      Icon: Gamepad2, label: 'Screen & Gaming',   sub: 'Gaming, apps, or favourite shows' },
  { key: 'movement',    Icon: Zap,      label: 'Movement & Play',   sub: 'Outdoor play, sports, or high-energy fun' },
  { key: 'creative',    Icon: Palette,  label: 'Creative Projects', sub: 'Building, drawing, or digital creation' },
  { key: 'connection',  Icon: Heart,    label: 'Connection Time',   sub: 'One-on-one time or shared activities' },
] as const;

const AGE_GROUPS = ['6-9', '10-14', '15-18'] as const;

const AGE_META: Record<string, { Icon: React.ElementType; hint: string }> = {
  '6-9':   { Icon: Backpack,      hint: 'Great! We have a specialized track for younger learners 🌱' },
  '10-14': { Icon: GraduationCap, hint: 'Perfect! Our middle-school coaching track is highly effective ✨' },
  '15-18': { Icon: Headphones,    hint: 'Awesome! Teens respond especially well to the autonomy approach 🚀' },
};

const STRUGGLE_LABELS: Record<string, string> = {
  morning: 'Morning Routine', homework: 'Homework & Focus',
  transitions: 'Transitions & School', initiation: 'Getting Started',
};

const MOTIVATION_LABELS: Record<string, string> = {
  gaming: 'Screen & Gaming', movement: 'Movement & Play',
  creative: 'Creative Projects', connection: 'Connection Time',
};

const AGE_FORECAST: Record<string, string> = {
  '6-9':   'Parents of 6–9 year olds typically see a 40% reduction in power struggles within the first week.',
  '10-14': 'Parents of 10–14 year olds typically see a 40% reduction in friction within the first week.',
  '15-18': 'Parents of 15–18 year olds typically see a 35% improvement in task initiation within the first week.',
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
  const pieces = Array.from({ length: 18 }, (_, i) => i);
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
}

// ─── Root component ───────────────────────────────────────────────────────────

export function EnOnboardingFlow({ onComplete }: EnOnboardingFlowProps) {
  // Initialise state from a saved mid-flow session (or fresh)
  const [formData, setFormData] = useState<EnOnboardingData>(() => {
    const saved = loadSession();
    return saved ? saved.data : emptyData();
  });
  const [step, setStep] = useState<EnStep>(() => {
    const saved = loadSession();
    return saved ? saved.step : 0;
  });
  const [dir, setDir] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Always clear storage when on Step 0 (the Hook) to guarantee a fresh entry
  useEffect(() => {
    if (step === 0) clearSession();
  }, [step]);

  // Persist whenever formData or step changes (except analysis/hook)
  useEffect(() => {
    if (step === 0 || step === 'analysis') return;
    saveSession(formData, step);
  }, [formData, step]);

  // ── Helpers ────────────────────────────────────────────────────────────────

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

  const goTo = useCallback((target: EnStep, direction: number = 1) => {
    setDir(direction);
    setStep(target);
  }, []);

  const goNext = useCallback((override?: EnStep) => {
    if (override !== undefined) { goTo(override, 1); return; }
    setDir(1);
    setStep(s => STEP_ORDER[Math.min(STEP_ORDER.indexOf(s) + 1, STEP_ORDER.length - 1)]);
  }, [goTo]);

  const goBack = useCallback(() => {
    setDir(-1);
    setStep(s => {
      const idx = STEP_ORDER.indexOf(s);
      const prev = STEP_ORDER[Math.max(idx - 1, 0)];
      return prev === 'analysis' ? 2 : prev; // skip analysis on back
    });
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────────

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 0: return true;
      case 1: return formData.childName.trim().length >= 2 && formData.ageGroup !== '';
      case 2: return formData.struggles.length >= 1;
      case 3: return formData.motivations.length >= 1;
      case 4: return true;
      default: return false;
    }
  }, [step, formData]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleLaunch = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onComplete(formData);
      clearSession();
    } finally {
      setIsSubmitting(false);
    }
  }, [onComplete, formData]);

  // ── Progress ───────────────────────────────────────────────────────────────

  const progressStep = step === 'analysis' ? 2 : (step as number);
  const progress = (progressStep / 4) * 100;
  const showBack = STEP_ORDER.indexOf(step) > 0 && step !== 'analysis';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" dir="ltr">
      {/* Header */}
      <div className="flex items-center justify-center px-5 pt-5 pb-2 shrink-0 relative">
        {showBack && (
          <button
            onClick={goBack}
            className="absolute left-5 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
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
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step content — AnimatePresence with named components */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <StepWrapper key={String(step)} dir={dir}>
            {step === 0 && (
              <StepHook onNext={goNext} />
            )}
            {step === 1 && (
              <StepIdentity
                formData={formData}
                updateField={updateField}
                canProceed={canProceed()}
                onNext={goNext}
              />
            )}
            {step === 2 && (
              <StepFriction
                formData={formData}
                toggle={toggleArray}
                canProceed={canProceed()}
                onNext={() => goNext('analysis')}
              />
            )}
            {step === 'analysis' && (
              <StepAnalysis
                childName={formData.childName.trim() || 'your child'}
                onDone={() => goNext(3)}
              />
            )}
            {step === 3 && (
              <StepMotivators
                formData={formData}
                toggle={toggleArray}
                canProceed={canProceed()}
                onNext={goNext}
              />
            )}
            {step === 4 && (
              <StepReveal
                formData={formData}
                onLaunch={handleLaunch}
                isSubmitting={isSubmitting}
              />
            )}
          </StepWrapper>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Step wrapper (required named component for AnimatePresence) ──────────────

interface StepWrapperProps {
  dir: number;
  children: React.ReactNode;
}

const StepWrapper = forwardRef<HTMLDivElement, StepWrapperProps>(({ dir, children }, ref) => (
  <motion.div
    ref={ref}
    custom={dir}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={slideTrans}
    className="absolute inset-0 overflow-y-auto px-5 pb-32"
  >
    {children}
  </motion.div>
));
StepWrapper.displayName = 'StepWrapper';

// ─── Step 0: The Hook ────────────────────────────────────────────────────────

function StepHook({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center gap-5 max-w-xs mx-auto">

      {/* Illustration */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 240, damping: 22 }}
        className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/15"
      >
        <span className="text-5xl select-none">🧠✨</span>
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="space-y-2.5"
      >
        <h1 className="text-2xl font-bold text-foreground leading-snug">
          Ready for calmer mornings<br />and brighter days?
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Join hundreds of families using{' '}
          <span className="font-semibold text-foreground">positive coaching</span>{' '}
          to help their children thrive.
        </p>
      </motion.div>

      {/* Trust badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.28 }}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-primary/25 bg-primary/5"
      >
        <span className="text-xs text-primary font-semibold">
          ✨ Designed by parents, for parents navigating the ADHD journey.
        </span>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.38 }}
        className="w-full space-y-2"
      >
        <Button
          onClick={onNext}
          size="lg"
          className="w-full h-14 rounded-2xl text-base font-semibold gap-2 shadow-[0_6px_24px_-4px_hsl(var(--primary)/0.45),0_2px_8px_-2px_hsl(var(--primary)/0.25)]"
        >
          Personalize My Plan
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-xs text-muted-foreground">Takes about 90 seconds · No credit card needed</p>
      </motion.div>

      {/* Founder caption */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="text-[10px] text-muted-foreground/50 tracking-wide"
      >
        Founded by a mom with a mission.
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
}

function StepIdentity({ formData, updateField, canProceed, onNext }: StepIdentityProps) {
  const trimmedName = formData.childName.trim();
  const ageMeta = formData.ageGroup ? AGE_META[formData.ageGroup] : null;

  return (
    <div className="flex flex-col gap-8 pt-6 max-w-sm mx-auto pb-8">

      {/* Headline */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="space-y-1.5"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Step 1 · Getting to Know You</p>
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          Who are we supporting today?
        </h2>
        <p className="text-sm text-muted-foreground">Let's personalize your plan — starting with your child.</p>
      </motion.div>

      {/* Name field */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="space-y-2"
      >
        <label htmlFor="child-name" className="text-sm font-semibold text-foreground">
          What's your child's name?
        </label>
        <Input
          id="child-name"
          value={formData.childName}
          onChange={e => updateField('childName', e.target.value)}
          placeholder="e.g. Alex"
          className="h-12 text-base rounded-xl border-2 focus-visible:ring-primary focus-visible:border-primary"
          autoFocus
          maxLength={40}
          onKeyDown={e => { if (e.key === 'Enter' && canProceed) onNext(); }}
        />
      </motion.div>

      {/* Age group */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.26 }}
        className="space-y-3"
      >
        <label className="text-sm font-semibold text-foreground">
          {trimmedName ? (
            <>How old is <span className="text-primary">{trimmedName}</span>?</>
          ) : (
            'How old is your child?'
          )}
        </label>

        <div className="grid grid-cols-3 gap-3">
          {AGE_GROUPS.map(ag => {
            const { Icon } = AGE_META[ag];
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

      {/* CTA */}
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
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Step 2: Struggles (The Friction) ────────────────────────────────────────

interface StepFrictionProps {
  formData: EnOnboardingData;
  toggle: (key: 'struggles' | 'motivations', val: string) => void;
  canProceed: boolean;
  onNext: () => void;
}

function StepFriction({ formData, toggle, canProceed, onNext }: StepFrictionProps) {
  const name = formData.childName.trim() || 'your child';

  return (
    <div className="flex flex-col gap-4 pt-3 max-w-sm mx-auto pb-4">
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Step 2 · Finding the Friction Points</p>
        <h2 className="text-xl font-bold text-foreground leading-snug">
          What part of the day needs more sunshine for{' '}
          <span className="text-primary">{name}</span>?
        </h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Select all that apply — we'll focus your plan on these exact moments.
        </p>
      </div>

      {/* Empathy badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 self-start">
        <span className="text-[11px] text-primary font-semibold">
          💛 You're not alone — 85% of parents struggle with these same moments.
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {STRUGGLE_OPTIONS.map(({ key, Icon, label, sub }) => {
          const selected = formData.struggles.includes(key);
          return (
            <motion.button
              key={key}
              onClick={() => toggle('struggles', key)}
              whileTap={{ scale: 0.985 }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all duration-200 ${
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
        Analyze My Struggles
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Analysis interstitial ────────────────────────────────────────────────────

const ANALYSIS_PHRASES = [
  (name: string) => `Analyzing ${name}'s profile...`,
  () => 'Tailoring strategies...',
  () => 'Building your 7-day roadmap...',
];

interface StepAnalysisProps {
  childName: string;
  onDone: () => void;
}

function StepAnalysis({ childName, onDone }: StepAnalysisProps) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [ringProgress, setRingProgress] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setPhraseIdx(prev => Math.min(prev + 1, ANALYSIS_PHRASES.length - 1));
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
            {ANALYSIS_PHRASES[phraseIdx](childName)}
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

      <p className="text-xs text-muted-foreground px-6 leading-relaxed">
        Our coaching engine is reading your selections to build the perfect plan.
      </p>
    </div>
  );
}

// ─── Step 3: Motivators (The Happy Path) ──────────────────────────────────────

interface StepMotivatorsProps {
  formData: EnOnboardingData;
  toggle: (key: 'struggles' | 'motivations', val: string) => void;
  canProceed: boolean;
  onNext: () => void;
}

function StepMotivators({ formData, toggle, canProceed, onNext }: StepMotivatorsProps) {
  const name = formData.childName.trim() || 'your child';

  return (
    <div className="flex flex-col gap-4 pt-3 max-w-sm mx-auto pb-4">
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Step 3 · The Happy Path</p>
        <h2 className="text-xl font-bold text-foreground leading-snug">
          What lights <span className="text-primary">{name}</span> up the most?
        </h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Positive reinforcement works best when it's personal.
        </p>
      </div>

      <div className="space-y-2">
        {MOTIVATION_OPTIONS.map(({ key, Icon, label, sub }) => {
          const selected = formData.motivations.includes(key);
          return (
            <motion.button
              key={key}
              onClick={() => toggle('motivations', key)}
              whileTap={{ scale: 0.985 }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all duration-200 ${
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
        Create {name}'s Happy Path
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Step 4: The Reveal ───────────────────────────────────────────────────────

interface StepRevealProps {
  formData: EnOnboardingData;
  onLaunch: () => void;
  isSubmitting: boolean;
}

function StepReveal({ formData, onLaunch, isSubmitting }: StepRevealProps) {
  const [phase, setPhase] = useState<'loading' | 'reveal'>('loading');
  const [loadingPct, setLoadingPct] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // 3-second loading phase then reveal with confetti
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
        setTimeout(() => setShowConfetti(false), 2200);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const name = formData.childName.trim() || 'Your child';
  const struggles = formData.struggles.map(s => STRUGGLE_LABELS[s] || s);
  const motivations = formData.motivations.map(m => MOTIVATION_LABELS[m] || m);
  const forecast = formData.ageGroup ? AGE_FORECAST[formData.ageGroup] : AGE_FORECAST['6-9'];

  return (
    <>
      {showConfetti && <ConfettiBurst />}

      <div className="flex flex-col gap-5 pt-4 max-w-sm mx-auto pb-6">

        {/* Loading phase */}
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
                  {loadingPct < 40 && (
                    <motion.p key="p1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm font-semibold text-foreground">
                      Analyzing {name}'s profile...
                    </motion.p>
                  )}
                  {loadingPct >= 40 && loadingPct < 75 && (
                    <motion.p key="p2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm font-semibold text-foreground">
                      Tailoring strategies...
                    </motion.p>
                  )}
                  {loadingPct >= 75 && (
                    <motion.p key="p3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm font-semibold text-foreground">
                      Building your 7-day roadmap...
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${loadingPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Personalizing your coaching strategy</p>
              </div>
            </motion.div>
          )}

          {/* Reveal phase */}
          {phase === 'reveal' && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-4"
            >
              {/* Hero */}
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
                  The wait is over!{' '}
                  <span className="text-primary">{name}</span>'s Positive Plan is ready.
                </h2>
                <p className="text-xs text-muted-foreground">
                  Based on {name}'s profile, we've tailored a{' '}
                  <strong className="text-foreground">7-day kickstart</strong> to transform your daily routine.
                </p>
              </div>

              {/* Plan summary card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/5 to-primary/10 p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">Plan Overview</p>
                </div>

                {/* Two columns */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">🎯 The Focus</p>
                    {struggles.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {struggles.map(s => (
                          <span key={s} className="text-[11px] font-semibold text-foreground bg-background/70 rounded-lg px-2 py-1 border border-border/50 leading-tight">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-xs text-muted-foreground">All areas</span>}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">⚡ The Fuel</p>
                    {motivations.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {motivations.map(m => (
                          <span key={m} className="text-[11px] font-semibold text-foreground bg-background/70 rounded-lg px-2 py-1 border border-border/50 leading-tight">
                            {m}
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-xs text-muted-foreground">All types</span>}
                  </div>
                </div>

                <div className="border-t border-primary/15" />

                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">📈</span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    <span className="font-semibold text-foreground">Success Forecast: </span>
                    {forecast}
                  </p>
                </div>
              </motion.div>

              {/* Method pill */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="flex justify-center"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                  <Brain className="w-3 h-3" />
                  Executive Function coaching · Dopamine Bridge approach
                </span>
              </motion.div>

              {/* Primary CTA */}
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
                      '0 0 0 10px hsl(var(--primary) / 0)',
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
                    {isSubmitting ? (
                      'Setting up your dashboard…'
                    ) : (
                      <>
                        Unlock {name}'s Full Plan
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </motion.div>
                <p className="text-xs text-muted-foreground text-center">
                  Start 7-day free trial · Cancel anytime
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
