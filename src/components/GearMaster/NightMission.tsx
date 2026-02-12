import { useState, useMemo, useEffect } from 'react';
import { Timetable, WeekDay, WEEK_DAY_LABELS, WEEK_DAY_LABELS_EN, PeriodInfo } from '@/types/task';
import { Backpack, CheckCircle2, Moon, Sparkles, PartyPopper, Undo2, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { ConfettiEffect } from '../ConfettiEffect';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface NightMissionProps {
  timetable: Timetable;
  fridayEnabled?: boolean;
  credits: number;
  isCompleted: boolean;
  onComplete: () => void;
  onUndo?: () => void;
}

interface CheckedItems {
  [key: string]: boolean;
}

export function NightMission({ 
  timetable, 
  fridayEnabled = false, 
  credits,
  isCompleted,
  onComplete,
  onUndo,
}: NightMissionProps) {
  const { t, language } = useLanguage();
  const dayLabels = language === 'he' ? WEEK_DAY_LABELS : WEEK_DAY_LABELS_EN;
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  
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
      return { day: null, lessons: [], dayLabel: '', hasSchedule: false };
    }
    
    const lessons = (timetable[tomorrowDay] || []).filter(p => p.subject && p.subject.trim() !== '');
    const hasSchedule = lessons.length > 0;
    
    return { 
      day: tomorrowDay, 
      lessons, 
      dayLabel: dayLabels[tomorrowDay],
      hasSchedule 
    };
  }, [timetable, fridayEnabled]);

  const { lessonsWithEquipment, lessonsWithoutEquipment } = useMemo(() => {
    const withEquip: (PeriodInfo & { index: number })[] = [];
    const withoutEquip: (PeriodInfo & { index: number })[] = [];
    
    tomorrowData.lessons.forEach((lesson, index) => {
      if (lesson.equipment && lesson.equipment.trim() !== '') {
        withEquip.push({ ...lesson, index });
      } else {
        withoutEquip.push({ ...lesson, index });
      }
    });
    
    return { lessonsWithEquipment: withEquip, lessonsWithoutEquipment: withoutEquip };
  }, [tomorrowData.lessons]);

  const EVENING_PREP_ITEMS = [
    { id: 'lunchbox_reset', label: t('gear.lunchboxReset'), icon: '🧹' },
  ];

  const allCheckboxItems = useMemo(() => {
    const items: { id: string; label: string; icon?: string }[] = [];
    
    EVENING_PREP_ITEMS.forEach(item => {
      items.push(item);
    });
    
    lessonsWithEquipment.forEach(lesson => {
      const equipmentParts = lesson.equipment!.split(/[,،\n]/);
      equipmentParts.forEach((eq, eqIndex) => {
        const trimmed = eq.trim();
        if (trimmed) {
          items.push({
            id: `lesson_${lesson.index}_eq_${eqIndex}`,
            label: `${lesson.subject}: ${trimmed}`,
          });
        }
      });
    });
    
    return items;
  }, [lessonsWithEquipment, t]);

  const allChecked = useMemo(() => {
    if (allCheckboxItems.length === 0) return true;
    return allCheckboxItems.every(item => checkedItems[item.id]);
  }, [allCheckboxItems, checkedItems]);

  const handleCheckItem = (itemId: string, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: checked }));
  };

  const handleComplete = () => {
    setShowConfetti(true);
    setJustCompleted(true);
    onComplete();
    
    toast({
      title: t('gear.nightMissionComplete'),
      description: `${t('gear.nightMissionCompleteDesc')} ${credits} ${t('gear.credits')}`,
      duration: 5000,
    });
    
    setTimeout(() => setShowConfetti(false), 3000);
    setTimeout(() => setJustCompleted(false), 5000);
  };

  const handleUndo = () => {
    setJustCompleted(false);
    onUndo?.();
    toast({
      title: t('gear.undone'),
      description: t('gear.undoneDesc'),
      duration: 3000,
    });
  };

  if (!tomorrowData.day || !tomorrowData.hasSchedule) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-buff/10 flex items-center justify-center mx-auto mb-4">
          <Moon className="w-8 h-8 text-buff" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          {!tomorrowData.day ? t('gear.tomorrowOff') : t('gear.noScheduleTomorrow')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {!tomorrowData.day 
            ? t('gear.noBagPrep')
            : t('gear.addSchedule')}
        </p>
      </div>
    );
  }

  if (isCompleted && !justCompleted) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-buff/10 to-primary/10 border border-buff/30 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-buff/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-buff" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          {t('gear.nightCompleted')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('gear.bagReadyCredits')} {credits} {t('gear.credits')}
        </p>
      </div>
    );
  }

  if (allCheckboxItems.length === 0) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-buff/5 to-primary/5 border border-buff/30 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-buff/20 flex items-center justify-center">
            <Backpack className="w-6 h-6 text-buff" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground">{t('gear.nightMission')}</h3>
              <Zap className="w-4 h-4 text-buff animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">
              {tomorrowData.dayLabel} - {t('gear.noSpecialEquipment')}
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-buff/10 border border-buff/20">
            <span className="text-sm font-bold text-buff">+{credits}</span>
          </div>
        </div>

        <Button
          onClick={handleComplete}
          className="w-full gap-2 bg-gradient-to-r from-buff to-primary text-white hover:opacity-90"
        >
          <PartyPopper className="w-5 h-5" />
          {t('gear.bagComplete')} (+{credits} {t('gear.credits')})
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-buff/5 to-primary/5 border-2 border-buff/40 p-4 space-y-4">
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-buff to-primary flex items-center justify-center">
          <Backpack className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground">{t('gear.nightMission')}</h3>
            <Zap className="w-4 h-4 text-buff animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">
            {tomorrowData.dayLabel} - {t('gear.prepNow')}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-buff/20 border border-buff/30">
          <span className="text-sm font-bold text-buff">+{credits}</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">{t('gear.eveningPrep')}</p>
        <div className="p-3 rounded-xl bg-card border border-border">
          {EVENING_PREP_ITEMS.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={checkedItems[item.id] || false}
                onCheckedChange={(checked) => handleCheckItem(item.id, !!checked)}
                className="h-5 w-5"
              />
              <span className="text-lg">{item.icon}</span>
              <span className={cn(
                "text-sm transition-all",
                checkedItems[item.id] ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {lessonsWithEquipment.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">{t('gear.equipmentNeeded')}</p>
          {lessonsWithEquipment.map((lesson, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-card border-2 border-buff/40"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {lesson.startTime.slice(0, 5)}
                </span>
                <span className="font-semibold text-foreground text-sm">{lesson.subject}</span>
              </div>
              <div className="space-y-2">
                {lesson.equipment!.split(/[,،\n]/).map((eq, eqIdx) => {
                  const trimmed = eq.trim();
                  if (!trimmed) return null;
                  const itemId = `lesson_${lesson.index}_eq_${eqIdx}`;
                  return (
                    <label
                      key={eqIdx}
                      className="flex items-center gap-3 p-2 rounded-lg bg-background hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={checkedItems[itemId] || false}
                        onCheckedChange={(checked) => handleCheckItem(itemId, !!checked)}
                        className="h-5 w-5"
                      />
                      <span className={cn(
                        "text-sm transition-all",
                        checkedItems[itemId] ? "text-muted-foreground line-through" : "text-foreground"
                      )}>
                        {trimmed}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2">
        {justCompleted ? (
          <Button
            onClick={handleUndo}
            variant="outline"
            className="w-full gap-2 text-muted-foreground"
          >
            <Undo2 className="w-4 h-4" />
            {t('gear.undo')}
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={!allChecked}
            className={cn(
              "w-full gap-2 transition-all",
              allChecked 
                ? "bg-gradient-to-r from-buff to-primary text-white hover:opacity-90" 
                : "bg-secondary text-muted-foreground"
            )}
          >
            {allChecked ? (
              <>
                <PartyPopper className="w-5 h-5" />
                {t('gear.bagComplete')} (+{credits} {t('gear.credits')})
              </>
            ) : (
              <>
                <Backpack className="w-5 h-5" />
                {t('gear.markAll')}
              </>
            )}
          </Button>
        )}
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          {Object.values(checkedItems).filter(Boolean).length} / {allCheckboxItems.length} {t('gear.itemsReady')}
        </p>
      </div>
    </div>
  );
}
