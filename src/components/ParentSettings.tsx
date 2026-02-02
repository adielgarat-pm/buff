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

interface ParentSettingsProps {
  appTitle: string;
  lessonRemindersEnabled: boolean;
  fridayEnabled: boolean;
  onUpdateAppTitle: (title: string) => void;
  onToggleLessonReminders: (enabled: boolean) => void;
  onToggleFridayEnabled: (enabled: boolean) => void;
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
  onToggleFridayEnabled,
  selectedChildId,
  onBackFromChild,
  onSelectChild,
  onSignOut,
}: ParentSettingsProps) {
  const { children, loading: membersLoading } = useFamilyMembers();
  const { marketingConsent, saving: savingConsent, updateConsent } = useMarketingConsent();
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
        <div>
          <h1 className="text-xl font-bold text-foreground font-display">
            {selectedChildId ? 'הגדרות Buff' : 'הגדרות'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {selectedChildId ? 'עריכת משימות, מערכת ופרסים' : 'הגדרות כלליות וניהול ילדים'}
          </p>
        </div>
        {selectedChildId && onBackFromChild && (
          <Button variant="ghost" size="sm" onClick={onBackFromChild} className="text-muted-foreground">
            <ArrowRight className="w-4 h-4 ml-1" />
            חזרה
          </Button>
        )}
      </div>

      {/* If child selected, show child config only */}
      {selectedChildId ? (
        <ChildConfigPanel childId={selectedChildId} childName={children.find(c => c.id === selectedChildId)?.displayName || ''} fridayEnabled={fridayEnabled} />
      ) : (
        <>
          {/* General Settings Card */}
          <div className="rounded-xl bg-card border border-border p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">הגדרות כלליות</h2>
                <p className="text-xs text-muted-foreground">הגדרות ברירת מחדל למשפחה</p>
              </div>
            </div>

            {/* App Title */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">שם האפליקציה</Label>
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
                  <span className="text-sm text-foreground">תזכורות שיעורים</span>
                </div>
                <Switch
                  checked={lessonRemindersEnabled}
                  onCheckedChange={onToggleLessonReminders}
                />
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-foreground">יום שישי יום לימודים</span>
                </div>
                <Switch
                  checked={fridayEnabled}
                  onCheckedChange={onToggleFridayEnabled}
                />
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
                  <span className="text-sm font-medium text-foreground">עדכונים וטיפים מעדי</span>
                  <p className="text-xs text-muted-foreground">טיפים לסופ"ש ופיצ'רים חדשים</p>
                </div>
              </div>
              <Switch
                checked={marketingConsent}
                onCheckedChange={async (enabled) => {
                  try {
                    await updateConsent(enabled);
                    toast.success(enabled ? 'נרשמת לעדכונים!' : 'בוטלה ההרשמה לעדכונים');
                  } catch {
                    toast.error('שגיאה בעדכון ההגדרות');
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
              <h2 className="text-sm font-semibold text-foreground">ניהול ילדים</h2>
            </div>

            {membersLoading ? (
              <div className="rounded-xl bg-card border border-border p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
              </div>
            ) : children.length === 0 ? (
              <div className="rounded-xl bg-card border border-border p-4 text-center space-y-1">
                <User className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">עדיין לא הצטרפו ילדים</p>
              </div>
            ) : (
              <div className="space-y-2">
                {children.map((child) => (
                  <ChildManagementCard
                    key={child.id}
                    childId={child.id}
                    childName={child.displayName}
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
                <h2 className="text-sm font-semibold text-foreground">למידה והדרכה</h2>
                <p className="text-xs text-muted-foreground">הבנת הגישה מאחורי Buff</p>
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
                תפיסת העולם
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/about'}
                className="flex-1 h-9 text-xs justify-start"
              >
                <User className="w-3.5 h-3.5 ml-1.5 text-primary" />
                אודות
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
                התנתק מהחשבון
              </Button>
            </div>
          )}
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
  onSelect 
}: { 
  childId: string; 
  childName: string;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full rounded-xl bg-card border border-border p-2.5 hover:border-primary/50 transition-colors text-right"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold text-foreground">{childName}</p>
          <p className="text-xs text-muted-foreground">הגדרות Buff</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
}

// Child Configuration Panel - Focus on Configuration
function ChildConfigPanel({ childId, childName, fridayEnabled }: { childId: string; childName: string; fridayEnabled: boolean }) {
  const { familyId } = useAuth();
  const { children: familyChildren } = useFamilyMembers();
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
    initializeChildData,
  } = useChildData(childId);

  const [activeSection, setActiveSection] = useState<'tasks' | 'schedule' | 'rewards'>('tasks');
  const [timetableEditorOpen, setTimetableEditorOpen] = useState(false);
  const [storeEditorOpen, setStoreEditorOpen] = useState(false);
  const [scheduleImporterOpen, setScheduleImporterOpen] = useState(false);
  const [showSchoolQuestTip, setShowSchoolQuestTip] = useState(false);

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

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  const handleImportTimetable = (newTimetable: Timetable) => {
    updateTimetable(newTimetable);
    setScheduleImporterOpen(false);
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
          "הפעלת את מודול School Quest! 🎓",
          {
            description: "עכשיו, מלא את מערכת השעות כדי לעזור לילד לקבל Buff במיקוד בבית הספר!",
            duration: 6000,
          }
        );
      }
    }
  };

  const handleSaveBalance = async () => {
    const parsed = balanceSchema.safeParse(localBalance);
    if (!parsed.success) {
      toast.error('אנא הזן יתרה תקינה (0 עד 1,000,000)');
      return;
    }

    setSavingBalance(true);
    try {
      await updateTotalBalance(parsed.data);
      toast.success('היתרה עודכנה בהצלחה!');
      setEditingBalance(false);
    } catch {
      toast.error('שגיאה בעדכון היתרה');
    } finally {
      setSavingBalance(false);
    }
  };

  const handleSaveDailyGoal = async () => {
    const parsed = dailyGoalSchema.safeParse(localDailyGoal);
    if (!parsed.success) {
      toast.error('אנא הזן יעד תקין (10 עד 1000)');
      return;
    }

    setSavingDailyGoal(true);
    try {
      await updateDailyGoal(parsed.data);
      toast.success('היעד עודכן בהצלחה!');
    } catch {
      toast.error('שגיאה בעדכון היעד');
    } finally {
    setSavingDailyGoal(false);
    }
  };

  const handleSaveBirthDate = async (date: Date | undefined) => {
    setSavingBirthDate(true);
    try {
      const dateString = date ? format(date, 'yyyy-MM-dd') : null;
      await updateBirthDate(dateString);
      toast.success('תאריך הלידה נשמר!');
    } catch {
      toast.error('שגיאה בשמירת תאריך הלידה');
    } finally {
      setSavingBirthDate(false);
    }
  };

  const handleSaveBagPrepCredits = async () => {
    const parsed = bagPrepCreditsSchema.safeParse(localBagPrepCredits);
    if (!parsed.success) {
      toast.error('אנא הזן כמות תקינה (5 עד 100)');
      return;
    }

    setSavingBagPrepCredits(true);
    try {
      await updateBagPrepCredits(parsed.data);
      toast.success('קרדיטים להכנת תיק עודכנו!');
    } catch {
      toast.error('שגיאה בעדכון');
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
          schedule_days: task.scheduleDays || [0, 1, 2, 3, 4],
        }));

        const { error } = await supabase.from('tasks').insert(tasksToInsert);
        if (error) throw error;

        const count = targetChildIds.length;
        toast.success(`המשימה "${task.title}" הועתקה ל-${count} ${count === 1 ? 'ילד' : 'ילדים'}!`);
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
        toast.success(`הפרס "${reward.title}" הועתק ל-${count} ${count === 1 ? 'ילד' : 'ילדים'}!`);
      }
    } catch (error) {
      console.error('Error duplicating item:', error);
      toast.error('שגיאה בהעתקה');
    }
  };

  const sections = [
    { id: 'tasks' as const, label: 'משימות', icon: BookOpen },
    { id: 'schedule' as const, label: 'מערכת', icon: Calendar },
    { id: 'rewards' as const, label: 'פרסים', icon: Gift },
  ];

  return (
    <div className="space-y-2.5">
      {/* Child Name Header */}
      <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{childName}</p>
          <p className="text-xs text-muted-foreground">הגדרות Buff אישיות</p>
        </div>
      </div>

      {/* Credit Balance & Daily Goal - Combined Row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Credit Balance */}
        <div className="flex flex-col p-2.5 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm">💰</span>
            <span className="text-xs text-muted-foreground">יתרה</span>
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
          <span className="text-xs text-muted-foreground mb-1.5">יעד יומי</span>
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
            <span className="text-xs text-foreground">ת.לידה</span>
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
            <p className="font-medium text-foreground">הפעלת את School Quests! 🎓</p>
            <p className="text-muted-foreground">מלא מערכת שעות למיקוד בביה"ס</p>
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
            <span className="text-xs text-foreground">משימת ערב - בונוס מוכנות</span>
          </div>
          <Switch
            checked={bagPrepEnabled}
            onCheckedChange={toggleBagPrepEnabled}
          />
        </div>
        
        {/* Bag Prep Credits (only show when enabled) */}
        {bagPrepEnabled && (
          <div className="flex items-center justify-between px-2.5 pb-2 pt-0">
            <span className="text-xs text-muted-foreground">נקודות Buff</span>
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
                <span className="font-semibold">💡 למה מערכת שעות?</span>
                <br />
                מערכת השעות עוזרת לילד לעקוב אחרי רגעי הצלחה בלמידה קשובה ולזהות מתי קשה יותר להתרכז. זה כלי למודעות עצמית, לא לביקורת.
              </p>
              {!schoolQuestEnabled && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-primary/10">
                  ⚠️ כרגע ״משימת בית הספר״ כבויה - המערכת לא תוצג לילד. הפעילו אותה בהגדרות למעלה.
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
                העלאת מערכת
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTimetableEditorOpen(true)}
                className="w-full touch-target"
              >
                <Calendar className="w-4 h-4 ml-1" />
                <span className="text-lg ml-1">🎒</span>
                ניהול מערכת וציוד
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {Object.values(timetable).flat().filter(p => p.subject).length} שיעורים מוגדרים
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
              ערוך חנות פרסים
            </Button>

            {/* Rewards Preview List */}
            {storeRewards.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">אין פרסים מוגדרים</p>
                <p className="text-xs mt-1">לחץ על "ערוך חנות פרסים" להוספה</p>
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
                        title="העתק לילד אחר"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <button
                      onClick={() => setStoreEditorOpen(true)}
                      className="flex flex-col items-center gap-2 w-full"
                    >
                      <span className="text-2xl">{reward.icon}</span>
                      <span className="text-sm font-medium text-foreground line-clamp-2">{reward.title}</span>
                      <span className="text-xs text-primary font-bold">{reward.price} Buff</span>
                      {reward.claimed && (
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">נמכר</span>
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
    </div>
  );
}

const categoryOptions: { value: TaskCategory; label: string; icon: typeof Book }[] = [
  { value: 'learning', label: 'למידה', icon: Book },
  { value: 'organization', label: 'התארגנות', icon: CalendarCheck },
  { value: 'self-care', label: 'טיפול עצמי', icon: Sparkles },
  { value: 'responsibility', label: 'בית ואחריות', icon: Home },
  { value: 'movement', label: 'גוף ותנועה', icon: Zap },
];

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
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onDuplicateTask?: (task: Task) => void;
  showDuplicateButton?: boolean;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    time: '12:00',
    category: 'self-care' as TaskCategory,
    credits: 10,
    description: '',
    scheduleDays: [0, 1, 2, 3, 4] as number[],
  });
  const [newTask, setNewTask] = useState({
    title: '',
    time: '12:00',
    category: 'self-care' as TaskCategory,
    credits: 10,
    description: '',
    scheduleDays: [0, 1, 2, 3, 4] as number[],
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
    setNewTask({ title: '', time: '12:00', category: 'self-care', credits: 10, description: '', scheduleDays: [0, 1, 2, 3, 4] });
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
      scheduleDays: task.scheduleDays || [0, 1, 2, 3, 4],
    });
  };

  const handleSaveEdit = () => {
    if (!editingTaskId || !editForm.title.trim()) return;
    onUpdateTask(editingTaskId, {
      title: editForm.title,
      time: editForm.time,
      category: editForm.category,
      credits: editForm.credits,
      description: editForm.description || undefined,
      scheduleDays: editForm.scheduleDays,
    });
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
          הוסף משימה
        </Button>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <Input
            placeholder="שם המשימה"
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
            <Label className="text-xs text-muted-foreground">ימים פעילים</Label>
            <DayScheduleToggles
              selectedDays={newTask.scheduleDays}
              onChange={(days) => setNewTask({ ...newTask, scheduleDays: days })}
            />
          </div>
          
          {/* Notes Field */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">פרטים נוספים או ציוד (אופציונלי)</Label>
            <Textarea
              placeholder="למשל: להביא תיקיית אומנות, לא לשכוח בקבוק מים..."
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="bg-background min-h-[60px] text-sm resize-none"
            />
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddTask} className="flex-1 touch-target">
              <Save className="w-4 h-4 ml-1" />
              שמור
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)} className="touch-target">
              ביטול
            </Button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">אין משימות עדיין</p>
        ) : (
          sortedTasks.map((task) => (
            <div key={task.id}>
              {editingTaskId === task.id ? (
                /* Edit Mode */
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                  <Input
                    placeholder="שם המשימה"
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
                    <Label className="text-xs text-muted-foreground">ימים פעילים</Label>
                    <DayScheduleToggles
                      selectedDays={editForm.scheduleDays}
                      onChange={(days) => setEditForm({ ...editForm, scheduleDays: days })}
                    />
                  </div>
                  
                  {/* Notes Field */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">פרטים נוספים או ציוד (אופציונלי)</Label>
                    <Textarea
                      placeholder="למשל: להביא תיקיית אומנות, לא לשכוח בקבוק מים..."
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="bg-background min-h-[60px] text-sm resize-none"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} className="flex-1 touch-target">
                      <Check className="w-4 h-4 ml-1" />
                      שמור
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="touch-target">
                      <X className="w-4 h-4 ml-1" />
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.time} • {task.credits} קרדיטים • {categoryOptions.find(c => c.value === task.category)?.label || task.category}
                    </p>
                  </div>
                  {/* Copy/Duplicate button */}
                  {showDuplicateButton && onDuplicateTask && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDuplicateTask(task)}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10 touch-target"
                      title="העתק לילד אחר"
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
