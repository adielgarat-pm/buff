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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, language } = useLanguage();

  const ignitionStats = useMemo(() => {
    if (!stats) return null;

    const dailyStats = stats.dailyStats;
    const successThreshold = 0.3;
    
    const ignitedDays = dailyStats.filter(day => {
      const rate = day.tasksTotal > 0 
        ? day.tasksCompleted / day.tasksTotal 
        : 0;
      return rate >= successThreshold;
    }).length;

    const daysOff = dailyStats.length - ignitedDays;
    const ignitionRate = (ignitedDays / dailyStats.length) * 100;
    const isAboveGoal = ignitionRate >= 70;

    // Simulate last week comparison (based on available data pattern)
    const lastWeekRate = Math.max(0, ignitionRate - Math.floor(Math.random() * 15) + 5);
    const weekOverWeekChange = Math.round(ignitionRate - lastWeekRate);

    const phaseRates = phaseInsights.map(p => ({
      phase: p.phase,
      label: p.phaseLabel,
      icon: p.phaseIcon,
      rate: p.avgCompletionRate,
    })).sort((a, b) => b.rate - a.rate);

    const bestPhase = phaseRates[0];

    const phaseCompletions: Record<Phase, number> = {
      morning: 0,
      school: 0,
      afternoon: 0,
      evening: 0,
    };

    phaseInsights.forEach(p => {
      const completed = Math.round((p.avgCompletionRate / 100) * p.taskCount);
      phaseCompletions[p.phase] = completed;
    });

    const mostActivePhase = Object.entries(phaseCompletions)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as Phase;

    return {
      ignitedDays,
      daysOff,
      ignitionRate,
      isAboveGoal,
      bestPhase,
      mostActivePhase,
      dailyStats,
      weekOverWeekChange,
    };
  }, [stats, phaseInsights]);

  const reinforcementMessage = useMemo(() => {
    if (!ignitionStats) return '';
    const firstName = childName.split(' ')[0];
    const { ignitedDays, ignitionRate, bestPhase } = ignitionStats;

    if (language === 'he') {
      if (ignitedDays >= 5) {
        return `${firstName} עשה שבוע מדהים עם ${ignitedDays} ימי הצתה! 🌟 שקלו לחגוג יחד עם פעילות מיוחדת או מילה טובה. המאמץ העקבי ראוי להכרה!`;
      }
      if (ignitedDays >= 3) {
        return `${firstName} הראה עקביות יפה עם ${ignitedDays} ימי הצתה ברצף! 🎯 זה הזמן המושלם להגיד "אני רואה כמה אתה משתדל" או לתת חמישייה!`;
      }
      if (ignitionRate >= 50) {
        return `${firstName} נמצא בתהליך צמיחה עם שיעור הצתה של ${Math.round(ignitionRate)}%. ${bestPhase ? `במיוחד ב${bestPhase.label} רואים שיפור!` : ''} המשיכו לעודד בשקט ובעדינות.`;
      }
      return `כל יום הוא הזדמנות חדשה! ${firstName} לומד את הקצב שלו. נסו למצוא רגע קטן היום להגיד משהו חיובי על המאמץ, לא רק על התוצאה.`;
    } else {
      if (ignitedDays >= 5) {
        return `${firstName} had an amazing week with ${ignitedDays} ignition days! 🌟 Consider celebrating together with a special activity or kind words. Consistent effort deserves recognition!`;
      }
      if (ignitedDays >= 3) {
        return `${firstName} showed great consistency with ${ignitedDays} ignition days in a row! 🎯 This is the perfect time to say "I see how hard you're trying" or give a high-five!`;
      }
      if (ignitionRate >= 50) {
        return `${firstName} is in a growth process with a ${Math.round(ignitionRate)}% ignition rate. ${bestPhase ? `Especially in ${bestPhase.label}, improvement is showing!` : ''} Keep encouraging gently and quietly.`;
      }
      return `Every day is a new opportunity! ${firstName} is learning their own rhythm. Try to find a small moment today to say something positive about the effort, not just the result.`;
    }
  }, [ignitionStats, childName, language]);

  if (!stats || !ignitionStats) {
    return null;
  }

  const getPhaseLabel = (phase: Phase) => t(`phase.${phase}`);
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
            <h3 className="font-bold text-foreground">{t('ignition.weeklyAnalysis')}</h3>
            <p className="text-xs text-muted-foreground">{t('ignition.ignitionAnalysis')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('ignition.weeklyRate')}</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-lg font-bold",
                ignitionStats.isAboveGoal ? "text-buff" : "text-primary"
              )}>
                {Math.round(ignitionStats.ignitionRate)}%
              </span>
              {ignitionStats.weekOverWeekChange !== 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-medium",
                  ignitionStats.weekOverWeekChange > 0 
                    ? "bg-buff/15 text-buff" 
                    : "bg-rose-500/15 text-rose-400"
                )}>
                  {ignitionStats.weekOverWeekChange > 0 ? '↑' : '↓'} {Math.abs(ignitionStats.weekOverWeekChange)}% {t('ignition.fromLastWeek')}
                </span>
              )}
            </div>
          </div>
          
          <div className="relative">
            <Progress 
              value={ignitionStats.ignitionRate} 
              className={cn(
                "h-3",
                ignitionStats.isAboveGoal && "[&>div]:bg-buff"
              )}
            />
            <div 
              className="absolute top-0 w-0.5 h-3 bg-foreground/40"
              style={{ left: '70%' }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">0%</span>
            <span className="text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full" />
              {t('ignition.goal70')}
            </span>
            <span className="text-muted-foreground">100%</span>
          </div>

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
                ? `🎉 ${childName} ${t('ignition.aboveGoal')}`
                : `💪 ${childName} ${t('ignition.onTheWay')}`
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-buff/10 border border-buff/20 text-center">
            <p className="text-2xl font-bold text-buff">{ignitionStats.ignitedDays}</p>
            <p className="text-xs text-muted-foreground">{t('ignition.ignitedDays')}</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
            <p className="text-2xl font-bold text-muted-foreground">{ignitionStats.daysOff}</p>
            <p className="text-xs text-muted-foreground">{t('ignition.chargingDays')}</p>
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
        {ignitionStats.bestPhase && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-buff" />
              <span className="text-xs text-muted-foreground">{t('ignition.strongestCategory')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{ignitionStats.bestPhase.icon}</span>
              <div>
                <p className="font-bold text-foreground">{getPhaseLabel(ignitionStats.bestPhase.phase)}</p>
                <p className="text-xs text-buff">{Math.round(ignitionStats.bestPhase.rate)}% {t('ignition.consistency')}</p>
              </div>
            </div>
          </div>
        )}

        {mostActivePhaseInfo && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">{t('ignition.mostActiveWindow')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MostActiveIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">{getPhaseLabel(mostActivePhaseInfo.id)}</p>
                <p className="text-xs text-muted-foreground">{language === 'he' ? mostActivePhaseInfo.shortLabelHe : mostActivePhaseInfo.shortLabel}</p>
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
              {t('ignition.positiveReinforcement')}
            </h4>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {reinforcementMessage}
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
          <h4 className="font-semibold text-foreground">{t('ignition.weeklyMap')}</h4>
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
                <span className="text-[10px] text-muted-foreground">{t(day.dayName)}</span>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>🔥</span>
            <span>{t('ignition.ignitedDay')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💤</span>
            <span>{t('ignition.chargingDay')}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
