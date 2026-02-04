import { Plus, TrendingUp, BarChart3, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeHomeScreenProps {
  onStartOnboarding: () => void;
}

export function WelcomeHomeScreen({ onStartOnboarding }: WelcomeHomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center" dir="rtl">
      {/* Main CTA - Large Pulsing Plus Button */}
      <div className="relative mb-6">
        {/* Outer pulse ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-soft scale-125" />
        
        {/* Main button */}
        <button
          onClick={onStartOnboarding}
          className={cn(
            "relative w-28 h-28 rounded-full",
            "bg-gradient-to-br from-primary to-primary/80",
            "flex items-center justify-center",
            "shadow-lg hover:shadow-xl",
            "transition-transform hover:scale-105 active:scale-95",
            "focus:outline-none focus:ring-4 focus:ring-primary/30"
          )}
          aria-label="הוספת ילד ראשון"
        >
          <Plus className="w-14 h-14 text-primary-foreground" strokeWidth={2.5} />
        </button>
      </div>

      {/* CTA Text */}
      <div className="space-y-2 max-w-xs mb-10">
        <h1 className="text-xl font-bold text-foreground font-display">
          הוסיפו את הילד הראשון שלכם
        </h1>
        <p className="text-sm text-muted-foreground">
          כדי להתחיל במסע המשותף
        </p>
      </div>

      {/* Insights Teaser - Blurred Preview */}
      <div className="w-full max-w-sm">
        <div className="relative rounded-2xl border border-primary/20 bg-card/50 p-5 overflow-hidden">
          {/* Blur overlay */}
          <div className="absolute inset-0 backdrop-blur-sm bg-card/60 z-10 flex flex-col items-center justify-center">
            <Lock className="w-8 h-8 text-primary/60 mb-2" />
            <p className="text-sm font-medium text-foreground">
              חברו ילד כדי לפתוח תובנות אלו
            </p>
          </div>
          
          {/* Placeholder chart content */}
          <div className="space-y-4 opacity-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">אחוז הצלחה שבועי</span>
              </div>
              <span className="text-2xl font-bold text-primary">78%</span>
            </div>
            
            {/* Fake bar chart */}
            <div className="flex items-end gap-2 h-20 justify-center">
              {[65, 80, 45, 90, 70, 85, 75].map((height, i) => (
                <div
                  key={i}
                  className="w-6 rounded-t-md bg-gradient-to-t from-primary/40 to-primary/20"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>א</span>
              <span>ב</span>
              <span>ג</span>
              <span>ד</span>
              <span>ה</span>
              <span>ו</span>
              <span>ש</span>
            </div>
          </div>
        </div>
        
        {/* Caption */}
        <p className="mt-3 text-xs text-muted-foreground flex items-center justify-center gap-1">
          <BarChart3 className="w-3 h-3" />
          תובנות והתקדמות - בקרוב אצלכם
        </p>
      </div>
    </div>
  );
}
