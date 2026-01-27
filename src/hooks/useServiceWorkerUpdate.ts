import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerUpdateState {
  needsUpdate: boolean;
  updateServiceWorker: () => void;
  isUpdating: boolean;
}

export function useServiceWorkerUpdate(): ServiceWorkerUpdateState {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let controllerChangeHandler: (() => void) | null = null;

    const checkForUpdates = async () => {
      try {
        // Get all registrations and find the VitePWA one (not our custom sw.js)
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (const registration of registrations) {
          // Check if there's already a waiting worker
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setNeedsUpdate(true);
          }

          // Listen for new service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                setWaitingWorker(newWorker);
                setNeedsUpdate(true);
              }
            });
          });

          // Trigger an update check
          registration.update().catch(console.error);
        }
      } catch (error) {
        console.error('Error checking for service worker updates:', error);
      }
    };

    checkForUpdates();

    // Periodically check for updates (every 5 minutes)
    const interval = setInterval(async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          registration.update().catch(console.error);
        }
      } catch (e) {
        console.error('Error updating service workers:', e);
      }
    }, 5 * 60 * 1000);

    // Listen for controller change (when update is activated)
    // Use a debounce to prevent multiple reloads and give notification SW time to re-register
    let reloadTimeout: ReturnType<typeof setTimeout> | null = null;
    controllerChangeHandler = () => {
      // Clear any pending reload
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
      // Wait a short moment before reloading to allow SWs to stabilize
      reloadTimeout = setTimeout(() => {
        window.location.reload();
      }, 500);
    };
    navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler);

    return () => {
      clearInterval(interval);
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
      if (controllerChangeHandler) {
        navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandler);
      }
    };
  }, []);

  const updateServiceWorker = useCallback(() => {
    setIsUpdating(true);
    
    if (waitingWorker) {
      // Tell the waiting worker to skip waiting and become active
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // No waiting worker - just force reload to get the latest version
      window.location.reload();
    }
  }, [waitingWorker]);

  return {
    needsUpdate,
    updateServiceWorker,
    isUpdating,
  };
}
