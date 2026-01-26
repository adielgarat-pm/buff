import { useState, useEffect, useCallback } from 'react';
import { Task, PeriodInfo } from '@/types/task';

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

interface ScheduledNotification {
  taskId: string;
  title: string;
  body: string;
  scheduledTime: Date;
  timeoutId?: NodeJS.Timeout;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionStatus>('default');
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);

  // Check if notifications are supported
  const isSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;

  // Initialize permission state and register service worker
  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission as NotificationPermissionStatus);

    let isMounted = true;

    const registerAndSetup = async () => {
      try {
        // Wait for any existing service worker to be ready first
        if (navigator.serviceWorker.controller) {
          await navigator.serviceWorker.ready;
        }

        // Register our notification service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none' // Ensure we always get fresh SW
        });
        
        console.log('Notification Service Worker registered:', registration.scope);
        
        if (isMounted) {
          setServiceWorkerReady(true);
        }

        // Handle updates to our notification SW
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated' && isMounted) {
                console.log('Notification SW updated and activated');
                setServiceWorkerReady(true);
              }
            });
          }
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
        // Still try to use notifications if possible
        if (isMounted) {
          setServiceWorkerReady(false);
        }
      }
    };

    registerAndSetup();

    // Message handler for service worker
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'COMPLETE_TASK') {
        // Dispatch custom event for task completion
        window.dispatchEvent(new CustomEvent('sw-complete-task', {
          detail: { taskId: event.data.taskId }
        }));
      }
    };

    navigator.serviceWorker.addEventListener('message', messageHandler);

    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener('message', messageHandler);
    };
  }, [isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermissionStatus);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // Show a notification immediately
  const showNotification = useCallback(async (
    title: string,
    options?: NotificationOptions & { taskId?: string }
  ): Promise<void> => {
    if (permission !== 'granted') return;

    if (serviceWorkerReady) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options,
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/pwa-192x192.png',
        ...options,
      });
    }
  }, [permission, serviceWorkerReady]);

  // Schedule a notification for a specific time using Service Worker
  const scheduleNotification = useCallback(async (
    taskId: string,
    title: string,
    body: string,
    scheduledTime: Date
  ): Promise<void> => {
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) return; // Don't schedule past notifications

    // Clear any existing notification for this task
    setScheduledNotifications(prev => {
      const existing = prev.find(n => n.taskId === taskId);
      if (existing?.timeoutId) {
        clearTimeout(existing.timeoutId);
      }
      return prev.filter(n => n.taskId !== taskId);
    });

    // Try to use Service Worker for scheduling (survives page refresh)
    if (serviceWorkerReady) {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js');
        if (registration?.active) {
          registration.active.postMessage({
            type: 'SCHEDULE_NOTIFICATION',
            title,
            body,
            scheduledTime: scheduledTime.toISOString(),
            taskId
          });
          
          // Still track it locally for UI purposes
          setScheduledNotifications(prev => [
            ...prev,
            { taskId, title, body, scheduledTime }
          ]);
          return;
        }
      } catch (error) {
        console.error('Failed to schedule via SW:', error);
      }
    }

    // Fallback: Use setTimeout (doesn't survive page refresh)
    const timeoutId = setTimeout(async () => {
      if (permission === 'granted') {
        await showNotification(title, {
          body,
          tag: taskId,
          requireInteraction: true,
          data: { taskId, url: '/' },
        });
      }
      // Remove from scheduled list
      setScheduledNotifications(prev => prev.filter(n => n.taskId !== taskId));
    }, delay);

    setScheduledNotifications(prev => [
      ...prev,
      { taskId, title, body, scheduledTime, timeoutId }
    ]);
  }, [permission, showNotification, serviceWorkerReady]);

  // Schedule all task notifications for today
  const scheduleTaskNotifications = useCallback((tasks: Task[]): void => {
    if (permission !== 'granted') return;

    const today = new Date();
    
    tasks.forEach(task => {
      if (task.completed) return;

      const [hours, minutes] = task.time.split(':').map(Number);
      const taskTime = new Date(today);
      taskTime.setHours(hours, minutes, 0, 0);

      // Only schedule if task time is in the future
      if (taskTime > today) {
        scheduleNotification(
          task.id,
          `⚡ Buff Time: ${task.title}`,
          `Complete this quest to earn ${task.credits} Buff Points! 🎮`,
          taskTime
        );
      }
    });
  }, [permission, scheduleNotification]);

  // Schedule lesson notifications (5 minutes before) - Smart Buff Alerts
  const scheduleLessonNotifications = useCallback((
    schedule: PeriodInfo[],
    enabled: boolean
  ): void => {
    if (permission !== 'granted' || !enabled) return;

    const today = new Date();
    
    schedule.forEach((period, index) => {
      if (!period.subject) return;

      const [hours, minutes] = period.startTime.split(':').map(Number);
      const lessonTime = new Date(today);
      lessonTime.setHours(hours, minutes, 0, 0);
      
      // Notify 5 minutes before - Smart Buff Alert
      const notifyTime = new Date(lessonTime.getTime() - 5 * 60 * 1000);

      if (notifyTime > today) {
        scheduleNotification(
          `lesson_${index}`,
          `🎯 Your ${period.subject} quest starts in 5 minutes!`,
          `Get ready to Buff up! 🏆`,
          notifyTime
        );
      }
    });
  }, [permission, scheduleNotification]);

  // Cancel a scheduled notification
  const cancelNotification = useCallback((taskId: string): void => {
    setScheduledNotifications(prev => {
      const notification = prev.find(n => n.taskId === taskId);
      if (notification?.timeoutId) {
        clearTimeout(notification.timeoutId);
      }
      return prev.filter(n => n.taskId !== taskId);
    });
  }, []);

  // Cancel all scheduled notifications
  const cancelAllNotifications = useCallback((): void => {
    scheduledNotifications.forEach(n => {
      if (n.timeoutId) clearTimeout(n.timeoutId);
    });
    setScheduledNotifications([]);
  }, [scheduledNotifications]);

  return {
    permission,
    isSupported,
    serviceWorkerReady,
    scheduledNotifications,
    requestPermission,
    showNotification,
    scheduleNotification,
    scheduleTaskNotifications,
    scheduleLessonNotifications,
    cancelNotification,
    cancelAllNotifications,
  };
}
