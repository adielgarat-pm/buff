// ─── Onboarding Translations ──────────────────────────────────────────────────
// Dual-language: EN + HE. The active language is determined at runtime.

export type OnboardingLang = 'en' | 'he';

const EN = {
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
    langToggle: 'עברית',
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

  // ── Step Auth: Embedded Sign-up ──────────────────────────────────────────────
  auth: {
    headline: (name: string) => `Save ${name}'s plan!`,
    subHeadline: 'Sign in to see your personalized strategy.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    nameLabel: 'Your name',
    namePlaceholder: 'e.g. Sarah',
    cta: 'Create Account & See Plan',
    ctaLogin: 'Sign In & See Plan',
    ctaLoading: 'Setting up...',
    googleCta: 'Continue with Google',
    divider: 'or',
    loginToggle: 'Already have an account? Sign in',
    signupToggle: "Don't have an account? Sign up",
    errorFillFields: 'Please fill in all fields',
    errorPasswordMin: 'Password must be at least 6 characters',
    errorGeneric: 'Something went wrong. Please try again.',
    successCreated: 'Account created! Loading your plan...',
    successLogin: 'Welcome back! Loading your plan...',
  },

  // ── Step 5: Reveal ──────────────────────────────────────────────────────────
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
};

const HE = {
  hook: {
    headline: 'מוכנים לבקרים שקטים\nוימים מוצלחים יותר?',
    subHeadline: 'הצטרפו למאות משפחות שמשתמשות באימון חיובי כדי לעזור לילדים שלהן לפרוח.',
    trustBadge: '✨ עוצב על ידי הורים, בשביל הורים במסע ה-ADHD.',
    roleQuestion: 'איך תרצו להשתמש ב-BUFF היום?',
    roleParentLabel: 'אני הורה',
    roleParentSub: 'בניית תוכנית לילד שלי',
    roleTeenLabel: 'אני נער/ה',
    roleTeenSub: 'הצטרפות לתוכנית המשפחה',
    cta: 'התאמה אישית של התוכנית שלי',
    footer: 'לוקח כ-90 שניות · ללא כרטיס אשראי',
    founder: 'נוסד על ידי אמא עם משימה.',
    resumeBanner: 'היית באמצע בניית התוכנית שלך!',
    resumeBtn: 'המשך →',
    startFreshBtn: 'התחל מחדש',
    teenMessage: 'בקש מההורה שלך להגדיר את BUFF ולהזמין אותך כחבר משפחה.',
    teenTitle: 'היי! 👋',
    langToggle: 'English',
  },
  identity: {
    stepLabel: 'שלב 1 · היכרות',
    headline: 'למי אנחנו בונים תוכנית?',
    subHeadline: 'בואו נתאים אישית את התוכנית — נתחיל מהילד שלכם.',
    nameLabel: 'מה שם הילד/ה שלך?',
    namePlaceholder: 'לדוגמה: נועם',
    ageLabel: 'כמה שנים הילד/ה?',
    ageLabelDynamic: (name: string) => `כמה שנים ${name}?`,
    ageMeta: {
      '6-9':   { hint: 'מצוין! יש לנו מסלול מותאם ללומדים צעירים 🌱' },
      '10-14': { hint: 'מושלם! מסלול חטיבת הביניים שלנו מאוד יעיל ✨' },
      '15-18': { hint: 'מדהים! מתבגרים מגיבים במיוחד לגישת העצמאות 🚀' },
    } as Record<string, { hint: string }>,
    cta: 'המשך',
  },
  struggles: {
    stepLabel: 'שלב 2 · מציאת נקודות החיכוך',
    headline: (name: string) => `איזה חלק ביום דורש יותר אור עבור ${name}?`,
    subHeadline: 'סמנו את כל מה שרלוונטי — נתמקד בתוכנית שלכם ברגעים האלה.',
    empathyBadge: '💛 אתם לא לבד — 85% מההורים מתמודדים עם אותם רגעים.',
    cta: 'ניתוח האתגרים שלי',
    options: [
      { key: 'morning',     label: 'שגרת בוקר',         sub: 'המרוץ נגד השעון' },
      { key: 'homework',    label: 'שיעורי בית ופוקוס', sub: 'אילוף מפלצת הלמידה' },
      { key: 'transitions', label: 'מעברים ובית ספר',   sub: "האתגר של 'החלפת הילוכים'" },
      { key: 'initiation',  label: 'התחלת משימות',      sub: "שבירת מחסום ה'אני לא יכול'" },
    ],
  },
  analysis: {
    phrases: [
      (name: string) => `מנתחים את הפרופיל של ${name}...`,
      () => 'מתאימים אסטרטגיות...',
      () => 'בונים את מפת הדרכים ל-7 ימים...',
    ] as ((name: string) => string)[],
    engineCaption: 'מנוע האימון שלנו קורא את הבחירות שלך כדי לבנות את התוכנית המושלמת.',
  },
  motivators: {
    stepLabel: 'שלב 3 · המסלול המאושר',
    headline: (name: string) => `מה הכי מדליק את ${name}?`,
    subHeadline: 'חיזוק חיובי עובד הכי טוב כשהוא אישי.',
    cta: (name: string) => `ליצור את המסלול של ${name}`,
    options: [
      { key: 'gaming',     label: 'מסכים ומשחקים',    sub: 'משחקים, אפליקציות או תוכניות אהובות' },
      { key: 'movement',   label: 'תנועה ומשחק',      sub: 'משחק בחוץ, ספורט או פעילות אנרגטית' },
      { key: 'creative',   label: 'פרויקטים יצירתיים', sub: 'בנייה, ציור או יצירה דיגיטלית' },
      { key: 'connection', label: 'זמן איכות',         sub: 'זמן אחד-על-אחד או פעילויות משותפות' },
    ],
  },
  auth: {
    headline: (name: string) => `שמרו את התוכנית של ${name}!`,
    subHeadline: 'היכנסו כדי לראות את האסטרטגיה המותאמת אישית.',
    emailLabel: 'אימייל',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'סיסמה',
    passwordPlaceholder: '••••••••',
    nameLabel: 'השם שלך',
    namePlaceholder: 'לדוגמה: שרה',
    cta: 'יצירת חשבון וצפייה בתוכנית',
    ctaLogin: 'כניסה וצפייה בתוכנית',
    ctaLoading: 'מגדירים...',
    googleCta: 'המשך עם Google',
    divider: 'או',
    loginToggle: 'כבר יש לך חשבון? התחבר',
    signupToggle: 'אין לך חשבון? הירשם',
    errorFillFields: 'אנא מלא את כל השדות',
    errorPasswordMin: 'הסיסמה חייבת להכיל לפחות 6 תווים',
    errorGeneric: 'משהו השתבש. אנא נסה שוב.',
    successCreated: 'חשבון נוצר! טוען את התוכנית...',
    successLogin: 'ברוך הבא בחזרה! טוען את התוכנית...',
  },
  reveal: {
    loadingPhrases: [
      (name: string) => `מנתחים את הפרופיל של ${name}...`,
      () => 'מתאימים אסטרטגיות...',
      () => 'בונים את מפת הדרכים ל-7 ימים...',
    ] as ((name: string) => string)[],
    loadingCaption: 'מתאימים אישית את אסטרטגיית האימון',
    headline: (name: string) => `ההמתנה נגמרה! התוכנית החיובית של ${name} מוכנה.`,
    sub: (name: string) =>
      `בהתבסס על הפרופיל של ${name}, התאמנו 7 ימים ראשונים להפוך את השגרה היומית.`,
    planOverview: 'סקירת התוכנית',
    focusLabel: '🎯 הפוקוס',
    fuelLabel: '⚡ הדלק',
    allAreas: 'כל התחומים',
    allTypes: 'כל הסוגים',
    successForecast: 'תחזית הצלחה: ',
    forecast: {
      '6-9':   'הורים לילדים בגילאי 6–9 רואים ירידה של 40% בעימותים כבר בשבוע הראשון.',
      '10-14': 'הורים לילדים בגילאי 10–14 רואים ירידה של 40% בחיכוכים כבר בשבוע הראשון.',
      '15-18': 'הורים לילדים בגילאי 15–18 רואים שיפור של 35% ביוזמת משימות כבר בשבוע הראשון.',
    } as Record<string, string>,
    methodPill: 'אימון תפקודי ניהולי · גישת גשר הדופמין',
    cta: (name: string) => `פתיחת התוכנית המלאה של ${name}`,
    ctaLoading: 'מגדירים את לוח הבקרה…',
    trialDisclaimer: 'תקופת ניסיון של 7 ימים · ביטול בכל עת',
  },
  back: 'חזרה',
};

// ─── Runtime helpers ──────────────────────────────────────────────────────────

let _lang: OnboardingLang = 'en';

export function setOnboardingLang(lang: OnboardingLang) {
  _lang = lang;
}

export function getOnboardingLang(): OnboardingLang {
  return _lang;
}

/** Current translation object — call after setOnboardingLang() */
export function getT() {
  return _lang === 'he' ? HE : EN;
}

// Legacy named export — always returns EN for backward compat (used in existing code)
export const T = EN;

// Lookup maps
export const STRUGGLE_LABELS: Record<string, string> = Object.fromEntries(
  EN.struggles.options.map(o => [o.key, o.label])
);

export const MOTIVATION_LABELS: Record<string, string> = Object.fromEntries(
  EN.motivators.options.map(o => [o.key, o.label])
);

export function getStruggleLabels(lang: OnboardingLang) {
  const src = lang === 'he' ? HE : EN;
  return Object.fromEntries(src.struggles.options.map(o => [o.key, o.label]));
}

export function getMotivationLabels(lang: OnboardingLang) {
  const src = lang === 'he' ? HE : EN;
  return Object.fromEntries(src.motivators.options.map(o => [o.key, o.label]));
}
