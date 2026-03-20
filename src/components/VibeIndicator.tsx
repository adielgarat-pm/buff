import { cn } from '@/lib/utils';

interface VibeIndicatorProps {
  vibeLevel: number | null;
  size?: 'sm' | 'md';
  className?: string;
}

const VIBE_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😄',
};

const VIBE_COLORS: Record<number, string> = {
  1: 'bg-red-500/20 text-red-500',
  2: 'bg-orange-500/20 text-orange-500',
  3: 'bg-yellow-500/20 text-yellow-500',
  4: 'bg-emerald-500/20 text-emerald-500',
  5: 'bg-green-500/20 text-green-500',
};

export function VibeIndicator({ vibeLevel, size = 'sm', className }: VibeIndicatorProps) {
  if (!vibeLevel) return null;

  const emoji = VIBE_EMOJIS[vibeLevel] || '😐';
  const colorClass = VIBE_COLORS[vibeLevel] || 'bg-secondary';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        size === 'sm' ? 'w-6 h-6 text-sm' : 'w-8 h-8 text-lg',
        colorClass,
        className
      )}
      title={`Vibe: ${vibeLevel}/5`}
    >
      {emoji}
    </span>
  );
}

// Ring color for PetDisplay "egg" based on vibe
export function getVibeRingColor(vibeLevel: number | null): string {
  if (!vibeLevel) return 'hsl(var(--primary))';
  if (vibeLevel >= 4) return 'hsl(45, 100%, 55%)'; // warm yellow/orange
  if (vibeLevel === 3) return 'hsl(var(--primary))';
  return 'hsl(210, 40%, 60%)'; // blue/gray for low
}
