import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { 
  Upload, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Check, 
  Clock,
  Calendar,
  Info,
  Table
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timetable, WeekDay, WEEK_DAYS, WEEK_DAYS_WITH_FRIDAY, WEEK_DAY_LABELS, PeriodInfo } from '@/types/task';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface TimetableImporterProps {
  onImport: (timetable: Timetable) => void;
  onClose: () => void;
  currentTimetable: Timetable;
  childName?: string;
  fridayEnabled?: boolean;
}

// Hebrew day name mapping for Excel import
const HEBREW_DAY_MAP: Record<string, WeekDay> = {
  'ראשון': 'sunday',
  'א': 'sunday',
  'א\'': 'sunday',
  'יום א': 'sunday',
  'יום ראשון': 'sunday',
  'שני': 'monday',
  'ב': 'monday',
  'ב\'': 'monday',
  'יום ב': 'monday',
  'יום שני': 'monday',
  'שלישי': 'tuesday',
  'ג': 'tuesday',
  'ג\'': 'tuesday',
  'יום ג': 'tuesday',
  'יום שלישי': 'tuesday',
  'רביעי': 'wednesday',
  'ד': 'wednesday',
  'ד\'': 'wednesday',
  'יום ד': 'wednesday',
  'יום רביעי': 'wednesday',
  'חמישי': 'thursday',
  'ה': 'thursday',
  'ה\'': 'thursday',
  'יום ה': 'thursday',
  'יום חמישי': 'thursday',
  'שישי': 'friday',
  'ו': 'friday',
  'ו\'': 'friday',
  'יום ו': 'friday',
  'יום שישי': 'friday',
  // English fallbacks
  'sunday': 'sunday',
  'monday': 'monday',
  'tuesday': 'tuesday',
  'wednesday': 'wednesday',
  'thursday': 'thursday',
  'friday': 'friday',
  'sun': 'sunday',
  'mon': 'monday',
  'tue': 'tuesday',
  'wed': 'wednesday',
  'thu': 'thursday',
  'fri': 'friday',
};

