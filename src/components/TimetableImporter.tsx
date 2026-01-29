import { useState, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
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
  X,
  ClipboardPaste,
  AlertTriangle
} from 'lucide-react';
import { optimizeImage, isImageFile } from '@/utils/imageOptimizer';
import { cn } from '@/lib/utils';
import { Timetable, WeekDay, WEEK_DAYS, WEEK_DAYS_WITH_FRIDAY, WEEK_DAY_LABELS, PeriodInfo } from '@/types/task';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ParsedPeriod {
  id: string;
  subject: string;
  time: string;
  day: WeekDay;
  selected: boolean;
  autoTime?: boolean;
  missingSubject?: boolean;
  missingDay?: boolean;
  lessonNumber?: number;
  equipment?: string;
}

interface TimetableImporterProps {
  onImport: (timetable: Timetable) => void;
  onClose: () => void;
  currentTimetable: Timetable;
  childName?: string;
  fridayEnabled?: boolean;
}

// ===== FLEXIBLE HEADER MAPPING =====
// Hebrew and English header variants - expanded for maximum compatibility
const HEADER_MAPPINGS = {
  day: ['יום', 'day', 'weekday', 'ימים', 'days'],
  subject: ['מקצוע', 'שיעור', 'נושא', 'subject', 'lesson', 'activity', 'class', 'course', 'מקצועות', 'שיעורים', 'פעילות', 'תוכן'],
  time: ['שעה', 'זמן', 'התחלה', 'time', 'start', 'hour', 'from', 'שעות'],
  equipment: ['ציוד', 'להביא', 'equipment', 'required', 'bring', 'items', 'חומרים', 'ציוד נדרש'],
};

// Helper to check if a value looks like a day
const looksLikeDay = (val: string): boolean => {
  if (!val) return false;
  const normalized = val.toString().toLowerCase().trim();
  return Object.keys(HEBREW_DAY_MAP).some(d => normalized.includes(d) || d.includes(normalized));
};

// Helper to check if a value looks like a time
const looksLikeTime = (val: string): boolean => {
  if (!val) return false;
  const str = val.toString().trim();
  return /^\d{1,2}(:\d{2})?$/.test(str) || (!isNaN(parseFloat(str)) && parseFloat(str) >= 0 && parseFloat(str) < 1);
};

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
  'sun': 'sunday', 'mon': 'monday', 'tue': 'tuesday', 'wed': 'wednesday', 'thu': 'thursday', 'fri': 'friday',
};

