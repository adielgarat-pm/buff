import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ArrowRight, Brain, Sparkles, Backpack, Headphones, GraduationCap, Sunrise, BookOpen, Bus, Rocket, Check, Gamepad2, Zap, Palette, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import buffLogoNoBg from '@/assets/buff-logo-no-bg.png';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EnOnboardingData {
  childName: string;
  ageGroup: '6-9' | '10-14' | '15-18' | '';
  struggles: string[];      // multi-select
  motivations: string[];    // multi-select
}

// 'analysis' is a special interstitial between step 2 and step 3
type EnStep = 0 | 1 | 2 | 'analysis' | 3 | 4;
const TOTAL_STEPS = 5;

const STORAGE_KEY = 'buff_en_onboarding_v2';

const emptyData = (): EnOnboardingData => ({
  childName: '',
  ageGroup: '',
  struggles: [],
  motivations: [],
});

// ─── Step options ─────────────────────────────────────────────────────────────

const STRUGGLE_OPTIONS = [
  {
    key: 'morning',
    icon: Sunrise,
    label: 'Morning Routine',
    sub: 'The race against the clock',
  },
  {
    key: 'homework',
    icon: BookOpen,
    label: 'Homework & Focus',
    sub: 'Taming the study monster',
  },
  {
    key: 'transitions',
    icon: Bus,
    label: 'Transitions & School',
    sub: "The 'shifting gears' struggle",
  },
  {
    key: 'initiation',
    icon: Rocket,
    label: 'Getting Started',
    sub: "Breaking through the 'I can't' wall",
  },
];

const MOTIVATION_OPTIONS = [
  { key: 'gaming',    icon: Gamepad2, label: 'Screen & Gaming',      sub: 'Gaming, apps, or favourite shows' },
  { key: 'movement',  icon: Zap,      label: 'Movement & Play',      sub: 'Outdoor play, sports, or high-energy' },
  { key: 'creative',  icon: Palette,  label: 'Creative Projects',    sub: 'Building, drawing, or digital creation' },
  { key: 'connection',icon: Heart,    label: 'Connection Time',      sub: 'One-on-one time or shared activities' },
  { key: 'treats',    icon: Star,     label: 'Special Treats',       sub: 'Small privileges, snacks, or bonus time' },
];

const AGE_GROUPS: Array<'6-9' | '10-14' | '15-18'> = ['6-9', '10-14', '15-18'];

// ─── Slide animation ──────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
};

const transition = { duration: 0.32, ease: 'easeOut' as const };

// ─── Props ────────────────────────────────────────────────────────────────────

