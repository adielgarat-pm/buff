import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

const COLORS = [
  'hsl(84, 100%, 59%)',   // Volt Green
  'hsl(239, 84%, 67%)',   // Electric Indigo
  'hsl(280, 85%, 60%)',   // Purple
  'hsl(38, 92%, 50%)',    // Orange
  'hsl(0, 84%, 60%)',     // Red
];

export function ConfettiEffect({ trigger, onComplete }: ConfettiEffectProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 60, // Spread horizontally
        y: 50,
        rotation: Math.random() * 360,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        delay: Math.random() * 100,
      }));
      
      setPieces(newPieces);
      setIsActive(true);

      // Cleanup after animation
      const timer = setTimeout(() => {
        setIsActive(false);
        setPieces([]);
        onComplete?.();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${piece.rotation}deg)`,
            animationDelay: `${piece.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}