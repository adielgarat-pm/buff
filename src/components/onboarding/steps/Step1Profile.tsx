import { useState } from 'react';
import { format, differenceInYears } from 'date-fns';
import { he } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step1ProfileProps {
  onNext: (data: { childName: string; birthDate: Date }) => void;
}

export function Step1Profile({ onNext }: Step1ProfileProps) {
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [error, setError] = useState('');

  const calculateAge = (date: Date): number => {
    return differenceInYears(new Date(), date);
  };

  const handleSubmit = () => {
    if (!childName.trim()) {
      setError('אנא הזינו את שם הילד/ה');
      return;
    }
    if (!birthDate) {
      setError('אנא בחרו תאריך לידה');
      return;
    }
    const age = calculateAge(birthDate);
    if (age < 5 || age > 25) {
      setError('הגיל צריך להיות בין 5 ל-25');
      return;
    }
    setError('');
    onNext({ childName: childName.trim(), birthDate });
  };

  const age = birthDate ? calculateAge(birthDate) : null;

  // Date range for birth dates (ages 5-25)
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-5 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            בואו נכיר את הגיבורים שלכם
          </h1>
          <p className="text-muted-foreground">
            מי מצטרף לנבחרת BUFF?
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="childName" className="text-right block">שם הילד/ה</Label>
            <Input
              id="childName"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="לדוגמה: נועם"
              className="text-right h-12 text-base"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-right block">תאריך לידה</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-right font-normal",
                    !birthDate && "text-muted-foreground"
                  )}
                  dir="rtl"
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {birthDate ? (
                    <span className="flex-1 text-right">
                      {format(birthDate, "dd/MM/yyyy")}
                      {age !== null && (
                        <span className="text-muted-foreground mr-2">
                          (גיל {age})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>בחרו תאריך לידה</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={setBirthDate}
                  disabled={(date) => date > maxDate || date < minDate}
                  defaultMonth={new Date(today.getFullYear() - 10, 0)}
                  captionLayout="dropdown-buttons"
                  fromYear={today.getFullYear() - 25}
                  toYear={today.getFullYear() - 5}
                  locale={he}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {error && (
            <p className="text-sm text-destructive text-right">{error}</p>
          )}

          {/* Helper text */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground text-right leading-relaxed">
              💡 תאריך הלידה עוזר לנו להתאים את המשימות והשפה בדיוק לשלב שבו הילדים נמצאים.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-5 pb-8 pt-4">
        <Button 
          onClick={handleSubmit}
          className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-l from-primary to-success"
          size="lg"
        >
          בואו נתחיל! 🚀
        </Button>
      </div>
    </div>
  );
}
