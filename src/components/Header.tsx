import { Settings, User } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <header className="flex items-center justify-between py-6">
      <div>
        <h1 className="text-2xl font-bold text-gradient">Daily Quests</h1>
        <p className="text-muted-foreground">
          {dayName}, {dateStr}
        </p>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-secondary"
        onClick={onOpenSettings}
      >
        <Settings className="w-5 h-5 text-muted-foreground" />
      </Button>
    </header>
  );
}
