export type Phase = 'morning' | 'school' | 'afternoon' | 'evening';

export interface PhaseConfig {
  id: Phase;
  label: string;
  labelHe: string;
  shortLabel: string;
  shortLabelHe: string;
  icon: string;
  startHour: number;
  endHour: number;
  color: string;
}

export const PHASES: PhaseConfig[] = [
  { 
    id: 'morning', 
    label: 'Morning Routine', 
    labelHe: 'שגרת בוקר',
    shortLabel: 'Morning',
    shortLabelHe: 'בוקר',
    icon: '🌅', 
    startHour: 6, 
    endHour: 9,
    color: 'hsl(var(--chart-1))'
  },
  { 
    id: 'school', 
    label: 'School Day', 
    labelHe: 'יום לימודים',
    shortLabel: 'School',
    shortLabelHe: 'בי״ס',
    icon: '📚', 
    startHour: 9, 
    endHour: 16,
    color: 'hsl(var(--chart-2))'
  },
  { 
    id: 'afternoon', 
    label: 'Afternoon / Study', 
    labelHe: 'צהריים / למידה',
    shortLabel: 'Afternoon',
    shortLabelHe: 'צהריים',
    icon: '📖', 
    startHour: 16, 
    endHour: 20,
    color: 'hsl(var(--chart-3))'
  },
  { 
    id: 'evening', 
    label: 'Evening / Bedtime', 
    labelHe: 'ערב / שינה',
    shortLabel: 'Evening',
    shortLabelHe: 'ערב',
    icon: '🌙', 
    startHour: 20, 
    endHour: 24,
    color: 'hsl(var(--chart-4))'
  },
];

export function getCurrentPhase(): Phase {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 16) return 'school';
  if (hour >= 16 && hour < 20) return 'afternoon';
  return 'evening';
}

/**
 * Get current phase with custom school end time
 * @param schoolEndTime Optional school end time in HH:MM format
 * @param isSchoolDay Whether today is a school day
 */
export function getSmartCurrentPhase(schoolEndTime: string | null, isSchoolDay: boolean): Phase {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Morning phase: 6:00 AM - 9:00 AM
  if (currentMinutes >= 360 && currentMinutes < 540) {
    return 'morning';
  }
  
  // Evening phase: 8:00 PM - midnight
  if (currentMinutes >= 1200) {
    return 'evening';
  }
  
  // Parse school end time or use default
  let schoolEndMinutes = 840; // Default 14:00
  if (schoolEndTime) {
    const [hours, minutes] = schoolEndTime.split(':').map(Number);
    schoolEndMinutes = hours * 60 + minutes;
  }
  
  // School phase: 9:00 AM until school ends
  if (isSchoolDay && currentMinutes >= 540 && currentMinutes < schoolEndMinutes) {
    return 'school';
  }
  
  // Afternoon phase: after school ends until 8:00 PM
  if (currentMinutes >= Math.min(schoolEndMinutes, 540) && currentMinutes < 1200) {
    return 'afternoon';
  }
  
  return getCurrentPhase();
}

export function getPhaseConfig(phase: Phase): PhaseConfig {
  return PHASES.find(p => p.id === phase) || PHASES[0];
}

export function getPhaseForTime(timeString: string): Phase {
  const [hours] = timeString.split(':').map(Number);
  
  if (hours >= 6 && hours < 9) return 'morning';
  if (hours >= 9 && hours < 16) return 'school';
  if (hours >= 16 && hours < 20) return 'afternoon';
  return 'evening';
}
