import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSyncedTaskStore } from '@/hooks/useSyncedTaskStore';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
import { ParentBottomNavigation, ParentNavTab } from './ParentBottomNavigation';
import { ParentFamilyOverview } from './ParentFamilyOverview';
import { ParentSettings } from './ParentSettings';
import { ParentReports } from './ParentReports';
import { ChildView } from './ChildView';
import { ViewAsChildBanner } from './ViewAsChildBanner';
import { ChildPickerDialog } from './ChildPickerDialog';
import { InstallPrompt } from './InstallPrompt';
import { ParentWelcomeBanner } from './ParentWelcomeBanner';
import { BrowserDetectionBanner } from './BrowserDetectionBanner';
import { IOSInstallBanner } from './IOSInstallBanner';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { GlobalFooter } from './GlobalFooter';
import { DashboardFAB } from './dashboard';
import { Loader2, Crown, Lightbulb, Lock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from './UpgradeModal';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { ParentOnboarding, OnboardingData } from './onboarding/ParentOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/** Silent Launch mode: insights are open to all users */
function ProGatedInsights({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function ParentView() {
  const { signOut, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { children, refetch: refetchChildren } = useFamilyMembers();
  
  const [activeTab, setActiveTab] = useState<ParentNavTab>('overview');
  const [viewingAsChildId, setViewingAsChildId] = useState<string | null>(null);
  const [selectedChildIdForSettings, setSelectedChildIdForSettings] = useState<string | null>(null);
  const [childPickerOpen, setChildPickerOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Sync internal navigation with browser history for proper back gesture
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as ParentNavTab);
    if (tab !== 'settings') {
      setSelectedChildIdForSettings(null);
    }
  }, []);

  useNavigationHistory(activeTab, handleTabChange, ['overview', 'settings', 'reports']);

  const {
    loading,
    appTitle,
    lessonRemindersEnabled,
    fridayEnabled,
    updateAppTitle,
    toggleLessonReminders,
    // toggleFridayEnabled removed - Friday is now auto-managed from schedule imports
  } = useSyncedTaskStore();

  // Loading state
  if (loading) {
    return (
      <div className="theme-parent-zen min-h-[100dvh] bg-background flex items-center justify-center overflow-x-hidden">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t('parentView.loading')}</p>
        </div>
      </div>
    );
  }

  // If viewing as child, show child view with banner
  if (viewingAsChildId) {
    const viewingChild = children.find(c => c.id === viewingAsChildId);
    return (
      <>
        <ViewAsChildBanner 
          childName={viewingChild?.displayName || t('parentView.child')} 
          onExitViewAsChild={() => setViewingAsChildId(null)} 
        />
        <ChildView isViewingAsChild viewingChildId={viewingAsChildId} />
      </>
    );
  }

  const handleSelectChildForSettings = (childId: string) => {
    setSelectedChildIdForSettings(childId);
    setActiveTab('settings');
  };

  const handleViewAsChild = (childId: string) => {
    setViewingAsChildId(childId);
  };

  // Handle onboarding completion — child profile already exists from Step 1
  const handleOnboardingComplete = async (onboardingData: OnboardingData) => {
    if (!profile?.family_id) {
      toast.error(t('parentSettings.noFamilyFound'));
      return;
    }

    const childProfileId = onboardingData.childProfileId;
    if (!childProfileId) {
      toast.error('שגיאה פנימית: פרופיל הילד לא נמצא.');
      return;
    }

    try {
      // Import pack definitions to create tasks with correct credits
      const { PACK_DEFINITIONS } = await import('@/data/starterPacks');
      const packDef = PACK_DEFINITIONS[onboardingData.schoolFeature];

      // Create pack tasks in parallel with the custom reward
      const packTaskInserts = packDef?.tasks?.length
        ? packDef.tasks.map((task) => ({
            family_id: profile.family_id,
            assigned_to: childProfileId,
            title: t(task.titleKey),
            category: task.category,
            time: task.time,
            credits: task.credits,
            icon: task.icon,
          }))
        : [];

      // Also add the user's custom first task
      if (onboardingData.firstTask) {
        const categoryMap: Record<string, string> = {
          'homework': 'learning', 'project': 'learning',
          'fitness': 'movement', 'home': 'responsibility',
        };
        packTaskInserts.push({
          family_id: profile.family_id,
          assigned_to: childProfileId,
          title: onboardingData.firstTask,
          category: categoryMap[onboardingData.focusArea] || 'learning',
          time: '16:00',
          credits: 15,
          icon: '✨',
        });
      }

      const [taskResult, rewardResult] = await Promise.allSettled([
        packTaskInserts.length > 0
          ? supabase.from('tasks').insert(packTaskInserts)
          : Promise.resolve({ error: null }),
        supabase.from('store_rewards').insert({
          family_id: profile.family_id,
          assigned_to: childProfileId,
          title: onboardingData.weekendReward,
          emoji: '🎉',
          price: 100,
        }),
      ]);

      // Mark onboarding as complete (step 6)
      await supabase
        .from('profiles')
        .update({ onboarding_step: 6 })
        .eq('id', profile.id);

      const warnings: string[] = [];
      if (taskResult.status === 'rejected' || (taskResult.status === 'fulfilled' && taskResult.value.error)) {
        warnings.push('המשימה הראשונה');
      }
      if (rewardResult.status === 'rejected' || (rewardResult.status === 'fulfilled' && rewardResult.value.error)) {
        warnings.push('הפרס הראשון');
      }

      // Close modal and refresh
      setOnboardingOpen(false);
      await refetchChildren();

      if (warnings.length > 0) {
        toast.warning(`${onboardingData.childName} נוסף/ה בהצלחה, אבל לא הצלחנו ליצור: ${warnings.join(' ו')}. אפשר להוסיף אותם ידנית בהגדרות.`);
      } else {
        toast.success(`${onboardingData.childName} ${t('parentSettings.childAddedSuccess')}`);
      }

      // Navigate to the new child's settings
      setSelectedChildIdForSettings(childProfileId);
      setActiveTab('settings');
    } catch (error: any) {
      console.error('Onboarding completion error:', error);
      toast.error('שגיאה בסיום ההתקנה. נסו שוב.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ParentFamilyOverview
            onSelectChild={handleSelectChildForSettings}
            onViewAsChild={handleViewAsChild}
            onStartOnboarding={() => setOnboardingOpen(true)}
            onAddTask={(childId) => {
              // Navigate to settings for that child to add tasks
              setSelectedChildIdForSettings(childId);
              setActiveTab('settings');
            }}
          />
        );
      
      case 'settings':
        return (
          <ParentSettings
            appTitle={appTitle}
            lessonRemindersEnabled={lessonRemindersEnabled}
            fridayEnabled={fridayEnabled}
            onUpdateAppTitle={updateAppTitle}
            onToggleLessonReminders={toggleLessonReminders}
            selectedChildId={selectedChildIdForSettings}
            onBackFromChild={() => setSelectedChildIdForSettings(null)}
            onSelectChild={handleSelectChildForSettings}
            onSignOut={signOut}
          />
        );
      
      case 'reports':
        return (
          <ProGatedInsights>
            <ParentReports />
          </ProGatedInsights>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="theme-parent-zen min-h-[100dvh] bg-background pb-24 overflow-x-hidden">
      {/* iOS-specific Install Banner */}
      <IOSInstallBanner />
      
      {/* Browser Detection Banner - shows when not in PWA mode */}
      <BrowserDetectionBanner />
      
      {/* Subtle gradient - Professional for parents */}
      <div className="fixed inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      <div className="relative max-w-lg mx-auto px-5 py-6 safe-area-px">
        {renderTabContent()}
      </div>

      {/* Bottom Navigation */}
      <ParentBottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        onViewAsChild={children.length > 0 ? () => {
          if (children.length === 1) {
            setViewingAsChildId(children[0].id);
          } else if (children.length > 1) {
            setChildPickerOpen(true);
          }
        } : undefined}
      />

      {/* FAB - Only show when children exist. ALWAYS opens Add Child flow */}
      {activeTab === 'overview' && children.length > 0 && (
        <DashboardFAB
          hasChildren={true}
          onAddChild={() => setOnboardingOpen(true)}
          onAddTask={() => setOnboardingOpen(true)} // Both actions now trigger Add Child
        />
      )}

      {/* Child Picker Dialog */}
      <ChildPickerDialog
        open={childPickerOpen}
        onClose={() => setChildPickerOpen(false)}
        children={children.map(c => ({ id: c.id, displayName: c.displayName, avatar: c.avatar }))}
        onSelectChild={(childId) => setViewingAsChildId(childId)}
      />

      {/* Onboarding Dialog for adding children */}
      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent 
          className="max-w-lg h-[85vh] p-0"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{t('parentView.addChildTitle')}</DialogTitle>
          <ParentOnboarding onComplete={handleOnboardingComplete} />
        </DialogContent>
      </Dialog>

      {/* Global Legal Footer */}
      <div className="fixed bottom-20 inset-x-0 z-10 pointer-events-none">
        <div className="max-w-lg mx-auto px-5 pointer-events-auto">
          <GlobalFooter />
        </div>
      </div>

      {/* Smart PWA Install Prompt */}
      <InstallPrompt showAsModal={true} />
      
      {/* Parent Welcome Onboarding */}
      {profile?.id && (
        <ParentWelcomeBanner 
          userId={profile.id} 
          onNavigateToSettings={() => setActiveTab('settings')}
          onStartOnboarding={() => setOnboardingOpen(true)}
        />
      )}
    </div>
  );
}
