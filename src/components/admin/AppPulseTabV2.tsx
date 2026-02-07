import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
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
  BookOpen,
  Mail,
  MailCheck,
  Copy,
  Sparkles,
  Eye,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { ParentSummaryModal } from './ParentSummaryModal';
import { FamilyDrilldownModal } from './FamilyDrilldownModal';
import { FunnelOverview } from './FunnelOverview';
import { RedFlagsSection } from './RedFlagsSection';
import { DateRangeFilter } from './DateRangeFilter';
import { GrowthEngagementChart } from './GrowthEngagementChart';
import { CategoryCompletionChart } from './CategoryCompletionChart';
import { useAdminAnalyticsV2 } from '@/hooks/useAdminAnalyticsV2';
import { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
} from 'recharts';

interface AppPulseTabV2Props {
  isAdmin: boolean;
}

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
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
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

function getOnboardingStatus(signup: { has_profile: boolean; has_family: boolean }): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (!signup.has_profile) {
    return { label: 'ממתין לפרופיל', variant: 'destructive' };
  }
  if (!signup.has_family) {
    return { label: 'ממתין למשפחה', variant: 'secondary' };
  }
  return { label: 'הושלם', variant: 'default' };
}

export function AppPulseTabV2({ isAdmin }: AppPulseTabV2Props) {
  const {
    data,
    loading,
    refetch,
    dateRange,
    setDateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    excludeTestAccounts,
    setExcludeTestAccounts,
    completionRateToday,
    completionRate7d,
    activeChildrenRate,
    funnelRates,
  } = useAdminAnalyticsV2(isAdmin);

  const [summaryModal, setSummaryModal] = useState<{
    isOpen: boolean;
    familyId: string;
    familyName: string;
    childName?: string;
    childId?: string;
  }>({ isOpen: false, familyId: '', familyName: '' });

  const [drilldownModal, setDrilldownModal] = useState<{
    isOpen: boolean;
    familyId: string;
    familyName: string;
  }>({ isOpen: false, familyId: '', familyName: '' });

  // Format weekly trends for chart
  const weeklyTrendsForChart = (data?.weekly_trends || []).map(trend => ({
    ...trend,
    week_label: trend.week_start ? format(new Date(trend.week_start), 'dd/MM', { locale: he }) : ''
  }));

  // Device type data
  const deviceTypeData = data ? [
    { name: 'מכשיר משותף', value: data.shared_device_children, color: CHART_COLORS.primary },
    { name: 'מכשיר נפרד', value: data.separate_device_children, color: CHART_COLORS.accent },
  ] : [];

  // Points utilization
  const pointsUtilization = data
    ? data.potential_7d > 0
      ? Math.round((data.completions_7d / data.potential_7d) * 100)
      : 0
    : 0;

  const familiesWithoutChildrenRate = data
    ? data.total_families > 0
      ? Math.round((data.families_without_children / data.total_families) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-6">
      {/* Date Range & Filters */}
      <div className="flex items-center justify-between gap-4">
        <DateRangeFilter
          dateRange={dateRange}
          setDateRange={setDateRange}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          excludeTestAccounts={excludeTestAccounts}
          setExcludeTestAccounts={setExcludeTestAccounts}
          onRefresh={refetch}
        />
        <Button variant="outline" onClick={refetch} disabled={loading} className="flex-shrink-0">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Funnel Overview */}
      <FunnelOverview funnel={data?.funnel} funnelRates={funnelRates} loading={loading} />

      {/* Red Flags / Attention Needed */}
      <RedFlagsSection redFlags={data?.red_flags} loading={loading} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrowthEngagementChart dailyTrends={data?.daily_trends} loading={loading} />
        <CategoryCompletionChart categoryCompletions={data?.category_completions} loading={loading} />
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Weekly Completion %" 
          value={`${completionRate7d}%`}
          icon={Target}
          subtext={`${data?.completions_7d || 0} מתוך ${data?.potential_7d || 0} משימות`}
          variant="primary"
          loading={loading}
        />
        <StatCard 
          title="Active Children (WAU)" 
          value={data?.active_children_7d || 0} 
          icon={Users}
          subtext={`${activeChildrenRate}% מהילדים פעילים`}
          variant="success"
          loading={loading}
        />
        <StatCard 
          title="Points Utilization" 
          value={`${pointsUtilization}%`}
          icon={Zap}
          subtext="נקודות שנצברו מפוטנציאל"
          variant="warning"
          loading={loading}
        />
        <StatCard 
          title="סה״כ משפחות" 
          value={data?.total_families || 0} 
          icon={Home}
          subtext={`${data?.total_parents || 0} הורים, ${data?.total_children || 0} ילדים`}
          loading={loading}
        />
      </div>

      {/* Community Subscribers Card */}
      <Card className="border-success/20 bg-success/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MailCheck className="w-4 h-4 text-success" />
            Community Subscribers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-success">{data?.marketing_consent_count ?? 0}</p>
              <p className="text-xs text-muted-foreground">משתמשים שאישרו קבלת עדכונים</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                if (data?.marketing_emails && data.marketing_emails.length > 0) {
                  const emailList = data.marketing_emails.join(', ');
                  navigator.clipboard.writeText(emailList);
                  toast.success(`${data.marketing_emails.length} כתובות הועתקו ללוח!`);
                } else {
                  toast.error('אין כתובות מייל להעתקה');
                }
              }}
            >
              <Copy className="w-4 h-4" />
              העתק רשימת תפוצה
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="משפחות ללא ילדים" 
          value={`${data?.families_without_children || 0}`}
          icon={UserX}
          subtext={`${familiesWithoutChildrenRate}% מהמשפחות`}
          loading={loading}
        />
        <StatCard 
          title="השלמות היום" 
          value={(data?.completions_today || 0).toLocaleString()} 
          icon={CheckCircle2}
          subtext={`${completionRateToday}% מהפוטנציאל`}
          loading={loading}
        />
        <StatCard 
          title="ילדים פעילים היום" 
          value={data?.logins_24h || 0} 
          icon={Users}
          subtext="השלימו משימה או שיעור"
          loading={loading}
        />
        <StatCard 
          title="סה״כ השלמות" 
          value={(data?.total_completions || 0).toLocaleString()} 
          icon={TrendingUp}
          subtext="מאז ההשקה"
          loading={loading}
        />
      </div>

      {/* Weekly Completion Trends */}
      {weeklyTrendsForChart.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              מגמת השלמות (8 שבועות אחרונים)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrendsForChart}>
                  <defs>
                    <linearGradient id="colorCompletionsV2" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#colorCompletionsV2)"
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

      {/* Charts Row - Completion Rates & Device Types */}
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
                {data?.completions_today || 0} מתוך {data?.potential_today || 0} משימות
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
                {data?.completions_7d || 0} מתוך {data?.potential_7d || 0} משימות
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
                      <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <Monitor className="w-3 h-3" />
                <span>משותף: {data?.shared_device_children || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                <span>נפרד: {data?.separate_device_children || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Quest Stats */}
      {data?.school_quest_stats && (
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

      {/* PWA Installation Stats */}
      {data?.pwa_stats && (
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Download className="w-4 h-4 text-accent" />
              PWA Installation Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-background/50">
                <Eye className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{data.pwa_stats.total_impressions}</p>
                <p className="text-xs text-muted-foreground">סה״כ הופעות</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <Download className="w-5 h-5 mx-auto mb-1 text-success" />
                <p className="text-2xl font-bold">{data.pwa_stats.total_installs}</p>
                <p className="text-xs text-muted-foreground">סה״כ התקנות</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <Activity className="w-5 h-5 mx-auto mb-1 text-accent" />
                <p className="text-2xl font-bold">{data.pwa_stats.installs_7d}</p>
                <p className="text-xs text-muted-foreground">התקנות (7 ימים)</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">
                  {data.pwa_stats.impressions_7d > 0 
                    ? Math.round((data.pwa_stats.installs_7d / data.pwa_stats.impressions_7d) * 100) 
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">המרה (7 ימים)</p>
              </div>
            </div>
            
            {/* OS & Browser breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {data.pwa_stats.by_os && data.pwa_stats.by_os.length > 0 && (
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">התקנות לפי מערכת הפעלה</p>
                  <div className="space-y-1">
                    {data.pwa_stats.by_os.map((item) => (
                      <div key={item.os} className="flex justify-between text-sm">
                        <span>{item.os || 'Unknown'}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.pwa_stats.by_browser && data.pwa_stats.by_browser.length > 0 && (
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">התקנות לפי דפדפן</p>
                  <div className="space-y-1">
                    {data.pwa_stats.by_browser.map((item) => (
                      <div key={item.browser} className="flex justify-between text-sm">
                        <span>{item.browser || 'Unknown'}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Dismissal stats */}
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span>דחיות זמניות: {data.pwa_stats.dismiss_temporary}</span>
              <span>דחיות קבועות: {data.pwa_stats.dismiss_permanent}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Star Families */}
      {data?.star_families && data.star_families.length > 0 && (
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
                  <TableHead className="text-right">ילדים ואחוזי השלמה</TableHead>
                  <TableHead className="text-right">סה״כ השלמות</TableHead>
                  <TableHead className="text-right">פרסים אחרונים</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.star_families.map((family, index) => (
                  <TableRow key={family.family_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index < 3 && <Star className="w-4 h-4 text-accent" />}
                        <span>{family.family_name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setDrilldownModal({
                            isOpen: true,
                            familyId: family.family_id,
                            familyName: family.family_name,
                          })}
                          title="צלול לנתוני המשפחה"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        {family.parent_marketing_consent && (
                          <Mail className="w-4 h-4 text-success" />
                        )}
                        {family.parent_email || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {family.children && family.children.length > 0 ? (
                        <div className="space-y-2">
                          {family.children.map((child) => (
                            <div key={child.child_id} className="flex items-center gap-2 text-sm">
                              <span className="font-medium min-w-[80px]">{child.display_name}</span>
                              <Progress value={child.completion_rate} className="h-2 w-16" />
                              <span className="text-muted-foreground w-12">{child.completion_rate}%</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 gap-1 text-primary hover:text-primary"
                                onClick={() => setSummaryModal({
                                  isOpen: true,
                                  familyId: family.family_id,
                                  familyName: family.family_name,
                                  childName: child.display_name,
                                  childId: child.child_id,
                                })}
                              >
                                <Sparkles className="w-3 h-3" />
                                סיכום
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-primary">
                      {family.completion_count}
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
            נרשמים אחרונים (7 ימים)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.recent_signups || data.recent_signups.length === 0 ? (
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
                {data.recent_signups.slice(0, 10).map((signup) => {
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

      {/* Modals */}
      <ParentSummaryModal
        isOpen={summaryModal.isOpen}
        onClose={() => setSummaryModal({ isOpen: false, familyId: '', familyName: '' })}
        familyId={summaryModal.familyId}
        familyName={summaryModal.familyName}
        childName={summaryModal.childName}
        childId={summaryModal.childId}
      />
      <FamilyDrilldownModal
        isOpen={drilldownModal.isOpen}
        onClose={() => setDrilldownModal({ isOpen: false, familyId: '', familyName: '' })}
        familyId={drilldownModal.familyId}
        familyName={drilldownModal.familyName}
      />
    </div>
  );
}
