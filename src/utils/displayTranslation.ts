/**
 * Display-time translation for known starter-pack task & reward titles.
 * Maps Hebrew DB-stored titles → English equivalents so existing users
 * see English when the interface is set to English, without touching DB data.
 */

const HE_TO_EN: Record<string, string> = {
  // Starter pack tasks
  'הכנה לשיעור': 'Class Prep',
  'הקשבה פעילה': 'Active Listening',
  'רישום שיעורי בית': 'Record Homework',
  'בדיקה אם יש שיעורי בית': 'Check for Homework',
  'השלמת שיעורי בית': 'Complete Homework',
  'משימה אקדמית בונוס': 'Bonus Academic Task',
  'מוכן בזמן': 'Ready on Time',
  'צחצוח שיניים': 'Brush Teeth',
  'ארוחת בוקר בריאה': 'Healthy Breakfast',
  'תרופות': 'Medication',
  'כיבוי מסכים': 'Screens Off',
  'מקלחת וצחצוח': 'Shower & Teeth',
  'שינה בזמן': 'Bed on Time',
  'הליכה קצרה': 'Short Walk',
  'ספורט קצר': 'Short Sport',
  'ספורט ארוך': 'Long Sport',
  'שתייה': 'Hydration',
  'חטיף בריא': 'Healthy Snack',
  'משחק ללא מסכים': 'Screen-free Play',
};

const EN_TO_HE: Record<string, string> = Object.fromEntries(
  Object.entries(HE_TO_EN).map(([he, en]) => [en, he])
);

/**
 * Translates a known title for display purposes only.
 * Returns the original title if no translation is found.
 */
export function translateTitle(title: string, language: 'he' | 'en'): string {
  if (language === 'en') {
    return HE_TO_EN[title] || title;
  }
  // If interface is Hebrew but title is in English
  return EN_TO_HE[title] || title;
}
