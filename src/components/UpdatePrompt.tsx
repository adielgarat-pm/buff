import { RefreshCw, X } from 'lucide-react';
import { Button } from './ui/button';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function UpdatePrompt() {
  const { needsUpdate, updateServiceWorker, isUpdating } = useServiceWorkerUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!needsUpdate || dismissed) return null;

  return (
    <div className={cn(
      "fixed top-4 left-4 right-4 z-50 animate-fade-in",
      "bg-primary text-primary-foreground rounded-xl shadow-lg",
      "p-4 flex items-center gap-3"
    )}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">גרסה חדשה זמינה! 🚀</p>
        <p className="text-xs opacity-90">עדכן עכשיו לקבלת השיפורים האחרונים</p>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="secondary"
          onClick={updateServiceWorker}
          disabled={isUpdating}
          className="h-9 px-3 bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
        >
          {isUpdating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="w-4 h-4 ml-1" />
              עדכן
            </>
          )}
        </Button>
        
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          aria-label="סגור"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
