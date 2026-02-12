import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, CalendarDays, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export type GradeOption = 'preschool' | 'kindergarten' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'other';

interface Step1ProfileProps {
  initialData?: {
    childName?: string;
    birthDate?: Date;
    grade?: GradeOption;
  };
  onNext: (data: { childName: string; birthDate?: Date; grade?: GradeOption }) => void;
  isLoading?: boolean;
}

interface GradeGroup {
  titleHe: string;
  titleEn: string;
  options: { value: GradeOption; labelHe: string; labelEn: string }[];
}

const GRADE_GROUPS: GradeGroup[] = [
  {
    titleHe: 'גיל הרך',
    titleEn: 'Early childhood',
    options: [
      { value: 'preschool', labelHe: 'טרום חובה', labelEn: 'Pre-K' },
      { value: 'kindergarten', labelHe: 'גן חובה', labelEn: 'K' },
    ],
  },
  {
    titleHe: 'יסודי',
    titleEn: 'Elementary',
    options: [
      { value: '1', labelHe: 'א׳', labelEn: '1st' },
      { value: '2', labelHe: 'ב׳', labelEn: '2nd' },
      { value: '3', labelHe: 'ג׳', labelEn: '3rd' },
      { value: '4', labelHe: 'ד׳', labelEn: '4th' },
      { value: '5', labelHe: 'ה׳', labelEn: '5th' },
      { value: '6', labelHe: 'ו׳', labelEn: '6th' },
    ],
  },
  {
    titleHe: 'חטיבה ותיכון',
    titleEn: 'Middle & High',
    options: [
      { value: '7', labelHe: 'ז׳', labelEn: '7th' },
      { value: '8', labelHe: 'ח׳', labelEn: '8th' },
      { value: '9', labelHe: 'ט׳', labelEn: '9th' },
      { value: '10', labelHe: 'י׳', labelEn: '10th' },
      { value: '11', labelHe: 'י״א', labelEn: '11th' },
      { value: '12', labelHe: 'י״ב', labelEn: '12th' },
      { value: 'other', labelHe: 'אחר', labelEn: 'Other' },
    ],
  },
];

/** Map a grade to an approximate birth date (September 1st of the inferred birth year). */
export function gradeToApproxBirthDate(grade: GradeOption): Date | undefined {
  const currentYear = new Date().getFullYear();
  const gradeAgeMap: Record<string, number> = {
    preschool: 4, kindergarten: 5,
    '1': 6, '2': 7, '3': 8, '4': 9, '5': 10, '6': 11,
    '7': 12, '8': 13, '9': 14, '10': 15, '11': 16, '12': 17,
  };
  const age = gradeAgeMap[grade];
  if (age === undefined) return undefined;
  return new Date(currentYear - age, 8, 1);
}

export function Step1Profile({ initialData, onNext, isLoading }: Step1ProfileProps) {
  const { t, isRTL, language } = useLanguage();
  const [childName, setChildName] = useState(initialData?.childName || '');
  const [selectedGrade, setSelectedGrade] = useState<GradeOption | undefined>(initialData?.grade);
  const [showBirthYear, setShowBirthYear] = useState(false);
  const [birthYear, setBirthYear] = useState<string>(
    initialData?.birthDate ? String(initialData.birthDate.getFullYear()) : ''
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData?.childName) setChildName(initialData.childName);
    if (initialData?.grade) setSelectedGrade(initialData.grade);
    if (initialData?.birthDate) setBirthYear(String(initialData.birthDate.getFullYear()));
  }, [initialData]);

  const handleSubmit = () => {
    if (!childName.trim()) {
      setError(t('onboarding.step1.nameError'));
      return;
    }
    setError('');

    let birthDate: Date | undefined;
    if (showBirthYear && birthYear) {
      const yr = parseInt(birthYear);
      if (!isNaN(yr) && yr >= 2000 && yr <= new Date().getFullYear()) {
        birthDate = new Date(yr, 8, 1);
      }
    } else if (selectedGrade) {
      birthDate = gradeToApproxBirthDate(selectedGrade);
    }

    onNext({ childName: childName.trim(), birthDate, grade: selectedGrade });
  };

  const isHe = language === 'he';
  const displayName = childName.trim() || (isHe ? 'הילד/ה' : 'your child');

  return (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {isHe ? `בואו נתאים את BUFF ל${displayName}` : `Let's customize BUFF for ${displayName}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('onboarding.step1.subtitle')}
          </p>
        </div>

        {/* Child Name (required) */}
        <div className="space-y-1.5">
          <Label htmlFor="childName" className="block text-sm font-medium">
            {t('onboarding.step1.childName')}
          </Label>
          <Input
            id="childName"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder={t('onboarding.step1.namePlaceholder')}
            className="h-11 text-base"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Grade / Birth Year section (optional) */}
        <div className="space-y-3">
          <Label className="block text-sm font-medium">
            {isHe
              ? `באיזו מסגרת ${childName.trim() ? `${childName.trim()} נמצא/ת` : 'הילד/ה נמצא/ת'}?`
              : `What grade is ${childName.trim() || 'the child'} in?`}
            <span className="text-muted-foreground font-normal mr-1 ml-1">
              ({isHe ? 'אופציונלי' : 'Optional'})
            </span>
          </Label>

          {!showBirthYear ? (
            <div className="space-y-3">
              {/* Grouped Grade Chips */}
              {GRADE_GROUPS.map((group, gi) => (
                <div key={gi} className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {isHe ? group.titleHe : group.titleEn}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setSelectedGrade(selectedGrade === opt.value ? undefined : opt.value)
                        }
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                          selectedGrade === opt.value
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background text-foreground border-border hover:border-primary/40 hover:bg-primary/5'
                        )}
                      >
                        {isHe ? opt.labelHe : opt.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Switch to birth year — secondary button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBirthYear(true)}
                className="w-full gap-2 text-muted-foreground hover:text-foreground mt-1"
              >
                <CalendarDays className="w-4 h-4" />
                {isHe ? 'אני מעדיפ/ה להזין שנת לידה' : 'Prefer to enter birth year instead'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Birth Year Input */}
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder={isHe ? 'לדוגמה: 2015' : 'e.g., 2015'}
                  className="h-11 text-base w-36"
                  min={2000}
                  max={new Date().getFullYear()}
                  autoFocus
                />
                <span className="text-sm text-muted-foreground">
                  {isHe ? 'שנת לידה' : 'Birth year'}
                </span>
              </div>

              {/* Back to grades — secondary button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBirthYear(false)}
                className="w-full gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="w-4 h-4" />
                {isHe ? 'חזרה לבחירת כיתה' : 'Back to grade selection'}
              </Button>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <p className="text-xs text-muted-foreground/80 leading-relaxed">
          {isHe
            ? '💡 בחירת כיתה עוזרת לנו להתאים את המשימות. אפשר לדלג ולהוסיף אחר כך.'
            : '💡 Selecting a grade helps us tailor tasks. You can skip and add later.'}
        </p>
      </div>

      <div className="px-5 pb-6 pt-3 flex-shrink-0">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !childName.trim()}
          className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-l from-primary to-success"
          size="lg"
        >
          {isLoading ? (isHe ? 'יוצר פרופיל...' : 'Creating profile...') : t('onboarding.step1.cta')}
        </Button>
      </div>
    </div>
  );
}
