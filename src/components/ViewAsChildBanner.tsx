import { ArrowRight, Eye } from 'lucide-react';
import { Button } from './ui/button';

interface ViewAsChildBannerProps {
  childName: string;
  onExitViewAsChild: () => void;
}

export function ViewAsChildBanner({ childName, onExitViewAsChild }: ViewAsChildBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-accent text-accent-foreground">
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between safe-area-px">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">
            צפייה כ-{childName}
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={onExitViewAsChild}
          className="h-7 text-xs bg-accent-foreground/20 hover:bg-accent-foreground/30 text-accent-foreground border-0"
        >
          <ArrowRight className="w-3 h-3 ml-1" />
          חזרה להורה
        </Button>
      </div>
    </div>
  );
}
