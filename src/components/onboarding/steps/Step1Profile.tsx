import { useState, useEffect } from 'react';
import { differenceInYears } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Step1ProfileProps {
  initialData?: {
    childName?: string;
    birthDate?: Date;
  };
  onNext: (data: { childName: string; birthDate: Date }) => void;
}

export function Step1Profile({ initialData, onNext }: Step1ProfileProps) {
  const { t, isRTL } = useLanguage();
  const [childName, setChildName] = useState(initialData?.childName || '');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    initialData?.birthDate?.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(
    initialData?.birthDate?.getMonth()
  );
  const [selectedDay, setSelectedDay] = useState<number | undefined>(
    initialData?.birthDate?.getDate()
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData?.childName) setChildName(initialData.childName);
    if (initialData?.birthDate) {
      setSelectedYear(initialData.birthDate.getFullYear());
      setSelectedMonth(initialData.birthDate.getMonth());
      setSelectedDay(initialData.birthDate.getDate());
    }
  }, [initialData]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 5 - i);

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
      setError(t('onboarding.step1.nameError'));
      return;
    }
    if (selectedYear === undefined || selectedMonth === undefined || selectedDay === undefined) {
      setError(t('onboarding.step1.dateError'));
      return;
    }
    const birthDate = new Date(selectedYear, selectedMonth, selectedDay);
    const age = differenceInYears(new Date(), birthDate);
    if (age < 5 || age > 25) {
      setError(t('onboarding.step1.ageError'));
      return;
    }
    setError('');
    onNext({ childName: childName.trim(), birthDate });
  };

  const age = calculateAge();

  return (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex-1 px-5 py-4 space-y-4">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {t('onboarding.step1.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('onboarding.step1.subtitle')}
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="childName" className="block text-sm">{t('onboarding.step1.childName')}</Label>
            <Input
              id="childName"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder={t('onboarding.step1.namePlaceholder')}
              className="h-11 text-base"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="block text-sm">{t('onboarding.step1.birthDate')}</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={selectedDay?.toString() || ''}
                onValueChange={(v) => setSelectedDay(parseInt(v))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t('onboarding.step1.day')} />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {getDaysInMonth().map((day) => (
                    <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedMonth?.toString() || ''}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t('onboarding.step1.month')} />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {t(`onboarding.month.${i}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedYear?.toString() || ''}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t('onboarding.step1.year')} />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {age !== null && (
              <p className="text-xs text-primary font-medium">
                {t('onboarding.step1.age')}: {age} {t('onboarding.step1.years')} ✨
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground/80 leading-relaxed">
          {t('onboarding.step1.birthDateHelp')}
        </p>
      </div>

      <div className="px-5 pb-6 pt-3 flex-shrink-0">
        <Button 
          onClick={handleSubmit}
          className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-l from-primary to-success"
          size="lg"
        >
          {t('onboarding.step1.cta')}
        </Button>
      </div>
    </div>
  );
}
