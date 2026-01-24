import { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, User, ChevronDown } from 'lucide-react';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useChildProgress } from '@/hooks/useChildProgress';
import { useParentInsights } from '@/hooks/useParentInsights';
import { PhaseCompletionChart } from './PhaseCompletionChart';
import { InsightCardDisplay } from './InsightCardDisplay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';

export function ParentReports() {
  const { children, loading: membersLoading } = useFamilyMembers();
  const { childrenProgress, loading: progressLoading } = useChildProgress();
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  // Auto-select first child
  if (!selectedChildId && children.length > 0 && !membersLoading) {
    setSelectedChildId(children[0].id);
  }

  const loading = membersLoading || progressLoading;
  const selectedChild = children.find(c => c.id === selectedChildId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">טוען דוחות...</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="space-y-6 pb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground font-display">דוחות</h1>
          <p className="text-sm text-muted-foreground">ניתוח ותובנות</p>
        </div>
        <div className="p-8 rounded-2xl bg-card border border-border text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">אין עדיין ילדים לניתוח</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground font-display">דוחות</h1>
        <p className="text-sm text-muted-foreground">ניתוח ותובנות</p>
      </div>

      {/* Child Selector */}
      <div className="rounded-2xl bg-card border border-primary/20 p-4">
        <label className="text-sm text-muted-foreground mb-2 block">בחר ילד</label>
        <Select value={selectedChildId} onValueChange={setSelectedChildId}>
          <SelectTrigger className="w-full bg-secondary border-border">
            <SelectValue placeholder="בחר ילד" />
          </SelectTrigger>
          <SelectContent>
            {children.map((child) => (
              <SelectItem key={child.id} value={child.id}>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {child.displayName}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reports Content */}
      {selectedChildId && (
        <ChildReportsContent childId={selectedChildId} childName={selectedChild?.displayName || ''} />
      )}
    </div>
  );
}

function ChildReportsContent({ childId, childName }: { childId: string; childName: string }) {
  const { insights, phaseInsights, loading } = useParentInsights(childId);

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">טוען תובנות...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phase Completion Chart */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">השלמה לפי שלב</h2>
        </div>
        <PhaseCompletionChart phaseInsights={phaseInsights} />
      </div>

      {/* Insights */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">תובנות ל-{childName}</h2>
        </div>
        
        {insights.length === 0 ? (
          <div className="p-6 rounded-2xl bg-card border border-border text-center">
            <p className="text-sm text-muted-foreground">
              אין עדיין תובנות. בדקו שוב אחרי מספר ימי פעילות.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => (
              <InsightCardDisplay key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
