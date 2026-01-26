import { useState, useEffect } from 'react';
import { format, parse, isValid, differenceInYears } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarDays, Loader2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';

interface BirthDatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  saving?: boolean;
}

export function BirthDatePicker({ value, onChange, saving }: BirthDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
  const [selectedDay, setSelectedDay] = useState<number | undefined>();

  // Generate years (from 2000 to current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);

  // Generate months
  const months = [
    { value: 0, label: 'ינואר' },
    { value: 1, label: 'פברואר' },
    { value: 2, label: 'מרץ' },
    { value: 3, label: 'אפריל' },
    { value: 4, label: 'מאי' },
    { value: 5, label: 'יוני' },
    { value: 6, label: 'יולי' },
    { value: 7, label: 'אוגוסט' },
    { value: 8, label: 'ספטמבר' },
    { value: 9, label: 'אוקטובר' },
    { value: 10, label: 'נובמבר' },
    { value: 11, label: 'דצמבר' },
  ];

  // Generate days based on selected year and month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const days = selectedYear !== undefined && selectedMonth !== undefined
    ? Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1)
    : Array.from({ length: 31 }, (_, i) => i + 1);

  // Sync state when value changes
  useEffect(() => {
    if (value) {
      setInputValue(format(value, 'dd/MM/yyyy'));
      setSelectedYear(value.getFullYear());
      setSelectedMonth(value.getMonth());
      setSelectedDay(value.getDate());
    } else {
      setInputValue('');
      setSelectedYear(undefined);
      setSelectedMonth(undefined);
      setSelectedDay(undefined);
    }
  }, [value]);

  // Handle manual input
  const handleInputChange = (text: string) => {
    setInputValue(text);
    
    // Try to parse the date
    const parsed = parse(text, 'dd/MM/yyyy', new Date());
    if (isValid(parsed) && parsed <= new Date() && parsed >= new Date('2000-01-01')) {
      setSelectedYear(parsed.getFullYear());
      setSelectedMonth(parsed.getMonth());
      setSelectedDay(parsed.getDate());
    }
  };

  // Handle dropdown selections
  const handleYearChange = (year: string) => {
    const y = parseInt(year);
    setSelectedYear(y);
    updateDateFromDropdowns(y, selectedMonth, selectedDay);
  };

  const handleMonthChange = (month: string) => {
    const m = parseInt(month);
    setSelectedMonth(m);
    updateDateFromDropdowns(selectedYear, m, selectedDay);
  };

  const handleDayChange = (day: string) => {
    const d = parseInt(day);
    setSelectedDay(d);
    updateDateFromDropdowns(selectedYear, selectedMonth, d);
  };

  const updateDateFromDropdowns = (year?: number, month?: number, day?: number) => {
    if (year !== undefined && month !== undefined && day !== undefined) {
      const date = new Date(year, month, day);
      if (isValid(date) && date <= new Date()) {
        setInputValue(format(date, 'dd/MM/yyyy'));
      }
    }
  };

  const handleConfirm = () => {
    if (selectedYear !== undefined && selectedMonth !== undefined && selectedDay !== undefined) {
      const date = new Date(selectedYear, selectedMonth, selectedDay);
      if (isValid(date) && date <= new Date()) {
        onChange(date);
        setOpen(false);
      }
    }
  };

  const calculateAge = (date: Date | undefined): string => {
    if (!date) return '';
    const age = differenceInYears(new Date(), date);
    return `גיל ${age}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 justify-start text-right font-normal min-w-[140px]",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarDays className="w-4 h-4 ml-2 text-muted-foreground" />
            {value ? (
              <span className="flex items-center gap-2">
                {format(value, 'dd/MM/yyyy')}
                <span className="text-xs text-muted-foreground">({calculateAge(value)})</span>
              </span>
            ) : (
              <span>בחר תאריך</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 bg-popover border-border z-50" align="end">
          <div className="space-y-4">
            {/* Manual Input */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">הקלד תאריך (DD/MM/YYYY)</label>
              <Input
                type="text"
                placeholder="01/01/2015"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                className="bg-background border-border text-center"
                dir="ltr"
              />
            </div>

            <div className="text-xs text-center text-muted-foreground">או בחר מהרשימות</div>

            {/* Year Selector */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">שנה</label>
              <Select
                value={selectedYear?.toString() || ''}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="בחר שנה" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50 max-h-48">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Selector */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">חודש</label>
              <Select
                value={selectedMonth?.toString() || ''}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="בחר חודש" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50 max-h-48">
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Day Selector */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">יום</label>
              <Select
                value={selectedDay?.toString() || ''}
                onValueChange={handleDayChange}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="בחר יום" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50 max-h-48">
                  {days.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Confirm Button */}
            <Button
              onClick={handleConfirm}
              disabled={selectedYear === undefined || selectedMonth === undefined || selectedDay === undefined}
              className="w-full"
            >
              <Check className="w-4 h-4 ml-2" />
              אישור
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {saving && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
    </div>
  );
}
