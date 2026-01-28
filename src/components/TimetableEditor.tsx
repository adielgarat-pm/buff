import { useEffect, useState } from 'react';
import { Timetable, WEEK_DAYS, WEEK_DAYS_WITH_FRIDAY, WEEK_DAY_LABELS, WeekDay } from '@/types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Save, Clock, Backpack } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';

interface TimetableEditorProps {
  open: boolean;
  onClose: () => void;
  timetable: Timetable;
  onSave: (timetable: Timetable) => void;
  fridayEnabled?: boolean;
}

const DEFAULT_PERIOD_TIMES = [
  '08:00', '08:50', '09:40', '10:40', '11:30', '12:20', '13:10', '14:00', '14:50', '15:40'
];

const PERIOD_LABELS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳', 'י׳'];

const buildInitialTimetable = (timetable: Timetable, includeFriday: boolean): Timetable => {
  const initial: Timetable = {};
  const days = includeFriday ? WEEK_DAYS_WITH_FRIDAY : WEEK_DAYS;
  days.forEach(day => {
    initial[day] = timetable[day] || DEFAULT_PERIOD_TIMES.map((time) => ({
      subject: '',
      startTime: time,
      equipment: '',
    }));
  });
  return initial;
};

export function TimetableEditor({ open, onClose, timetable, onSave, fridayEnabled = false }: TimetableEditorProps) {
  const displayDays = fridayEnabled ? WEEK_DAYS_WITH_FRIDAY : WEEK_DAYS;
  const [localTimetable, setLocalTimetable] = useState<Timetable>(() => buildInitialTimetable(timetable, fridayEnabled));

  const [selectedDay, setSelectedDay] = useState<WeekDay>('sunday');

  // Dialog remains mounted; re-sync when (re)opened so it reflects saved data.
  useEffect(() => {
    if (!open) return;
    setLocalTimetable(buildInitialTimetable(timetable, fridayEnabled));
    setSelectedDay('sunday');
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

  const handleSave = () => {
    onSave(localTimetable);
    onClose();
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
            {localTimetable[selectedDay]?.map((period, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-secondary/30 border border-border space-y-2"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
                    {PERIOD_LABELS_HE[index] || index + 1}
                  </span>
                  <Label className="text-foreground font-medium">שיעור {PERIOD_LABELS_HE[index] || index + 1}</Label>
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
            ))}
          </div>
        </ScrollArea>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">
            <Save className="w-4 h-4 ml-2" />
            שמור מערכת
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
