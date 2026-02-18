import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { translations, type Language } from '@/contexts/LanguageContext';
import { Loader2, Users, User, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import buffLogo from '@/assets/buff-logo.png';
import { trackRegistrationStep, trackRegistrationError } from '@/hooks/useRegistrationAnalytics';
import { ParentOnboarding, OnboardingData } from '@/components/onboarding';
import { V2OnboardingFlow } from '@/components/onboarding/v2';
import { EnOnboardingFlow, EnOnboardingData } from '@/components/onboarding/en';

type SetupStep = 'loading' | 'role-selection' | 'parent-onboarding' | 'family-code' | 'creating' | 'error';

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<SetupStep>('loading');
  const [selectedRole, setSelectedRole] = useState<'parent' | 'child' | null>(null);
  const [familyCode, setFamilyCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showRescueButton, setShowRescueButton] = useState(false);
  
  // Prevent double initialization
  const hasInitialized = useRef(false);
  // Use a cross-platform timeout type (NodeJS types are not available in browser-only tsconfig)
  const rescueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * SEQUENTIAL GUARD LOGIC:
   * 1. IF no profile exists -> Create Profile + Generate new family_id (for parent) or use existing (child)
   * 2. IF profile exists but family_id is null -> Generate and update a new family_id
   * 3. IF family_id exists but zero children are found -> Redirect to dashboard (parent will add children there)
   * 4. IF everything is found -> Redirect to /dashboard
   */
  const runSequentialGuard = async (userId: string, existingProfile: any): Promise<'needs-role-selection' | 'needs-family' | 'complete'> => {
    // Guard 1: No profile exists
    if (!existingProfile) {
      console.log('[Guard] No profile - needs role selection');
      return 'needs-role-selection';
    }

    // Guard 2: Profile exists but no family_id
    if (!existingProfile.family_id) {
      console.log('[Guard] Profile exists but no family_id');
      
      // Only parents can create families - children need to join one
      if (existingProfile.role === 'parent') {
        // Create a new family and update the profile
        try {
          const { data: newFamily, error: familyError } = await supabase
            .from('families')
            .insert({ name: `${existingProfile.display_name}'s Family`, preferred_language: localStorage.getItem('buff-language') || 'en' } as any)
            .select()
            .single();

          if (familyError) throw familyError;

          // Update profile with new family_id
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ family_id: newFamily.id })
            .eq('id', existingProfile.id);

          if (updateError) throw updateError;

          // Initialize family data
          await initializeFamilyData(newFamily.id);
          
          // Refresh profile
          await refreshProfile(userId);
          
          console.log('[Guard] Created family for orphaned parent profile');
          return 'complete';
        } catch (err) {
          console.error('[Guard] Failed to create family:', err);
          return 'needs-family';
        }
      } else {
        // Child without family - this shouldn't happen but handle gracefully
        console.log('[Guard] Child without family - needs family code');
        return 'needs-family';
      }
    }

    // Guard 3 & 4: Profile exists with family_id - we're complete
    console.log('[Guard] Profile complete with family_id:', existingProfile.family_id);
    return 'complete';
  };

  const handleCallback = async (retryCount = 0) => {
    trackRegistrationStep('google_auth_callback');
    
    // Start rescue timer
    rescueTimerRef.current = setTimeout(() => {
      setShowRescueButton(true);
    }, 5000);
    
    try {
      // Get the session with retry logic
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        // Network errors - retry up to 3 times
        if (retryCount < 3 && sessionError.message?.includes('fetch')) {
          console.log(`Retrying session fetch (attempt ${retryCount + 1})...`);
          await wait(1000 * (retryCount + 1));
          return handleCallback(retryCount + 1);
        }
        
        trackRegistrationError('signup_error', sessionError.message, { method: 'google' });
        setError(sessionError.message);
        setStep('error');
        return;
      }

      if (!session?.user) {
        // No session - redirect to auth page
        console.log('No session found, redirecting to auth');
        navigate('/auth', { replace: true });
        return;
      }

      const currentUserId = session.user.id;

      // Check if profile exists with retry logic
      let existingProfile = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          existingProfile = await refreshProfile(currentUserId);
          break; // Success - exit retry loop
        } catch (profileErr) {
          console.log(`Profile fetch attempt ${attempt + 1} failed:`, profileErr);
          if (attempt < 2) await wait(1000);
        }
      }

      // Run sequential guard logic
      const guardResult = await runSequentialGuard(currentUserId, existingProfile);

      // Clear rescue timer if we got a result
      if (rescueTimerRef.current) {
        clearTimeout(rescueTimerRef.current);
      }

      switch (guardResult) {
        case 'complete':
          navigate('/dashboard', { replace: true });
          return;
        
        case 'needs-family':
          // Show family code entry (for orphaned children)
          setUserId(currentUserId);
          setDisplayName(existingProfile?.display_name || session.user.email?.split('@')[0] || 'User');
          setStep('family-code');
          return;
        
        case 'needs-role-selection': {
          // New user - show role selection
          const name = session.user.user_metadata?.full_name || 
                      session.user.user_metadata?.name ||
                      session.user.email?.split('@')[0] || 
                      'User';
          setDisplayName(name);
          setUserId(currentUserId);
          // English users skip the Hebrew role-selection screen and go straight to EnOnboardingFlow
          const lang = localStorage.getItem('buff-language') || 'en';
          if (lang !== 'he') {
            setStep('parent-onboarding');
          } else {
            setStep('role-selection');
          }
          return;
        }
      }
      
    } catch (err) {
      console.error('Auth callback error:', err);
      
      // Clear rescue timer on error
      if (rescueTimerRef.current) {
        clearTimeout(rescueTimerRef.current);
      }
      
      // Network error - allow retry
      if (err instanceof Error && err.message?.includes('fetch')) {
        setError('בעיית רשת. אנא נסה שוב.');
        setStep('error');
        return;
      }
      
      trackRegistrationError('signup_error', 'Authentication failed', { method: 'google' });
      setError('שגיאה באימות. אנא נסה שוב.');
      setStep('error');
    }
  };

  // Rescue function - re-triggers the entire flow
  const handleRescue = async () => {
    console.log('[Rescue] User clicked rescue button');
    setShowRescueButton(false);
    setIsRetrying(true);
    
    try {
      // Get fresh session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/auth', { replace: true });
        return;
      }

      // Force refresh profile
      const profile = await refreshProfile(session.user.id);
      
      // Run guard logic again
      const guardResult = await runSequentialGuard(session.user.id, profile);
      
      switch (guardResult) {
        case 'complete':
          navigate('/dashboard', { replace: true });
          return;
        
        case 'needs-family':
          setUserId(session.user.id);
          setDisplayName(profile?.display_name || 'User');
          setStep('family-code');
          return;
        
        case 'needs-role-selection': {
          const name = session.user.user_metadata?.full_name || 
                      session.user.user_metadata?.name ||
                      session.user.email?.split('@')[0] || 
                      'User';
          setDisplayName(name);
          setUserId(session.user.id);
          const lang2 = localStorage.getItem('buff-language') || 'en';
          if (lang2 !== 'he') {
            setStep('parent-onboarding');
          } else {
            setStep('role-selection');
          }
          return;
        }
      }
    } catch (err) {
      console.error('[Rescue] Error:', err);
      setError('שגיאה בריענון הפרופיל');
      setStep('error');
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    // Prevent double initialization
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    handleCallback();
    
    // Cleanup rescue timer
    return () => {
      if (rescueTimerRef.current) {
        clearTimeout(rescueTimerRef.current);
      }
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    setStep('loading');
    setShowRescueButton(false);
    hasInitialized.current = false;
    
    await handleCallback();
    setIsRetrying(false);
  };

  const handleRoleSelect = async (role: 'parent' | 'child') => {
    trackRegistrationStep('role_selected', { role, method: 'google' });
    setSelectedRole(role);
    if (role === 'child') {
      setStep('family-code');
    } else {
      // For parents: Create family and profile FIRST so family code is available in Step 6
      await ensureParentFamilyExists();
      setStep('parent-onboarding');
    }
  };

  // Create parent profile and family upfront so family code is available during onboarding
  const ensureParentFamilyExists = async () => {
    if (!userId) return;

    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, family_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingProfile?.family_id) {
        // Already has family, just refresh profile
        await refreshProfile(userId);
        return;
      }

      // Create new family
      const lang = localStorage.getItem('buff-language') || 'en';
      const familyName = lang === 'he' ? `משפחת ${displayName}` : `${displayName}'s Family`;
      const { data: newFamily, error: familyError } = await supabase
        .from('families')
        .insert({ name: familyName, preferred_language: lang } as any)
        .select()
        .single();

      if (familyError) {
        console.error('Error creating family during role select:', familyError);
        return;
      }

      if (existingProfile) {
        // Update existing profile with family_id
        await supabase
          .from('profiles')
          .update({ family_id: newFamily.id })
          .eq('id', existingProfile.id);
      } else {
        // Create new parent profile
        await supabase.from('profiles').insert({
          user_id: userId,
          family_id: newFamily.id,
          display_name: displayName,
          role: 'parent',
        });
      }

      // Refresh profile in context so Step6 can access family_id
      await refreshProfile(userId);
      console.log('[EnsureFamily] Created family and parent profile, code:', newFamily.short_code);
    } catch (err) {
      console.error('Error ensuring parent family exists:', err);
    }
  };

  // Handle parent onboarding completion
  const handleOnboardingComplete = async (onboardingData: OnboardingData) => {
    if (!userId) {
      setError('לא נמצא מזהה משתמש');
      setStep('error');
      return;
    }

    trackRegistrationStep('profile_creation_started', { role: 'parent', method: 'google', hasOnboarding: true });
    setStep('creating');

    try {
      // First check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let familyId: string;

      // Check if we already have a family
      if (existingProfile?.family_id) {
        familyId = existingProfile.family_id;
      } else {
        // Create new family
        const lang = localStorage.getItem('buff-language') || 'en';
        const familyName = lang === 'he' ? `משפחת ${displayName}` : `${displayName}'s Family`;
        const { data: newFamily, error: familyError } = await supabase
          .from('families')
          .insert({ name: familyName, preferred_language: lang } as any)
          .select()
          .single();

        if (familyError) {
          console.error('Error creating family:', familyError);
          setError(`שגיאה ביצירת משפחה: ${familyError.message}`);
          setStep('error');
          return;
        }

        familyId = newFamily.id;
        trackRegistrationStep('family_created', { familyId, method: 'google' });
      }

      // UPSERT parent profile
      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            family_id: familyId,
            ...(existingProfile.display_name ? {} : { display_name: displayName })
          })
          .eq('id', existingProfile.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          setError(`שגיאה בעדכון פרופיל: ${updateError.message}`);
          setStep('error');
          return;
        }
      } else {
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: userId,
          family_id: familyId,
          display_name: displayName,
          role: 'parent',
        });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          setError(`שגיאה ביצירת פרופיל: ${profileError.message}`);
          setStep('error');
          return;
        }
      }

      // Create child profile with onboarding data
      const { data: childProfile, error: childError } = await supabase
        .from('profiles')
        .insert({
          family_id: familyId,
          display_name: onboardingData.childName,
          role: 'child',
          birth_date: formatBirthDate(onboardingData.birthDate),
          school_quest_enabled: onboardingData.schoolFeature === 'school_quest',
          daily_goal: 100,
        })
        .select()
        .single();

      if (childError) {
        console.error('Error creating child profile:', childError);
        // Non-critical - continue anyway
      }

      // Create pack tasks from selected starter pack
      if (childProfile) {
        try {
          const { PACK_DEFINITIONS } = await import('@/data/starterPacks');
          const packDef = PACK_DEFINITIONS[onboardingData.schoolFeature as keyof typeof PACK_DEFINITIONS];

          if (packDef?.tasks?.length) {
            const packTasks = packDef.tasks.map((task) => ({
              family_id: familyId,
              assigned_to: childProfile.id,
              title: (() => {
                const lang = (localStorage.getItem('buff-language') || 'en') as Language;
                return translations[lang]?.[task.titleKey] || task.titleKey.replace('pack.task.', '').replace(/_/g, ' ');
              })(),
              category: task.category,
              time: task.time,
              credits: task.credits,
              icon: task.icon,
            }));
            await supabase.from('tasks').insert(packTasks);
          }

          // Also add the custom first task
          if (onboardingData.firstTask) {
            await supabase.from('tasks').insert({
              family_id: familyId,
              assigned_to: childProfile.id,
              title: onboardingData.firstTask,
              category: getFocusAreaCategory(onboardingData.focusArea),
              time: '15:00',
              credits: 15,
              icon: getFocusAreaEmoji(onboardingData.focusArea),
            });
          }
        } catch (taskErr) {
          console.error('Error creating pack tasks:', taskErr);
        }
      }

      // Create weekend reward from onboarding
      if (childProfile && onboardingData.weekendReward) {
        try {
          await supabase.from('store_rewards').insert({
            family_id: familyId,
            assigned_to: childProfile.id,
            title: onboardingData.weekendReward,
            emoji: '🎁',
            price: 500,
          });
        } catch (rewardErr) {
          console.error('Error creating weekend reward:', rewardErr);
        }
      }

      trackRegistrationStep('profile_created', { role: 'parent', method: 'google' });

      // Refresh profile in context
      await refreshProfile(userId);

      // Initialize family data
      try {
        await initializeFamilyDataSafe(familyId);
      } catch (initErr) {
        console.error('Error initializing family data:', initErr);
      }

      trackRegistrationStep('onboarding_complete', { role: 'parent', method: 'google' });
      toast.success('ברוך הבא! המשפחה נוצרה בהצלחה 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Onboarding completion error:', err);
      setError('שגיאה ביצירת החשבון');
      setStep('error');
    }
  };

  // Helper functions for onboarding data
  function formatBirthDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getFocusAreaCategory(focusArea: string): string {
    switch (focusArea) {
      case 'homework': return 'learning';
      case 'project': return 'learning';
      case 'fitness': return 'movement';
      case 'home': return 'organization';
      default: return 'learning';
    }
  }

  function getFocusAreaEmoji(focusArea: string): string {
    switch (focusArea) {
      case 'homework': return '📚';
      case 'project': return '🚀';
      case 'fitness': return '⚡';
      case 'home': return '🏠';
      default: return '✨';
    }
  }

  /** Handle completion of the new English onboarding flow */
  const handleEnOnboardingComplete = async (enData: EnOnboardingData) => {
    if (!userId) {
      setError('User ID not found');
      setStep('error');
      return;
    }

    trackRegistrationStep('profile_creation_started', { role: 'parent', method: 'google', flow: 'en_v2' });
    setStep('creating');

    try {
      // Ensure parent profile + family exist (idempotent)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let familyId: string;

      if (existingProfile?.family_id) {
        familyId = existingProfile.family_id;
      } else {
        const { data: newFamily, error: familyError } = await supabase
          .from('families')
          .insert({ name: `${displayName}'s Family`, preferred_language: 'en' } as any)
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

      // Save onboarding quiz data to parent profile
      await supabase.from('profiles').update({
        onboarding_data: {
          en_v2: true,
          childName: enData.childName,
          ageGroup: enData.ageGroup,
          struggles: enData.struggles,
          motivations: enData.motivations,
        },
        onboarding_step: 6,
        is_activated: true,
        preferred_language: 'en',
      }).eq('user_id', userId);

      // Create child profile (triggers default tasks/rewards/vault via DB trigger)
      await supabase.from('profiles').insert({
        family_id: familyId,
        display_name: enData.childName || 'My Child',
        role: 'child',
        daily_goal: 100,
      });

      // Initialize family settings (idempotent)
      await initializeFamilyDataSafe(familyId);

      await refreshProfile(userId);
      trackRegistrationStep('onboarding_complete', { role: 'parent', method: 'google', flow: 'en_v2' });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('[EnOnboarding] Completion error:', err);
      setError('Something went wrong. Please try again.');
      setStep('error');
    }
  };

  const handleJoinFamily = async () => {
    if (!familyCode.trim()) {
      toast.error('אנא הזן קוד משפחה');
      return;
    }
    handleCreateProfile('child', familyCode.trim().toUpperCase());
  };

  /**
   * UPSERT LOGIC: Create or update profile safely
   * - Uses INSERT with ON CONFLICT DO UPDATE behavior via separate check
   * - Never deletes existing data
   * - Only updates missing fields
   */
  const handleCreateProfile = async (role: 'parent' | 'child', code: string | null) => {
    if (!userId) {
      setError('לא נמצא מזהה משתמש');
      setStep('error');
      return;
    }
    
    trackRegistrationStep('profile_creation_started', { role, method: 'google' });
    setStep('creating');

    try {
      // First check if profile already exists (UPSERT safety check)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let familyId: string;

      if (role === 'parent') {
        // Check if we already have a family (from incomplete previous attempt)
        if (existingProfile?.family_id) {
          familyId = existingProfile.family_id;
          console.log('[UPSERT] Using existing family:', familyId);
        } else {
          // Create new family
          const emailLang = localStorage.getItem('buff-language') || 'en';
          const emailFamilyName = emailLang === 'he' ? `משפחת ${displayName}` : `${displayName}'s Family`;
          const { data: newFamily, error: familyError } = await supabase
            .from('families')
            .insert({ name: emailFamilyName, preferred_language: emailLang } as any)
            .select()
            .single();

          if (familyError) {
            console.error('Error creating family:', familyError);
            trackRegistrationError('signup_error', `Error creating family: ${familyError.message}`, { role, method: 'google' });
            setError(`שגיאה ביצירת משפחה: ${familyError.message}`);
            setStep('error');
            return;
          }

          familyId = newFamily.id;
          trackRegistrationStep('family_created', { familyId, method: 'google' });
        }

        // UPSERT profile: update if exists, insert if not
        if (existingProfile) {
          // Update existing profile with family_id (don't overwrite other fields)
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              family_id: familyId,
              // Only update display_name if it's empty
              ...(existingProfile.display_name ? {} : { display_name: displayName })
            })
            .eq('id', existingProfile.id);

          if (updateError) {
            console.error('Error updating profile:', updateError);
            setError(`שגיאה בעדכון פרופיל: ${updateError.message}`);
            setStep('error');
            return;
          }
          console.log('[UPSERT] Updated existing profile');
        } else {
          // Insert new profile
          const { error: profileError } = await supabase.from('profiles').insert({
            user_id: userId,
            family_id: familyId,
            display_name: displayName,
            role: 'parent',
          });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            trackRegistrationError('signup_error', `Error creating profile: ${profileError.message}`, { role: 'parent', method: 'google' });
            setError(`שגיאה ביצירת פרופיל: ${profileError.message}`);
            setStep('error');
            return;
          }
          console.log('[UPSERT] Created new profile');
        }

        trackRegistrationStep('profile_created', { role: 'parent', method: 'google' });

        // Refresh profile in context
        await refreshProfile(userId);

        // Initialize family data (idempotent - won't duplicate)
        try {
          await initializeFamilyDataSafe(familyId);
        } catch (initErr) {
          console.error('Error initializing family data (non-critical):', initErr);
        }

        trackRegistrationStep('onboarding_complete', { role: 'parent', method: 'google' });
        toast.success('ברוך הבא! משפחה חדשה נוצרה');
        navigate('/dashboard', { replace: true });
        return;

      } else {
        // Child flow: Find family by code
        const { data: family, error: familyError } = await supabase
          .from('families')
          .select('*')
          .eq('short_code', code)
          .maybeSingle();

        if (familyError || !family) {
          trackRegistrationError('signup_error', 'Invalid family code', { role: 'child', method: 'google' });
          toast.error('קוד משפחה לא תקין');
          setStep('family-code');
          return;
        }

        familyId = family.id;
        trackRegistrationStep('family_joined', { familyId, method: 'google' });

        // UPSERT child profile
        if (existingProfile) {
          // Update existing profile with family_id
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              family_id: familyId,
              role: 'child',
              ...(existingProfile.display_name ? {} : { display_name: displayName })
            })
            .eq('id', existingProfile.id);

          if (updateError) {
            console.error('Error updating child profile:', updateError);
            setError(`שגיאה בעדכון פרופיל: ${updateError.message}`);
            setStep('error');
            return;
          }
          console.log('[UPSERT] Updated existing child profile');
        } else {
          // Insert new child profile (trigger will auto-create tasks, rewards, vault)
          const { error: profileError } = await supabase.from('profiles').insert({
            user_id: userId,
            family_id: familyId,
            display_name: displayName,
            role: 'child',
          });

          if (profileError) {
            console.error('Error creating child profile:', profileError);
            trackRegistrationError('signup_error', `Error creating profile: ${profileError.message}`, { role: 'child', method: 'google' });
            setError(`שגיאה ביצירת פרופיל: ${profileError.message}`);
            setStep('error');
            return;
          }
          console.log('[UPSERT] Created new child profile');
        }

        trackRegistrationStep('profile_created', { role: 'child', method: 'google' });

        // Refresh profile in context
        await refreshProfile(userId);

        trackRegistrationStep('onboarding_complete', { role: 'child', method: 'google' });
        toast.success('ברוך הבא למשפחה!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Profile creation error:', err);
      trackRegistrationError('signup_error', 'Profile creation error', { method: 'google' });
      setError('שגיאה ביצירת החשבון');
      setStep('error');
    }
  };

  // Error state with retry option
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <p className="text-destructive font-medium">{error || 'אירעה שגיאה'}</p>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full"
                >
                  {isRetrying ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 ml-2" />
                  )}
                  נסה שוב
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/auth', { replace: true })}
                  className="w-full"
                >
                  חזור לדף ההתחברות
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'loading' || step === 'creating') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            {step === 'loading' ? 'מאמת את החשבון...' : 'יוצר את החשבון...'}
          </p>
          
          {/* Rescue Button - appears after 5 seconds */}
          {showRescueButton && (
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                נתקעת? לחץ כאן לרענן
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRescue}
                disabled={isRetrying}
                className="gap-2"
              >
                {isRetrying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                רענן פרופיל
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Parent onboarding flow
  if (step === 'parent-onboarding') {
    const lang = localStorage.getItem('buff-language');
    const browserIsHebrew = navigator.language?.startsWith('he');

    console.log('🧭 Onboarding Trigger Check:', {
      lang,
      browserIsHebrew,
      navigatorLanguage: navigator.language,
      userId,
      displayName,
    });

    // Show new English flow for EVERYONE by default.
    // The old Hebrew V2 flow is only shown if the user has EXPLICITLY
    // set the language to Hebrew inside the app (via a dedicated language
    // selection action — not just because their browser is in Hebrew).
    // We detect "explicit" by checking a separate key set only by the
    // in-app language selector.
    const explicitlySetHebrew = localStorage.getItem('buff-language-explicit') === 'he';

    if (explicitlySetHebrew) {
      console.log('🇮🇱 Routing to Hebrew V2 flow (explicit preference)');
      return (
        <V2OnboardingFlow onComplete={() => navigate('/dashboard', { replace: true })} />
      );
    }

    // Default → new Cal AI–style English flow (covers English AND Hebrew browser users)
    console.log('🇺🇸 Routing to new English onboarding flow');
    return (
      <EnOnboardingFlow onComplete={handleEnOnboardingComplete} />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-buff/5 pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-2xl rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex flex-col items-center gap-2 mb-2">
            <img 
              src={buffLogo} 
              alt="BUFF Logo" 
              className="h-16 w-16 object-contain"
            />
            <CardTitle className="text-2xl font-display font-bold tracking-wide text-primary">
              ברוך הבא ל-BUFF!
            </CardTitle>
          </div>
          <CardDescription>
            {step === 'role-selection' 
              ? 'איך תרצה להשתמש באפליקציה?'
              : 'הזן את קוד המשפחה שקיבלת מההורה'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'role-selection' && (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  היי {displayName}! 👋
                </p>
              </div>
              
              <div className="grid gap-4">
                <Button
                  onClick={() => handleRoleSelect('parent')}
                  variant="outline"
                  className="h-24 rounded-2xl flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
                >
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-semibold">אני הורה</p>
                    <p className="text-xs text-muted-foreground">יצירת משפחה חדשה</p>
                  </div>
                </Button>
                
                <Button
                  onClick={() => handleRoleSelect('child')}
                  variant="outline"
                  className="h-24 rounded-2xl flex flex-col gap-2 hover:border-accent hover:bg-accent/5"
                >
                  <User className="w-8 h-8 text-accent" />
                  <div>
                    <p className="font-semibold">אני נער/ה</p>
                    <p className="text-xs text-muted-foreground">הצטרפות למשפחה קיימת</p>
                  </div>
                </Button>
              </div>
            </>
          )}

          {step === 'family-code' && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="family-code">קוד משפחה</Label>
                  <Input
                    id="family-code"
                    type="text"
                    placeholder="XXXXXX"
                    value={familyCode}
                    onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                    className="text-center text-lg tracking-widest font-mono"
                    dir="ltr"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    בקש מההורה שלך את קוד המשפחה
                  </p>
                </div>

                <Button 
                  onClick={handleJoinFamily}
                  className="w-full rounded-2xl"
                  disabled={familyCode.length < 6}
                >
                  <Zap className="w-4 h-4 ml-2" />
                  הצטרף למשפחה
                </Button>

                <Button 
                  variant="ghost"
                  onClick={() => setStep('role-selection')}
                  className="w-full"
                >
                  חזור
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Initialize default data for a new family - SAFE version
 * Uses individual try/catch for each operation to prevent partial failures
 * Checks for existing data before inserting (idempotent)
 */
async function initializeFamilyDataSafe(familyId: string) {
  // Check if data already exists
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('family_id', familyId)
    .limit(1);

  // Skip if family already has data
  if (existingTasks && existingTasks.length > 0) {
    console.log('[InitFamilyData] Family already has data, skipping');
    return;
  }

  const DEFAULT_STORE_REWARDS = [
    { title: 'Space Session', emoji: '🚀', price: 5000 },
    { title: 'New Game', emoji: '🎮', price: 4000 },
    { title: 'Pocket Money', emoji: '💰', price: 2000 },
    { title: 'Pizza Night', emoji: '🍕', price: 1500 },
    { title: 'Home Movie', emoji: '🎬', price: 750 },
  ];

  const DEFAULT_TIMETABLE = {
    sunday: [
      { subject: 'Math', startTime: '08:15' },
      { subject: 'Math', startTime: '09:05' },
      { subject: 'Math', startTime: '10:05' },
      { subject: 'Bible Studies', startTime: '10:55' },
      { subject: 'Literature', startTime: '11:55' },
    ],
    monday: [
      { subject: 'Chemistry / Physics', startTime: '08:15' },
      { subject: 'Chemistry / Physics', startTime: '09:05' },
      { subject: 'P.E.', startTime: '10:05' },
      { subject: 'Hebrew Grammar', startTime: '10:55' },
      { subject: 'History', startTime: '11:55' },
    ],
    tuesday: [
      { subject: 'English', startTime: '08:15' },
      { subject: 'English', startTime: '09:05' },
      { subject: 'Hebrew Grammar', startTime: '10:05' },
      { subject: 'Math', startTime: '10:55' },
      { subject: 'Bible Studies', startTime: '11:55' },
    ],
    wednesday: [
      { subject: 'Ramon Program', startTime: '08:15' },
      { subject: 'Ramon Program', startTime: '09:05' },
      { subject: 'Civics', startTime: '10:05' },
      { subject: 'Hebrew Grammar', startTime: '10:55' },
      { subject: 'History', startTime: '11:55' },
    ],
    thursday: [
      { subject: 'Chemistry', startTime: '08:15' },
      { subject: 'English', startTime: '09:05' },
      { subject: 'English', startTime: '10:05' },
      { subject: 'English', startTime: '10:55' },
      { subject: 'Math', startTime: '11:55' },
    ],
  };

  // Insert store rewards (non-critical)
  try {
    await supabase.from('store_rewards').insert(
      DEFAULT_STORE_REWARDS.map((r) => ({ ...r, family_id: familyId }))
    );
  } catch (err) {
    console.error('Failed to insert store rewards:', err);
  }

  // Insert timetable (non-critical)
  try {
    await supabase.from('timetables').insert({ family_id: familyId, data: DEFAULT_TIMETABLE });
  } catch (err) {
    console.error('Failed to insert timetable:', err);
  }

  // Insert app settings (non-critical)
  try {
    await supabase.from('app_settings').insert({ family_id: familyId });
  } catch (err) {
    console.error('Failed to insert app settings:', err);
  }

  console.log('[InitFamilyData] Family data initialized successfully');
}

// Keep for backward compatibility
async function initializeFamilyData(familyId: string) {
  return initializeFamilyDataSafe(familyId);
}
