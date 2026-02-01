import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, Copy, Check, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  const [familyCode, setFamilyCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Fetch family code on mount
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

  const handleCopy = async () => {
    if (!familyCode) return;
    
    try {
      await navigator.clipboard.writeText(familyCode);
      setCopied(true);
      toast.success('הועתק! 📋');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('לא הצלחנו להעתיק');
    }
  };

  const handleShareWhatsApp = () => {
    const message = `היי! הכל מוכן ב-BUFF 🎮\n\nהקוד המשפחתי שלנו הוא: *${familyCode}*\n\nמחכה לך שם! 🚀`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleLaunch = () => {
    setShowConfetti(true);
    // Small delay for confetti effect, then complete
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  return (
    <div className="flex flex-col h-full">
      {showConfetti && <ConfettiEffect trigger={showConfetti} />}
      
      <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center mx-auto">
            <Rocket className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            הכל מוכן לשיגור! 🚀
          </h1>
        </div>

        {/* Family Code Display */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-success/10 border-2 border-dashed border-primary/30">
          <p className="text-center text-sm text-muted-foreground mb-3">
            הקוד המשפחתי שלכם:
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
              הועתק ללוח! ✓
            </p>
          )}
        </div>

        {/* WhatsApp Share */}
        <button
          onClick={handleShareWhatsApp}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">שלחו את הקוד והוראות ההתקנה בוואטסאפ</span>
        </button>

        {/* Instructions */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-foreground text-right leading-relaxed">
            זה הזמן לקרוא ל<strong className="text-primary">{childName}</strong>, להוריד את BUFF במכשיר שלהם ולהזין את הקוד המשפחתי. המשימה הראשונה כבר מחכה בפנים!
          </p>
        </div>
      </div>

      {/* Big Launch Button */}
      <div className="px-5 pb-6 pt-4 flex-shrink-0 bg-background">
        <Button 
          onClick={handleLaunch}
          disabled={isLoading}
          className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-l from-primary via-primary to-success shadow-lg shadow-primary/30 animate-pulse hover:animate-none transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              יוצרים את המשפחה...
            </span>
          ) : (
            'זהו, אנחנו מחוברים! יוצאים לדרך ⚡'
          )}
        </Button>
      </div>
    </div>
  );
}
