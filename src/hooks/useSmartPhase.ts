import { useState, useEffect, useCallback, useMemo } from 'react';
import { Phase, getCurrentPhase } from '@/types/phase';
import { PeriodInfo } from '@/types/task';

const LESSON_DURATION_MINUTES = 50; // Default lesson duration
const CHECK_INTERVAL_MS = 60000; // Check every minute

interface SmartPhaseResult {
  currentPhase: Phase;
  schoolEndTime: string | null;
  isSchoolDay: boolean;
  phaseJustTransitioned: boolean;
  dismissTransition: () => void;
  timeUntilNextPhase: number | null; // minutes
}

/**
 * Calculate the end time of the last lesson
 * @param schedule Today's schedule (array of PeriodInfo)
 * @returns End time as HH:MM string, or null if no lessons
 */
function calculateSchoolEndTime(schedule: PeriodInfo[]): string | null {
  const lessonsWithSubjects = schedule.filter(p => p.subject);
  if (lessonsWithSubjects.length === 0) return null;

  const lastLesson = lessonsWithSubjects[lessonsWithSubjects.length - 1];
  const [hours, minutes] = lastLesson.startTime.split(':').map(Number);
  
  // Add lesson duration to get end time
  const endMinutes = minutes + LESSON_DURATION_MINUTES;
  const endHours = hours + Math.floor(endMinutes / 60);
  const finalMinutes = endMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
}

/**
 * Parse time string to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get current time as minutes since midnight
 */
function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Determine the current phase based on school schedule
 * @param schoolEndTime The end time of the last lesson (HH:MM)
 * @param isSchoolDay Whether today is a school day
 * @returns The current phase
 */
function getSmartPhase(schoolEndTime: string | null, isSchoolDay: boolean): Phase {
  const currentMinutes = getCurrentTimeMinutes();
  
  // Morning phase: 6:00 AM - 9:00 AM (360-540 minutes)
  if (currentMinutes >= 360 && currentMinutes < 540) {
    return 'morning';
  }
  
  // Evening phase: 8:00 PM - midnight (1200-1440 minutes)
  if (currentMinutes >= 1200) {
    return 'evening';
  }
  
  // If not a school day or no schedule, use default fallback (14:00 = 840 minutes)
  const schoolEndMinutes = schoolEndTime 
    ? timeToMinutes(schoolEndTime)
    : (isSchoolDay ? 840 : 540); // Default 14:00 for school days, 9:00 for weekends
  
  // School phase: 9:00 AM until school ends
  if (isSchoolDay && currentMinutes >= 540 && currentMinutes < schoolEndMinutes) {
    return 'school';
  }
  
  // Afternoon phase: after school ends until 8:00 PM
  if (currentMinutes >= schoolEndMinutes && currentMinutes < 1200) {
    return 'afternoon';
  }
  
  // Default fallback
  return getCurrentPhase();
}

/**
 * Hook for smart phase transitions based on school schedule
 */
export function useSmartPhase(
  todaySchedule: PeriodInfo[],
  isSchoolDay: boolean,
  schoolQuestEnabled: boolean = true
): SmartPhaseResult {
  const schoolEndTime = useMemo(() => {
    if (!isSchoolDay || !schoolQuestEnabled) return null;
    const endTime = calculateSchoolEndTime(todaySchedule);
    console.log('[SmartPhase] Schedule:', todaySchedule.length, 'lessons, endTime:', endTime, 'isSchoolDay:', isSchoolDay);
    return endTime;
  }, [todaySchedule, isSchoolDay, schoolQuestEnabled]);

  // Calculate initial phase based on schoolEndTime (calculated synchronously in useMemo)
  const initialPhase = useMemo(() => {
    const phase = getSmartPhase(schoolEndTime, isSchoolDay && schoolQuestEnabled);
    console.log('[SmartPhase] Calculated phase:', phase, 'schoolEndTime:', schoolEndTime, 'currentTime:', new Date().toLocaleTimeString());
    return phase;
  }, [schoolEndTime, isSchoolDay, schoolQuestEnabled]);

  const [currentPhase, setCurrentPhase] = useState<Phase>(initialPhase);
  const [phaseJustTransitioned, setPhaseJustTransitioned] = useState(false);
  const [lastPhase, setLastPhase] = useState<Phase>(initialPhase);

  // Sync currentPhase when initialPhase changes (e.g., schedule loads)
  useEffect(() => {
    setCurrentPhase(initialPhase);
    setLastPhase(initialPhase);
  }, [initialPhase]);

  // Calculate time until next phase
  const timeUntilNextPhase = useMemo(() => {
    const currentMinutes = getCurrentTimeMinutes();
    
    if (currentPhase === 'morning') {
      return 540 - currentMinutes; // Until 9:00
    }
    
    if (currentPhase === 'school' && schoolEndTime) {
      return timeToMinutes(schoolEndTime) - currentMinutes;
    }
    
    if (currentPhase === 'afternoon') {
      return 1200 - currentMinutes; // Until 20:00
    }
    
    return null;
  }, [currentPhase, schoolEndTime]);

  // Dismiss the transition notification
  const dismissTransition = useCallback(() => {
    setPhaseJustTransitioned(false);
  }, []);

  // Check for phase changes every minute
  useEffect(() => {
    const checkPhase = () => {
      const newPhase = getSmartPhase(schoolEndTime, isSchoolDay && schoolQuestEnabled);
      
      if (newPhase !== lastPhase) {
        // Phase transition detected!
        console.log('[SmartPhase] Phase transition:', lastPhase, '->', newPhase);
        setCurrentPhase(newPhase);
        setLastPhase(newPhase);
        
        // Only show transition notification for school -> afternoon
        if (lastPhase === 'school' && newPhase === 'afternoon') {
          setPhaseJustTransitioned(true);
          
          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            setPhaseJustTransitioned(false);
          }, 5000);
        }
      }
    };

    // Set up interval to check every minute
    const interval = setInterval(checkPhase, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [schoolEndTime, isSchoolDay, schoolQuestEnabled, lastPhase]);

  return {
    currentPhase,
    schoolEndTime,
    isSchoolDay: isSchoolDay && schoolQuestEnabled,
    phaseJustTransitioned,
    dismissTransition,
    timeUntilNextPhase,
  };
}
