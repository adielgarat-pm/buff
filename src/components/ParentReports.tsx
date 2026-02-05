import { useState, useEffect } from 'react';
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
import { ParentIgnitionInsights } from './ParentIgnitionInsights';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { PHASES } from '@/types/phase';
import buffLogoNoBg from '@/assets/buff-logo-no-bg.png';

export function ParentReports() {
  const { children, loading: membersLoading } = useFamilyMembers();
  const { childrenProgress, loading: progressLoading } = useChildProgress();
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  // Auto-select first child via useEffect (not during render)
  useEffect(() => {
    if (!selectedChildId && children.length > 0 && !membersLoading) {
      setSelectedChildId(children[0].id);
    }
  }, [selectedChildId, children, membersLoading]);

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
      <div className="space-y-3 pb-6">
        <div className="flex items-center gap-3">
          <img 
            src={buffLogoNoBg} 
            alt="BUFF Logo" 
            className="h-10 w-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground font-display">Weekly Buff Stats</h1>
            <p className="text-xs text-muted-foreground">ניתוח ותובנות</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">אין עדיין ילדים לניתוח</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {/* Header + Child Selector - Combined */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img 
            src={buffLogoNoBg} 
            alt="BUFF Logo" 
            className="h-10 w-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground font-display">Weekly Buff Stats</h1>
            <p className="text-xs text-muted-foreground">ניתוח ותובנות שבועיות</p>
          </div>
        </div>
        <Select value={selectedChildId} onValueChange={setSelectedChildId}>
          <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs bg-secondary border-border">
            <SelectValue placeholder="בחר ילד" />
          </SelectTrigger>
          <SelectContent>
            {children.map((child) => (
              <SelectItem key={child.id} value={child.id}>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
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
    <div className="space-y-2.5">
      {/* Weekly Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          {/* Total Buff Points */}
          <div className="rounded-lg bg-gradient-to-br from-buff/20 to-buff/5 border border-buff/30 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-buff" />
              <span className="text-xs text-buff font-medium">Buff Points</span>
            </div>
            <p className="text-2xl font-bold text-buff">{stats.totalBuffPoints}</p>
          </div>

          {/* Streak */}
          <div className="rounded-lg bg-gradient-to-br from-streak/20 to-streak/5 border border-streak/30 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="w-4 h-4 text-streak" />
              <span className="text-xs text-streak font-medium">Streak</span>
            </div>
            <p className="text-2xl font-bold text-streak">{stats.streakDays} <span className="text-xs font-normal">days</span></p>
          </div>

          {/* Quests Conquered */}
          <div className="rounded-lg bg-card border border-border p-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Quests</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {stats.questsConquered}<span className="text-xs text-muted-foreground">/{stats.totalQuests}</span>
              </span>
            </div>
            <Progress value={(stats.questsConquered / Math.max(stats.totalQuests, 1)) * 100} className="h-1.5" />
          </div>

          {/* Lessons Conquered */}
          <div className="rounded-lg bg-card border border-border p-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs text-muted-foreground">Lessons</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {stats.lessonsConquered}<span className="text-xs text-muted-foreground">/{stats.totalLessons}</span>
              </span>
            </div>
            <Progress value={(stats.lessonsConquered / Math.max(stats.totalLessons, 1)) * 100} className="h-1.5" />
          </div>
        </div>
      )}

      {/* Ignition Insights Section */}
      <ParentIgnitionInsights 
        stats={stats} 
        phaseInsights={phaseInsights} 
        childName={childName} 
      />

      {/* Phase Performance */}
      <div className="rounded-lg bg-card border border-border p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">ביצועים לפי שלב</h2>
        </div>
        <PhaseCompletionChart phaseInsights={phaseInsights} />
        
        {/* Quick highlights */}
        {(topPhaseInfo || strugglePhaseInfo) && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {topPhaseInfo && (
              <div className="flex items-center gap-1.5 p-1.5 rounded bg-buff/10 border border-buff/20">
                <Trophy className="w-3 h-3 text-buff" />
                <span className="text-xs text-buff">חזק: {topPhaseInfo.label}</span>
              </div>
            )}
            {strugglePhaseInfo && (
              <div className="flex items-center gap-1.5 p-1.5 rounded bg-amber-500/10 border border-amber-500/20">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-400">בהתנעה: {strugglePhaseInfo.label}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trend Detector - Subject Analysis */}
      {stats && stats.subjectTrends.length > 0 && (
        <div className="rounded-lg bg-card border border-border p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Trend Detector</h2>
            <span className="text-xs text-muted-foreground mr-auto">לפי מקצוע</span>
          </div>
          
          <div className="space-y-2">
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
        <div className="rounded-lg bg-card border border-border p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Reflection Log</h2>
            </div>
            <span className="text-xs text-muted-foreground">{stats.reflections.length}</span>
          </div>
          
          <div className="space-y-2">
            {(showAllReflections ? stats.reflections : stats.reflections.slice(0, 3)).map((reflection) => (
              <ReflectionCard key={reflection.id} reflection={reflection} />
            ))}
          </div>
          
          {stats.reflections.length > 3 && (
            <button
              onClick={() => setShowAllReflections(!showAllReflections)}
              className="w-full mt-2 py-1.5 text-xs text-accent hover:text-accent/80 flex items-center justify-center gap-1"
            >
              {showAllReflections ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  הצג פחות
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  עוד ({stats.reflections.length - 3})
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Insights */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">תובנות ל-{childName}</h2>
        </div>
        
        {insights.length === 0 ? (
          <div className="p-3 rounded-lg bg-card border border-border text-center">
            <p className="text-xs text-muted-foreground">
              אין עדיין תובנות. בדקו שוב אחרי מספר ימי פעילות.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
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
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-medium text-foreground">{trend.subject}</span>
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
            "h-1.5",
            isStruggling && "[&>div]:bg-rose-400",
            isGood && "[&>div]:bg-buff"
          )}
        />
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-muted-foreground">
            {trend.completedLessons}/{trend.totalLessons}
          </span>
          {trend.avgDifficulty && (
            <span className="text-xs text-muted-foreground">
              {trend.avgDifficulty.toFixed(1)}/5
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
    day: 'numeric'
  });

  return (
    <div className="p-2 rounded-lg bg-secondary/30 border border-border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-accent">{reflection.subject || 'כללי'}</span>
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>
      {reflection.reflection && (
        <p className="text-xs text-foreground">{reflection.reflection}</p>
      )}
      {reflection.difficulty_rating && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-muted-foreground">קושי:</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i} 
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
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