// Generate default time using "Buff Standard" algorithm
const generateDefaultTime = (lessonIndex: number): string => {
  const LESSON_DURATION = 50;
  const BREAK_DURATION = 20;
  
  let currentMinutes = 8 * 60; // Start at 08:00
  
  for (let i = 0; i < lessonIndex; i++) {
    currentMinutes += LESSON_DURATION;
    const lessonNumber = i + 1;
    if (lessonNumber % 2 === 0) {
      currentMinutes += BREAK_DURATION;
    }
  }
  
  const hours = Math.floor(currentMinutes / 60);
  const mins = currentMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Initialize empty timetable with default times
const createEmptyTimetable = (days: WeekDay[], periodsPerDay: number = 8): Timetable => {
  const timetable: Timetable = {};
  days.forEach(day => {
    timetable[day] = [];
    for (let i = 0; i < periodsPerDay; i++) {
      timetable[day].push({
        subject: '',
        startTime: generateDefaultTime(i),
      });
    }
  });
  return timetable;
};

// Parse day from various formats
const parseDay = (value: string): WeekDay | null => {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  return HEBREW_DAY_MAP[normalized] || HEBREW_DAY_MAP[value.trim()] || null;
};

// Parse time from various formats
const parseTime = (value: string | number): string => {
  if (!value) return '';
  
  const str = value.toString().trim();
  
  // Already HH:MM format
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  
  // Excel decimal time (e.g., 0.333 = 8:00)
  const num = parseFloat(str);
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalMinutes = Math.round(num * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
  
  // Just hours (e.g., "8" or "14")
  if (/^\d{1,2}$/.test(str)) {
    return `${str.padStart(2, '0')}:00`;
  }
  
  return '';
};

export function TimetableImporter({ onImport, onClose, currentTimetable, childName, fridayEnabled = false }: TimetableImporterProps) {
  const displayDays = fridayEnabled ? WEEK_DAYS_WITH_FRIDAY : WEEK_DAYS;
  
  const [mode, setMode] = useState<'choose' | 'manual' | 'file'>('choose');
  const [manualTimetable, setManualTimetable] = useState<Timetable>(() => createEmptyTimetable(displayDays));
  const [selectedDay, setSelectedDay] = useState<WeekDay>('sunday');
  const [dragActive, setDragActive] = useState(false);

  // Handle Excel/CSV file upload
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const isCSV = file.name.endsWith('.csv');
      
      if (!isExcel && !isCSV) {
        toast.error('נא להעלות קובץ אקסל (xlsx) או CSV');
        return;
      }

      let jsonData: any[];
      
      if (isCSV) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        jsonData = lines.slice(1).map(line => {
          const values = line.split(',');
          const row: Record<string, string> = {};
          headers.forEach((header, i) => {
            row[header] = values[i]?.trim() || '';
          });
          return row;
        });
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(firstSheet);
      }

      // Parse the data into timetable format
      const newTimetable: Timetable = {};
      displayDays.forEach(day => {
        newTimetable[day] = [];
      });

      // Track lessons per day for default time assignment
      const lessonCountByDay: Record<WeekDay, number> = {
        sunday: 0, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0
      };

      jsonData.forEach((row: any) => {
        // Try to find day column (יום, day, Day)
        const dayValue = row['יום'] || row['day'] || row['Day'] || row['יום בשבוע'] || '';
        const day = parseDay(dayValue);
        
        if (!day || !displayDays.includes(day)) return;
        
        // Try to find subject column (מקצוע, subject, Subject)
        const subject = row['מקצוע'] || row['subject'] || row['Subject'] || row['שיעור'] || row['lesson'] || '';
        if (!subject || !subject.toString().trim()) return;
        
        // Try to find time column (שעה, time, Time)
        const rawTime = row['שעה'] || row['time'] || row['Time'] || row['שעת התחלה'] || row['start_time'] || '';
        let time = parseTime(rawTime);
        
        // If no time, use Buff Standard default
        if (!time) {
          time = generateDefaultTime(lessonCountByDay[day]);
        }
        
        newTimetable[day].push({
          subject: subject.toString().trim(),
          startTime: time,
        });
        
        lessonCountByDay[day]++;
      });

      // Sort each day by time
      displayDays.forEach(day => {
        newTimetable[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
      });

      const totalLessons = Object.values(newTimetable).reduce((sum, lessons) => sum + lessons.length, 0);
      
      if (totalLessons === 0) {
        toast.error('לא נמצאו שיעורים בקובץ. ודאו שיש עמודות: יום, שעה, מקצוע');
        return;
      }

      onImport(newTimetable);
      toast.success(`יובאו ${totalLessons} שיעורים בהצלחה!`);
      onClose();
      
    } catch (error) {
      console.error('File import error:', error);
      toast.error('שגיאה בקריאת הקובץ');
    }
  }, [displayDays, onImport, onClose]);

  // Manual timetable handlers
  const handleSubjectChange = (day: WeekDay, index: number, subject: string) => {
    setManualTimetable(prev => ({
      ...prev,
      [day]: prev[day].map((period, i) => 
        i === index ? { ...period, subject } : period
      ),
    }));
  };

  const handleTimeChange = (day: WeekDay, index: number, startTime: string) => {
    setManualTimetable(prev => ({
      ...prev,
      [day]: prev[day].map((period, i) => 
        i === index ? { ...period, startTime } : period
      ),
    }));
  };

  const handleAddLesson = (day: WeekDay) => {
    const currentLessons = manualTimetable[day] || [];
    const lastLesson = currentLessons[currentLessons.length - 1];
    const nextTime = lastLesson 
      ? generateDefaultTime(currentLessons.length)
      : '08:00';
    
    setManualTimetable(prev => ({
      ...prev,
      [day]: [...prev[day], { subject: '', startTime: nextTime }],
    }));
  };

  const handleDeleteLesson = (day: WeekDay, index: number) => {
    setManualTimetable(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const handleSaveManual = () => {
    // Filter out empty subjects
    const filtered: Timetable = {};
    displayDays.forEach(day => {
      filtered[day] = (manualTimetable[day] || []).filter(p => p.subject.trim());
    });
    
    const totalLessons = Object.values(filtered).reduce((sum, lessons) => sum + lessons.length, 0);
    
    if (totalLessons === 0) {
      toast.error('נא להזין לפחות שיעור אחד');
      return;
    }

    onImport(filtered);
    toast.success(`נשמרו ${totalLessons} שיעורים בהצלחה!`);
    onClose();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Choose Mode Screen
  if (mode === 'choose') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            הוספת מערכת שעות
          </h3>
          <p className="text-sm text-muted-foreground">
            בחרו אופן הזנה
            {childName && <span className="text-primary"> עבור {childName}</span>}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Manual Entry Option */}
          <button
            onClick={() => setMode('manual')}
            className={cn(
              "p-6 rounded-xl border-2 border-dashed transition-all text-center",
              "hover:border-primary hover:bg-primary/5",
              "border-border"
            )}
          >
            <Table className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">הזנה ידנית</p>
            <p className="text-xs text-muted-foreground">
              מלאו את המערכת ישירות
            </p>
          </button>

          {/* File Upload Option */}
          <button
            onClick={() => setMode('file')}
            className={cn(
              "p-6 rounded-xl border-2 border-dashed transition-all text-center",
              "hover:border-primary hover:bg-primary/5",
              "border-border"
            )}
          >
            <FileSpreadsheet className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">ייבוא מקובץ</p>
            <p className="text-xs text-muted-foreground">
              אקסל או CSV
            </p>
          </button>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
        </div>
      </div>
    );
  }

  // File Upload Screen
  if (mode === 'file') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            ייבוא מקובץ אקסל/CSV
          </h3>
          <p className="text-sm text-muted-foreground">
            הכינו קובץ עם 3 עמודות: יום, שעה, מקצוע
          </p>
        </div>

        {/* Format Example */}
        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
          <div className="flex items-start gap-2 mb-3">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              דוגמה לפורמט הקובץ:
            </p>
          </div>
          <div className="bg-background rounded-md p-3 font-mono text-xs overflow-x-auto">
            <table className="w-full text-foreground">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right p-1 font-semibold">יום</th>
                  <th className="text-right p-1 font-semibold">שעה</th>
                  <th className="text-right p-1 font-semibold">מקצוע</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr><td className="p-1">ראשון</td><td className="p-1">08:00</td><td className="p-1">מתמטיקה</td></tr>
                <tr><td className="p-1">ראשון</td><td className="p-1">08:50</td><td className="p-1">אנגלית</td></tr>
                <tr><td className="p-1">שני</td><td className="p-1">08:00</td><td className="p-1">עברית</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
            dragActive 
              ? "border-primary bg-primary/10" 
              : "border-border hover:border-primary/50 hover:bg-secondary/50"
          )}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="hidden"
            id="timetable-file-input"
          />
          <label htmlFor="timetable-file-input" className="cursor-pointer">
            <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="font-medium text-foreground mb-2">
              לחצו כאן או גררו קובץ
            </p>
            <p className="text-sm text-muted-foreground">
              תומך ב-XLSX, XLS ו-CSV
            </p>
          </label>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setMode('choose')}>
            חזרה
          </Button>
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
        </div>
      </div>
    );
  }

  // Manual Entry Screen
  const currentDayLessons = manualTimetable[selectedDay] || [];
  const filledLessons = Object.values(manualTimetable).reduce(
    (sum, lessons) => sum + lessons.filter(l => l.subject.trim()).length, 
    0
  );

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          הזנה ידנית של מערכת
        </h3>
        <p className="text-sm text-muted-foreground">
          הזינו את השיעורים לכל יום
          {filledLessons > 0 && (
            <span className="text-primary"> ({filledLessons} שיעורים הוזנו)</span>
          )}
        </p>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg overflow-x-auto">
        {displayDays.map(day => {
          const dayLessonCount = (manualTimetable[day] || []).filter(l => l.subject.trim()).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "flex-1 min-w-[50px] py-2 px-2 rounded-md text-sm font-medium transition-colors relative",
                selectedDay === day
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {WEEK_DAY_LABELS[day]}
              {dayLessonCount > 0 && (
                <span className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center",
                  selectedDay === day ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
                )}>
                  {dayLessonCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lessons Grid */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-4">
          {currentDayLessons.map((lesson, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border"
            >
              {/* Lesson Number */}
              <span className="w-6 h-6 flex items-center justify-center rounded bg-primary/20 text-primary font-bold text-xs flex-shrink-0">
                {index + 1}
              </span>

              {/* Time Input */}
              <div className="relative w-24 flex-shrink-0">
                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  type="time"
                  value={lesson.startTime}
                  onChange={(e) => handleTimeChange(selectedDay, index, e.target.value)}
                  className="h-8 text-sm pl-7"
                />
              </div>

              {/* Subject Input */}
              <Input
                placeholder="שם המקצוע..."
                value={lesson.subject}
                onChange={(e) => handleSubjectChange(selectedDay, index, e.target.value)}
                className="flex-1 h-8"
              />

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteLesson(selectedDay, index)}
                className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {/* Add Lesson Button */}
          <Button
            variant="outline"
            onClick={() => handleAddLesson(selectedDay)}
            className="w-full gap-2 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50 h-10"
          >
            <Plus className="w-4 h-4" />
            הוספת שיעור
          </Button>
        </div>
      </ScrollArea>

      {/* Action Buttons - Always Visible */}
      <div className="flex justify-between pt-4 border-t border-border sticky bottom-0 bg-background">
        <Button variant="outline" onClick={() => setMode('choose')}>
          חזרה
        </Button>
        <Button 
          onClick={handleSaveManual}
          disabled={filledLessons === 0}
          className="gap-2"
        >
          <Check className="w-4 h-4" />
          שמירת {filledLessons} שיעורים
        </Button>
      </div>
    </div>
  );
}
