import { Lesson } from '@/types/task';
import { Checkbox } from './ui/checkbox';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchoolDaySectionProps {
  lessons: Lesson[];
  onToggleLesson: (lessonId: string) => void;
}

export function SchoolDaySection({ lessons, onToggleLesson }: SchoolDaySectionProps) {
  const completedCount = lessons.filter(l => l.completed).length;
  const totalCredits = lessons.filter(l => l.completed).reduce((sum, l) => sum + l.credits, 0);

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
              {completedCount}/8 lessons • {totalCredits} credits earned
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => onToggleLesson(lesson.id)}
            className={cn(
              "relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
              lesson.completed
                ? "bg-primary/20 border-primary text-primary"
                : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/50 hover:bg-secondary"
            )}
          >
            <Checkbox
              checked={lesson.completed}
              className={cn(
                "mb-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                lesson.completed && "animate-check-bounce"
              )}
            />
            <span className="text-xs font-medium">{lesson.label}</span>
            <span className="text-[10px] opacity-70">+{lesson.credits}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
