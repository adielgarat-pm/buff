import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncedTaskStore } from '@/hooks/useSyncedTaskStore';
import { ParentBottomNavigation, ParentNavTab } from './ParentBottomNavigation';
import { ParentFamilyOverview } from './ParentFamilyOverview';
import { ParentSettings } from './ParentSettings';
import { ParentReports } from './ParentReports';
import { ChildView } from './ChildView';
import { ViewAsChildBanner } from './ViewAsChildBanner';
import { ChildPickerDialog } from './ChildPickerDialog';
import { InstallPWA } from './InstallPWA';
import { ParentWelcomeBanner } from './ParentWelcomeBanner';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { Loader2 } from 'lucide-react';

export function ParentView() {
  const { signOut, profile } = useAuth();
  const { children } = useFamilyMembers();
  
  const [activeTab, setActiveTab] = useState<ParentNavTab>('overview');
  const [viewingAsChildId, setViewingAsChildId] = useState<string | null>(null);
  const [selectedChildIdForSettings, setSelectedChildIdForSettings] = useState<string | null>(null);
  const [childPickerOpen, setChildPickerOpen] = useState(false);

  const {
    loading,
    dailyGoal,
    appTitle,
    lessonRemindersEnabled,
    fridayEnabled,
    updateDailyGoal,
    updateAppTitle,
    toggleLessonReminders,
    toggleFridayEnabled,
  } = useSyncedTaskStore();

  // Loading state
  if (loading) {
    return (
      <div className="theme-parent-zen min-h-screen bg-background flex items-center justify-center">
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ParentFamilyOverview
            onSelectChild={handleSelectChildForSettings}
            onViewAsChild={handleViewAsChild}
          />
        );
      
      case 'settings':
        return (
          <ParentSettings
            dailyGoal={dailyGoal}
            appTitle={appTitle}
            lessonRemindersEnabled={lessonRemindersEnabled}
            fridayEnabled={fridayEnabled}
            onUpdateGoal={updateDailyGoal}
            onUpdateAppTitle={updateAppTitle}
            onToggleLessonReminders={toggleLessonReminders}
            onToggleFridayEnabled={toggleFridayEnabled}
            selectedChildId={selectedChildIdForSettings}
            onBackFromChild={() => setSelectedChildIdForSettings(null)}
            onSelectChild={handleSelectChildForSettings}
          />
        );
      
      case 'reports':
        return <ParentReports />;
      
      default:
        return null;
    }
  };

  return (
    <div className="theme-parent-zen min-h-screen bg-background pb-24 no-horizontal-scroll">
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

      {/* Child Picker Dialog */}
      <ChildPickerDialog
        open={childPickerOpen}
        onClose={() => setChildPickerOpen(false)}
        children={children.map(c => ({ id: c.id, displayName: c.displayName }))}
        onSelectChild={(childId) => setViewingAsChildId(childId)}
      />

      {/* PWA Install Banner */}
      <InstallPWA />
      
      {/* Parent Welcome Onboarding */}
      {profile?.id && <ParentWelcomeBanner userId={profile.id} />}
    </div>
  );
}
