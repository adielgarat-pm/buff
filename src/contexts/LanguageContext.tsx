import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'he' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations: Record<Language, Record<string, string>> = {
  he: {
    // General
    'app.tagline': 'כוח-העל לתפקודים הניהוליים',
    'app.syncProgress': 'התחבר כדי לסנכרן את ההתקדמות שלך',
    
    // Auth
    'auth.login': 'התחברות',
    'auth.signup': 'הרשמה',
    'auth.email': 'אימייל',
    'auth.password': 'סיסמה',
    'auth.displayName': 'שם תצוגה',
    'auth.yourName': 'השם שלך',
    'auth.iAm': 'אני...',
    'auth.parent': 'הורה',
    'auth.teen': 'נער/ה',
    'auth.familyCode': 'קוד משפחה',
    'auth.familyCodePlaceholder': 'הדבק כאן את הקוד מההורה',
    'auth.familyCodeHint': 'בקש מההורה שלך את קוד המשפחה כדי להצטרף.',
    'auth.loggingIn': 'מתחבר...',
    'auth.creatingAccount': 'יוצר חשבון...',
    'auth.connect': 'התחבר',
    'auth.createAccount': 'צור חשבון',
    'auth.fillAllFields': 'אנא מלא את כל השדות',
    'auth.passwordMinLength': 'הסיסמה חייבת להכיל לפחות 6 תווים',
    'auth.enterFamilyCode': 'אנא הזן את קוד המשפחה מההורה',
    'auth.invalidCredentials': 'אימייל או סיסמה שגויים',
    'auth.emailExists': 'אימייל זה כבר רשום במערכת',
    'auth.invalidFamilyCode': 'קוד משפחה לא תקין',
    'auth.welcomeBack': 'ברוך שובך!',
    'auth.accountCreated': 'החשבון נוצר בהצלחה! ברוך הבא למשפחה!',
    'auth.orContinueWith': 'או המשך עם',
    'auth.continueWithGoogle': 'התחבר עם גוגל',
    'auth.signupWithGoogle': 'הירשם עם גוגל',
    'auth.googleRoleSelection': 'לאחר ההתחברות תוכל לבחור אם להירשם כהורה או כילד',
    'auth.googleSetupRequired': 'כדי להשתמש בגוגל, יש להגדיר קודם פרטי משתמש',
    
    // Navigation
    'nav.features': 'תכונות',
    'nav.howItWorks': 'איך זה עובד',
    'nav.forParents': 'להורים',
    'nav.login': 'התחבר',
    'nav.getStarted': 'התחל עכשיו',
    
    // Landing Page
    'landing.basedOnCogFun': 'מבוסס על מודל Cog-Fun',
    'landing.executiveFunction': 'כוח-העל לתפקודים',
    'landing.powerUp': 'הניהוליים',
    'landing.heroDescription': 'שלוט בשגרה היומית עם אסטרטגיות Cog-Fun מבוססות מחקר, מותאמות למוח ה-ADHD.',
    'landing.tryFree': 'נסה BUFF בחינם',
    'landing.seeHow': 'ראה איך זה עובד',
    'landing.unlockBuffs': 'שחרר את הבאפים היומיים שלך',
    'landing.unlockDescription': 'כוחות קוגניטיביים שהופכים משימות מציפות לניצחונות ברי השגה.',
    'landing.activateBuffs': 'הפעל באפים יומיים',
    'landing.activateDescription': 'השתמש באסטרטגיות קוגניטיביות כדי לפרוץ שיתוק משימות ולכבוש משימות "הר" צעד אחר צעד.',
    'landing.familySync': 'סנכרון משפחתי',
    'landing.familySyncDescription': 'הגדרת יעדים משותפת כאשר ההורה הוא המאמן והנער הוא הגיבור של המסע שלו.',
    'landing.smartInsights': 'תובנות חכמות',
    'landing.smartInsightsDescription': 'לוח בקרה מבוסס נתונים שעוזר להורים לזהות דפוסים ולהציע תמיכה נכונה בזמן הנכון.',
    'landing.powerUpsFor': 'כוחות-על למוח ה-ADHD',
    'landing.powerUpsDescription': 'BUFF משתמש במודל Cog-Fun מבוסס מחקר כדי לספק אסטרטגיות קוגניטיביות מותאמות אישית בדיוק כשהנער שלך צריך אותן.',
    'landing.environmentBuffs': 'באפים סביבתיים',
    'landing.environmentDescription': 'בצע אופטימיזציה של המרחב שלך לריכוז והפחת הסחות חושיות.',
    'landing.focusBuffs': 'באפים לריכוז',
    'landing.focusDescription': 'פרק משימות מציפות להישגים קטנים.',
    'landing.energyBuffs': 'באפים לאנרגיה',
    'landing.energyDescription': 'טכניקות ויסות עצמי לניהול אנרגיה ורגשות.',
    'landing.forParentsTitle': 'להורים: היו המאמן, לא הבוס',
    'landing.forParentsDescription': 'BUFF מעצים הורים עם תובנות ואסטרטגיות לתמיכה בפיתוח התפקודים הניהוליים של הנער שלהם ללא ניהול מיקרו. שיתוף פעולה על פני שליטה.',
    'landing.patternRecognition': 'זיהוי דפוסים',
    'landing.patternDescription': 'זהה מתי ואיפה קורים קשיים כדי להציע תמיכה ממוקדת.',
    'landing.coachingTips': 'טיפים לאימון',
    'landing.coachingDescription': 'קבל הצעות מבוססות מחקר לתמיכה בנער שלך.',
    'landing.collaborativeGoals': 'יעדים משותפים',
    'landing.collaborativeDescription': 'הגדר פרסים ואבני דרך יחד כצוות.',
    'landing.readyToPowerUp': 'מוכנים להתחזק?',
    'landing.joinFamilies': 'הצטרפו למשפחות שהופכות שגרות יומיות לניצחונות ברי השגה.',
    'landing.startFreeTrial': 'התחל תקופת ניסיון חינם',
    'landing.researchBacked': 'מבוסס על מודל Cog-Fun — אסטרטגיות קוגניטיביות מבוססות מחקר',
    
    // Dashboard
    'dashboard.dailyXP': 'XP יומי',
    'dashboard.todaysTasks': 'משימות היום',
    'dashboard.completed': 'הושלמו',
    'dashboard.pending': 'ממתינות',
    'dashboard.buffActivated': 'באף הופעל!',
    'dashboard.noTasks': 'אין משימות להיום',
    
    // Tasks
    'task.morning': 'בוקר',
    'task.afternoon': 'צהריים',
    'task.evening': 'ערב',
    'task.medication': 'תרופות',
    'task.hygiene': 'היגיינה',
    'task.nutrition': 'תזונה',
    'task.school': 'לימודים',
    
    // Settings
    'settings.title': 'הגדרות',
    'settings.general': 'כללי',
    'settings.language': 'שפה',
    'settings.hebrew': 'עברית',
    'settings.english': 'English',
    'settings.dailyGoal': 'יעד יומי',
    'settings.appTitle': 'כותרת האפליקציה',
    'settings.lessonReminders': 'תזכורות שיעורים',
    'settings.save': 'שמור',
    'settings.cancel': 'ביטול',
    'settings.parentSettings': 'הגדרות הורה',
    'settings.signOut': 'התנתק',
    
    // Parent Mode
    'parent.overview': 'סקירה',
    'parent.children': 'ילדים',
    'parent.tasks': 'משימות',
    'parent.timetable': 'מערכת שעות',
    'parent.rewards': 'פרסים',
    'parent.insights': 'תובנות',
    'parent.familyCode': 'קוד משפחה',
    'parent.shareCode': 'שתף קוד',
    'parent.sendToChild': 'שלח לילד',
    'parent.noChildren': 'אין ילדים רשומים עדיין',
    'parent.inviteChild': 'הזמן ילד להצטרף למשפחה',
    
    // Rewards Store
    'store.title': 'חנות פרסים',
    'store.subtitle': 'מימוש הקרדיטים שצברת',
    'store.balance': 'יתרה',
    'store.totalBalance': 'סה״כ יתרה',
    'store.claim': 'מימוש',
    'store.claimed': 'מומש',
    'store.locked': 'נעול',
    'store.notEnough': 'אין מספיק קרדיטים',
    'store.availableRewards': 'פרסים זמינים',
    'store.claimedRewards': 'פרסים שמומשו',
    'store.noRewards': 'אין פרסים עדיין',
    'store.askParent': 'בקש מההורה להוסיף פרסים מגניבים!',
    'store.credits': 'קרדיטים',
    
    // Navigation tabs
    'nav.tasks': 'משימות',
    'nav.timetable': 'מערכת',
    'nav.store': 'חנות',
    'nav.settings': 'הגדרות',
    
    // Focus Fuel
    'fuel.charging': 'רמת מיקוד: נטען...',
    'fuel.halfway': 'חצי דרך! מצוין!',
    'fuel.almostFull': 'כמעט שם! המשך כך!',
    'fuel.full': 'טעון במלואו! זמן להפסקה?',
    'fuel.skillBadge': 'תג כישורים',
    'fuel.buffs': 'באפים',
    'fuel.dailyReset': 'המד מתאפס כל בוקר - כל יום הוא התחלה חדשה!',
    
    // Progress (legacy)
    'progress.dailyXP': 'XP יומי',
    'progress.levelComplete': 'הרמה הושלמה! 🎉',
    'progress.keepGoing': 'המשך להתחזק!',
    'progress.level': 'רמה',
    'progress.maxLevel': 'רמה מקסימלית!',
    
    // Focus Mode
    'focus.active': '🎯 מצב מיקוד פעיל',
    'focus.completeFirst': 'סיים את המשימה הזו לפני שתמשיך הלאה',
    'focus.allComplete': 'כל המשימות הושלמו!',
    'focus.greatWork': 'עבודה מצוינת! אתה יכול לעבור לשלב הבא.',
    'focus.remaining': 'משימות נותרו',
    
    // Common
    'common.loading': 'טוען...',
    'common.error': 'שגיאה',
    'common.success': 'הצלחה',
    'common.confirm': 'אישור',
    'common.delete': 'מחק',
    'common.edit': 'ערוך',
    'common.add': 'הוסף',
    'common.close': 'סגור',
    'common.credits': 'קרדיטים',
    'common.xp': 'XP',
    'tasks': 'משימות',
    'noTasksForPhase': 'אין משימות לשלב הזה',
  },
  en: {
    // General
    'app.tagline': 'Your Executive Function Power-up',
    'app.syncProgress': 'Sign in to sync your progress across devices',
    
    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.displayName': 'Display Name',
    'auth.yourName': 'Your name',
    'auth.iAm': 'I am a...',
    'auth.parent': 'Parent',
    'auth.teen': 'Teen',
    'auth.familyCode': 'Family Code',
    'auth.familyCodePlaceholder': 'Paste the code from your parent',
    'auth.familyCodeHint': 'Ask your parent for the family code to join their family.',
    'auth.loggingIn': 'Signing in...',
    'auth.creatingAccount': 'Creating account...',
    'auth.connect': 'Power Up',
    'auth.createAccount': 'Create Account',
    'auth.fillAllFields': 'Please fill in all fields',
    'auth.passwordMinLength': 'Password must be at least 6 characters',
    'auth.enterFamilyCode': 'Please enter the family code from your parent',
    'auth.invalidCredentials': 'Invalid email or password',
    'auth.emailExists': 'This email is already registered',
    'auth.invalidFamilyCode': 'Invalid family code format',
    'auth.welcomeBack': 'Welcome back!',
    'auth.accountCreated': 'Account created! Welcome to the family!',
    'auth.orContinueWith': 'or continue with',
    'auth.continueWithGoogle': 'Sign in with Google',
    'auth.signupWithGoogle': 'Sign up with Google',
    'auth.googleRoleSelection': 'After signing in, you can choose to register as a parent or child',
    'auth.googleSetupRequired': 'To use Google login, please set up your user details first',
    
    // Navigation
    'nav.features': 'Features',
    'nav.howItWorks': 'How It Works',
    'nav.forParents': 'For Parents',
    'nav.login': 'Log In',
    'nav.getStarted': 'Get Started',
    
    // Landing Page
    'landing.basedOnCogFun': 'Based on the Cog-Fun Model',
    'landing.executiveFunction': 'The Executive Function',
    'landing.powerUp': 'Power-up',
    'landing.heroDescription': 'Master your daily routine with research-based Cog-Fun strategies designed for the ADHD brain.',
    'landing.tryFree': 'Try BUFF for Free',
    'landing.seeHow': 'See How It Works',
    'landing.unlockBuffs': 'Unlock Your Daily Buffs',
    'landing.unlockDescription': 'Cognitive power-ups that transform overwhelming tasks into achievable victories.',
    'landing.activateBuffs': 'Activate Daily Buffs',
    'landing.activateDescription': 'Use cognitive strategies to break through task paralysis and conquer "Mountain" assignments one step at a time.',
    'landing.familySync': 'Family Sync',
    'landing.familySyncDescription': 'Collaborative goal setting where the parent is the coach and the teen is the hero of their own journey.',
    'landing.smartInsights': 'Smart Insights',
    'landing.smartInsightsDescription': 'A data-driven dashboard that helps parents identify patterns and offer the right support at the right time.',
    'landing.powerUpsFor': 'Power-ups for the ADHD Brain',
    'landing.powerUpsDescription': 'BUFF uses the research-backed Cog-Fun model to provide personalized cognitive strategies exactly when your teen needs them most.',
    'landing.environmentBuffs': 'Environment Buffs',
    'landing.environmentDescription': 'Optimize your space for focus and reduce sensory distractions.',
    'landing.focusBuffs': 'Focus Buffs',
    'landing.focusDescription': 'Break down overwhelming tasks into micro-achievements.',
    'landing.energyBuffs': 'Energy Buffs',
    'landing.energyDescription': 'Self-regulation techniques to manage energy and emotions.',
    'landing.forParentsTitle': 'For Parents: Be the Coach, Not the Boss',
    'landing.forParentsDescription': 'BUFF empowers parents with insights and strategies to support their teen\'s executive function development without micromanaging. Collaboration over control.',
    'landing.patternRecognition': 'Pattern Recognition',
    'landing.patternDescription': 'Identify when and where struggles happen to offer targeted support.',
    'landing.coachingTips': 'Coaching Tips',
    'landing.coachingDescription': 'Receive research-based suggestions for supporting your teen.',
    'landing.collaborativeGoals': 'Collaborative Goals',
    'landing.collaborativeDescription': 'Set rewards and milestones together as a team.',
    'landing.readyToPowerUp': 'Ready to Power Up?',
    'landing.joinFamilies': 'Join families who are transforming daily routines into achievable victories.',
    'landing.startFreeTrial': 'Start Your Free Trial',
    'landing.researchBacked': 'Based on the Cog-Fun Model — Research-backed cognitive strategies',
    
    // Dashboard
    'dashboard.dailyXP': 'Daily XP',
    'dashboard.todaysTasks': "Today's Tasks",
    'dashboard.completed': 'Completed',
    'dashboard.pending': 'Pending',
    'dashboard.buffActivated': 'Buff Activated!',
    'dashboard.noTasks': 'No tasks for today',
    
    // Tasks
    'task.morning': 'Morning',
    'task.afternoon': 'Afternoon',
    'task.evening': 'Evening',
    'task.medication': 'Medication',
    'task.hygiene': 'Hygiene',
    'task.nutrition': 'Nutrition',
    'task.school': 'School',
    
    // Settings
    'settings.title': 'Settings',
    'settings.general': 'General',
    'settings.language': 'Language',
    'settings.hebrew': 'עברית',
    'settings.english': 'English',
    'settings.dailyGoal': 'Daily Goal',
    'settings.appTitle': 'App Title',
    'settings.lessonReminders': 'Lesson Reminders',
    'settings.save': 'Save',
    'settings.cancel': 'Cancel',
    'settings.parentSettings': 'Parent Settings',
    'settings.signOut': 'Sign Out',
    
    // Parent Mode
    'parent.overview': 'Overview',
    'parent.children': 'Children',
    'parent.tasks': 'Tasks',
    'parent.timetable': 'Timetable',
    'parent.rewards': 'Rewards',
    'parent.insights': 'Insights',
    'parent.familyCode': 'Family Code',
    'parent.shareCode': 'Share Code',
    'parent.sendToChild': 'Send to Child',
    'parent.noChildren': 'No children registered yet',
    'parent.inviteChild': 'Invite a child to join the family',
    
    // Rewards Store
    'store.title': 'Rewards Store',
    'store.subtitle': 'Redeem your earned credits',
    'store.balance': 'Balance',
    'store.totalBalance': 'Total Balance',
    'store.claim': 'Redeem',
    'store.claimed': 'Claimed',
    'store.locked': 'Locked',
    'store.notEnough': 'Not enough credits',
    'store.availableRewards': 'Available Rewards',
    'store.claimedRewards': 'Claimed Rewards',
    'store.noRewards': 'No Rewards Yet',
    'store.askParent': 'Ask your parent to add some awesome rewards!',
    'store.credits': 'credits',
    
    // Navigation tabs
    'nav.tasks': 'Tasks',
    'nav.timetable': 'Timetable',
    'nav.store': 'Store',
    'nav.settings': 'Settings',
    
    // Focus Fuel
    'fuel.charging': 'Focus Level: Charging...',
    'fuel.halfway': 'Halfway there! Excellent!',
    'fuel.almostFull': 'Almost there! Keep going!',
    'fuel.full': 'Fully Charged! Time for a break?',
    'fuel.skillBadge': 'Skill Badge',
    'fuel.buffs': 'Buffs',
    'fuel.dailyReset': 'Meter resets every morning - every day is a fresh start!',
    
    // Progress (legacy)
    'progress.dailyXP': 'Daily XP',
    'progress.levelComplete': 'Level Complete! 🎉',
    'progress.keepGoing': 'Keep powering up!',
    'progress.level': 'Level',
    'progress.maxLevel': 'Max Level!',
    
    // Focus Mode
    'focus.active': '🎯 Focus Mode Active',
    'focus.completeFirst': 'Complete this task before moving on',
    'focus.allComplete': 'All Tasks Complete!',
    'focus.greatWork': 'Great work! You can move to the next phase.',
    'focus.remaining': 'tasks remaining',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.close': 'Close',
    'common.credits': 'Credits',
    'common.xp': 'XP',
    'tasks': 'Tasks',
    'noTasksForPhase': 'No tasks for this phase',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('buff-language');
    return (saved as Language) || 'he';
  });

  useEffect(() => {
    localStorage.setItem('buff-language', language);
    // Set document direction
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'he';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
