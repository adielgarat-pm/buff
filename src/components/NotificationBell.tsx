import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useParentNotifications, ParentNotification } from '@/hooks/useParentNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: ParentNotification;
  onMarkRead: (id: string) => void;
}) {
  const icon = notification.type === 'reward_redeemed' ? '🏆' : '⚡';
  const timeLabel = format(new Date(notification.created_at), 'HH:mm');

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors',
        !notification.is_read && 'bg-primary/5',
      )}
    >
      <span className="text-xl mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">
          {notification.child_name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          {notification.type === 'reward_redeemed'
            ? `Redeemed "${notification.entity_name}"`
            : `Completed "${notification.entity_name}"`}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">{timeLabel}</p>
      </div>
      {!notification.is_read && (
        <button
          onClick={() => onMarkRead(notification.id)}
          className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Mark as read"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function NotificationBell() {
  const { profile } = useAuth();
  const familyId = profile?.family_id;
  const isParent = profile?.role === 'parent';
  const { t } = useLanguage();
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useParentNotifications(familyId, isParent);

  // Close panel on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setPanelOpen(false);
      }
    };
    if (panelOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [panelOpen]);

  const handleOpen = () => {
    setPanelOpen((v) => !v);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  if (!isParent) return null;

  return (
    <div className="relative">
      {/* Bell button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-full hover:bg-muted"
      >
        <Bell className="w-5 h-5 text-foreground" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/20 sm:hidden"
              onClick={() => setPanelOpen(false)}
            />
            <motion.div
              ref={panelRef}
              key="panel"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'fixed sm:absolute z-50 bg-card rounded-xl shadow-lg border border-border overflow-hidden',
                // Mobile: centered horizontally with margin
                'left-4 right-4 top-16 sm:left-auto sm:right-0 sm:top-11',
                'sm:w-80 max-w-sm',
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-muted"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="max-h-72 overflow-y-auto">
                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      You'll be notified when your child completes a quest or redeems a reward.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <NotificationItem key={n.id} notification={n} onMarkRead={markAsRead} />
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
