import { useEffect, useState, useMemo } from 'react';
import { Timetable, WEEK_DAYS, WEEK_DAYS_WITH_FRIDAY, WEEK_DAY_LABELS, WeekDay, PeriodInfo } from '@/types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Save, Clock, Backpack, Plus, Check, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';

interface TimetableEditorProps {
  open: boolean;
  onClose: () => void;
  timetable: Timetable;
  onSave: (timetable: Timetable) => void;
  fridayEnabled?: boolean;
}

const PERIOD_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

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

  // Dialog remains mounted; re-sync when (re)opened so it reflects saved data.
  useEffect(() => {
    if (!open) return;
    setLocalTimetable(buildInitialTimetable(timetable, fridayEnabled));
    setSelectedDay('sunday');
    setShowSuccess(false);
    // Reset newly added tracking when dialog reopens
    setNewlyAddedIndices({} as Record<WeekDay, number[]>);
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
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 800);
    } catch (error) {
      console.error('Error saving timetable:', error);
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

  // Helper to increment time
  function incrementTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">מערכת שעות שבועית</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            הגדירו מקצועות וזמני שיעורים לכל יום.
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
              
              return (
              <div
                key={index}
                className="p-3 rounded-xl bg-secondary/30 border border-border space-y-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
                      {PERIOD_LABELS[index] || index + 1}
                    </span>
                    <Label className="text-foreground font-medium">שיעור {index + 1}</Label>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteLesson(index)}
                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                  >
                    <span className="text-lg">×</span>
                  </Button>
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
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Backpack className="w-3 h-3" />
                      ציוד נדרש
                    </Label>
                    <Textarea
                      placeholder="מחברת, ספר לימוד, מחשבון..."
                      value={period.equipment || ''}
                      onChange={(e) => handleEquipmentChange(index, e.target.value)}
                      className="bg-background border-border text-foreground min-h-[60px] text-sm"
                      rows={2}
                    />
                  </div>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleApplyToAll(index)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  החל זמן על כל הימים
                </Button>
              </div>
              );
            })}
            
            {/* Add Lesson Button */}
            <Button
              variant="outline"
              onClick={handleAddLesson}
              className="w-full gap-2 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
            >
              <Plus className="w-4 h-4" />
              + הוספת שיעור
            </Button>
          </div>
        </ScrollArea>

        {/* Save Button */}
        <div className="flex justify-end pt-2 border-t border-border">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className={cn(
              "min-w-[140px] transition-all",
              showSuccess 
                ? "bg-green-600 hover:bg-green-600" 
                : "bg-primary text-primary-foreground"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                שומר...
              </>
            ) : showSuccess ? (
              <>
                <Check className="w-4 h-4 ml-2" />
                נשמר בהצלחה!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                שמירת שינויים
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
