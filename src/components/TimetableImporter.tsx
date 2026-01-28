import { useState, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Upload, 
  FileSpreadsheet, 
  Camera,
  Plus, 
  Trash2, 
  Check, 
  Clock,
  Calendar,
  Info,
  Loader2,
  Table,
  AlertCircle,
  X
} from 'lucide-react';
import { optimizeImage, isImageFile } from '@/utils/imageOptimizer';
import { cn } from '@/lib/utils';
import { Timetable, WeekDay, WEEK_DAYS, WEEK_DAYS_WITH_FRIDAY, WEEK_DAY_LABELS, PeriodInfo } from '@/types/task';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface ParsedPeriod {
  id: string;
  subject: string;
  time: string;
  day: WeekDay;
  selected: boolean;
  autoTime?: boolean; // Flag for auto-filled time (Buff Standard)
}

interface TimetableImporterProps {
  onImport: (timetable: Timetable) => void;
  onClose: () => void;
  currentTimetable: Timetable;
  childName?: string;
  fridayEnabled?: boolean;
}

// Hebrew day name mapping for Excel import
const HEBREW_DAY_MAP: Record<string, WeekDay> = {
  'ראשון': 'sunday', 'א': 'sunday', "א'": 'sunday', 'יום א': 'sunday', 'יום ראשון': 'sunday',
  'שני': 'monday', 'ב': 'monday', "ב'": 'monday', 'יום ב': 'monday', 'יום שני': 'monday',
  'שלישי': 'tuesday', 'ג': 'tuesday', "ג'": 'tuesday', 'יום ג': 'tuesday', 'יום שלישי': 'tuesday',
  'רביעי': 'wednesday', 'ד': 'wednesday', "ד'": 'wednesday', 'יום ד': 'wednesday', 'יום רביעי': 'wednesday',
  'חמישי': 'thursday', 'ה': 'thursday', "ה'": 'thursday', 'יום ה': 'thursday', 'יום חמישי': 'thursday',
  'שישי': 'friday', 'ו': 'friday', "ו'": 'friday', 'יום ו': 'friday', 'יום שישי': 'friday',
  'sunday': 'sunday', 'monday': 'monday', 'tuesday': 'tuesday', 
  'wednesday': 'wednesday', 'thursday': 'thursday', 'friday': 'friday',
};

