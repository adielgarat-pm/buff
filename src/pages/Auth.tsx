import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Zap, Users, User, Globe } from 'lucide-react';
import buffLogo from '@/assets/buff-logo.png';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
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
    const { error } = await signUp(signupEmail, signupPassword, displayName, role, familyCode);
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error(t('auth.emailExists'));
      } else if (error.message.includes('Invalid family code')) {
        toast.error(t('auth.invalidFamilyCode'));
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success(t('auth.accountCreated'));
      navigate('/dashboard');
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
                      onClick={() => setRole('parent')}
                      disabled={loading}
                    >
                      <Users className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('auth.parent')}
                    </Button>
                    <Button
                      type="button"
                      variant={role === 'child' ? 'default' : 'outline'}
                      className="w-full rounded-2xl"
                      onClick={() => setRole('child')}
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
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
