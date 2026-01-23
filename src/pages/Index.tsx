import { useState, useEffect, useMemo } from 'react';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { RewardsSection } from '@/components/RewardsSection';
import { ParentMode } from '@/components/ParentMode';
import { PhaseNavigation } from '@/components/PhaseNavigation';
import { PhaseView } from '@/components/PhaseView';
import { Phase, getCurrentPhase, getPhaseForTime, PHASES } from '@/types/phase';

const Index = () => {
  const [parentModeOpen, setParentModeOpen] = useState(false);
  const [activePhase, setActivePhase] = useState<Phase>(getCurrentPhase());
  const currentPhase = getCurrentPhase();
  
  const {
    tasks,
    todayLessons,
    timetable,
    todaySchedule,
    rewards,
    dailyGoal,
    earnedCredits,
    progressPercent,
    lessonRemindersEnabled,
    completeTask,
    uncompleteTask,
    updateTask,
    addTask,
    deleteTask,
    updateDailyGoal,
    toggleLesson,
    updateTimetable,
    toggleLessonReminders,
    lessons,
  } = useTaskStore();

  // Calculate phase stats
  const phaseStats = useMemo(() => {
    const stats: Record<Phase, { completed: number; total: number }> = {
      morning: { completed: 0, total: 0 },
      school: { completed: 0, total: 0 },
      afternoon: { completed: 0, total: 0 },
      evening: { completed: 0, total: 0 },
    };

    tasks.forEach(task => {
      const phase = getPhaseForTime(task.time);
      stats[phase].total++;
      if (task.completed) stats[phase].completed++;
    });

    // Add lessons to school phase
    stats.school.total += lessons.length;
    stats.school.completed += lessons.filter(l => l.completed).length;

    return stats;
  }, [tasks, lessons]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Set up task reminders
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      tasks.forEach(task => {
        if (!task.completed && task.time === currentTime) {
          new Notification(`Time for: ${task.title}`, {
            body: `Complete this task to earn ${task.credits} credits!`,
            icon: '/favicon.ico',
          });
        }
      });
    };

    const interval = setInterval(checkReminders, 60000);
    checkReminders();

    return () => clearInterval(interval);
  }, [tasks]);

  // Set up lesson reminders (5 minutes before)
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!lessonRemindersEnabled || todaySchedule.length === 0) return;

    const checkLessonReminders = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      todaySchedule.forEach((period, index) => {
        if (!period.subject) return;
        
        const [hours, mins] = period.startTime.split(':').map(Number);
        const lessonMinutes = hours * 60 + mins;
        const reminderMinutes = lessonMinutes - 5;

        if (currentMinutes === reminderMinutes) {
          new Notification(`Next: ${period.subject}`, {
            body: `Period ${index + 1} starts in 5 minutes!`,
            icon: '/favicon.ico',
          });
        }
      });
    };

    const interval = setInterval(checkLessonReminders, 60000);
    checkLessonReminders();

    return () => clearInterval(interval);
  }, [todaySchedule, lessonRemindersEnabled]);

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle gradient glow */}
      <div className="fixed inset-x-0 top-0 h-96 bg-gradient-to-b from-primary/3 to-transparent pointer-events-none" />
      
      <div className="relative max-w-lg mx-auto px-4 pb-8">
        <Header onOpenSettings={() => setParentModeOpen(true)} />
        
        <div className="space-y-6">
          {/* Phase Navigation */}
          <PhaseNavigation
            activePhase={activePhase}
            currentPhase={currentPhase}
            onPhaseChange={setActivePhase}
            phaseStats={phaseStats}
          />

          {/* Daily Progress Bar */}
          <ProgressBar
            earned={earnedCredits}
            goal={dailyGoal}
            percent={progressPercent}
          />

          {/* Phase Content */}
          <PhaseView
            phase={activePhase}
            tasks={tasks}
            lessons={todayLessons}
            timetable={timetable}
            todaySchedule={todaySchedule}
            onCompleteTask={completeTask}
            onUncompleteTask={uncompleteTask}
            onToggleLesson={toggleLesson}
          />

          {/* Rewards Section - Only show when relevant */}
          {earnedCredits > 0 && (
            <RewardsSection
              rewards={rewards}
              earnedCredits={earnedCredits}
            />
          )}
        </div>

        {/* Parent Mode Dialog */}
        <ParentMode
          open={parentModeOpen}
          onClose={() => setParentModeOpen(false)}
          tasks={tasks}
          dailyGoal={dailyGoal}
          timetable={timetable}
          lessonRemindersEnabled={lessonRemindersEnabled}
          onUpdateTask={updateTask}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
          onUpdateGoal={updateDailyGoal}
          onUpdateTimetable={updateTimetable}
          onToggleLessonReminders={toggleLessonReminders}
        />
      </div>
    </div>
  );
};

export default Index;
