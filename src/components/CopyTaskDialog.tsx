import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Copy, User, Check } from 'lucide-react';
import { Task } from '@/types/task';
import { FamilyMember } from '@/hooks/useFamilyMembers';

interface CopyTaskDialogProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  children: FamilyMember[];
  currentChildId: string;
  onCopy: (task: Task, targetChildId: string) => void;
}

export function CopyTaskDialog({
  open,
  onClose,
  task,
  children,
  currentChildId,
  onCopy,
}: CopyTaskDialogProps) {
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Filter out current child
  const otherChildren = children.filter((c) => c.id !== currentChildId);

  const handleCopy = () => {
    if (task && selectedChildId) {
      onCopy(task, selectedChildId);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setSelectedChildId('');
        onClose();
      }, 1000);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedChildId('');
      setCopied(false);
      onClose();
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Copy className="w-5 h-5 text-primary" />
            Copy Task
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Copy "{task.title}" to another child
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Preview */}
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="font-medium text-foreground text-sm">{task.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {task.time} • {task.credits} credits • {task.category}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground/70 mt-1 truncate">
                📝 {task.description}
              </p>
            )}
          </div>

          {/* Child Selection */}
          {otherChildren.length === 0 ? (
            <div className="p-4 rounded-lg bg-secondary/30 text-center">
              <p className="text-sm text-muted-foreground">
                No other children to copy to
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Copy to:</Label>
              <RadioGroup
                value={selectedChildId}
                onValueChange={setSelectedChildId}
                className="space-y-2"
              >
                {otherChildren.map((child) => (
                  <label
                    key={child.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 cursor-pointer transition-colors"
                  >
                    <RadioGroupItem value={child.id} id={child.id} />
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground text-sm">
                      {child.displayName}
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCopy}
            disabled={!selectedChildId || copied}
            className="bg-primary text-primary-foreground"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Task
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
