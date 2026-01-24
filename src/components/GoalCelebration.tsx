import { useEffect, useState } from 'react';
import { Trophy, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface GoalCelebrationProps {
  isVisible: boolean;
  earnedCredits: number;
  goal: number;
  onClose: () => void;
}

export function GoalCelebration({ isVisible, earnedCredits, goal, onClose }: GoalCelebrationProps) {
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate confetti
      const colors = ['hsl(190, 95%, 50%)', 'hsl(265, 85%, 60%)', 'hsl(160, 84%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 85%, 60%)'];
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setConfettiPieces(pieces);

      // Vibrate for celebration
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute w-3 h-3 rounded-full animate-confetti"
            style={{
              left: `${piece.x}%`,
              top: '-20px',
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-8 py-12 max-w-sm mx-4">
        {/* Trophy Icon with Glow */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-success/30 rounded-full blur-3xl scale-150" />
          <div className="relative p-6 rounded-full bg-success/20 border-2 border-success animate-pulse-glow">
            <Trophy className="w-16 h-16 text-success" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-warning animate-bounce" />
          <Star className="absolute -bottom-1 -left-2 w-6 h-6 text-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-2 animate-slide-up">
          🎉 Amazing Job! 🎉
        </h1>
        
        <p className="text-lg text-muted-foreground mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          You crushed your daily goal!
        </p>

        {/* Credits display */}
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-success/20 border border-success/40 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <span className="text-3xl font-bold text-success">{earnedCredits}</span>
          <span className="text-muted-foreground">/ {goal} credits</span>
        </div>

        {/* Encouraging message */}
        <p className="text-sm text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          Every task you complete is a win. Keep up the incredible work! 💪
        </p>

        {/* Close button */}
        <Button
          onClick={onClose}
          className="bg-success hover:bg-success/90 text-success-foreground px-8 py-3 text-lg animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
