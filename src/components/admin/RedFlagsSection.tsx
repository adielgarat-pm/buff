import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Clock, TrendingDown, ListX, Eye, Copy } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';

interface StuckOnboardingItem {
  family_id: string;
  family_code: string;
  created_at: string;
  parent_email: string | null;
  onboarding_step: number;
  is_activated: boolean;
}

interface RedFlagsData {
  stuck_onboarding: StuckOnboardingItem[];
  churn_risk: number;
  low_engagement: number;
}

interface RedFlagsSectionProps {
  redFlags: RedFlagsData | undefined;
  loading?: boolean;
}

interface AlertCardProps {
  icon: React.ElementType;
  title: string;
  value: number;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  action?: React.ReactNode;
}

function AlertCard({ icon: Icon, title, value, description, severity, action }: AlertCardProps) {
  const severityClasses = {
    critical: 'border-destructive/50 bg-destructive/5',
    warning: 'border-warning/50 bg-warning/5',
    info: 'border-muted bg-muted/20',
  };

  const iconClasses = {
    critical: 'text-destructive',
    warning: 'text-warning',
    info: 'text-muted-foreground',
  };

  const badgeVariants = {
    critical: 'destructive' as const,
    warning: 'secondary' as const,
    info: 'outline' as const,
  };

  return (
    <Card className={`${severityClasses[severity]} border-2`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Icon className={`w-6 h-6 ${iconClasses[severity]} mt-0.5`} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{title}</h4>
                <Badge variant={badgeVariants[severity]}>{value}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}

export function RedFlagsSection({ redFlags, loading }: RedFlagsSectionProps) {
  const [showStuckModal, setShowStuckModal] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Attention Needed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stuckCount = redFlags?.stuck_onboarding?.length || 0;
  const churnRisk = redFlags?.churn_risk || 0;
  const lowEngagement = redFlags?.low_engagement || 0;

  const handleCopyEmails = () => {
    if (redFlags?.stuck_onboarding) {
      const emails = redFlags.stuck_onboarding
        .filter(s => s.parent_email)
        .map(s => s.parent_email)
        .join(', ');
      if (emails) {
        navigator.clipboard.writeText(emails);
        toast.success('Emails copied to clipboard!');
      } else {
        toast.error('No emails available');
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Attention Needed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AlertCard
              icon={Clock}
              title="Stuck in Onboarding"
              value={stuckCount}
              description="Signed up > 24h ago, no child added"
              severity={stuckCount > 5 ? 'critical' : stuckCount > 0 ? 'warning' : 'info'}
              action={
                stuckCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStuckModal(true)}
                    className="gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                )
              }
            />
            <AlertCard
              icon={TrendingDown}
              title="Churn Risk"
              value={churnRisk}
              description="Active families, no activity in 4+ days"
              severity={churnRisk > 10 ? 'critical' : churnRisk > 5 ? 'warning' : 'info'}
            />
            <AlertCard
              icon={ListX}
              title="Low Engagement"
              value={lowEngagement}
              description="Has child but 0 tasks created"
              severity={lowEngagement > 10 ? 'critical' : lowEngagement > 5 ? 'warning' : 'info'}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showStuckModal} onOpenChange={setShowStuckModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Stuck in Onboarding ({stuckCount})</span>
              <Button variant="outline" size="sm" onClick={handleCopyEmails} className="gap-1">
                <Copy className="w-4 h-4" />
                Copy Emails
              </Button>
            </DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Family Code</TableHead>
                <TableHead>Step</TableHead>
                <TableHead>Signed Up</TableHead>
                <TableHead>Time Ago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redFlags?.stuck_onboarding?.map((item) => {
                const stepLabels: Record<number, string> = {
                  0: 'Not started',
                  1: 'Profile ✓',
                  2: 'Focus Area ✓',
                  3: 'School Feature ✓',
                  4: 'First Task ✓',
                  5: 'Rewards ✓',
                };
                const stepLabel = stepLabels[item.onboarding_step] || `Step ${item.onboarding_step}`;
                const progressPct = Math.round((item.onboarding_step / 6) * 100);
                
                return (
                  <TableRow key={item.family_id}>
                    <TableCell className="font-mono text-sm">
                      {item.parent_email || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.family_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-primary transition-all" 
                            style={{ width: `${progressPct}%` }} 
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{stepLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(item.created_at), 'dd/MM HH:mm', { locale: he })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!redFlags?.stuck_onboarding || redFlags.stuck_onboarding.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No users stuck in onboarding 🎉
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}
