import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Users, Send, Link2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FamilyCodeDisplayProps {
  shortCode: string;
}

export function FamilyCodeDisplay({ shortCode }: FamilyCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showMagicLinkDialog, setShowMagicLinkDialog] = useState(false);
  const [childName, setChildName] = useState('');
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

  // Generate the magic link URL
  const getMagicLinkUrl = (name: string) => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    params.set('code', shortCode);
    if (name.trim()) {
      params.set('name', name.trim());
    }
    return `${baseUrl}/join?${params.toString()}`;
  };

  const handleShareMagicLink = async () => {
    const magicLink = getMagicLinkUrl(childName);
    const displayName = childName.trim() || 'הילד/ה';
    
    const shareText = language === 'he' 
      ? `🎮 היי ${displayName}! ה-Buff שלך מחכה!

לחץ/י על הקישור כדי להצטרף למשחק:
${magicLink}

🚀 פתח והתחל לצבור נקודות!`
      : `🎮 Hey ${displayName}! Your Buff is waiting!

Click the link to join the game:
${magicLink}

🚀 Open and start earning points!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: language === 'he' ? `הזמנה ל-BUFF עבור ${displayName}` : `BUFF Invite for ${displayName}`,
          text: shareText,
          url: magicLink,
        });
        toast.success(language === 'he' ? 'נשלח בהצלחה!' : 'Shared successfully!');
        setShowMagicLinkDialog(false);
        setChildName('');
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success(language === 'he' ? 'ההודעה הועתקה! שלח לילד דרך וואטסאפ' : 'Message copied! Send via WhatsApp');
      setShowMagicLinkDialog(false);
      setChildName('');
    } catch {
      toast.error(language === 'he' ? 'שגיאה בשיתוף' : 'Failed to share');
    }
  };

  const handleLegacyShare = async () => {
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
            title={language === 'he' ? 'העתק קוד' : 'Copy code'}
          >
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          
          {/* Magic Link Button - Opens dialog */}
          <Dialog open={showMagicLinkDialog} onOpenChange={setShowMagicLinkDialog}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                title={language === 'he' ? 'צור לינק קסם' : 'Create magic link'}
              >
                <Sparkles className="w-4 h-4 text-accent" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" />
                  {language === 'he' ? 'יצירת לינק הזמנה' : 'Create Invite Link'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'he' 
                    ? 'צור לינק מותאם אישית עם שם הילד/ה שיפתח ישירות לדף ההרשמה'
                    : 'Create a personalized link with the child\'s name that opens directly to registration'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="child-name">
                    {language === 'he' ? 'שם הילד/ה' : 'Child\'s Name'}
                  </Label>
                  <Input
                    id="child-name"
                    placeholder={language === 'he' ? 'לדוגמה: דני' : 'e.g., Danny'}
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                  />
                </div>
                {childName && (
                  <div className="p-3 rounded-lg bg-muted/50 border text-xs break-all">
                    <p className="text-muted-foreground mb-1">{language === 'he' ? 'קישור:' : 'Link:'}</p>
                    <code className="text-primary">{getMagicLinkUrl(childName)}</code>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setShowMagicLinkDialog(false)}
                  className="w-full sm:w-auto"
                >
                  {language === 'he' ? 'ביטול' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleShareMagicLink}
                  className="w-full sm:w-auto gap-2"
                >
                  <Send className="w-4 h-4" />
                  {language === 'he' ? 'שלח הזמנה' : 'Send Invite'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Legacy share button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleLegacyShare}
            className="h-8 w-8 p-0"
            title={language === 'he' ? 'שתף עם קוד' : 'Share with code'}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
