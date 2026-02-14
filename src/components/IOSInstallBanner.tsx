import { useState, useEffect } from 'react';
import { X, Share, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const DISMISS_KEY = 'buff_ios_banner_dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function isIOSDevice(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandaloneMode(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;
}

function wasDismissed(): boolean {
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return false;
    const dismissedAt = parseInt(dismissed, 10);
    return Date.now() - dismissedAt < DISMISS_DURATION;
  } catch {
    return false;
  }
}

export function IOSInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const { language } = useLanguage();
  const isHe = language === 'he';

  useEffect(() => {
    if (isIOSDevice() && !isStandaloneMode() && !wasDismissed()) {
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50 safe-area-top"
        >
          <div className="bg-primary/10 backdrop-blur-md border-b border-primary/20">
            <div className="max-w-lg mx-auto px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Share className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {isHe ? 'לחוויה מיטבית באייפון:' : 'For the best iPhone experience:'}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {isHe ? (
                      <>הקישו על <span className="inline-flex items-center gap-0.5 text-primary font-medium"><Share className="w-3 h-3" /> שיתוף</span> ובחרו <span className="inline-flex items-center gap-0.5 text-primary font-medium"><Plus className="w-3 h-3" /> הוספה למסך הבית</span></>
                    ) : (
                      <>Tap <span className="inline-flex items-center gap-0.5 text-primary font-medium"><Share className="w-3 h-3" /> Share</span> and choose <span className="inline-flex items-center gap-0.5 text-primary font-medium"><Plus className="w-3 h-3" /> Add to Home Screen</span></>
                    )}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground -mt-0.5"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
