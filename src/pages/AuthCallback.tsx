import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import buffLogo from '@/assets/buff-logo.png';
import { trackRegistrationStep, trackRegistrationError } from '@/hooks/useRegistrationAnalytics';

type SetupStep = 'loading' | 'role-selection' | 'family-code' | 'creating';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<SetupStep>('loading');
  const [selectedRole, setSelectedRole] = useState<'parent' | 'child' | null>(null);
  const [familyCode, setFamilyCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      trackRegistrationStep('google_auth_callback');
      
      try {
        // Get the session from the URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          trackRegistrationError('signup_error', sessionError.message, { method: 'google' });
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

          if (profile) {
            // Existing user - go to dashboard
            navigate('/dashboard');
          } else {
            // New Google user - show role selection
            const name = session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name ||
                        session.user.email?.split('@')[0] || 
                        'User';
            setDisplayName(name);
            setUserId(session.user.id);
            setStep('role-selection');
          }
        } else {
          navigate('/auth');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        trackRegistrationError('signup_error', 'Authentication failed', { method: 'google' });
        setError('Authentication failed');
      }
    };

    handleCallback();
  }, [navigate]);

  const handleRoleSelect = (role: 'parent' | 'child') => {
    trackRegistrationStep('role_selected', { role, method: 'google' });
    setSelectedRole(role);
    if (role === 'child') {
      setStep('family-code');
    } else {
      handleCreateProfile(role, null);
    }
  };

  const handleJoinFamily = async () => {
    if (!familyCode.trim()) {
      toast.error('אנא הזן קוד משפחה');
      return;
    }
    handleCreateProfile('child', familyCode.trim().toUpperCase());
  };

  const handleCreateProfile = async (role: 'parent' | 'child', code: string | null) => {
    if (!userId) return;
    
    trackRegistrationStep('profile_creation_started', { role, method: 'google' });
    setStep('creating');

    try {
      let familyId: string;

      if (role === 'parent') {
        // Step 1: Create new family first (trigger will auto-generate short_code)
        const { data: newFamily, error: familyError } = await supabase
          .from('families')
          .insert({ name: `${displayName}'s Family` } as any)
          .select()
          .single();

        if (familyError) {
          console.error('Error creating family:', familyError);
          trackRegistrationError('signup_error', 'Error creating family', { role, method: 'google' });
          setError('שגיאה ביצירת משפחה');
          return;
        }

        familyId = newFamily.id;
        trackRegistrationStep('family_created', { familyId, method: 'google' });

        // Step 2: Create profile BEFORE initializing family data
        // This is critical - RLS policies require a profile to exist for data access
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: userId,
          family_id: familyId,
          display_name: displayName,
          role: 'parent',
        });

        if (profileError) {
          console.error('Error creating parent profile:', profileError);
          trackRegistrationError('signup_error', 'Error creating profile', { role: 'parent', method: 'google' });
          setError('שגיאה ביצירת פרופיל');
          return;
        }

        trackRegistrationStep('profile_created', { role: 'parent', method: 'google' });

        // Step 3: Now initialize family data (profile exists, RLS will work)
        await initializeFamilyData(familyId);

        trackRegistrationStep('onboarding_complete', { role: 'parent', method: 'google' });
        toast.success('ברוך הבא! משפחה חדשה נוצרה');
        navigate('/dashboard');
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

        // Create child profile (trigger will auto-create tasks, rewards, vault)
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: userId,
          family_id: familyId,
          display_name: displayName,
          role: 'child',
        });

        if (profileError) {
          console.error('Error creating child profile:', profileError);
          trackRegistrationError('signup_error', 'Error creating profile', { role: 'child', method: 'google' });
          setError('שגיאה ביצירת פרופיל');
          return;
        }

        trackRegistrationStep('profile_created', { role: 'child', method: 'google' });

        // Note: Child data is now auto-created by the create_default_tasks_for_child trigger

        trackRegistrationStep('onboarding_complete', { role: 'child', method: 'google' });
        toast.success('ברוך הבא למשפחה!');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Profile creation error:', err);
      trackRegistrationError('signup_error', 'Profile creation error', { method: 'google' });
      setError('שגיאה ביצירת החשבון');
    }
  };

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

  if (step === 'loading' || step === 'creating') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            {step === 'loading' ? 'מאמת את החשבון...' : 'יוצר את החשבון...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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

// Initialize default data for a new family (same as AuthContext)
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
