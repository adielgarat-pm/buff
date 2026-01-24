import { useState, useEffect } from 'react';
import { Task, TaskCategory, Timetable, StoreReward } from '@/types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Trash2, Plus, Save, X, Pill, Droplets, Apple, BookOpen, Calendar, Bell, Gift, Users, User, Crown, Settings, Sparkles, Zap, TrendingUp, Upload } from 'lucide-react';
import { TimetableImporter } from './TimetableImporter';
import { TimetableEditor } from './TimetableEditor';
import { StoreRewardEditor } from './StoreRewardEditor';
import { useFamilyMembers, FamilyMember } from '@/hooks/useFamilyMembers';
import { useChildProgress, useChildData } from '@/hooks/useChildProgress';
import { cn } from '@/lib/utils';
import { STRATEGIES, STRATEGY_CATEGORIES, getStrategyById, StrategyCategory } from '@/data/cogFunStrategies';
import { useParentInsights } from '@/hooks/useParentInsights';
import { InsightCardDisplay } from './InsightCardDisplay';
import { PhaseCompletionChart } from './PhaseCompletionChart';

interface ParentModeProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  dailyGoal: number;
  appTitle: string;
  timetable: Timetable;
  lessonRemindersEnabled: boolean;
  fridayEnabled: boolean;
  storeRewards: StoreReward[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'completedAt'>) => void;
  onDeleteTask: (id: string) => void;
  onUpdateGoal: (goal: number) => void;
  onUpdateAppTitle: (title: string) => void;
  onUpdateTimetable: (timetable: Timetable) => void;
  onToggleLessonReminders: (enabled: boolean) => void;
  onToggleFridayEnabled: (enabled: boolean) => void;
  onUpdateStoreRewards: (rewards: StoreReward[]) => void;
}

const categoryOptions: { value: TaskCategory; label: string; icon: typeof Pill }[] = [
  { value: 'medication', label: 'Medication', icon: Pill },
  { value: 'hygiene', label: 'Hygiene', icon: Droplets },
  { value: 'nutrition', label: 'Nutrition', icon: Apple },
  { value: 'school', label: 'School', icon: BookOpen },
];

type SettingsSection = 'overview' | 'general' | 'child';

