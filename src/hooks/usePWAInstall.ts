import { useState, useEffect, useCallback, useRef } from 'react';
import { trackPWAEvent } from './usePWAAnalytics';

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
  isPermanentlyDismissed: boolean;
}

interface UsePWAInstallReturn extends PWAInstallState {
  triggerInstall: () => Promise<boolean>;
  dismiss: (hours?: number) => void;
  dismissPermanently: () => void;
  resetDismissal: () => void;
  forceShow: (os?: DeviceOS) => void;
}

const DISMISS_KEY = 'buff-pwa-install-dismissed';
const PERMANENT_DISMISS_KEY = 'buff-pwa-install-never-show';
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

/**
 * Robust standalone detection covering all PWA modes
 */
function isStandalone(): boolean {
  // iOS Safari standalone mode
  const isIOSStandalone = (navigator as any).standalone === true;
  
  // Standard display-mode standalone check
  const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Fullscreen mode (some PWAs use this)
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  
  // Android TWA (Trusted Web Activity)
  const isAndroidTWA = document.referrer.includes('android-app://');
  
  // Windows PWA check
  const isWindowsPWA = window.matchMedia('(display-mode: window-controls-overlay)').matches;
  
  return isIOSStandalone || isDisplayStandalone || isFullscreen || isAndroidTWA || isWindowsPWA;
}

function isPermanentlyDismissed(): boolean {
  return localStorage.getItem(PERMANENT_DISMISS_KEY) === 'true';
}

function isDismissed(): boolean {
  // Check permanent dismissal first
  if (isPermanentlyDismissed()) return true;
  
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
  const [forceVisible, setForceVisible] = useState(false);
  const [forcedOS, setForcedOS] = useState<DeviceOS | null>(null);
  const [state, setState] = useState<PWAInstallState>(() => ({
    isInstalled: false,
    isInstallable: false,
    canShowPrompt: false,
    deviceOS: 'unknown',
    isDismissed: false,
    isPermanentlyDismissed: false,
  }));

  // Initialize on mount
  useEffect(() => {
    const deviceOS = detectDeviceOS();
    const installed = isStandalone();
    const dismissed = isDismissed();
    const permanentDismiss = isPermanentlyDismissed();
    
    setState(prev => ({
      ...prev,
      deviceOS,
      isInstalled: installed,
      isDismissed: dismissed,
      isPermanentlyDismissed: permanentDismiss,
      // iOS is always "installable" via manual method
      isInstallable: deviceOS === 'ios' && !installed,
      canShowPrompt: !installed && !dismissed && !permanentDismiss,
    }));

    // For Android/Desktop, listen for the beforeinstallprompt event
    if (deviceOS !== 'ios') {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setState(prev => ({
          ...prev,
          isInstallable: true,
          canShowPrompt: !prev.isInstalled && !prev.isDismissed && !prev.isPermanentlyDismissed,
        }));
      };

      const handleAppInstalled = () => {
        // Track successful installation
        trackPWAEvent('pwa_install_success', deviceOS);
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
    const currentOS = forcedOS || state.deviceOS;
    
    if (!deferredPrompt) return false;

    // Track install started
    trackPWAEvent('pwa_install_started', currentOS);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // Note: pwa_install_success is tracked via appinstalled event
        setState(prev => ({
          ...prev,
          isInstalled: true,
          canShowPrompt: false,
        }));
        setDeferredPrompt(null);
        return true;
      } else {
        // User cancelled the native dialog
        trackPWAEvent('pwa_install_cancelled', currentOS);
      }
      return false;
    } catch (error) {
      console.error('PWA install error:', error);
      return false;
    }
  }, [deferredPrompt, forcedOS, state.deviceOS]);

  const dismiss = useCallback((hours: number = DEFAULT_DISMISS_HOURS) => {
    const currentOS = forcedOS || state.deviceOS;
    trackPWAEvent('pwa_prompt_dismissed_temp', currentOS, { hours });
    
    localStorage.setItem(DISMISS_KEY, JSON.stringify({
      timestamp: new Date().toISOString(),
      hours,
    }));
    setForceVisible(false);
    setForcedOS(null);
    setState(prev => ({
      ...prev,
      isDismissed: true,
      canShowPrompt: false,
    }));
  }, [forcedOS, state.deviceOS]);

  const dismissPermanently = useCallback(() => {
    const currentOS = forcedOS || state.deviceOS;
    trackPWAEvent('pwa_prompt_dismissed_perm', currentOS);
    
    localStorage.setItem(PERMANENT_DISMISS_KEY, 'true');
    setForceVisible(false);
    setForcedOS(null);
    setState(prev => ({
      ...prev,
      isPermanentlyDismissed: true,
      isDismissed: true,
      canShowPrompt: false,
    }));
  }, [forcedOS, state.deviceOS]);

  const resetDismissal = useCallback(() => {
    localStorage.removeItem(DISMISS_KEY);
    localStorage.removeItem(PERMANENT_DISMISS_KEY);
    setState(prev => ({
      ...prev,
      isDismissed: false,
      isPermanentlyDismissed: false,
      canShowPrompt: !prev.isInstalled,
    }));
  }, []);

  const forceShow = useCallback((os?: DeviceOS) => {
    setForceVisible(true);
    if (os) {
      setForcedOS(os);
    }
  }, []);

  // Compute final values considering forceVisible
  const canShowPrompt = forceVisible || state.canShowPrompt;
  const deviceOS = forcedOS || state.deviceOS;

  return {
    ...state,
    deviceOS,
    canShowPrompt,
    triggerInstall,
    dismiss,
    dismissPermanently,
    resetDismissal,
    forceShow,
  };
}
