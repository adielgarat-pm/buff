import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useMarketingConsent() {
  const { user } = useAuth();
  const [marketingConsent, setMarketingConsent] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConsent = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('marketing_consent')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching marketing consent:', error);
        return;
      }

      setMarketingConsent(data?.marketing_consent ?? false);
    } catch (err) {
      console.error('Error fetching marketing consent:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConsent();
  }, [fetchConsent]);

  const updateConsent = useCallback(async (enabled: boolean) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ marketing_consent: enabled })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating marketing consent:', error);
        throw error;
      }

      setMarketingConsent(enabled);
    } finally {
      setSaving(false);
    }
  }, [user?.id]);

  return {
    marketingConsent,
    loading,
    saving,
    updateConsent,
  };
}
