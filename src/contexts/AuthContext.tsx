import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  family_id: string | null;
  display_name: string;
  role: 'parent' | 'child';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  familyId: string | null;
  familyShortCode: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string, role: 'parent' | 'child', familyCode?: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
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

    const initializeAuth = async () => {
      try {
        // Get existing session first
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession?.user) {
          setSession(existingSession);
          setUser(existingSession.user);
          
          const p = await fetchProfile(existingSession.user.id);
          setProfile(p);
          
          if (p?.family_id) {
            const code = await fetchFamilyShortCode(p.family_id);
            setFamilyShortCode(code);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change:', event);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Only fetch profile on specific events to avoid race conditions
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession?.user && !fetchingProfile.current) {
            // Use setTimeout to defer and avoid Supabase deadlock
            setTimeout(async () => {
              const p = await fetchProfile(newSession.user.id);
              setProfile(p);
              if (p?.family_id) {
                const code = await fetchFamilyShortCode(p.family_id);
                setFamilyShortCode(code);
              }
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setFamilyShortCode(null);
        }
      }
    );

    initializeAuth();

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchFamilyShortCode]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: 'parent' | 'child',
    familyCode?: string
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
      const { data: newFamily, error: familyError } = await supabase
        .from('families')
        .insert({ name: `${displayName}'s Family` } as any)
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Initialize default tasks, settings, etc. for a new family
async function initializeFamilyData(familyId: string) {
  const DEFAULT_TASKS = [
    { title: 'Morning Meds', time: '08:00', category: 'medication', credits: 5 },
    { title: 'Breakfast', time: '08:30', category: 'nutrition', credits: 15 },
    { title: 'Hydration Check', time: '12:00', category: 'nutrition', credits: 5 },
    { title: 'Homework Check', time: '14:00', category: 'school', credits: 15 },
    { title: 'Study Session', time: '16:00', category: 'school', credits: 30 },
    { title: 'Smart Snack Selection', time: '17:00', category: 'nutrition', credits: 15, description: 'I chose one small portion/snack today and stopped there.' },
    { title: 'Shower', time: '20:00', category: 'hygiene', credits: 20 },
    { title: 'Evening Meds', time: '21:00', category: 'medication', credits: 5 },
  ];

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
      { subject: 'Literature', startTime: '12:45' },
      { subject: 'Chemistry / Physics', startTime: '13:35' },
      { subject: 'Chemistry / Physics', startTime: '14:25' },
      { subject: 'Self Study', startTime: '15:15' },
    ],
    monday: [
      { subject: 'Chemistry / Physics', startTime: '08:15' },
      { subject: 'Chemistry / Physics', startTime: '09:05' },
      { subject: 'P.E.', startTime: '10:05' },
      { subject: 'Hebrew Grammar', startTime: '10:55' },
      { subject: 'History', startTime: '11:55' },
      { subject: 'History', startTime: '12:45' },
      { subject: 'Math', startTime: '13:35' },
      { subject: 'Math', startTime: '14:25' },
    ],
    tuesday: [
      { subject: 'English', startTime: '08:15' },
      { subject: 'English', startTime: '09:05' },
      { subject: 'Hebrew Grammar', startTime: '10:05' },
      { subject: 'Math', startTime: '10:55' },
      { subject: 'Bible Studies', startTime: '11:55' },
      { subject: 'English', startTime: '12:45' },
      { subject: 'English', startTime: '13:35' },
    ],
    wednesday: [
      { subject: 'Ramon Program', startTime: '08:15' },
      { subject: 'Ramon Program', startTime: '09:05' },
      { subject: 'Civics', startTime: '10:05' },
      { subject: 'Hebrew Grammar', startTime: '10:55' },
      { subject: 'History', startTime: '11:55' },
      { subject: 'History', startTime: '12:45' },
      { subject: 'English', startTime: '13:35' },
      { subject: 'English', startTime: '14:25' },
    ],
    thursday: [
      { subject: 'Chemistry', startTime: '08:15' },
      { subject: 'English', startTime: '09:05' },
      { subject: 'English', startTime: '10:05' },
      { subject: 'English', startTime: '10:55' },
      { subject: 'Math', startTime: '11:55' },
      { subject: 'Math', startTime: '12:45' },
      { subject: 'Literature', startTime: '13:35' },
      { subject: 'Literature', startTime: '14:25' },
      { subject: 'MUN', startTime: '16:00' },
    ],
  };

  // Insert tasks
  await supabase.from('tasks').insert(
    DEFAULT_TASKS.map((t) => ({ ...t, family_id: familyId }))
  );

  // Insert store rewards
  await supabase.from('store_rewards').insert(
    DEFAULT_STORE_REWARDS.map((r) => ({ ...r, family_id: familyId }))
  );

  // Insert credit vault
  await supabase.from('credit_vault').insert({ family_id: familyId, total_balance: 0 });

  // Insert timetable
  await supabase.from('timetables').insert({ family_id: familyId, data: DEFAULT_TIMETABLE });

  // Insert app settings
  await supabase.from('app_settings').insert({ family_id: familyId });
}
