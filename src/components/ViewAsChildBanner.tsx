import { ArrowRight, ArrowLeft, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface ViewAsChildBannerProps {
  childName: string;
  onExitViewAsChild: () => void;
}

export function ViewAsChildBanner({ childName, onExitViewAsChild }: ViewAsChildBannerProps) {
  const { t, isRTL } = useLanguage();
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex justify-center safe-area-px pt-2 px-3">
      <div
        className="w-full max-w-lg rounded-2xl shadow-md py-3 px-6 flex items-center justify-between"
        style={{ backgroundColor: '#84e1bc' }}
      >
        {/* Left: Back to Parent */}
        <Button
          size="sm"
          variant="secondary"
          onClick={onExitViewAsChild}
          className="h-9 text-sm font-medium rounded-xl bg-white/60 hover:bg-white/80 text-foreground border-0 shadow-sm gap-1.5 px-3"
        >
          <BackArrow className="w-4 h-4" />
          {t('viewAsChild.backToParent')}
        </Button>

        {/* Right: Status Badge */}
        <Badge
          variant="outline"
          className="h-8 px-3 rounded-xl bg-white/40 border-white/50 text-foreground font-medium text-sm gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          {t('viewAsChild.viewing')}{childName}
        </Badge>
      </div>
    </div>
  );
}
