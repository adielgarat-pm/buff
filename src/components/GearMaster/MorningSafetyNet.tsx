import { useMemo } from 'react';
import { Timetable, WeekDay, WEEK_DAY_LABELS, PeriodInfo } from '@/types/task';
import { AlertTriangle, Backpack, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MorningSafetyNetProps {
  timetable: Timetable;
  fridayEnabled?: boolean;
}

/**
 * Morning Safety Net - Shows equipment checklist as a reminder (NO POINTS)
 * Only appears if the Night Mission was NOT completed
 * Goal: Visual aid only, preventing the child from forgetting gear
 */
export function MorningSafetyNet({ 
  timetable, 
  fridayEnabled = false, 
}: MorningSafetyNetProps) {
  
  // Get today's lessons (we're showing what's needed TODAY)
  const todayData = useMemo(() => {
    const today = new Date();
    const todayIndex = today.getDay(); // 0 = Sunday
    
    const dayMap: Record<number, WeekDay | null> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: fridayEnabled ? 'friday' : null,
      6: null, // Saturday
    };
    
    const todayDay = dayMap[todayIndex];
    if (!todayDay) {
      return { day: null, lessons: [], dayLabel: '' };
    }
    
    const lessons = (timetable[todayDay] || []).filter(p => p.subject && p.subject.trim() !== '');
    
    return { 
      day: todayDay, 
      lessons, 
      dayLabel: WEEK_DAY_LABELS[todayDay] 
    };
  }, [timetable, fridayEnabled]);

  // Get lessons with equipment
  const lessonsWithEquipment = useMemo(() => {
    return todayData.lessons
      .map((lesson, index) => ({ ...lesson, index }))
      .filter(lesson => lesson.equipment && lesson.equipment.trim() !== '');
  }, [todayData.lessons]);

  // Don't show if no school day or no equipment needed
  if (!todayData.day || lessonsWithEquipment.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 p-4 space-y-3">
      {/* Warning Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground text-sm">תזכורת בוקר - בדיקת תיק</h3>
          <p className="text-xs text-muted-foreground">
            בדיקה שהכל בתיק לפני היציאה!
          </p>
        </div>
        <div className="px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
          ללא נקודות
        </div>
      </div>

      {/* Equipment List - Read-only visual reminder */}
      <div className="space-y-2">
        {lessonsWithEquipment.map((lesson, idx) => (
          <div
            key={idx}
            className="p-2 rounded-lg bg-card border border-border"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-amber-600">
                {lesson.startTime.slice(0, 5)}
              </span>
              <span className="font-medium text-foreground text-sm">{lesson.subject}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {lesson.equipment!.split(/[,،\n]/).map((eq, eqIdx) => {
                const trimmed = eq.trim();
                if (!trimmed) return null;
                return (
                  <span
                    key={eqIdx}
                    className="px-2 py-0.5 rounded bg-secondary text-xs text-foreground"
                  >
                    {trimmed}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground italic">
        💡 טיפ: סידור תיק בערב הקודם מזכה בנקודות!
      </p>
    </div>
  );
}
