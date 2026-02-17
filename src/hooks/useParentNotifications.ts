import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ParentNotification {
  id: string;
  family_id: string;
  parent_id: string;
  type: 'reward_redeemed' | 'task_completed';
  child_id: string | null;
  child_name: string;
  entity_id: string | null;
  entity_name: string;
  is_read: boolean;
  created_at: string;
}

export function useParentNotifications(
  familyId: string | null | undefined,
  isParent: boolean,
) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const toastedIdsRef = useRef<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Fetch all (unread + recent read) notifications ──────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!familyId || !isParent) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[useParentNotifications] Fetch error:', error);
    } else {
      setNotifications((data ?? []) as ParentNotification[]);
    }
    setLoading(false);
  }, [familyId, isParent]);

  // ── Show toasts for unread notifications that haven't been toasted yet ──
  const showUnreadToasts = useCallback(
    (items: ParentNotification[]) => {
      const unread = items.filter((n) => !n.is_read && !toastedIdsRef.current.has(n.id));
      // Show at most 3 toasts to avoid spam on first open
      unread.slice(0, 3).forEach((n) => {
        toastedIdsRef.current.add(n.id);
        if (n.type === 'reward_redeemed') {
          const title = t('notification.rewardRedeemed.title');
          const body = t('notification.rewardRedeemed.body')
            .replace('{childName}', n.child_name)
            .replace('{rewardName}', n.entity_name);
          toast.success(title, { description: body, duration: 6000, icon: '🏆' });
        } else if (n.type === 'task_completed') {
          const title = t('notification.taskCompleted.title');
          const body = t('notification.taskCompleted.body')
            .replace('{childName}', n.child_name)
            .replace('{taskName}', n.entity_name);
          toast.success(title, { description: body, duration: 5000, icon: '⚡' });
        }
      });
    },
    [t],
  );

  // ── Mark a single notification as read ──────────────────────────────────
  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
    );
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) console.error('[useParentNotifications] markAsRead error:', error);
  }, []);

  // ── Mark all as read ─────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    if (!familyId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('family_id', familyId)
      .eq('is_read', false);
    if (error) console.error('[useParentNotifications] markAllAsRead error:', error);
  }, [familyId]);

  // ── On mount: fetch + show toasts for pending unread items ───────────────
  useEffect(() => {
    if (!familyId || !isParent) return;

    fetchNotifications().then(() => {
      // showUnreadToasts is called reactively below via a separate effect
    });
  }, [familyId, isParent, fetchNotifications]);

  // ── Show toasts when notifications list changes (on mount & realtime) ───
  useEffect(() => {
    if (notifications.length > 0) {
      showUnreadToasts(notifications);
    }
  }, [notifications, showUnreadToasts]);

  // ── Realtime: listen for new notifications ───────────────────────────────
  useEffect(() => {
    if (!familyId || !isParent) return;

    console.log('[useParentNotifications] Subscribing to realtime for family:', familyId);

    const channel = supabase
      .channel(`notifications-parent-${familyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          console.log('[useParentNotifications] New notification received:', payload.new);
          const newNotif = payload.new as ParentNotification;
          setNotifications((prev) => [newNotif, ...prev]);
        },
      )
      .subscribe((status) => {
        console.log('[useParentNotifications] Realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, isParent]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
