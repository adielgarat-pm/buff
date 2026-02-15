import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Users, Send, Link2, Sparkles, Smartphone, Loader2, QrCode, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
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
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [childName, setChildName] = useState('');
  const [noSeparateDevice, setNoSeparateDevice] = useState(false);
  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const { language } = useLanguage();
  const { profile } = useAuth();
  const isHe = language === 'he';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortCode);
      setCopied(true);
      toast.success(isHe ? 'הקוד הועתק!' : 'Code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isHe ? 'שגיאה בהעתקה' : 'Failed to copy');
    }
  };

  const getMagicLinkUrl = (name: string) => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    params.set('code', shortCode);
    if (name.trim()) params.set('name', name.trim());
    return `${baseUrl}/join?${params.toString()}`;
  };

  const handleCreateChildWithoutDevice = async () => {
    if (!childName.trim()) {
      toast.error(isHe ? 'נא להזין שם הילד/ה' : 'Please enter child\'s name');
      return;
    }
    if (!profile?.family_id) {
      toast.error(isHe ? 'שגיאה: לא נמצאה משפחה' : 'Error: No family found');
      return;
    }

    setIsCreatingChild(true);
    try {
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
        toast.error(isHe ? 'שגיאה ביצירת פרופיל הילד' : 'Failed to create child profile');
        return;
      }

      toast.success(isHe ? `${childName.trim()} נוסף/ה בהצלחה! 🎉` : `${childName.trim()} added successfully! 🎉`);
      setShowMagicLinkDialog(false);
      setChildName('');
      setNoSeparateDevice(false);
      onChildAdded?.();
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error(isHe ? 'שגיאה לא צפויה' : 'Unexpected error');
    } finally {
      setIsCreatingChild(false);
    }
  };

  const handleNativeShare = async () => {
    const displayName = childName.trim() || (isHe ? 'הילד/ה' : 'your child');
    const magicLink = getMagicLinkUrl(childName);

    const shareText = isHe
      ? `🎮 היי ${displayName}! ה-Buff שלך מחכה!\n\nלחץ/י על הקישור כדי להצטרף למשחק:\n${magicLink}\n\n🚀 פתח והתחל לצבור נקודות!`
      : `🎮 Hey ${displayName}! Your Buff is waiting!\n\nClick the link to join the game:\n${magicLink}\n\n🚀 Open and start earning points!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: isHe ? `הזמנה ל-BUFF עבור ${displayName}` : `BUFF Invite for ${displayName}`,
          text: shareText,
          url: magicLink,
        });
        toast.success(isHe ? 'נשלח בהצלחה!' : 'Shared successfully!');
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
      toast.success(isHe ? 'ההודעה הועתקה! שלח לילד/ה' : 'Message copied! Send it to your child');
      setShowMagicLinkDialog(false);
      setChildName('');
    } catch {
      toast.error(isHe ? 'שגיאה בשיתוף' : 'Failed to share');
    }
  };

  const handleLegacyShare = async () => {
    const appUrl = 'https://buff.lovable.app';
    const shareText = isHe
      ? `🎮 הצטרף/י למשפחה שלנו ב-BUFF!\n\n📱 איך להצטרף:\n1. היכנס/י לאפליקציה: ${appUrl}\n2. לחץ/י על "הרשמה"\n3. בחר/י "אני נער/ה"\n4. הזן/י את הקוד המשפחתי:\n\n🔑 ${shortCode}\n\nנתראה באפליקציה! ✨`
      : `🎮 Join our family on BUFF!\n\n📱 How to join:\n1. Go to: ${appUrl}\n2. Click "Sign Up"\n3. Choose "Teen"\n4. Enter the family code:\n\n🔑 ${shortCode}\n\nSee you in the app! ✨`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: isHe ? 'הצטרף ל-BUFF' : 'Join BUFF',
          text: shareText,
        });
        toast.success(isHe ? 'נשלח בהצלחה!' : 'Shared successfully!');
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success(isHe ? 'ההודעה הועתקה!' : 'Message copied!');
    } catch {
      toast.error(isHe ? 'שגיאה בשיתוף' : 'Failed to share');
    }
  };

  const handleDialogClose = () => {
    setShowMagicLinkDialog(false);
    setChildName('');
    setNoSeparateDevice(false);
  };

  const joinUrl = `https://buff.lovable.app/join?code=${shortCode}`;

  return (
    <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
      {/* Header with micro-copy */}
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          {isHe ? 'קוד משפחה' : 'Family Code'}
        </span>
      </div>

      {/* Micro-copy: No phone needed */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {isHe
          ? '💡 הילדים לא צריכים טלפון או ווטסאפ — פשוט הזינו את הקוד אצלם!'
          : '💡 Kids don\'t need a phone or WhatsApp — they just need this code to join!'}
      </p>

      {/* Large code display */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border-2 border-primary/40 hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98]"
        >
          <span className="text-2xl font-mono font-bold tracking-[0.3em] text-primary" dir="ltr">
            {shortCode}
          </span>
          {copied ? (
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <Copy className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          )}
        </button>
      </div>

      {/* Action buttons row */}
      <div className="flex gap-2">
        {/* QR Code button */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 h-9 text-xs gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              {isHe ? 'הצג QR' : 'Show QR'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-center">
                {isHe ? 'סרוק כדי להצטרף' : 'Scan to Join'}
              </DialogTitle>
              <DialogDescription className="text-center">
                {isHe ? 'סרוק עם מצלמת הטלפון' : 'Scan with your phone camera'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <div className="bg-white p-4 rounded-2xl">
                <QRCodeSVG
                  value={joinUrl}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {isHe ? `קוד משפחה: ${shortCode}` : `Family Code: ${shortCode}`}
            </p>
          </DialogContent>
        </Dialog>

        {/* Native Share button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLegacyShare}
          className="flex-1 h-9 text-xs gap-1.5"
        >
          <Share2 className="w-3.5 h-3.5" />
          {isHe ? 'שתף' : 'Share'}
        </Button>

        {/* Add child button */}
        <Dialog open={showMagicLinkDialog} onOpenChange={(open) => open ? setShowMagicLinkDialog(true) : handleDialogClose()}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex-1 h-9 text-xs gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {isHe ? 'הוסף ילד/ה' : 'Add Child'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                {isHe ? 'הוספת ילד/ה' : 'Add Child'}
              </DialogTitle>
              <DialogDescription>
                {isHe
                  ? 'הוסף ילד/ה למשפחה או שלח לינק הזמנה'
                  : 'Add a child to your family or send an invite link'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="child-name">
                  {isHe ? 'שם הילד/ה' : 'Child\'s Name'}
                </Label>
                <Input
                  id="child-name"
                  placeholder={isHe ? 'לדוגמה: דני' : 'e.g., Danny'}
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="no-device" className="text-sm font-normal cursor-pointer">
                    {isHe
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

              {!noSeparateDevice && childName && (
                <div className="p-3 rounded-lg bg-muted/50 border text-xs break-all">
                  <p className="text-muted-foreground mb-1">{isHe ? 'קישור:' : 'Link:'}</p>
                  <code className="text-primary">{getMagicLinkUrl(childName)}</code>
                </div>
              )}

              {noSeparateDevice && (
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/30 text-sm">
                  <p className="text-muted-foreground">
                    {isHe
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
                {isHe ? 'ביטול' : 'Cancel'}
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
                      {isHe ? 'מוסיף...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      {isHe ? 'הוסף ילד/ה' : 'Add Child'}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNativeShare}
                  className="w-full sm:w-auto gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {isHe ? 'שלח הזמנה' : 'Send Invite'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
