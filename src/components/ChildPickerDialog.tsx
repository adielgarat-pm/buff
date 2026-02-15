import { Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface Child {
  id: string;
  displayName: string;
  avatar?: string;
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
  title,
  description,
}: ChildPickerDialogProps) {
  const { t } = useLanguage();
  const resolvedTitle = title || t('childPicker.title');
  const resolvedDescription = description || t('childPicker.description');

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
            {resolvedTitle}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {resolvedDescription}
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
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-2xl">
                {child.avatar || '🚀'}
              </div>
              <div className="flex-1 text-right">
                <p className="font-semibold text-foreground">{child.displayName}</p>
                <p className="text-xs text-muted-foreground">{t('childPicker.clickToView')}</p>
              </div>
              <Eye className="w-5 h-5 text-accent/60" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
