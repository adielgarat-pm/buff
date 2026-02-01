import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { OnboardingCard } from '../OnboardingCard';
import { School, Moon, Focus } from 'lucide-react';

export type SchoolFeature = 'school_quest' | 'evening_prep';

interface Step3SchoolFeatureProps {
  onNext: (data: { schoolFeature: SchoolFeature }) => void;
  onBack: () => void;
}

export function Step3SchoolFeature({ onNext, onBack }: Step3SchoolFeatureProps) {
  const [selected, setSelected] = useState<SchoolFeature | null>(null);

  const handleNext = () => {
    if (selected) {
      onNext({ schoolFeature: selected });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <School className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">
            בוחרים את הכוח שלכם בבית הספר
          </h1>
          <p className="text-xs text-muted-foreground">
            מערכת השעות יכולה לעזור לכם באחת משתי דרכים. בחרו את המסלול שמתאים לכם:
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <OnboardingCard
            emoji="🎯"
            title="School Quest – ניהול קשב"
            description="רפלקציה על קשב, השתתפות ומודעות למשימות במהלך השיעורים. צברו נקודות על כל רפלקציה!"
            selected={selected === 'school_quest'}
            onClick={() => setSelected('school_quest')}
          >
            <div className="mt-2 flex items-center gap-2 text-xs text-success">
              <Focus className="w-4 h-4" />
              <span>מתאים לילדים שרוצים לשפר ריכוז בכיתה</span>
            </div>
          </OnboardingCard>

          <OnboardingCard
            emoji="🌙"
            title="משימת ערב – בונוס מוכנות"
            description="הכנת הציוד ומערכת השעות למחר. בוקר רגוע וראש פנוי לבית הספר!"
            selected={selected === 'evening_prep'}
            onClick={() => setSelected('evening_prep')}
          >
            <div className="mt-2 flex items-center gap-2 text-xs text-success">
              <Moon className="w-4 h-4" />
              <span>מתאים לילדים שמתקשים להתארגן בבוקר</span>
            </div>
          </OnboardingCard>
        </div>

        {/* Note */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground text-right">
            💡 תמיד אפשר לשנות את הבחירה בהגדרות. רק אחת מהאפשרויות יכולה להיות פעילה.
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="px-5 pb-6 pt-3 flex gap-3 flex-shrink-0 bg-background">
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
