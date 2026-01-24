import { useEffect, useState } from 'react';

interface XPFlyAnimationProps {
  credits: number;
  sourceRef?: { x: number; y: number };
  onComplete?: () => void;
}

export function XPFlyAnimation({ credits, sourceRef, onComplete }: XPFlyAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Get source position from ref or use center
    const startX = sourceRef?.x ?? window.innerWidth / 2;
    const startY = sourceRef?.y ?? window.innerHeight / 2;
    
    setPosition({ x: startX, y: startY });

    // Animate to top (XP bar position)
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete?.();
    }, 800);

    return () => clearTimeout(timer);
  }, [sourceRef, onComplete]);

  if (!isAnimating) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none animate-xp-fly"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="flex items-center gap-1 px-3 py-1 bg-buff rounded-full shadow-buff-glow text-buff-foreground font-bold text-lg">
        +{credits} XP
      </div>
    </div>
  );
}