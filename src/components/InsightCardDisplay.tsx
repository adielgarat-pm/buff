import { InsightCard } from '@/hooks/useParentInsights';
import { cn } from '@/lib/utils';
import { Zap, TrendingUp, AlertCircle, Sparkles, ChevronRight, Plus } from 'lucide-react';
import { STRATEGY_CATEGORIES } from '@/data/cogFunStrategies';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface InsightCardDisplayProps {
  insight: InsightCard;
  childId?: string;
}

// Action task suggestions based on insight type
const INSIGHT_ACTIONS: Record<string, { titleHe: string; titleEn: string; time: string; category: string; credits: number }> = {
  'insight-evening': { titleHe: 'רגיעה של 5 דקות לפני שינה', titleEn: '5-min Wind-down before bed', time: '20:15', category: 'self-care', credits: 10 },
  'insight-afternoon': { titleHe: 'הפסקת טעינה אחרי בית ספר', titleEn: 'Recharge break after school', time: '15:30', category: 'self-care', credits: 10 },
  'insight-morning': { titleHe: 'הכנת בגדים בערב', titleEn: 'Prep clothes tonight', time: '20:00', category: 'organization', credits: 10 },
  'insight-hygiene': { titleHe: 'תזכורת מקלחת ערב', titleEn: 'Evening shower reminder', time: '20:30', category: 'self-care', credits: 10 },
  'insight-homework': { titleHe: '15 דקות למידה ממוקדת', titleEn: '15-min focused study', time: '17:00', category: 'learning', credits: 15 },
  'insight-medication': { titleHe: 'תזכורת תרופות עם צחצוח', titleEn: 'Meds with toothbrushing', time: '07:30', category: 'self-care', credits: 10 },
};

export function InsightCardDisplay({ insight, childId }: InsightCardDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const { language, t } = useLanguage();
  const { familyId } = useAuth();

  const severityConfig = {
    info: {
      bgClass: 'bg-gradient-to-br from-indigo-500/10 to-violet-500/10',
      borderClass: 'border-indigo-500/30',
      iconBg: 'bg-indigo-500/20',
      iconColor: 'text-indigo-400',
      Icon: TrendingUp,
    },
    suggestion: {
      bgClass: 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10',
      borderClass: 'border-yellow-500/30',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-500',
      Icon: Zap,
    },
    attention: {
      bgClass: 'bg-gradient-to-br from-rose-500/10 to-pink-500/10',
      borderClass: 'border-rose-500/30',
      iconBg: 'bg-rose-500/20',
      iconColor: 'text-rose-400',
      Icon: AlertCircle,
    },
  };

  const config = severityConfig[insight.severity] || severityConfig.info;
  const title = language === 'he' ? insight.titleHe : insight.title;
  const description = language === 'he' ? insight.descriptionHe : insight.description;
  const suggestion = language === 'he' ? insight.suggestionHe : insight.suggestion;
  const strategyLabel = insight.strategyType 
    ? (language === 'he' ? STRATEGY_CATEGORIES[insight.strategyType].labelHe : STRATEGY_CATEGORIES[insight.strategyType].label)
    : null;

  const actionConfig = INSIGHT_ACTIONS[insight.id];

  const handleAddTask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!familyId || !childId || !actionConfig || addingTask) return;

    setAddingTask(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDay = tomorrow.getDay();

      const { error } = await supabase.from('tasks').insert({
        family_id: familyId,
        assigned_to: childId,
        title: language === 'he' ? actionConfig.titleHe : actionConfig.titleEn,
        time: actionConfig.time,
        category: actionConfig.category,
        credits: actionConfig.credits,
        schedule_days: [tomorrowDay],
      });

      if (error) throw error;
      toast.success(language === 'he' ? 'משימה נוספה למחר! ✨' : 'Task added for tomorrow! ✨');
    } catch (err) {
      console.error('Error adding task:', err);
      toast.error(language === 'he' ? 'שגיאה בהוספת משימה' : 'Error adding task');
    } finally {
      setAddingTask(false);
    }
  };

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all cursor-pointer',
        config.bgClass,
        config.borderClass,
        expanded && 'ring-2 ring-primary/20'
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg shrink-0', config.iconBg)}>
          <config.Icon className={cn('w-5 h-5', config.iconColor)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{insight.icon}</span>
            <h4 className="font-semibold text-foreground text-sm">
              {title}
            </h4>
            {insight.completionRate !== undefined && insight.severity !== 'info' && (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                insight.completionRate < 40 
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-amber-500/20 text-amber-500'
              )}>
                {insight.completionRate}%
              </span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>

          {/* Expanded suggestion */}
          <div className={cn(
            'overflow-hidden transition-all duration-300',
            expanded ? 'max-h-64 opacity-100 mt-3' : 'max-h-0 opacity-0'
          )}>
            <div className="p-3 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">{t('ignition.actionSuggestion')}</span>
                {strategyLabel && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {strategyLabel}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {suggestion}
              </p>

              {/* Action Button */}
              {actionConfig && childId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={handleAddTask}
                  disabled={addingTask}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {addingTask 
                    ? (language === 'he' ? 'מוסיף...' : 'Adding...')
                    : (language === 'he' ? actionConfig.titleHe : actionConfig.titleEn)
                  }
                </Button>
              )}
            </div>
          </div>
        </div>

        <ChevronRight className={cn(
          'w-4 h-4 text-muted-foreground transition-transform shrink-0',
          expanded && 'rotate-90'
        )} />
      </div>
    </div>
  );
}