import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

interface Profile {
  id: string;
  user_id: string;
  family_id: string | null;
  display_name: string;
  role: 'parent' | 'child';
  is_pro: boolean;
  is_lifetime_access: boolean;
  pro_settings: Record<string, unknown>;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  familyId: string | null;
  familyShortCode: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string, role: 'parent' | 'child', familyCode?: string, marketingConsent?: boolean) => Promise<{ error: Error | null }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  /**
   * Re-fetches the profile from the backend and updates context state.
   * Useful after creating a profile (signup / OAuth role selection) because auth state doesn't change.
   */
  refreshProfile: (userId?: string) => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [familyShortCode, setFamilyShortCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Refs to prevent race conditions
  const isInitialized = useRef(false);
  const fetchingProfile = useRef(false);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile | null;
    } catch (err) {
      console.error('Network error fetching profile:', err);
      return null;
    }
  }, []);

  const fetchFamilyShortCode = useCallback(async (familyId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('short_code')
        .eq('id', familyId)
        .single();

      if (error) {
        console.error('Error fetching family short code:', error);
        return null;
      }
      return data?.short_code ?? null;
    } catch (err) {
      console.error('Network error fetching family code:', err);
      return null;
    }
  }, []);

  // Stable refresh function that doesn't depend on user state
  const refreshProfile = useCallback(
    async (userId?: string): Promise<Profile | null> => {
      const effectiveUserId = userId;
      if (!effectiveUserId) {
        setProfile(null);
        setFamilyShortCode(null);
        return null;
      }

      // Prevent concurrent fetches
      if (fetchingProfile.current) {
        return profile;
      }
      fetchingProfile.current = true;

      try {
        const p = await fetchProfile(effectiveUserId);
        setProfile(p);

        if (p?.family_id) {
          const code = await fetchFamilyShortCode(p.family_id);
          setFamilyShortCode(code);
        } else {
          setFamilyShortCode(null);
        }

        return p;
      } finally {
        fetchingProfile.current = false;
      }
    },
    [fetchFamilyShortCode, fetchProfile, profile]
  );

  // Initial auth setup - runs only once
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Get existing session first
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (existingSession?.user) {
          setSession(existingSession);
          setUser(existingSession.user);
          
          const p = await fetchProfile(existingSession.user.id);
          if (!isMounted) return;
          
          setProfile(p);
          
          if (p?.family_id) {
            const code = await fetchFamilyShortCode(p.family_id);
            if (isMounted) setFamilyShortCode(code);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state change:', event);
        
        if (!isMounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Handle sign out immediately
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setFamilyShortCode(null);
          setLoading(false);
          return;
        }

        // For SIGNED_IN or TOKEN_REFRESHED, fetch profile
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
          if (!fetchingProfile.current) {
            // Use setTimeout to defer and avoid Supabase deadlock
            setTimeout(async () => {
              if (!isMounted || fetchingProfile.current) return;
              fetchingProfile.current = true;
              
              try {
                const p = await fetchProfile(newSession.user.id);
                if (!isMounted) return;
                
                setProfile(p);
                if (p?.family_id) {
                  const code = await fetchFamilyShortCode(p.family_id);
                  if (isMounted) setFamilyShortCode(code);
                }
              } finally {
                fetchingProfile.current = false;
                if (isMounted) setLoading(false);
              }
            }, 0);
          }
        }
      }
    );

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchFamilyShortCode]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    const redirectUrl = redirectTo || `${window.location.origin}/auth/callback`;

    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: redirectUrl,
    });
    return { error: result.error ? (result.error instanceof Error ? result.error : new Error(String(result.error))) : null };
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: 'parent' | 'child',
    familyCode?: string,
    marketingConsent?: boolean
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });

    if (authError) return { error: authError };
    if (!authData.user) return { error: new Error('Signup failed') };

    let familyId: string | null = null;

    // If joining existing family (child with family code - now 6-char short code)
    if (familyCode && role === 'child') {
      const trimmedCode = familyCode.trim().toUpperCase();
      
      // Validate it's a 6-character alphanumeric code
      const shortCodeRegex = /^[A-Z0-9]{6}$/;
      if (shortCodeRegex.test(trimmedCode)) {
        // Look up family by short_code
        const { data: family, error: lookupError } = await supabase
          .from('families')
          .select('id')
          .eq('short_code', trimmedCode)
          .single();

        if (lookupError || !family) {
          return { error: new Error('קוד משפחה לא נמצא') };
        }
        familyId = family.id;
      } else {
        return { error: new Error('קוד משפחה חייב להכיל 6 תווים') };
      }
    }

    // If parent, create new family (short_code is auto-generated by trigger)
    if (!familyId && role === 'parent') {
      const lang = (typeof window !== 'undefined' ? localStorage.getItem('buff-language') : null) || 'en';
      const familyName = lang === 'he' ? `משפחת ${displayName}` : `${displayName}'s Family`;
      const { data: newFamily, error: familyError } = await supabase
        .from('families')
        .insert({ name: familyName, preferred_language: lang } as any)
        .select()
        .single();

      if (familyError) return { error: familyError };
      familyId = newFamily.id;
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: authData.user.id,
      family_id: familyId,
      display_name: displayName,
      role,
      marketing_consent: marketingConsent ?? false,
    });

    if (profileError) return { error: profileError };

    // If new family, initialize default data
    if (familyId && role === 'parent') {
      await initializeFamilyData(familyId);
    }

    // Auth state doesn't change after creating a profile, so we must refresh it manually
    await refreshProfile(authData.user.id);

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setFamilyShortCode(null);
  };

  const familyId = profile?.family_id ?? null;

  return (
    <AuthContext.Provider value={{ user, session, profile, familyId, familyShortCode, loading, signIn, signUp, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Initialize default family settings for a new family.
// NOTE: Tasks, rewards, and credit vault are created by the DB trigger
// `create_default_tasks_for_child` when a child profile is inserted.
// We only create family-level settings here to avoid orphaned/duplicate data.
async function initializeFamilyData(familyId: string) {
  // Insert app settings (family-level, not child-level)
  await supabase.from('app_settings').insert({ family_id: familyId });
}
