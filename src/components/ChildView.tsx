import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncedTaskStore } from '@/hooks/useSyncedTaskStore';
import { useMidnightReset } from '@/hooks/useMidnightReset';
import { useSmartPhase } from '@/hooks/useSmartPhase';
import { useBirthdayCheck } from '@/hooks/useBirthdayCheck';
import { useChildPreferences } from '@/hooks/useChildPreferences';
import { ChildOnboarding } from './ChildOnboarding';
import { Header } from './Header';
import { ProgressBar } from './ProgressBar';
import { PhaseView } from './PhaseView';
import { RewardsStore } from './RewardsStore';
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
import { PackCompletionCelebration } from './PackCompletionCelebration';
import { PetDisplay } from './PetDisplay';
import { ChildCommandCenter } from './ChildCommandCenter';
import { DragonMigrationModal } from './DragonMigrationModal';
import { ChildSidebar } from './ChildSidebar';
import { RewardMilestoneToast } from './RewardMilestoneToast';
import { StickerCelebration } from './StickerCelebration';
import { DailyVibeCheck } from './DailyVibeCheck';
import { useNotifications } from '@/hooks/useNotifications';
import { useChildStickers } from '@/hooks/useChildStickers';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVibeCheck } from '@/hooks/useVibeCheck';
import { useSubscription } from '@/hooks/useSubscription';
import { usePackCompletion } from '@/hooks/usePackCompletion';
import { useChildPet } from '@/hooks/useChildPet';
import { playSuccessChime } from '@/utils/soundEffects';
import { Phase, PHASES, getSmartPhaseForTime } from '@/types/phase';
import { PhaseNavigation } from './PhaseNavigation';
import { TaskCategory } from '@/types/task';

interface ChildViewProps {
  isViewingAsChild?: boolean;
  viewingChildId?: string;
}

