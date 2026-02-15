import { useEffect, useState, useMemo } from 'react';
import { Timetable, WEEK_DAYS, WEEK_DAYS_WITH_FRIDAY, WEEK_DAY_LABELS, WEEK_DAY_LABELS_EN, WeekDay, PeriodInfo } from '@/types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Save, Clock, Backpack, Plus, Check, Loader2, ArrowRightLeft, Merge } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface TimetableEditorProps {
  open: boolean;
  onClose: () => void;
  timetable: Timetable;
  onSave: (timetable: Timetable) => void;
  fridayEnabled?: boolean;
}

// Dynamic period labels - no cap, generate on demand
const getPeriodLabel = (index: number): string => String(index + 1);

// Format time to HH:mm (strip seconds if present)
const formatTime = (time: string): string => {
  if (!time) return '08:00';
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
};

export function TimetableEditor({ open, onClose, timetable, onSave, fridayEnabled }: TimetableEditorProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const dayLabels = isHe ? WEEK_DAY_LABELS : WEEK_DAY_LABELS_EN;
  
  const displayDays = fridayEnabled ? WEEK_DAYS_WITH_FRIDAY : WEEK_DAYS;
  const [selectedDay, setSelectedDay] = useState<WeekDay>(displayDays[0]);
  const [localTimetable, setLocalTimetable] = useState<Timetable>(timetable);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<number | null>(null);
  const [newlyAddedIndices, setNewlyAddedIndices] = useState<Record<string, number[]>>({});

  useEffect(() => {
    if (open) {
      const formatted: Timetable = {};
      for (const day of displayDays) {
        formatted[day] = (timetable[day] || []).map(p => ({
          ...p,
          startTime: formatTime(p.startTime),
        }));
      }
      setLocalTimetable(formatted);
      setNewlyAddedIndices({});
    }
  }, [open, timetable, displayDays]);

  const handleSubjectChange = (periodIndex: number, subject: string) => {
    setLocalTimetable(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map((period, i) =>
        i === periodIndex ? { ...period, subject } : period
      ),
    }));
  };

  const handleTimeChange = (periodIndex: number, startTime: string) => {
    setLocalTimetable(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map((period, i) =>
        i === periodIndex ? { ...period, startTime: formatTime(startTime) } : period
      ),
    }));
  };

  const handleEquipmentChange = (periodIndex: number, equipment: string) => {
    setLocalTimetable(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map((period, i) =>
        i === periodIndex ? { ...period, equipment } : period
      ),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localTimetable);
      setShowSuccess(true);
      toast({
        title: t('timetable.savedToast'),
        description: t('timetable.savedToastDesc'),
        duration: 4000,
      });
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 800);
    } catch (error) {
      console.error('Error saving timetable:', error);
      toast({
        title: t('timetable.saveError'),
        description: t('timetable.saveErrorDesc'),
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLesson = () => {
    const currentDay = localTimetable[selectedDay] || [];
    const lastLesson = currentDay[currentDay.length - 1];
    const nextTime = lastLesson 
      ? incrementTime(lastLesson.startTime, 50) 
      : '08:00';
    
    const newIndex = currentDay.length;
    
    setLocalTimetable(prev => ({
      ...prev,
      [selectedDay]: [
        ...(prev[selectedDay] || []),
        { subject: '', startTime: formatTime(nextTime), equipment: '' },
      ],
    }));
    
    setNewlyAddedIndices(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), newIndex],
    }));
  };

  const handleDeleteLesson = (index: number) => {
    setLocalTimetable(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).filter((_, i) => i !== index),
    }));
    setNewlyAddedIndices(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || [])
        .filter(i => i !== index)
        .map(i => i > index ? i - 1 : i),
    }));
  };

  const handleApplyToAll = (periodIndex: number) => {
    const currentPeriod = localTimetable[selectedDay]?.[periodIndex];
    if (!currentPeriod) return;
    
    setLocalTimetable(prev => {
      const updated = { ...prev };
      for (const day of displayDays) {
        if (day === selectedDay) continue;
        const dayPeriods = [...(updated[day] || [])];
        if (periodIndex < dayPeriods.length) {
          dayPeriods[periodIndex] = { ...dayPeriods[periodIndex], startTime: currentPeriod.startTime };
        }
        updated[day] = dayPeriods;
      }
      return updated;
    });
  };

  const handleMoveToDay = (periodIndex: number, targetDay: WeekDay) => {
    const lessonToMove = localTimetable[selectedDay]?.[periodIndex];
    if (!lessonToMove) return;
    
    setLocalTimetable(prev => {
      const updated = { ...prev };
      updated[selectedDay] = (updated[selectedDay] || []).filter((_, i) => i !== periodIndex);
      const targetLessons = [...(updated[targetDay] || [])];
      const insertIndex = targetLessons.findIndex(l => l.startTime > lessonToMove.startTime);
      if (insertIndex === -1) {
        targetLessons.push(lessonToMove);
      } else {
        targetLessons.splice(insertIndex, 0, lessonToMove);
      }
      updated[targetDay] = targetLessons;
      return updated;
    });
    
    toast({
      title: t('timetable.lessonMoved'),
      description: `"${lessonToMove.subject}" → ${dayLabels[targetDay]}`,
      duration: 3000,
    });
  };

  function incrementTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  const handleMergeSelect = (periodIndex: number) => {
    if (selectedForMerge === null) {
      setSelectedForMerge(periodIndex);
      toast({
        title: t('timetable.selectMerge'),
        description: t('timetable.selectMergeDesc'),
        duration: 3000,
      });
    } else if (selectedForMerge === periodIndex) {
      setSelectedForMerge(null);
    } else {
      const currentDay = localTimetable[selectedDay] || [];
      const first = currentDay[selectedForMerge];
      const second = currentDay[periodIndex];
      
      if (!first || !second) {
        setSelectedForMerge(null);
        return;
      }
      
      const mergedSubject = `${first.subject} + ${second.subject}`;
      const mergedEquipment = [first.equipment, second.equipment].filter(Boolean).join(', ');
      const earlierTime = first.startTime < second.startTime ? first.startTime : second.startTime;
      
      const earlierIdx = Math.min(selectedForMerge, periodIndex);
      const laterIdx = Math.max(selectedForMerge, periodIndex);
      
      setLocalTimetable(prev => {
        const updated = { ...prev };
        const dayLessons = [...(updated[selectedDay] || [])];
        dayLessons[earlierIdx] = {
          subject: mergedSubject,
          startTime: earlierTime,
          equipment: mergedEquipment,
        };
        dayLessons.splice(laterIdx, 1);
        updated[selectedDay] = dayLessons;
        return updated;
      });
      
      setNewlyAddedIndices(prev => {
        const dayIndices = prev[selectedDay] || [];
        return {
          ...prev,
          [selectedDay]: dayIndices
            .filter(i => i !== laterIdx)
            .map(i => i > laterIdx ? i - 1 : i),
        };
      });
      
      setSelectedForMerge(null);
      
      toast({
        title: t('timetable.lessonsMerged'),
        description: `"${mergedSubject}"`,
        duration: 3000,
      });
    }
  };

  const cancelMerge = () => {
    setSelectedForMerge(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground font-bold">{t('timetable.editorTitle')}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('timetable.editorDesc')}
          </DialogDescription>
        </DialogHeader>

        {/* Day Tabs */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg overflow-x-auto">
          {displayDays.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 min-w-[50px] py-2 px-2 rounded-md text-sm font-medium transition-colors ${
                selectedDay === day
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {dayLabels[day]}
            </button>
          ))}
        </div>

        {/* Periods Grid */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {localTimetable[selectedDay]?.map((period, index) => {
              const hasSubject = period.subject && period.subject.trim().length > 0;
              const isNewlyAdded = (newlyAddedIndices[selectedDay] || []).includes(index);
              
              if (!hasSubject && !isNewlyAdded) {
                return null;
              }
              
              const isSelectedForMerge = selectedForMerge === index;
              
              return (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-xl bg-secondary/30 border space-y-2 transition-all",
                  isSelectedForMerge 
                    ? "border-primary ring-2 ring-primary/30" 
                    : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
                      {getPeriodLabel(index)}
                    </span>
                    <Label className="text-foreground font-medium">{t('timetable.lesson')} {index + 1}</Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant={isSelectedForMerge ? "default" : "ghost"}
                      onClick={() => handleMergeSelect(index)}
                      className={cn(
                        "h-8 w-8",
                        isSelectedForMerge 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                      title={isSelectedForMerge ? t('timetable.mergeTooltipActive') : t('timetable.mergeTooltip')}
                    >
                      <Merge className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteLesson(index)}
                      className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    >
                      <span className="text-lg">×</span>
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">{t('timetable.subject')}</Label>
                    <Input
                      placeholder={t('timetable.subjectExample') as string}
                      value={period.subject}
                      onChange={(e) => handleSubjectChange(index, e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs text-muted-foreground mb-1 block">{t('timetable.startTime')}</Label>
                    <div className="relative">
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={period.startTime}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        className="bg-background border-border text-foreground pl-8"
                      />
                    </div>
                  </div>
                </div>

                {period.subject && (
                  <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
                    <Label className="text-sm text-foreground font-semibold mb-2 flex items-center gap-2">
                      <span className="text-lg">🎒</span>
                      {t('timetable.equipmentForLesson')}
                    </Label>
                    <Textarea
                      placeholder={t('timetable.equipmentBagPlaceholder') as string}
                      value={period.equipment || ''}
                      onChange={(e) => handleEquipmentChange(index, e.target.value)}
                      className="bg-background border-border text-foreground min-h-[60px] text-sm"
                      rows={2}
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleApplyToAll(index)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t('timetable.applyTimeToAll')}
                  </Button>
                  
                  <Select
                    value=""
                    onValueChange={(targetDay) => handleMoveToDay(index, targetDay as WeekDay)}
                  >
                    <SelectTrigger className="h-8 w-auto px-2 gap-1 text-xs text-muted-foreground hover:text-foreground border-none bg-transparent">
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>{t('timetable.moveToDay')}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {displayDays.filter(d => d !== selectedDay).map(day => (
                        <SelectItem key={day} value={day}>
                          {dayLabels[day]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              );
            })}
            
            {selectedForMerge !== null && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between">
                <span className="text-sm text-primary font-medium">
                  {t('timetable.selectMerge')}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelMerge}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t('timetable.cancel')}
                </Button>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={handleAddLesson}
              className="w-full gap-2 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
            >
              <Plus className="w-4 h-4" />
              {t('timetable.addLesson')}
            </Button>
          </div>
        </ScrollArea>

        {/* Save Button */}
        <div className="sticky bottom-0 bg-card pt-4 pb-2 border-t border-border -mx-6 px-6 -mb-6">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            size="lg"
            className={cn(
              "w-full h-14 text-lg font-bold transition-all shadow-lg",
              showSuccess 
                ? "bg-green-600 hover:bg-green-600" 
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                {t('timetable.saving')}
              </>
            ) : showSuccess ? (
              <>
                <Check className="w-5 h-5 ml-2" />
                {t('timetable.savedSuccess')}
              </>
            ) : (
              <>
                <Save className="w-5 h-5 ml-2" />
                {t('timetable.saveChanges')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
