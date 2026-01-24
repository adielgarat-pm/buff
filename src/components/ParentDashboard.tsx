import { useState } from 'react';
import { Task, TaskCategory, Timetable, StoreReward } from '@/types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChevronLeft, Users, User, Settings, Sparkles, TrendingUp, Calendar, Gift, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react';
import { TimetableImporter } from './TimetableImporter';
import { TimetableEditor } from './TimetableEditor';
import { StoreRewardEditor } from './StoreRewardEditor';
import { useFamilyMembers, FamilyMember } from '@/hooks/useFamilyMembers';
import { useChildProgress, useChildData } from '@/hooks/useChildProgress';
import { cn } from '@/lib/utils';
import { useParentInsights } from '@/hooks/useParentInsights';
import { InsightCardDisplay } from './InsightCardDisplay';
import { PhaseCompletionChart } from './PhaseCompletionChart';
import { useLanguage } from '@/contexts/LanguageContext';

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
  onBack: () => void;
}

type DashboardSection = 'main' | 'overview' | 'general' | 'child';

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
  const { t } = useLanguage();
  const { members, children, loading: membersLoading } = useFamilyMembers();
  const { childrenProgress, loading: progressLoading } = useChildProgress();
  const [activeSection, setActiveSection] = useState<DashboardSection>('main');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  
  const [localGoal, setLocalGoal] = useState(dailyGoal);
  const [localTitle, setLocalTitle] = useState(appTitle);

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

  // Main menu view with cards
  if (activeSection === 'main') {
    return (
      <div className="stacked-layout py-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center touch-target"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Parent Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage family settings</p>
          </div>
        </div>

        {/* Menu Cards */}
        <button
          onClick={() => setActiveSection('overview')}
          className="mobile-card flex items-center justify-between touch-feedback active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Family Overview</p>
              <p className="text-sm text-muted-foreground">Live progress for all children</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button
          onClick={() => setActiveSection('general')}
          className="mobile-card flex items-center justify-between touch-feedback active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Settings className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">General Settings</p>
              <p className="text-sm text-muted-foreground">App title, reminders, schedule</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Children Section */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Configure Children
            </span>
          </div>

          {membersLoading ? (
            <div className="mobile-card text-center text-muted-foreground">
              Loading...
            </div>
          ) : children.length === 0 ? (
            <div className="mobile-card text-center text-muted-foreground">
              No children joined yet. Share your family code to invite them.
            </div>
          ) : (
            <div className="stacked-layout">
              {children.map((child) => {
                const progress = childrenProgress.find(p => p.childId === child.id);
                const progressPercent = progress 
                  ? Math.min((progress.todayEarned / progress.dailyGoal) * 100, 100)
                  : 0;

                return (
                  <button
                    key={child.id}
                    onClick={() => handleSelectChild(child)}
                    className="mobile-card flex items-center justify-between touch-feedback active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-buff/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-buff" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {child.displayName}
                        </p>
                        {progress && (
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={progressPercent} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {progress.todayEarned}/{progress.dailyGoal}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Section header with back button
  const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={() => setActiveSection('main')}
        className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center touch-target"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );

  // Family Overview Section
  if (activeSection === 'overview') {
    return (
      <div className="stacked-layout py-4 parent-dashboard-scroll">
        <SectionHeader title="Family Overview" subtitle="Real-time progress" />
        
        {progressLoading ? (
          <div className="mobile-card text-center text-muted-foreground">Loading...</div>
        ) : childrenProgress.length === 0 ? (
          <div className="mobile-card text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No children have joined yet.</p>
          </div>
        ) : (
          childrenProgress.map((child) => {
            const progressPercent = Math.min((child.todayEarned / child.dailyGoal) * 100, 100);
            
            return (
              <button
                key={child.childId}
                onClick={() => {
                  const c = children.find(c => c.id === child.childId);
                  if (c) handleSelectChild(c);
                }}
                className="mobile-card touch-feedback active:scale-[0.98] text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{child.displayName}</h3>
                      <p className="text-sm text-muted-foreground">
                        💰 {child.totalBalance.toLocaleString()} credits
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{child.todayEarned}</p>
                    <p className="text-xs text-muted-foreground">of {child.dailyGoal}</p>
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
                    <div className="w-2 h-2 rounded-full bg-buff" />
                    <span className="text-muted-foreground">
                      Lessons: {child.lessonsCompleted}/{child.lessonsTotal}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    );
  }

  // General Settings Section
  if (activeSection === 'general') {
    return (
      <div className="stacked-layout py-4 parent-dashboard-scroll">
        <SectionHeader title="General Settings" subtitle="App configuration" />
        
        {/* App Title */}
        <div className="mobile-card space-y-3">
          <Label className="text-foreground font-medium">App Title</Label>
          <div className="flex gap-2">
            <Input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Enter app title"
              className="flex-1 h-12 rounded-xl"
            />
            <Button onClick={handleSaveTitle} size="lg" className="h-12 rounded-xl">
              Save
            </Button>
          </div>
        </div>

        {/* Daily Goal */}
        <div className="mobile-card space-y-3">
          <Label className="text-foreground font-medium">Default Daily Goal</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={localGoal}
              onChange={(e) => setLocalGoal(Number(e.target.value))}
              min={1}
              className="flex-1 h-12 rounded-xl"
            />
            <Button onClick={handleSaveGoal} size="lg" className="h-12 rounded-xl">
              Save
            </Button>
          </div>
        </div>

        {/* Toggles */}
        <div className="mobile-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground font-medium">Lesson Reminders</Label>
              <p className="text-sm text-muted-foreground">Get notified before lessons</p>
            </div>
            <Switch
              checked={lessonRemindersEnabled}
              onCheckedChange={onToggleLessonReminders}
              className="touch-target"
            />
          </div>

          <div className="border-t border-border pt-4 flex items-center justify-between">
            <div>
              <Label className="text-foreground font-medium">Friday School Day</Label>
              <p className="text-sm text-muted-foreground">Include Friday in timetable</p>
            </div>
            <Switch
              checked={fridayEnabled}
              onCheckedChange={onToggleFridayEnabled}
              className="touch-target"
            />
          </div>
        </div>
      </div>
    );
  }

  // Child Configuration Section
  if (activeSection === 'child' && selectedChild) {
    return (
      <ChildConfigurationMobile 
        child={selectedChild}
        progress={selectedChildProgress}
        onBack={() => setActiveSection('main')}
      />
    );
  }

  return null;
}

// Mobile-optimized Child Configuration
interface ChildConfigurationMobileProps {
  child: FamilyMember;
  progress?: {
    todayEarned: number;
    dailyGoal: number;
    tasksCompleted: number;
    tasksTotal: number;
    totalBalance: number;
  };
  onBack: () => void;
}

function ChildConfigurationMobile({ child, progress, onBack }: ChildConfigurationMobileProps) {
  const { insights, phaseInsights, loading: insightsLoading } = useParentInsights(child.id);
  const { tasks, storeRewards, timetable, loading: dataLoading } = useChildData(child.id);

  return (
    <div className="stacked-layout py-4 parent-dashboard-scroll">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center touch-target"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-buff/10 flex items-center justify-center">
            <User className="w-6 h-6 text-buff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{child.displayName}</h1>
            {progress && (
              <p className="text-sm text-muted-foreground">
                {progress.todayEarned}/{progress.dailyGoal} today • 💰 {progress.totalBalance.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-12 rounded-xl mb-4">
          <TabsTrigger value="insights" className="rounded-xl text-xs">
            <TrendingUp className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-xl text-xs">
            <BookOpen className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-xl text-xs">
            <Calendar className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="rewards" className="rounded-xl text-xs">
            <Gift className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-0 space-y-4">
          {insightsLoading ? (
            <div className="mobile-card text-center text-muted-foreground">Loading insights...</div>
          ) : (
            <>
              {phaseInsights && phaseInsights.length > 0 && (
                <div className="mobile-card">
                  <h3 className="font-semibold text-foreground mb-4">7-Day Phase Completion</h3>
                  <PhaseCompletionChart phaseInsights={phaseInsights} />
                </div>
              )}
              {insights.length > 0 ? (
                <div className="stacked-layout">
                  {insights.map((insight, idx) => (
                    <InsightCardDisplay key={idx} insight={insight} />
                  ))}
                </div>
              ) : (
                <div className="mobile-card text-center text-muted-foreground">
                  No insights yet. Keep collecting data!
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-0">
          <div className="mobile-card">
            {dataLoading ? (
              <p className="text-center text-muted-foreground">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-center text-muted-foreground">No tasks configured</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-xl bg-secondary/50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.time} • {task.credits} credits</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-0">
          <div className="mobile-card">
            {dataLoading ? (
              <p className="text-center text-muted-foreground">Loading schedule...</p>
            ) : !timetable ? (
              <p className="text-center text-muted-foreground">No schedule configured</p>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Weekly timetable configured with lessons for:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(timetable).map(([day, periods]) => (
                    periods && periods.length > 0 && (
                      <span key={day} className="px-3 py-1 rounded-full bg-secondary text-foreground text-xs capitalize">
                        {day}: {periods.length} lessons
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="mt-0">
          <div className="mobile-card">
            {dataLoading ? (
              <p className="text-center text-muted-foreground">Loading rewards...</p>
            ) : storeRewards.length === 0 ? (
              <p className="text-center text-muted-foreground">No rewards configured</p>
            ) : (
              <div className="space-y-3">
                {storeRewards.map((reward) => (
                  <div key={reward.id} className="p-3 rounded-xl bg-secondary/50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-buff/10 flex items-center justify-center text-xl">
                      {reward.icon || '🎁'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{reward.title}</p>
                      <p className="text-xs text-muted-foreground">{reward.price} credits</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
