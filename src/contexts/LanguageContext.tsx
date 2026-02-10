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
    'app.tagline': 'באף את השגרה, שחרר את הפוטנציאל',
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
    'landing.basedOnCogFun': 'מבוסס על עקרונות תפקודים ניהוליים',
    'landing.executiveFunction': 'כוח-העל לתפקודים',
    'landing.powerUp': 'הניהוליים',
    'landing.heroDescription': 'שלוט בשגרה היומית עם אסטרטגיות מקצועיות מבוססות מחקר, מותאמות למוח ה-ADHD.',
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
    'landing.powerUpsDescription': 'BUFF משתמש בגישה מקצועית לחיזוק תפקודים ניהוליים כדי לספק אסטרטגיות קוגניטיביות מותאמות אישית בדיוק כשהנער שלך צריך אותן.',
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
    'landing.researchBacked': 'מבוסס על עקרונות לחיזוק תפקודים ניהוליים — אסטרטגיות קוגניטיביות מבוססות מחקר',
    
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
    'store.vaultEmpty': 'הכספת ריקה',
    'store.askParentToAdd': 'בקש מההורה להוסיף פרסים למסע שלך!',
    'store.credits': 'קרדיטים',
    'store.rewardPurchased': '🎉 פרס נרכש!',
    'store.enjoy': 'תהנה!',
    'store.unclaim': 'ביטול מימוש',
    'store.unclaimConfirmTitle': '↩️ ביטול מימוש?',
    'store.unclaimConfirmDesc': 'יחזור לחנות',
    'store.unclaimCreditsReturn': 'נקודות יוחזרו ליתרה',
    'store.unclaimSuccess': '↩️ פרס הוחזר',
    'store.unclaimCreditsReturned': 'נקודות הוחזרו',
    'store.confirmCancel': 'ביטול',
    'store.confirmOk': 'אישור',
    
    // Navigation tabs
    'nav.tasks': 'משימות',
    'nav.timetable': 'מערכת',
    'nav.progress': 'התקדמות',
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
    'fuel.offDay': '🌴 יום חופש',
    'fuel.schoolDay': '📚 יום לימודים',
    'fuel.goal': 'יעד',
    'fuel.goalOf': 'מ-',
    
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
    'common.loadingDataFor': 'טוען נתונים עבור',
    'common.child': 'ילד',
    'common.error': 'שגיאה',
    'common.success': 'הצלחה',
    'common.confirm': 'אישור',
    'common.delete': 'מחק',
    'common.edit': 'ערוך',
    'common.add': 'הוסף',
    'common.close': 'סגור',
    'common.credits': 'קרדיטים',
    'common.xp': 'XP',
    'common.backToTasks': 'חזרה למשימות',
    'tasks': 'משימות',
    'noTasksForPhase': 'אין משימות לשלב הזה',
    
    // Legal
    'legal.title': 'הבהרה משפטית',
    'legal.disclaimer': 'הבהרה חשובה: האפליקציה Buff היא כלי טכנולוגי לניהול משימות והתארגנות, שפותח על בסיס ניסיון אישי וכלים מעולם ניהול המוצר וההורות. השימוש באפליקציה, ובכלל זה ה"תובנות" המופיעות בה, נועד למטרות העשרה וסיוע בלבד ואינו מהווה תחליף לייעוץ רפואי, פסיכולוגי, אבחוני או טיפולי מקצועי. יוצרת האפליקציה אינה מטפלת מוסמכת, רופאה או פסיכולוגית. בכל שאלה הנוגעת לבריאותו הגופנית או הנפשית של ילדכם, יש להיוועץ באנשי מקצוע מוסמכים. השימוש באפליקציה הוא באחריות המשתמש בלבד.',
    'legal.termsLink': 'תנאי השימוש וההבהרה המשפטית',
    'legal.footerLink': 'הבהרה משפטית',
    'legal.consentText': 'בעצם ההתחברות אני מאשר את',
    
    // Welcome Banner
    'welcome.title': 'ברוכים הבאים ל-BUFF',
    'welcome.message': 'הכנו לך כמה משימות התחלתיות לשגרה היומית. אתה יכול להתאים אותן בכל עת דרך ההגדרות!',
    'welcome.tasksReady': '✨ 8 משימות מוכנות ומחכות לך!',
    'welcome.letsGo': 'בוא נתחיל!',

    // Phase Transition Banner
    'phase.schoolEnded': '🎉 יום הלימודים הסתיים!',
    'phase.switchToAfternoon': 'עוברים למשימות צהריים',
    'phase.schoolStarted': '📚 הגיע הזמן ללימודים!',
    'phase.switchToSchool': 'עוברים ליום לימודים',
    'phase.transition': 'מעבר שלב',

    // New Day Banner
    'newDay.title': 'בוקר טוב!',
    'newDay.subtitle': 'המשימות החדשות מוכנות. יום חדש, הזדמנויות חדשות! 🚀',

    // Birthday Celebration
    'birthday.title': '🎉 יום הולדת שמח! 🎉',
    'birthday.forYou': 'לך!',
    'birthday.years': 'שנים!',
    'birthday.wish': 'שיהיה לך יום מדהים מלא בשמחה והצלחות! ✨',
    'birthday.thanks': 'תודה! 🥳',

    // View As Child Banner
    'viewAsChild.viewing': 'צפייה כ-',
    'viewAsChild.backToParent': 'חזרה להורה',

    // Gear Master
    'gear.nightMission': 'משימת ערב - בונוס מוכנות!',
    'gear.morningReminder': 'תזכורת בוקר - בדיקת תיק',
    'gear.bagReady': 'התיק מוכן! ✨',
    'gear.prepTomorrow': 'סידור ציוד למחר עכשיו',
    'gear.checkBag': 'בדיקה שהכל בתיק לפני היציאה',
    'gear.tomorrowOff': 'מחר יום חופש! 🎉',
    'gear.noScheduleTomorrow': 'אין מערכת למחר 📋',
    'gear.noBagPrep': 'אין צורך להכין תיק - תהנה מהמנוחה!',
    'gear.addSchedule': 'הוסיפו מערכת שעות דרך הגדרות ההורה כדי להפעיל את משימת הערב.',
    'gear.nightCompleted': 'משימת ערב - הושלמה! 🌟',
    'gear.bagReadyCredits': 'התיק מוכן למחר - נצברו',
    'gear.noSpecialEquipment': 'אין ציוד מיוחד נדרש',
    'gear.bagComplete': 'סידור תיק הושלם!',
    'gear.credits': 'קרדיטים',
    'gear.nightMissionComplete': '🎒 משימת הערב הושלמה!',
    'gear.nightMissionCompleteDesc': 'מעולה! סידור התיק מראש הביא',
    'gear.undo': 'בטל (5 שניות)',
    'gear.undone': '↩️ בוטל',
    'gear.undoneDesc': 'משימת הערב בוטלה',
    'gear.markAll': 'סימון כל הפריטים',
    'gear.itemsReady': 'פריטים מוכנים',
    'gear.eveningPrep': '🧹 הכנות ערב:',
    'gear.equipmentNeeded': '🎒 ציוד נדרש לשיעורים:',
    'gear.lunchboxReset': 'איפוס יומי: פינוי וניקוי תיק האוכל (קופסה למדיח/פח)',
    'gear.prepNow': 'סידור ציוד עכשיו!',
    'gear.noPoints': 'ללא נקודות',
    'gear.morningCheck': 'בדיקה שהכל בתיק לפני היציאה!',
    'gear.morningTip': '💡 טיפ: סידור תיק בערב הקודם מזכה בנקודות!',
    'gear.equipmentRequired': 'ציוד נדרש',

    // Daily Essentials
    'essentials.title': 'לפני היציאה מהבית',
    'essentials.noPoints': 'ללא נקודות',
    'essentials.allReady': 'הכל מוכן ליציאה! 🚀',
    'essentials.waterBottle': 'בקבוק מים',
    'essentials.food': 'אוכל/כריך',
    'essentials.phone': 'טלפון',
    'essentials.keys': 'מפתחות',

    // My Progress
    'myProgress.title': 'ההתקדמות שלי',
    'myProgress.weeklySummary': 'סיכום שבועי',
    'myProgress.weeklyMomentum': 'מומנטום שבועי',
    'myProgress.noActiveTasks': 'אין משימות פעילות כרגע',
    'myProgress.rechargeTime': 'זמן מצוין להטעין מצברים! 🔋✨',
    'myProgress.outOf7': 'מתוך 7 ✓',

    // Weekly Goal Ring
    'weeklyGoal.title': 'יעד שבועי',
    'weeklyGoal.outOf': 'מתוך',
    'weeklyGoal.perfect': '🏆 מושלם!',
    'weeklyGoal.goalReached': '🎯 הגעת ליעד!',
    'weeklyGoal.almostThere': '💪 כמעט שם!',
    'weeklyGoal.keepGoing': '🚀 המשך/י כך!',
    'weeklyGoal.progress': 'התקדמות',
    'weeklyGoal.goal70': 'יעד 70%',

    // Ticket Wallet
    'tickets.title': 'ארנק כרטיסים',
    'tickets.available': 'זמינים',
    'tickets.rest': 'מנוחה',
    'tickets.none': '😴 אין כרטיסי מנוחה זמינים',
    'tickets.oneLeft': '🌟 נשאר כרטיס מנוחה אחד!',
    'tickets.multiple': '✨ יש לך כרטיסי מנוחה',
    'tickets.infoTitle': 'איך עובדים כרטיסי מנוחה?',
    'tickets.rule1': 'כל',
    'tickets.rule1Tasks': '5 משימות',
    'tickets.rule1End': 'שהשלמת בהצלחה מזכות אותך בכרטיס מנוחה אחד.',
    'tickets.rule2': 'אפשר להשתמש בכרטיס כדי',
    'tickets.rule2Skip': '"לדלג"',
    'tickets.rule2End': 'על יום בלי לפגוע במטרה השבועית שלך (ה-70%).',
    'tickets.rule3': 'מנוחה היא חלק מהאימון! 💪',
    'tickets.rule3Tip': 'השתמש בהם בחוכמה בימים עמוסים.',
    'tickets.gotIt': 'הבנתי! 🚀',

    // School Day Section
    'school.equipmentRequired': 'ציוד נדרש',
    
    // DailySchedule
    'schedule.todaysSchedule': 'מערכת שעות להיום',
    'schedule.weekend': 'סוף שבוע - אין שיעורים',
    'schedule.enjoyWeekend': '🎉 שבת שלום!',
    'schedule.noSubjects': 'לא נקבעו מקצועות',
    'schedule.setupTimetable': 'הגדירו מערכת שעות דרך ממשק ההורה כדי לראות את לוח הזמנים.',
    'schedule.lessons': 'שיעורים',
    'schedule.period': 'שיעור',
    'schedule.now': 'עכשיו',

    // Brand Terminology (Buff Positive Coaching DNA)
    'brand.holdingSpace': 'הכלה',
    'brand.boundaries': 'גבולות',
    'brand.strategies': 'כלים',
    'brand.coaching': 'אימון',
    'brand.readiness': 'בשלות',
    'brand.positiveReinforcement': 'חיזוק חיובי',
  },
  en: {
    // General
    'app.tagline': 'Buff your routine, unlock your potential',
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
    'landing.basedOnCogFun': 'Based on Executive Function Principles',
    'landing.executiveFunction': 'The Executive Function',
    'landing.powerUp': 'Power-up',
    'landing.heroDescription': 'Master your daily routine with research-based strategies designed for the ADHD brain.',
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
    'landing.powerUpsDescription': 'BUFF uses a professional, research-backed approach to provide personalized cognitive strategies exactly when your teen needs them most.',
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
    'landing.researchBacked': 'Based on Executive Function Principles — Research-backed cognitive strategies',
    
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
    'store.vaultEmpty': 'The Vault is Empty',
    'store.askParentToAdd': 'Ask your parent to add rewards to your quest!',
    'store.credits': 'credits',
    'store.rewardPurchased': '🎉 Reward Claimed!',
    'store.enjoy': 'Enjoy!',
    'store.unclaim': 'Unclaim',
    'store.unclaimConfirmTitle': '↩️ Unclaim Reward?',
    'store.unclaimConfirmDesc': 'will return to the store',
    'store.unclaimCreditsReturn': 'credits will be refunded',
    'store.unclaimSuccess': '↩️ Reward Returned',
    'store.unclaimCreditsReturned': 'credits refunded',
    'store.confirmCancel': 'Cancel',
    'store.confirmOk': 'Confirm',
    
    // Navigation tabs
    'nav.tasks': 'Tasks',
    'nav.timetable': 'Timetable',
    'nav.progress': 'Progress',
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
    'fuel.offDay': '🌴 Off Day',
    'fuel.schoolDay': '📚 School Day',
    'fuel.goal': 'Goal',
    'fuel.goalOf': 'of',
    
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
    'common.loadingDataFor': 'Loading data for',
    'common.child': 'child',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.close': 'Close',
    'common.credits': 'Credits',
    'common.xp': 'XP',
    'common.backToTasks': 'Back to Tasks',
    'tasks': 'Tasks',
    'noTasksForPhase': 'No tasks for this phase',
    
    // Legal
    'legal.title': 'Legal Disclaimer',
    'legal.disclaimer': 'Important Disclaimer: The Buff app is a technological tool for task management and organization, developed based on personal experience and tools from product management and parenting. The use of the app, including the "insights" it provides, is intended for enrichment and assistance purposes only and does not constitute a substitute for medical, psychological, diagnostic, or professional therapeutic advice. The app\'s creator is not a licensed therapist, doctor, or psychologist. For any questions regarding your child\'s physical or mental health, please consult qualified professionals. Use of the app is at the user\'s sole responsibility.',
    'legal.termsLink': 'Terms of Use and Legal Disclaimer',
    'legal.footerLink': 'Legal Disclaimer',
    'legal.consentText': 'By signing in, I agree to the',
    
    // Welcome Banner
    'welcome.title': 'Welcome to BUFF',
    'welcome.message': 'We\'ve set up some starter quests for your daily routine. You can customize them anytime in the settings!',
    'welcome.tasksReady': '✨ 8 quests ready and waiting!',
    'welcome.letsGo': 'Let\'s Go!',

    // Phase Transition Banner
    'phase.schoolEnded': '🎉 School Day is Over!',
    'phase.switchToAfternoon': 'Switching to Afternoon tasks',
    'phase.schoolStarted': '📚 Time for School!',
    'phase.switchToSchool': 'Switching to School Day',
    'phase.transition': 'Phase Transition',

    // New Day Banner
    'newDay.title': 'Good Morning!',
    'newDay.subtitle': 'New Quests are ready. Fresh day, new opportunities! 🚀',

    // Birthday Celebration
    'birthday.title': '🎉 Happy Birthday! 🎉',
    'birthday.forYou': 'you!',
    'birthday.years': 'years!',
    'birthday.wish': 'Wishing you an amazing day full of joy and achievements! ✨',
    'birthday.thanks': 'Thanks! 🥳',

    // View As Child Banner
    'viewAsChild.viewing': 'Viewing as ',
    'viewAsChild.backToParent': 'Back to Parent',

    // Gear Master
    'gear.nightMission': 'Night Mission - Readiness Bonus!',
    'gear.morningReminder': 'Morning Reminder - Bag Check',
    'gear.bagReady': 'Bag is ready! ✨',
    'gear.prepTomorrow': 'Prepare gear for tomorrow now',
    'gear.checkBag': 'Make sure everything is in the bag before leaving',
    'gear.tomorrowOff': 'Tomorrow is a day off! 🎉',
    'gear.noScheduleTomorrow': 'No schedule for tomorrow 📋',
    'gear.noBagPrep': 'No need to prepare a bag - enjoy the rest!',
    'gear.addSchedule': 'Add a timetable in Parent Settings to enable the Night Mission.',
    'gear.nightCompleted': 'Night Mission - Complete! 🌟',
    'gear.bagReadyCredits': 'Bag is ready for tomorrow - earned',
    'gear.noSpecialEquipment': 'No special equipment needed',
    'gear.bagComplete': 'Bag prep complete!',
    'gear.credits': 'credits',
    'gear.nightMissionComplete': '🎒 Night Mission Complete!',
    'gear.nightMissionCompleteDesc': 'Great work! Preparing the bag early earned',
    'gear.undo': 'Undo (5 seconds)',
    'gear.undone': '↩️ Undone',
    'gear.undoneDesc': 'Night Mission was undone',
    'gear.markAll': 'Check all items',
    'gear.itemsReady': 'items ready',
    'gear.eveningPrep': '🧹 Evening Prep:',
    'gear.equipmentNeeded': '🎒 Equipment needed for lessons:',
    'gear.lunchboxReset': 'Daily Reset: Empty and clean lunch bag (container to dishwasher/trash)',
    'gear.prepNow': 'Prepare gear now!',
    'gear.noPoints': 'No points',
    'gear.morningCheck': 'Check that everything is in the bag before leaving!',
    'gear.morningTip': '💡 Tip: Preparing the bag the night before earns points!',
    'gear.equipmentRequired': 'Equipment Required',

    // Daily Essentials
    'essentials.title': 'Before Leaving the House',
    'essentials.noPoints': 'No points',
    'essentials.allReady': 'All set to go! 🚀',
    'essentials.waterBottle': 'Water Bottle',
    'essentials.food': 'Food/Sandwich',
    'essentials.phone': 'Phone',
    'essentials.keys': 'Keys',

    // My Progress
    'myProgress.title': 'My Progress',
    'myProgress.weeklySummary': 'Weekly Summary',
    'myProgress.weeklyMomentum': 'Weekly Momentum',
    'myProgress.noActiveTasks': 'No active tasks right now',
    'myProgress.rechargeTime': 'Great time to recharge! 🔋✨',
    'myProgress.outOf7': 'of 7 ✓',

    // Weekly Goal Ring
    'weeklyGoal.title': 'Weekly Goal',
    'weeklyGoal.outOf': 'of',
    'weeklyGoal.perfect': '🏆 Perfect!',
    'weeklyGoal.goalReached': '🎯 Goal Reached!',
    'weeklyGoal.almostThere': '💪 Almost There!',
    'weeklyGoal.keepGoing': '🚀 Keep Going!',
    'weeklyGoal.progress': 'Progress',
    'weeklyGoal.goal70': 'Goal 70%',

    // Ticket Wallet
    'tickets.title': 'Ticket Wallet',
    'tickets.available': 'available',
    'tickets.rest': 'Rest',
    'tickets.none': '😴 No rest tickets available',
    'tickets.oneLeft': '🌟 One rest ticket left!',
    'tickets.multiple': '✨ You have rest tickets',
    'tickets.infoTitle': 'How do Rest Tickets work?',
    'tickets.rule1': 'Every',
    'tickets.rule1Tasks': '5 tasks',
    'tickets.rule1End': 'you complete successfully earn you one rest ticket.',
    'tickets.rule2': 'You can use a ticket to',
    'tickets.rule2Skip': '"skip"',
    'tickets.rule2End': 'a day without hurting your weekly goal (the 70%).',
    'tickets.rule3': 'Rest is part of the coaching! 💪',
    'tickets.rule3Tip': 'Use them wisely on busy days.',
    'tickets.gotIt': 'Got it! 🚀',

    // School Day Section
    'school.equipmentRequired': 'Equipment Required',
    
    // DailySchedule
    'schedule.todaysSchedule': "Today's Schedule",
    'schedule.weekend': 'Weekend - No classes',
    'schedule.enjoyWeekend': '🎉 Enjoy your weekend!',
    'schedule.noSubjects': 'No subjects set',
    'schedule.setupTimetable': 'Set up your timetable in Parent Mode to see your daily schedule.',
    'schedule.lessons': 'lessons',
    'schedule.period': 'Period',
    'schedule.now': 'Now',

    // Brand Terminology (Buff Positive Coaching DNA)
    'brand.holdingSpace': 'Holding Space',
    'brand.boundaries': 'Boundaries',
    'brand.strategies': 'Strategies',
    'brand.coaching': 'Coaching',
    'brand.readiness': 'Readiness',
    'brand.positiveReinforcement': 'Positive Reinforcement',
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
