import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EnOnboardingFlow, EnOnboardingData } from '@/components/onboarding/en';
import { toast } from 'sonner';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const handleComplete = async (data: EnOnboardingData) => {
    // Must be authenticated by now (auth step ensures this)
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || user?.id;

    if (!userId) {
      toast.error('Please sign in first.');
      return;
    }

    try {
      // Check existing profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let familyId: string;

      if (existingProfile?.family_id) {
        familyId = existingProfile.family_id;
      } else {
        // Create family
        const displayName = session?.user?.user_metadata?.full_name ||
          session?.user?.user_metadata?.name ||
          session?.user?.email?.split('@')[0] || 'Parent';
        const lang = localStorage.getItem('buff-language') || 'en';
        const familyName = lang === 'he' ? `משפחת ${displayName}` : `${displayName}'s Family`;

        const { data: newFamily, error: familyError } = await supabase
          .from('families')
          .insert({ name: familyName, preferred_language: lang } as any)
          .select()
          .single();

        if (familyError) throw familyError;
        familyId = newFamily.id;

        if (existingProfile) {
          await supabase.from('profiles').update({ family_id: familyId }).eq('id', existingProfile.id);
        } else {
          await supabase.from('profiles').insert({
            user_id: userId,
            family_id: familyId,
            display_name: displayName,
            role: 'parent',
          });
        }
      }

      // Save onboarding data to parent profile
      await supabase.from('profiles').update({
        onboarding_data: {
          en_v2: true,
          childName: data.childName,
          ageGroup: data.ageGroup,
          struggles: data.struggles,
          motivations: data.motivations,
        },
        onboarding_step: 6,
        is_activated: true,
        preferred_language: localStorage.getItem('buff-language') || 'en',
      }).eq('user_id', userId);

      // Create child profile (triggers default tasks/rewards/vault via DB trigger)
      await supabase.from('profiles').insert({
        family_id: familyId,
        display_name: data.childName || 'My Child',
        role: 'child',
        daily_goal: 100,
      });

      // Init family settings
      const { data: existingSettings } = await supabase
        .from('app_settings')
        .select('id')
        .eq('family_id', familyId)
        .maybeSingle();

      if (!existingSettings) {
        await supabase.from('app_settings').insert({ family_id: familyId });
      }

      await refreshProfile(userId);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('[Onboarding] Completion error:', err);
      toast.error('Something went wrong. Please try again.');
    }
  };

  return <EnOnboardingFlow onComplete={handleComplete} skipAuth={!!user} />;
}
