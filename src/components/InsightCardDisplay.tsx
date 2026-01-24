import { InsightCard } from '@/hooks/useParentInsights';
import { cn } from '@/lib/utils';
import { Lightbulb, TrendingUp, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { STRATEGY_CATEGORIES } from '@/data/cogFunStrategies';
import { useState } from 'react';

interface InsightCardDisplayProps {
  insight: InsightCard;
}

export function InsightCardDisplay({ insight }: InsightCardDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  const severityConfig = {
    info: {
      bgClass: 'bg-gradient-to-br from-emerald-500/10 to-green-500/10',
      borderClass: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-500',
      Icon: TrendingUp,
    },
    suggestion: {
      bgClass: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10',
      borderClass: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-500',
      Icon: Lightbulb,
    },
    attention: {
      bgClass: 'bg-gradient-to-br from-rose-500/10 to-pink-500/10',
      borderClass: 'border-rose-500/30',
      iconBg: 'bg-rose-500/20',
      iconColor: 'text-rose-400',
      Icon: AlertCircle,
    },
  };

  const config = severityConfig[insight.severity];

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
              {insight.titleHe}
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
          
          <p className="text-sm text-muted-foreground mt-1" dir="rtl">
            {insight.descriptionHe}
          </p>

          {/* Expanded suggestion */}
          <div className={cn(
            'overflow-hidden transition-all duration-300',
            expanded ? 'max-h-48 opacity-100 mt-3' : 'max-h-0 opacity-0'
          )}>
            <div className="p-3 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">הצעה לפעולה</span>
                {insight.strategyType && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {STRATEGY_CATEGORIES[insight.strategyType].labelHe}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed" dir="rtl">
                {insight.suggestionHe}
              </p>
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