export function ParentMode({
  open,
  onClose,
  tasks,
  dailyGoal,
  appTitle,
  timetable,
  lessonRemindersEnabled,
  fridayEnabled,
  storeRewards,
  onUpdateTask,
  onAddTask,
  onDeleteTask,
  onUpdateGoal,
  onUpdateAppTitle,
  onUpdateTimetable,
  onToggleLessonReminders,
  onToggleFridayEnabled,
  onUpdateStoreRewards,
}: ParentModeProps) {
  const { members, children, loading: membersLoading } = useFamilyMembers();
  const { childrenProgress, loading: progressLoading } = useChildProgress();
  const [activeSection, setActiveSection] = useState<SettingsSection>('overview');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  
  const [localGoal, setLocalGoal] = useState(dailyGoal);
  const [localTitle, setLocalTitle] = useState(appTitle);

  // Reset state when dialog opens
  useEffect(() => {
    if (!open) return;
    setLocalGoal(dailyGoal);
    setLocalTitle(appTitle);
    setActiveSection('overview');
    setSelectedChildId(null);
  }, [open, dailyGoal, appTitle]);

  const handleSelectChild = (child: FamilyMember) => {
    setActiveSection('child');
    setSelectedChildId(child.id);
  };

  const handleSaveGoal = () => {
    onUpdateGoal(localGoal);
  };

  const handleSaveTitle = () => {
    onUpdateAppTitle(localTitle);
  };

  const selectedChild = members.find((m) => m.id === selectedChildId);
  const selectedChildProgress = childrenProgress.find((p) => p.childId === selectedChildId);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden bg-card border-border">
        <div className="flex h-full max-h-[90vh]">
          {/* Left Sidebar - Master List */}
          <div className="w-72 border-r border-border bg-secondary/30 flex flex-col">
            <div className="p-4 border-b border-border">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-foreground text-lg">Parent Dashboard</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  Manage family & children
                </DialogDescription>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* Family Overview */}
                <div>
                  <button
                    onClick={() => {
                      setActiveSection('overview');
                      setSelectedChildId(null);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                      activeSection === 'overview'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary text-foreground'
                    )}
                  >
                    <Users className="w-5 h-5" />
                    <div>
                      <p className="font-medium text-sm">Family Overview</p>
                      <p className={cn(
                        'text-xs',
                        activeSection === 'overview'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}>
                        Live progress for all
                      </p>
                    </div>
                  </button>
                </div>

                {/* General Settings */}
                <div>
                  <button
                    onClick={() => {
                      setActiveSection('general');
                      setSelectedChildId(null);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                      activeSection === 'general'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary text-foreground'
                    )}
                  >
                    <Settings className="w-5 h-5" />
                    <div>
                      <p className="font-medium text-sm">General Settings</p>
                      <p className={cn(
                        'text-xs',
                        activeSection === 'general'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}>
                        App & defaults
                      </p>
                    </div>
                  </button>
                </div>

                {/* Children Section */}
                <div>
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Configure Children
                    </span>
                  </div>

                  {membersLoading ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : children.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      No children joined yet
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {children.map((child) => {
                        const progress = childrenProgress.find(p => p.childId === child.id);
                        const progressPercent = progress 
                          ? Math.min((progress.todayEarned / progress.dailyGoal) * 100, 100)
                          : 0;

                        return (
                          <button
                            key={child.id}
                            onClick={() => handleSelectChild(child)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                              selectedChildId === child.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-secondary text-foreground'
                            )}
                          >
                            <div className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center',
                              selectedChildId === child.id
                                ? 'bg-primary-foreground/20'
                                : 'bg-secondary'
                            )}>
                              <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {child.displayName}
                              </p>
                              {progress && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Progress 
                                    value={progressPercent} 
                                    className={cn(
                                      'h-1.5 flex-1',
                                      selectedChildId === child.id && 'bg-primary-foreground/20'
                                    )} 
                                  />
                                  <span className={cn(
                                    'text-xs tabular-nums',
                                    selectedChildId === child.id
                                      ? 'text-primary-foreground/70'
                                      : 'text-muted-foreground'
                                  )}>
                                    {progress.todayEarned}/{progress.dailyGoal}
                                  </span>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Content - Detail View */}
          <div className="flex-1 flex flex-col min-w-0">
            <ScrollArea className="flex-1">
              <div className="p-6">
                {activeSection === 'overview' && (
                  <FamilyOverview 
                    childrenProgress={childrenProgress} 
                    loading={progressLoading}
                    onSelectChild={(childId) => {
                      const child = children.find(c => c.id === childId);
                      if (child) handleSelectChild(child);
                    }}
                  />
                )}

                {activeSection === 'general' && (
                  <GeneralSettings
                    localTitle={localTitle}
                    setLocalTitle={setLocalTitle}
                    handleSaveTitle={handleSaveTitle}
                    localGoal={localGoal}
                    setLocalGoal={setLocalGoal}
                    handleSaveGoal={handleSaveGoal}
                    lessonRemindersEnabled={lessonRemindersEnabled}
                    onToggleLessonReminders={onToggleLessonReminders}
                    fridayEnabled={fridayEnabled}
                    onToggleFridayEnabled={onToggleFridayEnabled}
                  />
                )}

                {activeSection === 'child' && selectedChild && (
                  <ChildConfiguration
                    child={selectedChild}
                    progress={selectedChildProgress}
                  />
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Family Overview Component
interface FamilyOverviewProps {
  childrenProgress: Array<{
    childId: string;
    displayName: string;
    todayEarned: number;
    dailyGoal: number;
    tasksCompleted: number;
    tasksTotal: number;
    lessonsCompleted: number;
    lessonsTotal: number;
    totalBalance: number;
  }>;
  loading: boolean;
  onSelectChild: (childId: string) => void;
}

function FamilyOverview({ childrenProgress, loading, onSelectChild }: FamilyOverviewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading progress...</p>
      </div>
    );
  }

  if (childrenProgress.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Family Overview</h2>
          <p className="text-sm text-muted-foreground">Real-time progress for all children</p>
        </div>
        <div className="p-8 rounded-xl bg-secondary/50 border border-border text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No children have joined your family yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Share your family code to invite children.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">Family Overview</h2>
        <p className="text-sm text-muted-foreground">Real-time progress for all children</p>
      </div>

      <div className="grid gap-4">
        {childrenProgress.map((child) => {
          const progressPercent = Math.min((child.todayEarned / child.dailyGoal) * 100, 100);
          
          return (
            <button
              key={child.childId}
              onClick={() => onSelectChild(child.childId)}
              className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{child.displayName}</h3>
                    <p className="text-sm text-muted-foreground">
                      💰 {child.totalBalance.toLocaleString()} credits saved
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{child.todayEarned}</p>
                  <p className="text-xs text-muted-foreground">of {child.dailyGoal} goal</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Today's Progress</span>
                  <span className="font-medium text-foreground">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              <div className="flex gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">
                    Tasks: {child.tasksCompleted}/{child.tasksTotal}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/60" />
                  <span className="text-muted-foreground">
                    Lessons: {child.lessonsCompleted}/{child.lessonsTotal}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// General Settings Component
interface GeneralSettingsProps {
  localTitle: string;
  setLocalTitle: (title: string) => void;
  handleSaveTitle: () => void;
  localGoal: number;
  setLocalGoal: (goal: number) => void;
  handleSaveGoal: () => void;
  lessonRemindersEnabled: boolean;
  onToggleLessonReminders: (enabled: boolean) => void;
  fridayEnabled: boolean;
  onToggleFridayEnabled: (enabled: boolean) => void;
}

function GeneralSettings({
  localTitle,
  setLocalTitle,
  handleSaveTitle,
  localGoal,
  setLocalGoal,
  handleSaveGoal,
  lessonRemindersEnabled,
  onToggleLessonReminders,
  fridayEnabled,
  onToggleFridayEnabled,
}: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">General Settings</h2>
        <p className="text-sm text-muted-foreground">Configure app-wide settings for the family</p>
      </div>

      {/* App Title Setting */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <Label className="text-foreground font-semibold mb-3 block">App Title</Label>
        <div className="flex items-center gap-3">
          <Input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            placeholder="Daily Quests"
            className="flex-1 bg-background border-border text-foreground"
          />
          <Button
            size="sm"
            onClick={handleSaveTitle}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Daily Goal Setting */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <Label className="text-foreground font-semibold mb-3 block">Default Daily Credit Goal</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={localGoal}
            onChange={(e) => setLocalGoal(parseInt(e.target.value) || 0)}
            className="w-24 bg-background border-border text-foreground"
          />
          <span className="text-muted-foreground">credits</span>
          <Button
            size="sm"
            onClick={handleSaveGoal}
            className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This is the default goal for all children.
        </p>
      </div>

      {/* Lesson Reminders Toggle */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <Label className="text-foreground font-semibold">Lesson Reminders</Label>
          </div>
          <Switch
            checked={lessonRemindersEnabled}
            onCheckedChange={onToggleLessonReminders}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Get notified 5 minutes before each lesson starts.
        </p>
      </div>

      {/* Friday School Day Toggle */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Label className="text-foreground font-semibold">Friday School Day</Label>
          </div>
          <Switch
            checked={fridayEnabled}
            onCheckedChange={onToggleFridayEnabled}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Enable Friday as a school day (for short Friday schedules).
        </p>
      </div>
    </div>
  );
}

// Child Configuration Component with Tabs
interface ChildConfigurationProps {
  child: FamilyMember;
  progress?: {
    todayEarned: number;
    dailyGoal: number;
    totalBalance: number;
    tasksCompleted: number;
    tasksTotal: number;
  };
}

function ChildConfiguration({ child, progress }: ChildConfigurationProps) {
  const {
    tasks,
    timetable,
    storeRewards,
    dailyGoal,
    loading,
    addTask,
    updateTask,
    deleteTask,
    updateTimetable,
    updateStoreRewards,
    updateDailyGoal,
    initializeChildData,
  } = useChildData(child.id);

  const [activeTab, setActiveTab] = useState('tasks');
  const [timetableEditorOpen, setTimetableEditorOpen] = useState(false);
  const [storeEditorOpen, setStoreEditorOpen] = useState(false);
  const [scheduleImporterOpen, setScheduleImporterOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    time: '12:00',
    category: 'nutrition' as TaskCategory,
    credits: 10,
    strategyId: '' as string,
  });

  // Initialize child data on mount
  useEffect(() => {
    initializeChildData();
  }, [initializeChildData]);

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      const taskToAdd = {
        ...newTask,
        strategyId: newTask.strategyId || undefined,
      };
      addTask(taskToAdd);
      setNewTask({ title: '', time: '12:00', category: 'nutrition', credits: 10, strategyId: '' });
      setShowAddForm(false);
    }
  };

  const handleImportTimetable = (newTimetable: Timetable) => {
    updateTimetable(newTimetable);
  };

  const handleSaveTask = (task: Task) => {
    updateTask(task.id, task);
    setEditingTask(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading {child.displayName}'s data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with child info */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">{child.displayName}</h2>
          <p className="text-sm text-muted-foreground">Configure tasks, schedule & rewards</p>
        </div>
        {progress && (
          <div className="text-right">
            <p className="text-lg font-bold text-primary">
              {progress.todayEarned}/{dailyGoal}
            </p>
            <p className="text-xs text-muted-foreground">today's credits</p>
          </div>
        )}
      </div>

      {/* Tabs for different configurations */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Rewards
          </TabsTrigger>
        </TabsList>

        {/* Insights Tab */}
        <TabsContent value="insights" className="mt-4 space-y-4">
          {/* Daily Goal Setting for this child */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground font-semibold">Daily Credit Goal</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Set {child.displayName}'s daily target
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => updateDailyGoal(parseInt(e.target.value) || 100)}
                  className="w-20 bg-background border-border text-foreground text-center"
                  min={10}
                  max={500}
                />
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
            </div>
          </div>
          
          <ParentInsightsDashboard childId={child.id} childName={child.displayName} />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {tasks.length} tasks configured
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>

          {/* Add Task Form */}
          {showAddForm && !scheduleImporterOpen && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-3">
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="bg-background border-border text-foreground"
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">Time</Label>
                  <Input
                    type="time"
                    value={newTask.time}
                    onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">Credits</Label>
                  <Input
                    type="number"
                    value={newTask.credits}
                    onChange={(e) => setNewTask({ ...newTask, credits: parseInt(e.target.value) || 0 })}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Category</Label>
                <Select
                  value={newTask.category}
                  onValueChange={(value: TaskCategory) => setNewTask({ ...newTask, category: value })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  Daily Buff
                </Label>
                <Select
                  value={newTask.strategyId || 'none'}
                  onValueChange={(value) => setNewTask({ ...newTask, strategyId: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="None (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    <SelectItem value="none">None</SelectItem>
                    {(['environmental', 'task-based', 'self-regulation'] as StrategyCategory[]).map((category) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-secondary/50">
                          {STRATEGY_CATEGORIES[category].label}
                        </div>
                        {STRATEGIES.filter(s => s.category === category).map((strategy) => (
                          <SelectItem key={strategy.id} value={strategy.id}>
                            <span className="flex items-center gap-2">
                              <span>{strategy.icon}</span>
                              <span>{strategy.title}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddTask}
                  className="bg-primary text-primary-foreground"
                >
                  Add Task
                </Button>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground rounded-xl bg-secondary/30 border border-border">
                No tasks configured for {child.displayName} yet.
              </div>
            ) : (
              tasks.map((task) => (
                <TaskEditRow
                  key={task.id}
                  task={task}
                  isEditing={editingTask === task.id}
                  onEdit={() => setEditingTask(task.id)}
                  onSave={handleSaveTask}
                  onCancel={() => setEditingTask(null)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-4 space-y-4">
          <div className="p-4 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="text-foreground font-semibold">Weekly Timetable</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Set up {child.displayName}'s school schedule
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setScheduleImporterOpen(true)}
                  className="border-buff text-buff hover:bg-buff/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTimetableEditorOpen(true)}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>

            {/* Quick preview of schedule */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].map((day) => {
                const periods = timetable[day as keyof Timetable] || [];
                const subjectCount = periods.filter(p => p.subject).length;
                return (
                  <div key={day} className="text-center">
                    <p className="text-xs font-medium text-muted-foreground capitalize mb-1">
                      {day.slice(0, 3)}
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {subjectCount}
                    </p>
                    <p className="text-xs text-muted-foreground">lessons</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timetable Importer */}
          {scheduleImporterOpen && (
            <div className="p-4 rounded-xl bg-card border border-border">
              <TimetableImporter
                onImport={handleImportTimetable}
                onClose={() => setScheduleImporterOpen(false)}
                currentTimetable={timetable}
                childName={child.displayName}
              />
            </div>
          )}

          <TimetableEditor
            open={timetableEditorOpen}
            onClose={() => setTimetableEditorOpen(false)}
            timetable={timetable}
            onSave={updateTimetable}
          />
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="mt-4">
          {/* Coach's Tip Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-600 dark:text-amber-400 text-sm mb-1">
                  💡 טיפ מהמאמן
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed" dir="rtl">
                  שקיפות ושיתוף: זכרו, אתם המאמנים ולא הבוסים. כשמגדירים פרס, עשו זאת בשיחה עם הילד ושאלו: "מה יעזור לך להשיג את הפרס הזה?". זה הזמן למצוא יחד את האסטרטגיה המנצחת.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="text-foreground font-semibold">Rewards Store</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage rewards for {child.displayName}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStoreEditorOpen(true)}
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Gift className="w-4 h-4 mr-2" />
                Edit Rewards
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-2">
              {storeRewards.filter(r => !r.claimed).length} rewards available • 
              {storeRewards.filter(r => r.claimed).length} claimed
            </p>

            {/* Quick preview of rewards */}
            <div className="mt-4 space-y-2">
              {storeRewards.slice(0, 3).map((reward) => (
                <div
                  key={reward.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg',
                    reward.claimed ? 'bg-muted/50 opacity-60' : 'bg-background'
                  )}
                >
                  <span className="text-xl">{reward.icon}</span>
                  <span className="flex-1 text-sm text-foreground">{reward.title}</span>
                  <span className="text-sm font-medium text-primary">
                    {reward.price.toLocaleString()}
                  </span>
                </div>
              ))}
              {storeRewards.length > 3 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  +{storeRewards.length - 3} more rewards
                </p>
              )}
            </div>
          </div>

          <StoreRewardEditor
            open={storeEditorOpen}
            onClose={() => setStoreEditorOpen(false)}
            rewards={storeRewards}
            onSave={updateStoreRewards}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Parent Insights Dashboard Component
interface ParentInsightsDashboardProps {
  childId: string;
  childName: string;
}

function ParentInsightsDashboard({ childId, childName }: ParentInsightsDashboardProps) {
  const { insights, phaseInsights, loading } = useParentInsights(childId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Analyzing patterns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BUFF Parent Insights Header */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/20">
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="font-black text-foreground text-lg tracking-tight mb-1 flex items-center gap-2">
              BUFF Parent Insights
              <span className="text-sm font-normal text-muted-foreground">• {childName}</span>
            </p>
            <p className="text-sm text-muted-foreground" dir="rtl">
              ניתוח מבוסס על 7 הימים האחרונים. התובנות מתמקדות ב"איך לעזור" ולא ב"מה השתבש".
            </p>
          </div>
        </div>
      </div>

      {/* Phase Completion Overview */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">שיעורי השלמה לפי שלב</h3>
        <PhaseCompletionChart phaseInsights={phaseInsights} />
      </div>

      {/* Insight Cards */}
      {insights.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">תובנות והמלצות</h3>
          <div className="space-y-3">
            {insights.map(insight => (
              <InsightCardDisplay key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
          <p className="text-4xl mb-2">🌟</p>
          <p className="font-semibold text-emerald-500">הכל נראה מצוין!</p>
          <p className="text-sm text-muted-foreground mt-1" dir="rtl">
            אין אתגרים משמעותיים שזוהו. המשיכו בעבודה הטובה!
          </p>
        </div>
      )}

      {/* Coaching Reminder */}
      <div className="p-3 rounded-lg bg-secondary/50 border border-border">
        <p className="text-xs text-muted-foreground text-center" dir="rtl">
          💡 זכרו: כל אתגר הוא הזדמנות למצוא יחד אסטרטגיה חדשה. לחצו על כרטיס לקבלת הצעות מעשיות.
        </p>
      </div>
    </div>
  );
}

// Task Edit Row Component
interface TaskEditRowProps {
  task: Task;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (task: Task) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function TaskEditRow({ task, isEditing, onEdit, onSave, onCancel, onDelete }: TaskEditRowProps) {
  const [editedTask, setEditedTask] = useState(task);
  const strategy = task.strategyId ? getStrategyById(task.strategyId) : null;

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
        <Input
          value={editedTask.title}
          onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
          className="bg-background border-border text-foreground"
        />
        <div className="flex gap-2">
          <Input
            type="time"
            value={editedTask.time}
            onChange={(e) => setEditedTask({ ...editedTask, time: e.target.value })}
            className="flex-1 bg-background border-border text-foreground"
          />
          <Input
            type="number"
            value={editedTask.credits}
            onChange={(e) => setEditedTask({ ...editedTask, credits: parseInt(e.target.value) || 0 })}
            className="w-20 bg-background border-border text-foreground"
            placeholder="Credits"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            Daily Buff
          </Label>
          <Select
            value={editedTask.strategyId || 'none'}
            onValueChange={(value) => setEditedTask({ ...editedTask, strategyId: value === 'none' ? undefined : value })}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-60">
              <SelectItem value="none">None</SelectItem>
              {(['environmental', 'task-based', 'self-regulation'] as StrategyCategory[]).map((category) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-secondary/50">
                    {STRATEGY_CATEGORIES[category].label}
                  </div>
                  {STRATEGIES.filter(s => s.category === category).map((strat) => (
                    <SelectItem key={strat.id} value={strat.id}>
                      <span className="flex items-center gap-2">
                        <span>{strat.icon}</span>
                        <span>{strat.title}</span>
                      </span>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={onCancel} className="text-muted-foreground">
            <X className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => onSave(editedTask)} className="bg-primary text-primary-foreground">
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 cursor-pointer transition-colors"
      onClick={onEdit}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground text-sm">{task.title}</p>
          {strategy && (
            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {strategy.icon}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{task.time} • {task.credits} credits</p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-destructive hover:bg-destructive/10 h-8 w-8"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
