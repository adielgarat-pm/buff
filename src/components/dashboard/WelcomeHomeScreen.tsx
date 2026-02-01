import { Button } from '@/components/ui/button';
import { Rocket, Sparkles, Heart } from 'lucide-react';

interface WelcomeHomeScreenProps {
  onStartOnboarding: () => void;
}

export function WelcomeHomeScreen({ onStartOnboarding }: WelcomeHomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center" dir="rtl">
      {/* Calm illustration area */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-success/20 flex items-center justify-center animate-pulse-soft">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <Heart className="w-12 h-12 text-primary" />
          </div>
        </div>
        
        {/* Floating sparkles */}
        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-accent animate-bounce" />
        <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-primary/60 animate-bounce delay-150" />
      </div>

      {/* Welcome text */}
      <div className="space-y-4 max-w-sm">
        <h1 className="text-2xl font-bold text-foreground font-display leading-tight">
          ברוכים הבאים ל-BUFF!
        </h1>
        <p className="text-lg text-muted-foreground">
          הבית החדש של השגרה שלכם.
        </p>
        
        <p className="text-sm text-muted-foreground/80 leading-relaxed pt-2">
          כדי להתחיל, אנחנו צריכים להכיר את הגיבורים שלכם.
          <br />
          <span className="text-primary font-medium">זה לוקח פחות מ-2 דקות.</span>
        </p>
      </div>

      {/* CTA Button */}
      <Button
        onClick={onStartOnboarding}
        size="lg"
        className="mt-8 h-14 px-8 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-success text-primary-foreground shadow-lg hover:shadow-xl transition-all"
      >
        <Rocket className="w-5 h-5 ml-2" />
        הוספת הילד הראשון שלי
      </Button>
    </div>
  );
}
