import { useState, useCallback } from 'react';
import { User, Users, Zap, ChevronRight, Eye, Sparkles, Loader2, Check, Clock, Info } from 'lucide-react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { cn } from '@/lib/utils';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useChildProgress } from '@/hooks/useChildProgress';
import { useCleanDayBonus } from '@/hooks/useCleanDayBonus';
import { useMidnightReset } from '@/hooks/useMidnightReset';
import { FamilyCodeDisplay } from './FamilyCodeDisplay';
import { NewDayBanner } from './NewDayBanner';
import { BuffPhilosophyPage } from './BuffPhilosophyPage';
import { useAuth } from '@/contexts/AuthContext';
import { WelcomeHomeScreen, FirstTaskNudgeCard, SetupProgressHeader, calculateSetupProgress } from './dashboard';
import { BuffBoostCard } from './BuffBoostCard';

interface ParentFamilyOverviewProps {
  onSelectChild: (childId: string) => void;
  onViewAsChild: (childId: string) => void;
  onStartOnboarding: () => void;
  onAddTask?: (childId: string) => void;
}

// Helper to determine current phase
function getCurrentPhase(): { name: string; emoji: string } {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 6 && hour < 9) return { name: 'בוקר', emoji: '🌅' };
  if (hour >= 9 && hour < 16) return { name: 'בית ספר', emoji: '📚' };
  if (hour >= 16 && hour < 20) return { name: 'אחר הצהריים', emoji: '🌤️' };
  return { name: 'ערב', emoji: '🌙' };
}

