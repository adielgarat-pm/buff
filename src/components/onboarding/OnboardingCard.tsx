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
        "w-full p-4 rounded-2xl border-2 text-right transition-all duration-200",
        "hover:border-primary/50 hover:bg-primary/5",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        selected 
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
          : "border-border bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        {emoji && (
          <span className="text-2xl flex-shrink-0">{emoji}</span>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-bold text-base mb-1",
            selected ? "text-primary" : "text-foreground"
          )}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
          {children}
        </div>
      </div>
    </button>
  );
}
