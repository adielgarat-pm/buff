import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { OnboardingCard } from '../OnboardingCard';
import { School, Moon, Focus, ArrowRight } from 'lucide-react';

export type SchoolFeature = 'school_quest' | 'evening_prep';

interface Step3SchoolFeatureProps {
  initialValue?: SchoolFeature;
  onNext: (data: { schoolFeature: SchoolFeature }) => void;
  onBack: () => void;
}

export function Step3SchoolFeature({ initialValue, onNext, onBack }: Step3SchoolFeatureProps) {
  const [selected, setSelected] = useState<SchoolFeature | null>(initialValue || null);

  useEffect(() => {
    if (initialValue) setSelected(initialValue);
  }, [initialValue]);

  const handleNext = () => {
    if (selected) {
      onNext({ schoolFeature: selected });
    }
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
            <School className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-base font-bold text-foreground">
            בוחרים את הכוח שלכם בבית הספר
          </h1>
          <p className="text-xs text-muted-foreground">
            בחרו את המסלול שמתאים לכם:
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <OnboardingCard
            emoji="🎯"
            title="School Quest – ניהול קשב"
            description="רפלקציה על קשב והשתתפות במהלך השיעורים."
            selected={selected === 'school_quest'}
            onClick={() => setSelected('school_quest')}
          >
            <div className="mt-1.5 flex items-center gap-2 text-xs text-success">
              <Focus className="w-3.5 h-3.5" />
              <span>מתאים לילדים שרוצים לשפר ריכוז בכיתה</span>
            </div>
          </OnboardingCard>

          <OnboardingCard
            emoji="🌙"
            title="משימת ערב – בונוס מוכנות"
            description="הכנת הציוד ומערכת השעות למחר."
            selected={selected === 'evening_prep'}
            onClick={() => setSelected('evening_prep')}
          >
            <div className="mt-1.5 flex items-center gap-2 text-xs text-success">
              <Moon className="w-3.5 h-3.5" />
              <span>מתאים לילדים שמתקשים להתארגן בבוקר</span>
            </div>
          </OnboardingCard>
        </div>

        {/* Note */}
        <div className="p-2.5 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground text-right">
            💡 תמיד אפשר לשנות את הבחירה בהגדרות.
          </p>
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-5 pb-6 pt-3 flex-shrink-0 bg-background">
        <Button 
          onClick={handleNext}
          disabled={!selected}
          className="w-full h-11 font-bold rounded-xl bg-gradient-to-l from-primary to-success"
        >
          המשך
        </Button>
      </div>
    </div>
  );
}
