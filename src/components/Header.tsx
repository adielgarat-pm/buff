import { Settings, Vault, CalendarDays, LogOut, User } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import buffLogo from '@/assets/buff-logo.png';

interface HeaderProps {
  onOpenSettings?: () => void;
  onOpenStore: () => void;
  onOpenWeeklySummary?: () => void;
  totalBalance: number;
  appTitle: string;
  onSignOut?: () => void;
  userName?: string;
}

// BUFF Logo Component with image
function BuffLogo() {
  return (
    <div className="flex items-center gap-2">
      <img 
        src={buffLogo} 
        alt="BUFF Logo" 
        className="h-10 w-10 object-contain"
      />
      <span className="font-display text-2xl font-bold tracking-wide text-primary">
        BUFF
      </span>
    </div>
  );
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
        <BuffLogo />
        <p className="text-muted-foreground mt-1">
          {dayName}, {dateStr}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Weekly Summary Button */}
        {onOpenWeeklySummary && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-2xl hover:bg-primary/10"
            onClick={onOpenWeeklySummary}
          >
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
          </Button>
        )}
        
        {/* Credit Vault Button */}
        <Button
          variant="ghost"
          size="sm"
          className="rounded-2xl hover:bg-primary/10 gap-2 px-3"
          onClick={onOpenStore}
        >
          <Vault className="w-4 h-4 text-buff" />
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
              className="rounded-2xl hover:bg-secondary"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl">
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
              <DropdownMenuItem onClick={onOpenSettings} className="rounded-xl">
                <Settings className="w-4 h-4 mr-2" />
                Parent Settings
              </DropdownMenuItem>
            )}
            {onSignOut && (
              <>
                {onOpenSettings && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={onSignOut} className="text-destructive rounded-xl">
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