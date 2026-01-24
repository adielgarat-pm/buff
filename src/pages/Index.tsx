import { useState, useEffect, useMemo } from 'react';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useNotifications } from '@/hooks/useNotifications';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { ParentMode } from '@/components/ParentMode';
import { PhaseNavigation } from '@/components/PhaseNavigation';
import { PhaseView } from '@/components/PhaseView';
import { RewardsStore } from '@/components/RewardsStore';
import { WeeklySummary } from '@/components/WeeklySummary';
import { InstallPWA } from '@/components/InstallPWA';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { DailySchedule } from '@/components/DailySchedule';
import { WeeklyTimetable } from '@/components/WeeklyTimetable';
import { BottomNavigation, NavTab } from '@/components/BottomNavigation';
import { useWeeklySummary, isSaturday } from '@/hooks/useWeeklySummary';
import { Phase, getCurrentPhase, getPhaseForTime } from '@/types/phase';

const Index = () => {
  const [parentModeOpen, setParentModeOpen] = useState(false);
  const [weeklySummaryOpen, setWeeklySummaryOpen] = useState(false);
  const [activePhase, setActivePhase] = useState<Phase>(getCurrentPhase());
  const [activeTab, setActiveTab] = useState<NavTab>('tasks');
  const [weeklySummaryDismissed, setWeeklySummaryDismissed] = useState(() => {
    const dismissed = localStorage.getItem('weeklySummaryDismissed');
    if (dismissed) {
      const { date } = JSON.parse(dismissed);
      return date === new Date().toISOString().split('T')[0];
    }
    return false;
  });
  const currentPhase = getCurrentPhase();
  
  const {
    tasks,
    todayLessons,
    timetable,
    todaySchedule,
    rewards,
    dailyGoal,
    appTitle,
    earnedCredits,
    progressPercent,
    lessonRemindersEnabled,
    totalBalance,
    storeRewards,
    completeTask,
    uncompleteTask,
    updateTask,
    addTask,
    deleteTask,
    updateDailyGoal,
    updateAppTitle,
    toggleLesson,
    updateTimetable,
    toggleLessonReminders,
    redeemStoreReward,
    updateStoreRewards,
    lessons,
  } = useTaskStore();

  // Notification system
  const {
    permission,
    requestPermission,
    scheduleTaskNotifications,
    scheduleLessonNotifications,
  } = useNotifications();

  // Weekly summary data
  const weeklySummaryData = useWeeklySummary(tasks, storeRewards);
  const showWeeklySummary = isSaturday() && !weeklySummaryDismissed;

  const handleDismissWeeklySummary = () => {
    setWeeklySummaryDismissed(true);
    localStorage.setItem('weeklySummaryDismissed', JSON.stringify({
      date: new Date().toISOString().split('T')[0]
    }));
  };

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

  // Schedule notifications when tasks change or permission is granted
  useEffect(() => {
    if (permission === 'granted' && tasks.length > 0) {
      scheduleTaskNotifications(tasks);
    }
  }, [permission, tasks, scheduleTaskNotifications]);

  // Schedule lesson notifications
  useEffect(() => {
    if (permission === 'granted' && lessonRemindersEnabled && todaySchedule.length > 0) {
      scheduleLessonNotifications(todaySchedule, lessonRemindersEnabled);
    }
  }, [permission, todaySchedule, lessonRemindersEnabled, scheduleLessonNotifications]);

  // Listen for task completion from service worker
  useEffect(() => {
    const handleSwCompleteTask = (event: CustomEvent<{ taskId: string }>) => {
      completeTask(event.detail.taskId);
    };

    window.addEventListener('sw-complete-task', handleSwCompleteTask as EventListener);
    return () => {
      window.removeEventListener('sw-complete-task', handleSwCompleteTask as EventListener);
    };
  }, [completeTask]);

  // Show Weekly Summary on Saturday (auto) or manually opened
  if (showWeeklySummary || weeklySummaryOpen) {
    return (
      <WeeklySummary 
        data={weeklySummaryData} 
        onClose={() => {
          setWeeklySummaryOpen(false);
          if (isSaturday()) {
            handleDismissWeeklySummary();
          }
        }} 
      />
    );
  }

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
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
          </div>
        );
      
      case 'timetable':
        return (
          <div className="space-y-6">
            <WeeklyTimetable timetable={timetable} />
          </div>
        );
      
      case 'store':
        return (
          <RewardsStore
            totalBalance={totalBalance}
            storeRewards={storeRewards}
            onRedeem={redeemStoreReward}
            onClose={() => setActiveTab('tasks')}
          />
        );
      
      default:
        return null;
    }
  };

  // Store view is full-screen, so handle it separately
  if (activeTab === 'store') {
    return (
      <div className="min-h-screen bg-background pb-24">
        <RewardsStore
          totalBalance={totalBalance}
          storeRewards={storeRewards}
          onRedeem={redeemStoreReward}
          onClose={() => setActiveTab('tasks')}
        />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Subtle gradient glow */}
      <div className="fixed inset-x-0 top-0 h-96 bg-gradient-to-b from-primary/3 to-transparent pointer-events-none" />
      
      <div className="relative max-w-lg mx-auto px-4 pb-8">
        <Header 
          onOpenSettings={() => setParentModeOpen(true)} 
          onOpenStore={() => setActiveTab('store')}
          onOpenWeeklySummary={() => setWeeklySummaryOpen(true)}
          totalBalance={totalBalance}
          appTitle={appTitle}
        />
        
        {renderTabContent()}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Parent Mode Dialog */}
      <ParentMode
        open={parentModeOpen}
        onClose={() => setParentModeOpen(false)}
        tasks={tasks}
        dailyGoal={dailyGoal}
        appTitle={appTitle}
        timetable={timetable}
        lessonRemindersEnabled={lessonRemindersEnabled}
        storeRewards={storeRewards}
        onUpdateTask={updateTask}
        onAddTask={addTask}
        onDeleteTask={deleteTask}
        onUpdateGoal={updateDailyGoal}
        onUpdateAppTitle={updateAppTitle}
        onUpdateTimetable={updateTimetable}
        onToggleLessonReminders={toggleLessonReminders}
        onUpdateStoreRewards={updateStoreRewards}
      />

      {/* PWA Install Banner */}
      <InstallPWA />

      {/* Notification Permission Prompt */}
      <NotificationPrompt
        permission={permission}
        onRequestPermission={requestPermission}
      />
    </div>
  );
};

export default Index;
