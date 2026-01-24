import { useState } from 'react';
import { User, Users, Zap, ChevronRight, Eye, Settings as SettingsIcon, Sparkles, Loader2, Check } from 'lucide-react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useChildProgress } from '@/hooks/useChildProgress';
import { useCleanDayBonus } from '@/hooks/useCleanDayBonus';
import { FamilyCodeDisplay } from './FamilyCodeDisplay';
import { useAuth } from '@/contexts/AuthContext';

interface ParentFamilyOverviewProps {
  onSelectChild: (childId: string) => void;
  onViewAsChild: (childId: string) => void;
}

export function ParentFamilyOverview({ onSelectChild, onViewAsChild }: ParentFamilyOverviewProps) {
  const { familyShortCode } = useAuth();
  const { children, loading: membersLoading } = useFamilyMembers();
  const { childrenProgress, loading: progressLoading, refetch } = useChildProgress();
  const { awardCleanDayBonus, awarding, wasBonusAwardedToday } = useCleanDayBonus();

  const loading = membersLoading || progressLoading;

  const handleAwardBonus = async (childId: string, childName: string) => {
    const success = await awardCleanDayBonus(childId, childName);
    if (success) {
      refetch(); // Refresh progress data to show updated balance
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground font-display">
          סקירה משפחתית
        </h1>
        <p className="text-sm text-muted-foreground">
          מעקב התקדמות בזמן אמת
        </p>
      </div>

      {/* Family Code */}
      {familyShortCode && (
        <div className="rounded-2xl bg-card border border-primary/20 p-4">
          <FamilyCodeDisplay shortCode={familyShortCode} />
        </div>
      )}

      {/* Children Cards */}
      {children.length === 0 ? (
        <div className="p-8 rounded-2xl bg-card border border-border text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">עדיין לא הצטרפו ילדים</p>
          <p className="text-sm text-muted-foreground mt-2">
            שתפו את קוד המשפחה כדי להזמין אותם
          </p>
        </div>
      ) : (
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

              return (
                <div
                  key={child.id}
                  className="rounded-2xl bg-card border border-border overflow-hidden"
                >
                  {/* Child Header */}
                  <div className="p-4 space-y-3">
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
                      {progress && (
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary">{progress.todayEarned}</p>
                          <p className="text-xs text-muted-foreground">מתוך {progress.dailyGoal}</p>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {progress && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">התקדמות יומית</span>
                          <span className="font-medium text-foreground">{Math.round(progressPercent)}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-3" />
                      </div>
                    )}

                    {/* Live Status */}
                    {progress && (
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                          <span className="text-muted-foreground">
                            משימות: {progress.tasksCompleted}/{progress.tasksTotal}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary/60" />
                          <span className="text-muted-foreground">
                            שיעורים: {progress.lessonsCompleted}/{progress.lessonsTotal}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Clean Day Bonus Button */}
                    <Button
                      onClick={() => handleAwardBonus(child.id, child.displayName)}
                      disabled={bonusAwarded || isAwarding}
                      variant={bonusAwarded ? "outline" : "default"}
                      className={cn(
                        "w-full touch-target transition-all",
                        bonusAwarded
                          ? "bg-accent/20 text-accent border-accent/30"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      )}
                    >
                      {isAwarding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          מעניק בונוס...
                        </>
                      ) : bonusAwarded ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          בונוס יום מוצלח ניתן ✓
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          🌟 יום מוצלח במיוחד! (+20)
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex border-t border-border">
                    <button
                      onClick={() => onViewAsChild(child.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-accent hover:bg-accent/10 transition-colors touch-target"
                    >
                      <Eye className="w-4 h-4" />
                      צפה כילד
                    </button>
                    <div className="w-px bg-border" />
                    <button
                      onClick={() => onSelectChild(child.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors touch-target"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      הגדרות
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
