import { useState } from 'react';
import { Lesson, PeriodInfo } from '@/types/task';
import { Checkbox } from './ui/checkbox';
import { BookOpen, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LessonNoteDialog } from './LessonNoteDialog';

interface SchoolDaySectionProps {
  lessons: (Lesson & { displayLabel?: string })[];
  todaySchedule: PeriodInfo[];
  onToggleLesson: (lessonId: string) => void;
  onUpdateLessonNote?: (lessonId: string, note: string) => void;
}

export function SchoolDaySection({ lessons, todaySchedule, onToggleLesson, onUpdateLessonNote }: SchoolDaySectionProps) {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<(Lesson & { displayLabel?: string }) | null>(null);
  
  const completedCount = lessons.filter(l => l.completed).length;
  const totalCredits = lessons.filter(l => l.completed).reduce((sum, l) => sum + l.credits, 0);
  
  // Check if it's a school day (has any subjects)
  const hasSubjects = todaySchedule.some(p => p.subject);
  // Weekend is Friday (5) and Saturday (6)
  const day = new Date().getDay();
  const isWeekend = day === 5 || day === 6;

  const handleOpenNote = (lesson: Lesson & { displayLabel?: string }) => {
    setSelectedLesson(lesson);
    setNoteDialogOpen(true);
  };

  const handleSaveNote = (note: string) => {
    if (selectedLesson && onUpdateLessonNote) {
      onUpdateLessonNote(selectedLesson.id, note);
    }
  };

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
    <>
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
            const hasNote = !!lesson.note;
            
            return (
              <div key={lesson.id} className="relative">
                <button
                  onClick={() => onToggleLesson(lesson.id)}
                  className={cn(
                    "w-full flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
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
                
                {/* Add Note button for uncompleted lessons */}
                {!lesson.completed && onUpdateLessonNote && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenNote(lesson);
                    }}
                    className={cn(
                      "absolute -bottom-1 -right-1 p-1 rounded-full transition-colors",
                      hasNote 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    )}
                    title={hasNote ? "Edit note" : "Add note"}
                  >
                    <MessageCircle className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Note Dialog */}
      {selectedLesson && (
        <LessonNoteDialog
          open={noteDialogOpen}
          onClose={() => {
            setNoteDialogOpen(false);
            setSelectedLesson(null);
          }}
          lessonLabel={selectedLesson.displayLabel || selectedLesson.label}
          currentNote={selectedLesson.note}
          onSaveNote={handleSaveNote}
        />
      )}
    </>
  );
}
