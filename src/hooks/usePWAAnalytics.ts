import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MessageType } from './useInstallPromptMessage';

// PWA analytics event types
export type PWAAnalyticsEvent = 
  | 'pwa_prompt_impression'      // Prompt was shown to user
  | 'pwa_prompt_dismissed_temp'  // User clicked "remind me later" (24h)
  | 'pwa_prompt_dismissed_perm'  // User clicked X (permanent dismiss)
  | 'pwa_install_started'        // User clicked install button
  | 'pwa_install_success'        // Installation completed successfully
  | 'pwa_install_cancelled';     // User cancelled native install dialog

export interface PWAAnalyticsMetadata {
  hours?: number;
  message_type?: MessageType;
  template_index?: number;
  browser?: string;
  [key: string]: unknown;
}

interface PWAAnalyticsData {
  event: PWAAnalyticsEvent;
  device_os: string;
  timestamp: string;
  metadata?: PWAAnalyticsMetadata;
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

// Map internal event names to database event types
function mapEventToDbType(event: PWAAnalyticsEvent): 'impression' | 'install' | 'dismiss_temporary' | 'dismiss_permanent' | null {
  switch (event) {
    case 'pwa_prompt_impression':
      return 'impression';
    case 'pwa_install_success':
      return 'install';
    case 'pwa_prompt_dismissed_temp':
      return 'dismiss_temporary';
    case 'pwa_prompt_dismissed_perm':
      return 'dismiss_permanent';
    default:
      return null; // Don't track install_started or install_cancelled in DB
  }
}

// Detect device type
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android/i.test(ua)) return 'mobile';
  return 'desktop';
}

// Save event to Supabase
async function saveEventToBackend(data: PWAAnalyticsData) {
  const dbEventType = mapEventToDbType(data.event);
  if (!dbEventType) return; // Skip events we don't track in DB

  try {
    // Get current user's info if available
    const { data: { user } } = await supabase.auth.getUser();
    let familyId: string | null = null;

    if (user) {
      // Try to get family_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        familyId = profile.family_id;
      }
    }

    // Insert event
    const { error } = await supabase
      .from('pwa_events')
      .insert({
        event_type: dbEventType,
        user_id: user?.id || null,
        family_id: familyId,
        browser: data.metadata?.browser || null,
        os: data.device_os,
        device_type: getDeviceType(),
        message_type: data.metadata?.message_type || null,
        template_index: data.metadata?.template_index || null,
      });

    if (error) {
      console.error('[PWA Analytics] Failed to save to backend:', error);
    } else {
      console.log('[PWA Analytics] Event saved to backend:', dbEventType);
    }
  } catch (e) {
    console.error('[PWA Analytics] Backend save error:', e);
  }
}

// Log event to console and localStorage + backend
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

  // Save to backend (async, don't block)
  saveEventToBackend(data);
}

export function usePWAAnalytics() {
  const trackEvent = useCallback((
    event: PWAAnalyticsEvent, 
    deviceOS: string,
    metadata?: PWAAnalyticsMetadata
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

      // Group by message type (personalized vs generic)
      const byMessageType = events.reduce((acc, event) => {
        const msgType = (event.metadata?.message_type as string) || 'unknown';
        if (!acc[msgType]) acc[msgType] = { impressions: 0, installs: 0, dismissals: 0 };
        if (event.event === 'pwa_prompt_impression') acc[msgType].impressions++;
        if (event.event === 'pwa_install_success') acc[msgType].installs++;
        if (event.event === 'pwa_prompt_dismissed_perm' || event.event === 'pwa_prompt_dismissed_temp') {
          acc[msgType].dismissals++;
        }
        return acc;
      }, {} as Record<string, { impressions: number; installs: number; dismissals: number }>);

      // Group by browser
      const byBrowser = events.reduce((acc, event) => {
        const browser = (event.metadata?.browser as string) || 'unknown';
        if (!acc[browser]) acc[browser] = { impressions: 0, installs: 0 };
        if (event.event === 'pwa_prompt_impression') acc[browser].impressions++;
        if (event.event === 'pwa_install_success') acc[browser].installs++;
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
        byMessageType,
        byBrowser,
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
  metadata?: PWAAnalyticsMetadata
) {
  logPWAEvent({
    event,
    device_os: deviceOS,
    timestamp: new Date().toISOString(),
    metadata,
  });
}
