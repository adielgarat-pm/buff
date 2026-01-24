import { useState, useEffect } from 'react';
import { Bell, BellOff, X, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { NotificationPermissionStatus } from '@/hooks/useNotifications';

interface NotificationPromptProps {
  permission: NotificationPermissionStatus;
  onRequestPermission: () => Promise<boolean>;
}

export function NotificationPrompt({ permission, onRequestPermission }: NotificationPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Only show prompt if permission hasn't been decided and not dismissed recently
    if (permission !== 'default') return;

    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 3) return;
    }

    // Show prompt after a short delay
    const timer = setTimeout(() => setShowPrompt(true), 1500);
    return () => clearTimeout(timer);
  }, [permission]);

  const handleEnable = async () => {
    setIsRequesting(true);
    const granted = await onRequestPermission();
    setIsRequesting(false);
    
    if (granted) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', new Date().toISOString());
  };

  // Don't show if permission already granted or denied
  if (!showPrompt || permission === 'granted' || permission === 'denied' || permission === 'unsupported') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 animate-in fade-in">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Bell className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-center text-foreground">
            Never Miss a Buff!
          </h2>
          <p className="mt-2 text-center text-muted-foreground text-sm">
            Get Buff Alerts for quests, medications, and lessons — even when the app is closed.
          </p>
        </div>

        {/* Benefits */}
        <div className="px-6 pb-4 space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Task reminders at the right time</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Medication alerts you won't miss</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Lesson notifications before class</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-secondary/30 flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={handleDismiss}
          >
            Maybe Later
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleEnable}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enabling...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Enable
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Compact notification status indicator for header
interface NotificationStatusProps {
  permission: NotificationPermissionStatus;
  onRequestPermission: () => Promise<boolean>;
}

export function NotificationStatus({ permission, onRequestPermission }: NotificationStatusProps) {
  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-1 text-xs text-primary">
        <Bell className="w-3 h-3" />
        <span>On</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <BellOff className="w-3 h-3" />
        <span>Blocked</span>
      </div>
    );
  }

  if (permission === 'default') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs gap-1 text-primary hover:text-primary/80"
        onClick={onRequestPermission}
      >
        <Bell className="w-3 h-3" />
        Enable
      </Button>
    );
  }

  return null;
}
