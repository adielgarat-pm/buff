import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Baby, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  Monitor,
  TrendingUp,
  Target,
  Calendar,
  Home,
  UserX,
  GraduationCap,
  Star,
  Zap,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';

interface RecentSignup {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  has_profile: boolean;
  profile_role: string | null;
  display_name: string | null;
  has_family: boolean;
}

interface WeeklyTrend {
  week_start: string;
  completions: number;
  active_children: number;
}

interface RecentReward {
  title: string;
  claimed_at: string | null;
}

interface StarFamily {
  family_id: string;
  family_name: string;
  family_code: string;
  parent_email: string | null;
  child_count: number;
  completion_count: number;
  completion_rate: number;
  recent_rewards: RecentReward[];
}

interface SchoolQuestStats {
  families_with_timetable: number;
  total_lesson_completions: number;
  lesson_completions_7d: number;
  children_with_quest_enabled: number;
}

interface AppPulseData {
  total_families: number;
  families_without_children: number;
  total_profiles: number;
  total_parents: number;
  total_children: number;
  active_children_7d: number;
  total_tasks: number;
  total_completions: number;
  completions_today: number;
  completions_7d: number;
  potential_today: number;
  potential_7d: number;
  logins_24h: number;
  shared_device_children: number;
  separate_device_children: number;
  recent_signups: RecentSignup[];
  weekly_trends?: WeeklyTrend[];
  star_families?: StarFamily[];
  school_quest_stats?: SchoolQuestStats;
}

interface AppPulseTabProps {
  data: AppPulseData | null;
  loading: boolean;
  completionRateToday: number;
  completionRate7d: number;
  activeChildrenRate: number;
  conversionRate: number;
  familiesWithoutChildrenRate: number;
  pointsUtilization?: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];
