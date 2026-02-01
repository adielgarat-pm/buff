import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, Copy, Check, ArrowRight, Sparkles } from 'lucide-react';
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
      toast.success('הקוד הועתק! 📋');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('לא הצלחנו להעתיק');
    }
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
      
      <div className="flex-1 px-5 py-3 space-y-4 overflow-y-auto">
        {/* Header with back arrow */}
        <div className="text-center space-y-1 relative">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="absolute right-0 top-0 p-1.5 -mr-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
            aria-label="חזרה"
          >
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center mx-auto">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">
            הכל מוכן לשיגור! 🚀
          </h1>
        </div>

        {/* Family Code Display */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-success/10 border-2 border-dashed border-primary/30">
          <p className="text-center text-sm text-muted-foreground mb-2">
            הקוד המשפחתי שלכם:
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border-2 border-primary/50 hover:border-primary transition-colors"
            >
              <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                {familyCode || '------'}
              </span>
              {copied ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            לחצו להעתקה
          </p>
        </div>

        {/* Instructions */}
        <div className="p-3 rounded-xl bg-card border border-border space-y-2">
          <p className="text-sm text-foreground text-right leading-relaxed">
            זה הזמן לקרוא ל<strong>{childName}</strong>, להוריד את BUFF במכשיר שלהם ולהזין את הקוד המשפחתי כדי להתחבר לנבחרת.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-4 h-4 text-warning" />
            <span>הילד/ה יוכלו מיד להתחיל לצבור נקודות!</span>
          </div>
        </div>

        {/* Quick tips summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-lg">📱</span>
            <p className="text-xs text-muted-foreground mt-1">הורדה</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-lg">🔑</span>
            <p className="text-xs text-muted-foreground mt-1">קוד</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-lg">🎮</span>
            <p className="text-xs text-muted-foreground mt-1">משחק!</p>
          </div>
        </div>
      </div>

      {/* Big Launch Button */}
      <div className="px-5 pb-6 pt-3 flex-shrink-0 bg-background">
        <Button 
          onClick={handleLaunch}
          disabled={isLoading}
          className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-l from-primary via-primary to-success shadow-lg shadow-primary/30 animate-pulse hover:animate-none transition-all hover:scale-[1.02]"
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
