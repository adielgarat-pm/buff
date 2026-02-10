import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const getTodayKey = () => new Date().toISOString().split('T')[0];

export function useCleanDayBonus() {
  const { familyId } = useAuth();
  const { t } = useLanguage();
  const [awarding, setAwarding] = useState<string | null>(null);

  const awardCleanDayBonus = useCallback(async (childId: string, childName: string) => {
    if (!familyId) return false;

    setAwarding(childId);
    const todayKey = getTodayKey();
    const bonusCredits = 20;

    try {
      const localStorageKey = `cleanDayBonus_${childId}_${todayKey}`;
      if (localStorage.getItem(localStorageKey)) {
        toast.error(t('bonus.alreadyAwarded').replace('{name}', childName));
        setAwarding(null);
        return false;
      }

      const { data: vaultData, error: vaultError } = await supabase
        .from('credit_vault')
        .select('*')
        .eq('family_id', familyId)
        .eq('child_id', childId)
        .maybeSingle();

      if (vaultError) throw vaultError;

      const currentBalance = vaultData?.total_balance || 0;
      const newBalance = currentBalance + bonusCredits;

      if (vaultData) {
        const { error: updateError } = await supabase
          .from('credit_vault')
          .update({
            total_balance: newBalance,
            last_updated_date: todayKey,
            updated_at: new Date().toISOString(),
          })
          .eq('id', vaultData.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('credit_vault')
          .insert({
            family_id: familyId,
            child_id: childId,
            total_balance: bonusCredits,
            last_updated_date: todayKey,
          });
        if (insertError) throw insertError;
      }

      localStorage.setItem(localStorageKey, 'true');

      toast.success(t('bonus.awarded').replace('{name}', childName).replace('{credits}', String(bonusCredits)));
      setAwarding(null);
      return true;
    } catch (error) {
      console.error('Error awarding clean day bonus:', error);
      toast.error(t('bonus.error'));
      setAwarding(null);
      return false;
    }
  }, [familyId, t]);

  const wasBonusAwardedToday = useCallback((childId: string): boolean => {
    const todayKey = getTodayKey();
    const localStorageKey = `cleanDayBonus_${childId}_${todayKey}`;
    return localStorage.getItem(localStorageKey) === 'true';
  }, []);

  return { awardCleanDayBonus, awarding, wasBonusAwardedToday };
}
