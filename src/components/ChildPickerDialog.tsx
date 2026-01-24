import { User, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { cn } from '@/lib/utils';

interface Child {
  id: string;
  displayName: string;
}

interface ChildPickerDialogProps {
  open: boolean;
  onClose: () => void;
  children: Child[];
  onSelectChild: (childId: string) => void;
  title?: string;
  description?: string;
}

export function ChildPickerDialog({
  open,
  onClose,
  children,
  onSelectChild,
  title = 'בחר ילד',
  description = 'בחר את הילד שברצונך לצפות בחוויה שלו',
}: ChildPickerDialogProps) {
  const handleSelect = (childId: string) => {
    onSelectChild(childId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => handleSelect(child.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl",
                "bg-secondary/50 border border-border",
                "hover:border-accent/50 hover:bg-accent/10",
                "transition-all duration-200 touch-target",
                "active:scale-[0.98]"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <User className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 text-right">
                <p className="font-semibold text-foreground">{child.displayName}</p>
                <p className="text-xs text-muted-foreground">לחץ לצפייה</p>
              </div>
              <Eye className="w-5 h-5 text-accent/60" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
