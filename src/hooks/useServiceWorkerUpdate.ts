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

    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

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

        // Periodically check for updates (every 5 minutes)
        const interval = setInterval(() => {
          registration.update().catch(console.error);
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
      } catch (error) {
        console.error('Error checking for service worker updates:', error);
      }
    };

    checkForUpdates();

    // Listen for controller change (when update is activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (isUpdating) {
        window.location.reload();
      }
    });
  }, [isUpdating]);

  const updateServiceWorker = useCallback(() => {
    if (!waitingWorker) return;

    setIsUpdating(true);
    
    // Tell the waiting worker to skip waiting and become active
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }, [waitingWorker]);

  return {
    needsUpdate,
    updateServiceWorker,
    isUpdating,
  };
}
