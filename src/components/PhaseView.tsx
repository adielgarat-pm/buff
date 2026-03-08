import { useState, useMemo } from 'react';
import { Task, Lesson, PeriodInfo } from '@/types/task';
import { Phase, getPhaseConfig, getSmartPhaseForTime } from '@/types/phase';
import { PhaseProgressCircle } from './PhaseProgressCircle';
import { PhaseTaskCard } from './PhaseTaskCard';
import { FocusCard } from './FocusCard';
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
  onToggleLesson: (id: string, credits: number) => void;
  onBuffActivated?: () => void;
  fridayEnabled?: boolean;
  schoolQuestEnabled?: boolean;
  schoolEndTime?: string | null;
  isSchoolDay?: boolean;
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
  fridayEnabled = false,
  schoolQuestEnabled = true,
  schoolEndTime = null,
  isSchoolDay = true,
}: PhaseViewProps) {
  const { language, t } = useLanguage();
  const phaseConfig = getPhaseConfig(phase);
  
  // Filter tasks by phase using smart logic that considers actual school end time
  // Also filter by the current day of the week
  const phaseTasks = useMemo(() => {
    const currentDayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    
    return tasks.filter(task => {
      // Check if task is scheduled for today
      const scheduleDays = task.scheduleDays || [0, 1, 2, 3, 4, 5]; // Default Sun-Fri (includes Friday)
      if (!scheduleDays.includes(currentDayOfWeek)) {
        return false;
      }
      
      // Check if task belongs to this phase
      return getSmartPhaseForTime(task.time, schoolEndTime, isSchoolDay && schoolQuestEnabled) === phase;
    });
  }, [tasks, phase, schoolEndTime, isSchoolDay, schoolQuestEnabled]);
  
  
  
  const completedTasks = phaseTasks.filter(t => t.completed);
  const earnedCredits = completedTasks.reduce((sum, t) => sum + t.credits, 0);
  const totalCredits = phaseTasks.reduce((sum, t) => sum + t.credits, 0);

  // For school phase, include lessons only if enabled
  const isSchoolPhase = phase === 'school' && schoolQuestEnabled;
  const completedLessons = schoolQuestEnabled ? lessons.filter(l => l.completed) : [];
  const lessonCredits = completedLessons.reduce((sum, l) => sum + l.credits, 0);
  const totalLessonCredits = schoolQuestEnabled ? lessons.reduce((sum, l) => sum + l.credits, 0) : 0;

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
      {isSchoolPhase && (
        <div className="space-y-4">
          <DailySchedule timetable={timetable} fridayEnabled={fridayEnabled} />
          <SchoolDaySection
            lessons={lessons}
            todaySchedule={todaySchedule}
            onToggleLesson={onToggleLesson}
            fridayEnabled={fridayEnabled}
          />
        </div>
      )}

      {/* Tasks for this phase */}
      {phaseTasks.length > 0 && (
        <div className="space-y-3">
          {!isSchoolPhase && (
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              {t('tasks')}
            </h3>
          )}
          {phaseTasks.map(task => (
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
    </div>
  );
}