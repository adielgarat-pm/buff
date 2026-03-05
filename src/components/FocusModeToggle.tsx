import { Eye, EyeOff, Focus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface FocusModeToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
  className?: string;
}

export function FocusModeToggle({ isEnabled, onToggle, className }: FocusModeToggleProps) {
  const { t } = useLanguage();
  
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-300",
        isEnabled 
          ? "bg-buff/20 border-buff/50 text-buff shadow-buff-glow" 
          : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/50",
        className
      )}
    >
      {isEnabled ? (
        <Focus className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">
        {isEnabled ? t('focus.modeOn') : t('focus.modeOff')}
      </span>
    </button>
  );
}