import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  ListTodo, 
  Gift, 
  Calendar, 
  Clock, 
  Coins,
  Baby,
  CheckCircle2,
  XCircle,
  BookOpen,
  Download,
  BarChart3,
  TrendingUp,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface FamilyDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  familyName: string;
}

interface TaskData {
  id: string;
  title: string;
  category: string;
  time: string;
  credits: number;
  icon: string | null;
  assigned_to: string | null;
  child_name?: string;
}

interface RewardData {
  id: string;
  title: string;
  emoji: string;
  price: number;
  claimed: boolean;
  claimed_at: string | null;
  assigned_to: string | null;
  child_name?: string;
}

interface TimetableData {
  id: string;
  assigned_to: string | null;
  child_name?: string;
  data: Record<string, { subject: string; startTime: string; equipment?: string }[]>;
  updated_at: string;
}

interface ChildProfile {
  id: string;
  display_name: string;
  daily_goal: number;
  school_quest_enabled: boolean;
  bag_prep_enabled: boolean;
  birth_date: string | null;
  credit_balance: number;
}

interface FamilyData {
  tasks: TaskData[];
  rewards: RewardData[];
  timetables: TimetableData[];
  children: ChildProfile[];
}

const CATEGORY_LABELS: Record<string, string> = {
  medication: 'תרופות',
  hygiene: 'היגיינה',
  nutrition: 'תזונה',
  school: 'בית ספר',
};

const DAY_LABELS: Record<string, string> = {
  sunday: 'ראשון',
  monday: 'שני',
  tuesday: 'שלישי',
  wednesday: 'רביעי',
  thursday: 'חמישי',
  friday: 'שישי',
};

