import { useState, useEffect, useCallback } from 'react';
import { Moon, CheckCircle2, Coins, Flame, Lightbulb, ChevronRight, Loader2, Clock, RefreshCw } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DailySummaryData {
  childName: string;
  date: string;
  tasksCompleted: number;
  tasksTotal: number;
  creditsEarned: number;
  successScore: number;
  dailyStreak: number;
  evolutionStage: string;
  coachingTip: string;
  suggestedTask: {
    title: string;
    originalTime: string;
    suggestedTime: string;
    taskId: string;
  } | null;
}

interface DailySummaryCardProps {
  childId: string;
  childName: string;
  onNavigateToSettings?: (childId: string) => void;
}

export function DailySummaryCard({ childId, childName, onNavigateToSettings }: DailySummaryCardProps) {
  const { t, language } = useLanguage();
  const { session } = useAuth();
  const [summary, setSummary] = useState<DailySummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!session?.access_token || !childId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('daily-summary', {
        body: { child_id: childId, language },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setSummary(data);
    } catch (err: any) {
      console.error('Daily summary error:', err);
      setError(err.message || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, [childId, session?.access_token, language]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading && !summary) {
    return (
      <Card className="p-4 border-primary/20 bg-card">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{t('dailySummary.loading')}</span>
        </div>
      </Card>
    );
  }

  if (error && !summary) {
    return (
      <Card className="p-4 border-border bg-card">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('dailySummary.errorLoading')}</span>
          <Button variant="ghost" size="sm" onClick={fetchSummary}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  if (!summary) return null;

  const { tasksCompleted, tasksTotal, creditsEarned, successScore, dailyStreak, coachingTip, suggestedTask } = summary;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-start"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Moon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              {t('dailySummary.header').replace('{name}', childName)}
            </h3>
            <p className="text-xs text-muted-foreground">
              {successScore}% {t('dailySummary.successScore')}
            </p>
          </div>
        </div>
        <ChevronRight className={cn(
          "w-5 h-5 text-muted-foreground transition-transform",
          expanded && "rotate-90"
        )} />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-background/60 border border-border/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="w-4 h-4 text-accent" />
              </div>
              <p className="text-lg font-bold text-foreground">{tasksCompleted}/{tasksTotal}</p>
              <p className="text-[10px] text-muted-foreground">{t('dailySummary.tasksCompleted')}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-background/60 border border-border/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins className="w-4 h-4 text-primary" />
              </div>
              <p className="text-lg font-bold text-primary">+{creditsEarned}</p>
              <p className="text-[10px] text-muted-foreground">{t('dailySummary.creditsEarned')}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-background/60 border border-border/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-lg font-bold text-foreground">{dailyStreak} 🔥</p>
              <p className="text-[10px] text-muted-foreground">{t('dailySummary.streakStatus')}</p>
            </div>
          </div>

          {/* Success Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('dailySummary.dailyScore')}</span>
              <span className="font-semibold text-primary">{successScore}%</span>
            </div>
            <Progress value={successScore} className="h-2" />
          </div>

          {/* Coaching Tip */}
          {coachingTip && (
            <div className="rounded-xl bg-accent/10 border border-accent/20 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs font-semibold text-accent">{t('dailySummary.tipFromBuff')}</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {coachingTip}
              </p>
            </div>
          )}

          {/* Action Button */}
          {suggestedTask && onNavigateToSettings && (
            <Button
              onClick={() => onNavigateToSettings(childId)}
              variant="outline"
              className="w-full h-11 text-sm font-medium border-primary/30 text-primary hover:bg-primary/10"
            >
              <Clock className="w-4 h-4 me-2" />
              {t('dailySummary.prepTomorrow')}
            </Button>
          )}

          {/* Refresh */}
          {loading && (
            <div className="flex justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
