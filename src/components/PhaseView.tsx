import { Task, Lesson, PeriodInfo } from '@/types/task';
import { Phase, getPhaseConfig, getPhaseForTime } from '@/types/phase';
import { PhaseProgressCircle } from './PhaseProgressCircle';
import { PhaseTaskCard } from './PhaseTaskCard';
import { SchoolDaySection } from './SchoolDaySection';
import { DailySchedule } from './DailySchedule';
import { Timetable } from '@/types/task';

interface PhaseViewProps {
  phase: Phase;
  tasks: Task[];
  lessons: (Lesson & { displayLabel?: string })[];
  timetable: Timetable;
  todaySchedule: PeriodInfo[];
  onCompleteTask: (id: string) => void;
  onUncompleteTask: (id: string) => void;
  onToggleLesson: (id: string) => void;
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
}: PhaseViewProps) {
  const phaseConfig = getPhaseConfig(phase);
  
  // Filter tasks by phase
  const phaseTasks = tasks.filter(task => getPhaseForTime(task.time) === phase);
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

  return (
    <div className="space-y-8">
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
      {isSchoolPhase && (
        <div className="space-y-4">
          <DailySchedule timetable={timetable} />
          <SchoolDaySection
            lessons={lessons}
            todaySchedule={todaySchedule}
            onToggleLesson={onToggleLesson}
          />
        </div>
      )}

      {/* Tasks for this phase */}
      {phaseTasks.length > 0 && (
        <div className="space-y-3">
          {!isSchoolPhase && (
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              Tasks
            </h3>
          )}
          {phaseTasks.map(task => (
            <PhaseTaskCard
              key={task.id}
              task={task}
              onComplete={onCompleteTask}
              onUncomplete={onUncompleteTask}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {phaseTasks.length === 0 && !isSchoolPhase && (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">{phaseConfig.icon}</span>
          <p className="text-muted-foreground">No tasks for this phase</p>
        </div>
      )}
    </div>
  );
}
