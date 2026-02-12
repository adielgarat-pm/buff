import { useMemo } from 'react';
import { Timetable, WeekDay, WEEK_DAYS, WEEK_DAYS_WITH_FRIDAY, WEEK_DAY_LABELS, WEEK_DAY_LABELS_EN, PeriodInfo } from '@/types/task';
import { Backpack, CheckCircle2, Moon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface TomorrowsPrepProps {
  timetable: Timetable;
  fridayEnabled?: boolean;
}

export function TomorrowsPrep({ timetable, fridayEnabled = false }: TomorrowsPrepProps) {
  const { t, language } = useLanguage();
  const dayLabels = language === 'he' ? WEEK_DAY_LABELS : WEEK_DAY_LABELS_EN;
  
  const tomorrowData = useMemo(() => {
    const today = new Date();
    const todayIndex = today.getDay();
    const tomorrowIndex = (todayIndex + 1) % 7;
    
    const dayMap: Record<number, WeekDay | null> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: fridayEnabled ? 'friday' : null,
      6: null,
    };
    
    const tomorrowDay = dayMap[tomorrowIndex];
    if (!tomorrowDay) {
      return { day: null, lessons: [], hasEquipment: false };
    }
    
    const lessons = (timetable[tomorrowDay] || []).filter(p => p.subject && p.subject.trim() !== '');
    const hasEquipment = lessons.some(p => p.equipment && p.equipment.trim() !== '');
    
    return { day: tomorrowDay, lessons, hasEquipment };
  }, [timetable, fridayEnabled]);

  const equipmentList = useMemo(() => {
    return tomorrowData.lessons
      .filter(lesson => lesson.equipment && lesson.equipment.trim() !== '')
      .map(lesson => ({
        subject: lesson.subject,
        equipment: lesson.equipment!.trim(),
        time: lesson.startTime,
      }));
  }, [tomorrowData.lessons]);

  if (!tomorrowData.day) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-buff/10 flex items-center justify-center mx-auto mb-4">
          <Moon className="w-8 h-8 text-buff" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          {t('prep.tomorrowOff')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('prep.noBagPrep')}
        </p>
      </div>
    );
  }

  if (equipmentList.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-buff/10 flex items-center justify-center">
            <Backpack className="w-6 h-6 text-buff" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t('prep.prepForTomorrow')}</h3>
            <p className="text-sm text-muted-foreground">
              {dayLabels[tomorrowData.day]} - {tomorrowData.lessons.length} {t('timetable.lessons')}
            </p>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 text-center">
          <CheckCircle2 className="w-8 h-8 text-primary/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t('prep.noSpecialEquipment')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-buff/5 to-primary/5 border border-buff/30 p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-buff/20 flex items-center justify-center">
          <Backpack className="w-6 h-6 text-buff" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground">{t('prep.prepForTomorrow')}</h3>
            <Sparkles className="w-4 h-4 text-buff animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">
            {dayLabels[tomorrowData.day]} - {t('prep.equipmentChecklist')}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {equipmentList.map((item, index) => (
          <div
            key={index}
            className="p-3 rounded-xl bg-card border border-border"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">
                  {item.time.slice(0, 5)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">
                  {item.subject}
                </p>
                <div className="mt-1 space-y-1">
                  {item.equipment.split(/[,،\n]/).map((eq, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-buff" />
                      <span>{eq.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          {t('prep.bagReady')}
        </p>
      </div>
    </div>
  );
}
