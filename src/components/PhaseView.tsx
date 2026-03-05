import { useState, useMemo } from 'react';
import { Task, Lesson, PeriodInfo } from '@/types/task';
import { Phase, getPhaseConfig, getSmartPhaseForTime } from '@/types/phase';
import { PhaseProgressCircle } from './PhaseProgressCircle';
import { PhaseTaskCard } from './PhaseTaskCard';
import { SchoolDaySection } from './SchoolDaySection';
import { DailySchedule } from './DailySchedule';
import { FocusModeToggle } from './FocusModeToggle';
import { Timetable } from '@/types/task';
import { useLanguage } from '@/contexts/LanguageContext';
import { Target } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

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

/* ─── Sub-components ─── */

function StageHeader({ focusMode, onToggleFocus }: {
  focusMode: boolean;
  onToggleFocus: () => void;
}) {
  return (
    <div className="flex items-center justify-end">
      <FocusModeToggle isEnabled={focusMode} onToggle={onToggleFocus} />
    </div>
  );
}

function FocusBanner({ t }: { t: (key: string) => string }) {
  return (
    <div className="bg-buff/10 border border-buff/30 rounded-2xl p-4 text-center">
      <p className="text-buff font-bold mb-1">{t('focus.active')}</p>
      <p className="text-sm text-muted-foreground">{t('focus.completeFirst')}</p>
    </div>
  );
}

function FocusCard({ task, onComplete, onUncomplete, onBuffActivated }: {
  task: Task;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onBuffActivated?: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={task.id}
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -60 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex justify-center"
      >
        <div className="w-full max-w-sm">
          <PhaseTaskCard
            task={task}
            onComplete={onComplete}
            onUncomplete={onUncomplete}
            onBuffActivated={onBuffActivated}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function AllCompleteBanner({ t }: { t: (key: string) => string }) {
  return (
    <div className="text-center py-12 bg-buff/10 rounded-2xl border border-buff/30">
      <span className="text-6xl mb-4 block">🎉</span>
      <h3 className="text-xl font-bold text-buff mb-2">{t('focus.allComplete')}</h3>
      <p className="text-muted-foreground">{t('focus.greatWork')}</p>
    </div>
  );
}

/* ─── Main Component ─── */

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
  const [focusMode, setFocusMode] = useState(false);
  const phaseConfig = getPhaseConfig(phase);
  
  // Filter tasks by phase + day
  const phaseTasks = useMemo(() => {
    const currentDayOfWeek = new Date().getDay();
    return tasks.filter(task => {
      const scheduleDays = task.scheduleDays || [0, 1, 2, 3, 4, 5];
      if (!scheduleDays.includes(currentDayOfWeek)) return false;
      return getSmartPhaseForTime(task.time, schoolEndTime, isSchoolDay && schoolQuestEnabled) === phase;
    });
  }, [tasks, phase, schoolEndTime, isSchoolDay, schoolQuestEnabled]);
  
  // Next incomplete task for focus mode
  const nextTask = useMemo(() => {
    const incompleteTasks = phaseTasks.filter(t => !t.completed);
    if (incompleteTasks.length === 0) return null;
    return incompleteTasks.sort((a, b) => a.time.localeCompare(b.time))[0];
  }, [phaseTasks]);
  
  const completedTasks = phaseTasks.filter(t => t.completed);
  const earnedCredits = completedTasks.reduce((sum, t) => sum + t.credits, 0);
  const totalCredits = phaseTasks.reduce((sum, t) => sum + t.credits, 0);

  const isSchoolPhase = phase === 'school' && schoolQuestEnabled;
  const completedLessons = schoolQuestEnabled ? lessons.filter(l => l.completed) : [];
  const lessonCredits = completedLessons.reduce((sum, l) => sum + l.credits, 0);
  const totalLessonCredits = schoolQuestEnabled ? lessons.reduce((sum, l) => sum + l.credits, 0) : 0;

  const phaseTotal = isSchoolPhase ? phaseTasks.length + lessons.length : phaseTasks.length;
  const phaseCompleted = isSchoolPhase ? completedTasks.length + completedLessons.length : completedTasks.length;
  const phaseEarnedCredits = isSchoolPhase ? earnedCredits + lessonCredits : earnedCredits;
  const phaseTotalCredits = isSchoolPhase ? totalCredits + totalLessonCredits : totalCredits;

  const remainingCount = phaseTasks.length - completedTasks.length;
  const displayTasks = focusMode && nextTask ? [nextTask] : phaseTasks;

  return (
    <div className="space-y-4">
      {/* Focus toggle */}
      <StageHeader
        focusMode={focusMode}
        onToggleFocus={() => setFocusMode(!focusMode)}
      />

      {/* Simple progress bar */}
      <PhaseProgressCircle
        phase={phaseConfig}
        completed={phaseCompleted}
        total={phaseTotal}
        earnedCredits={phaseEarnedCredits}
        totalCredits={phaseTotalCredits}
      />

      {/* School content (hidden in focus mode) */}
      {isSchoolPhase && !focusMode && (
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

      {/* Focus Mode: single large card */}
      {focusMode && nextTask && (
        <>
          <FocusBanner t={t} />
          <FocusCard
            task={nextTask}
            onComplete={onCompleteTask}
            onUncomplete={onUncompleteTask}
            onBuffActivated={onBuffActivated}
          />
        </>
      )}

      {/* Regular mission list (hidden in focus mode) */}
      {!focusMode && displayTasks.length > 0 && (
        <div className="space-y-3">
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

      {/* All complete in focus mode */}
      {focusMode && !nextTask && phaseTasks.length > 0 && (
        <AllCompleteBanner t={t} />
      )}
    </div>
  );
}
