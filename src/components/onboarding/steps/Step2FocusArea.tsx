import { useState } from 'react';
import { Target, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export type FocusArea = 'homework' | 'project' | 'fitness' | 'home';

interface Step2FocusAreaProps {
  childName?: string;
  initialValue?: FocusArea;
  onNext: (data: { focusArea: FocusArea }) => void;
  onBack: () => void;
}

const FOCUS_OPTIONS: { id: FocusArea; emoji: string }[] = [
  { id: 'homework', emoji: '🎓' },
  { id: 'project', emoji: '🚀' },
  { id: 'fitness', emoji: '⚡' },
  { id: 'home', emoji: '🏠' },
];

const LABELS: Record<string, Record<FocusArea, { title: string; desc: string }>> = {
  he: {
    homework: { title: 'למידה חיובית', desc: 'שיעורי בית ולמידה בדרך רגועה' },
    project: { title: 'פרויקט אישי', desc: 'תחביבים, יצירתיות ויוזמות' },
    fitness: { title: 'אנרגיה וספורט', desc: 'תנועה, חוגים ואורח חיים בריא' },
    home: { title: 'בית וארגון', desc: 'סידור החדר ועזרה בבית' },
  },
  en: {
    homework: { title: 'Positive Learning', desc: 'Homework & study in a calm way' },
    project: { title: 'Personal Project', desc: 'Hobbies, creativity & ventures' },
    fitness: { title: 'Energy & Sports', desc: 'Motion, clubs & healthy lifestyle' },
    home: { title: 'Home & Org', desc: 'Room tidying & helping out' },
  },
};

export function Step2FocusArea({ childName, initialValue, onNext, onBack }: Step2FocusAreaProps) {
  const { isRTL, language } = useLanguage();
  const [tappedId, setTappedId] = useState<FocusArea | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const lang = language === 'he' ? 'he' : 'en';
  const isHe = lang === 'he';
  const name = childName || (isHe ? 'הילד/ה' : 'your child');

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const handleSelect = (id: FocusArea) => {
    if (isAdvancing) return; // Prevent double-tap
    setIsAdvancing(true);
    setTappedId(id);
    setTimeout(() => onNext({ focusArea: id }), 200);
  };

  return (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex-1 px-4 pt-2 pb-2 space-y-2.5 overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-0.5 relative">
          <button
            type="button"
            onClick={onBack}
            className="absolute start-0 top-0 p-1.5 rounded-full hover:bg-muted transition-colors"
            aria-label={isHe ? 'חזרה' : 'Back'}
          >
            <BackArrow className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Target className="w-4.5 h-4.5 text-primary" />
          </div>
          <h1 className="text-base font-bold text-foreground leading-tight px-6">
            {isHe
              ? `איפה הכי תרצו ש${name} יצליח/תצליח השבוע?`
              : `Where would you like ${name} to thrive this week?`}
          </h1>
          <p className="text-[11px] text-muted-foreground">
            {isHe ? 'בחרו תחום אחד:' : 'Choose one area:'}
          </p>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2">
          {FOCUS_OPTIONS.map((option) => {
            const labels = LABELS[lang][option.id];
            const selected = initialValue === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={cn(
                  'flex flex-col items-center text-center p-3 rounded-xl border-2 transition-all duration-200',
                  'hover:border-primary/50 hover:bg-primary/5',
                  tappedId === option.id && 'scale-[0.93] opacity-80',
                  selected
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                    : 'border-border bg-card'
                )}
              >
                <span className="text-2xl mb-1">{option.emoji}</span>
                <h3 className={cn(
                  'font-bold text-sm leading-tight',
                  selected ? 'text-primary' : 'text-foreground'
                )}>
                  {labels.title}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                  {labels.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
