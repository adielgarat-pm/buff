import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Sparkles, X, BookOpen, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { BuffPhilosophyPage } from './BuffPhilosophyPage';

interface ParentWelcomeBannerProps {
  userId: string;
}

const PARENT_WELCOME_DISMISSED_KEY = 'buff_parent_welcome_dismissed';

export function ParentWelcomeBanner({ userId }: ParentWelcomeBannerProps) {
  const [show, setShow] = useState(false);
  const [showPhilosophy, setShowPhilosophy] = useState(false);

  useEffect(() => {
    // Check if this parent has already dismissed the welcome message
    const dismissedUsers = JSON.parse(localStorage.getItem(PARENT_WELCOME_DISMISSED_KEY) || '[]');
    if (!dismissedUsers.includes(userId)) {
      // Small delay for better UX
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  const handleDismiss = () => {
    setShow(false);
    // Mark as dismissed for this user
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

  if (!show && !showPhilosophy) return null;

  return (
    <>
      {/* Welcome Modal */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-card border border-primary/20 rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-300">
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
            <div className="text-center space-y-5">
              {/* Icon */}
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-foreground">
                ברוכים הבאים ל-Buff
              </h2>

              {/* Message */}
              <p className="text-muted-foreground text-sm leading-relaxed">
                הכנו עבורכם את התשתית המקצועית ביותר לניהול היום. 
                מומלץ להתחיל בקריאת "תפיסת העולם" שלנו כדי להפיק את המקסימום מהתהליך.
              </p>

              {/* CTA Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleLearnMore}
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold rounded-xl"
                >
                  <BookOpen className="w-5 h-5 ml-2" />
                  למדו עוד על השיטה
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="w-full h-10 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 ml-1" />
                  דלג, אתחיל לבד
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Philosophy Dialog */}
      <Dialog open={showPhilosophy} onOpenChange={setShowPhilosophy}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          <BuffPhilosophyPage 
            isModal 
            onClose={() => setShowPhilosophy(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
