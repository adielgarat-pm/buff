import { useState, useEffect, useMemo } from 'react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Settings,
  Bell,
  Calendar,
  Save,
  User,
  BookOpen,
  Gift,
  Upload,
  ArrowRight,
  GraduationCap,
  Lightbulb,
  Loader2,
  Trash2,
  Plus,
  Pencil,
  X,
  Check,
  Book,
  CalendarCheck,
  Sparkles,
  Home,
  Zap,
  ChevronRight,
  Brain,
  CalendarDays,
  Camera,
  FileSpreadsheet,
  Mail,
  LogOut,
  Copy,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent } from './ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { BirthDatePicker } from './BirthDatePicker';
import { TimetableEditor } from './TimetableEditor';
import { TimetableImporter } from './TimetableImporter';
import { StoreRewardEditor } from './StoreRewardEditor';
import { BuffPhilosophyPage } from './BuffPhilosophyPage';
import { JoinFamilySection } from './JoinFamilySection';
import { useSubscription } from '@/hooks/useSubscription';
import { ParentHelpSection } from './ParentHelpSection';
import { DayScheduleToggles } from './DayScheduleToggles';
import { DuplicateToChildModal } from './DuplicateToChildModal';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useChildData } from '@/hooks/useChildProgress';
import { useMarketingConsent } from '@/hooks/useMarketingConsent';
import { Task, TaskCategory, Timetable, StoreReward } from '@/types/task';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { z } from 'zod';
import buffLogoNoBg from '@/assets/buff-logo-no-bg.png';
import { useLanguage } from '@/contexts/LanguageContext';
import { translateTitle } from '@/utils/displayTranslation';
import { NotificationBell } from './NotificationBell';

function SimulateProToggle() {
  const { language } = useLanguage();
  const { simulatePro, setSimulatePro } = useSubscription();
  const isHe = language === 'he';
  return (
    <div className="pt-6 border-t border-dashed border-muted-foreground/20 mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground">
            {isHe ? 'אדמין: סימולציית Pro (שימוש פנימי בלבד)' : 'Admin: Simulate Pro Status (Internal Use Only)'}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            {isHe ? 'עוקף את כל לוגיקת המנוי לצרכי בדיקה' : 'Overrides all subscription logic for testing'}
          </p>
        </div>
        <Switch checked={simulatePro} onCheckedChange={setSimulatePro} />
      </div>
    </div>
  );
}

interface ParentSettingsProps {
  appTitle: string;
  lessonRemindersEnabled: boolean;
  fridayEnabled: boolean; // Still needed for display in child components
  onUpdateAppTitle: (title: string) => void;
  onToggleLessonReminders: (enabled: boolean) => void;
  // onToggleFridayEnabled removed - Friday is now auto-managed from schedule imports
  selectedChildId?: string | null;
  onBackFromChild?: () => void;
  onSelectChild?: (childId: string) => void;
  onSignOut?: () => void;
}

