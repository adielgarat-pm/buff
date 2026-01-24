import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Users } from 'lucide-react';
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
    </div>
  );
}
