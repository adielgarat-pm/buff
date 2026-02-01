import { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncedTaskStore } from '@/hooks/useSyncedTaskStore';
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
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { GlobalFooter } from './GlobalFooter';
import { DashboardFAB } from './dashboard';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { ParentOnboarding, OnboardingData } from './onboarding/ParentOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function ParentView() {
  const { signOut, profile, refreshProfile } = useAuth();
  const { children, refetch: refetchChildren } = useFamilyMembers();
  
  const [activeTab, setActiveTab] = useState<ParentNavTab>('overview');
  const [viewingAsChildId, setViewingAsChildId] = useState<string | null>(null);
  const [selectedChildIdForSettings, setSelectedChildIdForSettings] = useState<string | null>(null);
  const [childPickerOpen, setChildPickerOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const {
    loading,
    appTitle,
    lessonRemindersEnabled,
    fridayEnabled,
    updateAppTitle,
    toggleLessonReminders,
    toggleFridayEnabled,
  } = useSyncedTaskStore();

  // Loading state
  if (loading) {
    return (
      <div className="theme-parent-zen min-h-[100dvh] bg-background flex items-center justify-center overflow-x-hidden">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">טוען...</p>
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
          childName={viewingChild?.displayName || 'ילד'} 
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

  // Handle onboarding completion for adding a new child
  const handleOnboardingComplete = async (onboardingData: OnboardingData) => {
    if (!profile?.family_id) {
      toast.error('לא נמצאה משפחה');
      return;
    }

    try {
      // Create child profile with birth_date
      const { data: childProfile, error: childError } = await supabase
        .from('profiles')
        .insert({
          display_name: onboardingData.childName,
          role: 'child',
          family_id: profile.family_id,
          daily_goal: 70,
          birth_date: format(onboardingData.birthDate, 'yyyy-MM-dd'),
          school_quest_enabled: onboardingData.schoolFeature === 'school_quest',
          bag_prep_enabled: onboardingData.schoolFeature === 'evening_prep',
        })
        .select()
        .single();

      if (childError) throw childError;

      // Map focus area to valid task categories (5-category system)
      const categoryMap: Record<string, string> = {
        'homework': 'learning',
        'project': 'learning',
        'fitness': 'movement',
        'home': 'responsibility',
      };

      // Create first task for the child
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          family_id: profile.family_id,
          assigned_to: childProfile.id,
          title: onboardingData.firstTask,
          category: categoryMap[onboardingData.focusArea] || 'learning',
          time: '16:00',
          credits: 15,
        });

      if (taskError) console.error('Task creation error:', taskError);

      // Create first reward
      const { error: rewardError } = await supabase
        .from('store_rewards')
        .insert({
          family_id: profile.family_id,
          assigned_to: childProfile.id,
          title: onboardingData.weekendReward,
          emoji: '🎉',
          price: 100,
        });

      if (rewardError) console.error('Reward creation error:', rewardError);

      // Close modal and refresh
      setOnboardingOpen(false);
      await refetchChildren();
      toast.success(`${onboardingData.childName} נוסף בהצלחה! 🎉`);
      
      // Navigate to the new child's settings
      setSelectedChildIdForSettings(childProfile.id);
      setActiveTab('settings');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('שגיאה ביצירת פרופיל הילד');
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
            onToggleFridayEnabled={toggleFridayEnabled}
            selectedChildId={selectedChildIdForSettings}
            onBackFromChild={() => setSelectedChildIdForSettings(null)}
            onSelectChild={handleSelectChildForSettings}
            onSignOut={signOut}
          />
        );
      
      case 'reports':
        return <ParentReports />;
      
      default:
        return null;
    }
  };

  return (
    <div className="theme-parent-zen min-h-[100dvh] bg-background pb-24 overflow-x-hidden">
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
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'settings') {
            setSelectedChildIdForSettings(null);
          }
        }}
        onViewAsChild={children.length > 0 ? () => {
          if (children.length === 1) {
            setViewingAsChildId(children[0].id);
          } else if (children.length > 1) {
            setChildPickerOpen(true);
          }
        } : undefined}
      />

      {/* FAB - Add Child or Add Task */}
      {activeTab === 'overview' && (
        <DashboardFAB
          hasChildren={children.length > 0}
          onAddChild={() => setOnboardingOpen(true)}
          onAddTask={() => {
            // If only one child, go to their settings; otherwise let user pick
            if (children.length === 1) {
              setSelectedChildIdForSettings(children[0].id);
              setActiveTab('settings');
            } else if (children.length > 1) {
              // For now, go to first child's settings
              setSelectedChildIdForSettings(children[0].id);
              setActiveTab('settings');
            }
          }}
        />
      )}

      {/* Child Picker Dialog */}
      <ChildPickerDialog
        open={childPickerOpen}
        onClose={() => setChildPickerOpen(false)}
        children={children.map(c => ({ id: c.id, displayName: c.displayName }))}
        onSelectChild={(childId) => setViewingAsChildId(childId)}
      />

      {/* Onboarding Dialog for adding children */}
      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent 
          className="max-w-lg max-h-[95vh] p-0 overflow-hidden"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">הוספת ילד חדש</DialogTitle>
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
