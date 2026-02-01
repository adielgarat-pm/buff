import { OnboardingCard } from '../OnboardingCard';
import { Target, ArrowRight } from 'lucide-react';

export type FocusArea = 'homework' | 'project' | 'fitness' | 'home';

interface Step2FocusAreaProps {
  initialValue?: FocusArea;
  onNext: (data: { focusArea: FocusArea }) => void;
  onBack: () => void;
}

const FOCUS_OPTIONS: { id: FocusArea; emoji: string; title: string; description: string }[] = [
  {
    id: 'homework',
    emoji: '🎓',
    title: 'שיעורי בית ותרגול',
    description: 'למידה ממוקדת והצלחה במשימות לימודיות.'
  },
  {
    id: 'project',
    emoji: '🚀',
    title: 'פרויקט אישי',
    description: 'קידום תחביב, תכנות או חלום שלכם.'
  },
  {
    id: 'fitness',
    emoji: '⚡',
    title: 'כושר וספורט',
    description: 'התמדה באימונים ובתנועה יומית.'
  },
  {
    id: 'home',
    emoji: '🏠',
    title: 'בית וארגון',
    description: 'עצמאות וסדר בחדר ובחיי היומיום.'
  }
];

export function Step2FocusArea({ initialValue, onNext, onBack }: Step2FocusAreaProps) {
  const handleSelect = (focusArea: FocusArea) => {
    onNext({ focusArea });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-5 py-3 space-y-3 overflow-y-auto">
        {/* Header with back arrow */}
        <div className="text-center space-y-1 relative">
          <button
            type="button"
            onClick={onBack}
            className="absolute right-0 top-0 p-1.5 -mr-1.5 rounded-full hover:bg-muted transition-colors"
            aria-label="חזרה"
          >
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-base font-bold text-foreground leading-tight">
            מה המקום שהכי הייתם רוצים להצליח בו השבוע?
          </h1>
          <p className="text-xs text-muted-foreground">
            בחרו תחום אחד:
          </p>
        </div>

        {/* Options */}
        <div className="space-y-1.5">
          {FOCUS_OPTIONS.map((option) => (
            <OnboardingCard
              key={option.id}
              emoji={option.emoji}
              title={option.title}
              description={option.description}
              selected={initialValue === option.id}
              onClick={() => handleSelect(option.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
