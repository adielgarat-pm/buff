import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { OnboardingCard } from '../OnboardingCard';
import { Target } from 'lucide-react';

export type FocusArea = 'homework' | 'project' | 'fitness' | 'home';

interface Step2FocusAreaProps {
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

export function Step2FocusArea({ onNext, onBack }: Step2FocusAreaProps) {
  const [selected, setSelected] = useState<FocusArea | null>(null);

  const handleNext = () => {
    if (selected) {
      onNext({ focusArea: selected });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-5 py-6 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground leading-tight">
            מה המקום שהכי הייתם רוצים להצליח בו השבוע?
          </h1>
          <p className="text-sm text-muted-foreground">
            בחירה של הילדים היא המנוע למוטיבציה הפנימית. שבו יחד ובחרו תחום אחד:
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {FOCUS_OPTIONS.map((option) => (
            <OnboardingCard
              key={option.id}
              emoji={option.emoji}
              title={option.title}
              description={option.description}
              selected={selected === option.id}
              onClick={() => setSelected(option.id)}
            />
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="px-5 pb-8 pt-4 flex gap-3">
        <Button 
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12 rounded-xl"
        >
          חזרה
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!selected}
          className="flex-[2] h-12 font-bold rounded-xl bg-gradient-to-l from-primary to-success"
        >
          המשך
        </Button>
      </div>
    </div>
  );
}
