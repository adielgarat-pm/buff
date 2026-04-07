import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Zap, Users, User, Globe } from 'lucide-react';
import buffLogoNoBg from '@/assets/buff-logo-no-bg.png';
import { trackRegistrationStep, trackRegistrationError } from '@/hooks/useRegistrationAnalytics';
import { LegalDisclaimerLink } from '@/components/LegalDisclaimer';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'parent' | 'child'>('parent');
  const [familyCode, setFamilyCode] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Track page visit
  useEffect(() => {
    trackRegistrationStep('auth_page_visit');
  }, []);

  // Redirect if already logged in - handled by PublicRoute wrapper
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error(t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error(t('auth.invalidCredentials'));
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success(t('auth.welcomeBack'));
      navigate('/dashboard');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    trackRegistrationStep('signup_submitted', { role });
    
    if (!signupEmail || !signupPassword || !displayName) {
      toast.error(t('auth.fillAllFields'));
      return;
    }

    if (signupPassword.length < 6) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }

    if (role === 'child' && !familyCode) {
      toast.error(t('auth.enterFamilyCode'));
      return;
    }

    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, displayName, role, familyCode, marketingConsent);
    setLoading(false);

    if (error) {
      trackRegistrationError('signup_error', error.message, { role });
      if (error.message.includes('already registered')) {
        toast.error(t('auth.emailExists'));
      } else if (error.message.includes('Invalid family code')) {
        toast.error(t('auth.invalidFamilyCode'));
      } else {
        toast.error(error.message);
      }
    } else {
      trackRegistrationStep('signup_success', { role });
      trackRegistrationStep('onboarding_complete', { role, method: 'email' });
      toast.success(t('auth.accountCreated'));
      navigate('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    trackRegistrationStep('google_auth_started');
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    
    if (error) {
      trackRegistrationError('signup_error', error.message, { method: 'google' });
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-3 overflow-x-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-buff/5 pointer-events-none" />

      {/* Language Toggle */}
      <div className="fixed top-3 left-3 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
          className="rounded-2xl gap-2 h-8 px-2"
        >
          <Globe className="w-4 h-4" />
          {language === 'he' ? 'EN' : 'HE'}
        </Button>
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-2xl rounded-2xl">
        <CardHeader className="text-center space-y-1 pb-2 pt-4 px-4">
          {/* BUFF Logo */}
          <div className="flex items-center justify-center mb-1">
            <img 
              src={buffLogoNoBg} 
              alt="BUFF Logo" 
              className="h-16 w-16 object-contain"
            />
          </div>
          <CardDescription className="text-xs italic text-buff font-medium">
            {t('app.tagline')}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-0">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3 rounded-2xl h-9">
              <TabsTrigger value="login" className="rounded-xl text-sm">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl text-sm">{t('auth.signup')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="login-email" className="text-xs">{t('auth.email')}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={loading}
                    dir="ltr"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="login-password" className="text-xs">{t('auth.password')}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={loading}
                    dir="ltr"
                    className="h-9"
                  />
                </div>
                <Button type="submit" className="w-full rounded-2xl h-10" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`} />
                      {t('auth.loggingIn')}
                    </>
                  ) : (
                    <>
                      <Zap className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('auth.connect')}
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
                  </div>
                </div>

                {/* Google Button */}
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full rounded-2xl h-10" 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t('auth.continueWithGoogle')}
                </Button>

                {/* Legal consent text */}
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  {t('legal.consentText')} <LegalDisclaimerLink className="text-[10px]" />
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignup} className="space-y-2.5">
                <div className="space-y-1">
                  <Label htmlFor="display-name" className="text-xs">{t('auth.displayName')}</Label>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder={t('auth.yourName')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-xs">{t('auth.email')}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    disabled={loading}
                    dir="ltr"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-xs">{t('auth.password')}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={loading}
                    dir="ltr"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('auth.iAm')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={role === 'parent' ? 'default' : 'outline'}
                      className="w-full rounded-2xl h-9 text-sm"
                      onClick={() => {
                        setRole('parent');
                        trackRegistrationStep('role_selected', { role: 'parent', method: 'email' });
                      }}
                      disabled={loading}
                    >
                      <Users className={`w-4 h-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                      {t('auth.parent')}
                    </Button>
                    <Button
                      type="button"
                      variant={role === 'child' ? 'default' : 'outline'}
                      className="w-full rounded-2xl h-9 text-sm"
                      onClick={() => {
                        setRole('child');
                        trackRegistrationStep('role_selected', { role: 'child', method: 'email' });
                      }}
                      disabled={loading}
                    >
                      <User className={`w-4 h-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                      {t('auth.teen')}
                    </Button>
                  </div>
                </div>

                {role === 'child' && (
                  <div className="space-y-1">
                    <Label htmlFor="family-code" className="text-xs">{t('auth.familyCode')}</Label>
                    <Input
                      id="family-code"
                      type="text"
                      placeholder={t('auth.familyCodePlaceholder')}
                      value={familyCode}
                      onChange={(e) => setFamilyCode(e.target.value)}
                      disabled={loading}
                      dir="ltr"
                      className="h-9"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {t('auth.familyCodeHint')}
                    </p>
                  </div>
                )}

                {/* Marketing Consent Checkbox */}
                <div className="flex items-start gap-2 p-2 rounded-xl bg-primary/5 border border-primary/10">
                  <Checkbox
                    id="marketing-consent"
                    checked={marketingConsent}
                    onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                    disabled={loading}
                    className="mt-0.5"
                  />
                  <Label 
                    htmlFor="marketing-consent" 
                    className="text-xs text-foreground leading-snug cursor-pointer"
                  >
                    {t('auth.marketingConsent')}
                  </Label>
                </div>

                <Button type="submit" className="w-full rounded-2xl h-10" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`} />
                      {t('auth.creatingAccount')}
                    </>
                  ) : (
                    <>
                      <Zap className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('auth.createAccount')}
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
                  </div>
                </div>

                {/* Google Button */}
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full rounded-2xl h-10" 
                  onClick={handleGoogleLogin}
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
                <p className="text-[10px] text-muted-foreground text-center">
                  {t('auth.googleRoleSelection')}
                </p>

                {/* Legal consent text */}
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  {t('legal.consentText')} <LegalDisclaimerLink className="text-[10px]" />
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
