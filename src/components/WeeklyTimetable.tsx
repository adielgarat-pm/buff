import { Timetable, WEEK_DAYS, WEEK_DAYS_WITH_FRIDAY, WEEK_DAY_LABELS, WEEK_DAY_LABELS_EN, WeekDay, PeriodInfo } from '@/types/task';
import { Clock, BookOpen, Settings2, Check, X, Backpack } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { TimetableEditor } from './TimetableEditor';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';

interface WeeklyTimetableProps {
  timetable: Timetable;
  onUpdateTimetable: (timetable: Timetable) => void;
  fridayEnabled?: boolean;
  isParentView?: boolean;
}

export function WeeklyTimetable({ timetable, onUpdateTimetable, fridayEnabled = false, isParentView = false }: WeeklyTimetableProps) {
  const { t, language } = useLanguage();
  const [editorOpen, setEditorOpen] = useState(false);
  const dayLabels = language === 'he' ? WEEK_DAY_LABELS : WEEK_DAY_LABELS_EN;
  
  const displayDays = useMemo(() => fridayEnabled ? WEEK_DAYS_WITH_FRIDAY : WEEK_DAYS, [fridayEnabled]);
  
  const [selectedDay, setSelectedDay] = useState<WeekDay>(() => {
    const dayIndex = new Date().getDay();
    if (dayIndex >= 0 && dayIndex <= 4) {
      return WEEK_DAYS[dayIndex];
    }
    if (dayIndex === 5 && fridayEnabled) {
      return 'friday';
    }
    return 'sunday';
  });
  
  const [editingPeriod, setEditingPeriod] = useState<{ day: WeekDay; index: number } | null>(null);
  const [editingSubject, setEditingSubject] = useState('');
  const [editingTime, setEditingTime] = useState('');
  const [editingEquipment, setEditingEquipment] = useState('');

  const todayIndex = new Date().getDay();
  const isToday = (day: WeekDay) => {
    const dayIdx = displayDays.indexOf(day);
    return dayIdx === todayIndex;
  };

  const selectedSchedule = timetable[selectedDay] || [];
  const displaySchedule = selectedSchedule.filter(p => p.subject && p.subject.trim() !== '');

  const handleStartEdit = (day: WeekDay, index: number, period: PeriodInfo) => {
    setEditingPeriod({ day, index });
    setEditingSubject(period.subject);
    setEditingTime(period.startTime);
    setEditingEquipment(period.equipment || '');
  };

  const handleSaveEdit = () => {
    if (!editingPeriod) return;
    const updatedTimetable = { ...timetable };
    const daySchedule = [...(updatedTimetable[editingPeriod.day] || [])];
    if (daySchedule[editingPeriod.index]) {
      daySchedule[editingPeriod.index] = {
        subject: editingSubject,
        startTime: editingTime,
        equipment: editingEquipment || undefined,
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
    setEditingEquipment('');
  };

  const handleAddPeriod = () => {
    const updatedTimetable = { ...timetable };
    const daySchedule = [...(updatedTimetable[selectedDay] || [])];
    const lastPeriod = daySchedule[daySchedule.length - 1];
    const nextTime = lastPeriod 
      ? incrementTime(lastPeriod.startTime, 50) 
      : '08:00';
    daySchedule.push({ subject: '', startTime: nextTime, equipment: '' });
    updatedTimetable[selectedDay] = daySchedule;
    const newIndex = daySchedule.length - 1;
    setEditingPeriod({ day: selectedDay, index: newIndex });
    setEditingSubject('');
    setEditingTime(nextTime);
    setEditingEquipment('');
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
    <div className="space-y-4 tab-content">
      {/* Day Selector */}
      <div className="flex gap-1.5 p-1.5 bg-secondary/50 rounded-2xl overflow-x-auto no-scrollbar">
        {displayDays.map((day) => {
          const isActive = selectedDay === day;
          const isTodayDay = isToday(day);
          const daySchedule = timetable[day] || [];
          const lessonCount = daySchedule.filter(p => p.subject).length;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "relative flex-1 min-w-[60px] py-3 px-2 rounded-xl transition-all duration-200",
                "touch-feedback active:scale-95",
                isActive
                  ? "bg-card shadow-md"
                  : "active:bg-secondary/80",
                isTodayDay && !isActive && "ring-1 ring-primary/30"
              )}
            >
              {isTodayDay && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
              )}
              <div className="text-center">
                <span className={cn(
                  "text-sm font-semibold block",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {dayLabels[day]}
                </span>
                <span className={cn(
                  "text-[11px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {lessonCount} {t('timetable.lessons')}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Schedule for Selected Day */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/20">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground capitalize">{dayLabels[selectedDay]}</h3>
                <p className="text-xs text-muted-foreground">
                  {displaySchedule.length} {t('timetable.plannedLessons')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddPeriod}
                className="gap-1.5 h-10 px-3 touch-target rounded-xl"
              >
                {t('timetable.add')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditorOpen(true)}
                className="gap-1.5 h-10 px-3 touch-target rounded-xl"
              >
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('timetable.editAll')}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {displaySchedule.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>{t('timetable.noLessons')}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddPeriod}
                className="mt-4 gap-2"
              >
                {t('timetable.addFirst')}
              </Button>
            </div>
          ) : (
            displaySchedule.map((period, index) => {
              const originalIndex = selectedSchedule.findIndex(
                p => p.subject === period.subject && p.startTime === period.startTime
              );
              const isEditing = editingPeriod?.day === selectedDay && editingPeriod?.index === originalIndex;
              
              if (isEditing) {
                return (
                  <div
                    key={`editing-${originalIndex}`}
                    className="p-3 bg-primary/5 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 w-24">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          type="time"
                          value={editingTime}
                          onChange={(e) => setEditingTime(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <Input
                        value={editingSubject}
                        onChange={(e) => setEditingSubject(e.target.value)}
                        placeholder={t('timetable.subjectPlaceholder')}
                        className="flex-1 h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={handleSaveEdit} className="h-8 w-8 text-primary">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-8 w-8 text-muted-foreground">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mr-11">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Backpack className="w-3 h-3" />
                        {t('timetable.equipmentRequired')}
                      </div>
                      <Textarea
                        value={editingEquipment}
                        onChange={(e) => setEditingEquipment(e.target.value)}
                        placeholder={t('timetable.equipmentPlaceholder')}
                        className="min-h-[50px] text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`${period.startTime}-${period.subject}`}
                  onClick={() => handleStartEdit(selectedDay, originalIndex, period)}
                  className="flex items-center gap-3 sm:gap-4 p-4 active:bg-secondary/50 transition-colors cursor-pointer group touch-feedback"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground w-14 sm:w-16 flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-sm font-medium">{period.startTime}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "font-medium block truncate",
                      period.subject ? "text-foreground" : "text-muted-foreground italic"
                    )}>
                      {period.subject || t('timetable.clickToAdd')}
                    </span>
                  </div>
                  {period.equipment && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          className="h-10 w-10 text-buff hover:text-buff/80 flex-shrink-0"
                        >
                          <Backpack className="w-5 h-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="end">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Backpack className="w-4 h-4 text-buff" />
                            {t('timetable.equipmentRequired')}
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {period.equipment}
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePeriod(originalIndex);
                    }}
                    className="h-10 w-10 text-destructive/70 active:text-destructive touch-target flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Full Week Overview */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">{t('timetable.weekOverview')}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 px-1 text-muted-foreground font-medium w-12">{t('timetable.time')}</th>
                {displayDays.map(day => (
                  <th 
                    key={day} 
                    className={cn(
                      "text-center py-2 px-1 font-medium",
                      isToday(day) ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {dayLabels[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getAllUniqueTimes(timetable, displayDays).map((time, idx) => (
                <tr key={idx} className="border-t border-border/50">
                  <td className="py-2 px-1 text-muted-foreground font-medium">{time}</td>
                  {displayDays.map(day => {
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

      <TimetableEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        timetable={timetable}
        onSave={onUpdateTimetable}
        fridayEnabled={fridayEnabled}
      />
    </div>
  );
}

function incrementTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

function getAllUniqueTimes(timetable: Timetable, days: WeekDay[]): string[] {
  const times = new Set<string>();
  days.forEach(day => {
    (timetable[day] || []).forEach(p => {
      if (p.subject) times.add(p.startTime);
    });
  });
  return Array.from(times).sort();
}

function truncateSubject(subject: string): string {
  return subject.length > 6 ? subject.slice(0, 5) + '…' : subject;
}
