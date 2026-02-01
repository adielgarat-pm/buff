import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';

interface FirstTaskNudgeCardProps {
  childName: string;
  onAddTask: () => void;
}

export function FirstTaskNudgeCard({ childName, onAddTask }: FirstTaskNudgeCardProps) {
  return (
    <div 
      className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center space-y-4"
      dir="rtl"
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-foreground">
          היי {childName}, מוכנים להתחיל?
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          הגדרנו את הפרופיל, עכשיו רק נשאר לבחור את המשימה הראשונה כדי להתחיל לצבור נקודות.
        </p>
      </div>

      {/* CTA */}
      <Button
        onClick={onAddTask}
        className="h-12 px-6 font-bold rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground"
      >
        <Plus className="w-5 h-5 ml-2" />
        הוספת משימה ראשונה
      </Button>
    </div>
  );
}
