import { Lesson, PeriodInfo } from '@/types/task';
import { Checkbox } from './ui/checkbox';
import { BookOpen, Swords, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchoolDaySectionProps {
  lessons: (Lesson & { displayLabel?: string; startTime?: string })[];
  todaySchedule: PeriodInfo[];
  onToggleLesson: (lessonId: string, credits: number) => void;
  fridayEnabled?: boolean;
}

export function SchoolDaySection({ lessons, todaySchedule, onToggleLesson, fridayEnabled = false }: SchoolDaySectionProps) {
  const completedCount = lessons.filter(l => l.completed).length;
  const totalCredits = lessons.filter(l => l.completed).reduce((sum, l) => sum + l.credits, 0);
  const allComplete = completedCount === lessons.length && lessons.length > 0;
  
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
            <Swords className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">School Quest</h3>
            <p className="text-xs text-muted-foreground">Weekend - No quests today</p>
          </div>
        </div>
        <div className="text-center py-4 text-muted-foreground">
          <p>🎮 Enjoy your rest day, hero!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-2xl border transition-all",
      allComplete 
        ? "bg-buff/10 border-buff/30 buff-active-glow" 
        : "bg-card border-border"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg",
            allComplete ? "bg-buff/20" : "bg-primary/20"
          )}>
            {allComplete ? (
              <Trophy className="w-5 h-5 text-buff" />
            ) : (
              <Swords className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">School Quest</h3>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{lessons.length} conquered • +{totalCredits} Buff Points
            </p>
          </div>
        </div>
        {allComplete && (
          <span className="text-xs font-bold text-buff px-2 py-1 rounded-full bg-buff/20 animate-buff-pulse">
            CONQUERED! 🏆
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {lessons.map((lesson) => {
          // Use the lesson's displayLabel directly - it already contains the subject name
          const subject = lesson.displayLabel || lesson.label;
          
          return (
            <button
              key={lesson.id}
              onClick={() => onToggleLesson(lesson.id, lesson.credits)}
              className={cn(
                "relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
                lesson.completed
                  ? "bg-buff/20 border-buff text-buff shadow-glow"
                  : "bg-secondary/50 border-border text-foreground hover:border-primary/50 hover:bg-secondary"
              )}
            >
              <Checkbox
                checked={lesson.completed}
                className={cn(
                  "mb-1 data-[state=checked]:bg-buff data-[state=checked]:border-buff",
                  lesson.completed && "animate-check-bounce"
                )}
              />
              <span className="text-xs font-medium text-center leading-tight line-clamp-2 min-h-[2rem] flex items-center">
                {subject}
              </span>
              <span className="text-[10px] opacity-70">+{lesson.credits} BP</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
