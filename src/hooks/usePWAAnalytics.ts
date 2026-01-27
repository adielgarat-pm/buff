import { useCallback } from 'react';

// PWA analytics event types
export type PWAAnalyticsEvent = 
  | 'pwa_prompt_impression'      // Prompt was shown to user
  | 'pwa_prompt_dismissed_temp'  // User clicked "remind me later" (24h)
  | 'pwa_prompt_dismissed_perm'  // User clicked X (permanent dismiss)
  | 'pwa_install_started'        // User clicked install button
  | 'pwa_install_success'        // Installation completed successfully
  | 'pwa_install_cancelled';     // User cancelled native install dialog

interface PWAAnalyticsData {
  event: PWAAnalyticsEvent;
  device_os: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// In-memory session storage
const sessionEvents: PWAAnalyticsData[] = [];

// Generate or retrieve session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('pwa_analytics_session_id');
  if (!sessionId) {
    sessionId = `pwa_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('pwa_analytics_session_id', sessionId);
  }
  return sessionId;
}

// Log event to console and localStorage
function logPWAEvent(data: PWAAnalyticsData) {
  const logEntry = {
    ...data,
    sessionId: getSessionId(),
  };
  
  // Store in session
  sessionEvents.push(data);
  
  // Log to console for debugging
  console.log('[PWA Analytics]', logEntry);
  
  // Persist to localStorage
  try {
    const stored = localStorage.getItem('pwa_analytics') || '[]';
    const events = JSON.parse(stored);
    events.push(logEntry);
    // Keep only last 200 events
    if (events.length > 200) events.shift();
    localStorage.setItem('pwa_analytics', JSON.stringify(events));
  } catch (e) {
    console.error('Failed to store PWA analytics:', e);
  }
}

export function usePWAAnalytics() {
  const trackEvent = useCallback((
    event: PWAAnalyticsEvent, 
    deviceOS: string,
    metadata?: Record<string, unknown>
  ) => {
    logPWAEvent({
      event,
      device_os: deviceOS,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }, []);

  const getAnalyticsReport = useCallback(() => {
    try {
      const stored = localStorage.getItem('pwa_analytics') || '[]';
      const events: Array<PWAAnalyticsData & { sessionId: string }> = JSON.parse(stored);
      
      // Calculate metrics
      const impressions = events.filter(e => e.event === 'pwa_prompt_impression').length;
      const tempDismissals = events.filter(e => e.event === 'pwa_prompt_dismissed_temp').length;
      const permDismissals = events.filter(e => e.event === 'pwa_prompt_dismissed_perm').length;
      const installStarts = events.filter(e => e.event === 'pwa_install_started').length;
      const installSuccesses = events.filter(e => e.event === 'pwa_install_success').length;
      const installCancelled = events.filter(e => e.event === 'pwa_install_cancelled').length;
      
      // Group by device OS
      const byDevice = events.reduce((acc, event) => {
        const os = event.device_os || 'unknown';
        if (!acc[os]) acc[os] = { impressions: 0, installs: 0 };
        if (event.event === 'pwa_prompt_impression') acc[os].impressions++;
        if (event.event === 'pwa_install_success') acc[os].installs++;
        return acc;
      }, {} as Record<string, { impressions: number; installs: number }>);

      // Calculate conversion rate
      const conversionRate = impressions > 0 
        ? Math.round((installSuccesses / impressions) * 100) 
        : 0;

      return {
        totalImpressions: impressions,
        tempDismissals,
        permDismissals,
        installStarts,
        installSuccesses,
        installCancelled,
        conversionRate,
        byDevice,
        recentEvents: events.slice(-20).reverse(),
      };
    } catch (e) {
      console.error('Failed to generate PWA analytics report:', e);
      return null;
    }
  }, []);

  const clearAnalytics = useCallback(() => {
    localStorage.removeItem('pwa_analytics');
    sessionEvents.length = 0;
  }, []);

  return {
    trackEvent,
    getAnalyticsReport,
    clearAnalytics,
  };
}

// Standalone functions for use outside React components
export function trackPWAEvent(
  event: PWAAnalyticsEvent, 
  deviceOS: string,
  metadata?: Record<string, unknown>
) {
  logPWAEvent({
    event,
    device_os: deviceOS,
    timestamp: new Date().toISOString(),
    metadata,
  });
}

