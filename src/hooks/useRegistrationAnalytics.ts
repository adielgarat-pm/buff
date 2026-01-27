import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Registration funnel steps
export type RegistrationStep = 
  | 'landing_visit'           // User visited landing page
  | 'auth_page_visit'         // User arrived at auth page
  | 'role_selected'           // User selected parent/child role
  | 'signup_form_started'     // User started filling signup form
  | 'signup_submitted'        // User submitted signup form
  | 'signup_success'          // Signup completed successfully
  | 'signup_error'            // Signup failed with error
  | 'google_auth_started'     // User clicked Google sign in
  | 'google_auth_callback'    // User returned from Google
  | 'profile_creation_started'// Started creating profile
  | 'profile_created'         // Profile created successfully
  | 'family_created'          // Family created (for parents)
  | 'family_joined'           // Family joined (for children)
  | 'onboarding_complete'     // Full registration complete
  | 'child_invite_visit'      // Child visited magic link page
  | 'child_invite_submitted'  // Child submitted invite form
  | 'child_invite_success'    // Child invite registration complete
  | 'child_invite_error';     // Child invite registration failed

interface AnalyticsEvent {
  step: RegistrationStep;
  metadata?: Record<string, unknown>;
  error?: string;
}

// Simple in-memory analytics store for the session
const sessionEvents: AnalyticsEvent[] = [];

// Log to console in development, could be extended to send to analytics service
function logEvent(event: AnalyticsEvent) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    ...event,
  };
  
  // Store in session
  sessionEvents.push(event);
  
  // Log to console for debugging
  console.log('[Registration Analytics]', logData);
  
  // Store in localStorage for persistence across page refreshes
  try {
    const stored = localStorage.getItem('registration_analytics') || '[]';
    const events = JSON.parse(stored);
    events.push({ ...logData, sessionId: getSessionId() });
    // Keep only last 100 events
    if (events.length > 100) events.shift();
    localStorage.setItem('registration_analytics', JSON.stringify(events));
  } catch (e) {
    console.error('Failed to store analytics:', e);
  }
}

// Generate or retrieve session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

export function useRegistrationAnalytics() {
  const trackStep = useCallback((step: RegistrationStep, metadata?: Record<string, unknown>) => {
    logEvent({ step, metadata });
  }, []);

  const trackError = useCallback((step: RegistrationStep, error: string, metadata?: Record<string, unknown>) => {
    logEvent({ step, error, metadata });
  }, []);

  const getSessionEvents = useCallback(() => {
    return [...sessionEvents];
  }, []);

  const getFunnelReport = useCallback(() => {
    try {
      const stored = localStorage.getItem('registration_analytics') || '[]';
      const events: Array<AnalyticsEvent & { timestamp: string; sessionId: string }> = JSON.parse(stored);
      
      // Group by session
      const sessions = new Map<string, typeof events>();
      events.forEach(event => {
        const sessionId = event.sessionId;
        if (!sessions.has(sessionId)) {
          sessions.set(sessionId, []);
        }
        sessions.get(sessionId)!.push(event);
      });

      // Calculate funnel metrics
      const funnelSteps: RegistrationStep[] = [
        'auth_page_visit',
        'role_selected',
        'signup_form_started',
        'signup_submitted',
        'signup_success',
        'onboarding_complete'
      ];

      const stepCounts: Record<string, number> = {};
      funnelSteps.forEach(step => {
        stepCounts[step] = 0;
      });

      sessions.forEach(sessionEvents => {
        const sessionSteps = new Set(sessionEvents.map(e => e.step));
        funnelSteps.forEach(step => {
          if (sessionSteps.has(step)) {
            stepCounts[step]++;
          }
        });
      });

      return {
        totalSessions: sessions.size,
        stepCounts,
        dropOffPoints: funnelSteps.map((step, index) => {
          if (index === 0) return { step, dropOff: 0 };
          const prev = stepCounts[funnelSteps[index - 1]] || 0;
          const curr = stepCounts[step] || 0;
          return {
            step,
            dropOff: prev > 0 ? Math.round(((prev - curr) / prev) * 100) : 0
          };
        })
      };
    } catch (e) {
      console.error('Failed to generate funnel report:', e);
      return null;
    }
  }, []);

  return {
    trackStep,
    trackError,
    getSessionEvents,
    getFunnelReport
  };
}

// Standalone function for use outside of React components
export function trackRegistrationStep(step: RegistrationStep, metadata?: Record<string, unknown>) {
  logEvent({ step, metadata });
}

export function trackRegistrationError(step: RegistrationStep, error: string, metadata?: Record<string, unknown>) {
  logEvent({ step, error, metadata });
}
