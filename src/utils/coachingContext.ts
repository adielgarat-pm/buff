/**
 * Maps task time to a coaching context trigger for context-aware notifications.
 * Uses time-of-day heuristics to determine the appropriate coaching script.
 */

export type CoachingTrigger = 'morning' | 'departure' | 'focus' | 'shower' | 'bedtime';

/**
 * Determine the coaching context based on task time and category.
 * Falls back to time-based heuristic when category doesn't provide a clear signal.
 */
export function getCoachingTrigger(time: string, category?: string): CoachingTrigger {
  const [hours] = time.split(':').map(Number);

  // Category-based overrides
  if (category === 'self-care') {
    // Evening self-care → shower context
    if (hours >= 17) return 'shower';
    // Morning self-care → morning context
    return 'morning';
  }

  if (category === 'learning') return 'focus';

  // Time-based heuristics
  if (hours < 7) return 'morning';          // Before 07:00 → morning routine
  if (hours >= 7 && hours < 9) return 'departure'; // 07:00-08:59 → school departure
  if (hours >= 9 && hours < 17) return 'focus';     // 09:00-16:59 → focus/homework
  if (hours >= 17 && hours < 20) return 'shower';   // 17:00-19:59 → evening routine
  return 'bedtime';                                  // 20:00+ → bedtime

}

/**
 * Calculate egg crack stage (0-3) based on tasks completed today.
 * Each crack requires ~33% of total tasks for the day.
 */
export function getEggCrackStage(completedToday: number, totalToday: number): number {
  if (totalToday === 0) return 0;
  const ratio = completedToday / totalToday;
  if (ratio >= 0.9) return 3;  // Almost done → max crack
  if (ratio >= 0.6) return 2;  // Past halfway
  if (ratio >= 0.3) return 1;  // Getting started
  return 0;                     // Just beginning
}