export function ParentSettings({
  appTitle,
  lessonRemindersEnabled,
  fridayEnabled,
  onUpdateAppTitle,
  onToggleLessonReminders,
  selectedChildId,
  onBackFromChild,
  onSelectChild,
  onSignOut,
}: ParentSettingsProps) {
  const { children, loading: membersLoading } = useFamilyMembers();
  const { marketingConsent, saving: savingConsent, updateConsent } = useMarketingConsent();
  const { language, setLanguage, t } = useLanguage();
  const [showPhilosophy, setShowPhilosophy] = useState(false);

  const [localTitle, setLocalTitle] = useState(appTitle);

  useEffect(() => {
    setLocalTitle(appTitle);
  }, [appTitle]);

  const handleSaveTitle = () => onUpdateAppTitle(localTitle);

  return (
    <>
    <Dialog open={showPhilosophy} onOpenChange={setShowPhilosophy}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <BuffPhilosophyPage isModal onClose={() => setShowPhilosophy(false)} />
      </DialogContent>
    </Dialog>

    <div className="space-y-3 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={buffLogoNoBg} 
            alt="BUFF Logo" 
            className="h-10 w-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground font-display">
              {selectedChildId ? t('parentSettings.buffSettings') : t('parentSettings.title')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {selectedChildId ? t('parentSettings.editTasksRewards') : t('parentSettings.generalAndChildren')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-visible">
          <NotificationBell />
          {selectedChildId && onBackFromChild && (
            <Button variant="ghost" size="sm" onClick={onBackFromChild} className="text-muted-foreground">
              <ArrowRight className="w-4 h-4 ml-1" />
              {t('parentSettings.back')}
            </Button>
          )}
        </div>
      </div>

      {/* If child selected, show child config only */}
      {selectedChildId ? (
        <ChildConfigPanel 
          childId={selectedChildId} 
          childName={children.find(c => c.id === selectedChildId)?.displayName || ''} 
          fridayEnabled={fridayEnabled}
          onBackAfterDelete={onBackFromChild}
        />
      ) : (
        <>
          {/* General Settings Card */}
          <div className="rounded-xl bg-card border border-border p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">{t('parentSettings.generalSettings')}</h2>
                <p className="text-xs text-muted-foreground">{t('parentSettings.familyDefaults')}</p>
              </div>
            </div>

            {/* App Title */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">{t('parentSettings.appName')}</Label>
              <div className="flex gap-2 flex-1">
                <Input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder="Buff"
                  className="flex-1 h-8 text-sm bg-background border-border"
                  dir="ltr"
                />
                <Button size="sm" onClick={handleSaveTitle} className="h-8 px-2 bg-primary text-primary-foreground">
                  <Save className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-foreground">{t('parentSettings.lessonReminders')}</span>
                </div>
                <Switch
                  checked={lessonRemindersEnabled}
                  onCheckedChange={onToggleLessonReminders}
                />
            </div>

              {/* Language Toggle */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌐</span>
                  <span className="text-sm text-foreground">{t('settings.language')}</span>
                </div>
                <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
                  <button
                    onClick={() => setLanguage('he')}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-md transition-all font-medium",
                      language === 'he' 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    🇮🇱 עברית
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-md transition-all font-medium",
                      language === 'en' 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>
          </div>
        </div>

          {/* Notifications & Updates Section */}
          <div className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{t('parentSettings.updatesFromAdi')}</span>
                  <p className="text-xs text-muted-foreground">{t('parentSettings.weekendTips')}</p>
                </div>
              </div>
              <Switch
                checked={marketingConsent}
                onCheckedChange={async (enabled) => {
                  try {
                    await updateConsent(enabled);
                    toast.success(enabled ? t('parentSettings.subscribedUpdates') : t('parentSettings.unsubscribedUpdates'));
                  } catch {
                    toast.error(t('parentSettings.settingsError'));
                  }
                }}
                disabled={savingConsent}
              />
            </div>
          </div>

          {/* Children Management Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">{t('parentSettings.childManagement')}</h2>
            </div>

            {membersLoading ? (
              <div className="rounded-xl bg-card border border-border p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
              </div>
            ) : children.length === 0 ? (
              <div className="rounded-xl bg-card border border-border p-4 text-center space-y-1">
                <User className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">{t('parentSettings.noChildrenYet')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {children.map((child) => (
                  <ChildManagementCard
                    key={child.id}
                    childId={child.id}
                    childName={child.displayName}
                    avatar={child.avatar}
                    onSelect={() => onSelectChild?.(child.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Learning & Guidance Section */}
          <div className="rounded-xl bg-card border border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">{t('parentSettings.learningGuidance')}</h2>
                <p className="text-xs text-muted-foreground">{t('parentSettings.understandApproach')}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPhilosophy(true)}
                className="flex-1 h-9 text-xs justify-start"
              >
                <Lightbulb className="w-3.5 h-3.5 ml-1.5 text-primary" />
                {t('parentSettings.worldView')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/about'}
                className="flex-1 h-9 text-xs justify-start"
              >
                <User className="w-3.5 h-3.5 ml-1.5 text-primary" />
                {t('parentSettings.about')}
              </Button>
            </div>
          </div>

          {/* Help & Installation Section */}
          <ParentHelpSection />

          {/* Join Family Section */}
          <JoinFamilySection />

          {/* Sign Out Section */}
          {onSignOut && (
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={onSignOut}
                className="w-full h-10 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="w-4 h-4 ml-2" />
                {t('parentSettings.signOutAccount')}
              </Button>
            </div>
          )}

          {/* Admin: Simulate Pro Toggle */}
          <SimulateProToggle />

        </>
      )}
    </div>
    </>
  );
}

// Child Management Card - Compact
function ChildManagementCard({ 
  childId, 
  childName,
  avatar,
  onSelect 
}: { 
  childId: string; 
  childName: string;
  avatar?: string;
  onSelect: () => void;
}) {
  const { t } = useLanguage();
  return (
    <button
      onClick={onSelect}
      className="w-full rounded-xl bg-card border border-border p-2.5 hover:border-primary/50 transition-colors text-right"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-lg">
          {avatar || '🚀'}
        </div>
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold text-foreground">{childName}</p>
          <p className="text-xs text-muted-foreground">{t('parentSettings.buffSettings')}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
}

// Child Configuration Panel - Focus on Configuration
// Avatar options for children
const AVATAR_OPTIONS = [
  // גיבורים
  '🦸', '🦹', '🧙', '🧚', '👑', '🎭', '🥷', '🦾',
  // מדע וחלל
  '🚀', '🌙', '🪐', '👾', '🤖', '🔬', '🛸', '⭐',
  // חיות
  '🦄', '🐉', '🦊', '🐱', '🐶', '🦁', '🐼', '🦋', '🐬', '🦉', '🐧', '🦈',
];

function ChildConfigPanel({ childId, childName, fridayEnabled, onBackAfterDelete }: { childId: string; childName: string; fridayEnabled: boolean; onBackAfterDelete?: () => void }) {
  const { t, language } = useLanguage();
  const { familyId } = useAuth();
  const { children: familyChildren, refetch: refetchMembers } = useFamilyMembers();
  const {
    tasks,
    timetable,
    storeRewards,
    dailyGoal,
    totalBalance,
    schoolQuestEnabled,
    bagPrepEnabled,
    bagPrepCredits,
    birthDate,
    avatar,
    loading,
    addTask,
    updateTask,
    deleteTask,
    updateTimetable,
    updateStoreRewards,
    updateDailyGoal,
    updateTotalBalance,
    toggleSchoolQuestEnabled,
    toggleBagPrepEnabled,
    updateBagPrepCredits,
    updateBirthDate,
    updateAvatar,
    deleteChildProfile,
    initializeChildData,
  } = useChildData(childId);

  const [activeSection, setActiveSection] = useState<'tasks' | 'schedule' | 'rewards'>('tasks');
  const [timetableEditorOpen, setTimetableEditorOpen] = useState(false);
  const [storeEditorOpen, setStoreEditorOpen] = useState(false);
  const [scheduleImporterOpen, setScheduleImporterOpen] = useState(false);
  const [showSchoolQuestTip, setShowSchoolQuestTip] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Duplicate modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicatingItem, setDuplicatingItem] = useState<{ type: 'task' | 'reward'; item: any } | null>(null);
  
  const [editingBalance, setEditingBalance] = useState(false);
  const [localBalance, setLocalBalance] = useState(totalBalance);
  const [savingBalance, setSavingBalance] = useState(false);

  const [localDailyGoal, setLocalDailyGoal] = useState(dailyGoal);
  const [savingDailyGoal, setSavingDailyGoal] = useState(false);

  const [localBirthDate, setLocalBirthDate] = useState<Date | undefined>(
    birthDate ? parseISO(birthDate) : undefined
  );
  const [savingBirthDate, setSavingBirthDate] = useState(false);

  const [localBagPrepCredits, setLocalBagPrepCredits] = useState(bagPrepCredits);
  const [savingBagPrepCredits, setSavingBagPrepCredits] = useState(false);

  const dailyGoalSchema = z.coerce.number().int().min(10).max(1000);
  const balanceSchema = z.coerce.number().int().min(0).max(1_000_000);
  const bagPrepCreditsSchema = z.coerce.number().int().min(5).max(100);

  useEffect(() => {
    setLocalBalance(totalBalance);
  }, [totalBalance]);

  useEffect(() => {
    setLocalDailyGoal(dailyGoal);
  }, [dailyGoal]);

  useEffect(() => {
    setLocalBirthDate(birthDate ? parseISO(birthDate) : undefined);
  }, [birthDate]);

  useEffect(() => {
    setLocalBagPrepCredits(bagPrepCredits);
  }, [bagPrepCredits]);

  useEffect(() => {
    initializeChildData();
  }, [initializeChildData]);

  const handleDeleteChild = async () => {
    setDeleting(true);
    try {
      await deleteChildProfile();
      toast.success(`${childName} ${t('parentSettings.deletedSuccess')}`);
      setDeleteDialogOpen(false);
      await refetchMembers();
      onBackAfterDelete?.();
    } catch (error) {
      console.error('Error deleting child:', error);
      toast.error(t('parentSettings.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const handleAvatarChange = async (newAvatar: string) => {
    try {
      await updateAvatar(newAvatar);
      toast.success(t('parentSettings.avatarUpdated'));
    } catch {
      toast.error(t('parentSettings.avatarError'));
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  const handleImportTimetable = async (newTimetable: Timetable, hasFridayLessons: boolean) => {
    updateTimetable(newTimetable);
    setScheduleImporterOpen(false);
    
    // Auto-enable Friday if schedule contains Friday lessons
    if (hasFridayLessons && familyId) {
      try {
        await supabase
          .from('app_settings')
          .update({ friday_enabled: true })
          .eq('family_id', familyId);
        toast.success(t('parentSettings.fridayAutoEnabled'));
      } catch (error) {
        console.error('Error auto-enabling Friday:', error);
      }
    }
  };

  const handleToggleSchoolQuest = (enabled: boolean) => {
    toggleSchoolQuestEnabled(enabled);
    
    // Show tip when enabling for the first time
    if (enabled) {
      const hasSeenTip = localStorage.getItem(`school_quest_tip_${childId}`);
      if (!hasSeenTip) {
        setShowSchoolQuestTip(true);
        localStorage.setItem(`school_quest_tip_${childId}`, 'true');
      toast.success(
          t('parentSettings.schoolQuestActivated'),
          {
            description: t('parentSettings.schoolQuestActivatedDesc'),
            duration: 6000,
          }
        );
      }
    }
  };

  const handleSaveBalance = async () => {
    const parsed = balanceSchema.safeParse(localBalance);
    if (!parsed.success) {
      toast.error(t('parentSettings.invalidBalance'));
      return;
    }

    setSavingBalance(true);
    try {
      await updateTotalBalance(parsed.data);
      toast.success(t('parentSettings.balanceUpdated'));
      setEditingBalance(false);
    } catch {
      toast.error(t('parentSettings.balanceError'));
    } finally {
      setSavingBalance(false);
    }
  };

  const handleSaveDailyGoal = async () => {
    const parsed = dailyGoalSchema.safeParse(localDailyGoal);
    if (!parsed.success) {
      toast.error(t('parentSettings.invalidGoal'));
      return;
    }

    setSavingDailyGoal(true);
    try {
      await updateDailyGoal(parsed.data);
      toast.success(t('parentSettings.goalUpdated'));
    } catch (error) {
      console.error('Error updating daily goal:', error);
      toast.error(t('parentSettings.goalError'));
      // Revert to original value on error
      setLocalDailyGoal(dailyGoal);
    } finally {
      setSavingDailyGoal(false);
    }
  };

  const handleSaveBirthDate = async (date: Date | undefined) => {
    setSavingBirthDate(true);
    try {
      const dateString = date ? format(date, 'yyyy-MM-dd') : null;
      await updateBirthDate(dateString);
      toast.success(t('parentSettings.birthDateSaved'));
    } catch {
      toast.error(t('parentSettings.birthDateError'));
    } finally {
      setSavingBirthDate(false);
    }
  };

  const handleSaveBagPrepCredits = async () => {
    const parsed = bagPrepCreditsSchema.safeParse(localBagPrepCredits);
    if (!parsed.success) {
      toast.error(t('parentSettings.invalidBagPrepCredits'));
      return;
    }

    setSavingBagPrepCredits(true);
    try {
      await updateBagPrepCredits(parsed.data);
      toast.success(t('parentSettings.bagPrepCreditsUpdated'));
    } catch {
      toast.error(t('parentSettings.bagPrepCreditsError'));
    } finally {
    setSavingBagPrepCredits(false);
    }
  };

  // Duplicate task to other children
  const handleDuplicateTask = (task: Task) => {
    setDuplicatingItem({ type: 'task', item: task });
    setDuplicateModalOpen(true);
  };

  // Duplicate reward to other children  
  const handleDuplicateReward = (reward: StoreReward) => {
    setDuplicatingItem({ type: 'reward', item: reward });
    setDuplicateModalOpen(true);
  };

  // Execute the duplication
  const handleDuplicateToChildren = async (targetChildIds: string[]) => {
    if (!duplicatingItem || !familyId) return;

    try {
      if (duplicatingItem.type === 'task') {
        const task = duplicatingItem.item as Task;
        // Insert tasks for each target child
        const tasksToInsert = targetChildIds.map(targetChildId => ({
          family_id: familyId,
          assigned_to: targetChildId,
          title: task.title,
          time: task.time,
          category: task.category,
          credits: task.credits,
          description: task.description || null,
          icon: task.icon || null,
          strategy_id: task.strategyId || null,
          schedule_days: task.scheduleDays || [0, 1, 2, 3, 4, 5],
        }));

        const { error } = await supabase.from('tasks').insert(tasksToInsert);
        if (error) throw error;

        const count = targetChildIds.length;
        toast.success(`${t('parentSettings.taskCopied')} "${task.title}"`);
      } else {
        const reward = duplicatingItem.item as StoreReward;
        // Insert rewards for each target child
        const rewardsToInsert = targetChildIds.map(targetChildId => ({
          family_id: familyId,
          assigned_to: targetChildId,
          title: reward.title,
          emoji: reward.icon,
          price: reward.price,
          claimed: false,
        }));

        const { error } = await supabase.from('store_rewards').insert(rewardsToInsert);
        if (error) throw error;

        const count = targetChildIds.length;
        toast.success(`${t('parentSettings.rewardCopied')} "${reward.title}"`);
      }
    } catch (error) {
      console.error('Error duplicating item:', error);
      toast.error(t('parentSettings.settingsError'));
    }
  };

  const sections = [
    { id: 'tasks' as const, label: t('parentSettings.tasks'), icon: BookOpen },
    { id: 'schedule' as const, label: t('parentSettings.schedule'), icon: Calendar },
    { id: 'rewards' as const, label: t('parentSettings.rewards'), icon: Gift },
  ];

  return (
    <div className="space-y-2.5">
      {/* Child Name Header with Avatar */}
      <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
        {/* Avatar Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl hover:bg-primary/30 transition-colors cursor-pointer">
              {avatar}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-5 gap-1.5">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleAvatarChange(emoji)}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors",
                    avatar === emoji 
                      ? "bg-primary/20 ring-2 ring-primary" 
                      : "hover:bg-secondary"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{childName}</p>
          <p className="text-xs text-muted-foreground">{t('parentSettings.personalBuffSettings')}</p>
        </div>
      </div>

      {/* Credit Balance & Daily Goal - Combined Row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Credit Balance */}
        <div className="flex flex-col p-2.5 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm">💰</span>
            <span className="text-xs text-muted-foreground">{t('parentSettings.balance')}</span>
          </div>
          {editingBalance ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={localBalance}
                onChange={(e) => setLocalBalance(Number(e.target.value))}
                className="flex-1 h-7 bg-background border-border text-center text-xs"
                min={0}
                dir="ltr"
              />
              <Button 
                size="sm" 
                className="h-7 px-2"
                onClick={handleSaveBalance}
                disabled={savingBalance}
              >
                {savingBalance ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                className="h-7 px-1.5"
                onClick={() => {
                  setEditingBalance(false);
                  setLocalBalance(totalBalance);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setEditingBalance(true)}
              className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-background border border-border hover:bg-secondary transition-colors"
            >
              <span className="font-bold text-sm text-primary">{totalBalance.toLocaleString()}</span>
              <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Daily Goal */}
        <div className="flex flex-col p-2.5 rounded-lg bg-card border border-border">
          <span className="text-xs text-muted-foreground mb-1.5">{t('parentSettings.dailyGoal')}</span>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={localDailyGoal}
              onChange={(e) => setLocalDailyGoal(Number(e.target.value))}
              className="flex-1 h-7 bg-background border-border text-center text-xs"
              min={10}
              max={1000}
              dir="ltr"
            />
            <Button
              size="sm"
              className="h-7 px-2"
              onClick={handleSaveDailyGoal}
              disabled={savingDailyGoal || localDailyGoal === dailyGoal}
            >
              {savingDailyGoal ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Birth Date & School Quest - Combined Row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Birth Date */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-foreground">{t('parentSettings.birthDate')}</span>
          </div>
          <BirthDatePicker
            value={localBirthDate}
            onChange={(date) => {
              setLocalBirthDate(date);
              handleSaveBirthDate(date);
            }}
            saving={savingBirthDate}
          />
        </div>

        {/* School Quest Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-foreground">School Quest</span>
          </div>
          <Switch
            checked={schoolQuestEnabled}
            onCheckedChange={handleToggleSchoolQuest}
          />
        </div>
      </div>

      {/* School Quest Activation Tip */}
      {showSchoolQuestTip && schoolQuestEnabled && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs flex-1">
            <p className="font-medium text-foreground">{t('parentSettings.schoolQuestTipTitle')}</p>
            <p className="text-muted-foreground">{t('parentSettings.schoolQuestTipDesc')}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-muted-foreground"
            onClick={() => setShowSchoolQuestTip(false)}
          >
            ×
          </Button>
        </div>
      )}

      {/* Bag Prep Toggle */}
      <div className="rounded-lg bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🎒</span>
            <span className="text-xs text-foreground">{t('parentSettings.nightMissionBonus')}</span>
          </div>
          <Switch
            checked={bagPrepEnabled}
            onCheckedChange={toggleBagPrepEnabled}
          />
        </div>
        
        {/* Bag Prep Credits (only show when enabled) */}
        {bagPrepEnabled && (
          <div className="flex items-center justify-between px-2.5 pb-2 pt-0">
            <span className="text-xs text-muted-foreground">{t('parentSettings.buffPoints')}</span>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={localBagPrepCredits}
                onChange={(e) => setLocalBagPrepCredits(Number(e.target.value))}
                className="w-14 h-7 bg-background border-border text-center text-xs"
                min={5}
                max={100}
                dir="ltr"
              />
              <Button
                size="sm"
                className="h-7 px-2"
                onClick={handleSaveBagPrepCredits}
                disabled={savingBagPrepCredits || localBagPrepCredits === bagPrepCredits}
              >
                {savingBagPrepCredits ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
        {sections.map((section) => {
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                activeSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <section.icon className="w-3.5 h-3.5" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="min-h-[200px]">
        {activeSection === 'tasks' && (
          <ChildTasksEditor
            tasks={tasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onDuplicateTask={handleDuplicateTask}
            showDuplicateButton={familyChildren.length > 1}
          />
        )}

        {activeSection === 'schedule' && (
          <div className="space-y-4">
            {/* Coach's Tip */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-semibold">💡 {t('parentSettings.schedule')}</span>
                <br />
                {t('parentSettings.timetableExplanation')}
              </p>
              {!schoolQuestEnabled && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-primary/10">
                  {t('parentSettings.schoolQuestDisabledWarning')}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setScheduleImporterOpen(true)}
                className="w-full touch-target min-h-[48px]"
              >
                <Camera className="w-4 h-4 ml-1" />
                <FileSpreadsheet className="w-4 h-4 ml-2" />
                {t('parentSettings.uploadSchedule')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTimetableEditorOpen(true)}
                className="w-full touch-target"
              >
                <Calendar className="w-4 h-4 ml-1" />
                <span className="text-lg ml-1">🎒</span>
                {t('parentSettings.manageScheduleEquipment')}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {Object.values(timetable).flat().filter(p => p.subject).length} {t('parentSettings.lessonsConfigured')}
            </p>
          </div>
        )}

        {activeSection === 'rewards' && (
          <div className="space-y-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStoreEditorOpen(true)}
              className="w-full touch-target"
            >
              <Gift className="w-4 h-4 ml-2" />
              {t('parentSettings.editRewardsStore')}
            </Button>

            {/* Rewards Preview List */}
            {storeRewards.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('parentSettings.noRewardsConfigured')}</p>
                <p className="text-xs mt-1">{t('parentSettings.clickToAdd')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {storeRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={cn(
                      "relative p-3 rounded-xl bg-card border border-border flex flex-col items-center gap-2 text-center transition-all",
                      "hover:border-primary/50 hover:shadow-md",
                      reward.claimed && "opacity-60"
                    )}
                  >
                    {/* Copy button - only show if there are other children */}
                    {familyChildren.length > 1 && !reward.claimed && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateReward(reward);
                        }}
                        className="absolute top-1 left-1 w-7 h-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        title={t('parentSettings.copyToChild')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <button
                      onClick={() => setStoreEditorOpen(true)}
                      className="flex flex-col items-center gap-2 w-full"
                    >
                      <span className="text-2xl">{reward.icon}</span>
                      <span className="text-sm font-medium text-foreground line-clamp-2">{translateTitle(reward.title, language)}</span>
                      <span className="text-xs text-primary font-bold">{reward.price} Buff</span>
                      {reward.claimed && (
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{t('parentSettings.sold')}</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {scheduleImporterOpen && (
        <TimetableImporter
          currentTimetable={timetable}
          onImport={handleImportTimetable}
          onClose={() => setScheduleImporterOpen(false)}
          childName={childName}
          fridayEnabled={fridayEnabled}
        />
      )}

      <TimetableEditor
        open={timetableEditorOpen}
        timetable={timetable}
        onSave={(newTimetable) => {
          updateTimetable(newTimetable);
          setTimetableEditorOpen(false);
        }}
        onClose={() => setTimetableEditorOpen(false)}
        fridayEnabled={fridayEnabled}
      />

      <StoreRewardEditor
        open={storeEditorOpen}
        rewards={storeRewards}
        onSave={(newRewards) => {
          updateStoreRewards(newRewards);
        }}
        onClose={() => setStoreEditorOpen(false)}
        dailyGoal={dailyGoal}
      />

      {/* Duplicate Modal */}
      <DuplicateToChildModal
        open={duplicateModalOpen}
        onClose={() => {
          setDuplicateModalOpen(false);
          setDuplicatingItem(null);
        }}
        children={familyChildren.map(c => ({ id: c.id, displayName: c.displayName }))}
        currentChildId={childId}
        itemType={duplicatingItem?.type || 'task'}
        itemTitle={duplicatingItem?.type === 'task' 
          ? (duplicatingItem.item as Task).title 
          : (duplicatingItem?.item as StoreReward)?.title || ''}
        onDuplicate={handleDuplicateToChildren}
      />

      {/* Delete Child Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{t('parentSettings.deleteConfirm')} {childName}?</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {t('parentSettings.deleteWarning')}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
              >
                {t('parentSettings.cancel')}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDeleteChild}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 ml-1" />
                    {t('parentSettings.delete')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Child Section */}
      <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">{t('parentSettings.deleteChild')}</p>
              <p className="text-xs text-muted-foreground">{t('parentSettings.deleteProfileAndData')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setDeleteDialogOpen(true)}
          >
            {t('parentSettings.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function useCategoryOptions() {
  const { t } = useLanguage();
  return [
    { value: 'learning' as TaskCategory, label: t('category.learning'), icon: Book },
    { value: 'organization' as TaskCategory, label: t('category.organization'), icon: CalendarCheck },
    { value: 'self-care' as TaskCategory, label: t('category.selfCare'), icon: Sparkles },
    { value: 'responsibility' as TaskCategory, label: t('category.responsibility'), icon: Home },
    { value: 'movement' as TaskCategory, label: t('category.movement'), icon: Zap },
  ];
}

function ChildTasksEditor({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
  showDuplicateButton = false,
}: {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'completedAt'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<boolean> | void;
  onDeleteTask: (id: string) => void;
  onDuplicateTask?: (task: Task) => void;
  showDuplicateButton?: boolean;
}) {
  const { t, language } = useLanguage();
  const categoryOptions = useCategoryOptions();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    time: '12:00',
    category: 'self-care' as TaskCategory,
    credits: 10,
    description: '',
    scheduleDays: [0, 1, 2, 3, 4, 5] as number[],
  });
  const [newTask, setNewTask] = useState({
    title: '',
    time: '12:00',
    category: 'self-care' as TaskCategory,
    credits: 10,
    description: '',
    scheduleDays: [0, 1, 2, 3, 4, 5] as number[],
  });

  // Sort tasks chronologically by time for the management view only
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Parse time strings (HH:MM) for comparison
      const [aHours, aMinutes] = a.time.split(':').map(Number);
      const [bHours, bMinutes] = b.time.split(':').map(Number);
      const aTotal = aHours * 60 + aMinutes;
      const bTotal = bHours * 60 + bMinutes;
      return aTotal - bTotal;
    });
  }, [tasks]);

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    onAddTask({
      title: newTask.title,
      time: newTask.time,
      category: newTask.category,
      credits: newTask.credits,
      description: newTask.description || undefined,
      scheduleDays: newTask.scheduleDays,
    });
    setNewTask({ title: '', time: '12:00', category: 'self-care', credits: 10, description: '', scheduleDays: [0, 1, 2, 3, 4, 5] });
    setShowAddForm(false);
  };

  const handleEditClick = (task: Task) => {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      time: task.time,
      category: task.category,
      credits: task.credits,
      description: task.description || '',
      scheduleDays: task.scheduleDays || [0, 1, 2, 3, 4, 5],
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTaskId || !editForm.title.trim()) return;
    const result = onUpdateTask(editingTaskId, {
      title: editForm.title,
      time: editForm.time,
      category: editForm.category,
      credits: editForm.credits,
      description: editForm.description || undefined,
      scheduleDays: editForm.scheduleDays,
    });
    // Handle both Promise<boolean> and void returns
    const success = result instanceof Promise ? await result : true;
    if (success) {
      toast.success(t('parentSettings.taskUpdated'));
    }
    setEditingTaskId(null);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  return (
    <div className="space-y-3">
      {/* Add Task Button */}
      {!showAddForm && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(true)}
          className="w-full touch-target"
        >
          <Plus className="w-4 h-4 ml-2" />
          {t('parentSettings.addTask')}
        </Button>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <Input
            placeholder={t('parentSettings.taskName')}
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="bg-background"
          />
          <div className="flex gap-2">
            <Input
              type="time"
              value={newTask.time}
              onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
              className="flex-1 bg-background"
              dir="ltr"
            />
            <Input
              type="number"
              value={newTask.credits}
              onChange={(e) => setNewTask({ ...newTask, credits: parseInt(e.target.value) || 10 })}
              className="w-20 bg-background"
              dir="ltr"
            />
          </div>
          <Select
            value={newTask.category}
            onValueChange={(v) => setNewTask({ ...newTask, category: v as TaskCategory })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Day Schedule Toggles */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('parentSettings.activeDays')}</Label>
            <DayScheduleToggles
              selectedDays={newTask.scheduleDays}
              onChange={(days) => setNewTask({ ...newTask, scheduleDays: days })}
            />
          </div>
          
          {/* Notes Field */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('parentSettings.additionalDetails')}</Label>
            <Textarea
              placeholder={t('parentSettings.detailsPlaceholder')}
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="bg-background min-h-[60px] text-sm resize-none"
            />
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddTask} className="flex-1 touch-target">
              <Save className="w-4 h-4 ml-1" />
              {t('parentSettings.save')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)} className="touch-target">
              {t('parentSettings.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('parentSettings.noTasksYet')}</p>
        ) : (
          sortedTasks.map((task) => (
            <div key={task.id}>
              {editingTaskId === task.id ? (
                /* Edit Mode */
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                  <Input
                    placeholder={t('parentSettings.taskName')}
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="bg-background"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={editForm.time}
                      onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                      className="flex-1 bg-background"
                      dir="ltr"
                    />
                    <Input
                      type="number"
                      value={editForm.credits}
                      onChange={(e) => setEditForm({ ...editForm, credits: parseInt(e.target.value) || 10 })}
                      className="w-20 bg-background"
                      dir="ltr"
                    />
                  </div>
                  <Select
                    value={editForm.category}
                    onValueChange={(v) => setEditForm({ ...editForm, category: v as TaskCategory })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Day Schedule Toggles */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t('parentSettings.activeDays')}</Label>
                    <DayScheduleToggles
                      selectedDays={editForm.scheduleDays}
                      onChange={(days) => setEditForm({ ...editForm, scheduleDays: days })}
                    />
                  </div>
                  
                  {/* Notes Field */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t('parentSettings.additionalDetails')}</Label>
                    <Textarea
                      placeholder={t('parentSettings.detailsPlaceholder')}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="bg-background min-h-[60px] text-sm resize-none"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} className="flex-1 touch-target">
                      <Check className="w-4 h-4 ml-1" />
                      {t('parentSettings.save')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="touch-target">
                      <X className="w-4 h-4 ml-1" />
                      {t('parentSettings.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{translateTitle(task.title, language)}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.time} • {task.credits} {t('parentSettings.credits')} • {categoryOptions.find(c => c.value === task.category)?.label || task.category}
                    </p>
                  </div>
                  {/* Copy/Duplicate button */}
                  {showDuplicateButton && onDuplicateTask && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDuplicateTask(task)}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10 touch-target"
                      title={t('parentSettings.copyToChild')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEditClick(task)}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 touch-target"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDeleteTask(task.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 touch-target"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
