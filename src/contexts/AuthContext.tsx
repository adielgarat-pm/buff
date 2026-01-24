import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string, role: 'parent' | 'child', familyCode?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
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
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then((p) => {
          setProfile(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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

    // If joining existing family (child with family code)
    if (familyCode && role === 'child') {
      // familyCode is the family ID - validate it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(familyCode)) {
        // Trust the family code directly since RLS may prevent verification
        familyId = familyCode;
      } else {
        return { error: new Error('Invalid family code format') };
      }
    }

    // If parent or no valid family code, create new family
    if (!familyId && role === 'parent') {
      const { data: newFamily, error: familyError } = await supabase
        .from('families')
        .insert({ name: `${displayName}'s Family` })
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

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const familyId = profile?.family_id ?? null;

  return (
    <AuthContext.Provider value={{ user, session, profile, familyId, loading, signIn, signUp, signOut }}>
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
