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
  Pill,
  Droplets,
  Apple,
  ChevronRight,
  Brain,
  CalendarDays,
  Camera,
  FileSpreadsheet,
  Mail,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
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
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
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

    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground font-display">
            {selectedChildId ? 'הגדרות Buff' : 'הגדרות'}
          </h1>
          <p className="text-sm text-muted-foreground">
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
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">הגדרות כלליות</h2>
                <p className="text-xs text-muted-foreground">הגדרות ברירת מחדל למשפחה</p>
              </div>
            </div>

            {/* App Title */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">שם האפליקציה</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder="Buff"
                  className="flex-1 bg-background border-border"
                  dir="ltr"
                />
                <Button size="sm" onClick={handleSaveTitle} className="bg-primary text-primary-foreground touch-target">
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>


            {/* Toggles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">תזכורות שיעורים</span>
                </div>
                <Switch
                  checked={lessonRemindersEnabled}
                  onCheckedChange={onToggleLessonReminders}
                  className="touch-target"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">יום שישי יום לימודים</span>
                </div>
                <Switch
                  checked={fridayEnabled}
                  onCheckedChange={onToggleFridayEnabled}
                  className="touch-target"
                />
              </div>
            </div>
          </div>

          {/* Notifications & Updates Section */}
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">עדכונים והודעות</h2>
                <p className="text-xs text-muted-foreground">ניהול תקשורת מ-BUFF</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 ml-3">
                <span className="text-sm text-foreground">קבלת עדכונים וטיפים מעדי</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  טיפים קטנים לסופ"ש ועדכונים על פיצ'רים חדשים
                </p>
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
                className="touch-target"
              />
            </div>
          </div>

          {/* Children Management Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">ניהול ילדים</h2>
            </div>

            {membersLoading ? (
              <div className="rounded-2xl bg-card border border-border p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </div>
            ) : children.length === 0 ? (
              <div className="rounded-2xl bg-card border border-border p-8 text-center space-y-2">
                <User className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">עדיין לא הצטרפו ילדים</p>
              </div>
            ) : (
              <div className="space-y-3">
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
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">למידה והדרכה</h2>
                <p className="text-xs text-muted-foreground">הבנת הגישה מאחורי Buff</p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowPhilosophy(true)}
              className="w-full justify-between touch-target"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span>קרא את תפיסת העולם של Buff</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.href = '/about'}
              className="w-full justify-between touch-target"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span>אודות - הסיפור מאחורי Buff</span>
              </div>
              <ChevronRight className="w-4 h-4" />
          </Button>
          </div>

          {/* Join Family Section */}
          <JoinFamilySection />
        </>
      )}
    </div>
    </>
  );
}

// Child Management Card - Clean, no progress bars
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
      className="w-full rounded-2xl bg-card border border-border p-4 hover:border-primary/50 transition-colors text-right"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 text-right">
          <p className="font-semibold text-foreground">{childName}</p>
          <p className="text-xs text-muted-foreground">לחץ כדי לערוך הגדרות Buff</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </button>
  );
}

