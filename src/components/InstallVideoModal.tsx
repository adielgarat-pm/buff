import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface InstallVideoModalProps {
  open: boolean;
  onClose: () => void;
}

export function InstallVideoModal({ open, onClose }: InstallVideoModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border-border">
        <DialogTitle className="sr-only">{t('installVideo.title')}</DialogTitle>
        
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{t('installVideo.header')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="aspect-[9/16] max-h-[50vh] bg-black">
          <video src="/videos/install-guide.mp4" autoPlay muted playsInline controls className="w-full h-full object-contain">
            {t('installVideo.videoFallback')}
          </video>
        </div>

        <div className="p-4 space-y-3 bg-muted/30">
          <div className="flex items-start gap-3 text-sm">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">1</span>
            <p className="text-muted-foreground">{t('installVideo.step1')}</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">2</span>
            <p className="text-muted-foreground">{t('installVideo.step2')}</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">3</span>
            <p className="text-muted-foreground">{t('installVideo.step3')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
