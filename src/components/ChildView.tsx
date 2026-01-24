import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncedTaskStore } from '@/hooks/useSyncedTaskStore';
import { Header } from './Header';
import { ProgressBar } from './ProgressBar';
import { PhaseNavigation } from './PhaseNavigation';
import { PhaseView } from './PhaseView';
import { RewardsStore } from './RewardsStore';
import { WeeklyTimetable } from './WeeklyTimetable';
import { ChildBottomNavigation, ChildNavTab } from './ChildBottomNavigation';
import { InstallPWA } from './InstallPWA';
import { NotificationPrompt } from './NotificationPrompt';
import { useNotifications } from '@/hooks/useNotifications';
import { Phase, getCurrentPhase, getPhaseForTime } from '@/types/phase';

interface ChildViewProps {
  isViewingAsChild?: boolean;
  viewingChildId?: string;
}

export function ChildView({ isViewingAsChild, viewingChildId }: ChildViewProps) {
  const { profile, signOut } = useAuth();
  const [activePhase, setActivePhase] = useState<Phase>(getCurrentPhase());
  const [activeTab, setActiveTab] = useState<ChildNavTab>('tasks');
  const currentPhase = getCurrentPhase();

  // Pass viewingChildId to the store so it loads the correct child's data
  const {
    loading,
    tasks,
    todayLessons,
    timetable,
    todaySchedule,
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
    toggleLesson,
    activateBuff,
    redeemStoreReward,
    updateTimetable,
    lessons,
  } = useSyncedTaskStore(viewingChildId);

  const {
    permission,
    requestPermission,
  } = useNotifications();

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

    stats.school.total += lessons.length;
    stats.school.completed += lessons.filter(l => l.completed).length;

    return stats;
  }, [tasks, lessons]);

  // Loading state when switching children
  if (loading) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center ${isViewingAsChild ? 'pt-12' : ''}`}>
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">
            {viewingChildId ? `טוען נתונים עבור ${profile?.display_name || 'ילד'}...` : 'טוען...'}
          </p>
        </div>
      </div>
    );
  }

  // Store view is full-screen
  if (activeTab === 'store') {
    return (
      <div className={`min-h-screen bg-background pb-24 no-horizontal-scroll ${isViewingAsChild ? 'pt-12' : ''}`}>
        <div className="tab-content">
          <RewardsStore
            totalBalance={totalBalance}
            storeRewards={storeRewards}
            onRedeem={redeemStoreReward}
            onClose={() => setActiveTab('tasks')}
          />
        </div>
        <ChildBottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background pb-24 no-horizontal-scroll ${isViewingAsChild ? 'pt-12' : ''}`}>
      {/* Subtle gradient glow */}
      <div className="fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
      
      <div className="relative max-w-lg mx-auto safe-area-px pb-8">
        <Header 
          onOpenStore={() => setActiveTab('store')}
          onOpenWeeklySummary={() => {}}
          totalBalance={totalBalance}
          appTitle={appTitle}
          onSignOut={signOut}
          userName={profile?.display_name}
        />
        
        <div className="tab-content">
          {activeTab === 'tasks' && (
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
          )}
          
          {activeTab === 'timetable' && (
            <div className="space-y-6">
              <WeeklyTimetable 
                timetable={timetable} 
                onUpdateTimetable={updateTimetable} 
                fridayEnabled={fridayEnabled} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <ChildBottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* PWA Install Banner */}
      {!isViewingAsChild && <InstallPWA />}

      {/* Notification Permission Prompt */}
      {!isViewingAsChild && (
        <NotificationPrompt
          permission={permission}
          onRequestPermission={requestPermission}
        />
      )}
    </div>
  );
}
