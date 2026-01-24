import { Timetable, WEEK_DAYS, WEEK_DAY_LABELS, WeekDay, PeriodInfo } from '@/types/task';
import { Clock, BookOpen, Settings2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { TimetableEditor } from './TimetableEditor';

interface WeeklyTimetableProps {
  timetable: Timetable;
  onUpdateTimetable: (timetable: Timetable) => void;
}

export function WeeklyTimetable({ timetable, onUpdateTimetable }: WeeklyTimetableProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<WeekDay>(() => {
    const dayIndex = new Date().getDay();
    // Default to today if it's a school day, otherwise Sunday
    if (dayIndex >= 0 && dayIndex <= 4) {
      return WEEK_DAYS[dayIndex];
    }
    return 'sunday';
  });
  
  // Inline editing state
  const [editingPeriod, setEditingPeriod] = useState<{ day: WeekDay; index: number } | null>(null);
  const [editingSubject, setEditingSubject] = useState('');
  const [editingTime, setEditingTime] = useState('');

  const todayIndex = new Date().getDay();
  const isToday = (day: WeekDay) => WEEK_DAYS.indexOf(day) === todayIndex;

  const selectedSchedule = timetable[selectedDay] || [];

  const handleStartEdit = (day: WeekDay, index: number, period: PeriodInfo) => {
    setEditingPeriod({ day, index });
    setEditingSubject(period.subject);
    setEditingTime(period.startTime);
  };

  const handleSaveEdit = () => {
    if (!editingPeriod) return;

    const updatedTimetable = { ...timetable };
    const daySchedule = [...(updatedTimetable[editingPeriod.day] || [])];
    
    if (daySchedule[editingPeriod.index]) {
      daySchedule[editingPeriod.index] = {
        subject: editingSubject,
        startTime: editingTime,
      };
      updatedTimetable[editingPeriod.day] = daySchedule;
      onUpdateTimetable(updatedTimetable);
    }
    
    setEditingPeriod(null);
  };

  const handleCancelEdit = () => {
    setEditingPeriod(null);
    setEditingSubject('');
    setEditingTime('');
  };

  const handleAddPeriod = () => {
    const updatedTimetable = { ...timetable };
    const daySchedule = [...(updatedTimetable[selectedDay] || [])];
    
    // Find the next available time slot
    const lastPeriod = daySchedule[daySchedule.length - 1];
    const nextTime = lastPeriod 
      ? incrementTime(lastPeriod.startTime, 50) 
      : '08:00';
    
    daySchedule.push({ subject: '', startTime: nextTime });
    updatedTimetable[selectedDay] = daySchedule;
    
    // Start editing the new period
    setEditingPeriod({ day: selectedDay, index: daySchedule.length - 1 });
    setEditingSubject('');
    setEditingTime(nextTime);
    
    onUpdateTimetable(updatedTimetable);
  };

  const handleDeletePeriod = (index: number) => {
    const updatedTimetable = { ...timetable };
    const daySchedule = [...(updatedTimetable[selectedDay] || [])];
    daySchedule.splice(index, 1);
    updatedTimetable[selectedDay] = daySchedule;
    onUpdateTimetable(updatedTimetable);
  };

  return (
    <div className="space-y-4">
      {/* Day Selector */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl">
        {WEEK_DAYS.map((day) => {
          const isActive = selectedDay === day;
          const isTodayDay = isToday(day);
          const daySchedule = timetable[day] || [];
          const lessonCount = daySchedule.filter(p => p.subject).length;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "relative flex-1 py-3 px-2 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-card shadow-md"
                  : "hover:bg-secondary/80",
                isTodayDay && !isActive && "ring-1 ring-primary/30"
              )}
            >
              {isTodayDay && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
              <div className="text-center">
                <span className={cn(
                  "text-sm font-medium block",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {WEEK_DAY_LABELS[day]}
                </span>
                <span className={cn(
                  "text-xs",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {lessonCount} lessons
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Schedule for Selected Day */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground capitalize">{selectedDay}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedSchedule.filter(p => p.subject).length} lessons scheduled
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddPeriod}
                className="gap-1.5"
              >
                + Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditorOpen(true)}
                className="gap-1.5"
              >
                <Settings2 className="w-4 h-4" />
                Edit All
              </Button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {selectedSchedule.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No schedule set for this day</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddPeriod}
                className="mt-4"
              >
                + Add First Period
              </Button>
            </div>
          ) : (
            selectedSchedule.map((period, index) => {
              const isEditing = editingPeriod?.day === selectedDay && editingPeriod?.index === index;
              
              if (isEditing) {
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-primary/5"
                  >
                    {/* Period Number */}
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                    </div>

                    {/* Time Input */}
                    <div className="flex items-center gap-1.5 w-24">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="time"
                        value={editingTime}
                        onChange={(e) => setEditingTime(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Subject Input */}
                    <Input
                      value={editingSubject}
                      onChange={(e) => setEditingSubject(e.target.value)}
                      placeholder="Subject name"
                      className="flex-1 h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSaveEdit}
                        className="h-8 w-8 text-primary"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancelEdit}
                        className="h-8 w-8 text-muted-foreground"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  onClick={() => handleStartEdit(selectedDay, index, period)}
                  className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer group"
                >
                  {/* Period Number */}
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1.5 text-muted-foreground w-16">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-sm font-medium">{period.startTime}</span>
                  </div>

                  {/* Subject */}
                  <div className="flex-1">
                    <span className={cn(
                      "font-medium",
                      period.subject ? "text-foreground" : "text-muted-foreground italic"
                    )}>
                      {period.subject || 'Click to add subject...'}
                    </span>
                  </div>

                  {/* Delete button (visible on hover) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePeriod(index);
                    }}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Full Week Overview (compact) */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Week Overview</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 px-1 text-muted-foreground font-medium w-12">Time</th>
                {WEEK_DAYS.map(day => (
                  <th 
                    key={day} 
                    className={cn(
                      "text-center py-2 px-1 font-medium",
                      isToday(day) ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {WEEK_DAY_LABELS[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Get all unique times across all days */}
              {getAllUniqueTimes(timetable).map((time, idx) => (
                <tr key={idx} className="border-t border-border/50">
                  <td className="py-2 px-1 text-muted-foreground font-medium">{time}</td>
                  {WEEK_DAYS.map(day => {
                    const period = (timetable[day] || []).find(p => p.startTime === time);
                    return (
                      <td 
                        key={day} 
                        className={cn(
                          "text-center py-2 px-1",
                          isToday(day) ? "bg-primary/5" : "",
                          period?.subject ? "text-foreground" : "text-muted-foreground/50"
                        )}
                      >
                        <span className="line-clamp-1">
                          {period?.subject ? truncateSubject(period.subject) : '-'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timetable Editor Dialog */}
      <TimetableEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        timetable={timetable}
        onSave={onUpdateTimetable}
      />
    </div>
  );
}

// Helper to increment time by minutes
function incrementTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

// Helper to get all unique times across the week
function getAllUniqueTimes(timetable: Timetable): string[] {
  const times = new Set<string>();
  WEEK_DAYS.forEach(day => {
    (timetable[day] || []).forEach(period => {
      if (period.subject) {
        times.add(period.startTime);
      }
    });
  });
  return Array.from(times).sort();
}

// Helper to truncate long subject names for the overview
function truncateSubject(subject: string): string {
  const abbrevMap: Record<string, string> = {
    'Chemistry / Physics': 'Chem/Phys',
    'Hebrew Grammar': 'Hebrew',
    'Bible Studies': 'Bible',
    'Ramon Program': 'Ramon',
    'Self Study': 'Study',
    'Literature': 'Lit',
    'Physical Education': 'P.E.',
  };
  return abbrevMap[subject] || (subject.length > 8 ? subject.slice(0, 7) + '.' : subject);
}
