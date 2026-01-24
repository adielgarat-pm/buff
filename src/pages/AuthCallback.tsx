import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (session?.user) {
          // Check if user already has a profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!profile) {
            // New Google user - create profile as parent with new family
            const displayName = session.user.user_metadata?.full_name || 
                              session.user.user_metadata?.name ||
                              session.user.email?.split('@')[0] || 
                              'User';

            // Create new family
            const { data: newFamily, error: familyError } = await supabase
              .from('families')
              .insert({ name: `${displayName}'s Family` } as any)
              .select()
              .single();

            if (familyError) {
              console.error('Error creating family:', familyError);
              setError('Failed to create family');
              return;
            }

            // Create profile
            const { error: profileError } = await supabase.from('profiles').insert({
              user_id: session.user.id,
              family_id: newFamily.id,
              display_name: displayName,
              role: 'parent',
            });

            if (profileError) {
              console.error('Error creating profile:', profileError);
              setError('Failed to create profile');
              return;
            }

            // Initialize family data
            await initializeFamilyData(newFamily.id);
          }

          navigate('/dashboard');
        } else {
          navigate('/auth');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed');
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <button 
            onClick={() => navigate('/auth')}
            className="text-primary underline"
          >
            חזור לדף ההתחברות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">מאמת את החשבון...</p>
      </div>
    </div>
  );
}

// Initialize default data for a new family (same as in AuthContext)
async function initializeFamilyData(familyId: string) {
  const DEFAULT_TASKS = [
    { title: 'Morning Meds', time: '08:00', category: 'medication', credits: 5 },
    { title: 'Breakfast', time: '08:30', category: 'nutrition', credits: 15 },
    { title: 'Hydration Check', time: '12:00', category: 'nutrition', credits: 5 },
    { title: 'Homework Check', time: '14:00', category: 'school', credits: 15 },
    { title: 'Study Session', time: '16:00', category: 'school', credits: 30 },
    { title: 'Smart Snack Selection', time: '17:00', category: 'nutrition', credits: 15 },
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

  await supabase.from('tasks').insert(
    DEFAULT_TASKS.map((t) => ({ ...t, family_id: familyId }))
  );

  await supabase.from('store_rewards').insert(
    DEFAULT_STORE_REWARDS.map((r) => ({ ...r, family_id: familyId }))
  );

  await supabase.from('credit_vault').insert({ family_id: familyId, total_balance: 0 });
  await supabase.from('app_settings').insert({ family_id: familyId });
}
