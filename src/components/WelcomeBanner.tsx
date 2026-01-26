import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Sparkles, X, Rocket } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface WelcomeBannerProps {
  userId: string;
  userName?: string;
}

const WELCOME_DISMISSED_KEY = 'buff_welcome_dismissed';

export function WelcomeBanner({ userId, userName }: WelcomeBannerProps) {
  const { t, isRTL } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if this user has already dismissed the welcome message
    const dismissedUsers = JSON.parse(localStorage.getItem(WELCOME_DISMISSED_KEY) || '[]');
    if (!dismissedUsers.includes(userId)) {
      // Small delay for better UX
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  const handleDismiss = () => {
    setShow(false);
    // Mark as dismissed for this user
    const dismissedUsers = JSON.parse(localStorage.getItem(WELCOME_DISMISSED_KEY) || '[]');
    if (!dismissedUsers.includes(userId)) {
      dismissedUsers.push(userId);
      localStorage.setItem(WELCOME_DISMISSED_KEY, JSON.stringify(dismissedUsers));
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-card border border-primary/30 rounded-2xl p-6 shadow-buff-glow animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 w-8 h-8 rounded-full"
          onClick={handleDismiss}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Content */}
        <div className="text-center space-y-4">
          {/* Icon */}
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center mx-auto">
              <Rocket className="w-10 h-10 text-primary" />
            </div>
            <Sparkles className="w-6 h-6 text-success absolute -top-1 -right-1 animate-pulse" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-foreground">
            {t('welcome.title')} {userName ? userName : ''}! 🎮
          </h2>

          {/* Message */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t('welcome.message')}
          </p>

          {/* Highlight */}
          <div className="p-3 rounded-xl bg-success/10 border border-success/30">
            <p className="text-success text-sm font-medium">
              {t('welcome.tasksReady')}
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleDismiss}
            className="w-full h-12 bg-gradient-to-r from-primary to-success text-primary-foreground font-bold rounded-xl"
          >
            <Sparkles className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('welcome.letsGo')}
          </Button>
        </div>
      </div>
    </div>
  );
}
