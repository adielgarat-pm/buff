import { useState } from 'react';
import { differenceInYears } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

interface Step1ProfileProps {
  onNext: (data: { childName: string; birthDate: Date }) => void;
}

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

export function Step1Profile({ onNext }: Step1ProfileProps) {
  const [childName, setChildName] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
  const [selectedDay, setSelectedDay] = useState<number | undefined>();
  const [error, setError] = useState('');

  // Generate years (ages 5-25)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 5 - i);

  // Generate days based on selected month/year
  const getDaysInMonth = (): number[] => {
    if (selectedYear === undefined || selectedMonth === undefined) {
      return Array.from({ length: 31 }, (_, i) => i + 1);
    }
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const calculateAge = (): number | null => {
    if (selectedYear === undefined || selectedMonth === undefined || selectedDay === undefined) return null;
    const birthDate = new Date(selectedYear, selectedMonth, selectedDay);
    return differenceInYears(new Date(), birthDate);
  };

  const handleSubmit = () => {
    if (!childName.trim()) {
      setError('אנא הזינו את שם הילד/ה');
      return;
    }
    if (selectedYear === undefined || selectedMonth === undefined || selectedDay === undefined) {
      setError('אנא בחרו תאריך לידה מלא');
      return;
    }
    const birthDate = new Date(selectedYear, selectedMonth, selectedDay);
    const age = differenceInYears(new Date(), birthDate);
    if (age < 5 || age > 25) {
      setError('הגיל צריך להיות בין 5 ל-25');
      return;
    }
    setError('');
    onNext({ childName: childName.trim(), birthDate });
  };

  const age = calculateAge();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-5 py-4 space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            בואו נכיר את הגיבורים שלכם
          </h1>
          <p className="text-sm text-muted-foreground">
            מי מצטרף לנבחרת BUFF?
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="childName" className="text-right block text-sm">שם הילד/ה</Label>
            <Input
              id="childName"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="לדוגמה: נועם"
              className="text-right h-11 text-base"
              dir="rtl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-right block text-sm">תאריך לידה</Label>
            <div className="grid grid-cols-3 gap-2">
              {/* Day Select */}
              <Select
                value={selectedDay?.toString() || ''}
                onValueChange={(v) => setSelectedDay(parseInt(v))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="יום" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {getDaysInMonth().map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Month Select */}
              <Select
                value={selectedMonth?.toString() || ''}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="חודש" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year Select */}
              <Select
                value={selectedYear?.toString() || ''}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="שנה" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Age display */}
            {age !== null && (
              <p className="text-xs text-primary font-medium text-right">
                גיל: {age} שנים ✨
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive text-right">{error}</p>
          )}
        </div>

        {/* Helper text */}
        <p className="text-xs text-muted-foreground/80 text-right leading-relaxed">
          💡 תאריך הלידה עוזר לנו להתאים את המשימות והשפה לשלב שבו הילדים נמצאים.
        </p>
      </div>

      {/* CTA Button */}
      <div className="px-5 pb-6 pt-3 flex-shrink-0">
        <Button 
          onClick={handleSubmit}
          className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-l from-primary to-success"
          size="lg"
        >
          בואו נתחיל! 🚀
        </Button>
      </div>
    </div>
  );
}
