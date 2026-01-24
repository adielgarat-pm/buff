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

    // Register service worker
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
        setServiceWorkerReady(true);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'COMPLETE_TASK') {
        // Dispatch custom event for task completion
        window.dispatchEvent(new CustomEvent('sw-complete-task', {
          detail: { taskId: event.data.taskId }
        }));
      }
    });
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

  // Schedule a notification for a specific time
  const scheduleNotification = useCallback((
    taskId: string,
    title: string,
    body: string,
    scheduledTime: Date
  ): void => {
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

    // Schedule the notification
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
  }, [permission, showNotification]);

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
          `Time for: ${task.title}`,
          `Complete this task to earn ${task.credits} credits! 🌟`,
          taskTime
        );
      }
    });
  }, [permission, scheduleNotification]);

  // Schedule lesson notifications (5 minutes before)
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
      
      // Notify 5 minutes before
      const notifyTime = new Date(lessonTime.getTime() - 5 * 60 * 1000);

      if (notifyTime > today) {
        scheduleNotification(
          `lesson_${index}`,
          `${period.subject} starts in 5 minutes!`,
          `Get ready for your next class 📚`,
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
