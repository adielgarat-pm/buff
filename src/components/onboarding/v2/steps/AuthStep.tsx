import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LegalDisclaimerLink } from '@/components/LegalDisclaimer';
import type { V2QuizData } from '../V2OnboardingFlow';

interface AuthStepProps {
  data: V2QuizData;
  onComplete: () => void;
  onBack: () => void;
}

export function AuthStep({ data, onComplete, onBack }: AuthStepProps) {
  const { t, isRTL } = useLanguage();
  const { signUp, signInWithGoogle, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      toast.error(t('auth.fillAllFields'));
      return;
    }
    if (password.length < 6) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up as parent
      const { error } = await signUp(email, password, displayName, 'parent', undefined, marketingConsent);
      if (error) {
        toast.error(error.message);
        return;
      }

      // 2. Save V2 quiz data to the newly created profile
      await saveV2QuizData(data);
      
      toast.success(t('auth.accountCreated'));
      onComplete();
    } catch (err) {
      console.error('V2 signup error:', err);
      toast.error(t('familyCode.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    // Store quiz data in localStorage so AuthCallback can pick it up
    localStorage.setItem('v2_quiz_data', JSON.stringify(data));
    
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
    // User will be redirected to AuthCallback which handles the rest
  };

  return (
    <div className="flex flex-col gap-5 pt-4 max-w-sm mx-auto">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors self-start">
        <BackIcon className="w-4 h-4" />
        {t('v2.back')}
      </button>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">{t('v2.authTitle')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('v2.authDesc').replace('{name}', data.childName)}
        </p>
      </div>

      {/* Google button */}
      <Button
        variant="outline"
        className="w-full rounded-2xl h-12"
        onClick={handleGoogleSignup}
        disabled={loading}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {t('auth.signupWithGoogle')}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
        </div>
      </div>

      {/* Email form */}
      <form onSubmit={handleEmailSignup} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="v2-name" className="text-xs">{t('auth.displayName')}</Label>
          <Input
            id="v2-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('auth.yourName')}
            disabled={loading}
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="v2-email" className="text-xs">{t('auth.email')}</Label>
          <Input
            id="v2-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
            dir="ltr"
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="v2-password" className="text-xs">{t('auth.password')}</Label>
          <Input
            id="v2-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            dir="ltr"
            className="h-10 rounded-xl"
          />
        </div>

        {/* Marketing consent */}
        <div className="flex items-start gap-2 p-2 rounded-xl bg-primary/5 border border-primary/10">
          <Checkbox
            id="v2-marketing"
            checked={marketingConsent}
            onCheckedChange={(checked) => setMarketingConsent(checked === true)}
            disabled={loading}
            className="mt-0.5"
          />
          <Label htmlFor="v2-marketing" className="text-xs text-foreground leading-snug cursor-pointer">
            {t('v2.marketingConsent')}
          </Label>
        </div>

        <Button type="submit" className="w-full rounded-2xl h-12 text-base" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('auth.creatingAccount')}
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              {t('v2.createAndSave')}
            </>
          )}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          {t('legal.consentText')} <LegalDisclaimerLink className="text-[10px]" />
        </p>
      </form>
    </div>
  );
}

/** Save V2 quiz data: update parent profile + create child if quiz was completed */
async function saveV2QuizData(data: V2QuizData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update parent's preferred_language
    await supabase
      .from('profiles')
      .update({ preferred_language: data.language })
      .eq('user_id', user.id);

    // The child creation is handled by the existing signUp flow in AuthContext
    // (which creates a family + profile). The V2 quiz data (childName, etc.)
    // will be used when the parent adds the child from the dashboard.
    // We store the quiz data in the parent's onboarding_data JSONB field.
    await supabase
      .from('profiles')
      .update({
        onboarding_data: {
          v2: true,
          childName: data.childName,
          childAge: data.childAge,
          morningChallenge: data.morningChallenge,
          successGoal: data.successGoal,
        },
        onboarding_step: 6,
        is_activated: true,
      })
      .eq('user_id', user.id);
  } catch (err) {
    console.error('Error saving V2 quiz data:', err);
  }
}
