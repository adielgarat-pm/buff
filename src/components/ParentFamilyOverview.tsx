import { useState, useCallback, useEffect } from 'react';
import { ParentDailyWinCard } from './ParentDailyWinCard';
import { ReviewNudgeCard } from './ReviewNudgeCard';
import { DailySummaryCard } from './DailySummaryCard';
import { Users, Zap, ChevronRight, Eye, Sparkles, Loader2, Check, Clock, Info, ShieldAlert, Gift, Smartphone } from 'lucide-react';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { WelcomeHomeScreen, FirstTaskNudgeCard, SetupProgressHeader, calculateSetupProgress } from './dashboard';
import { useSubscription } from '@/hooks/useSubscription';
import { NotificationBell } from './NotificationBell';

import { ProGate } from './ProGate';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import buffLogoNoBg from '@/assets/buff-logo-no-bg.png';

interface ParentFamilyOverviewProps {
  onSelectChild: (childId: string) => void;
  onViewAsChild: (childId: string) => void;
  onStartOnboarding: () => void;
  onAddTask?: (childId: string) => void;
}

function getCurrentPhase(t: (key: string) => string): { name: string; emoji: string } {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 6 && hour < 9) return { name: t('overview.morning'), emoji: '🌅' };
  if (hour >= 9 && hour < 16) return { name: t('overview.school'), emoji: '📚' };
  if (hour >= 16 && hour < 20) return { name: t('overview.afternoon'), emoji: '🌤️' };
  return { name: t('overview.evening'), emoji: '🌙' };
}

