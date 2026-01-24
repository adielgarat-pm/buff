import { PeriodInfo, WeekDay, WEEK_DAYS } from '@/types/task';
import { Clock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyScheduleProps {
  timetable: Record<string, PeriodInfo[]>;
  fridayEnabled?: boolean;
}

function getTodayWeekDay(fridayEnabled: boolean = false): WeekDay | null {
  const dayIndex = new Date().getDay();
  // 0 = Sunday, 1 = Monday, etc.
  // School days are Sun-Thu (0-4), Friday (5) only if enabled
  if (dayIndex >= 0 && dayIndex <= 4) {
    return WEEK_DAYS[dayIndex];
  }
  if (dayIndex === 5 && fridayEnabled) {
    return 'friday';
  }
  return null; // Saturday (6) is always weekend
}

export function DailySchedule({ timetable, fridayEnabled = false }: DailyScheduleProps) {
  const todayKey = getTodayWeekDay(fridayEnabled);
  
  if (!todayKey) {
    return (
      <div className="p-4 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-secondary">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Today's Schedule</h3>
            <p className="text-xs text-muted-foreground">Weekend - No classes</p>
          </div>
        </div>
        <div className="text-center py-6 text-muted-foreground">
          <p>🎉 Enjoy your weekend!</p>
        </div>
      </div>
    );
  }

  const todaySchedule = timetable[todayKey] || [];
  const hasAnySubjects = todaySchedule.some(p => p.subject);

  if (!hasAnySubjects) {
    return (
      <div className="p-4 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Today's Schedule</h3>
            <p className="text-xs text-muted-foreground">No subjects set</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          Set up your timetable in Parent Mode to see your daily schedule.
        </p>
      </div>
    );
  }

  // Get current time for highlighting current/next period
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const getTimeInMinutes = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    return hours * 60 + mins;
  };

  return (
    <div className="p-4 rounded-2xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/20">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Today's Schedule</h3>
          <p className="text-xs text-muted-foreground capitalize">
            {todayKey} • {todaySchedule.filter(p => p.subject).length} lessons
          </p>
        </div>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />
        
        <div className="space-y-2">
          {todaySchedule.map((period, index) => {
            if (!period.subject) return null;
            
            const periodMinutes = getTimeInMinutes(period.startTime);
            const nextPeriodMinutes = todaySchedule[index + 1]
              ? getTimeInMinutes(todaySchedule[index + 1].startTime)
              : periodMinutes + 50;
            
            const isActive = currentMinutes >= periodMinutes && currentMinutes < nextPeriodMinutes;
            const isPast = currentMinutes >= nextPeriodMinutes;

            return (
              <div
                key={index}
                className={cn(
                  "relative flex items-center gap-3 p-3 rounded-xl transition-all",
                  isActive && "bg-primary/10 border border-primary/30",
                  isPast && "opacity-50",
                  !isActive && !isPast && "hover:bg-secondary/50"
                )}
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    "relative z-10 w-3 h-3 rounded-full border-2",
                    isActive && "bg-primary border-primary animate-pulse",
                    isPast && "bg-muted border-muted-foreground",
                    !isActive && !isPast && "bg-background border-primary"
                  )}
                />
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium w-12">{period.startTime}</span>
                </div>
                
                <div className="flex-1">
                  <span className={cn(
                    "font-medium text-sm",
                    isActive ? "text-primary" : "text-foreground"
                  )}>
                    {period.subject}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Period {index + 1}
                  </span>
                </div>
                
                {isActive && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Now
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
