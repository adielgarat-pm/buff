import { useEffect } from 'react';
import { Crown, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface LevelUpNotificationProps {
  isVisible: boolean;
  rewardTitle: string;
  rewardIcon: string;
  onClose: () => void;
}

export function LevelUpNotification({ isVisible, rewardTitle, rewardIcon, onClose }: LevelUpNotificationProps) {
  useEffect(() => {
    if (isVisible && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      {/* Glowing background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-8 py-12 max-w-sm mx-4">
        {/* Level Up Badge */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-accent/30 rounded-full blur-3xl scale-150" />
          <div className="relative p-6 rounded-full bg-gradient-to-br from-accent/30 to-primary/30 border-2 border-accent animate-pulse-glow">
            <Crown className="w-16 h-16 text-accent" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-warning animate-bounce" />
          <Star className="absolute -bottom-1 -left-2 w-6 h-6 text-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-accent mb-2 animate-slide-up">
          LEVEL UP! 🚀
        </h1>
        
        <p className="text-lg text-muted-foreground mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          You unlocked a big reward!
        </p>

        {/* Reward display */}
        <div className="p-6 rounded-2xl bg-card border border-accent/40 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <span className="text-5xl block mb-3">{rewardIcon}</span>
          <h2 className="text-xl font-bold text-foreground">{rewardTitle}</h2>
        </div>

        {/* Encouraging message */}
        <p className="text-sm text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          Your hard work paid off! You've earned something awesome! 🌟
        </p>

        {/* Close button */}
        <Button
          onClick={onClose}
          className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-lg animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          Awesome!
        </Button>
      </div>
    </div>
  );
}
