import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface OnboardingCardProps {
  emoji?: string;
  title: string;
  description: string;
  selected?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  disabled?: boolean;
}

export function OnboardingCard({ 
  emoji, 
  title, 
  description, 
  selected, 
  onClick, 
  children,
  disabled 
}: OnboardingCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full p-3 rounded-xl border-2 text-start transition-all duration-200",
        "hover:border-primary/50 hover:bg-primary/5",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        selected 
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
          : "border-border bg-card"
      )}
    >
      <div className="flex items-start gap-2.5">
        {emoji && (
          <span className="text-xl flex-shrink-0">{emoji}</span>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-bold text-sm mb-0.5",
            selected ? "text-primary" : "text-foreground"
          )}>
            {title}
          </h3>
          <p className="text-xs text-muted-foreground leading-snug">
            {description}
          </p>
          {children}
        </div>
      </div>
    </button>
  );
}
