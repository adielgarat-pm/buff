import { Settings, Vault, CalendarDays, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenStore: () => void;
  onOpenWeeklySummary?: () => void;
  onOpenDailySummary?: () => void;
  totalBalance: number;
  appTitle: string;
}

export function Header({ onOpenSettings, onOpenStore, onOpenWeeklySummary, onOpenDailySummary, totalBalance, appTitle }: HeaderProps) {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <header className="flex items-center justify-between py-6">
      <div>
        <h1 className="text-2xl font-bold text-gradient">{appTitle || 'Daily Quests'}</h1>
        <p className="text-muted-foreground">
          {dayName}, {dateStr}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Daily Summary Button */}
        {onOpenDailySummary && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-primary/10"
            onClick={onOpenDailySummary}
            title="Today's Summary"
          >
            <FileText className="w-5 h-5 text-muted-foreground" />
          </Button>
        )}
        
        {/* Weekly Summary Button */}
        {onOpenWeeklySummary && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-primary/10"
            onClick={onOpenWeeklySummary}
            title="Weekly Summary"
          >
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
          </Button>
        )}
        
        {/* Credit Vault Button */}
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full hover:bg-primary/10 gap-2 px-3"
          onClick={onOpenStore}
        >
          <Vault className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {totalBalance.toLocaleString()}
          </span>
        </Button>
        
        {/* Settings Button */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-secondary"
          onClick={onOpenSettings}
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
