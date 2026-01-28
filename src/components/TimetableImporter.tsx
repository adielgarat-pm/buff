import { useState, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { 
  Upload, 
  FileSpreadsheet, 
  Camera,
  Zap, 
  Trash2, 
  Check, 
  Loader2, 
  Clock,
  Calendar,
  Info,
  RefreshCw,
  X
} from 'lucide-react';
import { optimizeImage, isImageFile } from '@/utils/imageOptimizer';
import { cn } from '@/lib/utils';
import { Timetable, WeekDay, WEEK_DAYS, WEEK_DAYS_WITH_FRIDAY, WEEK_DAY_LABELS, PeriodInfo } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface ParsedPeriod {
  id: string;
  subject: string;
  time: string;
  day: WeekDay;
  selected: boolean;
}

interface TimetableImporterProps {
  onImport: (timetable: Timetable) => void;
  onClose: () => void;
  currentTimetable: Timetable;
  childName?: string;
  fridayEnabled?: boolean;
}

// Generate default times using the "Buff Standard" algorithm (DYNAMIC - NO LESSON LIMIT):
// - Lesson 1 starts at 08:00
// - Each lesson is 50 minutes
// - 20-minute break after every 2nd lesson (after lessons 2, 4, 6, etc.)
// This function works for ANY number of lessons (3, 7, 10, 15+)
// Expected sequence:
//   Lesson 1: 08:00-08:50, Lesson 2: 08:50-09:40, [break], Lesson 3: 10:00-10:50, etc.
const generateDefaultTime = (lessonIndex: number): { startTime: string; endTime: string } => {
  const LESSON_DURATION = 50; // minutes
  const BREAK_DURATION = 20; // minutes after every 2nd lesson
  
  let currentMinutes = 8 * 60; // Start at 08:00
  
  // Calculate cumulative time based on previous lessons
  for (let i = 0; i < lessonIndex; i++) {
    // Add the lesson duration
    currentMinutes += LESSON_DURATION;
    
    // Add a break after every 2nd lesson (i.e., after lesson indices 1, 3, 5... which are lessons 2, 4, 6)
    // This means: after lesson 2 (i=1), after lesson 4 (i=3), after lesson 6 (i=5), etc.
    const lessonNumber = i + 1; // Convert 0-indexed to 1-indexed
    if (lessonNumber % 2 === 0) {
      currentMinutes += BREAK_DURATION;
    }
  }
  
  const startHours = Math.floor(currentMinutes / 60);
  const startMins = currentMinutes % 60;
  const endMinutes = currentMinutes + LESSON_DURATION;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  
  return {
    startTime: `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`,
    endTime: `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`,
  };
};

// Check if a time value is missing/invalid
const isMissingTime = (time: string | undefined | null): boolean => {
  if (!time) return true;
  const trimmed = time.trim();
  if (trimmed === '' || trimmed === '00:00' || trimmed === 'null') return true;
  // Check if it's a valid HH:MM format
  return !/^\d{1,2}:\d{2}$/.test(trimmed);
};

export function TimetableImporter({ onImport, onClose, currentTimetable, childName, fridayEnabled = false }: TimetableImporterProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [parsedPeriods, setParsedPeriods] = useState<ParsedPeriod[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [defaultTimesApplied, setDefaultTimesApplied] = useState(false);
  
  // Progress tracking state
  const [processingStatus, setProcessingStatus] = useState<'optimizing' | 'uploading' | 'analyzing' | 'parsing'>('optimizing');
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(2);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Determine which days to display based on Friday setting
  const displayDays = fridayEnabled ? WEEK_DAYS_WITH_FRIDAY : WEEK_DAYS;

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Cancel current processing
  const handleCancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStep('upload');
    setIsProcessing(false);
    setRetryCount(0);
    setProcessingStatus('optimizing');
  }, []);

  // Process parsed tasks into periods with default times
  const processTasksIntoPeriods = useCallback((tasks: any[]) => {
    // Group tasks by day to apply default times per-day
    const tasksByDay: Record<string, any[]> = {};
    (tasks || []).forEach((t: any) => {
      const day = t.day || 'sunday';
      if (!tasksByDay[day]) tasksByDay[day] = [];
      tasksByDay[day].push(t);
    });

    let appliedDefaults = false;
    const periods: ParsedPeriod[] = [];
    
    // Process each day and apply default times if missing
    Object.entries(tasksByDay).forEach(([day, dayTasks]) => {
      // Sort by existing time if available
      dayTasks.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      
      dayTasks.forEach((t, index) => {
        let time = t.time;
        
        // Apply default time if missing
        if (isMissingTime(time)) {
          const defaults = generateDefaultTime(index);
          time = defaults.startTime;
          appliedDefaults = true;
        }
        
        periods.push({
          id: generateId(),
          subject: t.title,
          time: time,
          day: day as WeekDay,
          selected: true,
        });
      });
    });

    return { periods, appliedDefaults };
  }, []);

  // Core API call with retry logic
  const callOCRWithRetry = useCallback(async (
    body: { imageBase64?: string; excelData?: any; fileType: string },
    attempt: number = 1
  ): Promise<{ data: any; error: string | null }> => {
    setRetryCount(attempt);
    setProcessingStatus('analyzing');
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Timeout: 50s for first attempt, 60s for retry
    const timeout = attempt === 1 ? 50000 : 60000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      return { data, error: null };
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      // If aborted by user, don't retry
      if (err.name === 'AbortError' && !controller.signal.aborted) {
        // Timeout - try again if we have retries left
        if (attempt < maxRetries) {
          console.log(`[OCR] Attempt ${attempt} timed out, retrying...`);
          return callOCRWithRetry(body, attempt + 1);
        }
        return { data: null, error: 'התהליך ארך יותר מדי זמן. נסה שוב או העלה תמונה קטנה/חדה יותר.' };
      }
      
      if (controller.signal.aborted) {
        return { data: null, error: 'בוטל על ידי המשתמש' };
      }

      // Other errors - retry if we have attempts left
      if (attempt < maxRetries && !err.message.includes('Rate limit') && !err.message.includes('credits')) {
        console.log(`[OCR] Attempt ${attempt} failed: ${err.message}, retrying...`);
        return callOCRWithRetry(body, attempt + 1);
      }
      
      return { data: null, error: err.message };
    }
  }, [maxRetries]);

  const handleFileUpload = useCallback(async (file: File) => {
    setStep('processing');
    setIsProcessing(true);
    setRetryCount(0);
    setProcessingStatus('optimizing');

    try {
      const isImage = isImageFile(file);
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      if (isImage) {
        // Step 1: Optimize image (resize & compress)
        setProcessingStatus('optimizing');
        const optimized = await optimizeImage(file);
        console.log(`[TimetableImporter] Image optimized: ${optimized.width}x${optimized.height}, ${(optimized.optimizedSize / 1024).toFixed(1)}KB`);

        // Step 2: Upload & analyze
        setProcessingStatus('uploading');
        
        const { data, error } = await callOCRWithRetry({
          imageBase64: optimized.base64,
          fileType: 'image',
        });

        if (error) {
          throw new Error(error);
        }

        // Step 3: Parse results
        setProcessingStatus('parsing');
        const { periods, appliedDefaults } = processTasksIntoPeriods(data.tasks);

        setDefaultTimesApplied(appliedDefaults);
        setParsedPeriods(periods);
        setStep('review');
        
        if (appliedDefaults) {
          toast.success(`נמצאו ${periods.length} שיעורים! הוספנו שעות ברירת מחדל לשיעורים ללא זמן.`);
        } else {
          toast.success(`Found ${periods.length} lessons in your schedule!`);
        }

      } else if (isExcel) {
        // Parse Excel file
        setProcessingStatus('uploading');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Call edge function for processing
        const { data, error } = await callOCRWithRetry({
          excelData: jsonData,
          fileType: 'excel',
        });

        if (error) {
          throw new Error(error);
        }

        // Parse results
        setProcessingStatus('parsing');
        const { periods, appliedDefaults } = processTasksIntoPeriods(data.tasks);

        setDefaultTimesApplied(appliedDefaults);
        setParsedPeriods(periods);
        setStep('review');
        
        if (appliedDefaults) {
          toast.success(`נמצאו ${periods.length} שיעורים! הוספנו שעות ברירת מחדל לשיעורים ללא זמן.`);
        } else {
          toast.success(`Found ${periods.length} lessons in your spreadsheet!`);
        }

      } else {
        throw new Error('Unsupported file type. Please upload an image or Excel file.');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process file');
      setStep('upload');
    } finally {
      setIsProcessing(false);
      setRetryCount(0);
      abortControllerRef.current = null;
    }
  }, [callOCRWithRetry, processTasksIntoPeriods]);

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
      toast.error('Please select at least one lesson to import');
      return;
    }

    // Build new timetable from selected periods
    const newTimetable: Timetable = {};
    
    // Initialize with empty arrays for each day
    displayDays.forEach(day => {
      newTimetable[day] = [];
    });

    // Group periods by day
    const periodsByDay: Partial<Record<WeekDay, ParsedPeriod[]>> = {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    };

    selectedPeriods.forEach(p => {
      if (periodsByDay[p.day]) {
        periodsByDay[p.day]!.push(p);
      }
    });

    // Sort each day by time and build timetable entries
    Object.keys(periodsByDay).forEach(day => {
      const weekDay = day as WeekDay;
      if (!newTimetable[weekDay]) return;
      
      const dayPeriods = (periodsByDay[weekDay] || []).sort((a, b) => a.time.localeCompare(b.time));
      
      newTimetable[weekDay] = dayPeriods.map(period => ({
        subject: period.subject,
        startTime: period.time,
      }));
    });

    onImport(newTimetable);
    toast.success(`Imported ${selectedPeriods.length} lessons to timetable!`);
    onClose();
  };

  // Upload Step
  if (step === 'upload') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            העלאת מערכת שעות
          </h3>
          <p className="text-sm text-muted-foreground">
            העלו תמונה של מערכת השעות או קובץ אקסל
            {childName && <span className="text-primary"> עבור {childName}</span>}
          </p>
        </div>

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
            accept=".jpg,.jpeg,.png,.xlsx,.xls"
            onChange={handleFileInput}
            className="hidden"
            id="timetable-file-input"
          />
          <label htmlFor="timetable-file-input" className="cursor-pointer">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Camera className="w-10 h-10 text-primary" />
              <span className="text-2xl text-muted-foreground">/</span>
              <FileSpreadsheet className="w-10 h-10 text-primary" />
            </div>
            <p className="font-medium text-foreground mb-2">
              לחצו כאן או גררו קובץ
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              תומך ב-JPG, PNG ו-XLSX
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-full">
                <Camera className="w-3 h-3" />
                <span>תמונה</span>
              </div>
              <div className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-full">
                <FileSpreadsheet className="w-3 h-3" />
                <span>אקסל</span>
              </div>
            </div>
          </label>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
        </div>
      </div>
    );
  }

  // Processing Step with detailed progress
  if (step === 'processing') {
    const statusLabels: Record<typeof processingStatus, { label: string; progress: number }> = {
      optimizing: { label: 'מכווץ את התמונה...', progress: 15 },
      uploading: { label: 'מעלה לשרת...', progress: 35 },
      analyzing: { label: `מעבד את התמונה... (${retryCount}/${maxRetries})`, progress: 65 },
      parsing: { label: 'מארגן את השיעורים...', progress: 90 },
    };
    
    const currentStatus = statusLabels[processingStatus];

    return (
      <div className="py-8 text-center space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <Loader2 className="w-20 h-20 animate-spin text-primary" />
          <Zap className="absolute inset-0 m-auto w-8 h-8 text-buff animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            מנתח את המערכת... ⚡
          </h3>
          <p className="text-sm text-muted-foreground">
            {currentStatus.label}
          </p>
        </div>

        {/* Progress bar */}
        <div className="max-w-xs mx-auto space-y-2">
          <Progress value={currentStatus.progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>התחלה</span>
            <span>{currentStatus.progress}%</span>
            <span>סיום</span>
          </div>
        </div>

        {/* Retry indicator */}
        {retryCount > 1 && (
          <div className="flex items-center justify-center gap-2 text-sm text-warning-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>ניסיון {retryCount} מתוך {maxRetries}</span>
          </div>
        )}

        {/* Cancel button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCancelProcessing}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          ביטול
        </Button>
      </div>
    );
  }

  // Review Step
  const selectedCount = parsedPeriods.filter(p => p.selected).length;

  // Group by day for display (including Friday if enabled or if Friday data exists)
  const allDaysWithFriday = WEEK_DAYS_WITH_FRIDAY;
  const groupedByDay = allDaysWithFriday.reduce((acc, day) => {
    acc[day] = parsedPeriods.filter(p => p.day === day);
    return acc;
  }, {} as Record<WeekDay, ParsedPeriod[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            בדיקה ואישור
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedCount} מתוך {parsedPeriods.length} שיעורים נבחרו
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
          העלאה אחרת
        </Button>
      </div>

      {/* Visual hint when default times were applied */}
      {defaultTimesApplied && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-primary">
            הוספנו שעות ברירת מחדל (50 דקות לשיעור). ניתן לערוך אותן כאן.
          </p>
        </div>
      )}

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {parsedPeriods.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              לא נמצאו שיעורים. נסו להעלות קובץ אחר.
            </div>
          ) : (
            allDaysWithFriday.map(day => {
              const dayPeriods = groupedByDay[day];
              if (dayPeriods.length === 0) return null;
              
              return (
                <div key={day} className="space-y-2">
                  <h4 className="font-medium text-foreground capitalize flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {WEEK_DAY_LABELS[day]}
                    <span className="text-xs text-muted-foreground">
                      ({dayPeriods.filter(p => p.selected).length} selected)
                    </span>
                  </h4>
                  
                  {dayPeriods.sort((a, b) => a.time.localeCompare(b.time)).map((period) => (
                    <div
                      key={period.id}
                      className={cn(
                        "p-3 rounded-xl border transition-all flex items-center gap-3",
                        period.selected 
                          ? "bg-card border-primary/50" 
                          : "bg-secondary/30 border-border opacity-60"
                      )}
                    >
                      {/* Selection Checkbox */}
                      <button
                        onClick={() => togglePeriodSelection(period.id)}
                        className={cn(
                          "w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                          period.selected 
                            ? "bg-primary border-primary text-primary-foreground" 
                            : "border-muted-foreground"
                        )}
                      >
                        {period.selected && <Check className="w-4 h-4" />}
                      </button>

                      {/* Time */}
                      <div className="flex items-center gap-1 w-24">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={period.time}
                          onChange={(e) => updatePeriod(period.id, { time: e.target.value })}
                          className="text-sm h-8"
                        />
                      </div>

                      {/* Subject */}
                      <Input
                        value={period.subject}
                        onChange={(e) => updatePeriod(period.id, { subject: e.target.value })}
                        className="flex-1"
                        placeholder="Subject name"
                      />

                      {/* Day selector */}
                      <Select
                        value={period.day}
                        onValueChange={(val) => updatePeriod(period.id, { day: val as WeekDay })}
                      >
                        <SelectTrigger className="w-24 text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WEEK_DAYS_WITH_FRIDAY.map(d => (
                            <SelectItem key={d} value={d}>
                              {WEEK_DAY_LABELS[d]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Delete Button */}
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

      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={onClose}>
          ביטול
        </Button>
        <Button 
          onClick={handleConfirmImport} 
          disabled={selectedCount === 0}
          className="gap-2"
        >
          <Check className="w-4 h-4" />
          ייבוא {selectedCount} שיעורים
        </Button>
      </div>
    </div>
  );
}
