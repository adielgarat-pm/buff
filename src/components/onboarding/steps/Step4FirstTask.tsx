import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Timer, CheckCircle, Sparkles } from 'lucide-react';

interface Step4FirstTaskProps {
  onNext: (data: { firstTask: string }) => void;
  onBack: () => void;
}

export function Step4FirstTask({ onNext, onBack }: Step4FirstTaskProps) {
  const [firstTask, setFirstTask] = useState('');

  const handleNext = () => {
    onNext({ firstTask: firstTask.trim() || 'לפתור תרגיל אחד' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">
            מנצחים את ה"התנעה" 🏁
          </h1>
        </div>

        {/* Tips */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-card border border-border">
            <Timer className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground text-right">
              <strong>קשה לצלול למשימה?</strong> קובעים רק 15 דקות.
            </p>
          </div>
          
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-card border border-border">
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground text-right">
              בוחרים משהו <strong>קטנטן</strong> שאפשר לסיים מהר.
            </p>
          </div>
          
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-card border border-border">
            <Sparkles className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground text-right">
              ברגע שמתחילים – <strong>הדופמין כבר יעשה את השאר!</strong>
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2">
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
