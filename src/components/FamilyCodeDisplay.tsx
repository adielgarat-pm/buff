import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Users, Send } from 'lucide-react';
import { toast } from 'sonner';

interface FamilyCodeDisplayProps {
  familyId: string;
}

export function FamilyCodeDisplay({ familyId }: FamilyCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(familyId);
      setCopied(true);
      toast.success('Family code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    const appUrl = window.location.origin;
    const shareText = `🎮 הצטרף/י למשפחה שלנו ב-Daily Quests!

📱 איך להצטרף:
1. היכנס/י לאפליקציה: ${appUrl}
2. לחץ/י על "Sign Up"
3. מלא/י שם, אימייל וסיסמה
4. בחר/י "Child" (ילד)
5. הדבק/י את קוד המשפחה הזה:

🔑 ${familyId}

6. לחץ/י על "Create Account"

זהו! ✨ נתראה באפליקציה!`;

    // Try native share first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'הצטרף ל-Daily Quests',
          text: shareText,
        });
        toast.success('Shared successfully!');
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Message copied! Send it to your child via WhatsApp or SMS');
    } catch {
      toast.error('Failed to share');
    }
  };

  return (
    <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Family Code</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Share this code with your child so they can join your family and sync their progress.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono text-foreground truncate">
          {familyId}
        </code>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <Check className="w-4 h-4 text-primary" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
      <Button
        size="sm"
        variant="default"
        onClick={handleShare}
        className="w-full mt-3"
      >
        <Send className="w-4 h-4 mr-2" />
        Send to Child
      </Button>
    </div>
  );
}
