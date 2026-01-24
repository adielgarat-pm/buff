import { Settings, Vault, CalendarDays, LogOut, User } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface HeaderProps {
  onOpenSettings?: () => void;
  onOpenStore: () => void;
  onOpenWeeklySummary?: () => void;
  totalBalance: number;
  appTitle: string;
  onSignOut?: () => void;
  userName?: string;
}

export function Header({ 
  onOpenSettings, 
  onOpenStore, 
  onOpenWeeklySummary, 
  totalBalance, 
  appTitle,
  onSignOut,
  userName,
}: HeaderProps) {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <header className="flex items-center justify-between py-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gradient">{appTitle || 'BUFF'}</h1>
        <p className="text-muted-foreground">
          {dayName}, {dateStr}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Weekly Summary Button */}
        {onOpenWeeklySummary && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-primary/10"
            onClick={onOpenWeeklySummary}
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
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-secondary"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {userName && (
              <>
                <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {userName}
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            {onOpenSettings && (
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Parent Settings
              </DropdownMenuItem>
            )}
            {onSignOut && (
              <>
                {onOpenSettings && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
