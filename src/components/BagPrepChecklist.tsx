import { useState, useMemo, useEffect } from 'react';
import { Timetable, WeekDay, WEEK_DAYS, WEEK_DAYS_WITH_FRIDAY, WEEK_DAY_LABELS, PeriodInfo } from '@/types/task';
import { Backpack, CheckCircle2, Moon, Sparkles, PartyPopper, Undo2 } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';
import { ConfettiEffect } from './ConfettiEffect';
import { toast } from '@/hooks/use-toast';

interface BagPrepChecklistProps {
  timetable: Timetable;
  fridayEnabled?: boolean;
  bagPrepCredits: number;
  isCompleted: boolean;
  onComplete: () => void;
  onUndo?: () => void;
}

interface CheckedItems {
  [key: string]: boolean;
}

// General essentials that are always shown
const GENERAL_ESSENTIALS = [
  { id: 'water_bottle', label: 'בקבוק מים', icon: '💧' },
  { id: 'food_sandwich', label: 'אוכל/כריך', icon: '🥪' },
  { id: 'phone_charger', label: 'טלפון ומטען', icon: '📱' },
];

export function BagPrepChecklist({ 
  timetable, 
  fridayEnabled = false, 
  bagPrepCredits,
  isCompleted,
  onComplete,
  onUndo,
}: BagPrepChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  
  // Get tomorrow's day and lessons
  const tomorrowData = useMemo(() => {
    const today = new Date();
    const todayIndex = today.getDay(); // 0 = Sunday
    const tomorrowIndex = (todayIndex + 1) % 7;
    
    const dayMap: Record<number, WeekDay | null> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: fridayEnabled ? 'friday' : null,
      6: null, // Saturday
    };
    
    const tomorrowDay = dayMap[tomorrowIndex];
    if (!tomorrowDay) {
      return { day: null, lessons: [], dayLabel: '' };
    }
    
    // Only include lessons with actual subject content
    const lessons = (timetable[tomorrowDay] || []).filter(p => p.subject && p.subject.trim() !== '');
    
    return { 
      day: tomorrowDay, 
      lessons, 
      dayLabel: WEEK_DAY_LABELS[tomorrowDay] 
    };
  }, [timetable, fridayEnabled]);

  // Split lessons into with/without equipment
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

  // Generate all checkbox items
  const allCheckboxItems = useMemo(() => {
    const items: { id: string; label: string; category: 'equipment' | 'essential' }[] = [];
    
    // Add equipment items from lessons
    lessonsWithEquipment.forEach(lesson => {
      const equipmentParts = lesson.equipment!.split(/[,،\n]/);
      equipmentParts.forEach((eq, eqIndex) => {
        const trimmed = eq.trim();
        if (trimmed) {
          items.push({
            id: `lesson_${lesson.index}_eq_${eqIndex}`,
            label: `${lesson.subject}: ${trimmed}`,
            category: 'equipment',
          });
        }
      });
    });
    
    // Add general essentials
    GENERAL_ESSENTIALS.forEach(essential => {
      items.push({
        id: essential.id,
        label: `${essential.icon} ${essential.label}`,
        category: 'essential',
      });
    });
    
    return items;
  }, [lessonsWithEquipment]);

  // Check if all items are checked
  const allChecked = useMemo(() => {
    if (allCheckboxItems.length === 0) return false;
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
      title: "🎒 התיק מוכן!",
      description: `כל הכבוד! צברת ${bagPrepCredits} קרדיטים`,
      duration: 5000,
    });
    
    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 3000);
    
    // Show undo option for 5 seconds
    setTimeout(() => setJustCompleted(false), 5000);
  };

  const handleUndo = () => {
    setJustCompleted(false);
    onUndo?.();
    toast({
      title: "↩️ בוטל",
      description: "המשימה בוטלה - תוכל לסמן מחדש",
      duration: 3000,
    });
  };

  // If tomorrow is not a school day
  if (!tomorrowData.day) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-buff/10 flex items-center justify-center mx-auto mb-4">
          <Moon className="w-8 h-8 text-buff" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          מחר יום חופש! 🎉
        </h3>
        <p className="text-sm text-muted-foreground">
          אין צורך להכין תיק - תהנה מהמנוחה!
        </p>
      </div>
    );
  }

  // If already completed
  if (isCompleted && !justCompleted) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-buff/10 border border-primary/30 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          התיק מוכן למחר! ✨
        </h3>
        <p className="text-sm text-muted-foreground">
          כל הכבוד! קיבלת {bagPrepCredits} קרדיטים
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-buff/5 to-primary/5 border border-buff/30 p-4 space-y-4">
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-buff/20 flex items-center justify-center">
          <Backpack className="w-6 h-6 text-buff" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground">מכינים תיק למחר</h3>
            <Sparkles className="w-4 h-4 text-buff animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">
            {tomorrowData.dayLabel} - {tomorrowData.lessons.length} שיעורים
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-sm font-bold text-primary">+{bagPrepCredits}</span>
        </div>
      </div>

      {/* Tomorrow's Schedule Preview (lessons without equipment - faded) */}
      {lessonsWithoutEquipment.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">📚 שיעורים למחר:</p>
          <div className="flex flex-wrap gap-2">
            {lessonsWithoutEquipment.map((lesson, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-lg bg-secondary/50 text-xs text-muted-foreground"
              >
                {lesson.startTime.slice(0, 5)} - {lesson.subject}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lessons with Equipment - Highlighted */}
      {lessonsWithEquipment.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">🎒 ציוד נדרש לשיעורים:</p>
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

      {/* General Essentials */}
      <div className="space-y-2 pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground font-medium">✨ דברים חשובים:</p>
        <div className="space-y-2">
          {GENERAL_ESSENTIALS.map((essential) => (
            <label
              key={essential.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border hover:border-primary/30 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={checkedItems[essential.id] || false}
                onCheckedChange={(checked) => handleCheckItem(essential.id, !!checked)}
                className="h-5 w-5"
              />
              <span className="text-lg">{essential.icon}</span>
              <span className={cn(
                "text-sm transition-all",
                checkedItems[essential.id] ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                {essential.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Complete Button */}
      <div className="pt-2">
        {justCompleted ? (
          <Button
            onClick={handleUndo}
            variant="outline"
            className="w-full gap-2 text-muted-foreground"
          >
            <Undo2 className="w-4 h-4" />
            בטל (5 שניות)
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
                אני מוכן למחר! (+{bagPrepCredits} קרדיטים)
              </>
            ) : (
              <>
                <Backpack className="w-5 h-5" />
                סמן את כל הפריטים
              </>
            )}
          </Button>
        )}
      </div>

      {/* Progress indicator */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          {Object.values(checkedItems).filter(Boolean).length} / {allCheckboxItems.length} פריטים מוכנים
        </p>
      </div>
    </div>
  );
}