import { useState, useEffect, useCallback } from 'react';
import { Task, PeriodInfo } from '@/types/task';
import { getDiscreteNotificationTitle, getDiscreteNotificationBody, getEffectiveCredits } from '@/utils/protocolTaskUtils';
import { useLanguage } from '@/contexts/LanguageContext';

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

interface ScheduledNotification {
  taskId: string;
  title: string;
  body: string;
  scheduledTime: Date;
  timeoutId?: ReturnType<typeof setTimeout>;
}

export function useNotifications() {
  const { t } = useLanguage();
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

        // Register our notification service worker.
        // NOTE: We intentionally do NOT use '/sw.js' here because the PWA build
        // tool also generates a service worker with that filename during production builds.
        const registration = await navigator.serviceWorker.register('/notification-sw.js', {
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
        const registration = await navigator.serviceWorker.getRegistration('/notification-sw.js');
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

  // Schedule all task notifications for today - "Positive Coach" nudge 5 min before
  const scheduleTaskNotifications = useCallback((tasks: Task[], childName?: string): void => {
    if (permission !== 'granted') return;

    const today = new Date();
    
    tasks.forEach(task => {
      if (task.completed) return;

      const [hours, minutes] = task.time.split(':').map(Number);
      const taskTime = new Date(today);
      taskTime.setHours(hours, minutes, 0, 0);

      // Nudge 5 minutes BEFORE the task time
      const nudgeTime = new Date(taskTime.getTime() - 5 * 60 * 1000);

      // Only schedule if nudge time is in the future
      if (nudgeTime > today) {
        const coachTitle = childName 
          ? t('notification.coachNudge').replace('{name}', childName)
          : getDiscreteNotificationTitle(task);
        
        scheduleNotification(
          task.id,
          coachTitle,
          getDiscreteNotificationBody(task),
          nudgeTime
        );
      }
    });
  }, [permission, scheduleNotification, t]);

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
          t('notification.lessonSoon').replace('{subject}', period.subject),
          t('notification.getReady'),
          notifyTime
        );
      }
    });
  }, [permission, scheduleNotification]);

  // Schedule Gear Master Evening Mission notification (19:00)
  // Smart Context Guard: Only schedule if tomorrow is a school day with lessons
  const scheduleGearMasterNotification = useCallback((
    bagPrepEnabled: boolean,
    bagPrepCompleted: boolean,
    credits: number,
    tomorrowHasSchedule: boolean = true
  ): void => {
    // Smart Context Guard: No notification if disabled, completed, or no schedule for tomorrow
    if (permission !== 'granted' || !bagPrepEnabled || bagPrepCompleted || !tomorrowHasSchedule) return;

    const today = new Date();
    const notifyTime = new Date(today);
    notifyTime.setHours(19, 0, 0, 0); // 19:00

    // Only schedule if 19:00 is in the future
    if (notifyTime > today) {
      scheduleNotification(
        'gear_master_evening',
        t('notification.gearMasterTitle'),
        t('notification.gearMasterBody').replace('{credits}', String(credits)),
        notifyTime
      );
    }
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

  // Schedule a morning preview notification at 07:00
  const scheduleMorningPreview = useCallback((
    taskCount: number,
    childName?: string
  ): void => {
    if (permission !== 'granted' || taskCount === 0) return;

    const today = new Date();
    const morningTime = new Date(today);
    morningTime.setHours(7, 0, 0, 0);

    // Only schedule if 07:00 is in the future
    if (morningTime > today) {
      const title = t('notification.morningTitle').replace('{name}', childName || '');
      const body = t('notification.morningBody').replace('{count}', String(taskCount));
      
      scheduleNotification(
        'morning_preview',
        title,
        body,
        morningTime
      );
    }
  }, [permission, scheduleNotification, t]);

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
    scheduleGearMasterNotification,
    scheduleMorningPreview,
    cancelNotification,
    cancelAllNotifications,
  };
}
