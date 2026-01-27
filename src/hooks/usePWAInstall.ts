import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type DeviceOS = 'ios' | 'android' | 'desktop' | 'unknown';

interface PWAInstallState {
  isInstalled: boolean;
  isInstallable: boolean;
  canShowPrompt: boolean;
  deviceOS: DeviceOS;
  isDismissed: boolean;
}

interface UsePWAInstallReturn extends PWAInstallState {
  triggerInstall: () => Promise<boolean>;
  dismiss: (hours?: number) => void;
  resetDismissal: () => void;
}

const DISMISS_KEY = 'buff-pwa-install-dismissed';
const DEFAULT_DISMISS_HOURS = 24;

function detectDeviceOS(): DeviceOS {
  const ua = navigator.userAgent.toLowerCase();
  
  // iOS detection
  if (/ipad|iphone|ipod/.test(ua) && !(window as any).MSStream) {
    return 'ios';
  }
  
  // Android detection
  if (/android/.test(ua)) {
    return 'android';
  }
  
  // Desktop (Windows, Mac, Linux)
  if (/windows|macintosh|linux/.test(ua) && !/android/.test(ua)) {
    return 'desktop';
  }
  
  return 'unknown';
}

function isStandalone(): boolean {
  // Check various standalone modes
  const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = (navigator as any).standalone === true;
  const isAndroidTWA = document.referrer.includes('android-app://');
  
  return isDisplayStandalone || isIOSStandalone || isAndroidTWA;
}

function isDismissed(): boolean {
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return false;
    
    const { timestamp, hours } = JSON.parse(dismissed);
    const dismissedDate = new Date(timestamp);
    const hoursSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceDismissed < hours;
  } catch {
    return false;
  }
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<PWAInstallState>(() => ({
    isInstalled: false,
    isInstallable: false,
    canShowPrompt: false,
    deviceOS: 'unknown',
    isDismissed: false,
  }));

  // Initialize on mount
  useEffect(() => {
    const deviceOS = detectDeviceOS();
    const installed = isStandalone();
    const dismissed = isDismissed();
    
    setState(prev => ({
      ...prev,
      deviceOS,
      isInstalled: installed,
      isDismissed: dismissed,
      // iOS is always "installable" via manual method
      isInstallable: deviceOS === 'ios' && !installed,
      canShowPrompt: !installed && !dismissed,
    }));

    // For Android/Desktop, listen for the beforeinstallprompt event
    if (deviceOS !== 'ios') {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setState(prev => ({
          ...prev,
          isInstallable: true,
          canShowPrompt: !prev.isInstalled && !prev.isDismissed,
        }));
      };

      const handleAppInstalled = () => {
        setState(prev => ({
          ...prev,
          isInstalled: true,
          isInstallable: false,
          canShowPrompt: false,
        }));
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setState(prev => ({
          ...prev,
          isInstalled: true,
          canShowPrompt: false,
        }));
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('PWA install error:', error);
      return false;
    }
  }, [deferredPrompt]);

  const dismiss = useCallback((hours: number = DEFAULT_DISMISS_HOURS) => {
    localStorage.setItem(DISMISS_KEY, JSON.stringify({
      timestamp: new Date().toISOString(),
      hours,
    }));
    setState(prev => ({
      ...prev,
      isDismissed: true,
      canShowPrompt: false,
    }));
  }, []);

  const resetDismissal = useCallback(() => {
    localStorage.removeItem(DISMISS_KEY);
    setState(prev => ({
      ...prev,
      isDismissed: false,
      canShowPrompt: !prev.isInstalled && prev.isInstallable,
    }));
  }, []);

  return {
    ...state,
    triggerInstall,
    dismiss,
    resetDismissal,
  };
}
