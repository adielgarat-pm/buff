// Service Worker for Push Notifications
const CACHE_NAME = 'daily-quests-v1';

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Push notification received
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Time for your task!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'task-reminder',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'complete', title: '✓ Done' },
      { action: 'snooze', title: '⏰ Snooze' }
    ],
    data: {
      taskId: data.taskId,
      url: data.url || '/',
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Daily Quests', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;

  if (action === 'complete') {
    // Send message to client to complete the task
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'COMPLETE_TASK',
            taskId: notificationData.taskId
          });
        }
      })
    );
  } else if (action === 'snooze') {
    // Schedule another notification in 5 minutes
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification(event.notification.title, {
            body: event.notification.body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: notificationData.taskId,
            data: notificationData
          });
          resolve();
        }, 5 * 60 * 1000);
      })
    );
  }

  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open a new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(notificationData.url || '/');
      }
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, scheduledTime, taskId } = event.data;
    const delay = new Date(scheduledTime).getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: taskId,
          vibrate: [200, 100, 200],
          requireInteraction: true,
          actions: [
            { action: 'complete', title: '✓ Done' },
            { action: 'snooze', title: '⏰ Snooze' }
          ],
          data: { taskId, url: '/' }
        });
      }, delay);
    }
  }
});
