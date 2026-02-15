interface PreviewTask {
  icon: string;
  title: string;
  time: string;
}

const EN_TASKS: PreviewTask[] = [
  { icon: '😁', title: 'Sparkling Smile', time: '07:00' },
  { icon: '👕', title: 'Getting Ready Hero', time: '07:15' },
  { icon: '🎒', title: 'Success Prep', time: '07:30' },
  { icon: '📚', title: 'Focus Mode', time: '16:00' },
  { icon: '🥗', title: 'Healthy Growth', time: '19:00' },
  { icon: '🌙', title: 'Recharging My Battery', time: '21:00' },
];

const HE_TASKS: PreviewTask[] = [
  { icon: '😁', title: 'חיוך נוצץ', time: '07:00' },
  { icon: '👕', title: 'אלוף התארגנות', time: '07:15' },
  { icon: '🎒', title: 'הכנה להצלחה', time: '07:30' },
  { icon: '📚', title: 'זמן פוקוס', time: '16:00' },
  { icon: '🥗', title: 'אנרגיה טובה', time: '19:00' },
  { icon: '🌙', title: 'מטעינים מצברים', time: '21:00' },
];

// Return a curated list based on language + challenge focus
export function getPreviewTasks(language: 'en' | 'he', _challenge: string): PreviewTask[] {
  return language === 'he' ? HE_TASKS : EN_TASKS;
}
