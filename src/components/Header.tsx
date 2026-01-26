import { Settings, Vault, CalendarDays, LogOut, User, Globe } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from './ui/dropdown-menu';
import buffLogo from '@/assets/buff-logo.png';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeaderProps {
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
    <div className="flex items-center gap-3">
      <img 
        src={buffLogo} 
        alt="BUFF Logo" 
        className="h-14 w-14 object-contain"
      />
      <span className="font-display text-2xl font-bold tracking-wide text-glow-green">
        BUFF
      </span>
    </div>
  );
}

export function Header({ 
  onOpenStore, 
  onOpenWeeklySummary, 
  totalBalance, 
  appTitle,
  onSignOut,
  userName,
}: HeaderProps) {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const today = new Date();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const dayName = today.toLocaleDateString(locale, { weekday: 'long' });
  const dateStr = today.toLocaleDateString(locale, { month: 'short', day: 'numeric' });

  return (
    <header className="flex items-center justify-between py-4 sm:py-6">
      <div className="min-w-0">
        <BuffLogo />
        <p className="text-muted-foreground text-sm mt-1 truncate">
          {dayName}, {dateStr}
        </p>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Weekly Summary Button */}
        {onOpenWeeklySummary && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl w-10 h-10 touch-target active:bg-primary/10"
            onClick={onOpenWeeklySummary}
          >
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
          </Button>
        )}
        
        {/* Credit Vault Button */}
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl active:bg-primary/10 gap-1.5 px-3 h-10 touch-target"
          onClick={onOpenStore}
        >
          <Vault className="w-4 h-4 text-buff" />
          <span className="text-sm font-bold text-foreground">
            {totalBalance.toLocaleString()}
          </span>
        </Button>
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl w-10 h-10 touch-target active:bg-secondary"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl">
            {userName && (
              <>
                <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {userName}
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            
            {/* Language Switcher */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="rounded-xl">
                <Globe className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('settings.language')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="rounded-xl">
                <DropdownMenuItem 
                  onClick={() => setLanguage('he')} 
                  className={`rounded-xl ${language === 'he' ? 'bg-primary/10' : ''}`}
                >
                  🇮🇱 {t('settings.hebrew')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage('en')} 
                  className={`rounded-xl ${language === 'en' ? 'bg-primary/10' : ''}`}
                >
                  🇺🇸 {t('settings.english')}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            {onSignOut && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="text-destructive rounded-xl">
                  <LogOut className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('settings.signOut')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}