import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, Copy, Check, Share2, ClipboardCopy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { ConfettiEffect } from '@/components/ConfettiEffect';

interface Step6ParentTipProps {
  childName: string;
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function Step6ParentTip({ childName, onComplete, onBack, isLoading }: Step6ParentTipProps) {
  const { profile } = useAuth();
  const { t, isRTL } = useLanguage();
  const [familyCode, setFamilyCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [instructionsCopied, setInstructionsCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchFamilyCode = async () => {
      if (!profile?.family_id) return;
      const { data, error } = await supabase
        .from('families')
        .select('short_code')
        .eq('id', profile.family_id)
        .single();
      if (data && !error) {
        setFamilyCode(data.short_code);
      }
    };
    fetchFamilyCode();
  }, [profile?.family_id]);

  const getConnectionInstructions = () => {
    const appUrl = 'https://buff.lovable.app';
    return t('onboarding.step6.whatsappMessage')
      .replace('{name}', childName)
      .replace('{url}', appUrl)
      .replace('{code}', familyCode);
  };

  const handleCopy = async () => {
    if (!familyCode) return;
    try {
      await navigator.clipboard.writeText(familyCode);
      setCopied(true);
      toast.success(t('onboarding.step6.copiedToast'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('onboarding.step6.copyError'));
    }
  };

  const handleCopyInstructions = async () => {
    if (!familyCode) return;
    try {
      const instructions = getConnectionInstructions();
      await navigator.clipboard.writeText(instructions);
      setInstructionsCopied(true);
      toast.success(t('onboarding.step6.instructionsCopied'));
      setTimeout(() => setInstructionsCopied(false), 3000);
    } catch {
      toast.error(t('onboarding.step6.copyError'));
    }
  };

  const handleShareWhatsApp = () => {
    if (!familyCode) return;
    const message = getConnectionInstructions();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.location.href = whatsappUrl;
  };

  const handleLaunch = () => {
    setShowConfetti(true);
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  return (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {showConfetti && <ConfettiEffect trigger={showConfetti} />}
      
      <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center mx-auto">
            <Rocket className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {t('onboarding.step6.title')}
          </h1>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-success/10 border-2 border-dashed border-primary/30">
          <p className="text-center text-sm text-muted-foreground mb-3">
            {t('onboarding.step6.familyCode')}
          </p>
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-card border-2 border-primary/50 hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98]"
          >
            <span className="text-2xl font-mono font-bold tracking-[0.3em] text-primary">
              {familyCode || '------'}
            </span>
            {copied ? (
              <Check className="w-5 h-5 text-success flex-shrink-0" />
            ) : (
              <Copy className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            )}
          </button>
          {copied && (
            <p className="text-center text-xs text-success mt-2 font-medium">
              {t('onboarding.step6.copied')}
            </p>
          )}
        </div>

        <button
          onClick={handleShareWhatsApp}
          disabled={!familyCode}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">{t('onboarding.step6.shareWhatsApp').replace('{name}', childName)}</span>
        </button>

        <button
          onClick={handleCopyInstructions}
          disabled={!familyCode}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          {instructionsCopied ? (
            <>
              <Check className="w-4 h-4 text-success" />
              <span className="text-sm">{t('onboarding.step6.instructionsCopiedShort')}</span>
            </>
          ) : (
            <>
              <ClipboardCopy className="w-4 h-4" />
              <span className="text-sm">{t('onboarding.step6.copyInstructions')}</span>
            </>
          )}
        </button>

        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: t('onboarding.step6.callToAction').replace('{name}', childName) }}
          />
        </div>
      </div>

      <div className="px-5 pb-6 pt-4 flex-shrink-0 bg-background">
        <Button 
          onClick={handleLaunch}
          disabled={isLoading}
          className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-l from-primary via-primary to-success shadow-lg shadow-primary/30 animate-pulse hover:animate-none transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              {t('onboarding.step6.creating')}
            </span>
          ) : (
            t('onboarding.step6.launchCta')
          )}
        </Button>
      </div>
    </div>
  );
}