const CHART_COLORS = {
  primary: '#6366f1',
  accent: '#f59e0b',
  success: '#22c55e',
  muted: '#94a3b8'
};

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subtext,
  loading,
  variant = 'default'
}: { 
  title: string; 
  value: number | string; 
  icon: React.ElementType;
  subtext?: string;
  loading?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'primary';
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  const iconColors = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    primary: 'text-primary'
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColors[variant]}`} />
          <span className="text-3xl font-bold">{value}</span>
        </div>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}

function getOnboardingStatus(signup: RecentSignup): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (!signup.has_profile) {
    return { label: 'ממתין לפרופיל', variant: 'destructive' };
  }
  if (!signup.has_family) {
    return { label: 'ממתין למשפחה', variant: 'secondary' };
  }
  return { label: 'הושלם', variant: 'default' };
}

export function AppPulseTab({ 
  data, 
  loading, 
  completionRateToday, 
  completionRate7d, 
  activeChildrenRate, 
  conversionRate, 
  familiesWithoutChildrenRate,
  pointsUtilization = 0
}: AppPulseTabProps) {
  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCard key={i} title="" value="" icon={Users} loading />
          ))}
        </div>
      </div>
    );
  }

  // Prepare chart data
  const deviceTypeData = [
    { name: 'מכשיר משותף', value: data.shared_device_children, color: CHART_COLORS.primary },
    { name: 'מכשיר נפרד', value: data.separate_device_children, color: CHART_COLORS.accent },
  ];

  const engagementData = [
    { name: 'פעילים (7 ימים)', value: data.active_children_7d },
    { name: 'לא פעילים', value: Math.max(0, data.total_children - data.active_children_7d) },
  ];

  // Format weekly trends for chart
  const weeklyTrendsForChart = (data.weekly_trends || []).map(trend => ({
    ...trend,
    week_label: trend.week_start ? format(new Date(trend.week_start), 'dd/MM', { locale: he }) : ''
  }));

  return (
    <div className="space-y-6">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Weekly Completion %" 
          value={`${completionRate7d}%`}
          icon={Target}
          subtext={`${data.completions_7d} מתוך ${data.potential_7d} משימות`}
          variant="primary"
        />
        <StatCard 
          title="Active Families (WAU)" 
          value={data.active_children_7d} 
          icon={Users}
          subtext={`${activeChildrenRate}% מהילדים פעילים`}
          variant="success"
        />
        <StatCard 
          title="Points Utilization" 
          value={`${pointsUtilization}%`}
          icon={Zap}
          subtext="נקודות שנצברו מפוטנציאל"
          variant="warning"
        />
        <StatCard 
          title="סה״כ משפחות" 
          value={data.total_families} 
          icon={Home}
          subtext={`${data.total_parents} הורים, ${data.total_children} ילדים`}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="משפחות ללא ילדים" 
          value={`${data.families_without_children}`}
          icon={UserX}
          subtext={`${familiesWithoutChildrenRate}% מהמשפחות`}
        />
        <StatCard 
          title="השלמות היום" 
          value={data.completions_today.toLocaleString()} 
          icon={CheckCircle2}
          subtext={`${completionRateToday}% מהפוטנציאל`}
        />
        <StatCard 
          title="כניסות (24 שעות)" 
          value={data.logins_24h} 
          icon={Clock}
          subtext="משתמשים פעילים היום"
        />
        <StatCard 
          title="סה״כ השלמות" 
          value={data.total_completions.toLocaleString()} 
          icon={TrendingUp}
          subtext="מאז ההשקה"
        />
      </div>

      {/* Completion Trends Line Chart */}
      {weeklyTrendsForChart.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              מגמת השלמות (30 יום אחרונים)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrendsForChart}>
                  <defs>
                    <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="week_label" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completions" 
                    stroke={CHART_COLORS.primary}
                    fill="url(#colorCompletions)"
                    strokeWidth={2}
                    name="השלמות"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="active_children" 
                    stroke={CHART_COLORS.accent}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.accent }}
                    name="ילדים פעילים"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Completion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              שיעור השלמה - היום
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{completionRateToday}%</span>
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <Progress value={completionRateToday} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {data.completions_today} מתוך {data.potential_today} משימות
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 7-Day Completion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              שיעור השלמה - 7 ימים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{completionRate7d}%</span>
                <Activity className="w-5 h-5 text-success" />
              </div>
              <Progress value={completionRate7d} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {data.completions_7d} מתוך {data.potential_7d} משימות
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Device Type Distribution - Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              סוג מכשיר ילדים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <Monitor className="w-3 h-3" />
                <span>משותף: {data.shared_device_children}</span>
              </div>
              <div className="flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                <span>נפרד: {data.separate_device_children}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Quest Stats */}
      {data.school_quest_stats && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              School Quest Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-background/50">
                <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{data.school_quest_stats.families_with_timetable}</p>
                <p className="text-xs text-muted-foreground">משפחות עם מערכת</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-success" />
                <p className="text-2xl font-bold">{data.school_quest_stats.total_lesson_completions}</p>
                <p className="text-xs text-muted-foreground">שיעורים שהושלמו</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <Activity className="w-5 h-5 mx-auto mb-1 text-accent" />
                <p className="text-2xl font-bold">{data.school_quest_stats.lesson_completions_7d}</p>
                <p className="text-xs text-muted-foreground">השלמות (7 ימים)</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <Baby className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{data.school_quest_stats.children_with_quest_enabled}</p>
                <p className="text-xs text-muted-foreground">ילדים עם Quest</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Star Families Table */}
      {data.star_families && data.star_families.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" />
              Star Families - Top 10 by Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">משפחה</TableHead>
                  <TableHead className="text-right">מייל</TableHead>
                  <TableHead className="text-right">ילדים</TableHead>
                  <TableHead className="text-right">השלמות (7 ימים)</TableHead>
                  <TableHead className="text-right">% השלמה</TableHead>
                  <TableHead className="text-right">פרסים אחרונים</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.star_families.map((family, index) => (
                  <TableRow key={family.family_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index < 3 && <Star className="w-4 h-4 text-accent" />}
                        {family.family_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {family.parent_email || '-'}
                    </TableCell>
                    <TableCell>{family.child_count}</TableCell>
                    <TableCell className="font-bold text-primary">
                      {family.completion_count}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={family.completion_rate} className="h-2 w-16" />
                        <span className="text-sm">{family.completion_rate}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {family.recent_rewards && family.recent_rewards.length > 0
                        ? family.recent_rewards.slice(0, 2).map(r => r.title).join(', ')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Signups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            10 נרשמים אחרונים
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent_signups.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">אין נרשמים עדיין</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">אימייל</TableHead>
                  <TableHead className="text-right">תפקיד</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">תאריך</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_signups.map((signup) => {
                  const status = getOnboardingStatus(signup);
                  return (
                    <TableRow key={signup.user_id}>
                      <TableCell className="font-medium">
                        {signup.display_name || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {signup.email}
                      </TableCell>
                      <TableCell>
                        {signup.profile_role === 'parent' ? (
                          <Badge variant="outline">הורה</Badge>
                        ) : signup.profile_role === 'child' ? (
                          <Badge variant="secondary">ילד</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(signup.created_at), 'dd/MM HH:mm', { locale: he })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
