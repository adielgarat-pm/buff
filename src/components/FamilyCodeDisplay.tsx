import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Users, Send, Link2, Sparkles, Smartphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { Switch } from '@/components/ui/switch';

interface FamilyCodeDisplayProps {
  shortCode: string;
  onChildAdded?: () => void;
}

export function FamilyCodeDisplay({ shortCode, onChildAdded }: FamilyCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showMagicLinkDialog, setShowMagicLinkDialog] = useState(false);
  const [childName, setChildName] = useState('');
  const [noSeparateDevice, setNoSeparateDevice] = useState(false);
  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const { language } = useLanguage();
  const { profile } = useAuth();

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

  // Create child directly without a separate device
  const handleCreateChildWithoutDevice = async () => {
    if (!childName.trim()) {
      toast.error(language === 'he' ? 'נא להזין שם הילד/ה' : 'Please enter child\'s name');
      return;
    }

    if (!profile?.family_id) {
      toast.error(language === 'he' ? 'שגיאה: לא נמצאה משפחה' : 'Error: No family found');
      return;
    }

    setIsCreatingChild(true);
    try {
      // Create child profile without user_id (the trigger will create default tasks, rewards, vault)
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: null,
          family_id: profile.family_id,
          display_name: childName.trim(),
          role: 'child',
        });

      if (error) {
        console.error('Error creating child:', error);
        toast.error(language === 'he' ? 'שגיאה ביצירת פרופיל הילד' : 'Failed to create child profile');
        return;
      }

      toast.success(
        language === 'he' 
          ? `${childName.trim()} נוסף/ה בהצלחה! 🎉` 
          : `${childName.trim()} added successfully! 🎉`
      );
      setShowMagicLinkDialog(false);
      setChildName('');
      setNoSeparateDevice(false);
      onChildAdded?.();
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error(language === 'he' ? 'שגיאה לא צפויה' : 'Unexpected error');
    } finally {
      setIsCreatingChild(false);
    }
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

  const handleDialogClose = () => {
    setShowMagicLinkDialog(false);
    setChildName('');
    setNoSeparateDevice(false);
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
          <Dialog open={showMagicLinkDialog} onOpenChange={(open) => open ? setShowMagicLinkDialog(true) : handleDialogClose()}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                title={language === 'he' ? 'הוסף ילד/ה' : 'Add child'}
              >
                <Sparkles className="w-4 h-4 text-accent" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" />
                  {language === 'he' ? 'הוספת ילד/ה' : 'Add Child'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'he' 
                    ? 'הוסף ילד/ה למשפחה או שלח לינק הזמנה'
                    : 'Add a child to your family or send an invite link'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Child Name Input */}
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

                {/* No Separate Device Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="no-device" className="text-sm font-normal cursor-pointer">
                      {language === 'he' 
                        ? 'הילד משתמש במכשיר שלי (אין לו טלפון משלו)'
                        : 'Child uses my device (no separate phone)'}
                    </Label>
                  </div>
                  <Switch
                    id="no-device"
                    checked={noSeparateDevice}
                    onCheckedChange={setNoSeparateDevice}
                  />
                </div>

                {/* Conditional content based on toggle */}
                {!noSeparateDevice && childName && (
                  <div className="p-3 rounded-lg bg-muted/50 border text-xs break-all">
                    <p className="text-muted-foreground mb-1">{language === 'he' ? 'קישור:' : 'Link:'}</p>
                    <code className="text-primary">{getMagicLinkUrl(childName)}</code>
                  </div>
                )}

                {noSeparateDevice && (
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/30 text-sm">
                    <p className="text-muted-foreground">
                      {language === 'he' 
                        ? '📱 הילד/ה יופיע/תופיע ברשימת הילדים ותוכל/י לפתוח את מסך המשימות שלו/ה ישירות מהמכשיר שלך.'
                        : '📱 The child will appear in your children list and you can open their quest screen directly from your device.'}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={handleDialogClose}
                  className="w-full sm:w-auto"
                  disabled={isCreatingChild}
                >
                  {language === 'he' ? 'ביטול' : 'Cancel'}
                </Button>
                {noSeparateDevice ? (
                  <Button
                    onClick={handleCreateChildWithoutDevice}
                    className="w-full sm:w-auto gap-2"
                    disabled={isCreatingChild || !childName.trim()}
                  >
                    {isCreatingChild ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {language === 'he' ? 'מוסיף...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        {language === 'he' ? 'הוסף ילד/ה' : 'Add Child'}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleShareMagicLink}
                    className="w-full sm:w-auto gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {language === 'he' ? 'שלח הזמנה' : 'Send Invite'}
                  </Button>
                )}
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
