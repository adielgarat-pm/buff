import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Sparkles, X, BookOpen, ArrowLeft, Rocket } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { BuffPhilosophyPage } from './BuffPhilosophyPage';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useLanguage } from '@/contexts/LanguageContext';

interface ParentWelcomeBannerProps {
  userId: string;
  onNavigateToSettings?: () => void;
  onStartOnboarding?: () => void;
}

const PARENT_WELCOME_DISMISSED_KEY = 'buff_parent_welcome_dismissed';

export function ParentWelcomeBanner({ userId, onNavigateToSettings, onStartOnboarding }: ParentWelcomeBannerProps) {
  const { t, isRTL } = useLanguage();
  const [show, setShow] = useState(false);
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const { children } = useFamilyMembers();
  const hasNoChildren = children.length === 0;

  useEffect(() => {
    const dismissedUsers = JSON.parse(localStorage.getItem(PARENT_WELCOME_DISMISSED_KEY) || '[]');
    if (!dismissedUsers.includes(userId)) {
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  const handleDismiss = () => {
    setShow(false);
    const dismissedUsers = JSON.parse(localStorage.getItem(PARENT_WELCOME_DISMISSED_KEY) || '[]');
    if (!dismissedUsers.includes(userId)) {
      dismissedUsers.push(userId);
      localStorage.setItem(PARENT_WELCOME_DISMISSED_KEY, JSON.stringify(dismissedUsers));
    }
  };

  const handleLearnMore = () => {
    handleDismiss();
    setShowPhilosophy(true);
  };

  const handleStartOnboarding = () => {
    handleDismiss();
    if (onStartOnboarding) {
      onStartOnboarding();
    }
  };

  if (!show && !showPhilosophy) return null;

  return (
    <>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-card border border-primary/20 rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-300">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 w-8 h-8 rounded-full"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="text-center space-y-5">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground">
                {t('parentWelcome.title')}
              </h2>

              <p className="text-muted-foreground text-sm leading-relaxed">
                {hasNoChildren 
                  ? t('parentWelcome.noChildrenMsg')
                  : t('parentWelcome.hasChildrenMsg')
                }
              </p>

              <div className="space-y-3 pt-2">
                {hasNoChildren && onStartOnboarding ? (
                  <>
                    <Button
                      onClick={handleStartOnboarding}
                      className="w-full h-12 bg-gradient-to-r from-primary to-success text-primary-foreground font-bold rounded-xl"
                    >
                      <Rocket className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('parentWelcome.letsStart')}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={handleLearnMore}
                      className="w-full h-10 text-muted-foreground hover:text-foreground"
                    >
                      <BookOpen className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t('parentWelcome.readFirst')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleLearnMore}
                      className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold rounded-xl"
                    >
                      <BookOpen className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('parentWelcome.learnMore')}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={handleDismiss}
                      className="w-full h-10 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t('parentWelcome.skipStart')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showPhilosophy} onOpenChange={setShowPhilosophy}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          <BuffPhilosophyPage 
            isModal 
            onClose={() => setShowPhilosophy(false)}
            onNavigateToSettings={onNavigateToSettings}
            onStartOnboarding={hasNoChildren ? onStartOnboarding : undefined}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
