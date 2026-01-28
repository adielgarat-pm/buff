import { useMemo } from 'react';
import { Timetable, WeekDay, WEEK_DAYS, WEEK_DAYS_WITH_FRIDAY, WEEK_DAY_LABELS, PeriodInfo } from '@/types/task';
import { Backpack, CheckCircle2, Moon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TomorrowsPrepProps {
  timetable: Timetable;
  fridayEnabled?: boolean;
}

export function TomorrowsPrep({ timetable, fridayEnabled = false }: TomorrowsPrepProps) {
  const displayDays = fridayEnabled ? WEEK_DAYS_WITH_FRIDAY : WEEK_DAYS;
  
  // Get tomorrow's day
  const tomorrowData = useMemo(() => {
    const today = new Date();
    const todayIndex = today.getDay(); // 0 = Sunday
    const tomorrowIndex = (todayIndex + 1) % 7;
    
    // Map JS day index to WeekDay
    const dayMap: Record<number, WeekDay | null> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: fridayEnabled ? 'friday' : null,
      6: null, // Saturday - no school
    };
    
    const tomorrowDay = dayMap[tomorrowIndex];
    if (!tomorrowDay) {
      return { day: null, lessons: [], hasEquipment: false };
    }
    
    // Only include lessons with actual subject content
    const lessons = (timetable[tomorrowDay] || []).filter(p => p.subject && p.subject.trim() !== '');
    // Only count equipment if it has actual content
    const hasEquipment = lessons.some(p => p.equipment && p.equipment.trim() !== '');
    
    return { day: tomorrowDay, lessons, hasEquipment };
  }, [timetable, fridayEnabled]);

  // Group equipment by lesson - only include items with actual equipment content
  const equipmentList = useMemo(() => {
    return tomorrowData.lessons
      .filter(lesson => lesson.equipment && lesson.equipment.trim() !== '')
      .map(lesson => ({
        subject: lesson.subject,
        equipment: lesson.equipment!.trim(),
        time: lesson.startTime,
      }));
  }, [tomorrowData.lessons]);

  // If tomorrow is not a school day
  if (!tomorrowData.day) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-buff/10 flex items-center justify-center mx-auto mb-4">
          <Moon className="w-8 h-8 text-buff" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          מחר יום חופש! 🎉
        </h3>
        <p className="text-sm text-muted-foreground">
          אין צורך להכין תיק - תהנה מהמנוחה!
        </p>
      </div>
    );
  }

  // If no lessons with equipment
  if (equipmentList.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-buff/10 flex items-center justify-center">
            <Backpack className="w-6 h-6 text-buff" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">הכנה למחר</h3>
            <p className="text-sm text-muted-foreground">
              {WEEK_DAY_LABELS[tomorrowData.day]} - {tomorrowData.lessons.length} שיעורים
            </p>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 text-center">
          <CheckCircle2 className="w-8 h-8 text-primary/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            לא הוגדר ציוד מיוחד למחר
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-buff/5 to-primary/5 border border-buff/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-buff/20 flex items-center justify-center">
          <Backpack className="w-6 h-6 text-buff" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground">הכנה למחר</h3>
            <Sparkles className="w-4 h-4 text-buff animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">
            {WEEK_DAY_LABELS[tomorrowData.day]} - צ'קליסט ציוד
          </p>
        </div>
      </div>

      {/* Equipment checklist */}
      <div className="space-y-3">
        {equipmentList.map((item, index) => (
          <div
            key={index}
            className="p-3 rounded-xl bg-card border border-border"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">
                  {item.time.slice(0, 5)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">
                  {item.subject}
                </p>
                <div className="mt-1 space-y-1">
                  {item.equipment.split(/[,،\n]/).map((eq, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-buff" />
                      <span>{eq.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Motivational footer */}
      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          הכנת את התיק? מעולה! יום מחר יהיה קל יותר 💪
        </p>
      </div>
    </div>
  );
}
