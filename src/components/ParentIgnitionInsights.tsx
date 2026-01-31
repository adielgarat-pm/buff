import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, TrendingUp, Trophy, Clock, Heart, Sparkles,
  Sun, Moon, Coffee, Sunset
} from 'lucide-react';
import { WeeklyBuffStats, DailyStats } from '@/hooks/useWeeklyBuffStats';
import { PhaseInsight } from '@/hooks/useParentInsights';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { PHASES, Phase } from '@/types/phase';

interface ParentIgnitionInsightsProps {
  stats: WeeklyBuffStats | null;
  phaseInsights: PhaseInsight[];
  childName: string;
}

const PHASE_ICONS: Record<Phase, typeof Sun> = {
  morning: Coffee,
  school: Sun,
  afternoon: Sunset,
  evening: Moon,
};

export function ParentIgnitionInsights({ 
  stats, 
  phaseInsights, 
  childName 
}: ParentIgnitionInsightsProps) {
  // Calculate ignition rate (successful days / total days)
  const ignitionStats = useMemo(() => {
    if (!stats) return null;

    const dailyStats = stats.dailyStats;
    const successThreshold = 0.3; // At least 30% of tasks completed = "ignited" day
    
    // Count days where child was active (not "days off")
    const ignitedDays = dailyStats.filter(day => {
      const rate = day.tasksTotal > 0 
        ? day.tasksCompleted / day.tasksTotal 
        : 0;
      return rate >= successThreshold;
    }).length;

    const daysOff = dailyStats.length - ignitedDays;
    const ignitionRate = (ignitedDays / dailyStats.length) * 100;
    const isAboveGoal = ignitionRate >= 70;

    // Find best performing category/phase
    const phaseRates = phaseInsights.map(p => ({
      phase: p.phase,
      label: p.phaseLabel,
      icon: p.phaseIcon,
      rate: p.avgCompletionRate,
    })).sort((a, b) => b.rate - a.rate);

    const bestPhase = phaseRates[0];

    // Find most active time window based on completion counts
    const phaseCompletions: Record<Phase, number> = {
      morning: 0,
      school: 0,
      afternoon: 0,
      evening: 0,
    };

    // Aggregate phase completions
    phaseInsights.forEach(p => {
      const completed = Math.round((p.avgCompletionRate / 100) * p.taskCount);
      phaseCompletions[p.phase] = completed;
    });

    const mostActivePhase = Object.entries(phaseCompletions)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as Phase;

    // Generate positive reinforcement message
    const reinforcementMessage = generateReinforcementMessage(
      childName,
      ignitedDays,
      ignitionRate,
      bestPhase?.label
    );

    return {
      ignitedDays,
      daysOff,
      ignitionRate,
      isAboveGoal,
      bestPhase,
      mostActivePhase,
      reinforcementMessage,
      dailyStats,
    };
  }, [stats, phaseInsights, childName]);

  if (!stats || !ignitionStats) {
    return null;
  }

  const mostActivePhaseInfo = PHASES.find(p => p.id === ignitionStats.mostActivePhase);
  const MostActiveIcon = PHASE_ICONS[ignitionStats.mostActivePhase] || Sun;

  return (
    <div className="space-y-4">
      {/* Ignition Rate Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">ניתוח הצתה שבועי</h3>
            <p className="text-xs text-muted-foreground">Ignition Analysis</p>
          </div>
        </div>

        {/* Ignition Rate Visualization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">שיעור ההצתה השבועי</span>
            <span className={cn(
              "text-lg font-bold",
              ignitionStats.isAboveGoal ? "text-buff" : "text-primary"
            )}>
              {Math.round(ignitionStats.ignitionRate)}%
            </span>
          </div>
          
          <div className="relative">
            <Progress 
              value={ignitionStats.ignitionRate} 
              className={cn(
                "h-3",
                ignitionStats.isAboveGoal && "[&>div]:bg-buff"
              )}
            />
            {/* 70% threshold marker */}
            <div 
              className="absolute top-0 w-0.5 h-3 bg-foreground/40"
              style={{ left: '70%' }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">0%</span>
            <span className="text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full" />
              יעד 70%
            </span>
            <span className="text-muted-foreground">100%</span>
          </div>

          {/* Status Message */}
          <div className={cn(
            "p-3 rounded-xl text-center",
            ignitionStats.isAboveGoal 
              ? "bg-buff/10 border border-buff/20" 
              : "bg-primary/10 border border-primary/20"
          )}>
            <p className={cn(
              "text-sm font-medium",
              ignitionStats.isAboveGoal ? "text-buff" : "text-primary"
            )}>
              {ignitionStats.isAboveGoal 
                ? `🎉 ${childName} מעל סף ההצלחה של 70%!`
                : `💪 ${childName} בדרך הנכונה - עוד קצת ומגיעים ל-70%!`
              }
            </p>
          </div>
        </div>

        {/* Days Summary - Supportive Language */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-buff/10 border border-buff/20 text-center">
            <p className="text-2xl font-bold text-buff">{ignitionStats.ignitedDays}</p>
            <p className="text-xs text-muted-foreground">ימי הצתה 🔥</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
            <p className="text-2xl font-bold text-muted-foreground">{ignitionStats.daysOff}</p>
            <p className="text-xs text-muted-foreground">ימי טעינה 🔋</p>
          </div>
        </div>
      </motion.div>

      {/* Highlights Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Best Performing Category */}
        {ignitionStats.bestPhase && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-buff" />
              <span className="text-xs text-muted-foreground">הקטגוריה הכי חזקה</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{ignitionStats.bestPhase.icon}</span>
              <div>
                <p className="font-bold text-foreground">{ignitionStats.bestPhase.label}</p>
                <p className="text-xs text-buff">{Math.round(ignitionStats.bestPhase.rate)}% הצלחה</p>
              </div>
            </div>
          </div>
        )}

        {/* Most Active Time Window */}
        {mostActivePhaseInfo && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">חלון הזמן הפעיל ביותר</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MostActiveIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">{mostActivePhaseInfo.label}</p>
                <p className="text-xs text-muted-foreground">{mostActivePhaseInfo.shortLabelHe}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Positive Reinforcement Suggestion */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              רגע חיזוק חיובי
            </h4>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {ignitionStats.reinforcementMessage}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Weekly Ignition Dots */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-card border border-border p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-foreground">מפת הצתה שבועית</h4>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          {ignitionStats.dailyStats.map((day, index) => {
            const isIgnited = day.tasksTotal > 0 
              ? (day.tasksCompleted / day.tasksTotal) >= 0.3 
              : false;
            
            return (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    isIgnited 
                      ? "bg-buff text-buff-foreground shadow-buff-glow" 
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {isIgnited ? '🔥' : '💤'}
                </motion.div>
                <span className="text-[10px] text-muted-foreground">{day.dayName}</span>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>🔥</span>
            <span>יום הצתה</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💤</span>
            <span>יום טעינה</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function generateReinforcementMessage(
  childName: string,
  ignitedDays: number,
  ignitionRate: number,
  bestCategory?: string
): string {
  const firstName = childName.split(' ')[0];
  
  if (ignitedDays >= 5) {
    return `${firstName} עשה שבוע מדהים עם ${ignitedDays} ימי הצתה! 🌟 שקלו לחגוג יחד עם פעילות מיוחדת או מילה טובה. המאמץ העקבי ראוי להכרה!`;
  }
  
  if (ignitedDays >= 3) {
    return `${firstName} הראה עקביות יפה עם ${ignitedDays} ימי הצתה ברצף! 🎯 זה הזמן המושלם להגיד "אני רואה כמה אתה משתדל" או לתת חמישייה!`;
  }
  
  if (ignitionRate >= 50) {
    return `${firstName} נמצא בתהליך צמיחה עם שיעור הצתה של ${Math.round(ignitionRate)}%. ${bestCategory ? `במיוחד ב${bestCategory} רואים שיפור!` : ''} המשיכו לעודד בשקט ובעדינות.`;
  }
  
  return `כל יום הוא הזדמנות חדשה! ${firstName} לומד את הקצב שלו. נסו למצוא רגע קטן היום להגיד משהו חיובי על המאמץ, לא רק על התוצאה.`;
}
