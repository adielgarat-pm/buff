import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * useNavigationHistory - Syncs internal app navigation with browser history
 * 
 * This hook ensures that:
 * 1. Browser back gesture navigates within the app (not exit)
 * 2. Internal tab/view changes are pushed to browser history
 * 3. popstate events trigger proper internal navigation
 */
export function useNavigationHistory(
  currentView: string,
  onViewChange: (view: string) => void,
  viewStack: string[] = ['overview']
) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHandlingPopState = useRef(false);
  const lastPushedView = useRef<string | null>(null);

  // Push view changes to browser history
  const pushViewToHistory = useCallback((view: string) => {
    if (lastPushedView.current === view) return;
    
    // Use replace for initial state, push for subsequent navigation
    const stateKey = `buff_view_${Date.now()}`;
    window.history.pushState({ view, key: stateKey }, '', location.pathname);
    lastPushedView.current = view;
  }, [location.pathname]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      isHandlingPopState.current = true;
      
      if (event.state?.view) {
        // Navigate to the view stored in history state
        onViewChange(event.state.view);
      } else {
        // Default to first view in stack (usually 'overview')
        onViewChange(viewStack[0]);
      }
      
      // Reset flag after a short delay to allow for state updates
      setTimeout(() => {
        isHandlingPopState.current = false;
      }, 100);
    };

    window.addEventListener('popstate', handlePopState);
    
    // Initialize history state on mount
    if (!window.history.state?.view) {
      window.history.replaceState({ view: currentView, key: 'initial' }, '', location.pathname);
      lastPushedView.current = currentView;
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onViewChange, viewStack, currentView, location.pathname]);

  // Push to history when view changes (except when handling popstate)
  useEffect(() => {
    if (!isHandlingPopState.current && currentView !== lastPushedView.current) {
      pushViewToHistory(currentView);
    }
  }, [currentView, pushViewToHistory]);

  return {
    pushViewToHistory,
    canGoBack: viewStack.indexOf(currentView) > 0,
  };
}
