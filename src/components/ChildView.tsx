import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncedTaskStore } from '@/hooks/useSyncedTaskStore';
import { useMidnightReset } from '@/hooks/useMidnightReset';
import { useSmartPhase } from '@/hooks/useSmartPhase';
import { useBirthdayCheck } from '@/hooks/useBirthdayCheck';
import { Header } from './Header';
import { ProgressBar } from './ProgressBar';
import { PhaseNavigation } from './PhaseNavigation';
import { PhaseView } from './PhaseView';
import { RewardsStore } from './RewardsStore';
import { WeeklyTimetable } from './WeeklyTimetable';
import { TomorrowsPrep } from './TomorrowsPrep';
import { NightMission, MorningSafetyNet, DailyEssentials, GearMasterTask } from './GearMaster';
import { ChildBottomNavigation, ChildNavTab } from './ChildBottomNavigation';
import { InstallPrompt } from './InstallPrompt';
import { NotificationPrompt } from './NotificationPrompt';
import { NewDayBanner } from './NewDayBanner';
import { WelcomeBanner } from './WelcomeBanner';
import { PhaseTransitionBanner } from './PhaseTransitionBanner';
import { BrowserDetectionBanner } from './BrowserDetectionBanner';
import { IOSInstallBanner } from './IOSInstallBanner';
import { BirthdayCelebration } from './BirthdayCelebration';
import { MyProgress } from './MyProgress';
import { useNotifications } from '@/hooks/useNotifications';
import { Phase, getPhaseForTime } from '@/types/phase';
import { TaskCategory } from '@/types/task';

interface ChildViewProps {
  isViewingAsChild?: boolean;
  viewingChildId?: string;
}

