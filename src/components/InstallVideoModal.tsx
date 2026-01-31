import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface InstallVideoModalProps {
  open: boolean;
  onClose: () => void;
}

export function InstallVideoModal({ open, onClose }: InstallVideoModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border-border">
        <DialogTitle className="sr-only">מדריך התקנת BUFF</DialogTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            איך להתקין את BUFF?
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Video */}
        <div className="aspect-video bg-muted">
          <video
            src="/videos/install-guide.mp4"
            autoPlay
            muted
            playsInline
            controls
            className="w-full h-full object-cover"
          >
            הדפדפן שלכם לא תומך בווידאו
          </video>
        </div>

        {/* Footer with tips */}
        <div className="p-4 space-y-3 bg-muted/30">
          <div className="flex items-start gap-3 text-sm">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
              1
            </span>
            <p className="text-muted-foreground">לחצו על כפתור השיתוף/תפריט</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
              2
            </span>
            <p className="text-muted-foreground">בחרו "הוסף למסך הבית"</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
              3
            </span>
            <p className="text-muted-foreground">לחצו "הוסף" וזהו!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
