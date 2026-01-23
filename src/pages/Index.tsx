import { useState, useEffect } from 'react';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { StatsRow } from '@/components/StatsRow';
import { TaskList } from '@/components/TaskList';
import { RewardsSection } from '@/components/RewardsSection';
import { ParentMode } from '@/components/ParentMode';
import { SchoolDaySection } from '@/components/SchoolDaySection';
import { DailySchedule } from '@/components/DailySchedule';

const Index = () => {
  const [parentModeOpen, setParentModeOpen] = useState(false);
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
  } = useTaskStore();

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

    // Check every minute
    const interval = setInterval(checkReminders, 60000);
    
    // Check immediately on load
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
      {/* Gradient glow at top */}
      <div className="fixed inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      <div className="relative max-w-lg mx-auto px-4 pb-8">
        <Header onOpenSettings={() => setParentModeOpen(true)} />
        
        <div className="space-y-6">
          {/* Progress Section */}
          <ProgressBar
            earned={earnedCredits}
            goal={dailyGoal}
            percent={progressPercent}
          />

          {/* Category Stats */}
          <StatsRow tasks={tasks} />

          {/* Daily Schedule */}
          <DailySchedule timetable={timetable} />

          {/* School Day Checkboxes */}
          <SchoolDaySection
            lessons={todayLessons}
            todaySchedule={todaySchedule}
            onToggleLesson={toggleLesson}
          />

          {/* Rewards */}
          <RewardsSection
            rewards={rewards}
            earnedCredits={earnedCredits}
          />

          {/* Task List */}
          <TaskList
            tasks={tasks}
            onComplete={completeTask}
            onUncomplete={uncompleteTask}
          />
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
