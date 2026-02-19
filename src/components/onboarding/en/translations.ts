// ─── EN Onboarding Translations ───────────────────────────────────────────────
// Single source of truth for all strings used in the English onboarding flow.
// No hardcoded strings should appear inside component JSX.

export const T = {
  // ── Step 0: Hook ────────────────────────────────────────────────────────────
  hook: {
    headline: 'Ready for calmer mornings\nand brighter days?',
    subHeadline: 'Join hundreds of families using positive coaching to help their children thrive.',
    trustBadge: '✨ Designed by parents, for parents navigating the ADHD journey.',
    roleQuestion: 'How will you be using BUFF today?',
    roleParentLabel: "I'm a Parent",
    roleParentSub: "Building a plan for my child",
    roleTeenLabel: "I'm a Teen",
    roleTeenSub: "Joining my family's plan",
    cta: 'Personalize My Plan',
    footer: 'Takes about 90 seconds · No credit card needed',
    founder: 'Founded by a mom with a mission.',
    resumeBanner: 'You were in the middle of building your plan!',
    resumeBtn: 'Resume →',
    startFreshBtn: 'Start fresh',
    teenMessage: "Ask your parent to set up BUFF and invite you as a family member.",
    teenTitle: "Hi there! 👋",
  },

  // ── Step 1: Identity ─────────────────────────────────────────────────────────
  identity: {
    stepLabel: 'Step 1 · Getting to Know You',
    headline: 'Who are we supporting today?',
    subHeadline: "Let's personalize your plan — starting with your child.",
    nameLabel: "What's your child's name?",
    namePlaceholder: 'e.g. Alex',
    ageLabel: "How old is your child?",
    ageLabelDynamic: (name: string) => `How old is ${name}?`,
    ageMeta: {
      '6-9':   { hint: 'Great! We have a specialized track for younger learners 🌱' },
      '10-14': { hint: 'Perfect! Our middle-school coaching track is highly effective ✨' },
      '15-18': { hint: 'Awesome! Teens respond especially well to the autonomy approach 🚀' },
    } as Record<string, { hint: string }>,
    cta: 'Continue',
  },

  // ── Step 2: Struggles ────────────────────────────────────────────────────────
  struggles: {
    stepLabel: 'Step 2 · Finding the Friction Points',
    headline: (name: string) => `What part of the day needs more sunshine for ${name}?`,
    subHeadline: "Select all that apply — we'll focus your plan on these exact moments.",
    empathyBadge: "💛 You're not alone — 85% of parents struggle with these same moments.",
    cta: 'Analyze My Struggles',
    options: [
      { key: 'morning',     label: 'Morning Routine',      sub: 'The race against the clock' },
      { key: 'homework',    label: 'Homework & Focus',     sub: 'Taming the study monster' },
      { key: 'transitions', label: 'Transitions & School', sub: "The 'shifting gears' struggle" },
      { key: 'initiation',  label: 'Getting Started',      sub: "Breaking through the 'I can't' wall" },
    ],
  },

  // ── Analysis interstitial ────────────────────────────────────────────────────
  analysis: {
    phrases: [
      (name: string) => `Analyzing ${name}'s profile...`,
      () => 'Tailoring strategies...',
      () => 'Building your 7-day roadmap...',
    ] as ((name: string) => string)[],
    engineCaption: 'Our coaching engine is reading your selections to build the perfect plan.',
  },

  // ── Step 3: Motivators ───────────────────────────────────────────────────────
  motivators: {
    stepLabel: 'Step 3 · The Happy Path',
    headline: (name: string) => `What lights ${name} up the most?`,
    subHeadline: "Positive reinforcement works best when it's personal.",
    cta: (name: string) => `Create ${name}'s Happy Path`,
    options: [
      { key: 'gaming',     label: 'Screen & Gaming',    sub: 'Gaming, apps, or favourite shows' },
      { key: 'movement',   label: 'Movement & Play',    sub: 'Outdoor play, sports, or high-energy fun' },
      { key: 'creative',   label: 'Creative Projects',  sub: 'Building, drawing, or digital creation' },
      { key: 'connection', label: 'Connection Time',    sub: 'One-on-one time or shared activities' },
    ],
  },

  // ── Step 4: Reveal ───────────────────────────────────────────────────────────
  reveal: {
    loadingPhrases: [
      (name: string) => `Analyzing ${name}'s profile...`,
      () => 'Tailoring strategies...',
      () => 'Building your 7-day roadmap...',
    ] as ((name: string) => string)[],
    loadingCaption: 'Personalizing your coaching strategy',
    headline: (name: string) => `The wait is over! ${name}'s Positive Plan is ready.`,
    sub: (name: string) =>
      `Based on ${name}'s profile, we've tailored a 7-day kickstart to transform your daily routine.`,
    planOverview: 'Plan Overview',
    focusLabel: '🎯 The Focus',
    fuelLabel: '⚡ The Fuel',
    allAreas: 'All areas',
    allTypes: 'All types',
    successForecast: 'Success Forecast: ',
    forecast: {
      '6-9':   'Parents of 6–9 year olds typically see a 40% reduction in power struggles within the first week.',
      '10-14': 'Parents of 10–14 year olds typically see a 40% reduction in friction within the first week.',
      '15-18': 'Parents of 15–18 year olds typically see a 35% improvement in task initiation within the first week.',
    } as Record<string, string>,
    methodPill: 'Executive Function coaching · Dopamine Bridge approach',
    cta: (name: string) => `Unlock ${name}'s Full Plan`,
    ctaLoading: 'Setting up your dashboard…',
    trialDisclaimer: 'Start 7-day free trial · Cancel anytime',
  },

  // ── Shared ───────────────────────────────────────────────────────────────────
  back: 'Back',
} as const;

// Lookup maps used in the Reveal step
export const STRUGGLE_LABELS: Record<string, string> = Object.fromEntries(
  T.struggles.options.map(o => [o.key, o.label])
);

export const MOTIVATION_LABELS: Record<string, string> = Object.fromEntries(
  T.motivators.options.map(o => [o.key, o.label])
);
