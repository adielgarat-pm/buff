import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ArrowRight, Brain, Sparkles } from 'lucide-react';
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
  { key: 'morning',     emoji: '🌅', label: 'Morning Routine' },
  { key: 'homework',    emoji: '📚', label: 'Homework Battles' },
  { key: 'transitions', emoji: '🔄', label: 'School Transitions' },
  { key: 'initiation',  emoji: '🚀', label: 'Task Initiation' },
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
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
        {step > 0 ? (
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div className="w-16" />
        )}
        <img src={buffLogoNoBg} alt="BUFF" className="h-8 opacity-80" />
        <div className="w-16" />
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-4 shrink-0">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
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
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center gap-8 max-w-xs mx-auto">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
        className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center"
      >
        <Brain className="w-12 h-12 text-primary" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          From "Policewoman"<br />to Positive Coach.
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Let's build your child's{' '}
          <span className="font-semibold text-foreground">External Brain</span>{' '}
          together — supporting their Executive Function, Autonomy, and confidence.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="w-full"
      >
        <Button
          onClick={onNext}
          size="lg"
          className="w-full h-14 rounded-2xl text-base font-semibold gap-2"
        >
          Let's get started
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-3">Takes about 90 seconds</p>
      </motion.div>
    </div>
  );
}

// ─── Step 1: The Hero ─────────────────────────────────────────────────────────

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
  return (
    <div className="flex flex-col gap-7 pt-6 max-w-sm mx-auto">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step 1 of 4</p>
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          Who are we<br />supporting?
        </h2>
      </div>

      {/* Name input */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Child's first name</label>
        <Input
          value={data.childName}
          onChange={e => update('childName', e.target.value)}
          placeholder="e.g. Alex"
          className="h-13 text-base rounded-xl border-2 focus:border-primary"
          autoFocus
          maxLength={40}
          onKeyDown={e => { if (e.key === 'Enter' && canProceed) onNext(); }}
        />
      </div>

      {/* Age group */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Age group</label>
        <div className="grid grid-cols-3 gap-3">
          {AGE_GROUPS.map(ag => (
            <button
              key={ag}
              onClick={() => update('ageGroup', ag)}
              className={`py-4 rounded-2xl border-2 text-sm font-semibold transition-all ${
                data.ageGroup === ag
                  ? 'border-primary bg-primary text-primary-foreground shadow-md'
                  : 'border-border hover:border-primary/50 text-foreground'
              }`}
            >
              {ag}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!canProceed}
        size="lg"
        className="w-full h-13 rounded-2xl text-base font-semibold mt-2"
      >
        Continue <ArrowRight className="w-4 h-4 ml-1" />
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
  const name = data.childName || 'your child';
  return (
    <div className="flex flex-col gap-7 pt-6 max-w-sm mx-auto">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step 2 of 4</p>
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          Where is the biggest<br />struggle?
        </h2>
        <p className="text-sm text-muted-foreground">Select all that apply for {name}.</p>
      </div>

      <div className="space-y-3">
        {STRUGGLE_OPTIONS.map(opt => {
          const selected = data.struggles.includes(opt.key);
          return (
            <button
              key={opt.key}
              onClick={() => toggle('struggles', opt.key)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                selected
                  ? 'border-primary bg-primary/8 shadow-sm'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className={`font-semibold text-sm ${selected ? 'text-primary' : 'text-foreground'}`}>
                {opt.label}
              </span>
              {selected && (
                <span className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Button
        onClick={onNext}
        disabled={!canProceed}
        size="lg"
        className="w-full h-13 rounded-2xl text-base font-semibold"
      >
        Continue <ArrowRight className="w-4 h-4 ml-1" />
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
  const name = data.childName || 'them';
  return (
    <div className="flex flex-col gap-7 pt-6 max-w-sm mx-auto">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step 3 of 4</p>
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          What motivates<br />{name} the most?
        </h2>
        <p className="text-sm text-muted-foreground">We'll use this to build rewards that actually work.</p>
      </div>

      <div className="space-y-3">
        {MOTIVATION_OPTIONS.map(opt => {
          const selected = data.motivations.includes(opt.key);
          return (
            <button
              key={opt.key}
              onClick={() => toggle('motivations', opt.key)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                selected
                  ? 'border-primary bg-primary/8 shadow-sm'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className={`font-semibold text-sm ${selected ? 'text-primary' : 'text-foreground'}`}>
                {opt.label}
              </span>
              {selected && (
                <span className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Button
        onClick={onNext}
        disabled={!canProceed}
        size="lg"
        className="w-full h-13 rounded-2xl text-base font-semibold"
      >
        See my plan <ArrowRight className="w-4 h-4 ml-1" />
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
