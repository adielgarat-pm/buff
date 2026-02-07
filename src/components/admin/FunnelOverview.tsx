import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Baby, ListTodo, Activity, ArrowRight, TrendingDown } from 'lucide-react';

interface FunnelData {
  total_signups: number;
  activated_families: number;
  engaged_families: number;
  active_families_7d: number;
}

interface FunnelRates {
  signupToActivated: number;
  activatedToEngaged: number;
  engagedToActive: number;
}

interface FunnelOverviewProps {
  funnel: FunnelData | undefined;
  funnelRates: FunnelRates;
  loading?: boolean;
}

interface FunnelStepProps {
  icon: React.ElementType;
  label: string;
  value: number;
  conversionRate?: number;
  dropRate?: number;
  isLast?: boolean;
  color: 'primary' | 'success' | 'warning' | 'accent';
}

function FunnelStep({ icon: Icon, label, value, conversionRate, dropRate, isLast, color }: FunnelStepProps) {
  const colorClasses = {
    primary: 'bg-primary/10 border-primary/30 text-primary',
    success: 'bg-success/10 border-success/30 text-success',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    accent: 'bg-accent/10 border-accent/30 text-accent',
  };

  const getDropBadgeVariant = (rate: number): 'default' | 'secondary' | 'destructive' => {
    if (rate >= 70) return 'default';
    if (rate >= 40) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`p-4 rounded-xl border-2 ${colorClasses[color]} flex-1 min-w-[140px]`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <p className="text-3xl font-bold">{value.toLocaleString()}</p>
        {conversionRate !== undefined && dropRate !== undefined && (
          <div className="mt-2 flex items-center gap-1.5">
            <Badge variant={getDropBadgeVariant(conversionRate)} className="text-xs">
              {conversionRate}% converted
            </Badge>
            {dropRate > 0 && (
              <span className="text-xs text-destructive flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />
                {dropRate}% drop
              </span>
            )}
          </div>
        )}
      </div>
      {!isLast && (
        <ArrowRight className="w-6 h-6 text-muted-foreground flex-shrink-0" />
      )}
    </div>
  );
}

export function FunnelOverview({ funnel, funnelRates, loading }: FunnelOverviewProps) {
  if (loading || !funnel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 w-40 bg-muted/50 rounded-xl animate-pulse flex-shrink-0" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          User Funnel (Cohort from Selected Date Range)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 overflow-x-auto pb-4">
          <FunnelStep
            icon={Users}
            label="Total Signups"
            value={funnel.total_signups}
            color="primary"
          />
          <FunnelStep
            icon={Baby}
            label="Activated"
            value={funnel.activated_families}
            conversionRate={funnelRates.signupToActivated}
            dropRate={100 - funnelRates.signupToActivated}
            color="success"
          />
          <FunnelStep
            icon={ListTodo}
            label="Engaged"
            value={funnel.engaged_families}
            conversionRate={funnelRates.activatedToEngaged}
            dropRate={100 - funnelRates.activatedToEngaged}
            color="warning"
          />
          <FunnelStep
            icon={Activity}
            label="Active (WAU)"
            value={funnel.active_families_7d}
            conversionRate={funnelRates.engagedToActive}
            dropRate={100 - funnelRates.engagedToActive}
            isLast
            color="accent"
          />
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          <p><strong>Activated:</strong> Added at least 1 child • <strong>Engaged:</strong> Created at least 1 task • <strong>Active:</strong> Completed task in last 7 days</p>
        </div>
      </CardContent>
    </Card>
  );
}
