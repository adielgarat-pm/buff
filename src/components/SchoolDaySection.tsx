import { Lesson, PeriodInfo } from '@/types/task';
import { Checkbox } from './ui/checkbox';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchoolDaySectionProps {
  lessons: (Lesson & { displayLabel?: string })[];
  todaySchedule: PeriodInfo[];
  onToggleLesson: (lessonId: string) => void;
  fridayEnabled?: boolean;
}

export function SchoolDaySection({ lessons, todaySchedule, onToggleLesson, fridayEnabled = false }: SchoolDaySectionProps) {
  const completedCount = lessons.filter(l => l.completed).length;
  const totalCredits = lessons.filter(l => l.completed).reduce((sum, l) => sum + l.credits, 0);
  
  // Check if it's a school day (has any subjects)
  const hasSubjects = todaySchedule.some(p => p.subject);
  // Weekend: Friday (5) is weekend only if fridayEnabled is false, Saturday (6) is always weekend
  const day = new Date().getDay();
  const isWeekend = day === 6 || (day === 5 && !fridayEnabled);

  if (isWeekend) {
    return (
      <div className="p-4 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-secondary">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">School Day</h3>
            <p className="text-xs text-muted-foreground">Weekend - No school</p>
          </div>
        </div>
        <div className="text-center py-4 text-muted-foreground">
          <p>🎉 Enjoy your weekend!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">School Day</h3>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{lessons.length} lessons • {totalCredits} credits earned
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {lessons.map((lesson, index) => {
          const periodInfo = todaySchedule[index];
          const subject = periodInfo?.subject;
          const hasSubject = !!subject;
          
          return (
            <button
              key={lesson.id}
              onClick={() => onToggleLesson(lesson.id)}
              className={cn(
                "relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
                lesson.completed
                  ? "bg-primary/20 border-primary text-primary"
                  : hasSubject
                    ? "bg-secondary/50 border-border text-foreground hover:border-primary/50 hover:bg-secondary"
                    : "bg-secondary/30 border-border/50 text-muted-foreground"
              )}
            >
              <Checkbox
                checked={lesson.completed}
                className={cn(
                  "mb-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                  lesson.completed && "animate-check-bounce"
                )}
              />
              <span className="text-xs font-medium text-center leading-tight line-clamp-2 min-h-[2rem] flex items-center">
                {subject || `P${index + 1}`}
              </span>
              <span className="text-[10px] opacity-70">+{lesson.credits}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
