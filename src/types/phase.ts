export type Phase = 'morning' | 'school' | 'afternoon' | 'evening';

export interface PhaseConfig {
  id: Phase;
  label: string;
  shortLabel: string;
  icon: string;
  startHour: number;
  endHour: number;
  color: string;
}

export const PHASES: PhaseConfig[] = [
  { 
    id: 'morning', 
    label: 'Morning Routine', 
    shortLabel: 'Morning',
    icon: '🌅', 
    startHour: 6, 
    endHour: 9,
    color: 'hsl(var(--chart-1))'
  },
  { 
    id: 'school', 
    label: 'School Day', 
    shortLabel: 'School',
    icon: '📚', 
    startHour: 9, 
    endHour: 16,
    color: 'hsl(var(--chart-2))'
  },
  { 
    id: 'afternoon', 
    label: 'Afternoon / Study', 
    shortLabel: 'Afternoon',
    icon: '📖', 
    startHour: 16, 
    endHour: 20,
    color: 'hsl(var(--chart-3))'
  },
  { 
    id: 'evening', 
    label: 'Evening / Bedtime', 
    shortLabel: 'Evening',
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
