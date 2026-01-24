import { useState, useEffect, useMemo } from 'react';
import { useSyncedTaskStore } from '@/hooks/useSyncedTaskStore';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { ParentDashboard } from '@/components/ParentDashboard';
import { PhaseNavigation } from '@/components/PhaseNavigation';
import { PhaseView } from '@/components/PhaseView';
import { RewardsStore } from '@/components/RewardsStore';
import { WeeklySummary } from '@/components/WeeklySummary';
import { InstallPWA } from '@/components/InstallPWA';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { WeeklyTimetable } from '@/components/WeeklyTimetable';
import { BottomNavigation, NavTab } from '@/components/BottomNavigation';
import { useWeeklySummary, isSaturday } from '@/hooks/useWeeklySummary';
import { Phase, getCurrentPhase, getPhaseForTime } from '@/types/phase';
import { FamilyCodeDisplay } from '@/components/FamilyCodeDisplay';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { profile, familyId, signOut } = useAuth();
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
    loading,
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
    fridayEnabled,
    totalBalance,
    storeRewards,
    buffsActivatedToday,
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
    toggleFridayEnabled,
    redeemStoreReward,
    updateStoreRewards,
    activateBuff,
    lessons,
  } = useSyncedTaskStore();

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your quests...</p>
        </div>
      </div>
    );
  }

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

  const isParent = profile?.role === 'parent';

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

            {/* Focus Fuel Meter */}
            <ProgressBar
              earned={earnedCredits}
              goal={dailyGoal}
              percent={progressPercent}
              totalBalance={totalBalance}
              buffsActivated={buffsActivatedToday}
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
              onBuffActivated={activateBuff}
              fridayEnabled={fridayEnabled}
            />
          </div>
        );
      
      case 'timetable':
        return (
          <div className="space-y-6">
            <WeeklyTimetable timetable={timetable} onUpdateTimetable={updateTimetable} fridayEnabled={fridayEnabled} />
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

      case 'settings':
        if (!isParent) return null;
        return (
          <ParentDashboard
            tasks={tasks}
            dailyGoal={dailyGoal}
            appTitle={appTitle}
            timetable={timetable}
            lessonRemindersEnabled={lessonRemindersEnabled}
            fridayEnabled={fridayEnabled}
            storeRewards={storeRewards}
            onUpdateTask={updateTask}
            onAddTask={addTask}
            onDeleteTask={deleteTask}
            onUpdateGoal={updateDailyGoal}
            onUpdateAppTitle={updateAppTitle}
            onUpdateTimetable={updateTimetable}
            onToggleLessonReminders={toggleLessonReminders}
            onToggleFridayEnabled={toggleFridayEnabled}
            onUpdateStoreRewards={updateStoreRewards}
            onBack={() => setActiveTab('tasks')}
          />
        );
      
      default:
        return null;
    }
  };

  // Store view is full-screen, so handle it separately
  if (activeTab === 'store') {
    return (
      <div className="min-h-screen bg-background pb-24 no-horizontal-scroll safe-area-inset">
        <div className="tab-content screen-padding">
          <RewardsStore
            totalBalance={totalBalance}
            storeRewards={storeRewards}
            onRedeem={redeemStoreReward}
            onClose={() => setActiveTab('tasks')}
          />
        </div>
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} isParent={isParent} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 no-horizontal-scroll safe-area-inset">
      {/* Subtle gradient glow */}
      <div className="fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      <div className="relative max-w-lg mx-auto screen-padding pb-8">
        <Header 
          onOpenStore={() => setActiveTab('store')}
          onOpenWeeklySummary={() => setWeeklySummaryOpen(true)}
          totalBalance={totalBalance}
          appTitle={appTitle}
          onSignOut={signOut}
          userName={profile?.display_name}
        />
        
        <div className="tab-content">
          {renderTabContent()}
        </div>

        {/* Family Code Display for Parents */}
        {isParent && familyId && (
          <FamilyCodeDisplay familyId={familyId} />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isParent={isParent}
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