// Generate default time using "Buff Standard" algorithm
const generateDefaultTime = (lessonIndex: number): string => {
  const cappedIndex = Math.min(lessonIndex, 9);
  const LESSON_DURATION = 50;
  const BREAK_DURATION = 20;
  let currentMinutes = 8 * 60;
  for (let i = 0; i < cappedIndex; i++) {
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

// Find matching header key (case-insensitive)
const findHeaderKey = (headers: string[], mappingType: keyof typeof HEADER_MAPPINGS): string | null => {
  const variants = HEADER_MAPPINGS[mappingType];
  for (const header of headers) {
    const lower = header.toLowerCase().trim();
    for (const variant of variants) {
      if (lower === variant || lower.includes(variant)) {
        return header;
      }
    }
  }
  return null;
};

// Smart fallback: find first column that has text content and isn't a day or time
const findSubjectColumnFallback = (headers: string[], dayCol: string | null, timeCol: string | null): string | null => {
  for (const header of headers) {
    if (header === dayCol || header === timeCol) continue;
    // Skip if header looks like day or time
    if (looksLikeDay(header) || looksLikeTime(header)) continue;
    // First remaining column with actual text is likely the subject
    if (header && header.trim().length > 0) {
      return header;
    }
  }
  return null;
};

export function TimetableImporter({ onImport, onClose, currentTimetable, childName, fridayEnabled = false }: TimetableImporterProps) {
  const displayDays = fridayEnabled ? WEEK_DAYS_WITH_FRIDAY : WEEK_DAYS;
  
  const [mode, setMode] = useState<'choose' | 'manual' | 'file' | 'paste' | 'processing' | 'review'>('choose');
  const [manualTimetable, setManualTimetable] = useState<Timetable>(() => createEmptyTimetable(displayDays));
  const [selectedDay, setSelectedDay] = useState<WeekDay>('sunday');
  const [dragActive, setDragActive] = useState(false);
  
  // Paste mode state
  const [pasteText, setPasteText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  
  // Processing state
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Review state
  const [parsedPeriods, setParsedPeriods] = useState<ParsedPeriod[]>([]);
  const [hasAutoFilledTimes, setHasAutoFilledTimes] = useState(false);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);

  // Cancel processing
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMode('choose');
    setProcessingStatus('');
    setProcessingProgress(0);
    setIsParsing(false);
  }, []);

  // Process API response into periods with validation + Buff Standard times
  const processApiResponse = useCallback((tasks: any[]) => {
    const periods: ParsedPeriod[] = [];
    let hasAuto = false;
    let hasMissingSubjects = false;
    let hasValidationIssues = false;
    
    // Track lesson count per day for Buff Standard time generation
    const lessonCountByDay: Record<WeekDay, number> = {
      sunday: 0, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0
    };
    
    (tasks || []).forEach((t: any) => {
      const day = (t.day || 'sunday') as WeekDay;
      if (t.autoTime) hasAuto = true;
      if (t.missingSubject) hasMissingSubjects = true;
      
      const subject = t.title || '';
      const isMissingSubject = !subject.trim() || subject === '[שיעור ללא שם]';
      const isMissingDay = !t.day || !displayDays.includes(day);
      
      if (isMissingSubject && isMissingDay) return; // Skip completely empty rows
      
      if (isMissingSubject || isMissingDay) hasValidationIssues = true;
      
      const validDay = isMissingDay ? 'sunday' : day;
      
      // Apply "Buff Standard" times if subject exists but time is missing
      let time = t.time || '';
      let isAutoTime = !!t.autoTime;
      if (!time && subject.trim()) {
        time = generateDefaultTime(lessonCountByDay[validDay]);
        isAutoTime = true;
        hasAuto = true;
      } else if (!time) {
        time = '08:00';
      }
      
      periods.push({
        id: generateId(),
        subject: isMissingSubject ? '' : subject,
        time,
        day: validDay,
        selected: true,
        autoTime: isAutoTime,
        missingSubject: isMissingSubject,
        missingDay: isMissingDay,
        lessonNumber: t.lessonNumber || lessonCountByDay[validDay] + 1,
        equipment: t.equipment || '',
      });
      
      lessonCountByDay[validDay]++;
    });
    
    // Sort by day and lesson number
    periods.sort((a, b) => {
      const dayOrder = displayDays.indexOf(a.day) - displayDays.indexOf(b.day);
      if (dayOrder !== 0) return dayOrder;
      return (a.lessonNumber || 0) - (b.lessonNumber || 0);
    });
    
    setHasAutoFilledTimes(hasAuto || hasMissingSubjects);
    setHasValidationErrors(hasValidationIssues);
    setParsedPeriods(periods);
    setMode('review');
  }, [displayDays]);

  // Call API for image processing
  const processImage = useCallback(async (file: File) => {
    setMode('processing');
    setProcessingStatus('מכווץ את התמונה...');
    setProcessingProgress(10);
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      const optimized = await optimizeImage(file);
      console.log(`Image optimized: ${optimized.width}x${optimized.height}, ${(optimized.optimizedSize / 1024).toFixed(1)}KB`);
      
      setProcessingStatus('מחלץ טקסט מהתמונה...');
      setProcessingProgress(30);
      
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
        toast.error('לא נמצאו שיעורים בתמונה. נסו תמונה אחרת או הדבקת טקסט.');
        setMode('choose');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Image processing error:', error);
      toast.error(error.message || 'שגיאה בעיבוד התמונה');
      setMode('choose');
    } finally {
      abortControllerRef.current = null;
    }
  }, [processApiResponse]);

  // Process Excel file locally with FLEXIBLE HEADER MAPPING
  const processExcelLocally = useCallback(async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Get raw data as array of arrays (for fallback to column index)
      const rawData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      
      if (rawData.length === 0) {
        toast.error('הקובץ ריק');
        return;
      }
      
      // Try to detect headers from first row
      const firstRow = rawData[0] || [];
      const headers = firstRow.map((h: any) => String(h || '').trim());
      
      // Find header columns using flexible mapping
      const dayCol = findHeaderKey(headers, 'day');
      let subjectCol = findHeaderKey(headers, 'subject');
      const timeCol = findHeaderKey(headers, 'time');
      const equipmentCol = findHeaderKey(headers, 'equipment');
      
      // SMART FALLBACK: If no subject column found, find first text column that isn't day/time
      if (!subjectCol && headers.length > 0) {
        subjectCol = findSubjectColumnFallback(headers, dayCol, timeCol);
        if (subjectCol) {
          console.log(`Using fallback subject column: "${subjectCol}"`);
        }
      }
      
      const hasHeaders = dayCol || subjectCol || timeCol;
      
      let dataRows: any[];
      
      if (hasHeaders) {
        // Use header-based parsing
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        dataRows = jsonData.map((row: any) => ({
          day: dayCol ? row[dayCol] : '',
          time: timeCol ? row[timeCol] : '',
          subject: subjectCol ? row[subjectCol] : '',
          equipment: equipmentCol ? row[equipmentCol] : '',
        }));
        
        // If still missing subjects, try to find content in any non-mapped column
        if (!subjectCol) {
          dataRows = jsonData.map((row: any) => {
            const keys = Object.keys(row);
            const subjectKey = keys.find(k => k !== dayCol && k !== timeCol && k !== equipmentCol);
            return {
              day: dayCol ? row[dayCol] : '',
              time: timeCol ? row[timeCol] : '',
              subject: subjectKey ? row[subjectKey] : '',
              equipment: equipmentCol ? row[equipmentCol] : '',
            };
          });
        }
      } else {
        // FALLBACK: Assume standard structure Day | Time | Subject | Equipment
        // Skip header row if it seems like headers (no valid day/time in first row)
        const startIndex = rawData.length > 1 && !parseDay(String(rawData[0][0] || '')) ? 1 : 0;
        
        dataRows = rawData.slice(startIndex).map((row: any[]) => ({
          day: row[0] || '',
          time: row[1] || '',
          subject: row[2] || '',
          equipment: row[3] || '',
        }));
        
        toast.info('לא זוהו כותרות - משתמש במבנה ברירת מחדל: יום | שעה | מקצוע | ציוד');
      }
      
      const periods: ParsedPeriod[] = [];
      const lessonCountByDay: Record<WeekDay, number> = {
        sunday: 0, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0
      };
      let hasAuto = false;
      let hasValidationIssues = false;
      
      dataRows.forEach((row: any) => {
        const dayValue = String(row.day || '').trim();
        const subject = String(row.subject || '').trim();
        const rawTime = row.time;
        const equipment = String(row.equipment || '').trim();
        
        // Skip completely empty rows
        if (!dayValue && !subject && !rawTime) return;
        
        const day = parseDay(dayValue);
        const isMissingDay = !day || !displayDays.includes(day);
        const isMissingSubject = !subject;
        
        if (isMissingDay || isMissingSubject) hasValidationIssues = true;
        
        let time = parseTime(rawTime);
        const validDay = day && displayDays.includes(day) ? day : 'sunday';
        
        if (!time) {
          time = generateDefaultTime(lessonCountByDay[validDay]);
          hasAuto = true;
        }
        
        periods.push({
          id: generateId(),
          subject: subject || '',
          time,
          day: validDay,
          selected: true,
          autoTime: !parseTime(rawTime),
          missingSubject: isMissingSubject,
          missingDay: isMissingDay,
          equipment,
        });
        
        lessonCountByDay[validDay]++;
      });
      
      if (periods.length === 0) {
        toast.error('לא נמצאו שיעורים בקובץ. נסו להדביק טקסט ישירות.');
        return;
      }
      
      // Sort by day and time
      periods.sort((a, b) => {
        const dayOrder = displayDays.indexOf(a.day) - displayDays.indexOf(b.day);
        if (dayOrder !== 0) return dayOrder;
        return a.time.localeCompare(b.time);
      });
      
      setHasAutoFilledTimes(hasAuto);
      setHasValidationErrors(hasValidationIssues);
      setParsedPeriods(periods);
      setMode('review');
      
      const validCount = periods.filter(p => !p.missingSubject && !p.missingDay).length;
      const issueCount = periods.length - validCount;
      
      if (issueCount > 0) {
        toast.warning(`נמצאו ${periods.length} שורות, ${issueCount} דורשות תיקון`);
      } else {
        toast.success(`נמצאו ${periods.length} שיעורים!`);
      }
      
    } catch (error) {
      console.error('Excel processing error:', error);
      toast.error('שגיאה בקריאת הקובץ. נסו להדביק טקסט ישירות.');
    }
  }, [displayDays]);

  // Parse pasted text using AI
  const processPastedText = useCallback(async () => {
    if (!pasteText.trim()) {
      toast.error('נא להזין טקסט');
      return;
    }
    
    setIsParsing(true);
    
    try {
      const response = await supabase.functions.invoke('parse-schedule', {
        body: {
          extractedText: pasteText,
          fileType: 'text',
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'שגיאה בעיבוד הטקסט');
      }
      
      const data = response.data;
      
      if (data.tasks && data.tasks.length > 0) {
        processApiResponse(data.tasks);
        toast.success(`נמצאו ${data.tasks.length} שיעורים!`);
      } else {
        toast.error('לא הצלחנו לזהות שיעורים בטקסט. נסו פורמט אחר.');
      }
    } catch (error: any) {
      console.error('Text parsing error:', error);
      toast.error(error.message || 'שגיאה בעיבוד הטקסט');
    } finally {
      setIsParsing(false);
    }
  }, [pasteText, processApiResponse]);

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
    setParsedPeriods(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p;
        const newPeriod = { ...p, ...updates };
        // Clear validation flags if user fixed the issue
        if (updates.subject !== undefined && updates.subject.trim()) newPeriod.missingSubject = false;
        if (updates.day !== undefined) newPeriod.missingDay = false;
        return newPeriod;
      });
      
      // Recalculate validation errors state
      const stillHasErrors = updated.some(p => p.selected && (p.missingSubject || p.missingDay));
      setHasValidationErrors(stillHasErrors);
      
      return updated;
    });
  };

  const deletePeriod = (id: string) => {
    setParsedPeriods(prev => {
      const updated = prev.filter(p => p.id !== id);
      // Recalculate validation errors state
      const stillHasErrors = updated.some(p => p.selected && (p.missingSubject || p.missingDay));
      setHasValidationErrors(stillHasErrors);
      return updated;
    });
  };

  const togglePeriodSelection = (id: string) => {
    setParsedPeriods(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p);
      // Recalculate validation errors state based on selected items
      const stillHasErrors = updated.some(p => p.selected && (p.missingSubject || p.missingDay));
      setHasValidationErrors(stillHasErrors);
      return updated;
    });
  };

  const handleConfirmImport = () => {
    const selectedPeriods = parsedPeriods.filter(p => p.selected);
    
    // Check for validation issues in selected periods
    const invalidPeriods = selectedPeriods.filter(p => p.missingSubject || p.missingDay);
    if (invalidPeriods.length > 0) {
      toast.error(`יש ${invalidPeriods.length} שיעורים עם שגיאות (מסומנים באדום). נא לתקן או לבטל בחירתם.`);
      return;
    }
    
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
      const dayPeriods = (periodsByDay[weekDay] || []).sort(
        (a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0) || a.time.localeCompare(b.time)
      );
      newTimetable[weekDay] = dayPeriods.map(period => ({
        subject: period.subject,
        startTime: period.time,
        equipment: period.equipment,
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

  // ===== CHOOSE MODE SCREEN =====
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

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setMode('manual')}
            className={cn(
              "p-4 rounded-xl border-2 border-dashed transition-all text-center",
              "hover:border-primary hover:bg-primary/5 border-border"
            )}
          >
            <Table className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-medium text-foreground text-sm mb-1">הזנה ידנית</p>
            <p className="text-xs text-muted-foreground">מלאו ישירות</p>
          </button>

          <button
            onClick={() => setMode('file')}
            className={cn(
              "p-4 rounded-xl border-2 border-dashed transition-all text-center",
              "hover:border-primary hover:bg-primary/5 border-border"
            )}
          >
            <div className="flex justify-center gap-1 mb-2">
              <Camera className="w-6 h-6 text-primary" />
              <FileSpreadsheet className="w-6 h-6 text-primary" />
            </div>
            <p className="font-medium text-foreground text-sm mb-1">ייבוא מקובץ</p>
            <p className="text-xs text-muted-foreground">תמונה/אקסל</p>
          </button>

          <button
            onClick={() => setMode('paste')}
            className={cn(
              "p-4 rounded-xl border-2 border-dashed transition-all text-center",
              "hover:border-primary hover:bg-primary/5 border-border"
            )}
          >
            <ClipboardPaste className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-medium text-foreground text-sm mb-1">הדבקת טקסט</p>
            <p className="text-xs text-muted-foreground">מוואטסאפ/אקסל</p>
          </button>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
        </div>
      </div>
    );
  }

  // ===== PASTE MODE SCREEN =====
  if (mode === 'paste') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            הדבקת טקסט
          </h3>
          <p className="text-sm text-muted-foreground">
            העתיקו שורות מאקסל, וואטסאפ או כל מקור אחר
          </p>
        </div>

        <div className="bg-secondary/50 rounded-lg p-3 border border-border">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">דוגמאות לפורמטים נתמכים:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>יום א: מתמטיקה 08:00, אנגלית 09:00</li>
                <li>ראשון | 08:00 | חשבון</li>
                <li>שני - היסטוריה, גאוגרפיה, מדעים</li>
              </ul>
            </div>
          </div>
        </div>

        <Textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="הדביקו כאן את מערכת השעות..."
          className="min-h-[200px] text-sm font-mono"
          dir="rtl"
        />

        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={() => setMode('choose')}>חזרה</Button>
          <Button 
            onClick={processPastedText} 
            disabled={!pasteText.trim() || isParsing}
            className="gap-2"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                מעבד...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                ניתוח הטקסט
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ===== FILE UPLOAD SCREEN WITH INLINE PASTE FALLBACK =====
  if (mode === 'file') {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            טעינת מערכת (תמונה/אקסל)
          </h3>
          <p className="text-sm text-muted-foreground">
            העלו תמונה של המערכת או קובץ אקסל
          </p>
        </div>

        <div className="bg-secondary/50 rounded-lg p-3 border border-border">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">פורמטים נתמכים:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li><strong>תמונה:</strong> JPG, PNG (צילום של המערכת)</li>
                <li><strong>אקסל/CSV:</strong> עמודות יום, שעה, מקצוע (עברית/אנגלית)</li>
              </ul>
            </div>
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
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
            <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
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

        {/* INLINE PASTE FALLBACK - Large text area for copy-paste from Excel/WhatsApp */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardPaste className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">או הדביקו טקסט כאן (העתק-הדבק מהאקסל)</p>
          </div>
          <Textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="הדביקו שורות מאקסל או וואטסאפ כאן...&#10;דוגמה: יום א | 08:00 | מתמטיקה&#10;יום ב | 09:00 | אנגלית"
            className="min-h-[100px] text-sm font-mono"
            dir="rtl"
          />
          {pasteText.trim() && (
            <Button 
              onClick={processPastedText} 
              disabled={isParsing}
              className="w-full mt-2 gap-2"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מעבד את הטקסט...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  ניתוח הטקסט ({pasteText.split('\n').filter(l => l.trim()).length} שורות)
                </>
              )}
            </Button>
          )}
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={() => setMode('choose')}>חזרה</Button>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
        </div>
      </div>
    );
  }

  // ===== PROCESSING SCREEN =====
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

  // ===== REVIEW SCREEN WITH VISUAL VALIDATION =====
  if (mode === 'review') {
    const selectedCount = parsedPeriods.filter(p => p.selected).length;
    const errorCount = parsedPeriods.filter(p => p.selected && (p.missingSubject || p.missingDay)).length;
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
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-sm text-warning">
              שעות או שמות מסומנים בכתום הוזנו אוטומטית. ניתן לערוך.
            </p>
          </div>
        )}

        {hasValidationErrors && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">
              שורות עם מסגרת אדומה חסר בהן יום או מקצוע. נא לתקן או לבטל בחירתן.
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
                    
                    {dayPeriods.sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0) || a.time.localeCompare(b.time)).map((period) => {
                      const hasError = period.selected && (period.missingSubject || period.missingDay);
                      
                      return (
                        <div
                          key={period.id}
                          className={cn(
                            "p-3 rounded-xl border-2 transition-all flex items-center gap-3",
                            hasError 
                              ? "bg-destructive/5 border-destructive/50 ring-2 ring-destructive/20" 
                              : period.selected 
                                ? "bg-card border-primary/50" 
                                : "bg-secondary/30 border-border opacity-60"
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

                          {/* Lesson number badge */}
                          {period.lessonNumber && period.lessonNumber > 0 && (
                            <span className="w-6 h-6 flex items-center justify-center rounded bg-primary/20 text-primary font-bold text-xs flex-shrink-0">
                              {period.lessonNumber}
                            </span>
                          )}

                          <div className={cn(
                            "flex items-center gap-1 w-24",
                            period.autoTime && "ring-2 ring-warning/50 rounded-md"
                          )}>
                            <Clock className={cn("w-4 h-4", period.autoTime ? "text-warning" : "text-muted-foreground")} />
                            <Input
                              type="time"
                              value={period.time}
                              onChange={(e) => updatePeriod(period.id, { time: e.target.value, autoTime: false })}
                              className={cn("text-sm h-8", period.autoTime && "border-warning/50")}
                            />
                          </div>

                          <Input
                            value={period.subject}
                            onChange={(e) => updatePeriod(period.id, { subject: e.target.value })}
                            className={cn(
                              "flex-1", 
                              period.missingSubject && "border-destructive ring-2 ring-destructive/50 bg-destructive/5"
                            )}
                            placeholder="שם המקצוע"
                          />

                          <Select
                            value={period.day}
                            onValueChange={(val) => updatePeriod(period.id, { day: val as WeekDay })}
                          >
                            <SelectTrigger className={cn(
                              "w-24 text-sm h-8",
                              period.missingDay && "border-destructive ring-2 ring-destructive/50 bg-destructive/5"
                            )}>
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
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t border-border sticky bottom-0 bg-background">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button 
            onClick={handleConfirmImport} 
            disabled={selectedCount === 0 || errorCount > 0} 
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            {errorCount > 0 ? `תקנו ${errorCount} שגיאות` : `שמירת ${selectedCount} שיעורים`}
          </Button>
        </div>
      </div>
    );
  }

  // ===== MANUAL ENTRY SCREEN =====
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
