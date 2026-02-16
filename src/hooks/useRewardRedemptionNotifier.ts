import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';

/**
 * Subscribes to store_rewards realtime updates.
 * When a reward is claimed (UPDATE with claimed=true), shows a celebratory
 * toast to the parent with the child's name and reward title.
 */
export function useRewardRedemptionNotifier(familyId: string | null | undefined, isParent: boolean) {
  const { t } = useLanguage();
  const { children } = useFamilyMembers();
  const childrenRef = useRef(children);
  childrenRef.current = children;

  useEffect(() => {
    if (!familyId || !isParent) return;

    const channel = supabase
      .channel(`reward-claims-${familyId}`)
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

          // Only trigger when claimed flips from false to true
          if (newRow.claimed === true && oldRow.claimed === false) {
            const childProfile = childrenRef.current.find(c => c.id === newRow.assigned_to);
            const childName = childProfile?.displayName || '';
            const rewardName = newRow.title || '';

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, isParent, t]);
}
