import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';

/**
 * Subscribes to store_rewards AND daily_progress realtime updates.
 * - When a reward is claimed (UPDATE with claimed=true), shows a celebratory toast.
 * - When a task is completed (INSERT/UPDATE with completed=true), shows a quest-complete toast.
 */
export function useRewardRedemptionNotifier(familyId: string | null | undefined, isParent: boolean) {
  const { t } = useLanguage();
  const { children } = useFamilyMembers();
  const childrenRef = useRef(children);
  childrenRef.current = children;

  // Cache tasks by ID for task-completion notifications
  const taskCacheRef = useRef<Map<string, string>>(new Map());

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
          data.forEach(t => cache.set(t.id, t.title));
          taskCacheRef.current = cache;
          console.log('[ParentNotifier] Task cache loaded:', cache.size, 'tasks');
        }
      });

    const channel = supabase
      .channel(`parent-notifier-${familyId}`)
      // ── Reward redemption ──
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

          // Only trigger when claimed flips from false to true
          if (newRow.claimed === true && oldRow?.claimed === false) {
            const childProfile = childrenRef.current.find(c => c.id === newRow.assigned_to);
            const childName = childProfile?.displayName || '';
            const rewardName = newRow.title || '';

            console.log('[ParentNotifier] Reward claimed! Child:', childName, 'Reward:', rewardName);

            const title = t('notification.rewardRedeemed.title');
            const body = t('notification.rewardRedeemed.body')
              .replace('{childName}', childName)
              .replace('{rewardName}', rewardName);

            toast.success(title, {
              description: body,
              duration: 6000,
              icon: '🏆',
            });
          }
        }
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

            console.log('[ParentNotifier] Task completed! Child:', childName, 'Task:', taskName, 'TaskID:', newRow.task_id);

            const title = t('notification.taskCompleted.title');
            const body = t('notification.taskCompleted.body')
              .replace('{childName}', childName)
              .replace('{taskName}', taskName);

            toast.success(title, {
              description: body,
              duration: 4000,
              icon: '⚡',
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[ParentNotifier] Realtime subscription status:', status);
      });

    return () => {
      console.log('[ParentNotifier] Cleaning up realtime channel');
      supabase.removeChannel(channel);
    };
  }, [familyId, isParent, t]);
}
