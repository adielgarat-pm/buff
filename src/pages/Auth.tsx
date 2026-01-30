import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Zap, Users, User, Globe } from 'lucide-react';
import buffLogo from '@/assets/buff-logo.png';
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-buff/5 pointer-events-none" />

      {/* Language Toggle */}
      <div className="fixed top-4 left-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
          className="rounded-2xl gap-2"
        >
          <Globe className="w-4 h-4" />
          {language === 'he' ? 'EN' : 'עב'}
        </Button>
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-2xl rounded-2xl">
        <CardHeader className="text-center space-y-2">
          {/* BUFF Logo */}
          <div className="flex flex-col items-center gap-2 mb-2">
            <img 
              src={buffLogo} 
              alt="BUFF Logo" 
              className="h-20 w-20 object-contain"
            />
            <CardTitle className="text-3xl font-display font-bold tracking-wide text-primary">
              BUFF
            </CardTitle>
          </div>
          <CardDescription className="text-sm italic text-buff font-medium">
            {t('app.tagline')}
          </CardDescription>
          <CardDescription className="leading-relaxed">
            {t('app.syncProgress')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 rounded-2xl">
              <TabsTrigger value="login" className="rounded-xl">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl">{t('auth.signup')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('auth.email')}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={loading}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('auth.password')}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={loading}
                    dir="ltr"
                  />
                </div>
                <Button type="submit" className="w-full rounded-2xl" disabled={loading}>
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
                <div className="relative my-4">
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
                  className="w-full rounded-2xl" 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('auth.continueWithGoogle')}
                </Button>

                {/* Legal consent text */}
                <p className="text-xs text-muted-foreground text-center mt-3">
                  {t('legal.consentText')} <LegalDisclaimerLink className="text-xs" />
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name">{t('auth.displayName')}</Label>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder={t('auth.yourName')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    disabled={loading}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={loading}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.iAm')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={role === 'parent' ? 'default' : 'outline'}
                      className="w-full rounded-2xl"
                      onClick={() => {
                        setRole('parent');
                        trackRegistrationStep('role_selected', { role: 'parent', method: 'email' });
                      }}
                      disabled={loading}
                    >
                      <Users className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('auth.parent')}
                    </Button>
                    <Button
                      type="button"
                      variant={role === 'child' ? 'default' : 'outline'}
                      className="w-full rounded-2xl"
                      onClick={() => {
                        setRole('child');
                        trackRegistrationStep('role_selected', { role: 'child', method: 'email' });
                      }}
                      disabled={loading}
                    >
                      <User className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('auth.teen')}
                    </Button>
                  </div>
                </div>

                {role === 'child' && (
                  <div className="space-y-2">
                    <Label htmlFor="family-code">{t('auth.familyCode')}</Label>
                    <Input
                      id="family-code"
                      type="text"
                      placeholder={t('auth.familyCodePlaceholder')}
                      value={familyCode}
                      onChange={(e) => setFamilyCode(e.target.value)}
                      disabled={loading}
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('auth.familyCodeHint')}
                    </p>
                  </div>
                )}

                {/* Marketing Consent Checkbox */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <Checkbox
                    id="marketing-consent"
                    checked={marketingConsent}
                    onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                    disabled={loading}
                    className="mt-0.5"
                  />
                  <Label 
                    htmlFor="marketing-consent" 
                    className="text-sm text-foreground leading-relaxed cursor-pointer"
                  >
                    אשמח לקבל ממך (עדי) טיפים קטנים לסופ"ש ועדכונים על פיצ'רים חדשים ב-BUFF
                  </Label>
                </div>

                <Button type="submit" className="w-full rounded-2xl" disabled={loading}>
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
                <div className="relative my-4">
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
                  className="w-full rounded-2xl" 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('auth.signupWithGoogle')}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t('auth.googleRoleSelection')}
                </p>

                {/* Legal consent text */}
                <p className="text-xs text-muted-foreground text-center mt-3">
                  {t('legal.consentText')} <LegalDisclaimerLink className="text-xs" />
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
