import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Sticker {
  id: string;
  family_id: string;
  from_parent_id: string;
  to_child_id: string;
  sticker_type: string;
  message: string | null;
  is_seen: boolean;
  created_at: string;
}

/**
 * Hook for the child side: fetches unseen stickers and provides a dismiss function.
 * When the child opens the app and has an unseen sticker, we show a celebration.
 */
export function useChildStickers(childId: string | null | undefined, familyId: string | null | undefined) {
  const [pendingSticker, setPendingSticker] = useState<Sticker | null>(null);

  const fetchUnseen = useCallback(async () => {
    if (!childId || !familyId) return;

    const { data } = await supabase
      .from('stickers')
      .select('*')
      .eq('to_child_id', childId)
      .eq('is_seen', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setPendingSticker(data[0] as unknown as Sticker);
    }
  }, [childId, familyId]);

  useEffect(() => {
    fetchUnseen();
  }, [fetchUnseen]);

  // Realtime listener for new stickers
  useEffect(() => {
    if (!childId || !familyId) return;

    const channel = supabase
      .channel(`stickers-child-${childId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stickers',
          filter: `to_child_id=eq.${childId}`,
        },
        (payload) => {
          setPendingSticker(payload.new as unknown as Sticker);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [childId, familyId]);

  const dismissSticker = useCallback(async () => {
    if (!pendingSticker) return;

    setPendingSticker(null);

    await supabase
      .from('stickers')
      .update({ is_seen: true })
      .eq('id', pendingSticker.id);
  }, [pendingSticker]);

  return { pendingSticker, dismissSticker };
}