// Generate default time using "Buff Standard" algorithm
const generateDefaultTime = (lessonIndex: number): string => {
  const LESSON_DURATION = 50;
  const BREAK_DURATION = 20;
  let currentMinutes = 8 * 60;
  for (let i = 0; i < lessonIndex; i++) {
    currentMinutes += LESSON_DURATION;
    if ((i + 1) % 2 === 0) currentMinutes += BREAK_DURATION;
  }
  const hours = Math.floor(currentMinutes / 60);
  const mins = currentMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
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
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  const num = parseFloat(str);
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalMinutes = Math.round(num * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
  if (/^\d{1,2}$/.test(str)) return `${str.padStart(2, '0')}:00`;
  return '';
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// Initialize empty timetable with default times
const createEmptyTimetable = (days: WeekDay[], periodsPerDay: number = 8): Timetable => {
  const timetable: Timetable = {};
  days.forEach(day => {
    timetable[day] = [];
    for (let i = 0; i < periodsPerDay; i++) {
      timetable[day].push({ subject: '', startTime: generateDefaultTime(i) });
    }
  });
  return timetable;
};

export function TimetableImporter({ onImport, onClose, currentTimetable, childName, fridayEnabled = false }: TimetableImporterProps) {
  const displayDays = fridayEnabled ? WEEK_DAYS_WITH_FRIDAY : WEEK_DAYS;
  
  const [mode, setMode] = useState<'choose' | 'manual' | 'file' | 'processing' | 'review'>('choose');
  const [manualTimetable, setManualTimetable] = useState<Timetable>(() => createEmptyTimetable(displayDays));
  const [selectedDay, setSelectedDay] = useState<WeekDay>('sunday');
  const [dragActive, setDragActive] = useState(false);
  
  // Processing state
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Review state
  const [parsedPeriods, setParsedPeriods] = useState<ParsedPeriod[]>([]);
  const [hasAutoFilledTimes, setHasAutoFilledTimes] = useState(false);

  // Cancel processing
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMode('choose');
    setProcessingStatus('');
    setProcessingProgress(0);
  }, []);

  // Process API response into periods
  const processApiResponse = useCallback((tasks: any[]) => {
    const periods: ParsedPeriod[] = [];
    let hasAuto = false;
    
    (tasks || []).forEach((t: any) => {
      const day = (t.day || 'sunday') as WeekDay;
      if (t.autoTime) hasAuto = true;
      periods.push({
        id: generateId(),
        subject: t.title || '',
        time: t.time || '08:00',
        day,
        selected: true,
        autoTime: t.autoTime,
      });
    });
    
    setHasAutoFilledTimes(hasAuto);
    setParsedPeriods(periods);
    setMode('review');
  }, []);

  // Call API for image processing
  const processImage = useCallback(async (file: File) => {
    setMode('processing');
    setProcessingStatus('מכווץ את התמונה...');
    setProcessingProgress(10);
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      // Step 1: Optimize image
      const optimized = await optimizeImage(file);
      console.log(`Image optimized: ${optimized.width}x${optimized.height}, ${(optimized.optimizedSize / 1024).toFixed(1)}KB`);
      
      setProcessingStatus('מחלץ טקסט מהתמונה...');
      setProcessingProgress(30);
      
      // Step 2: Call API
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            imageBase64: optimized.base64,
            fileType: 'image',
          }),
          signal: controller.signal,
        }
      );
      
      setProcessingStatus('מארגן את המערכת...');
      setProcessingProgress(70);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.timeout) {
          toast.error('העיבוד לוקח זמן רב. נסו תמונה ברורה יותר או הזינו ידנית.');
          setMode('choose');
          return;
        }
        throw new Error(errorData.error || `שגיאה: ${response.status}`);
      }
      
      const data = await response.json();
      setProcessingProgress(100);
      
      if (data.tasks && data.tasks.length > 0) {
        processApiResponse(data.tasks);
        toast.success(`נמצאו ${data.tasks.length} שיעורים!`);
      } else {
        toast.error('לא נמצאו שיעורים בתמונה. נסו תמונה אחרת.');
        setMode('choose');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled
        return;
      }
      console.error('Image processing error:', error);
      toast.error(error.message || 'שגיאה בעיבוד התמונה');
      setMode('choose');
    } finally {
      abortControllerRef.current = null;
    }
  }, [processApiResponse]);

  // Process Excel file locally (simple format)
  const processExcelLocally = useCallback(async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);
      
      const periods: ParsedPeriod[] = [];
      const lessonCountByDay: Record<WeekDay, number> = {
        sunday: 0, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0
      };
      let hasAuto = false;
      
      jsonData.forEach((row: any) => {
        const dayValue = row['יום'] || row['day'] || row['Day'] || '';
        const day = parseDay(dayValue);
        if (!day || !displayDays.includes(day)) return;
        
        const subject = row['מקצוע'] || row['subject'] || row['Subject'] || row['שיעור'] || '';
        if (!subject || !subject.toString().trim()) return;
        
        const rawTime = row['שעה'] || row['time'] || row['Time'] || '';
        let time = parseTime(rawTime);
        
        if (!time) {
          time = generateDefaultTime(lessonCountByDay[day]);
          hasAuto = true;
        }
        
        periods.push({
          id: generateId(),
          subject: subject.toString().trim(),
          time,
          day,
          selected: true,
          autoTime: !parseTime(rawTime),
        });
        
        lessonCountByDay[day]++;
      });
      
      if (periods.length === 0) {
        toast.error('לא נמצאו שיעורים בקובץ. ודאו שיש עמודות: יום, שעה, מקצוע');
        return;
      }
      
      // Sort by day and time
      periods.sort((a, b) => {
        const dayOrder = displayDays.indexOf(a.day) - displayDays.indexOf(b.day);
        if (dayOrder !== 0) return dayOrder;
        return a.time.localeCompare(b.time);
      });
      
      setHasAutoFilledTimes(hasAuto);
      setParsedPeriods(periods);
      setMode('review');
      toast.success(`נמצאו ${periods.length} שיעורים!`);
      
    } catch (error) {
      console.error('Excel processing error:', error);
      toast.error('שגיאה בקריאת הקובץ');
    }
  }, [displayDays]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const isImage = isImageFile(file);
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
    
    if (isImage) {
      await processImage(file);
    } else if (isExcel) {
      await processExcelLocally(file);
    } else {
      toast.error('פורמט לא נתמך. נא להעלות תמונה או קובץ אקסל.');
    }
  }, [processImage, processExcelLocally]);

  // Manual timetable handlers
  const handleSubjectChange = (day: WeekDay, index: number, subject: string) => {
    setManualTimetable(prev => ({
      ...prev,
      [day]: prev[day].map((period, i) => i === index ? { ...period, subject } : period),
    }));
  };

  const handleTimeChange = (day: WeekDay, index: number, startTime: string) => {
    setManualTimetable(prev => ({
      ...prev,
      [day]: prev[day].map((period, i) => i === index ? { ...period, startTime } : period),
    }));
  };

  const handleAddLesson = (day: WeekDay) => {
    const currentLessons = manualTimetable[day] || [];
    setManualTimetable(prev => ({
      ...prev,
      [day]: [...prev[day], { subject: '', startTime: generateDefaultTime(currentLessons.length) }],
    }));
  };

  const handleDeleteLesson = (day: WeekDay, index: number) => {
    setManualTimetable(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const handleSaveManual = () => {
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

  // Review handlers
  const updatePeriod = (id: string, updates: Partial<ParsedPeriod>) => {
    setParsedPeriods(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePeriod = (id: string) => {
    setParsedPeriods(prev => prev.filter(p => p.id !== id));
  };

  const togglePeriodSelection = (id: string) => {
    setParsedPeriods(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const handleConfirmImport = () => {
    const selectedPeriods = parsedPeriods.filter(p => p.selected);
    if (selectedPeriods.length === 0) {
      toast.error('נא לבחור לפחות שיעור אחד');
      return;
    }

    const newTimetable: Timetable = {};
    displayDays.forEach(day => { newTimetable[day] = []; });

    const periodsByDay: Partial<Record<WeekDay, ParsedPeriod[]>> = {};
    displayDays.forEach(day => { periodsByDay[day] = []; });

    selectedPeriods.forEach(p => {
      if (periodsByDay[p.day]) periodsByDay[p.day]!.push(p);
    });

    Object.keys(periodsByDay).forEach(day => {
      const weekDay = day as WeekDay;
      const dayPeriods = (periodsByDay[weekDay] || []).sort((a, b) => a.time.localeCompare(b.time));
      newTimetable[weekDay] = dayPeriods.map(period => ({
        subject: period.subject,
        startTime: period.time,
      }));
    });

    onImport(newTimetable);
    toast.success(`יובאו ${selectedPeriods.length} שיעורים בהצלחה!`);
    onClose();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
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
            טעינת מערכת (תמונה/אקסל)
          </h3>
          <p className="text-sm text-muted-foreground">
            בחרו אופן הזנה
            {childName && <span className="text-primary"> עבור {childName}</span>}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode('manual')}
            className={cn(
              "p-6 rounded-xl border-2 border-dashed transition-all text-center",
              "hover:border-primary hover:bg-primary/5 border-border"
            )}
          >
            <Table className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">הזנה ידנית</p>
            <p className="text-xs text-muted-foreground">מלאו את המערכת ישירות</p>
          </button>

          <button
            onClick={() => setMode('file')}
            className={cn(
              "p-6 rounded-xl border-2 border-dashed transition-all text-center",
              "hover:border-primary hover:bg-primary/5 border-border"
            )}
          >
            <div className="flex justify-center gap-2 mb-3">
              <Camera className="w-8 h-8 text-primary" />
              <FileSpreadsheet className="w-8 h-8 text-primary" />
            </div>
            <p className="font-medium text-foreground mb-1">ייבוא מקובץ</p>
            <p className="text-xs text-muted-foreground">תמונה או אקסל</p>
          </button>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
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
            טעינת מערכת (תמונה/אקסל)
          </h3>
          <p className="text-sm text-muted-foreground">
            העלו תמונה של המערכת או קובץ אקסל
          </p>
        </div>

        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
          <div className="flex items-start gap-2 mb-3">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">פורמטים נתמכים:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>תמונה:</strong> JPG, PNG (צילום של המערכת)</li>
                <li><strong>אקסל:</strong> עמודות: יום, שעה, מקצוע</li>
              </ul>
            </div>
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
            dragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-secondary/50"
          )}
        >
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="hidden"
            id="timetable-file-input"
          />
          <label htmlFor="timetable-file-input" className="cursor-pointer">
            <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="font-medium text-foreground mb-2">לחצו כאן או גררו קובץ</p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-full">
                <Camera className="w-3 h-3" /><span>תמונה</span>
              </div>
              <div className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-full">
                <FileSpreadsheet className="w-3 h-3" /><span>אקסל</span>
              </div>
            </div>
          </label>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setMode('choose')}>חזרה</Button>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
        </div>
      </div>
    );
  }

  // Processing Screen
  if (mode === 'processing') {
    return (
      <div className="py-8 text-center space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <Loader2 className="w-20 h-20 animate-spin text-primary" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{processingStatus}</h3>
        </div>

        <div className="max-w-xs mx-auto space-y-2">
          <Progress value={processingProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>התחלה</span>
            <span>{processingProgress}%</span>
            <span>סיום</span>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2">
          <X className="w-4 h-4" />
          ביטול
        </Button>
      </div>
    );
  }

  // Review Screen
  if (mode === 'review') {
    const selectedCount = parsedPeriods.filter(p => p.selected).length;
    const groupedByDay = WEEK_DAYS_WITH_FRIDAY.reduce((acc, day) => {
      acc[day] = parsedPeriods.filter(p => p.day === day);
      return acc;
    }, {} as Record<WeekDay, ParsedPeriod[]>);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">בדיקה ואישור</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCount} מתוך {parsedPeriods.length} שיעורים נבחרו
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMode('choose')}>
            העלאה אחרת
          </Button>
        </div>

        {hasAutoFilledTimes && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              שעות מסומנות בכתום הוזנו אוטומטית (שיטת Buff). ניתן לערוך.
            </p>
          </div>
        )}

        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {parsedPeriods.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                לא נמצאו שיעורים.
              </div>
            ) : (
              WEEK_DAYS_WITH_FRIDAY.map(day => {
                const dayPeriods = groupedByDay[day];
                if (dayPeriods.length === 0) return null;
                
                return (
                  <div key={day} className="space-y-2">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {WEEK_DAY_LABELS[day]}
                      <span className="text-xs text-muted-foreground">
                        ({dayPeriods.filter(p => p.selected).length} נבחרו)
                      </span>
                    </h4>
                    
                    {dayPeriods.sort((a, b) => a.time.localeCompare(b.time)).map((period) => (
                      <div
                        key={period.id}
                        className={cn(
                          "p-3 rounded-xl border transition-all flex items-center gap-3",
                          period.selected ? "bg-card border-primary/50" : "bg-secondary/30 border-border opacity-60"
                        )}
                      >
                        <button
                          onClick={() => togglePeriodSelection(period.id)}
                          className={cn(
                            "w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            period.selected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                          )}
                        >
                          {period.selected && <Check className="w-4 h-4" />}
                        </button>

                        <div className={cn(
                          "flex items-center gap-1 w-24",
                          period.autoTime && "ring-2 ring-amber-500/50 rounded-md"
                        )}>
                          <Clock className={cn("w-4 h-4", period.autoTime ? "text-amber-500" : "text-muted-foreground")} />
                          <Input
                            type="time"
                            value={period.time}
                            onChange={(e) => updatePeriod(period.id, { time: e.target.value, autoTime: false })}
                            className={cn("text-sm h-8", period.autoTime && "border-amber-500/50")}
                          />
                        </div>

                        <Input
                          value={period.subject}
                          onChange={(e) => updatePeriod(period.id, { subject: e.target.value })}
                          className="flex-1"
                          placeholder="שם המקצוע"
                        />

                        <Select
                          value={period.day}
                          onValueChange={(val) => updatePeriod(period.id, { day: val as WeekDay })}
                        >
                          <SelectTrigger className="w-24 text-sm h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WEEK_DAYS_WITH_FRIDAY.map(d => (
                              <SelectItem key={d} value={d}>{WEEK_DAY_LABELS[d]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePeriod(period.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t border-border sticky bottom-0 bg-background">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleConfirmImport} disabled={selectedCount === 0} className="gap-2">
            <Check className="w-4 h-4" />
            שמירת {selectedCount} שיעורים
          </Button>
        </div>
      </div>
    );
  }

  // Manual Entry Screen
  const currentDayLessons = manualTimetable[selectedDay] || [];
  const filledLessons = Object.values(manualTimetable).reduce(
    (sum, lessons) => sum + lessons.filter(l => l.subject.trim()).length, 0
  );

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-1">ניהול מערכת וציוד נדרש</h3>
        <p className="text-sm text-muted-foreground">
          הזינו את השיעורים לכל יום
          {filledLessons > 0 && <span className="text-primary"> ({filledLessons} שיעורים)</span>}
        </p>
      </div>

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

      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-4">
          {currentDayLessons.map((lesson, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border">
              <span className="w-6 h-6 flex items-center justify-center rounded bg-primary/20 text-primary font-bold text-xs flex-shrink-0">
                {index + 1}
              </span>
              <div className="relative w-24 flex-shrink-0">
                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  type="time"
                  value={lesson.startTime}
                  onChange={(e) => handleTimeChange(selectedDay, index, e.target.value)}
                  className="h-8 text-sm pl-7"
                />
              </div>
              <Input
                placeholder="שם המקצוע..."
                value={lesson.subject}
                onChange={(e) => handleSubjectChange(selectedDay, index, e.target.value)}
                className="flex-1 h-8"
              />
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

      <div className="flex justify-between pt-4 border-t border-border sticky bottom-0 bg-background">
        <Button variant="outline" onClick={() => setMode('choose')}>חזרה</Button>
        <Button onClick={handleSaveManual} disabled={filledLessons === 0} className="gap-2">
          <Check className="w-4 h-4" />
          שמירת {filledLessons} שיעורים
        </Button>
      </div>
    </div>
  );
}
