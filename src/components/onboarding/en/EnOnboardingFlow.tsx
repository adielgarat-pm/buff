import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ArrowRight, Brain, Sparkles, Backpack, Headphones, GraduationCap, Sunrise, BookOpen, Bus, Rocket, Check } from 'lucide-react';
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

type EnStep = 0 | 1 | 2 | 3 | 4;
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
  { key: 'gaming',    emoji: '🎮', label: 'Gaming Time' },
  { key: 'credits',   emoji: '⭐', label: 'Credits & Rewards' },
  { key: 'projects',  emoji: '🎨', label: 'Personal Projects' },
  { key: 'quality',   emoji: '🫶', label: 'Quality Time' },
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

  // Persist to localStorage on every change (no DB writes until final step)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, step })); } catch {}
  }, [data, step]);

  // Restore step on refresh
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.step && parsed.step > 0 && parsed.step < TOTAL_STEPS - 1) {
          setStep(parsed.step as EnStep);
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

  const goNext = useCallback(() => {
    setDir(1);
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1) as EnStep);
  }, []);

  const goBack = useCallback(() => {
    setDir(-1);
    setStep(s => Math.max(s - 1, 0) as EnStep);
  }, []);

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return true; // Hook — always
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

  const progress = ((step) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" dir="ltr">
      {/* Header — logo always centered */}
      <div className="flex items-center justify-center px-5 pt-5 pb-2 shrink-0 relative">
        {step > 0 && (
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
            {step === 2 && <StepFriction data={data} toggle={toggleArray} onNext={goNext} canProceed={canProceed()} />}
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

// ─── Step 3: The Goal ─────────────────────────────────────────────────────────

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
    <div className="flex flex-col gap-3 pt-3 max-w-sm mx-auto pb-4">

      {/* Progress label */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Step 3 · What Drives Them</p>
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
          What motivates{' '}
          <span className="text-primary">{name}</span> the most?
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          We'll use this to build rewards that actually work for them.
        </p>
      </div>

      {/* Selection cards — same compact style */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Select all that apply</p>
        {MOTIVATION_OPTIONS.map(opt => {
          const selected = data.motivations.includes(opt.key);
          return (
            <motion.button
              key={opt.key}
              onClick={() => toggle('motivations', opt.key)}
              whileTap={{ scale: 0.985 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-200 ${
                selected
                  ? 'border-primary bg-primary/8 shadow-sm shadow-primary/10'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              {/* Emoji pill */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-lg transition-colors ${
                selected ? 'bg-primary' : 'bg-muted'
              }`}>
                {opt.emoji}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-none ${selected ? 'text-primary' : 'text-foreground'}`}>
                  {opt.label}
                </p>
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

      <Button
        onClick={onNext}
        disabled={!canProceed}
        size="lg"
        className={`w-full h-12 rounded-2xl text-sm font-semibold gap-2 transition-all duration-300 ${
          canProceed ? 'shadow-md shadow-primary/25 opacity-100' : 'opacity-40 shadow-none'
        }`}
      >
        Build My Reward System <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Step 4: Confirm / Calculating ───────────────────────────────────────────

function StepConfirm({
  data,
  onLaunch,
  isSubmitting,
}: {
  data: EnOnboardingData;
  onLaunch: () => void;
  isSubmitting: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  // 5-second fake "calculating" progress
  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const DURATION = 5000;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        frame = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const name = data.childName || 'your child';
  const STRUGGLE_MAP: Record<string, string> = {
    morning: '🌅 Morning Routine', homework: '📚 Homework Battles',
    transitions: '🔄 Transitions', initiation: '🚀 Task Initiation',
  };
  const MOTIVATION_MAP: Record<string, string> = {
    gaming: '🎮 Gaming Time', credits: '⭐ Credits & Rewards',
    projects: '🎨 Personal Projects', quality: '🫶 Quality Time',
  };

  return (
    <div className="flex flex-col gap-7 pt-6 max-w-sm mx-auto">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step 4 of 4</p>
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          {done
            ? `${name}'s External Brain is ready! 🧠`
            : `Customizing ${name}'s\nExternal Brain...`}
        </h2>
      </div>

      {/* Progress bar */}
      <AnimatePresence>
        {!done && (
          <motion.div exit={{ opacity: 0, height: 0 }} className="space-y-2">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Building your personalised plan…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary card */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="font-semibold text-foreground text-sm">Your personalised plan</p>
            </div>

            <div className="space-y-2 text-sm">
              <SummaryRow label="Child" value={`${name}, age ${data.ageGroup}`} />
              <SummaryRow
                label="Focus areas"
                value={data.struggles.map(s => STRUGGLE_MAP[s] || s).join(' · ')}
              />
              <SummaryRow
                label="Motivation"
                value={data.motivations.map(m => MOTIVATION_MAP[m] || m).join(' · ')}
              />
              <SummaryRow label="Method" value="Executive Function coaching — Dopamine Bridge approach" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launch button */}
      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              onClick={onLaunch}
              disabled={isSubmitting}
              size="lg"
              className="w-full h-14 rounded-2xl text-base font-semibold gap-2"
            >
              {isSubmitting ? (
                <>Setting up your dashboard…</>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Launch BUFF
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="font-medium text-foreground leading-snug">{value}</span>
    </div>
  );
}
