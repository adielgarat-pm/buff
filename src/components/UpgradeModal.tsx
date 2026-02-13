import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Palette, PawPrint, PartyPopper } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const { isGracePeriod } = useSubscription();

  const title = isHe ? 'שדרג ל-BUFF Pro' : 'Upgrade to BUFF Pro';
  const description = isHe
    ? 'פתח תכונות פרימיום ושדרג את החוויה שלך'
    : 'Unlock premium features and supercharge your experience';

  const features = isHe
    ? [
        { icon: Palette, text: 'ערכות נושא וצבעים מותאמים' },
        { icon: Crown, text: 'אווטרים בלעדיים' },
        { icon: PawPrint, text: 'חיית מחמד וירטואלית' },
        { icon: Sparkles, text: 'תכונות בונוס ועוד...' },
      ]
    : [
        { icon: Palette, text: 'Custom themes & colors' },
        { icon: Crown, text: 'Exclusive avatars' },
        { icon: PawPrint, text: 'Virtual pet companion' },
        { icon: Sparkles, text: 'Bonus features & more...' },
      ];

  const comingSoon = isHe ? 'בקרוב!' : 'Coming Soon!';
  const graceBanner = isHe
    ? '🎉 מתנת השקה: כל פיצ\'רי הפרו פתוחים עד ה-27.2!'
    : '🎉 Launch Gift: All Pro features are open until Feb 27!';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir={isHe ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="w-6 h-6 text-yellow-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isGracePeriod && (
          <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs font-medium text-primary">
            <PartyPopper className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{graceBanner}</span>
          </div>
        )}

        <ul className="space-y-3 my-4">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <f.icon className="w-5 h-5 text-primary shrink-0" />
              <span>{f.text}</span>
            </li>
          ))}
        </ul>

        <Button className="w-full" disabled>
          <Crown className="w-4 h-4" />
          {comingSoon}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
