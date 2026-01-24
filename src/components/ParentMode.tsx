import { useState, useEffect } from 'react';
import { Task, TaskCategory, Timetable, StoreReward } from '@/types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Trash2, Plus, Save, X, Pill, Droplets, Apple, BookOpen, Calendar, Bell, Gift, Users, User, Crown, Settings } from 'lucide-react';
import { TimetableEditor } from './TimetableEditor';
import { StoreRewardEditor } from './StoreRewardEditor';
import { useFamilyMembers, FamilyMember } from '@/hooks/useFamilyMembers';
import { cn } from '@/lib/utils';

interface ParentModeProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  dailyGoal: number;
  appTitle: string;
  timetable: Timetable;
  lessonRemindersEnabled: boolean;
  storeRewards: StoreReward[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'completedAt'>) => void;
  onDeleteTask: (id: string) => void;
  onUpdateGoal: (goal: number) => void;
  onUpdateAppTitle: (title: string) => void;
  onUpdateTimetable: (timetable: Timetable) => void;
  onToggleLessonReminders: (enabled: boolean) => void;
  onUpdateStoreRewards: (rewards: StoreReward[]) => void;
}

const categoryOptions: { value: TaskCategory; label: string; icon: typeof Pill }[] = [
  { value: 'medication', label: 'Medication', icon: Pill },
  { value: 'hygiene', label: 'Hygiene', icon: Droplets },
  { value: 'nutrition', label: 'Nutrition', icon: Apple },
  { value: 'school', label: 'School', icon: BookOpen },
];

type SettingsSection = 'general' | 'member';

