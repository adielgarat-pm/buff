import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Users, Sparkles, Smartphone, Loader2, QrCode, Share2 } from 'lucide-react';
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
  const { t } = useLanguage();
  const { profile } = useAuth();

  // Copy code only
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(shortCode);
      setCopied(true);
      toast.success(t('familyCode.codeCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('familyCode.copyError'));
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
      toast.error(t('familyCode.enterChildName'));
      return;
    }
    if (!profile?.family_id) {
      toast.error(t('familyCode.noFamilyError'));
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
        toast.error(t('familyCode.createError'));
        return;
      }

      toast.success(t('familyCode.addedSuccess').replace('{name}', childName.trim()));
      setShowMagicLinkDialog(false);
      setChildName('');
      setNoSeparateDevice(false);
      onChildAdded?.();
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error(t('familyCode.unexpectedError'));
    } finally {
      setIsCreatingChild(false);
    }
  };

  // Native Share via Web Share API, fallback to clipboard
  const handleNativeShare = async () => {
    const displayName = childName.trim() || 'your child';
    const magicLink = getMagicLinkUrl(childName);

    const shareText = `🎮 Hey ${displayName}! Your Buff is waiting!\n\nClick the link to join the game:\n${magicLink}\n\n🚀 Open and start earning points!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('familyCode.shareTitle'),
          text: shareText,
          url: magicLink,
        });
        toast.success(t('familyCode.sharedSuccess'));
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
      toast.success(t('familyCode.messageCopied'));
      setShowMagicLinkDialog(false);
      setChildName('');
    } catch {
      toast.error(t('familyCode.shareError'));
    }
  };

  // Share button on the main card — uses native share sheet
  const handleShareCode = async () => {
    const appUrl = 'https://buff.lovable.app';
    const shareText = `🎮 Join our family on BUFF!\n\n📱 How to join:\n1. Go to: ${appUrl}\n2. Click "Sign Up"\n3. Choose "Teen"\n4. Enter the family code:\n\n🔑 ${shortCode}\n\nSee you in the app! ✨`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('familyCode.shareTitle'),
          text: shareText,
        });
        toast.success(t('familyCode.sharedSuccess'));
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success(t('familyCode.messageCopied'));
    } catch {
      toast.error(t('familyCode.shareError'));
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
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          {t('familyCode.familyCode')}
        </span>
      </div>

      {/* Micro-copy: No phone needed */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        💡 {t('familyCode.microcopy')}
      </p>

      {/* Large code display with separate Copy button */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border-2 border-primary/40">
          <span className="text-2xl font-mono font-bold tracking-[0.3em] text-primary select-all" dir="ltr">
            {shortCode}
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopyCode}
          className="h-12 w-12 shrink-0"
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Action buttons row */}
      <div className="flex gap-2">
        {/* QR Code button */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 h-9 text-xs gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              {t('familyCode.showQR')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-center">
                {t('familyCode.scanToJoin')}
              </DialogTitle>
              <DialogDescription className="text-center">
                {t('familyCode.scanWithCamera')}
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
              {t('familyCode.familyCode')}: {shortCode}
            </p>
          </DialogContent>
        </Dialog>

        {/* Native Share button (separate from Copy) */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareCode}
          className="flex-1 h-9 text-xs gap-1.5"
        >
          <Share2 className="w-3.5 h-3.5" />
          {t('familyCode.share')}
        </Button>

        {/* Add child button */}
        <Dialog open={showMagicLinkDialog} onOpenChange={(open) => open ? setShowMagicLinkDialog(true) : handleDialogClose()}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex-1 h-9 text-xs gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {t('familyCode.addChild')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t('familyCode.addChildTitle')}
              </DialogTitle>
              <DialogDescription>
                {t('familyCode.addChildDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="child-name">
                  {t('familyCode.childName')}
                </Label>
                <Input
                  id="child-name"
                  placeholder={t('familyCode.childNamePlaceholder')}
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="no-device" className="text-sm font-normal cursor-pointer">
                    {t('familyCode.noSeparateDevice')}
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
                  <p className="text-muted-foreground mb-1">{t('familyCode.link')}</p>
                  <code className="text-primary">{getMagicLinkUrl(childName)}</code>
                </div>
              )}

              {noSeparateDevice && (
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/30 text-sm">
                  <p className="text-muted-foreground">
                    {t('familyCode.noDeviceInfo')}
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
                {t('familyCode.cancel')}
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
                      {t('familyCode.adding')}
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      {t('familyCode.addChild')}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNativeShare}
                  className="w-full sm:w-auto gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {t('familyCode.sendInvite')}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
