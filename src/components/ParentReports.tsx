import { useState } from 'react';
import { 
  BarChart3, TrendingUp, Calendar, User, Trophy, Flame, Target,
  BookOpen, MessageSquare, AlertTriangle, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useChildProgress } from '@/hooks/useChildProgress';
import { useParentInsights } from '@/hooks/useParentInsights';
import { useWeeklyBuffStats, SubjectTrend, LessonReflection } from '@/hooks/useWeeklyBuffStats';
import { PhaseCompletionChart } from './PhaseCompletionChart';
import { InsightCardDisplay } from './InsightCardDisplay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { PHASES } from '@/types/phase';

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
          <h1 className="text-2xl font-bold text-foreground font-display">Weekly Buff Stats</h1>
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
        <h1 className="text-2xl font-bold text-foreground font-display">Weekly Buff Stats</h1>
        <p className="text-sm text-muted-foreground">ניתוח ביצועים ותובנות שבועיות</p>
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
  const { insights, phaseInsights, loading: insightsLoading } = useParentInsights(childId);
  const { stats, loading: statsLoading } = useWeeklyBuffStats(childId);
  const [showAllReflections, setShowAllReflections] = useState(false);

  const loading = insightsLoading || statsLoading;

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">טוען תובנות...</div>
    );
  }

  const topPhaseInfo = stats?.topPhase ? PHASES.find(p => p.id === stats.topPhase) : null;
  const strugglePhaseInfo = stats?.strugglePhase ? PHASES.find(p => p.id === stats.strugglePhase) : null;

  return (
    <div className="space-y-6">
      {/* Weekly Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          {/* Total Buff Points */}
          <div className="rounded-2xl bg-gradient-to-br from-buff/20 to-buff/5 border border-buff/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-buff" />
              <span className="text-xs text-buff font-medium">Buff Points</span>
            </div>
            <p className="text-3xl font-bold text-buff">{stats.totalBuffPoints}</p>
            <p className="text-xs text-muted-foreground mt-1">this week</p>
          </div>

          {/* Streak */}
          <div className="rounded-2xl bg-gradient-to-br from-streak/20 to-streak/5 border border-streak/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-streak" />
              <span className="text-xs text-streak font-medium">Streak</span>
            </div>
            <p className="text-3xl font-bold text-streak">{stats.streakDays}</p>
            <p className="text-xs text-muted-foreground mt-1">days in a row</p>
          </div>

          {/* Quests Conquered */}
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground">Quests</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.questsConquered}<span className="text-sm text-muted-foreground">/{stats.totalQuests}</span>
            </p>
            <Progress value={(stats.questsConquered / Math.max(stats.totalQuests, 1)) * 100} className="h-2 mt-2" />
          </div>

          {/* Lessons Conquered */}
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-accent" />
              <span className="text-xs text-muted-foreground">Lessons</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.lessonsConquered}<span className="text-sm text-muted-foreground">/{stats.totalLessons}</span>
            </p>
            <Progress value={(stats.lessonsConquered / Math.max(stats.totalLessons, 1)) * 100} className="h-2 mt-2" />
          </div>
        </div>
      )}

      {/* Phase Performance */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">ביצועים לפי שלב</h2>
        </div>
        <PhaseCompletionChart phaseInsights={phaseInsights} />
        
        {/* Quick highlights */}
        {(topPhaseInfo || strugglePhaseInfo) && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {topPhaseInfo && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-buff/10 border border-buff/20">
                <Trophy className="w-4 h-4 text-buff" />
                <span className="text-xs text-buff">הכי חזק: {topPhaseInfo.label}</span>
              </div>
            )}
            {strugglePhaseInfo && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span className="text-xs text-rose-400">לשפר: {strugglePhaseInfo.label}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trend Detector - Subject Analysis */}
      {stats && stats.subjectTrends.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-foreground">Trend Detector</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">ביצועים לפי מקצוע</p>
          
          <div className="space-y-3">
            {stats.subjectTrends
              .sort((a, b) => a.completionRate - b.completionRate)
              .slice(0, 5)
              .map((trend) => (
                <SubjectTrendRow key={trend.subject} trend={trend} />
              ))}
          </div>
        </div>
      )}

      {/* Reflection Log */}
      {stats && stats.reflections.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-foreground">Reflection Log</h2>
            </div>
            <span className="text-xs text-muted-foreground">{stats.reflections.length} entries</span>
          </div>
          
          <div className="space-y-3">
            {(showAllReflections ? stats.reflections : stats.reflections.slice(0, 3)).map((reflection) => (
              <ReflectionCard key={reflection.id} reflection={reflection} />
            ))}
          </div>
          
          {stats.reflections.length > 3 && (
            <button
              onClick={() => setShowAllReflections(!showAllReflections)}
              className="w-full mt-3 py-2 text-sm text-accent hover:text-accent/80 flex items-center justify-center gap-1"
            >
              {showAllReflections ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  הצג פחות
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  הצג עוד ({stats.reflections.length - 3})
                </>
              )}
            </button>
          )}
        </div>
      )}

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

function SubjectTrendRow({ trend }: { trend: SubjectTrend }) {
  const isStruggling = trend.completionRate < 50;
  const isGood = trend.completionRate >= 70;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-foreground">{trend.subject}</span>
          <span className={cn(
            "text-xs font-bold",
            isStruggling ? "text-rose-400" : isGood ? "text-buff" : "text-amber-400"
          )}>
            {Math.round(trend.completionRate)}%
          </span>
        </div>
        <Progress 
          value={trend.completionRate} 
          className={cn(
            "h-2",
            isStruggling && "[&>div]:bg-rose-400",
            isGood && "[&>div]:bg-buff"
          )}
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {trend.completedLessons}/{trend.totalLessons} שיעורים
          </span>
          {trend.avgDifficulty && (
            <span className="text-xs text-muted-foreground">
              קושי: {trend.avgDifficulty.toFixed(1)}/5
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ReflectionCard({ reflection }: { reflection: LessonReflection }) {
  const date = new Date(reflection.date);
  const formattedDate = date.toLocaleDateString('he-IL', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });

  return (
    <div className="p-3 rounded-xl bg-secondary/30 border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-accent">{reflection.subject || 'כללי'}</span>
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>
      {reflection.reflection && (
        <p className="text-sm text-foreground">{reflection.reflection}</p>
      )}
      {reflection.difficulty_rating && (
        <div className="flex items-center gap-1 mt-2">
          <span className="text-xs text-muted-foreground">קושי:</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i} 
                className={cn(
                  "w-2 h-2 rounded-full",
                  i <= reflection.difficulty_rating! ? "bg-accent" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