export function ParentMode({
  open,
  onClose,
  tasks,
  dailyGoal,
  appTitle,
  timetable,
  lessonRemindersEnabled,
  storeRewards,
  onUpdateTask,
  onAddTask,
  onDeleteTask,
  onUpdateGoal,
  onUpdateAppTitle,
  onUpdateTimetable,
  onToggleLessonReminders,
  onUpdateStoreRewards,
}: ParentModeProps) {
  const { members, children, loading: membersLoading } = useFamilyMembers();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [timetableEditorOpen, setTimetableEditorOpen] = useState(false);
  const [storeEditorOpen, setStoreEditorOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    time: '12:00',
    category: 'nutrition' as TaskCategory,
    credits: 10,
  });
  const [localGoal, setLocalGoal] = useState(dailyGoal);
  const [localTitle, setLocalTitle] = useState(appTitle);

  // Reset state when dialog opens
  useEffect(() => {
    if (!open) return;
    setLocalGoal(dailyGoal);
    setLocalTitle(appTitle);
    setEditingTask(null);
    setShowAddForm(false);
    setActiveSection('general');
    setSelectedMemberId(null);
  }, [open, dailyGoal, appTitle]);

  // Auto-select first child when available
  useEffect(() => {
    if (children.length > 0 && !selectedMemberId && activeSection === 'member') {
      setSelectedMemberId(children[0].id);
    }
  }, [children, selectedMemberId, activeSection]);

  const handleSaveTask = (task: Task) => {
    onUpdateTask(task.id, task);
    setEditingTask(null);
  };

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      onAddTask(newTask);
      setNewTask({ title: '', time: '12:00', category: 'nutrition', credits: 10 });
      setShowAddForm(false);
    }
  };

  const handleSaveGoal = () => {
    onUpdateGoal(localGoal);
  };

  const handleSaveTitle = () => {
    onUpdateAppTitle(localTitle);
  };

  const handleSelectMember = (member: FamilyMember) => {
    setActiveSection('member');
    setSelectedMemberId(member.id);
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden bg-card border-border">
        <div className="flex h-full max-h-[85vh]">
          {/* Left Sidebar - Master List */}
          <div className="w-64 border-r border-border bg-secondary/30 flex flex-col">
            <div className="p-4 border-b border-border">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-foreground text-lg">Parent Mode</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  Manage family settings
                </DialogDescription>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* General Settings */}
                <div>
                  <button
                    onClick={() => {
                      setActiveSection('general');
                      setSelectedMemberId(null);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                      activeSection === 'general' && !selectedMemberId
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary text-foreground'
                    )}
                  >
                    <Settings className="w-5 h-5" />
                    <div>
                      <p className="font-medium text-sm">General Settings</p>
                      <p className={cn(
                        'text-xs',
                        activeSection === 'general' && !selectedMemberId
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}>
                        App, goals & rewards
                      </p>
                    </div>
                  </button>
                </div>

                {/* Family Members Section */}
                <div>
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Family Members
                    </span>
                  </div>

                  {membersLoading ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : members.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      No members yet
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {members.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => handleSelectMember(member)}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                            selectedMemberId === member.id
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-secondary text-foreground'
                          )}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            selectedMemberId === member.id
                              ? 'bg-primary-foreground/20'
                              : 'bg-secondary'
                          )}>
                            {member.role === 'parent' ? (
                              <Crown className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {member.displayName}
                            </p>
                            <p className={cn(
                              'text-xs capitalize',
                              selectedMemberId === member.id
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            )}>
                              {member.role}
                            </p>
                          </div>
                        </button>
                      ))}
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
                {activeSection === 'general' && !selectedMemberId ? (
                  <GeneralSettings
                    localTitle={localTitle}
                    setLocalTitle={setLocalTitle}
                    handleSaveTitle={handleSaveTitle}
                    localGoal={localGoal}
                    setLocalGoal={setLocalGoal}
                    handleSaveGoal={handleSaveGoal}
                    lessonRemindersEnabled={lessonRemindersEnabled}
                    onToggleLessonReminders={onToggleLessonReminders}
                    storeRewards={storeRewards}
                    setTimetableEditorOpen={setTimetableEditorOpen}
                    setStoreEditorOpen={setStoreEditorOpen}
                    tasks={tasks}
                    editingTask={editingTask}
                    setEditingTask={setEditingTask}
                    showAddForm={showAddForm}
                    setShowAddForm={setShowAddForm}
                    newTask={newTask}
                    setNewTask={setNewTask}
                    handleAddTask={handleAddTask}
                    handleSaveTask={handleSaveTask}
                    onDeleteTask={onDeleteTask}
                  />
                ) : selectedMember ? (
                  <MemberDetails member={selectedMember} tasks={tasks} />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>Select a section or member from the list</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Timetable Editor Dialog */}
        <TimetableEditor
          open={timetableEditorOpen}
          onClose={() => setTimetableEditorOpen(false)}
          timetable={timetable}
          onSave={onUpdateTimetable}
        />

        {/* Store Reward Editor Dialog */}
        <StoreRewardEditor
          open={storeEditorOpen}
          onClose={() => setStoreEditorOpen(false)}
          rewards={storeRewards}
          onSave={onUpdateStoreRewards}
        />
      </DialogContent>
    </Dialog>
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
  storeRewards: StoreReward[];
  setTimetableEditorOpen: (open: boolean) => void;
  setStoreEditorOpen: (open: boolean) => void;
  tasks: Task[];
  editingTask: string | null;
  setEditingTask: (id: string | null) => void;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  newTask: { title: string; time: string; category: TaskCategory; credits: number };
  setNewTask: (task: { title: string; time: string; category: TaskCategory; credits: number }) => void;
  handleAddTask: () => void;
  handleSaveTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
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
  storeRewards,
  setTimetableEditorOpen,
  setStoreEditorOpen,
  tasks,
  editingTask,
  setEditingTask,
  showAddForm,
  setShowAddForm,
  newTask,
  setNewTask,
  handleAddTask,
  handleSaveTask,
  onDeleteTask,
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
        <Label className="text-foreground font-semibold mb-3 block">Daily Credit Goal</Label>
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
      </div>

      {/* Timetable Section */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-foreground font-semibold">Weekly Timetable</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTimetableEditorOpen(true)}
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Edit Timetable
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Set up your weekly school schedule with subjects and times.
        </p>
        
        {/* Lesson Reminders Toggle */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <Label className="text-foreground text-sm">Lesson Reminders</Label>
          </div>
          <Switch
            checked={lessonRemindersEnabled}
            onCheckedChange={onToggleLessonReminders}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Get notified 5 minutes before each lesson starts.
        </p>
      </div>

      {/* Rewards Store Section */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-foreground font-semibold">Rewards Store</Label>
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
        <p className="text-sm text-muted-foreground">
          Add big rewards that can be redeemed with accumulated credits.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {storeRewards.filter(r => !r.claimed).length} rewards available • {storeRewards.filter(r => r.claimed).length} claimed
        </p>
      </div>

      {/* Task List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-foreground font-semibold">Tasks</Label>
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
        {showAddForm && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 mb-4 space-y-3">
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

        {/* Task Items */}
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskEditRow
              key={task.id}
              task={task}
              isEditing={editingTask === task.id}
              onEdit={() => setEditingTask(task.id)}
              onSave={handleSaveTask}
              onCancel={() => setEditingTask(null)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Member Details Component
interface MemberDetailsProps {
  member: FamilyMember;
  tasks: Task[];
}

function MemberDetails({ member, tasks }: MemberDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
          {member.role === 'parent' ? (
            <Crown className="w-8 h-8 text-primary" />
          ) : (
            <User className="w-8 h-8 text-primary" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{member.displayName}</h2>
          <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <Label className="text-foreground font-semibold mb-3 block">Member Info</Label>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="text-foreground capitalize">{member.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Joined</span>
            <span className="text-foreground">
              {new Date(member.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {member.role === 'child' && (
        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
          <Label className="text-foreground font-semibold mb-3 block">Today's Tasks</Label>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg',
                  task.completed ? 'bg-primary/10' : 'bg-background'
                )}
              >
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  task.completed ? 'bg-primary' : 'bg-muted-foreground/30'
                )} />
                <span className={cn(
                  'text-sm flex-1',
                  task.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                )}>
                  {task.title}
                </span>
                <span className="text-xs text-muted-foreground">{task.time}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {tasks.filter(t => t.completed).length} of {tasks.length} completed
          </p>
        </div>
      )}
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
        <p className="font-medium text-foreground text-sm">{task.title}</p>
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
