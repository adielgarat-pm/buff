import { useState, useEffect } from 'react';
import { Task, TaskCategory, Timetable, StoreReward } from '@/types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Trash2, Plus, Save, X, Pill, Droplets, Apple, BookOpen, Calendar, Bell, Gift } from 'lucide-react';
import { TimetableEditor } from './TimetableEditor';
import { StoreRewardEditor } from './StoreRewardEditor';

interface ParentModeProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  dailyGoal: number;
  timetable: Timetable;
  lessonRemindersEnabled: boolean;
  storeRewards: StoreReward[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'completedAt'>) => void;
  onDeleteTask: (id: string) => void;
  onUpdateGoal: (goal: number) => void;
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

export function ParentMode({
  open,
  onClose,
  tasks,
  dailyGoal,
  timetable,
  lessonRemindersEnabled,
  storeRewards,
  onUpdateTask,
  onAddTask,
  onDeleteTask,
  onUpdateGoal,
  onUpdateTimetable,
  onToggleLessonReminders,
  onUpdateStoreRewards,
}: ParentModeProps) {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Parent Mode</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manage tasks, credits, and daily goals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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

  // Sync local state when task prop changes
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
