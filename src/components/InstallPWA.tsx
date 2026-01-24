import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show banner for iOS after a short delay
      setTimeout(() => setShowBanner(true), 2000);
      return;
    }

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (!showBanner) return null;

  if (showIOSInstructions) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-card border-t border-border animate-in slide-in-from-bottom">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-foreground">Install BUFF</h3>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <ol className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">1</span>
              Tap the <strong>Share</strong> button in Safari
            </li>
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">2</span>
              Scroll and tap <strong>"Add to Home Screen"</strong>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">3</span>
              Tap <strong>"Add"</strong> to install
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-card border-t border-border animate-in slide-in-from-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">Install BUFF</p>
            <p className="text-xs text-muted-foreground">Add to home screen for quick access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Later
          </Button>
          <Button size="sm" onClick={handleInstall} className="gap-1.5">
            <Download className="w-4 h-4" />
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
