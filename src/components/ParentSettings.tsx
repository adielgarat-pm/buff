import { useState, useEffect } from 'react';
import { Settings, Bell, Calendar, Save, User, BookOpen, Gift, Upload, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Progress } from './ui/progress';
import { TimetableEditor } from './TimetableEditor';
import { TimetableImporter } from './TimetableImporter';
import { StoreRewardEditor } from './StoreRewardEditor';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useChildProgress, useChildData } from '@/hooks/useChildProgress';
import { Task, TaskCategory, Timetable, StoreReward } from '@/types/task';
import { cn } from '@/lib/utils';

interface ParentSettingsProps {
  dailyGoal: number;
  appTitle: string;
  lessonRemindersEnabled: boolean;
  fridayEnabled: boolean;
  onUpdateGoal: (goal: number) => void;
  onUpdateAppTitle: (title: string) => void;
  onToggleLessonReminders: (enabled: boolean) => void;
  onToggleFridayEnabled: (enabled: boolean) => void;
  selectedChildId?: string | null;
  onBackFromChild?: () => void;
}

export function ParentSettings({
  dailyGoal,
  appTitle,
  lessonRemindersEnabled,
  fridayEnabled,
  onUpdateGoal,
  onUpdateAppTitle,
  onToggleLessonReminders,
  onToggleFridayEnabled,
  selectedChildId,
  onBackFromChild,
}: ParentSettingsProps) {
  const { children, loading: membersLoading } = useFamilyMembers();
  const { childrenProgress, loading: progressLoading } = useChildProgress();

  const [localGoal, setLocalGoal] = useState(dailyGoal);
  const [localTitle, setLocalTitle] = useState(appTitle);
  const [expandedChild, setExpandedChild] = useState<string>(selectedChildId || '');

  useEffect(() => {
    setLocalGoal(dailyGoal);
    setLocalTitle(appTitle);
  }, [dailyGoal, appTitle]);

  useEffect(() => {
    if (selectedChildId) {
      setExpandedChild(selectedChildId);
    }
  }, [selectedChildId]);

  const handleSaveGoal = () => onUpdateGoal(localGoal);
  const handleSaveTitle = () => onUpdateAppTitle(localTitle);

  const loading = membersLoading || progressLoading;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground font-display">
            {selectedChildId ? 'הגדרות ילד' : 'הגדרות'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {selectedChildId ? 'ערוך משימות, מערכת ופרסים' : 'הגדרות כלליות וניהול ילדים'}
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
        <ChildConfigPanel childId={selectedChildId} childName={children.find(c => c.id === selectedChildId)?.displayName || ''} />
      ) : (
        <>
          {/* General Settings Card */}
          <div className="rounded-2xl bg-card border border-primary/20 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
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
                  placeholder="BUFF"
                  className="flex-1 bg-secondary border-border"
                  dir="ltr"
                />
                <Button size="sm" onClick={handleSaveTitle} className="bg-primary text-primary-foreground touch-target">
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
                  dir="ltr"
                />
                <span className="text-sm text-muted-foreground">קרדיטים</span>
                <Button size="sm" onClick={handleSaveGoal} className="mr-auto bg-primary text-primary-foreground touch-target">
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
              <User className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">הגדרות ילדים</h2>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-card border border-border p-8 text-center">
                <p className="text-muted-foreground">טוען...</p>
              </div>
            ) : children.length === 0 ? (
              <div className="rounded-2xl bg-card border border-border p-8 text-center space-y-2">
                <User className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">עדיין לא הצטרפו ילדים</p>
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
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 text-right">
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
                            <div className="text-left ml-2">
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
        </>
      )}
    </div>
  );
}

// Child Configuration Panel
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

  const [activeSection, setActiveSection] = useState<'tasks' | 'schedule' | 'rewards'>('tasks');
  const [timetableEditorOpen, setTimetableEditorOpen] = useState(false);
  const [storeEditorOpen, setStoreEditorOpen] = useState(false);
  const [scheduleImporterOpen, setScheduleImporterOpen] = useState(false);

  useEffect(() => {
    initializeChildData();
  }, [initializeChildData]);

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">טוען...</div>;
  }

  const handleImportTimetable = (newTimetable: Timetable) => {
    updateTimetable(newTimetable);
    setScheduleImporterOpen(false);
  };

  const sections = [
    { id: 'tasks' as const, label: 'משימות', icon: BookOpen },
    { id: 'schedule' as const, label: 'מערכת', icon: Calendar },
    { id: 'rewards' as const, label: 'פרסים', icon: Gift },
  ];

  return (
    <div className="space-y-4">
      {/* Daily Goal */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
        <span className="text-sm text-foreground">יעד יומי</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={dailyGoal}
            onChange={(e) => updateDailyGoal(parseInt(e.target.value) || 100)}
            className="w-20 h-8 bg-background border-border text-center text-sm"
            min={10}
            max={500}
            dir="ltr"
          />
          <span className="text-xs text-muted-foreground">קרדיטים</span>
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
        {activeSection === 'tasks' && (
          <ChildTasksEditor
            tasks={tasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        )}

        {activeSection === 'schedule' && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setScheduleImporterOpen(true)}
                className="w-full touch-target"
              >
                <Upload className="w-4 h-4 ml-2" />
                ייבוא מאקסל
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTimetableEditorOpen(true)}
                className="w-full touch-target"
              >
                <Calendar className="w-4 h-4 ml-2" />
                עריכה ידנית
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {Object.values(timetable).flat().length} שיעורים מוגדרים
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
              <Gift className="w-4 h-4 ml-2" />
              ערוך חנות פרסים
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {storeRewards.length} פרסים מוגדרים
            </p>
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

// Simplified Task Editor for Child
import { Trash2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Pill, Droplets, Apple } from 'lucide-react';

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
  const [newTask, setNewTask] = useState({
    title: '',
    time: '12:00',
    category: 'nutrition' as TaskCategory,
    credits: 10,
  });

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
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
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
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {task.time} • {task.credits} קרדיטים
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDeleteTask(task.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 touch-target"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
