import { useEffect, useState } from 'react';
import { Timetable, WEEK_DAYS, WEEK_DAY_LABELS } from '@/types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Save, Clock } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface TimetableEditorProps {
  open: boolean;
  onClose: () => void;
  timetable: Timetable;
  onSave: (timetable: Timetable) => void;
}

const DEFAULT_PERIOD_TIMES = [
  '08:00', '08:50', '09:40', '10:40', '11:30', '12:20', '13:10', '14:00'
];

const buildInitialTimetable = (timetable: Timetable): Timetable => {
  const initial: Timetable = {};
  WEEK_DAYS.forEach(day => {
    initial[day] = timetable[day] || DEFAULT_PERIOD_TIMES.map((time) => ({
      subject: '',
      startTime: time,
    }));
  });
  return initial;
};

export function TimetableEditor({ open, onClose, timetable, onSave }: TimetableEditorProps) {
  const [localTimetable, setLocalTimetable] = useState<Timetable>(() => buildInitialTimetable(timetable));

  const [selectedDay, setSelectedDay] = useState<string>('sunday');

  // Dialog remains mounted; re-sync when (re)opened so it reflects saved data.
  useEffect(() => {
    if (!open) return;
    setLocalTimetable(buildInitialTimetable(timetable));
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

  const handleSave = () => {
    onSave(localTimetable);
    onClose();
  };

  const handleApplyToAll = (periodIndex: number) => {
    const currentSubject = localTimetable[selectedDay][periodIndex].subject;
    const currentTime = localTimetable[selectedDay][periodIndex].startTime;
    
    setLocalTimetable(prev => {
      const updated = { ...prev };
      WEEK_DAYS.forEach(day => {
        updated[day] = updated[day].map((period, i) =>
          i === periodIndex ? { ...period, startTime: currentTime } : period
        );
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
          <DialogTitle className="text-foreground">Weekly Timetable</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set your subjects and lesson times for each day.
          </DialogDescription>
        </DialogHeader>

        {/* Day Tabs */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
          {WEEK_DAYS.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
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
                    P{index + 1}
                  </span>
                  <Label className="text-foreground font-medium">Period {index + 1}</Label>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">Subject</Label>
                    <Input
                      placeholder="e.g., Math, English..."
                      value={period.subject}
                      onChange={(e) => handleSubjectChange(index, e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs text-muted-foreground mb-1 block">Start Time</Label>
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
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleApplyToAll(index)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Apply time to all days
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">
            <Save className="w-4 h-4 mr-2" />
            Save Timetable
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
