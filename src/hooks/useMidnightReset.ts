import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const getTodayKey = () => new Date().toISOString().split('T')[0];

interface UseMidnightResetOptions {
  onReset: () => void;
}

export function useMidnightReset({ onReset }: UseMidnightResetOptions) {
  const { language } = useLanguage();
  const [lastKnownDate, setLastKnownDate] = useState(getTodayKey());
  const [showNewDayMessage, setShowNewDayMessage] = useState(false);
  // Cross-platform interval type (works in browser + node)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasShownTodayRef = useRef(false);

  const checkForNewDay = useCallback(() => {
    const currentDate = getTodayKey();
    
    if (currentDate !== lastKnownDate) {
      console.log('[MidnightReset] New day detected:', currentDate);
      setLastKnownDate(currentDate);
      
      // Only show message once per day
      if (!hasShownTodayRef.current) {
        hasShownTodayRef.current = true;
        setShowNewDayMessage(true);
        
        // Show toast notification
        const message = language === 'he' 
          ? '🌅 בוקר טוב! המשימות החדשות מוכנות!'
          : '🌅 Good Morning! New Quests are ready!';
        
        toast.success(message, {
          duration: 5000,
          position: 'top-center',
        });
        
        // Trigger data refresh
        onReset();
        
        // Hide message after a few seconds
        setTimeout(() => {
          setShowNewDayMessage(false);
        }, 5000);
      }
    }
  }, [lastKnownDate, language, onReset]);

  // Check on mount and when tab becomes visible
  useEffect(() => {
    // Initial check
    checkForNewDay();

    // Check every minute
    intervalRef.current = setInterval(checkForNewDay, 60000);

    // Also check when tab becomes visible (user returns to app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForNewDay();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Reset the "shown today" flag when component mounts with a new date
    const storedDate = localStorage.getItem('lastNewDayShown');
    const today = getTodayKey();
    if (storedDate !== today) {
      hasShownTodayRef.current = false;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForNewDay]);

  // Store when we've shown the message
  useEffect(() => {
    if (showNewDayMessage) {
      localStorage.setItem('lastNewDayShown', getTodayKey());
    }
  }, [showNewDayMessage]);

  const dismissNewDayMessage = useCallback(() => {
    setShowNewDayMessage(false);
  }, []);

  return {
    showNewDayMessage,
    dismissNewDayMessage,
    lastKnownDate,
  };
}
