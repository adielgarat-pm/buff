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
  Calendar
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
  Legend
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

interface AppPulseData {
  total_families: number;
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
}

interface AppPulseTabProps {
  data: AppPulseData | null;
  loading: boolean;
  completionRateToday: number;
  completionRate7d: number;
  conversionRate: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subtext,
  loading 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ElementType;
  subtext?: string;
  loading?: boolean;
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
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

export function AppPulseTab({ data, loading, completionRateToday, completionRate7d, conversionRate }: AppPulseTabProps) {
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
    { name: 'מכשיר משותף', value: data.shared_device_children, color: 'hsl(var(--primary))' },
    { name: 'מכשיר נפרד', value: data.separate_device_children, color: 'hsl(var(--accent))' },
  ];

  const engagementData = [
    { name: 'פעילים (7 ימים)', value: data.active_children_7d },
    { name: 'לא פעילים', value: Math.max(0, data.total_children - data.active_children_7d) },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="סה״כ פרופילים" 
          value={data.total_profiles} 
          icon={Users}
          subtext={`${data.total_parents} הורים, ${data.total_children} ילדים`}
        />
        <StatCard 
          title="ילדים פעילים (7 ימים)" 
          value={data.active_children_7d} 
          icon={Activity}
          subtext={`מתוך ${data.total_children} ילדים`}
        />
        <StatCard 
          title="השלמות היום" 
          value={data.completions_today.toLocaleString()} 
          icon={CheckCircle2}
          subtext={`מתוך ${data.potential_today} פוטנציאל (${completionRateToday}%)`}
        />
        <StatCard 
          title="השלמות (7 ימים)" 
          value={data.completions_7d.toLocaleString()} 
          icon={TrendingUp}
          subtext={`מתוך ${data.potential_7d} פוטנציאל (${completionRate7d}%)`}
        />
        <StatCard 
          title="כניסות (24 שעות)" 
          value={data.logins_24h} 
          icon={Clock}
          subtext="משתמשים פעילים היום"
        />
      </div>

      {/* Metrics & Charts Row */}
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

        {/* Device Type Distribution */}
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

        {/* Engagement Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Baby className="w-4 h-4" />
              פעילות ילדים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {data.active_children_7d > 0 
                ? `${Math.round((data.active_children_7d / data.total_children) * 100)}% מהילדים פעילים`
                : 'אין נתוני פעילות'}
            </p>
          </CardContent>
        </Card>
      </div>

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