export function ChildView({ isViewingAsChild, viewingChildId }: ChildViewProps) {
  const { profile, signOut, familyId } = useAuth();
  const { t } = useLanguage();
  const { isProUser } = useSubscription();
  const [activeTab, setActiveTab] = useState<ChildNavTab>('tasks');
  const [showNightMission, setShowNightMission] = useState(false);
  const [showCommandCenter, setShowCommandCenter] = useState(false);

  // Sticker celebration for child
  const effectiveChildId = viewingChildId || profile?.id;
  const { pendingSticker, dismissSticker } = useChildStickers(effectiveChildId, familyId);

  // Daily Vibe Check
  const vibeCheck = useVibeCheck(effectiveChildId);

  // Child preferences (theme, pet toggle, age mode)
  const isOwnDevice = profile?.role === 'child' && profile?.user_id !== null;
  const {
    preferences: childPrefs,
    themeClass,
    showPet: childWantsPet,
    isTeen,
    needsOnboarding,
    savePreferences,
    loading: prefsLoading,
  } = useChildPreferences(viewingChildId);

  // Show pet only if Pro AND child has it enabled
  const showPetDisplay = isProUser && childWantsPet;

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
    unclaimStoreReward,
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

  // Pack completion celebration - Pro users only
  const {
    showCelebration: showPackCelebration,
    creditsEarned: packCreditsEarned,
    dismissCelebration: dismissPackCelebration,
  } = usePackCompletion({ tasks, isProUser });

  // Pet module - Pro users only
  const childPet = useChildPet(viewingChildId);
  const [petJustCompletedTask, setPetJustCompletedTask] = useState(false);
  const restTickets = childPet.petState.rest_cards_balance;

  // Listen for notification-triggered task completions → pet happy reaction
  useEffect(() => {
    const handler = () => {
      setPetJustCompletedTask(true);
    };
    window.addEventListener('pet-task-completed-via-notification', handler);
    return () => window.removeEventListener('pet-task-completed-via-notification', handler);
  }, []);

  // Wrap completeTask to also feed pet XP
  const handleCompleteTask = useCallback((taskId: string) => {
    completeTask(taskId);
    playSuccessChime();
    if (isProUser) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        childPet.onTaskCompleted(task.credits || 10);
        setPetJustCompletedTask(true);
      }
    }
  }, [completeTask, isProUser, tasks, childPet]);

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

  // Calculate phase stats using same logic as PhaseView (smart boundaries + scheduleDays filter)
  const phaseStats = useMemo(() => {
    const stats: Record<Phase, { completed: number; total: number }> = {
      morning: { completed: 0, total: 0 },
      school: { completed: 0, total: 0 },
      afternoon: { completed: 0, total: 0 },
      evening: { completed: 0, total: 0 },
    };

    const currentDayOfWeek = new Date().getDay();

    tasks.forEach(task => {
      // Filter by scheduleDays — same logic as PhaseView
      const scheduleDays = task.scheduleDays || [0, 1, 2, 3, 4, 5];
      if (!scheduleDays.includes(currentDayOfWeek)) return;

      const phase = getSmartPhaseForTime(task.time, schoolEndTime, isSchoolDay && schoolQuestEnabled);
      stats[phase].total++;
      if (task.completed) stats[phase].completed++;
    });

    // Only add lessons to school phase if school quest is enabled
    if (schoolQuestEnabled) {
      stats.school.total += lessons.length;
      stats.school.completed += lessons.filter(l => l.completed).length;
    }

    return stats;
  }, [tasks, lessons, schoolQuestEnabled, schoolEndTime, isSchoolDay]);

  // Calculate active categories (only show categories that have at least one task)
  const activeCategories = useMemo(() => {
    const categoriesWithTasks = new Set(tasks.map(task => task.category));
    // Also count lessons as 'learning' category if school quest is enabled
    if (schoolQuestEnabled && lessons.length > 0) {
      categoriesWithTasks.add('learning');
    }
    return Array.from(categoriesWithTasks);
  }, [tasks, lessons, schoolQuestEnabled]);

  // Child onboarding gate — only for own-device children who haven't completed it
  if (!prefsLoading && needsOnboarding && isOwnDevice && !isViewingAsChild) {
    return (
      <ChildOnboarding
        childName={childDisplayName || profile?.display_name}
        onComplete={savePreferences}
      />
    );
  }

  // Dynamic theme based on child preferences
  if (loading || prefsLoading) {
    return (
      <div className={`${themeClass} min-h-screen bg-background flex items-center justify-center ${isViewingAsChild ? 'pt-12' : ''}`}>
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">
            {viewingChildId ? `${t('common.loadingDataFor')} ${profile?.display_name || t('common.child')}...` : t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  // Store view is full-screen
  if (activeTab === 'store') {
    return (
      <div className={`${themeClass} min-h-screen bg-background pb-24 no-horizontal-scroll ${isViewingAsChild ? 'pt-12' : ''}`}>
        <div className="tab-content">
          <RewardsStore
            totalBalance={totalBalance}
            storeRewards={storeRewards}
            onRedeem={redeemStoreReward}
            onUnclaim={unclaimStoreReward}
            onClose={() => setActiveTab('tasks')}
          />
        </div>
        <ChildBottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  // Main child view with dynamic theme
  return (
    <div className={`${themeClass} min-h-[100dvh] bg-background pb-24 overflow-x-hidden ${isViewingAsChild ? 'pt-12' : ''}`}>
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
      
      {/* Soft gradient glow - Playful style */}
      <div className="fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      
      {/* Child Sidebar - language & command center */}
      <ChildSidebar onOpenCommandCenter={() => setShowCommandCenter(true)} isViewingAsChild={isViewingAsChild} />

      <div className="relative max-w-lg mx-auto safe-area-px pb-8">
        <Header 
          onOpenStore={() => setActiveTab('store')}
          onOpenWeeklySummary={() => {}}
          totalBalance={totalBalance}
          appTitle={appTitle}
          onSignOut={signOut}
          userName={profile?.display_name}
          childAvatar={childAvatar}
          onChangeAvatar={updateChildAvatar}
        />
        
        <div className="tab-content">
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              {/* Stage Navigation - Horizontal selector for all stages */}
              <PhaseNavigation
                activePhase={activePhase}
                currentPhase={currentPhase}
                onPhaseChange={setActivePhase}
                phaseStats={phaseStats}
                schoolQuestEnabled={schoolQuestEnabled}
                isTeen={isTeen}
              />

               {/* Pet Display - Pro users who enabled it, above the fold */}
              {showPetDisplay && (
                <div className="rounded-2xl bg-card border border-border p-3">
                  <PetDisplay
                    childName={childDisplayName || profile?.display_name}
                    childId={viewingChildId}
                    justCompletedTask={petJustCompletedTask}
                    onTaskCompletionAck={() => setPetJustCompletedTask(false)}
                    completedToday={tasks.filter(t => t.completed).length}
                    totalToday={tasks.length}
                  />
                </div>
              )}

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
                onCompleteTask={handleCompleteTask}
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
          
          {/* Timetable and Progress tabs removed for cognitive load reduction */}
        </div>

        {/* Night Mission Modal - when opened from task card */}
        {showNightMission && (
          <div className="fixed inset-0 z-50 bg-background/95 p-4 overflow-y-auto">
            <div className="max-w-lg mx-auto pt-4">
              <button
                onClick={() => setShowNightMission(false)}
                className="mb-4 text-sm text-muted-foreground hover:text-foreground"
              >
                ← {t('common.backToTasks')}
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

      {/* Dragon Migration - prompt existing dragon users to pick a new pet */}
      {(viewingChildId || profile?.id) && (
        <DragonMigrationModal childId={viewingChildId || profile?.id} />
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

      {/* Pack Completion Celebration - Pro users */}
      <PackCompletionCelebration
        show={showPackCelebration}
        childName={childDisplayName || profile?.display_name}
        creditsEarned={packCreditsEarned}
        onDismiss={dismissPackCelebration}
      />

      {/* Transient Reward Milestone Notifications */}
      <RewardMilestoneToast
        totalBalance={totalBalance}
        storeRewards={storeRewards}
      />

      {/* Child Command Center */}
      <ChildCommandCenter
        open={showCommandCenter}
        onClose={() => setShowCommandCenter(false)}
        preferences={childPrefs}
        onSave={savePreferences}
        childId={profile?.id}
      />

      {/* Sticker Celebration from Parent */}
      <StickerCelebration
        show={!!pendingSticker}
        stickerType={pendingSticker?.sticker_type || 'star'}
        message={pendingSticker?.message}
        onDismiss={dismissSticker}
      />
    </div>
  );
}
