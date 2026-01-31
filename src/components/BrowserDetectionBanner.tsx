import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InstallVideoModal } from './InstallVideoModal';
import { Button } from './ui/button';

const DISMISS_KEY = 'buff_browser_banner_dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

/**
 * Check if the app is running in browser (not as installed PWA)
 */
function isRunningInBrowser(): boolean {
  // Check if in standalone mode (installed PWA)
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://');
  
  return !isStandalone;
}

/**
 * Check if banner was recently dismissed
 */
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

export function BrowserDetectionBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    // Only show if running in browser and not dismissed
    if (isRunningInBrowser() && !wasDismissed()) {
      // Small delay to not be too aggressive
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // Ignore localStorage errors
    }
    setShowBanner(false);
  };

  const handleBannerClick = () => {
    setShowVideoModal(true);
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-50 safe-area-top"
          >
            <div className="bg-primary/10 backdrop-blur-md border-b border-primary/20">
              <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
                {/* Clickable area */}
                <button
                  onClick={handleBannerClick}
                  className="flex-1 flex items-center gap-3 text-right"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground flex-1">
                    להתקנה מהירה וגישה קלה, לחצו כאן
                  </p>
                </button>

                {/* Dismiss button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <InstallVideoModal 
        open={showVideoModal} 
        onClose={() => setShowVideoModal(false)} 
      />
    </>
  );
}
