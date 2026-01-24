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
  X,
  Clock,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STRATEGIES, Strategy } from '@/data/cogFunStrategies';
import { TaskCategory, WeekDay, WEEK_DAYS, WEEK_DAY_LABELS } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface ParsedTask {
  id: string;
  title: string;
  time: string;
  day: string;
  category: TaskCategory;
  credits: number;
  strategyId?: string;
  selected: boolean;
}

interface ScheduleImporterProps {
  onImport: (tasks: Array<{
    title: string;
    time: string;
    category: TaskCategory;
    credits: number;
    strategyId?: string;
  }>) => Promise<void>;
  onClose: () => void;
  childName?: string;
}

const CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: 'medication', label: '💊 Medication' },
  { value: 'hygiene', label: '🚿 Hygiene' },
  { value: 'nutrition', label: '🍎 Nutrition' },
  { value: 'school', label: '📚 School' },
];

export function ScheduleImporter({ onImport, onClose, childName }: ScheduleImporterProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
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

        const tasks: ParsedTask[] = (data.tasks || []).map((t: any) => ({
          id: generateId(),
          title: t.title,
          time: t.time,
          day: t.day,
          category: t.category as TaskCategory,
          credits: t.credits,
          selected: true,
        }));

        setParsedTasks(tasks);
        setStep('review');
        toast.success(`Found ${tasks.length} items in your schedule!`);

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

        const tasks: ParsedTask[] = (data.tasks || []).map((t: any) => ({
          id: generateId(),
          title: t.title,
          time: t.time,
          day: t.day,
          category: t.category as TaskCategory,
          credits: t.credits,
          selected: true,
        }));

        setParsedTasks(tasks);
        setStep('review');
        toast.success(`Found ${tasks.length} items in your spreadsheet!`);

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

  const updateTask = (id: string, updates: Partial<ParsedTask>) => {
    setParsedTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setParsedTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleTaskSelection = (id: string) => {
    setParsedTasks(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
  };

  const handleConfirmImport = async () => {
    const selectedTasks = parsedTasks.filter(t => t.selected);
    if (selectedTasks.length === 0) {
      toast.error('Please select at least one task to import');
      return;
    }

    try {
      await onImport(selectedTasks.map(t => ({
        title: t.title,
        time: t.time,
        category: t.category,
        credits: t.credits,
        strategyId: t.strategyId,
      })));
      toast.success(`Imported ${selectedTasks.length} tasks successfully!`);
      onClose();
    } catch (error) {
      toast.error('Failed to import tasks');
    }
  };

  // Upload Step
  if (step === 'upload') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Smart Schedule Importer
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload a photo of a timetable or an Excel file
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
            id="schedule-file-input"
          />
          <label htmlFor="schedule-file-input" className="cursor-pointer">
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
            BUFF is analyzing your schedule... ⚡
          </h3>
          <p className="text-sm text-muted-foreground">
            Using AI to detect subjects, times, and days
          </p>
        </div>
      </div>
    );
  }

  // Review Step
  const selectedCount = parsedTasks.filter(t => t.selected).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Review & Confirm
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedCount} of {parsedTasks.length} tasks selected
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
          Upload Different
        </Button>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {parsedTasks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No tasks found. Try uploading a different file.
            </div>
          ) : (
            parsedTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "p-4 rounded-xl border transition-all",
                  task.selected 
                    ? "bg-card border-primary/50" 
                    : "bg-secondary/30 border-border opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Selection Checkbox */}
                  <button
                    onClick={() => toggleTaskSelection(task.id)}
                    className={cn(
                      "w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors",
                      task.selected 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "border-muted-foreground"
                    )}
                  >
                    {task.selected && <Check className="w-4 h-4" />}
                  </button>

                  {/* Task Details */}
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Title */}
                    <Input
                      value={task.title}
                      onChange={(e) => updateTask(task.id, { title: e.target.value })}
                      className="font-medium"
                      placeholder="Task title"
                    />

                    {/* Time, Day, Category Row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Input
                          type="time"
                          value={task.time}
                          onChange={(e) => updateTask(task.id, { time: e.target.value })}
                          className="text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Select
                          value={task.day}
                          onValueChange={(val) => updateTask(task.id, { day: val })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WEEK_DAYS.map(day => (
                              <SelectItem key={day} value={day}>
                                {WEEK_DAY_LABELS[day]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Select
                        value={task.category}
                        onValueChange={(val) => updateTask(task.id, { category: val as TaskCategory })}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Credits and Strategy */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Credits:</span>
                        <Input
                          type="number"
                          value={task.credits}
                          onChange={(e) => updateTask(task.id, { credits: parseInt(e.target.value) || 10 })}
                          className="w-20 text-sm"
                          min={1}
                          max={100}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-buff" />
                        <Select
                          value={task.strategyId || 'none'}
                          onValueChange={(val) => updateTask(task.id, { strategyId: val === 'none' ? undefined : val })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Daily Buff (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Buff</SelectItem>
                            {STRATEGIES.map(strategy => (
                              <SelectItem key={strategy.id} value={strategy.id}>
                                {strategy.icon} {strategy.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(task.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
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
          Import {selectedCount} Tasks
        </Button>
      </div>
    </div>
  );
}
