import { Task } from '@/types/task';

// Keywords that identify Protocol/Bio/Meds tasks
const PROTOCOL_KEYWORDS = [
  'protocol', 'bio', 'meds', 'medication', 'medicine', 'תרופה', 'תרופות', 
  'ריטלין', 'קונצרטה', 'ויוונס', 'סטרטרה', 'אדרל', 'פרוטוקול', 'ביו',
  'core sync', 'daily sync'
];

/**
 * Check if a task is a Protocol/Bio/Meds task based on title or description
 */
export function isProtocolTask(task: Task): boolean {
  if (task.category !== 'self-care') return false;
  
  const searchText = `${task.title} ${task.description || ''} ${task.icon || ''}`.toLowerCase();
  
  return PROTOCOL_KEYWORDS.some(keyword => 
    searchText.includes(keyword.toLowerCase())
  );
}

/**
 * Get the credit multiplier for a task
 * Protocol tasks get 1.5x multiplier for discipline rewards
 */
export function getTaskCreditMultiplier(task: Task): number {
  return isProtocolTask(task) ? 1.5 : 1;
}

/**
 * Calculate effective credits for a task
 */
export function getEffectiveCredits(task: Task): number {
  return Math.round(task.credits * getTaskCreditMultiplier(task));
}

/**
 * Get privacy-friendly notification title for task
 */
export function getDiscreteNotificationTitle(task: Task): string {
  if (isProtocolTask(task)) {
    return '🔋 Time for Core Sync';
  }
  return `⚡ Buff Time: ${task.title}`;
}

/**
 * Get privacy-friendly notification body for task
 */
export function getDiscreteNotificationBody(task: Task): string {
  const effectiveCredits = getEffectiveCredits(task);
  
  if (isProtocolTask(task)) {
    return `Quick protocol sync ready. Power up with ${effectiveCredits} BP! 🚀`;
  }
  return `Complete this quest to earn ${effectiveCredits} Buff Points! 🎮`;
}

/**
 * Cyberpunk color scheme for Protocol tasks
 */
export const PROTOCOL_COLORS = {
  primary: 'hsl(180, 100%, 50%)', // Cyan
  secondary: 'hsl(280, 100%, 60%)', // Electric purple
  glow: 'hsl(180, 100%, 70%)',
  background: 'rgba(0, 255, 255, 0.1)',
  border: 'rgba(0, 255, 255, 0.5)',
};
