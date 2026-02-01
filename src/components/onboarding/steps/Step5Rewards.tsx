import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Star, TrendingUp } from 'lucide-react';

interface Step5RewardsProps {
  onNext: (data: { weekendReward: string }) => void;
  onBack: () => void;
}

export function Step5Rewards({ onNext, onBack }: Step5RewardsProps) {
  const [weekendReward, setWeekendReward] = useState('');

  const handleNext = () => {
    onNext({ weekendReward: weekendReward.trim() || 'בילוי משותף' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">
            הופכים מאמץ לכיף 🎮
          </h1>
        </div>

        {/* Tips */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-card border border-border">
            <Star className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground text-right">
              <strong>כל צעד נחשב:</strong> על כל סימון ✓ במשימה צוברים נקודות.
            </p>
          </div>
          
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-card border border-border">
            <TrendingUp className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground text-right">
              <strong>המטרה:</strong> להפוך את המאמץ היומי לסיפוק מיידי.
            </p>
          </div>
        </div>

        {/* Reward Examples */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-1.5">
          <p className="text-sm font-medium text-foreground text-right">רעיונות לפרסים:</p>
          <div className="flex flex-wrap gap-1.5">
            {['🎬 ערב סרט', '🍕 פיצה', '📱 זמן מסך', '🎮 משחק חדש', '🛍️ קניות'].map((reward) => (
              <span 
                key={reward} 
                className="text-xs px-2.5 py-1 rounded-full bg-background border border-border"
              >
                {reward}
              </span>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <Label htmlFor="weekendReward" className="text-right block font-semibold text-sm">
            פרס סוף השבוע שלנו:
          </Label>
          <Input
            id="weekendReward"
            value={weekendReward}
            onChange={(e) => setWeekendReward(e.target.value)}
            placeholder="לדוגמה: בילוי משותף או זמן מסך"
            className="text-right h-11 text-base"
            dir="rtl"
          />
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
          className="flex-[2] h-12 font-bold rounded-xl bg-gradient-to-l from-primary to-success"
        >
          המשך
        </Button>
      </div>
    </div>
  );
}
