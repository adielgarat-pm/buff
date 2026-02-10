import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { User, Users, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface Child {
  id: string;
  displayName: string;
}

interface DuplicateToChildModalProps {
  open: boolean;
  onClose: () => void;
  children: Child[];
  currentChildId: string;
  itemType: 'task' | 'reward';
  itemTitle: string;
  onDuplicate: (targetChildIds: string[]) => Promise<void>;
}

export function DuplicateToChildModal({
  open,
  onClose,
  children,
  currentChildId,
  itemType,
  itemTitle,
  onDuplicate,
}: DuplicateToChildModalProps) {
  const { t } = useLanguage();
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter out the current child
  const otherChildren = children.filter(c => c.id !== currentChildId);

  // Auto-select if there's only one other child
  useEffect(() => {
    if (open && otherChildren.length === 1) {
      setSelectedChildIds([otherChildren[0].id]);
    }
  }, [open, otherChildren.length]);

  const handleToggleChild = (childId: string) => {
    setSelectedChildIds(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const handleSelectAll = () => {
    if (selectedChildIds.length === otherChildren.length) {
      setSelectedChildIds([]);
    } else {
      setSelectedChildIds(otherChildren.map(c => c.id));
    }
  };

  const handleDuplicate = async () => {
    if (selectedChildIds.length === 0) return;
    
    setIsLoading(true);
    try {
      await onDuplicate(selectedChildIds);
      onClose();
      setSelectedChildIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setSelectedChildIds([]);
    }
  };

  const typeLabel = itemType === 'task' ? t('duplicate.copyTask') : t('duplicate.copyReward');
  const allSelected = selectedChildIds.length === otherChildren.length && otherChildren.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-right font-display">
            {typeLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item being copied */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <p className="text-sm text-muted-foreground">{t('duplicate.copying')}</p>
            <p className="font-semibold text-foreground">{itemTitle}</p>
          </div>

          {otherChildren.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('duplicate.noOtherChildren')}</p>
              <p className="text-xs mt-1">{t('duplicate.addChildHint')}</p>
            </div>
          ) : (
            <>
              {/* Select All Option */}
              {otherChildren.length > 1 && (
                <button
                  onClick={handleSelectAll}
                  className={cn(
                    "w-full p-3 rounded-xl border transition-all flex items-center gap-3",
                    allSelected
                      ? "bg-primary/10 border-primary text-foreground"
                      : "bg-card border-border hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    allSelected ? "bg-primary text-primary-foreground" : "bg-secondary"
                  )}>
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-right font-medium">{t('duplicate.allChildren')}</span>
                  {allSelected && <Check className="w-5 h-5 text-primary" />}
                </button>
              )}

              {/* Individual Children */}
              <div className="space-y-2">
                {otherChildren.map(child => {
                  const isSelected = selectedChildIds.includes(child.id);
                  return (
                    <button
                      key={child.id}
                      onClick={() => handleToggleChild(child.id)}
                      className={cn(
                        "w-full p-3 rounded-xl border transition-all flex items-center gap-3",
                        isSelected
                          ? "bg-primary/10 border-primary text-foreground"
                          : "bg-card border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary"
                      )}>
                        <User className="w-4 h-4" />
                      </div>
                      <span className="flex-1 text-right font-medium">{child.displayName}</span>
                      {isSelected && <Check className="w-5 h-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleDuplicate}
              disabled={selectedChildIds.length === 0 || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <>{t('duplicate.copy')} ({selectedChildIds.length})</>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('duplicate.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