export function ParentFamilyOverview({ onSelectChild, onViewAsChild, onStartOnboarding, onAddTask }: ParentFamilyOverviewProps) {
  const { familyShortCode } = useAuth();
  const { children, loading: membersLoading, refetch: refetchMembers } = useFamilyMembers();
  const { childrenProgress, loading: progressLoading, refetch } = useChildProgress();
  const { awardCleanDayBonus, awarding, wasBonusAwardedToday } = useCleanDayBonus();
  const [showPhilosophy, setShowPhilosophy] = useState(false);

  // Midnight reset for parent view - refresh progress data
  const handleMidnightReset = useCallback(() => {
    refetch();
  }, [refetch]);

  const { showNewDayMessage, dismissNewDayMessage } = useMidnightReset({
    onReset: handleMidnightReset,
  });

  const loading = membersLoading || progressLoading;
  const currentPhase = getCurrentPhase();

  // Calculate setup progress
  const hasChildren = children.length > 0;
  const hasTasks = childrenProgress.some(p => p.tasksTotal > 0);
  const hasRewards = true; // Default rewards are created with children
  const hasTimetable = childrenProgress.some(p => p.schoolQuestEnabled && p.lessonsTotal > 0);
  
  const setupProgress = calculateSetupProgress({
    hasChildren,
    hasTasks,
    hasRewards,
    hasTimetable,
  });

  const handleAwardBonus = async (childId: string, childName: string) => {
    const success = await awardCleanDayBonus(childId, childName);
    if (success) {
      refetch(); // Refresh progress data to show updated balance
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    {/* Philosophy Modal */}
    <Dialog open={showPhilosophy} onOpenChange={setShowPhilosophy}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <BuffPhilosophyPage isModal onClose={() => setShowPhilosophy(false)} />
      </DialogContent>
    </Dialog>

    {/* Condition 1: Zero Children - Show Welcome Home Screen */}
    {!hasChildren ? (
      <WelcomeHomeScreen onStartOnboarding={onStartOnboarding} />
    ) : (
    <div className="space-y-6 pb-8">
      {/* New Day Banner - shows at midnight */}
      <NewDayBanner show={showNewDayMessage} onDismiss={dismissNewDayMessage} />
      
      {/* Setup Progress Header - Show if not 100% complete */}
      {setupProgress.percent < 100 && (
        <SetupProgressHeader
          progressPercent={setupProgress.percent}
          missingSteps={setupProgress.missing}
          onContinueSetup={onStartOnboarding}
        />
      )}

       {/* BuffBoost Community Support Card */}
       <BuffBoostCard />
      
      {/* Header with Info Button */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground font-display">
            סקירה משפחתית
          </h1>
          <p className="text-sm text-muted-foreground">
            מעקב התקדמות בזמן אמת
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowPhilosophy(true)}
          className="text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <Info className="w-5 h-5" />
        </Button>
      </div>

      {/* Current Phase Indicator */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          עכשיו: {currentPhase.emoji} {currentPhase.name}
        </span>
      </div>

      {/* Family Code */}
      {familyShortCode && (
        <div className="rounded-2xl bg-card border border-primary/20 p-4">
          <FamilyCodeDisplay shortCode={familyShortCode} onChildAdded={refetchMembers} />
        </div>
      )}

      {/* Children Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">הילדים שלי</h2>
        </div>

        <div className="grid gap-4">
          {children.map((child) => {
            const progress = childrenProgress.find(p => p.childId === child.id);
            const progressPercent = progress 
              ? Math.min((progress.todayEarned / progress.dailyGoal) * 100, 100)
              : 0;
            const bonusAwarded = wasBonusAwardedToday(child.id);
            const isAwarding = awarding === child.id;
            const hasNoTasks = progress && progress.tasksTotal === 0;

            return (
              <div
                key={child.id}
                className="rounded-2xl bg-card border border-border overflow-hidden"
              >
                {/* Child Header */}
                <div className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{child.displayName}</h3>
                        {progress && (
                          <p className="text-sm text-muted-foreground">
                            💰 {progress.totalBalance.toLocaleString()} קרדיטים נצברו
                          </p>
                        )}
                      </div>
                    </div>
                    {progress && !hasNoTasks && (
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">{progress.todayEarned}</p>
                        <p className="text-xs text-muted-foreground">מתוך {progress.dailyGoal}</p>
                      </div>
                    )}
                  </div>

                  {/* Condition 2: Child Exists but No Tasks - Show Nudge Card */}
                  {hasNoTasks ? (
                    <FirstTaskNudgeCard 
                      childName={child.displayName}
                      onAddTask={() => onAddTask?.(child.id)}
                    />
                  ) : (
                    <>
                      {/* Today's Progress - Main Focus */}
                      {progress && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">התקדמות היום</span>
                            <span className="font-bold text-primary">{Math.round(progressPercent)}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-3" />
                          
                          {/* Live Status */}
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                              <span className="text-muted-foreground">
                                משימות: {progress.tasksCompleted}/{progress.tasksTotal}
                              </span>
                            </div>
                            {progress.schoolQuestEnabled && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary/60" />
                                <span className="text-muted-foreground">
                                  שיעורים: {progress.lessonsCompleted}/{progress.lessonsTotal}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Clean Day Bonus Button - Prominent */}
                      <Button
                        onClick={() => handleAwardBonus(child.id, child.displayName)}
                        disabled={bonusAwarded || isAwarding}
                        className={cn(
                          "w-full h-12 text-base font-semibold transition-all touch-target",
                          bonusAwarded
                            ? "bg-secondary text-muted-foreground border border-border"
                            : "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-glow hover:shadow-lg"
                        )}
                      >
                        {isAwarding ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            מעניק בונוס...
                          </>
                        ) : bonusAwarded ? (
                          <>
                            <Check className="w-5 h-5 mr-2" />
                            בונוס יום מוצלח ניתן ✓
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            🌟 יום מוצלח במיוחד! (+20)
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>

                {/* Action Button - View as Child Only */}
                <div className="border-t border-border">
                  <button
                    onClick={() => onViewAsChild(child.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-accent hover:bg-accent/10 transition-colors touch-target"
                  >
                    <Eye className="w-4 h-4" />
                    צפה כילד
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    )}
    </>
  );
}
