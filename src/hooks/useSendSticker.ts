import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function useSendSticker(familyId: string | null | undefined, parentProfileId: string | null | undefined) {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);

  const sendSticker = useCallback(
    async (childId: string, stickerType: string = 'star', message?: string) => {
      if (!familyId || !parentProfileId) return false;
      setSending(true);

      const { error } = await supabase.from('stickers').insert({
        family_id: familyId,
        from_parent_id: parentProfileId,
        to_child_id: childId,
        sticker_type: stickerType,
        message: message || null,
      });

      setSending(false);

      if (error) {
        console.error('[useSendSticker] Error:', error);
        toast.error(t('sticker.sendError'));
        return false;
      }

      toast.success(t('sticker.sent'), { icon: '⭐' });
      return true;
    },
    [familyId, parentProfileId, t],
  );

  return { sendSticker, sending };
}
