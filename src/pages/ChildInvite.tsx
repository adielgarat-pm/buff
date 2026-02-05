import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Shield, Zap, Crown, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import buffLogo from '@/assets/buff-logo.png';
import { trackRegistrationStep, trackRegistrationError } from '@/hooks/useRegistrationAnalytics';

// Tech grid pattern component
function TechGridBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Dark indigo/black gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(250,50%,8%)] via-[hsl(0,0%,4%)] to-[hsl(250,50%,6%)]" />
      
      {/* Animated grid lines */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(183, 100%, 50%, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(183, 100%, 50%, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'grid-pulse 4s ease-in-out infinite',
        }}
      />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-buff/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Top glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(183, 100%, 50%, 0.15), transparent 70%)',
        }}
      />
    </div>
  );
}

// Loading animation component
function LevelingUpAnimation({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  
  const phases = [
    'מאתחל משימות...',
    'טוען פרסים...',
    'מכין את ה-Vault...',
    'מפעיל את הכוחות!',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return newProgress;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setPhase(prev => (prev + 1) % phases.length);
    }, 600);

    return () => clearInterval(phaseInterval);
  }, [phases.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="text-center space-y-8 px-6 animate-scale-in">
        {/* Glowing icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-accent/30 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-buff-glow-intense">
            <Zap className="w-12 h-12 text-background animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-glow-green">
            Leveling Up...
          </h2>
          <p className="text-lg text-primary animate-pulse">
            {phases[phase]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 mx-auto space-y-2">
          <Progress value={progress} className="h-3 bg-secondary/50" />
          <p className="text-sm text-muted-foreground">{progress}%</p>
        </div>
      </div>
    </div>
  );
}

export default function ChildInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signUp } = useAuth();
  
  // Extract params from URL
  const childName = searchParams.get('name') || '';
  const familyCode = searchParams.get('code') || '';
  
  const [displayName, setDisplayName] = useState(childName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Track page visit
  useEffect(() => {
    trackRegistrationStep('child_invite_visit', { 
      hasName: !!childName, 
      hasCode: !!familyCode 
    });
  }, [childName, familyCode]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Redirect if no family code
  useEffect(() => {
    if (!familyCode) {
      toast.error('קישור לא תקין - חסר קוד משפחה');
      navigate('/auth');
    }
  }, [familyCode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackRegistrationStep('child_invite_submitted', { familyCode });
    
    if (!email || !password || !displayName) {
      toast.error('נא למלא את כל השדות');
      return;
    }

    if (password.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, displayName, 'child', familyCode);
    
    if (error) {
      setLoading(false);
      trackRegistrationError('child_invite_error', error.message, { familyCode });
      if (error.message.includes('already registered')) {
        toast.error('אימייל זה כבר רשום במערכת');
      } else if (error.message.includes('קוד משפחה')) {
        toast.error(error.message);
      } else {
        toast.error(error.message);
      }
    } else {
      trackRegistrationStep('child_invite_success', { familyCode });
      // Show leveling up animation before redirect
      setShowLevelUp(true);
    }
  };

  const handleLevelUpComplete = () => {
    trackRegistrationStep('onboarding_complete', { role: 'child', method: 'magic_link' });
    toast.success('ברוך הבא למשחק! 🎮');
    navigate('/dashboard');
  };

  if (showLevelUp) {
    return <LevelingUpAnimation onComplete={handleLevelUpComplete} />;
  }

  return (
    <div className="min-h-screen theme-child-playful flex items-center justify-center p-4 relative overflow-hidden">
      <TechGridBackground />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo and greeting */}
        <div className="text-center space-y-6">
          {/* Glowing logo */}
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
            <img 
              src={buffLogo} 
              alt="BUFF Logo" 
              className="relative w-full h-full object-contain drop-shadow-[0_0_30px_hsl(183,100%,50%,0.5)]"
            />
          </div>

          {/* Dynamic greeting */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground">
              היי{' '}
              <span className="text-glow-green">{childName || 'גיבור'}</span>
              , 
            </h1>
            <p className="text-2xl font-bold text-primary">
              ה-Buff שלך מחכה בפנים!
            </p>
          </div>

          {/* Subheading */}
          <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
            החשבון שלך מוכן. נשאר רק לבחור סיסמה ולהתחיל לצבור נקודות לפרסים ב-Vault.
          </p>
        </div>

        {/* Gaming icons row */}
        <div className="flex justify-center gap-8">
          <div className="flex flex-col items-center gap-1 text-primary/80">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xs">הגנה</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-accent/80">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-xs">כוח</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-buff/80">
            <div className="w-12 h-12 rounded-xl bg-buff/10 border border-buff/30 flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <span className="text-xs">פרסים</span>
          </div>
        </div>

        {/* Registration form card */}
        <div className="relative rounded-2xl border border-primary/30 bg-card/80 backdrop-blur-sm p-6 space-y-6 shadow-glow">
          {/* Card glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="relative space-y-5">
            {/* Username field */}
            <div className="space-y-2">
              <Label htmlFor="display-name" className="text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                שם המשתמש שלך
              </Label>
              <Input
                id="display-name"
                type="text"
                placeholder="הגיבור שלך"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                className="h-12 text-lg bg-secondary/50 border-primary/30 focus:border-primary/60 rounded-xl"
              />
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                dir="ltr"
                className="h-12 text-lg bg-secondary/50 border-primary/30 focus:border-primary/60 rounded-xl"
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">סיסמה</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                dir="ltr"
                className="h-12 text-lg bg-secondary/50 border-primary/30 focus:border-primary/60 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">לפחות 6 תווים</p>
            </div>

            {/* CTA Button */}
            <Button
              ref={buttonRef}
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-accent to-primary text-background hover:opacity-90 transition-all duration-300 shadow-buff-glow-intense cta-buff-button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  נרשם...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 ml-2" />
                  אני מוכן, בואו נתחיל!
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Family code display */}
        {familyCode && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              קוד משפחה: <code className="text-primary font-mono">{familyCode}</code>
            </p>
          </div>
        )}

        {/* Already have an account link */}
        <div className="text-center">
          <button
            onClick={() => navigate('/auth')}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            כבר יש לך חשבון? <span className="text-primary underline">התחבר</span>
          </button>
        </div>
      </div>

      {/* CSS for grid animation */}
      <style>{`
        @keyframes grid-pulse {
          0%, 100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.25;
          }
        }
      `}</style>
    </div>
  );
}
