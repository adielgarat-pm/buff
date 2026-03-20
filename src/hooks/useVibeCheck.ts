import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type VibeLevel = 1 | 2 | 3 | 4 | 5;

interface VibeCheckState {
  todayVibe: VibeLevel | null;
  lowPowerMode: boolean;
  needsCheck: boolean;
  loading: boolean;
}

export function useVibeCheck(childId?: string) {
  const { profile, familyId } = useAuth();
  const effectiveId = childId || profile?.id;
  const [state, setState] = useState<VibeCheckState>({
    todayVibe: null,
    lowPowerMode: false,
    needsCheck: false,
    loading: true,
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!effectiveId || !familyId) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from('child_vibes' as any)
        .select('*')
        .eq('child_id', effectiveId)
        .eq('date', today)
        .maybeSingle();

      if (data) {
        setState({
          todayVibe: (data as any).vibe_level as VibeLevel,
          lowPowerMode: (data as any).low_power_mode || false,
          needsCheck: false,
          loading: false,
        });
      } else {
        // Check if this is the first launch today
        const lastCheck = localStorage.getItem(`buff-vibe-check-${effectiveId}-${today}`);
        setState({
          todayVibe: null,
          lowPowerMode: false,
          needsCheck: !lastCheck,
          loading: false,
        });
      }
    };

    load();
  }, [effectiveId, familyId, today]);

  const submitVibe = useCallback(async (level: VibeLevel, enableLowPower: boolean = false) => {
    if (!effectiveId || !familyId) return;

    const isLow = level <= 2;

    const { error } = await supabase
      .from('child_vibes' as any)
      .upsert({
        child_id: effectiveId,
        family_id: familyId,
        date: today,
        vibe_level: level,
        vibe_type: 'emoji',
        low_power_mode: enableLowPower && isLow,
        parent_sos_sent: false,
      } as any, { onConflict: 'child_id,date' });

    if (!error) {
      localStorage.setItem(`buff-vibe-check-${effectiveId}-${today}`, Date.now().toString());
      setState({
        todayVibe: level,
        lowPowerMode: enableLowPower && isLow,
        needsCheck: false,
        loading: false,
      });
    }
  }, [effectiveId, familyId, today]);

  const sendParentSOS = useCallback(async () => {
    if (!effectiveId || !familyId) return;

    // Update vibe record
    await supabase
      .from('child_vibes' as any)
      .update({ parent_sos_sent: true } as any)
      .eq('child_id', effectiveId)
      .eq('date', today);

    // Get parent profile for notification
    const { data: parentProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('family_id', familyId)
      .eq('role', 'parent')
      .limit(1)
      .single();

    if (parentProfile) {
      const childName = profile?.display_name || '';
      await supabase.from('notifications').insert({
        family_id: familyId,
        parent_id: parentProfile.id,
        type: 'parent_sos',
        child_id: effectiveId,
        child_name: childName,
        entity_name: 'SOS',
        is_read: false,
      });
    }
  }, [effectiveId, familyId, today, profile]);

  const dismissCheck = useCallback(() => {
    if (effectiveId) {
      localStorage.setItem(`buff-vibe-check-${effectiveId}-${today}`, 'dismissed');
    }
    setState(s => ({ ...s, needsCheck: false }));
  }, [effectiveId, today]);

  const toggleLowPowerMode = useCallback(async (enabled: boolean) => {
    if (!effectiveId || !familyId) return;

    await supabase
      .from('child_vibes' as any)
      .update({ low_power_mode: enabled } as any)
      .eq('child_id', effectiveId)
      .eq('date', today);

    setState(s => ({ ...s, lowPowerMode: enabled }));
  }, [effectiveId, familyId, today]);

  return {
    ...state,
    submitVibe,
    sendParentSOS,
    dismissCheck,
    toggleLowPowerMode,
  };
}
