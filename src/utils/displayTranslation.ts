/**
 * Display-time translation for known starter-pack task & reward titles.
 * Maps Hebrew DB-stored titles → English equivalents so existing users
 * see English when the interface is set to English, without touching DB data.
 */

const HE_TO_EN: Record<string, string> = {
  // Default trigger tasks (create_default_tasks_for_child)
  'התלבשות ונעליים': 'Get Dressed & Shoes',
  'ארוחת בוקר ותרופות': 'Breakfast & Meds',
  'בדיקת תיק': 'Bag Check',
  'פריקת תיק': 'Unpack Bag',
  'התחלת שיעורי בית': 'Start Homework',
  'הכנה למחר': 'Prepare for Tomorrow',
  'כיבוי מסכים שעה לפני השינה': 'Screens Off 1hr Before Bed',
  'מקלחת וצחצוח שיניים': 'Shower & Brush Teeth',

  // Starter pack tasks
  'הכנה לשיעור': 'Class Prep',
  'הקשבה פעילה': 'Active Listening',
  'רישום שיעורי בית': 'Record Homework',
  'בדיקה אם יש שיעורי בית': 'Check for Homework',
  'השלמת שיעורי בית': 'Complete Homework',
  'הכנת שיעורי בית': 'Homework Preparation',
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
  'לפתור תרגיל אחד': 'Solve One Exercise',
  'שיעורי בית': 'Homework',

  // Common variant titles
  'ארוחת בוקר': 'Breakfast',
  'נטילת תרופה': 'Take Medication',
  'נטילת תרופת ערב': 'Evening Medication',
  'מקלחת': 'Shower',
  'סידור מיטה וחדר': 'Make Bed & Tidy Room',
  'קריאת ספר': 'Read a Book',
  'עזרה בבית': 'Help at Home',
  'כיבוי מסכים בזמן': 'Screens Off on Time',
  'כיבוי מסכים חצי שעה לפני השינה': 'Screens Off 30min Before Bed',
  'כיבוי טלפון עד 20:30': 'Phone Off by 20:30',
  'הוצאת קופסת אוכל': 'Take Out Lunch Box',
  'יציאה בזמן לבית הספר עד 7:45': 'Leave for School by 7:45',
  'התארגנות בוקר': 'Morning Routine',
  'מדיח או כביסה': 'Dishwasher or Laundry',
  'התנהגות טובה למורים ולחברים': 'Good Behavior with Teachers & Friends',
  'הכנת מערכת': 'Prepare Schedule',
  'ארוחת בוקר ותרופות ובקבוק מים': 'Breakfast, Meds & Water Bottle',
  'לתרגל אנגלית': 'Practice English',
  'ארוחת ערב': 'Dinner',
  'לסדר את המיטה': 'Make the Bed',
  'לקרוא לפני שינה': 'Read Before Bed',
  'לקרוא 3 עמודים': 'Read 3 Pages',
  'סידור חדר': 'Tidy Room',
  'התארגנות שקטה במיטה': 'Quiet Settling in Bed',
  'לבדוק אם יש שיעורים': 'Check for Lessons',
  'להכין שיעורים': 'Prepare Homework',
  'להתלבש בבוקר לבד': 'Get Dressed Alone in the Morning',
  'להתעורר לבד': 'Wake Up Independently',
  'קריאה ספר 15 דקות': 'Read a Book for 15 Minutes',
  'חטיף חכם - עד חטיף אחד ביום': 'Smart Snack – Max One a Day',

  // Common reward variants
  'ערב סרט': 'Movie Night',
  'ערב פיצה': 'Pizza Night',
  'ערב סושי': 'Sushi Night',
  'ערב פיצה או המבורגר': 'Pizza or Burger Night',
  'בילוי משותף': 'Quality Time Together',
  'הפתעה': 'Surprise',
  'זמן מסך': 'Screen Time',
  'ממתק כפול': 'Double Treat',
  'שעה בנינטנדו': 'One Hour of Nintendo',
  'ספר קריאה חדש': 'New Book',
  'בילוי סרט + פופקורן': 'Movie + Popcorn',
  'פינוק ארוחת בוקר': 'Breakfast Treat',

  // Default rewards (from trigger)
  'עוד 15 דקות מסך': '15 Extra Screen Minutes',
  'פטור ממטלה מעצבנת': 'Skip an Annoying Chore',
  'ערב סרט ופופקורן': 'Movie & Popcorn Night',
  'ערב פיצה או סושי': 'Pizza or Sushi Night',
  'יום כיף': 'Fun Day Out',
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
