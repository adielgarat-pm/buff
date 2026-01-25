import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { 
  Upload, 
  FileSpreadsheet, 
  Image, 
  Zap, 
  Trash2, 
  Check, 
  Loader2, 
  Clock,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timetable, WeekDay, WEEK_DAYS, WEEK_DAY_LABELS, PeriodInfo } from '@/types/task';
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
}

const DEFAULT_PERIOD_TIMES = [
  '08:00', '08:50', '09:40', '10:40', '11:30', '12:20', '13:10', '14:00', '14:50', '15:40'
];

export function TimetableImporter({ onImport, onClose, currentTimetable, childName }: TimetableImporterProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [parsedPeriods, setParsedPeriods] = useState<ParsedPeriod[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFileUpload = useCallback(async (file: File) => {
    setStep('processing');
    setIsProcessing(true);

    try {
      const isImage = file.type.startsWith('image/');
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      if (isImage) {
        // Convert image to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Call edge function for AI processing
        const { data, error } = await supabase.functions.invoke('parse-schedule', {
          body: { imageBase64: base64, fileType: 'image' }
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);

        const periods: ParsedPeriod[] = (data.tasks || []).map((t: any) => ({
          id: generateId(),
          subject: t.title,
          time: t.time,
          day: t.day as WeekDay,
          selected: true,
        }));

        setParsedPeriods(periods);
        setStep('review');
        toast.success(`Found ${periods.length} lessons in your schedule!`);

      } else if (isExcel) {
        // Parse Excel file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Call edge function for processing
        const { data, error } = await supabase.functions.invoke('parse-schedule', {
          body: { excelData: jsonData, fileType: 'excel' }
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);

        const periods: ParsedPeriod[] = (data.tasks || []).map((t: any) => ({
          id: generateId(),
          subject: t.title,
          time: t.time,
          day: t.day as WeekDay,
          selected: true,
        }));

        setParsedPeriods(periods);
        setStep('review');
        toast.success(`Found ${periods.length} lessons in your spreadsheet!`);

      } else {
        throw new Error('Unsupported file type. Please upload an image or Excel file.');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process file');
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  }, []);

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
    
    // Initialize with default structure
    WEEK_DAYS.forEach(day => {
      newTimetable[day] = DEFAULT_PERIOD_TIMES.map(time => ({
        subject: '',
        startTime: time,
      }));
    });

    // Group periods by day and sort by time
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

    // Sort each day by time and assign to timetable slots
    Object.keys(periodsByDay).forEach(day => {
      const weekDay = day as WeekDay;
      if (!newTimetable[weekDay]) return;
      
      const dayPeriods = (periodsByDay[weekDay] || []).sort((a, b) => a.time.localeCompare(b.time));
      
      dayPeriods.forEach((period, index) => {
        if (index < newTimetable[weekDay].length) {
          newTimetable[weekDay][index] = {
            subject: period.subject,
            startTime: period.time,
          };
        }
      });
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
            Import Timetable
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload a photo of a school timetable or an Excel file
            {childName && <span className="text-primary"> for {childName}</span>}
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
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-medium text-foreground mb-2">
              Drop file here or click to browse
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Image className="w-4 h-4" />
                <span>JPG, PNG</span>
              </div>
              <div className="flex items-center gap-1">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </div>
            </div>
          </label>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Processing Step
  if (step === 'processing') {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="relative mx-auto w-20 h-20">
          <Loader2 className="w-20 h-20 animate-spin text-primary" />
          <Zap className="absolute inset-0 m-auto w-8 h-8 text-buff animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Analyzing timetable... ⚡
          </h3>
          <p className="text-sm text-muted-foreground">
            Using AI to detect subjects, times, and days
          </p>
        </div>
      </div>
    );
  }

  // Review Step
  const selectedCount = parsedPeriods.filter(p => p.selected).length;

  // Group by day for display
  const groupedByDay = WEEK_DAYS.reduce((acc, day) => {
    acc[day] = parsedPeriods.filter(p => p.day === day);
    return acc;
  }, {} as Record<WeekDay, ParsedPeriod[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Review & Confirm
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedCount} of {parsedPeriods.length} lessons selected
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
          Upload Different
        </Button>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {parsedPeriods.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No lessons found. Try uploading a different file.
            </div>
          ) : (
            WEEK_DAYS.map(day => {
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
                          {WEEK_DAYS.map(d => (
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
          Cancel
        </Button>
        <Button 
          onClick={handleConfirmImport} 
          disabled={selectedCount === 0}
          className="gap-2"
        >
          <Check className="w-4 h-4" />
          Import {selectedCount} Lessons
        </Button>
      </div>
    </div>
  );
}
