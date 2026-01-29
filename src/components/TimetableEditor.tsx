import { useEffect, useState, useMemo } from 'react';
import { Timetable, WEEK_DAYS, WEEK_DAYS_WITH_FRIDAY, WEEK_DAY_LABELS, WeekDay, PeriodInfo } from '@/types/task';
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
  // Handle HH:mm:ss format by trimming to HH:mm
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return time;
};

// Build timetable preserving EXACT data from database - no modifications
const buildInitialTimetable = (timetable: Timetable, includeFriday: boolean): Timetable => {
  const initial: Timetable = {};
  const days = includeFriday ? WEEK_DAYS_WITH_FRIDAY : WEEK_DAYS;
  days.forEach(day => {
    // Preserve exact DB data, only format times for display
    const dayData = timetable[day] || [];
    initial[day] = dayData.map(period => ({
      ...period,
      startTime: formatTime(period.startTime),
    }));
  });
  return initial;
};

export function TimetableEditor({ open, onClose, timetable, onSave, fridayEnabled = false }: TimetableEditorProps) {
  const displayDays = fridayEnabled ? WEEK_DAYS_WITH_FRIDAY : WEEK_DAYS;
  const [localTimetable, setLocalTimetable] = useState<Timetable>(() => buildInitialTimetable(timetable, fridayEnabled));
  const [selectedDay, setSelectedDay] = useState<WeekDay>('sunday');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Track indices of newly added lessons (by day) that should be shown even if empty
  const [newlyAddedIndices, setNewlyAddedIndices] = useState<Record<WeekDay, number[]>>({} as Record<WeekDay, number[]>);
  // Track selected lessons for merging
  const [selectedForMerge, setSelectedForMerge] = useState<number | null>(null);

  // Dialog remains mounted; re-sync when (re)opened so it reflects saved data.
  useEffect(() => {
    if (!open) return;
    setLocalTimetable(buildInitialTimetable(timetable, fridayEnabled));
    setSelectedDay('sunday');
    setShowSuccess(false);
    // Reset newly added tracking when dialog reopens
    setNewlyAddedIndices({} as Record<WeekDay, number[]>);
    setSelectedForMerge(null);
  }, [open, timetable]);

  const handleSubjectChange = (periodIndex: number, subject: string) => {
    setLocalTimetable(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map((period, i) =>
        i === periodIndex ? { ...period, subject } : period
      ),
    }));
  };

  const handleTimeChange = (periodIndex: number, startTime: string) => {
    setLocalTimetable(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map((period, i) =>
        i === periodIndex ? { ...period, startTime } : period
      ),
    }));
  };

  const handleEquipmentChange = (periodIndex: number, equipment: string) => {
    setLocalTimetable(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map((period, i) =>
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
        title: "✅ נשמר בהצלחה!",
        description: "המערכת והציוד נשמרו בהצלחה!",
        duration: 4000,
      });
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 800);
    } catch (error) {
      console.error('Error saving timetable:', error);
      toast({
        title: "שגיאה בשמירה",
        description: "לא הצלחנו לשמור את השינויים. נסו שוב.",
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
        { subject: '', startTime: nextTime, equipment: '' }
      ]
    }));
    
    // Track this as a newly added lesson so it shows even without subject
    setNewlyAddedIndices(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), newIndex]
    }));
  };

  const handleDeleteLesson = (periodIndex: number) => {
    setLocalTimetable(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].filter((_, i) => i !== periodIndex)
    }));
    
    // Update newly added indices to account for deleted item
    setNewlyAddedIndices(prev => {
      const dayIndices = prev[selectedDay] || [];
      return {
        ...prev,
        [selectedDay]: dayIndices
          .filter(i => i !== periodIndex) // Remove the deleted index
          .map(i => i > periodIndex ? i - 1 : i) // Shift indices after deleted item
      };
    });
  };

  const handleApplyToAll = (periodIndex: number) => {
    const currentSubject = localTimetable[selectedDay][periodIndex].subject;
    const currentTime = localTimetable[selectedDay][periodIndex].startTime;
    
    setLocalTimetable(prev => {
      const updated = { ...prev };
      displayDays.forEach(day => {
        if (updated[day]) {
          updated[day] = updated[day].map((period, i) =>
            i === periodIndex ? { ...period, startTime: currentTime } : period
          );
        }
      });
      return updated;
    });
  };

  // Move lesson to a different day (for fixing OCR mistakes)
  const handleMoveToDay = (periodIndex: number, targetDay: WeekDay) => {
    if (targetDay === selectedDay) return;
    
    const lessonToMove = localTimetable[selectedDay][periodIndex];
    
    setLocalTimetable(prev => {
      const updated = { ...prev };
      
      // Remove from current day
      updated[selectedDay] = updated[selectedDay].filter((_, i) => i !== periodIndex);
      
      // Add to target day (insert at the correct position based on time)
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
      title: "✓ שיעור הועבר",
      description: `השיעור "${lessonToMove.subject}" הועבר ל${WEEK_DAY_LABELS[targetDay]}`,
      duration: 3000,
    });
  };

  // Helper to increment time
  function incrementTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  // Handle merge selection
  const handleMergeSelect = (periodIndex: number) => {
    if (selectedForMerge === null) {
      // First selection
      setSelectedForMerge(periodIndex);
      toast({
        title: "בחר/י שיעור נוסף למיזוג",
        description: "לחץ/י על שיעור נוסף כדי לאחד אותם לשיעור אחד",
        duration: 3000,
      });
    } else if (selectedForMerge === periodIndex) {
      // Deselect
      setSelectedForMerge(null);
    } else {
      // Merge the two lessons
      const periods = localTimetable[selectedDay];
      const firstPeriod = periods[selectedForMerge];
      const secondPeriod = periods[periodIndex];
      
      if (!firstPeriod || !secondPeriod) {
        setSelectedForMerge(null);
        return;
      }
      
      // Merge: combine subjects, keep earlier time, combine equipment
      const [earlier, later] = selectedForMerge < periodIndex 
        ? [firstPeriod, secondPeriod] 
        : [secondPeriod, firstPeriod];
      
      const earlierIdx = selectedForMerge < periodIndex ? selectedForMerge : periodIndex;
      const laterIdx = selectedForMerge < periodIndex ? periodIndex : selectedForMerge;
      
      // Smart merge: if one looks like a teacher name (2-3 words, not a subject), format as "Subject (Teacher)"
      let mergedSubject = '';
      const isLikelyTeacher = (text: string) => {
        if (!text) return false;
        const words = text.trim().split(/\s+/);
        // Teacher names are usually 2-3 words, no special chars like ", numbers
        return words.length >= 2 && words.length <= 3 && !/["'\d]/.test(text);
      };
      
      if (earlier.subject && later.subject) {
        if (isLikelyTeacher(later.subject) && !isLikelyTeacher(earlier.subject)) {
          mergedSubject = `${earlier.subject} (${later.subject})`;
        } else if (isLikelyTeacher(earlier.subject) && !isLikelyTeacher(later.subject)) {
          mergedSubject = `${later.subject} (${earlier.subject})`;
        } else {
          // Both are subjects - just combine with /
          mergedSubject = `${earlier.subject} / ${later.subject}`;
        }
      } else {
        mergedSubject = earlier.subject || later.subject || '';
      }
      
      const mergedEquipment = [earlier.equipment, later.equipment]
        .filter(Boolean)
        .join(', ');
      
      // Update timetable: merge into earlier slot, remove later slot
      setLocalTimetable(prev => {
        const newPeriods = [...prev[selectedDay]];
        newPeriods[earlierIdx] = {
          ...earlier,
          subject: mergedSubject,
          equipment: mergedEquipment,
        };
        // Remove the later period
        newPeriods.splice(laterIdx, 1);
        return {
          ...prev,
          [selectedDay]: newPeriods,
        };
      });
      
      // Update newly added indices to account for removed item
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
        title: "✓ שיעורים אוחדו",
        description: `"${mergedSubject}" נוצר מאיחוד שני השיעורים`,
        duration: 3000,
      });
    }
  };

  // Cancel merge mode
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
          <DialogTitle className="text-foreground font-bold">ניהול מערכת וציוד נדרש</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            הגדירו מקצועות, זמני שיעורים וציוד נדרש לכל יום.
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
              {WEEK_DAY_LABELS[day]}
            </button>
          ))}
        </div>

        {/* Periods Grid */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {localTimetable[selectedDay]?.map((period, index) => {
              // Subject-First Policy: Only show if has subject OR is a newly added lesson
              const hasSubject = period.subject && period.subject.trim().length > 0;
              const isNewlyAdded = (newlyAddedIndices[selectedDay] || []).includes(index);
              
              // Hide empty rows unless newly added via "Add Lesson" button
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
                    <Label className="text-foreground font-medium">שיעור {index + 1}</Label>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Merge button */}
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
                      title={isSelectedForMerge ? "לחץ על שיעור נוסף למיזוג" : "מזג עם שיעור אחר"}
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
                    <Label className="text-xs text-muted-foreground mb-1 block">מקצוע</Label>
                    <Input
                      placeholder="לדוגמה: מתמטיקה, אנגלית..."
                      value={period.subject}
                      onChange={(e) => handleSubjectChange(index, e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs text-muted-foreground mb-1 block">שעת התחלה</Label>
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

                {/* Equipment Field - Only show when subject exists */}
                {period.subject && (
                  <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
                    <Label className="text-sm text-foreground font-semibold mb-2 flex items-center gap-2">
                      <span className="text-lg">🎒</span>
                      ציוד נדרש לשיעור
                    </Label>
                    <Textarea
                      placeholder="מה להכניס לתיק? (למשל: נעלי ספורט, תיקיית אמנות)"
                      value={period.equipment || ''}
                      onChange={(e) => handleEquipmentChange(index, e.target.value)}
                      className="bg-background border-border text-foreground min-h-[60px] text-sm"
                      rows={2}
                    />
                  </div>
                )}
                
                {/* Action buttons row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleApplyToAll(index)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    החל זמן על כל הימים
                  </Button>
                  
                  {/* Move to Day dropdown */}
                  <Select
                    value=""
                    onValueChange={(targetDay) => handleMoveToDay(index, targetDay as WeekDay)}
                  >
                    <SelectTrigger className="h-8 w-auto px-2 gap-1 text-xs text-muted-foreground hover:text-foreground border-none bg-transparent">
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>העבר ליום...</span>
                    </SelectTrigger>
                    <SelectContent>
                      {displayDays.filter(d => d !== selectedDay).map(day => (
                        <SelectItem key={day} value={day}>
                          {WEEK_DAY_LABELS[day]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              );
            })}
            
            {/* Merge mode indicator */}
            {selectedForMerge !== null && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between">
                <span className="text-sm text-primary font-medium">
                  בחר/י שיעור נוסף למיזוג
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelMerge}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ביטול
                </Button>
              </div>
            )}
            
            {/* Add Lesson Button */}
            <Button
              variant="outline"
              onClick={handleAddLesson}
              className="w-full gap-2 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
            >
              <Plus className="w-4 h-4" />
              + הוספת שיעור וציוד
            </Button>
          </div>
        </ScrollArea>

        {/* Save Button - Sticky Footer */}
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
                שומר...
              </>
            ) : showSuccess ? (
              <>
                <Check className="w-5 h-5 ml-2" />
                נשמר בהצלחה!
              </>
            ) : (
              <>
                <Save className="w-5 h-5 ml-2" />
                שמירת שינויים
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