interface EnOnboardingFlowProps {
  onComplete: (data: EnOnboardingData) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

// Numeric ordering for progress/navigation — 'analysis' sits between 2 and 3
const STEP_ORDER: EnStep[] = [0, 1, 2, 'analysis', 3, 4];

function stepIndex(s: EnStep): number {
  return STEP_ORDER.indexOf(s);
}

export function EnOnboardingFlow({ onComplete }: EnOnboardingFlowProps) {
  const [step, setStep] = useState<EnStep>(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<EnOnboardingData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...emptyData(), ...JSON.parse(saved) } : emptyData();
    } catch {
      return emptyData();
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Persist to localStorage on every change (skip 'analysis' — it's transient)
  useEffect(() => {
    if (step === 'analysis') return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, step })); } catch {}
  }, [data, step]);

  // Restore step on refresh
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const s = parsed.step as EnStep;
        const idx = stepIndex(s);
        if (idx > 0 && idx < STEP_ORDER.length - 1) {
          setStep(s);
        }
      }
    } catch {}
  }, []);

  const update = useCallback(<K extends keyof EnOnboardingData>(key: K, value: EnOnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleArray = useCallback((key: 'struggles' | 'motivations', val: string) => {
    setData(prev => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val],
      };
    });
  }, []);

  const goNext = useCallback((override?: EnStep) => {
    setDir(1);
    if (override !== undefined) {
      setStep(override);
      return;
    }
    setStep(s => {
      const idx = stepIndex(s);
      return STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
    });
  }, []);

  const goBack = useCallback(() => {
    setDir(-1);
    setStep(s => {
      const idx = stepIndex(s);
      // Skip 'analysis' on back — go straight back to step 2
      const prev = STEP_ORDER[Math.max(idx - 1, 0)];
      return prev === 'analysis' ? 2 : prev;
    });
  }, []);

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return true;
      case 1: return data.childName.trim().length >= 2 && data.ageGroup !== '';
      case 2: return data.struggles.length >= 1;
      case 3: return data.motivations.length >= 1;
      case 4: return true;
      default: return false;
    }
  };

  const handleLaunch = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(data);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map step to a numeric progress value (skip 'analysis' — same as step 3's progress)
  const progressStepNum = step === 'analysis' ? 3 : (step as number);
  const progress = (progressStepNum / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" dir="ltr">
      {/* Header — logo always centered */}
      <div className="flex items-center justify-center px-5 pt-5 pb-2 shrink-0 relative">
        {stepIndex(step) > 0 && step !== 'analysis' && (
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

      {/* Progress bar — slightly thicker + label */}
      <div className="px-5 pt-2 pb-5 shrink-0 space-y-1.5">
        <div className="h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="absolute inset-0 overflow-y-auto px-5 pb-32"
          >
            {step === 0 && <StepHook onNext={goNext} />}
            {step === 1 && <StepHero data={data} update={update} onNext={goNext} canProceed={canProceed()} />}
            {step === 2 && (
              <StepFriction
                data={data}
                toggle={toggleArray}
                onNext={() => goNext('analysis')}
                canProceed={canProceed()}
              />
            )}
            {step === 'analysis' && (
              <StepAnalysis
                childName={data.childName.trim() || 'your child'}
                onDone={() => goNext(3)}
              />
            )}
            {step === 3 && <StepGoal data={data} toggle={toggleArray} onNext={goNext} canProceed={canProceed()} />}
            {step === 4 && <StepConfirm data={data} onLaunch={handleLaunch} isSubmitting={isSubmitting} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Step 0: The Hook ─────────────────────────────────────────────────────────

function StepHook({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center gap-6 max-w-xs mx-auto">

      {/* Illustration / Hero visual */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 240, damping: 22 }}
        className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/15"
      >
        <span className="text-5xl select-none">🧠✨</span>
      </motion.div>

      {/* Headline + sub */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <h1 className="text-2xl font-bold text-foreground leading-snug">
          Ready for calmer mornings<br />and brighter days?
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Join 5,000+ parents using{' '}
          <span className="font-semibold text-foreground">positive coaching</span>{' '}
          to help their children thrive. Let's build your personalised support plan.
        </p>
        <p className="text-xs text-primary font-semibold mt-1">
          ✨ Joined by 5,000+ parents creating calmer homes.
        </p>
      </motion.div>

      {/* Trust badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.28 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/25 bg-primary/5"
      >
        <span className="text-xs text-primary font-semibold">⭐ 92% of parents report reduced morning stress within 7 days</span>
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
          className="w-full h-14 rounded-2xl text-base font-semibold gap-2 shadow-md shadow-primary/25"
        >
          Personalise My Plan
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-xs text-muted-foreground">Takes about 90 seconds · No credit card needed</p>
      </motion.div>
    </div>
  );
}

// ─── Step 1: The Hero ─────────────────────────────────────────────────────────

const AGE_GROUP_META: Record<string, { icon: React.ReactNode; hint: string }> = {
  '6-9':   { icon: <Backpack className="w-5 h-5" />,      hint: 'Great! We have a specialized track for younger learners 🌱' },
  '10-14': { icon: <GraduationCap className="w-5 h-5" />, hint: 'Perfect! Our middle-school coaching track is highly effective ✨' },
  '15-18': { icon: <Headphones className="w-5 h-5" />,    hint: 'Awesome! Teens respond especially well to the autonomy approach 🚀' },
};

function StepHero({
  data,
  update,
  onNext,
  canProceed,
}: {
  data: EnOnboardingData;
  update: <K extends keyof EnOnboardingData>(k: K, v: EnOnboardingData[K]) => void;
  onNext: () => void;
  canProceed: boolean;
}) {
  const trimmedName = data.childName.trim();
  const ageMeta = data.ageGroup ? AGE_GROUP_META[data.ageGroup] : null;

  return (
    <div className="flex flex-col gap-6 pt-4 max-w-sm mx-auto pb-6">
      {/* Step label */}
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Step 1 · Setting the Foundation</p>

      {/* Headline */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          Who are we supporting today?
        </h2>
        <p className="text-sm text-muted-foreground">Let's personalise your plan — starting with your child.</p>
      </div>

      {/* Name input */}
      <div className="space-y-2">
        <label htmlFor="child-name" className="text-sm font-semibold text-foreground">
          What's your child's name?
        </label>
        <Input
          id="child-name"
          value={data.childName}
          onChange={e => update('childName', e.target.value)}
          placeholder="e.g. Alex"
          className="h-13 text-base rounded-xl border-2 focus-visible:ring-primary focus-visible:border-primary"
          autoFocus
          maxLength={40}
          onKeyDown={e => { if (e.key === 'Enter' && canProceed) onNext(); }}
        />
      </div>

      {/* Age group */}
      <div className="space-y-2">
        {/* Dynamic label: empty → "How old is your child?", filled → "How old is Alex?" */}
        <label className="text-sm font-semibold text-foreground">
          {trimmedName ? (
            <>How old is <span className="text-primary">{trimmedName}</span>?</>
          ) : (
            'How old is your child?'
          )}
        </label>

        <div className="grid grid-cols-3 gap-3">
          {AGE_GROUPS.map(ag => {
            const meta = AGE_GROUP_META[ag];
            const selected = data.ageGroup === ag;
            return (
              <button
                key={ag}
                onClick={() => update('ageGroup', ag)}
                className={`flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl border-2 text-sm font-semibold transition-all ${
                  selected
                    ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'border-border hover:border-primary/50 text-foreground'
                }`}
              >
                <span className={selected ? 'text-primary-foreground' : 'text-muted-foreground'}>
                  {meta.icon}
                </span>
                <span>{ag}</span>
              </button>
            );
          })}
        </div>

        {/* Instant feedback hint */}
        <AnimatePresence mode="wait">
          {ageMeta && (
            <motion.p
              key={data.ageGroup}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-xs text-primary font-medium bg-primary/8 rounded-xl px-3 py-2"
            >
              {ageMeta.hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* CTA — vibrant purple only when both name + age filled */}
      <Button
        onClick={onNext}
        disabled={!canProceed}
        size="lg"
        className={`w-full h-14 rounded-2xl text-base font-semibold gap-2 transition-all duration-300 ${
          canProceed
            ? 'shadow-lg shadow-primary/30 opacity-100'
            : 'opacity-40 shadow-none'
        }`}
      >
        Start My Plan <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Step Analysis: Interstitial ─────────────────────────────────────────────

const ANALYSIS_PHRASES = [
  (name: string) => `Analyzing ${name}'s daily routine...`,
  (_name: string) => 'Tailoring positive reinforcement strategies...',
  (_name: string) => 'Building your custom coaching plan...',
];

function StepAnalysis({ childName, onDone }: { childName: string; onDone: () => void }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [ringProgress, setRingProgress] = useState(0);

  // Cycle through phrases every 1 second, auto-advance after 3 seconds
  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setPhraseIdx(prev => Math.min(prev + 1, ANALYSIS_PHRASES.length - 1));
    }, 1000);

    const doneTimer = setTimeout(() => {
      clearInterval(phraseTimer);
      onDone();
    }, 3000);

    return () => {
      clearInterval(phraseTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  // Smooth ring fill over 3 seconds
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

  const RADIUS = 44;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - ringProgress / 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 max-w-xs mx-auto text-center">

      {/* Circular progress ring with brain icon inside */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-32 h-32"
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle
            cx="50" cy="50" r={RADIUS} fill="none"
            stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
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

      {/* Dynamic phrase */}
      <div className="space-y-3 min-h-[4rem] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phraseIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-base font-semibold text-foreground leading-snug px-4"
          >
            {ANALYSIS_PHRASES[phraseIdx](childName)}
          </motion.p>
        </AnimatePresence>

        {/* Animated dots */}
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary inline-block"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2, ease: 'easeInOut' }}
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

// ─── Step 2: The Friction ─────────────────────────────────────────────────────

function StepFriction({
  data,
  toggle,
  onNext,
  canProceed,
}: {
  data: EnOnboardingData;
  toggle: (key: 'struggles' | 'motivations', val: string) => void;
  onNext: () => void;
  canProceed: boolean;
}) {
  const name = data.childName.trim() || 'your child';
  const selectedCount = data.struggles.length;

  return (
    <div className="flex flex-col gap-3 pt-3 max-w-sm mx-auto pb-4">

      {/* Progress label */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Step 2 · Finding the Friction Points</p>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${25 + selectedCount * 8}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Headline */}
      <div className="space-y-0.5">
        <h2 className="text-xl font-bold text-foreground leading-snug">
          What part of the day needs more sunshine for{' '}
          <span className="text-primary">{name}</span>?
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tell us where the friction is so we can focus on the wins that matter most.
        </p>
      </div>

      {/* Compact validation pill */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 self-start">
        <span className="text-[10px] text-primary font-medium leading-none">🤝 85% of parents share these same struggles</span>
      </div>

      {/* Selection cards — compact horizontal layout */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Select all that apply</p>
        {STRUGGLE_OPTIONS.map(opt => {
          const selected = data.struggles.includes(opt.key);
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.key}
              onClick={() => toggle('struggles', opt.key)}
              whileTap={{ scale: 0.985 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-200 ${
                selected
                  ? 'border-primary bg-primary/8 shadow-sm shadow-primary/10'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              {/* Icon pill — smaller */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Text — tighter */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-none ${selected ? 'text-primary' : 'text-foreground'}`}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{opt.sub}</p>
              </div>

              {/* Animated checkmark */}
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

      {/* Why factor — minimal */}
      <p className="text-[10px] text-muted-foreground text-center">
        💡 Selecting these helps us prioritise your daily coaching tips
      </p>

      {/* CTA */}
      <Button
        onClick={onNext}
        disabled={!canProceed}
        size="lg"
        className={`w-full h-12 rounded-2xl text-sm font-semibold gap-2 transition-all duration-300 ${
          canProceed ? 'shadow-md shadow-primary/25 opacity-100' : 'opacity-40 shadow-none'
        }`}
      >
        Analyse My Struggles <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Step 3: The Happy Path ───────────────────────────────────────────────────

function StepGoal({
  data,
  toggle,
  onNext,
  canProceed,
}: {
  data: EnOnboardingData;
  toggle: (key: 'struggles' | 'motivations', val: string) => void;
  onNext: () => void;
  canProceed: boolean;
}) {
  const name = data.childName.trim() || 'your child';
  const selectedCount = data.motivations.length;

  return (
    <div className="flex flex-col gap-3 pt-2 max-w-sm mx-auto pb-4">

      {/* Progress hint */}
      <p className="text-[10px] text-muted-foreground text-center font-medium">
        Almost there! Just one more step to your custom plan.
      </p>

      {/* Progress label + mini bar */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Step 3 · The Happy Path</p>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${55 + selectedCount * 8}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Headline */}
      <div className="space-y-0.5">
        <h2 className="text-xl font-bold text-foreground leading-snug">
          What lights{' '}
          <span className="text-primary">{name}</span> up the most?
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Positive reinforcement works best when it's personal. Select what truly motivates{' '}
          <span className="font-medium text-foreground">{name}</span>.
        </p>
      </div>

      {/* Selection cards — compact horizontal layout */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Select all that apply</p>
        {MOTIVATION_OPTIONS.map(opt => {
          const selected = data.motivations.includes(opt.key);
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.key}
              onClick={() => toggle('motivations', opt.key)}
              whileTap={{ scale: 0.985 }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border-2 text-left transition-all duration-200 ${
                selected
                  ? 'border-primary bg-primary/8 shadow-sm shadow-primary/10'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              {/* Icon pill */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-none ${selected ? 'text-primary' : 'text-foreground'}`}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{opt.sub}</p>
              </div>

              {/* Animated checkmark */}
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

      {/* CTA */}
      <Button
        onClick={onNext}
        disabled={!canProceed}
        size="lg"
        className={`w-full h-12 rounded-2xl text-sm font-semibold gap-2 transition-all duration-300 ${
          canProceed ? 'shadow-md shadow-primary/25 opacity-100' : 'opacity-40 shadow-none'
        }`}
      >
        Create {name}'s Happy Path <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Step 4: Plan Reveal ─────────────────────────────────────────────────────

const STRUGGLE_LABELS: Record<string, string> = {
  morning: 'Morning Routine',
  homework: 'Homework & Focus',
  transitions: 'Transitions & School',
  initiation: 'Getting Started',
};

const MOTIVATION_LABELS: Record<string, string> = {
  gaming: 'Screen & Gaming',
  movement: 'Movement & Play',
  creative: 'Creative Projects',
  connection: 'Connection Time',
  treats: 'Special Treats',
};

const AGE_FORECAST: Record<string, string> = {
  '6-9':   'Parents of 6–9 year olds typically see a 40% reduction in power struggles within the first week.',
  '10-14': 'Parents of 10–14 year olds typically see a 40% reduction in friction within the first week.',
  '15-18': 'Parents of 15–18 year olds typically see a 35% improvement in task initiation within the first week.',
};

function StepConfirm({
  data,
  onLaunch,
  isSubmitting,
}: {
  data: EnOnboardingData;
  onLaunch: () => void;
  isSubmitting: boolean;
}) {
  const [loadingDone, setLoadingDone] = useState(false);
  const [loadingPct, setLoadingPct] = useState(0);

  // 3-second loading bar before revealing the plan
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
        setLoadingDone(true);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const name = data.childName.trim() || 'Your child';
  const struggles = data.struggles.map(s => STRUGGLE_LABELS[s] || s);
  const motivations = data.motivations.map(m => MOTIVATION_LABELS[m] || m);
  const forecast = data.ageGroup ? AGE_FORECAST[data.ageGroup] : AGE_FORECAST['6-9'];

  return (
    <div className="flex flex-col gap-5 pt-4 max-w-sm mx-auto pb-6">

      {/* Loading phase */}
      {!loadingDone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-6 min-h-[70vh] text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Sparkles className="w-9 h-9 text-primary" />
          </motion.div>

          <div className="space-y-1.5 w-full max-w-[240px]">
            <p className="text-sm font-semibold text-foreground">Building {name}'s plan…</p>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                style={{ width: `${loadingPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Personalising your coaching strategy</p>
          </div>
        </motion.div>
      )}

      {/* Reveal phase */}
      {loadingDone && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col gap-4"
        >
          {/* Hero header */}
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
              <span className="text-primary">{name}</span>'s Positive Support Plan is ready!
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Based on {name}'s profile, we've tailored a <strong className="text-foreground">7-day kickstart</strong> to transform your daily routine.
            </p>
          </div>

          {/* Plan Overview box */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/5 to-primary/10 p-4 space-y-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Plan Overview</p>
            </div>

            {/* Two-column focus + fuel */}
            <div className="grid grid-cols-2 gap-3">
              {/* Column 1 – The Focus */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">🎯 Focus Areas</p>
                {struggles.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {struggles.map(s => (
                      <span
                        key={s}
                        className="text-[11px] font-semibold text-foreground bg-background/70 rounded-lg px-2 py-1 border border-border/50 leading-tight"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">All areas</span>
                )}
              </div>

              {/* Column 2 – The Fuel */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">⚡ Motivators</p>
                {motivations.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {motivations.map(m => (
                      <span
                        key={m}
                        className="text-[11px] font-semibold text-foreground bg-background/70 rounded-lg px-2 py-1 border border-border/50 leading-tight"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">All types</span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-primary/15" />

            {/* Success forecast */}
            <div className="flex items-start gap-2">
              <span className="text-base select-none shrink-0">📈</span>
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
            className="flex items-center justify-center gap-2"
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
              animate={{ boxShadow: ['0 0 0 0 hsl(var(--primary) / 0.3)', '0 0 0 10px hsl(var(--primary) / 0)', '0 0 0 0 hsl(var(--primary) / 0)'] }}
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
                    <ArrowRight className="w-5 h-5" />
                    Unlock {name}'s Full Plan
                  </>
                )}
              </Button>
            </motion.div>
            <p className="text-xs text-muted-foreground text-center">
              Start your 7-day free trial · Cancel anytime
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
