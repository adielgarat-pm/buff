import { Vault, CalendarDays, LogOut, User, Globe } from 'lucide-react';
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
import { useLanguage } from '@/contexts/LanguageContext';

interface HeaderProps {
  onOpenStore: () => void;
  onOpenWeeklySummary?: () => void;
  totalBalance: number;
  appTitle: string;
  onSignOut?: () => void;
  userName?: string;
}

// FunCtion Logo Component with stylized text
function FunCtionLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        {/* Logo icon - stylized "F" with energy burst */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow">
          <span className="font-display text-xl font-black text-primary-foreground">F</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-display text-xl font-bold tracking-tight">
          <span className="text-primary">Fun</span>
          <span className="text-buff">C</span>
          <span className="text-foreground">tion</span>
        </span>
      </div>
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
        <FunCtionLogo />
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
              <User className="w-5 h-5 text-muted-foreground" />
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
