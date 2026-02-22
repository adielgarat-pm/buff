import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Subscribes to store_rewards AND daily_progress realtime updates.
 * - When a reward is claimed (UPDATE with claimed=true), shows a celebratory toast
 *   AND persists a record in the `notifications` table for later retrieval.
 * - When a task is completed (INSERT with completed=true), same behaviour.
 *
 * Fix: `t` and other frequently-recreated values are kept in refs so the
 * useEffect deps only contain stable IDs — preventing duplicate subscriptions
 * (and therefore duplicate DB inserts) on re-renders.
 */
export function useRewardRedemptionNotifier(
  familyId: string | null | undefined,
  isParent: boolean,
) {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const { children } = useFamilyMembers();

  // Keep latest values in refs — stable references, never cause effect re-runs
  const tRef = useRef(t);
  const profileRef = useRef(profile);
  const childrenRef = useRef(children);

  tRef.current = t;
  profileRef.current = profile;
  childrenRef.current = children;

  // Cache tasks by ID for task-completion notifications
  const taskCacheRef = useRef<Map<string, string>>(new Map());

  // Notifications are now created server-side via DB triggers.
  // This hook only handles live toasts for the parent's open browser.

  // Effect only depends on stable primitives — not on `t`, `profile`, or `children`
  useEffect(() => {
    if (!familyId || !isParent) {
      console.log('[ParentNotifier] Skipping — familyId:', familyId, 'isParent:', isParent);
      return;
    }

    console.log('[ParentNotifier] Subscribing to realtime for family:', familyId);

    // Pre-fetch task titles for this family
    supabase
      .from('tasks')
      .select('id, title')
      .eq('family_id', familyId)
      .then(({ data }) => {
        if (data) {
          const cache = new Map<string, string>();
          data.forEach(task => cache.set(task.id, task.title));
          taskCacheRef.current = cache;
          console.log('[ParentNotifier] Task cache loaded:', cache.size, 'tasks');
        }
      });

    const channel = supabase
      .channel(`parent-notifier-${familyId}`)
      // ── Reward redemption ──────────────────────────────────────────────
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'store_rewards',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const newRow = payload.new as any;
          const oldRow = payload.old as any;

          console.log('[ParentNotifier] store_rewards UPDATE received:', {
            rewardId: newRow.id,
            newClaimed: newRow.claimed,
            oldClaimed: oldRow?.claimed,
            assignedTo: newRow.assigned_to,
          });

          // Only trigger when claimed flips from false → true
          if (newRow.claimed === true && oldRow?.claimed === false) {
            const childProfile = childrenRef.current.find(c => c.id === newRow.assigned_to);
            const childName = childProfile?.displayName || '';
            const rewardName = newRow.title || '';

            console.log('[ParentNotifier] Reward claimed! Child:', childName, 'Reward:', rewardName);

            // Show live toast using latest t from ref
            const title = tRef.current('notification.rewardRedeemed.title');
            const body = tRef.current('notification.rewardRedeemed.body')
              .replace('{childName}', childName)
              .replace('{rewardName}', rewardName);

            toast.success(title, { description: body, duration: 6000, icon: '🏆' });

            // Notification is now persisted server-side via DB trigger
          }
        },
      )
      // ── Task completion (INSERT: delete+insert pattern used by completeTask) ──
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'daily_progress',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const newRow = payload.new as any;

          // Only trigger for completed tasks with a child_id
          if (newRow.completed === true && newRow.child_id) {
            const childProfile = childrenRef.current.find(c => c.id === newRow.child_id);
            const childName = childProfile?.displayName || '';
            const taskName = taskCacheRef.current.get(newRow.task_id) || 'a quest';

            console.log(
              '[ParentNotifier] Task completed! Child:',
              childName,
              'Task:',
              taskName,
              'TaskID:',
              newRow.task_id,
            );

            // Show live toast
            const title = tRef.current('notification.taskCompleted.title');
            const body = tRef.current('notification.taskCompleted.body')
              .replace('{childName}', childName)
              .replace('{taskName}', taskName);

            toast.success(title, { description: body, duration: 4000, icon: '⚡' });

            // Notification is now persisted server-side via DB trigger
          }
        },
      )
      .subscribe((status) => {
        console.log('[ParentNotifier] Realtime subscription status:', status);
      });

    return () => {
      console.log('[ParentNotifier] Cleaning up realtime channel');
      supabase.removeChannel(channel);
    };
    // Intentionally only depend on stable primitives to prevent duplicate subscriptions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, isParent]);
}
