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

type CategoryKey = 'early' | 'elementary' | 'secondary';

interface GradeCategory {
  key: CategoryKey;
  labelHe: string;
  labelEn: string;
  options: { value: GradeOption; labelHe: string; labelEn: string }[];
}

const CATEGORIES: GradeCategory[] = [
  {
    key: 'early',
    labelHe: 'גיל הרך',
    labelEn: 'Early',
    options: [
      { value: 'preschool', labelHe: 'טרום חובה', labelEn: 'Pre-K' },
      { value: 'kindergarten', labelHe: 'גן חובה', labelEn: 'K' },
    ],
  },
  {
    key: 'elementary',
    labelHe: 'יסודי',
    labelEn: 'Elementary',
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
    key: 'secondary',
    labelHe: 'חטיבה ותיכון',
    labelEn: 'Middle & High',
    options: [
      { value: '7', labelHe: 'ז׳', labelEn: '7th' },
      { value: '8', labelHe: 'ח׳', labelEn: '8th' },
      { value: '9', labelHe: 'ט׳', labelEn: '9th' },
      { value: '10', labelHe: 'י׳', labelEn: '10th' },
      { value: '11', labelHe: 'י״א', labelEn: '11th' },
      { value: '12', labelHe: 'י״ב', labelEn: '12th' },
    ],
  },
];

function findCategoryForGrade(grade: GradeOption): CategoryKey {
  for (const cat of CATEGORIES) {
    if (cat.options.some((o) => o.value === grade)) return cat.key;
  }
  return 'elementary';
}

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
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(
    initialData?.grade ? findCategoryForGrade(initialData.grade) : 'elementary'
  );
  const [showBirthYear, setShowBirthYear] = useState(false);
  const [birthYear, setBirthYear] = useState<string>(
    initialData?.birthDate ? String(initialData.birthDate.getFullYear()) : ''
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData?.childName) setChildName(initialData.childName);
    if (initialData?.grade) {
      setSelectedGrade(initialData.grade);
      setActiveCategory(findCategoryForGrade(initialData.grade));
    }
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
  const activeCat = CATEGORIES.find((c) => c.key === activeCategory)!;

  return (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex-1 px-4 pt-2 pb-1 space-y-2 overflow-y-auto">
        {/* Compact Header */}
        <div className="text-center space-y-0">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="w-4.5 h-4.5 text-primary" />
          </div>
          <h1 className="text-base font-bold text-foreground leading-tight">
            {isHe ? `בואו נתאים את BUFF ל${displayName}` : `Let's customize BUFF for ${displayName}`}
          </h1>
        </div>

        {/* Child Name */}
        <div className="space-y-0.5">
          <Label htmlFor="childName" className="text-xs font-medium">
            {t('onboarding.step1.childName')}
          </Label>
          <Input
            id="childName"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder={t('onboarding.step1.namePlaceholder')}
            className="h-9 text-sm"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Grade Section */}
        {!showBirthYear ? (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {isHe
                ? `באיזו מסגרת ${childName.trim() ? `${childName.trim()} נמצא/ת` : 'הילד/ה'}?`
                : `Grade?`}
              <span className="text-muted-foreground font-normal mr-1 ml-1">
                ({isHe ? 'אופציונלי' : 'Optional'})
              </span>
            </Label>

            {/* Segmented Tabs */}
            <div className="flex rounded-lg bg-muted/60 p-0.5 gap-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    'flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all',
                    activeCategory === cat.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {isHe ? cat.labelHe : cat.labelEn}
                </button>
              ))}
            </div>

            {/* Grade Chips — 3-column grid, tight gaps */}
            <div className="grid grid-cols-3 gap-1">
              {activeCat.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setSelectedGrade(selectedGrade === opt.value ? undefined : opt.value)
                  }
                  className={cn(
                    'py-1.5 rounded-lg text-xs font-medium border transition-all text-center',
                    selectedGrade === opt.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background text-foreground border-border hover:border-primary/40'
                  )}
                >
                  {isHe ? opt.labelHe : opt.labelEn}
                </button>
              ))}
            </div>

            {/* 'Other' chip — standalone, outlined, full-width */}
            <button
              type="button"
              onClick={() =>
                setSelectedGrade(selectedGrade === 'other' ? undefined : 'other')
              }
              className={cn(
                'w-full py-1.5 rounded-lg text-xs font-medium border transition-all text-center',
                selectedGrade === 'other'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-border border-dashed hover:border-primary/40 hover:text-foreground'
              )}
            >
              {isHe ? 'אחר / לא רלוונטי' : 'Other / N/A'}
            </button>

            {/* Switch to birth year — minimal */}
            <button
              type="button"
              onClick={() => setShowBirthYear(true)}
              className="flex items-center justify-center gap-1 w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <CalendarDays className="w-3 h-3" />
              {isHe ? 'להזין שנת לידה במקום' : 'Enter birth year instead'}
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {isHe ? 'שנת לידה' : 'Birth year'}
              <span className="text-muted-foreground font-normal mr-1 ml-1">
                ({isHe ? 'אופציונלי' : 'Optional'})
              </span>
            </Label>
            <Input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder={isHe ? 'לדוגמה: 2015' : 'e.g., 2015'}
              className="h-9 text-sm w-32"
              min={2000}
              max={new Date().getFullYear()}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowBirthYear(false)}
              className="flex items-center justify-center gap-1 w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="w-3 h-3" />
              {isHe ? 'חזרה לבחירת כיתה' : 'Back to grade selection'}
            </button>
          </div>
        )}

        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </div>

      {/* CTA pinned to bottom */}
      <div className="px-4 pb-4 pt-1.5 flex-shrink-0">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !childName.trim()}
          className="w-full h-11 text-base font-bold rounded-xl bg-gradient-to-l from-primary to-success"
          size="lg"
        >
          {isLoading ? (isHe ? 'יוצר פרופיל...' : 'Creating...') : t('onboarding.step1.cta')}
        </Button>
      </div>
    </div>
  );
}
