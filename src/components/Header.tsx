import { Settings, Vault, CalendarDays, LogOut, User, Globe, Info } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { BuffPhilosophyPage } from './BuffPhilosophyPage';
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
import { ChildAvatarPicker } from './ChildAvatarPicker';
import buffLogo from '@/assets/buff-logo.png';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeaderProps {
  onOpenStore: () => void;
  onOpenWeeklySummary?: () => void;
  totalBalance: number;
  appTitle: string;
  onSignOut?: () => void;
  userName?: string;
  showPhilosophyIcon?: boolean;
  childAvatar?: string;
  onChangeAvatar?: (newAvatar: string) => Promise<void>;
}

// BUFF Logo Component with image and optional avatar
function BuffLogo({ 
  childAvatar, 
  onChangeAvatar,
  userName 
}: { 
  childAvatar?: string; 
  onChangeAvatar?: (newAvatar: string) => Promise<void>;
  userName?: string;
}) {
  const hasAvatarPicker = childAvatar !== undefined && onChangeAvatar;
  
  return (
    <div className="flex items-center gap-3">
      {/* Child Avatar - positioned next to logo */}
      {hasAvatarPicker && (
        <ChildAvatarPicker
          currentAvatar={childAvatar || '🚀'}
          onChangeAvatar={onChangeAvatar}
          userName={userName}
        />
      )}
      
      <img 
        src={buffLogo} 
        alt="BUFF Logo" 
        className="h-12 w-12 object-contain"
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
  showPhilosophyIcon,
  childAvatar,
  onChangeAvatar,
}: HeaderProps) {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const today = new Date();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const dayName = today.toLocaleDateString(locale, { weekday: 'long' });
  const dateStr = today.toLocaleDateString(locale, { month: 'short', day: 'numeric' });

  return (
    <header className="flex items-center justify-between py-4 sm:py-6">
      <div className="min-w-0">
        <BuffLogo 
          childAvatar={childAvatar} 
          onChangeAvatar={onChangeAvatar}
          userName={userName}
        />
        <p className="text-muted-foreground text-sm mt-1 truncate">
          {dayName}, {dateStr}
        </p>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Philosophy Info Icon - for parent view */}
        {showPhilosophyIcon && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl w-10 h-10 touch-target border-primary/30 bg-primary/10 hover:bg-primary/20 shadow-sm hover:shadow-md transition-all"
            onClick={() => setShowPhilosophy(true)}
            title="תפיסת העולם של Buff"
          >
            <Info className="w-5 h-5 text-primary" />
          </Button>
        )}
        
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
      
      {/* Philosophy Dialog */}
      <Dialog open={showPhilosophy} onOpenChange={setShowPhilosophy}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          <BuffPhilosophyPage 
            isModal 
            onClose={() => setShowPhilosophy(false)} 
          />
        </DialogContent>
      </Dialog>
    </header>
  );
}