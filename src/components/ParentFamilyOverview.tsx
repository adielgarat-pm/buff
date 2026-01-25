import { useState } from 'react';
import { User, Users, Zap, ChevronRight, Eye, Settings as SettingsIcon, Sparkles, Loader2, Check, Pencil, X } from 'lucide-react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useChildProgress } from '@/hooks/useChildProgress';
import { useCleanDayBonus } from '@/hooks/useCleanDayBonus';
import { FamilyCodeDisplay } from './FamilyCodeDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ParentFamilyOverviewProps {
  onSelectChild: (childId: string) => void;
  onViewAsChild: (childId: string) => void;
}

export function ParentFamilyOverview({ onSelectChild, onViewAsChild }: ParentFamilyOverviewProps) {
  const { familyShortCode, familyId } = useAuth();
  const { children, loading: membersLoading } = useFamilyMembers();
  const { childrenProgress, loading: progressLoading, refetch } = useChildProgress();
  const { awardCleanDayBonus, awarding, wasBonusAwardedToday } = useCleanDayBonus();
  
  const [editingBalanceFor, setEditingBalanceFor] = useState<string | null>(null);
  const [editBalanceValue, setEditBalanceValue] = useState<number>(0);
  const [savingBalance, setSavingBalance] = useState(false);

  const loading = membersLoading || progressLoading;

  const handleStartEditBalance = (childId: string, currentBalance: number) => {
    setEditingBalanceFor(childId);
    setEditBalanceValue(currentBalance);
  };

  const handleSaveBalance = async (childId: string) => {
    if (editBalanceValue < 0) {
      toast.error('יתרה לא יכולה להיות שלילית');
      return;
    }

    setSavingBalance(true);
    try {
      // Check if child has a vault
      const { data: existingVault } = await supabase
        .from('credit_vault')
        .select('id')
        .eq('family_id', familyId)
        .eq('child_id', childId)
        .maybeSingle();

      if (existingVault) {
        const { error } = await supabase
          .from('credit_vault')
          .update({ total_balance: editBalanceValue })
          .eq('id', existingVault.id);

        if (error) throw error;
      } else {
        // Create vault for child
        const { error } = await supabase
          .from('credit_vault')
          .insert({ 
            family_id: familyId!, 
            child_id: childId, 
            total_balance: editBalanceValue 
          });

        if (error) throw error;
      }

      toast.success('היתרה עודכנה בהצלחה!');
      setEditingBalanceFor(null);
      refetch();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('שגיאה בעדכון היתרה');
    } finally {
      setSavingBalance(false);
    }
  };

  const handleCancelEditBalance = () => {
    setEditingBalanceFor(null);
  };

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
                          <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-foreground">{child.displayName}</h3>
                            {progress && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                                יעד: {progress.dailyGoal}
                              </span>
                            )}
                          </div>
                          {progress && editingBalanceFor !== child.id && (
                            <button
                              onClick={() => handleStartEditBalance(child.id, progress.totalBalance)}
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            >
                              💰 {progress.totalBalance.toLocaleString()} קרדיטים נצברו
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                          {editingBalanceFor === child.id && (
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-muted-foreground">💰</span>
                              <Input
                                type="number"
                                value={editBalanceValue}
                                onChange={(e) => setEditBalanceValue(Number(e.target.value))}
                                className="w-24 h-7 text-xs px-2"
                                min={0}
                                dir="ltr"
                              />
                              <Button
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => handleSaveBalance(child.id)}
                                disabled={savingBalance}
                              >
                                {savingBalance ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2"
                                onClick={handleCancelEditBalance}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
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
                      variant="outline"
                      className={cn(
                        "w-full touch-target transition-all",
                        bonusAwarded
                          ? "border-accent/50 text-muted-foreground bg-transparent"
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