// Child Configuration Panel - Focus on Configuration
function ChildConfigPanel({ childId, childName, fridayEnabled }: { childId: string; childName: string; fridayEnabled: boolean }) {
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

  const sections = [
    { id: 'tasks' as const, label: 'משימות', icon: BookOpen },
    { id: 'schedule' as const, label: 'מערכת', icon: Calendar },
    { id: 'rewards' as const, label: 'פרסים', icon: Gift },
  ];

  return (
    <div className="space-y-4">
      {/* Child Name Header */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{childName}</p>
          <p className="text-xs text-muted-foreground">הגדרות Buff אישיות</p>
        </div>
      </div>

      {/* Credit Balance */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <span className="text-sm font-medium text-foreground">יתרת קרדיטים</span>
        </div>
        <div className="flex items-center gap-2">
          {editingBalance ? (
            <>
              <Input
                type="number"
                value={localBalance}
                onChange={(e) => setLocalBalance(Number(e.target.value))}
                className="w-24 h-8 bg-background border-border text-center text-sm"
                min={0}
                dir="ltr"
              />
              <Button 
                size="sm" 
                className="h-8 px-3"
                onClick={handleSaveBalance}
                disabled={savingBalance}
              >
                {savingBalance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                className="h-8 px-2"
                onClick={() => {
                  setEditingBalance(false);
                  setLocalBalance(totalBalance);
                }}
              >
                ×
              </Button>
            </>
          ) : (
            <button
              onClick={() => setEditingBalance(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border hover:bg-secondary transition-colors"
            >
              <span className="font-bold text-primary">{totalBalance.toLocaleString()}</span>
              <Pencil className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Daily Goal */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
        <span className="text-sm text-foreground">יעד יומי</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={localDailyGoal}
            onChange={(e) => setLocalDailyGoal(Number(e.target.value))}
            className="w-20 h-8 bg-background border-border text-center text-sm"
            min={10}
            max={1000}
            dir="ltr"
          />
          <span className="text-xs text-muted-foreground">קרדיטים</span>

          <Button
            size="sm"
            className="h-8 px-3"
            onClick={handleSaveDailyGoal}
            disabled={savingDailyGoal || localDailyGoal === dailyGoal}
          >
            {savingDailyGoal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => setLocalDailyGoal(dailyGoal)}
            disabled={savingDailyGoal || localDailyGoal === dailyGoal}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Birth Date Picker */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">תאריך לידה</span>
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
      <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">הפעל מודול School Quest</span>
        </div>
        <Switch
          checked={schoolQuestEnabled}
          onCheckedChange={handleToggleSchoolQuest}
          className="touch-target"
        />
      </div>

      {/* School Quest Activation Tip */}
      {showSchoolQuestTip && schoolQuestEnabled && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">הפעלת את School Quests! 🎓</p>
            <p className="text-muted-foreground mt-1">
              עכשיו, מלא את מערכת השעות כדי לעזור לילד לקבל Buff במיקוד בבית הספר!
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground"
            onClick={() => setShowSchoolQuestTip(false)}
          >
            ×
          </Button>
        </div>
      )}

      {/* Bag Prep Toggle */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎒</span>
            <span className="text-sm text-foreground">משימת ערב - בונוס מוכנות (19:00)</span>
          </div>
          <Switch
            checked={bagPrepEnabled}
            onCheckedChange={toggleBagPrepEnabled}
            className="touch-target"
          />
        </div>
        
        {/* Bag Prep Credits (only show when enabled) */}
        {bagPrepEnabled && (
          <div className="flex items-center justify-between p-3 pt-0 border-t border-border/50">
            <span className="text-xs text-muted-foreground">נקודות Buff לביצוע</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={localBagPrepCredits}
                onChange={(e) => setLocalBagPrepCredits(Number(e.target.value))}
                className="w-16 h-8 bg-background border-border text-center text-sm"
                min={5}
                max={100}
                dir="ltr"
              />
              <Button
                size="sm"
                className="h-8 px-3"
                onClick={handleSaveBagPrepCredits}
                disabled={savingBagPrepCredits || localBagPrepCredits === bagPrepCredits}
              >
                {savingBagPrepCredits ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {sections.map((section) => {
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors touch-target",
                activeSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <section.icon className="w-4 h-4" />
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
                  <button
                    key={reward.id}
                    onClick={() => setStoreEditorOpen(true)}
                    className={cn(
                      "p-3 rounded-xl bg-card border border-border flex flex-col items-center gap-2 text-center transition-all",
                      "hover:border-primary/50 hover:shadow-md cursor-pointer active:scale-95",
                      reward.claimed && "opacity-60"
                    )}
                  >
                    <span className="text-2xl">{reward.icon}</span>
                    <span className="text-sm font-medium text-foreground line-clamp-2">{reward.title}</span>
                    <span className="text-xs text-primary font-bold">{reward.price} Buff</span>
                    {reward.claimed && (
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">נמכר</span>
                    )}
                  </button>
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
    </div>
  );
}

const categoryOptions: { value: TaskCategory; label: string; icon: typeof Pill }[] = [
  { value: 'medication', label: 'תרופות', icon: Pill },
  { value: 'hygiene', label: 'היגיינה', icon: Droplets },
  { value: 'nutrition', label: 'תזונה', icon: Apple },
  { value: 'school', label: 'בית ספר', icon: BookOpen },
];

function ChildTasksEditor({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'completedAt'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    time: '12:00',
    category: 'nutrition' as TaskCategory,
    credits: 10,
  });
  const [newTask, setNewTask] = useState({
    title: '',
    time: '12:00',
    category: 'nutrition' as TaskCategory,
    credits: 10,
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
    });
    setNewTask({ title: '', time: '12:00', category: 'nutrition', credits: 10 });
    setShowAddForm(false);
  };

  const handleEditClick = (task: Task) => {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      time: task.time,
      category: task.category,
      credits: task.credits,
    });
  };

  const handleSaveEdit = () => {
    if (!editingTaskId || !editForm.title.trim()) return;
    onUpdateTask(editingTaskId, {
      title: editForm.title,
      time: editForm.time,
      category: editForm.category,
      credits: editForm.credits,
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