export function ParentFamilyOverview({ onSelectChild, onViewAsChild, onStartOnboarding, onAddTask }: ParentFamilyOverviewProps) {
  const { familyShortCode, profile } = useAuth();
  const { t } = useLanguage();
  const { children, loading: membersLoading, refetch: refetchMembers } = useFamilyMembers();
  const { childrenProgress, loading: progressLoading, refetch } = useChildProgress();
  const { awardCleanDayBonus, awarding, wasBonusAwardedToday } = useCleanDayBonus();
  const { isProUser } = useSubscription();
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const [grantingCardFor, setGrantingCardFor] = useState<string | null>(null);
  const [childrenWithoutPWA, setChildrenWithoutPWA] = useState<Set<string>>(new Set());

  // Check PWA install status for children with separate devices
  useEffect(() => {
    async function checkPWAStatus() {
      // Get children with their own device (user_id IS NOT NULL)
      const separateDeviceChildren = children.filter(c => c.userId);
      if (separateDeviceChildren.length === 0) return;

      const userIds = separateDeviceChildren.map(c => c.userId);
      
      const { data: pwaEvents } = await supabase
        .from('pwa_events')
        .select('user_id, event_type')
        .in('user_id', userIds)
        .in('event_type', ['install', 'dismiss_permanent']);

      const installedUserIds = new Set(
        (pwaEvents || []).filter(e => e.event_type === 'install').map(e => e.user_id)
      );

      const notInstalled = new Set<string>();
      for (const child of separateDeviceChildren) {
        if (!installedUserIds.has(child.userId)) {
          notInstalled.add(child.id);
        }
      }
      setChildrenWithoutPWA(notInstalled);
    }

    if (!membersLoading && children.length > 0) {
      checkPWAStatus();
    }
  }, [children, membersLoading]);

  // Listen for rest-card-depleted events from child view
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const childId = e.detail?.childId;
      const child = children.find(c => c.id === childId);
      const name = child?.displayName || '';
      toast.info(t('pet.lastRestCardUsedNotif').replace('{name}', name), { duration: 8000 });
    };
    window.addEventListener('rest-card-depleted', handler as EventListener);
    return () => window.removeEventListener('rest-card-depleted', handler as EventListener);
  }, [children, t]);

  // Grant a rest card to a child
  const handleGrantRestCard = async (childId: string, childName: string) => {
    setGrantingCardFor(childId);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('pet_state')
        .eq('id', childId)
        .single();
      
      const petState = (data?.pet_state as Record<string, unknown>) || {};
      const currentCards = (petState.rest_cards_balance as number) ?? 0;
      
      await supabase
        .from('profiles')
        .update({ pet_state: { ...petState, rest_cards_balance: currentCards + 1 } })
        .eq('id', childId);
      
      toast.success(t('pet.restCardGranted').replace('{name}', childName));
      refetch();
    } catch {
      toast.error('Error granting rest card');
    } finally {
      setGrantingCardFor(null);
    }
  };

  const handleMidnightReset = useCallback(() => {
    refetch();
  }, [refetch]);

  const { showNewDayMessage, dismissNewDayMessage } = useMidnightReset({
    onReset: handleMidnightReset,
  });

  const loading = membersLoading || progressLoading;
  const currentPhase = getCurrentPhase(t);

  const hasChildren = children.length > 0;
  const hasTasks = childrenProgress.some(p => p.tasksTotal > 0);
  const hasRewards = true;
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
      refetch();
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
    <Dialog open={showPhilosophy} onOpenChange={setShowPhilosophy}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <BuffPhilosophyPage isModal onClose={() => setShowPhilosophy(false)} />
      </DialogContent>
    </Dialog>

    {!hasChildren ? (
      <WelcomeHomeScreen onStartOnboarding={onStartOnboarding} />
    ) : (
    <div className="space-y-6 pb-8">
      <NewDayBanner show={showNewDayMessage} onDismiss={dismissNewDayMessage} />
      
      {setupProgress.percent < 100 && (
        <SetupProgressHeader
          progressPercent={setupProgress.percent}
          missingSteps={setupProgress.missing.map(key => t(key))}
          onContinueSetup={onStartOnboarding}
        />
      )}

      {/* Review nudge - shows after 7 days */}
      <ReviewNudgeCard />
      
       <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={buffLogoNoBg} 
            alt="BUFF Logo" 
            className="h-12 w-12 object-contain"
          />
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold text-foreground font-display">
              {t('overview.familyOverview')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('overview.realTimeTracking')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPhilosophy(true)}
            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {t('overview.now')}: {currentPhase.emoji} {currentPhase.name}
        </span>
      </div>

      {familyShortCode && (
        <div className="rounded-2xl bg-card border border-primary/20 p-4">
          <FamilyCodeDisplay shortCode={familyShortCode} onChildAdded={refetchMembers} />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">{t('overview.myChildren')}</h2>
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
                <div className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-3xl">
                         {child.avatar || '🚀'}
                       </div>
                       <div>
                         <h3 className="font-bold text-lg text-foreground">{child.displayName}</h3>
                         {progress && (
                           <p className="text-sm text-muted-foreground">
                             💰 {progress.totalBalance.toLocaleString()} {t('overview.creditsAccumulated')}
                           </p>
                         )}
                       </div>
                     </div>
                     {progress && !hasNoTasks && (
                       <div className="text-right">
                         <p className="text-3xl font-bold text-primary">{progress.todayEarned}</p>
                         <p className="text-xs text-muted-foreground">{t('overview.outOf')} {progress.dailyGoal}</p>
                       </div>
                     )}
                   </div>

                   {/* Rest Card Alert - Orange when 0 */}
                   {progress && progress.restCardsBalance === 0 && (
                     <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-orange-500/15 border border-orange-500/30">
                       <div className="flex items-center gap-2">
                         <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0" />
                         <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                           🎫 {t('pet.noRestCards')}
                         </span>
                       </div>
                       <Button
                         size="sm"
                         variant="outline"
                         className="h-7 text-xs border-orange-500/40 text-orange-600 hover:bg-orange-500/10"
                         onClick={() => handleGrantRestCard(child.id, child.displayName)}
                         disabled={grantingCardFor === child.id}
                       >
                         {grantingCardFor === child.id ? (
                           <Loader2 className="w-3 h-3 animate-spin" />
                         ) : (
                           <>
                             <Gift className="w-3 h-3" />
                             {t('pet.grantRestCard')}
                           </>
                         )}
                       </Button>
                     </div>
                   )}

                  {hasNoTasks ? (
                    <FirstTaskNudgeCard 
                      childName={child.displayName}
                      onAddTask={() => onAddTask?.(child.id)}
                    />
                  ) : (
                    <>
                      {progress && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{t('overview.todayProgress')}</span>
                            <span className="font-bold text-primary">{Math.round(progressPercent)}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-3" />
                          
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                              <span className="text-muted-foreground">
                                {t('overview.tasks')}: {progress.tasksCompleted}/{progress.tasksTotal}
                              </span>
                            </div>
                            {progress.schoolQuestEnabled && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary/60" />
                                <span className="text-muted-foreground">
                                  {t('overview.lessons')}: {progress.lessonsCompleted}/{progress.lessonsTotal}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Daily Win Card - shows when child completed all tasks */}
                      {progress && progress.tasksCompleted >= progress.tasksTotal && progress.tasksTotal > 0 && (
                        <ParentDailyWinCard
                          childName={child.displayName}
                          creditsEarned={progress.todayEarned}
                          tasksCompleted={progress.tasksCompleted}
                          totalTasks={progress.tasksTotal}
                        />
                      )}

                      {/* Daily Summary Card - Pro only, shows after 21:00 */}
                      {isProUser && new Date().getHours() >= 21 && progress && progress.tasksTotal > 0 && (
                        <ProGate>
                          <DailySummaryCard
                            childId={child.id}
                            childName={child.displayName}
                            onNavigateToSettings={onSelectChild}
                          />
                        </ProGate>
                      )}

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
                            {t('overview.awardingBonus')}
                          </>
                        ) : bonusAwarded ? (
                          <>
                            <Check className="w-5 h-5 mr-2" />
                            {t('overview.bonusAwarded')}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            {t('overview.greatDay')}
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>

                <div className="border-t border-border">
                  <button
                    onClick={() => onViewAsChild(child.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-accent hover:bg-accent/10 transition-colors touch-target"
                  >
                    <Eye className="w-4 h-4" />
                    {t('overview.viewAsChild')}
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