export function ChildView({ isViewingAsChild, viewingChildId }: ChildViewProps) {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ChildNavTab>('tasks');
  const [showNightMission, setShowNightMission] = useState(false);

  // Pass viewingChildId to the store so it loads the correct child's data
  const {
    loading,
    tasks,
    todayLessons,
    timetable,
    todaySchedule,
    dailyGoal,
    smartGoal,
    effectiveGoal,
    appTitle,
    earnedCredits,
    totalPossibleCredits,
    progressPercent,
    lessonRemindersEnabled,
    fridayEnabled,
    schoolQuestEnabled,
    bagPrepEnabled,
    bagPrepCredits,
    bagPrepCompleted,
    isCurrentlyWeekend,
    totalBalance,
    storeRewards,
    buffsActivatedToday,
    childBirthDate,
    childDisplayName,
    completeTask,
    uncompleteTask,
    toggleLesson,
    activateBuff,
    redeemStoreReward,
    updateTimetable,
    completeBagPrep,
    undoBagPrep,
    lessons,
    refetch,
    childAvatar,
    updateChildAvatar,
  } = useSyncedTaskStore(viewingChildId);

  // Birthday check - use child's birth date from store (works for both child login and parent viewing as child)
  const { isBirthday, showCelebration, dismissCelebration, age } = useBirthdayCheck({
    birthDate: childBirthDate,
    childName: childDisplayName || profile?.display_name,
  });

  // Smart phase transitions based on school schedule
  const isSchoolDay = !isCurrentlyWeekend;
  const {
    currentPhase,
    schoolEndTime,
    phaseJustTransitioned,
    dismissTransition,
    timeUntilNextPhase,
  } = useSmartPhase(todaySchedule, isSchoolDay, schoolQuestEnabled);

  // Active phase state (user can manually switch)
  const [activePhase, setActivePhase] = useState<Phase>(currentPhase);

  // Auto-switch to current phase when it changes
  useEffect(() => {
    setActivePhase(currentPhase);
  }, [currentPhase]);

  // Midnight reset - refresh data when day changes
  const handleMidnightReset = useCallback(() => {
    refetch();
  }, [refetch]);

  const { showNewDayMessage, dismissNewDayMessage } = useMidnightReset({
    onReset: handleMidnightReset,
  });

  const {
    permission,
    requestPermission,
  } = useNotifications();

  // Calculate phase stats (hide school if disabled)
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

    // Only add lessons to school phase if school quest is enabled
    if (schoolQuestEnabled) {
      stats.school.total += lessons.length;
      stats.school.completed += lessons.filter(l => l.completed).length;
    }

    return stats;
  }, [tasks, lessons, schoolQuestEnabled]);

  // Calculate active categories (only show categories that have at least one task)
  const activeCategories = useMemo(() => {
    const categoriesWithTasks = new Set(tasks.map(task => task.category));
    // Also count lessons as 'learning' category if school quest is enabled
    if (schoolQuestEnabled && lessons.length > 0) {
      categoriesWithTasks.add('learning');
    }
    return Array.from(categoriesWithTasks);
  }, [tasks, lessons, schoolQuestEnabled]);

  // Loading state when switching children
  if (loading) {
    return (
      <div className={`theme-child-gamer min-h-screen bg-background flex items-center justify-center ${isViewingAsChild ? 'pt-12' : ''}`}>
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
      <div className={`theme-child-gamer min-h-screen bg-background pb-24 no-horizontal-scroll ${isViewingAsChild ? 'pt-12' : ''}`}>
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
    <div className={`theme-child-gamer min-h-[100dvh] bg-background pb-24 overflow-x-hidden ${isViewingAsChild ? 'pt-12' : ''}`}>
      {/* iOS Install Banner - shows for iOS users not in standalone mode */}
      {!isViewingAsChild && <IOSInstallBanner />}
      
      {/* Browser Detection Banner - shows when not in PWA mode */}
      {!isViewingAsChild && <BrowserDetectionBanner />}
      
      {/* New Day Banner - shows at midnight */}
      <NewDayBanner show={showNewDayMessage} onDismiss={dismissNewDayMessage} />
      
      {/* Phase Transition Banner - shows when school ends */}
      <PhaseTransitionBanner 
        show={phaseJustTransitioned} 
        fromPhase="school"
        toPhase="afternoon"
        onDismiss={dismissTransition}
      />
      
      {/* Neon gradient glow - Gamer style */}
      <div className="fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      
      <div className="relative max-w-lg mx-auto safe-area-px pb-8">
        <Header 
          onOpenStore={() => setActiveTab('store')}
          onOpenWeeklySummary={() => {}}
          totalBalance={totalBalance}
          appTitle={appTitle}
          onSignOut={signOut}
          userName={profile?.display_name}
          childAvatar={childAvatar}
          onChangeAvatar={!isViewingAsChild ? updateChildAvatar : undefined}
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
                schoolQuestEnabled={schoolQuestEnabled}
              />

              {/* Focus Fuel Meter */}
              <ProgressBar
                earned={earnedCredits}
                goal={effectiveGoal}
                percent={progressPercent}
                totalBalance={totalBalance}
                totalPossible={totalPossibleCredits}
                isWeekend={isCurrentlyWeekend}
                buffsActivated={buffsActivatedToday}
              />

              {/* Gear Master - Morning Phase: Daily Essentials + Safety Net if Night Mission not done */}
              {bagPrepEnabled && activePhase === 'morning' && !isCurrentlyWeekend && (
                <>
                  {/* Morning Safety Net - Only if Night Mission wasn't completed */}
                  {!bagPrepCompleted && (
                    <MorningSafetyNet
                      timetable={timetable}
                      fridayEnabled={fridayEnabled}
                    />
                  )}
                  {/* Daily Essentials - Always shown in morning */}
                  <DailyEssentials />
                </>
              )}

              {/* Gear Master - Evening Phase: Night Mission */}
              {bagPrepEnabled && activePhase === 'evening' && !isCurrentlyWeekend && (
                <GearMasterTask
                  type="night"
                  credits={bagPrepCredits}
                  isCompleted={bagPrepCompleted}
                  onClick={() => setShowNightMission(true)}
                />
              )}

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
                schoolQuestEnabled={schoolQuestEnabled}
                schoolEndTime={schoolEndTime}
                isSchoolDay={isSchoolDay}
              />
            </div>
          )}
          
          {activeTab === 'timetable' && (
            <div className="space-y-6">
              {/* Night Mission - Full interactive version in timetable tab */}
              {bagPrepEnabled && !isCurrentlyWeekend && (
                <NightMission 
                  timetable={timetable}
                  fridayEnabled={fridayEnabled}
                  credits={bagPrepCredits}
                  isCompleted={bagPrepCompleted}
                  onComplete={completeBagPrep}
                  onUndo={undoBagPrep}
                />
              )}
              
              <WeeklyTimetable 
                timetable={timetable} 
                onUpdateTimetable={updateTimetable} 
                fridayEnabled={fridayEnabled} 
              />
            </div>
          )}

          {activeTab === 'progress' && (
            <MyProgress 
              onClose={() => setActiveTab('tasks')}
              activeCategories={activeCategories}
            />
          )}
        </div>

        {/* Night Mission Modal - when opened from task card */}
        {showNightMission && (
          <div className="fixed inset-0 z-50 bg-background/95 p-4 overflow-y-auto">
            <div className="max-w-lg mx-auto pt-4">
              <button
                onClick={() => setShowNightMission(false)}
                className="mb-4 text-sm text-muted-foreground hover:text-foreground"
              >
                ← חזרה למשימות
              </button>
              <NightMission 
                timetable={timetable}
                fridayEnabled={fridayEnabled}
                credits={bagPrepCredits}
                isCompleted={bagPrepCompleted}
                onComplete={() => {
                  completeBagPrep();
                  setTimeout(() => setShowNightMission(false), 2000);
                }}
                onUndo={undoBagPrep}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <ChildBottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Smart PWA Install Prompt */}
      {!isViewingAsChild && <InstallPrompt showAsModal={false} />}

      {/* Notification Permission Prompt */}
      {!isViewingAsChild && (
        <NotificationPrompt
          permission={permission}
          onRequestPermission={requestPermission}
        />
      )}

      {/* Welcome Banner for new users */}
      {!isViewingAsChild && profile?.id && (
        <WelcomeBanner 
          userId={profile.id} 
          userName={profile.display_name} 
        />
      )}

      {/* Birthday Celebration */}
      <BirthdayCelebration
        show={showCelebration}
        childName={childDisplayName || profile?.display_name}
        age={age}
        onDismiss={dismissCelebration}
      />
    </div>
  );
}
