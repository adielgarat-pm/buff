import { useState, useMemo } from 'react';
import { Task, Lesson, PeriodInfo } from '@/types/task';
import { Phase, getPhaseConfig, getPhaseForTime } from '@/types/phase';
import { PhaseProgressCircle } from './PhaseProgressCircle';
import { PhaseTaskCard } from './PhaseTaskCard';
import { SchoolDaySection } from './SchoolDaySection';
import { DailySchedule } from './DailySchedule';
import { FocusModeToggle } from './FocusModeToggle';
import { Timetable } from '@/types/task';
import { useLanguage } from '@/contexts/LanguageContext';
import { Target } from 'lucide-react';

interface PhaseViewProps {
  phase: Phase;
  tasks: Task[];
  lessons: (Lesson & { displayLabel?: string })[];
  timetable: Timetable;
  todaySchedule: PeriodInfo[];
  onCompleteTask: (id: string) => void;
  onUncompleteTask: (id: string) => void;
  onToggleLesson: (id: string) => void;
  onBuffActivated?: () => void;
}

export function PhaseView({
  phase,
  tasks,
  lessons,
  timetable,
  todaySchedule,
  onCompleteTask,
  onUncompleteTask,
  onToggleLesson,
  onBuffActivated,
}: PhaseViewProps) {
  const { language, t } = useLanguage();
  const [focusMode, setFocusMode] = useState(false);
  const phaseConfig = getPhaseConfig(phase);
  
  // Filter tasks by phase
  const phaseTasks = useMemo(() => {
    return tasks.filter(task => getPhaseForTime(task.time) === phase);
  }, [tasks, phase]);
  
  // Get the next incomplete task for focus mode
  const nextTask = useMemo(() => {
    const incompleteTasks = phaseTasks.filter(t => !t.completed);
    if (incompleteTasks.length === 0) return null;
    // Sort by time and get the first one
    return incompleteTasks.sort((a, b) => a.time.localeCompare(b.time))[0];
  }, [phaseTasks]);
  
  const completedTasks = phaseTasks.filter(t => t.completed);
  const earnedCredits = completedTasks.reduce((sum, t) => sum + t.credits, 0);
  const totalCredits = phaseTasks.reduce((sum, t) => sum + t.credits, 0);

  // For school phase, include lessons
  const isSchoolPhase = phase === 'school';
  const completedLessons = lessons.filter(l => l.completed);
  const lessonCredits = completedLessons.reduce((sum, l) => sum + l.credits, 0);
  const totalLessonCredits = lessons.reduce((sum, l) => sum + l.credits, 0);

  const phaseTotal = isSchoolPhase 
    ? phaseTasks.length + lessons.length 
    : phaseTasks.length;
  const phaseCompleted = isSchoolPhase 
    ? completedTasks.length + completedLessons.length 
    : completedTasks.length;
  const phaseEarnedCredits = isSchoolPhase 
    ? earnedCredits + lessonCredits 
    : earnedCredits;
  const phaseTotalCredits = isSchoolPhase 
    ? totalCredits + totalLessonCredits 
    : totalCredits;

  const phaseLabel = language === 'he' ? phaseConfig.labelHe : phaseConfig.label;
  const remainingCount = phaseTasks.length - completedTasks.length;

  // Determine which tasks to show
  const displayTasks = focusMode && nextTask ? [nextTask] : phaseTasks;

  return (
    <div className="space-y-6">
      {/* Focus Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Target className="w-4 h-4" />
          <span className="text-sm">
            {remainingCount} {t('focus.remaining')}
          </span>
        </div>
        <FocusModeToggle 
          isEnabled={focusMode} 
          onToggle={() => setFocusMode(!focusMode)} 
        />
      </div>

      {/* Progress Circle */}
      <div className="flex justify-center py-4">
        <PhaseProgressCircle
          phase={phaseConfig}
          completed={phaseCompleted}
          total={phaseTotal}
          earnedCredits={phaseEarnedCredits}
          totalCredits={phaseTotalCredits}
        />
      </div>

      {/* School-specific content */}
      {isSchoolPhase && !focusMode && (
        <div className="space-y-4">
          <DailySchedule timetable={timetable} />
          <SchoolDaySection
            lessons={lessons}
            todaySchedule={todaySchedule}
            onToggleLesson={onToggleLesson}
          />
        </div>
      )}

      {/* Focus Mode Banner */}
      {focusMode && nextTask && (
        <div className="bg-buff/10 border border-buff/30 rounded-2xl p-4 text-center">
          <p className="text-buff font-bold mb-1">
            {t('focus.active')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('focus.completeFirst')}
          </p>
        </div>
      )}

      {/* Tasks for this phase */}
      {displayTasks.length > 0 && (
        <div className="space-y-3">
          {!isSchoolPhase && !focusMode && (
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              {t('tasks')}
            </h3>
          )}
          {displayTasks.map(task => (
            <PhaseTaskCard
              key={task.id}
              task={task}
              onComplete={onCompleteTask}
              onUncomplete={onUncompleteTask}
              onBuffActivated={onBuffActivated}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {phaseTasks.length === 0 && !isSchoolPhase && (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">{phaseConfig.icon}</span>
          <p className="text-muted-foreground">{t('noTasksForPhase')}</p>
        </div>
      )}

      {/* All complete state in focus mode */}
      {focusMode && !nextTask && phaseTasks.length > 0 && (
        <div className="text-center py-12 bg-buff/10 rounded-2xl border border-buff/30">
          <span className="text-6xl mb-4 block">🎉</span>
          <h3 className="text-xl font-bold text-buff mb-2">
            {t('focus.allComplete')}
          </h3>
          <p className="text-muted-foreground">
            {t('focus.greatWork')}
          </p>
        </div>
      )}
    </div>
  );
}