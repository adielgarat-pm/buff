import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Timer, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';

interface Step4FirstTaskProps {
  initialValue?: string;
  onNext: (data: { firstTask: string }) => void;
  onBack: () => void;
}

export function Step4FirstTask({ initialValue, onNext, onBack }: Step4FirstTaskProps) {
  const [firstTask, setFirstTask] = useState(initialValue || '');

  useEffect(() => {
    if (initialValue) setFirstTask(initialValue);
  }, [initialValue]);

  const handleNext = () => {
    onNext({ firstTask: firstTask.trim() || 'לפתור תרגיל אחד' });
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
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-base font-bold text-foreground">
            מנצחים את ה"התנעה" 🏁
          </h1>
        </div>

        {/* Tips */}
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 p-2 rounded-xl bg-card border border-border">
            <Timer className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground text-right">
              <strong>קשה לצלול למשימה?</strong> קובעים רק 15 דקות.
            </p>
          </div>
          
          <div className="flex items-start gap-2 p-2 rounded-xl bg-card border border-border">
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground text-right">
              בוחרים משהו <strong>קטנטן</strong> שאפשר לסיים מהר.
            </p>
          </div>
          
          <div className="flex items-start gap-2 p-2 rounded-xl bg-card border border-border">
            <Sparkles className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground text-right">
              ברגע שמתחילים – <strong>הדופמין כבר יעשה את השאר!</strong>
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-1.5">
          <Label htmlFor="firstTask" className="text-right block font-semibold text-sm">
            המשימה הראשונה שלי:
          </Label>
          <Input
            id="firstTask"
            value={firstTask}
            onChange={(e) => setFirstTask(e.target.value)}
            placeholder="לדוגמה: לפתור תרגיל אחד"
            className="text-right h-11 text-base"
            dir="rtl"
          />
          <p className="text-xs text-muted-foreground text-right">
            זו תהיה המשימה שתופיע ראשונה בדשבורד 🎯
          </p>
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-5 pb-6 pt-3 flex-shrink-0 bg-background">
        <Button 
          onClick={handleNext}
          className="w-full h-11 font-bold rounded-xl bg-gradient-to-l from-primary to-success"
        >
          המשך
        </Button>
      </div>
    </div>
  );
}
