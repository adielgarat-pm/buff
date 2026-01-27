import { useState, useEffect, useCallback, useRef } from 'react';

interface ServiceWorkerUpdateState {
  needsUpdate: boolean;
  updateServiceWorker: () => void;
  isUpdating: boolean;
}

export function useServiceWorkerUpdate(): ServiceWorkerUpdateState {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  
  // Prevent multiple reloads and track if we've already handled an update
  const hasHandledUpdate = useRef(false);
  const isReloading = useRef(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Clear any stale version check data that might cause loops
    try {
      localStorage.removeItem('last_version_checked');
      localStorage.removeItem('sw_update_pending');
    } catch (e) {
      // Ignore localStorage errors
    }

    const checkForUpdates = async () => {
      // Don't check if we've already found an update
      if (hasHandledUpdate.current) return;
      
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (const registration of registrations) {
          // Skip the notification service worker - only handle the main PWA SW
          const swUrl = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL;
          if (swUrl && swUrl.includes('notification-sw.js')) {
            continue;
          }

          // Check if there's already a waiting worker
          if (registration.waiting && !hasHandledUpdate.current) {
            setWaitingWorker(registration.waiting);
            setNeedsUpdate(true);
            hasHandledUpdate.current = true;
            return; // Found an update, stop checking
          }

          // Listen for new service worker updates
          registration.addEventListener('updatefound', () => {
            if (hasHandledUpdate.current) return;
            
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller && !hasHandledUpdate.current) {
                // New version available - show prompt, don't auto-reload
                setWaitingWorker(newWorker);
                setNeedsUpdate(true);
                hasHandledUpdate.current = true;
              }
            });
          });

          // Trigger an update check (silently)
          registration.update().catch(() => {
            // Silently ignore update errors
          });
        }
      } catch (error) {
        // Silently ignore errors
      }
    };

    // Initial check after a short delay to let app stabilize
    const initialCheckTimeout = setTimeout(checkForUpdates, 2000);

    // Periodically check for updates (every 10 minutes instead of 5) - only for PWA SW
    const interval = setInterval(async () => {
      if (hasHandledUpdate.current) return;
      
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          const swUrl = registration.active?.scriptURL || registration.waiting?.scriptURL;
          if (swUrl && swUrl.includes('notification-sw.js')) {
            continue;
          }
          registration.update().catch(() => {});
        }
      } catch (e) {
        // Silently ignore errors
      }
    }, 10 * 60 * 1000);

    // DO NOT auto-reload on controller change - let user decide via the prompt
    // This prevents infinite reload loops

    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(interval);
    };
  }, []);

  const updateServiceWorker = useCallback(() => {
    // Prevent multiple update attempts
    if (isReloading.current) return;
    
    setIsUpdating(true);
    isReloading.current = true;
    
    if (waitingWorker) {
      // Set up one-time listener for the actual reload
      const onControllerChange = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        // Small delay before reload to let SW stabilize
        setTimeout(() => {
          window.location.reload();
        }, 300);
      };
      
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      
      // Tell the waiting worker to skip waiting and become active
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Fallback reload if controllerchange doesn't fire
      setTimeout(() => {
        if (isReloading.current) {
          window.location.reload();
        }
      }, 2000);
    } else {
      // No waiting worker - just reload
      window.location.reload();
    }
  }, [waitingWorker]);

  return {
    needsUpdate,
    updateServiceWorker,
    isUpdating,
  };
}
