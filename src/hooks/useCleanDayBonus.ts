import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const getTodayKey = () => new Date().toISOString().split('T')[0];

export function useCleanDayBonus() {
  const { familyId } = useAuth();
  const [awarding, setAwarding] = useState<string | null>(null);

  const awardCleanDayBonus = useCallback(async (childId: string, childName: string, customBonusAmount?: number) => {
    if (!familyId) return false;

    setAwarding(childId);
    const todayKey = getTodayKey();
    const bonusCredits = customBonusAmount ?? 20;

    try {
      // Check if bonus was already awarded today
      const localStorageKey = `cleanDayBonus_${childId}_${todayKey}`;
      if (localStorage.getItem(localStorageKey)) {
        toast.error(`בונוס יום מוצלח כבר ניתן ל${childName} היום!`);
        setAwarding(null);
        return false;
      }

      // Get current vault balance
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
        // Update existing vault
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
        // Create new vault for child
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

      // Mark bonus as awarded today (local storage for simple tracking)
      localStorage.setItem(localStorageKey, 'true');

      toast.success(`🌟 ${childName} קיבל/ה בונוס יום מוצלח! +${bonusCredits} קרדיטים`);
      setAwarding(null);
      return true;
    } catch (error) {
      console.error('Error awarding clean day bonus:', error);
      toast.error('שגיאה בהענקת הבונוס');
      setAwarding(null);
      return false;
    }
  }, [familyId]);

  const wasBonusAwardedToday = useCallback((childId: string): boolean => {
    const todayKey = getTodayKey();
    const localStorageKey = `cleanDayBonus_${childId}_${todayKey}`;
    return localStorage.getItem(localStorageKey) === 'true';
  }, []);

  return { awardCleanDayBonus, awarding, wasBonusAwardedToday };
}
