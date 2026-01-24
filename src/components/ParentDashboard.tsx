import { useState, useEffect } from 'react';
import { Task, TaskCategory, Timetable, StoreReward } from '@/types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Trash2, Plus, Save, X, Pill, Droplets, Apple, BookOpen, Calendar, Bell, Gift, Users, User, Crown, Settings, Sparkles, Zap, TrendingUp, Upload, ChevronRight } from 'lucide-react';
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
import { FamilyCodeDisplay } from './FamilyCodeDisplay';
import { useAuth } from '@/contexts/AuthContext';

const categoryOptions: { value: TaskCategory; label: string; icon: typeof Pill }[] = [
  { value: 'medication', label: 'Medication', icon: Pill },
  { value: 'hygiene', label: 'Hygiene', icon: Droplets },
  { value: 'nutrition', label: 'Nutrition', icon: Apple },
  { value: 'school', label: 'School', icon: BookOpen },
];

interface ParentDashboardProps {
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
  onBack?: () => void;
}

export function ParentDashboard({
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
  onBack,
}: ParentDashboardProps) {
  const { familyId, familyShortCode } = useAuth();
  const { members, children, loading: membersLoading } = useFamilyMembers();
  const { childrenProgress, loading: progressLoading } = useChildProgress();
  
  const [localGoal, setLocalGoal] = useState(dailyGoal);
  const [localTitle, setLocalTitle] = useState(appTitle);
  const [expandedChild, setExpandedChild] = useState<string>('');

  useEffect(() => {
    setLocalGoal(dailyGoal);
    setLocalTitle(appTitle);
  }, [dailyGoal, appTitle]);

  const handleSaveGoal = () => {
    onUpdateGoal(localGoal);
  };

  const handleSaveTitle = () => {
    onUpdateAppTitle(localTitle);
  };

  return (
    <div className="min-h-screen bg-background safe-area-all">
      <div className="max-w-lg mx-auto px-5 py-6 space-y-6 pb-24">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground font-display">
            BUFF Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Level up your daily routine.
          </p>
        </div>

        {/* General Settings Card */}
        <div className="rounded-2xl bg-card border border-primary/20 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">הגדרות משפחה</h2>
              <p className="text-xs text-muted-foreground">הגדרות כלליות וקוד משפחה</p>
            </div>
          </div>

          {/* Family Code - Compact inside settings */}
          {familyShortCode && (
            <FamilyCodeDisplay shortCode={familyShortCode} />
          )}

          {/* App Title */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">שם האפליקציה</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="BUFF"
                className="flex-1 bg-secondary border-border"
              />
              <Button
                size="sm"
                onClick={handleSaveTitle}
                className="bg-primary text-primary-foreground touch-target"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Daily Goal */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">יעד יומי ברירת מחדל</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                value={localGoal}
                onChange={(e) => setLocalGoal(parseInt(e.target.value) || 0)}
                className="w-24 bg-secondary border-border"
              />
              <span className="text-sm text-muted-foreground">קרדיטים</span>
              <Button
                size="sm"
                onClick={handleSaveGoal}
                className="mr-auto bg-primary text-primary-foreground touch-target"
              >
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

        {/* Children Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-foreground">Children</h2>
          </div>

          {membersLoading || progressLoading ? (
            <div className="rounded-2xl bg-card border border-border p-8 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : children.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-8 text-center space-y-2">
              <Users className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No children have joined yet.</p>
              <p className="text-sm text-muted-foreground">Share your family code to invite them.</p>
            </div>
          ) : (
            <Accordion
              type="single"
              collapsible
              value={expandedChild}
              onValueChange={setExpandedChild}
              className="space-y-3"
            >
              {children.map((child) => {
                const progress = childrenProgress.find(p => p.childId === child.id);
                const progressPercent = progress 
                  ? Math.min((progress.todayEarned / progress.dailyGoal) * 100, 100)
                  : 0;

                return (
                  <AccordionItem
                    key={child.id}
                    value={child.id}
                    className="rounded-2xl bg-card border border-border overflow-hidden"
                  >
                    <AccordionTrigger className="px-5 py-4 hover:no-underline touch-target">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-accent" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-foreground">{child.displayName}</p>
                          {progress && (
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={progressPercent} className="h-1.5 flex-1 max-w-24" />
                              <span className="text-xs text-muted-foreground">
                                {progress.todayEarned}/{progress.dailyGoal}
                              </span>
                            </div>
                          )}
                        </div>
                        {progress && (
                          <div className="text-right mr-2">
                            <p className="text-lg font-bold text-primary">{Math.round(progressPercent)}%</p>
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5">
                      <ChildConfigPanel childId={child.id} childName={child.displayName} />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}

// Child Configuration Panel (embedded in accordion)
function ChildConfigPanel({ childId, childName }: { childId: string; childName: string }) {
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
  } = useChildData(childId);

  const [activeSection, setActiveSection] = useState<'tasks' | 'schedule' | 'rewards' | 'insights'>('insights');
  const [timetableEditorOpen, setTimetableEditorOpen] = useState(false);
  const [storeEditorOpen, setStoreEditorOpen] = useState(false);
  const [scheduleImporterOpen, setScheduleImporterOpen] = useState(false);

  useEffect(() => {
    initializeChildData();
  }, [initializeChildData]);

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Loading...</div>;
  }

  const handleImportTimetable = (newTimetable: Timetable) => {
    updateTimetable(newTimetable);
    setScheduleImporterOpen(false);
  };

  const sections = [
    { id: 'insights' as const, label: 'Insights', icon: TrendingUp },
    { id: 'tasks' as const, label: 'Tasks', icon: BookOpen },
    { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
    { id: 'rewards' as const, label: 'Rewards', icon: Gift },
  ];

  return (
    <div className="space-y-4">
      {/* Daily Goal */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
        <span className="text-sm text-foreground">Daily Goal</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={dailyGoal}
            onChange={(e) => updateDailyGoal(parseInt(e.target.value) || 100)}
            className="w-20 h-8 bg-background border-border text-center text-sm"
            min={10}
            max={500}
          />
          <span className="text-xs text-muted-foreground">credits</span>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {sections.map((section) => (
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
        ))}
      </div>

      {/* Section Content */}
      <div className="min-h-[200px]">
        {activeSection === 'insights' && (
          <ChildInsights childId={childId} childName={childName} />
        )}

        {activeSection === 'tasks' && (
          <ChildTasks
            tasks={tasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        )}

        {activeSection === 'schedule' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setScheduleImporterOpen(true)}
                className="flex-1 touch-target"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTimetableEditorOpen(true)}
                className="flex-1 touch-target"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {Object.values(timetable).flat().length} lessons configured
            </p>
          </div>
        )}

        {activeSection === 'rewards' && (
          <div className="space-y-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStoreEditorOpen(true)}
              className="w-full touch-target"
            >
              <Gift className="w-4 h-4 mr-2" />
              Edit Rewards Store
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {storeRewards.length} rewards configured
            </p>
          </div>
        )}
      </div>

      {/* Dialogs - render outside the content area */}
      {scheduleImporterOpen && (
        <TimetableImporter
          currentTimetable={timetable}
          onImport={handleImportTimetable}
          onClose={() => setScheduleImporterOpen(false)}
          childName={childName}
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
      />

      <StoreRewardEditor
        open={storeEditorOpen}
        rewards={storeRewards}
        onSave={(newRewards) => {
          updateStoreRewards(newRewards);
          setStoreEditorOpen(false);
        }}
        onClose={() => setStoreEditorOpen(false)}
      />
    </div>
  );
}

// Child Insights Component
function ChildInsights({ childId, childName }: { childId: string; childName: string }) {
  const { insights, phaseInsights, loading } = useParentInsights(childId);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading insights...</div>;
  }

  return (
    <div className="space-y-4">
      <PhaseCompletionChart phaseInsights={phaseInsights} />
      <div className="space-y-3">
        {insights.map((insight) => (
          <InsightCardDisplay key={insight.id} insight={insight} />
        ))}
        {insights.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No insights yet. Check back after a few days of activity.
          </p>
        )}
      </div>
    </div>
  );
}

// Child Tasks Component
function ChildTasks({
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
  const [newTask, setNewTask] = useState({
    title: '',
    time: '12:00',
    category: 'nutrition' as TaskCategory,
    credits: 10,
  });

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      onAddTask(newTask);
      setNewTask({ title: '', time: '12:00', category: 'nutrition', credits: 10 });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{tasks.length} tasks</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
          className="touch-target"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>

      {showAddForm && (
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <Input
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="bg-background"
          />
          <div className="flex gap-2">
            <Input
              type="time"
              value={newTask.time}
              onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
              className="bg-background flex-1"
            />
            <Input
              type="number"
              value={newTask.credits}
              onChange={(e) => setNewTask({ ...newTask, credits: parseInt(e.target.value) || 10 })}
              className="bg-background w-20"
              min={1}
            />
          </div>
          <Select
            value={newTask.category}
            onValueChange={(value: TaskCategory) => setNewTask({ ...newTask, category: value })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddTask} className="w-full touch-target">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">
                {task.time} • {task.credits} credits
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDeleteTask(task.id)}
              className="w-8 h-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}