export function FamilyDrilldownModal({ isOpen, onClose, familyId, familyName }: FamilyDrilldownModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FamilyData | null>(null);

  useEffect(() => {
    if (isOpen && familyId) {
      fetchFamilyData();
    }
  }, [isOpen, familyId]);

  const fetchFamilyData = async () => {
    setLoading(true);
    try {
      // Use admin RPC function to bypass RLS
      const { data: result, error } = await supabase.rpc('get_admin_family_drilldown', {
        p_family_id: familyId
      });

      if (error) {
        console.error('Error fetching family data:', error);
        return;
      }

      if (result && typeof result === 'object' && !Array.isArray(result)) {
        const jsonResult = result as Record<string, unknown>;
        
        if (jsonResult.error) {
          console.error('Admin access error:', jsonResult.error);
          return;
        }

        const children = (jsonResult.children || []) as ChildProfile[];
        const childMap = new Map(children.map(c => [c.id, c.display_name]));

        const rawTasks = (jsonResult.tasks || []) as TaskData[];
        const tasks: TaskData[] = rawTasks.map(t => ({
          ...t,
          child_name: t.assigned_to ? childMap.get(t.assigned_to) || 'לא משויך' : 'כללי',
        }));

        const rawRewards = (jsonResult.rewards || []) as RewardData[];
        const rewards: RewardData[] = rawRewards.map(r => ({
          ...r,
          child_name: r.assigned_to ? childMap.get(r.assigned_to) || 'לא משויך' : 'כללי',
        }));

        const rawTimetables = (jsonResult.timetables || []) as TimetableData[];
        const timetables: TimetableData[] = rawTimetables.map(t => ({
          ...t,
          child_name: t.assigned_to ? childMap.get(t.assigned_to) || 'לא משויך' : 'כללי',
        }));

        setData({ tasks, rewards, timetables, children });
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!data) return;
    
    const exportObj = {
      family_name: familyName,
      family_id: familyId,
      exported_at: new Date().toISOString(),
      children: data.children.map(child => {
        let age: number | null = null;
        if (child.birth_date) {
          const birthDate = new Date(child.birth_date);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }
        return {
          ...child,
          age,
          tasks: data.tasks.filter(t => t.assigned_to === child.id),
          rewards: data.rewards.filter(r => r.assigned_to === child.id),
          timetable: data.timetables.find(t => t.assigned_to === child.id)?.data || null,
        };
      }),
      general_tasks: data.tasks.filter(t => !t.assigned_to),
      general_rewards: data.rewards.filter(r => !r.assigned_to),
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-${familyName}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Baby className="w-5 h-5 text-primary" />
              צלילה למשפחת {familyName}
            </DialogTitle>
            {data && (
              <Button variant="outline" size="sm" onClick={exportData} className="gap-1">
                <Download className="w-4 h-4" />
                ייצוא
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : data ? (
          <Tabs defaultValue="tasks" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tasks" className="gap-1">
                <ListTodo className="w-4 h-4" />
                משימות ({data.tasks.length})
              </TabsTrigger>
              <TabsTrigger value="rewards" className="gap-1">
                <Gift className="w-4 h-4" />
                פרסים ({data.rewards.length})
              </TabsTrigger>
              <TabsTrigger value="timetables" className="gap-1">
                <Calendar className="w-4 h-4" />
                מערכת ({data.timetables.length})
              </TabsTrigger>
              <TabsTrigger value="children" className="gap-1">
                <Baby className="w-4 h-4" />
                ילדים ({data.children.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              {/* Tasks Tab */}
              <TabsContent value="tasks" className="m-0">
                {data.tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ListTodo className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>לא הוגדרו משימות</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.children.map(child => {
                      const childTasks = data.tasks.filter(t => t.assigned_to === child.id);
                      if (childTasks.length === 0) return null;
                      return (
                        <Card key={child.id}>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">{child.display_name}</CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="space-y-1">
                              {childTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{task.icon || '📋'}</span>
                                    <span className="font-medium">{task.title}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {CATEGORY_LABELS[task.category] || task.category}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {task.time}
                                    </span>
                                    <span className="flex items-center gap-1 text-primary">
                                      <Coins className="w-3 h-3" />
                                      {task.credits}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Rewards Tab */}
              <TabsContent value="rewards" className="m-0">
                {data.rewards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>לא הוגדרו פרסים</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.children.map(child => {
                      const childRewards = data.rewards.filter(r => r.assigned_to === child.id);
                      if (childRewards.length === 0) return null;
                      return (
                        <Card key={child.id}>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">{child.display_name}</CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="grid grid-cols-2 gap-2">
                              {childRewards.map(reward => (
                                <div key={reward.id} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{reward.emoji}</span>
                                    <span className="font-medium text-sm">{reward.title}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-primary font-medium">{reward.price}</span>
                                    {reward.claimed ? (
                                      <CheckCircle2 className="w-4 h-4 text-success" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Timetables Tab */}
              <TabsContent value="timetables" className="m-0">
                {data.timetables.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>לא הוזנה מערכת שעות</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.timetables.map(timetable => (
                      <Card key={timetable.id}>
                        <CardHeader className="py-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              {timetable.child_name}
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">
                              עודכן: {format(new Date(timetable.updated_at), 'dd/MM/yyyy', { locale: he })}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(timetable.data).map(([day, lessons]) => (
                              <div key={day} className="bg-muted/50 rounded-lg p-3">
                                <h4 className="font-medium text-sm mb-2 text-primary">
                                  {DAY_LABELS[day] || day}
                                </h4>
                                <div className="space-y-1">
                                  {lessons.map((lesson, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                      <span>{lesson.subject || '[ריק]'}</span>
                                      <span className="text-muted-foreground">{lesson.startTime}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Children Tab */}
              <TabsContent value="children" className="m-0">
                {data.children.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Baby className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>אין ילדים רשומים</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.children.map(child => {
                      // Calculate age from birth_date
                      let age: number | null = null;
                      if (child.birth_date) {
                        const birthDate = new Date(child.birth_date);
                        const today = new Date();
                        age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                          age--;
                        }
                      }
                      
                      return (
                        <Card key={child.id}>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <Baby className="w-4 h-4 text-primary" />
                                {child.display_name}
                                {age !== null && (
                                  <Badge variant="outline" className="text-xs">
                                    גיל {age}
                                  </Badge>
                                )}
                              </span>
                              <span className="flex items-center gap-1 text-primary font-bold">
                                <Coins className="w-4 h-4" />
                                {child.credit_balance}
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">יעד יומי:</span>
                                <span className="font-medium">{child.daily_goal} נקודות</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">School Quest:</span>
                                <Badge variant={child.school_quest_enabled ? 'default' : 'secondary'}>
                                  {child.school_quest_enabled ? 'פעיל' : 'כבוי'}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">הכנת תיק:</span>
                                <Badge variant={child.bag_prep_enabled ? 'default' : 'secondary'}>
                                  {child.bag_prep_enabled ? 'פעיל' : 'כבוי'}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>לא נמצאו נתונים</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
