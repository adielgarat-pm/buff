import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Users, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface FamilyCodeDisplayProps {
  shortCode: string;
}

export function FamilyCodeDisplay({ shortCode }: FamilyCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { language } = useLanguage();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortCode);
      setCopied(true);
      toast.success(language === 'he' ? 'הקוד הועתק!' : 'Code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(language === 'he' ? 'שגיאה בהעתקה' : 'Failed to copy');
    }
  };

  const handleShare = async () => {
    const appUrl = 'https://buff.lovable.app';
    const shareText = language === 'he' 
      ? `🎮 הצטרף/י למשפחה שלנו ב-BUFF!

📱 איך להצטרף:
1. היכנס/י לאפליקציה: ${appUrl}
2. לחץ/י על "הרשמה"
3. בחר/י "נער/ה"
4. הזן/י את קוד המשפחה:

🔑 ${shortCode}

נתראה באפליקציה! ✨`
      : `🎮 Join our family on BUFF!

📱 How to join:
1. Go to: ${appUrl}
2. Click "Sign Up"
3. Choose "Teen"
4. Enter the family code:

🔑 ${shortCode}

See you in the app! ✨`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: language === 'he' ? 'הצטרף ל-BUFF' : 'Join BUFF',
          text: shareText,
        });
        toast.success(language === 'he' ? 'נשלח בהצלחה!' : 'Shared successfully!');
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      toast.success(language === 'he' ? 'ההודעה הועתקה! שלח לילד דרך וואטסאפ' : 'Message copied! Send via WhatsApp');
    } catch {
      toast.error(language === 'he' ? 'שגיאה בשיתוף' : 'Failed to share');
    }
  };

  return (
    <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {language === 'he' ? 'קוד משפחה' : 'Family Code'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <code className="px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/40 text-lg font-mono font-bold text-primary tracking-widest">
            {shortCode}
          </code>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-8 w-8 p-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleShare}
            className="h-8 w-8 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
