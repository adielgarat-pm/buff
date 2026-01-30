import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ParentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  familyName: string;
  childName?: string;
}

export function ParentSummaryModal({
  isOpen,
  onClose,
  familyId,
  familyName,
  childName,
}: ParentSummaryModalProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-parent-summary', {
        body: { family_id: familyId, child_name: childName },
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSummary(data.summary);
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת הסיכום');
      toast.error('שגיאה ביצירת הסיכום');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!summary) return;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success('הסיכום הועתק ללוח!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('שגיאה בהעתקה');
    }
  };

  const handleClose = () => {
    setSummary(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            סיכום שבועי - {familyName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {!summary && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <p className="text-muted-foreground text-center">
                לחץ על הכפתור כדי ליצור סיכום שבועי מותאם אישית עבור המשפחה
              </p>
              <Button onClick={generateSummary} className="gap-2">
                <Sparkles className="w-4 h-4" />
                צור סיכום עם AI
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">מייצר סיכום מותאם אישית...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <p className="text-destructive text-center">{error}</p>
              <Button onClick={generateSummary} variant="outline">
                נסה שוב
              </Button>
            </div>
          )}

          {summary && (
            <>
              <ScrollArea className="flex-1 min-h-0 border rounded-lg p-4 bg-muted/30">
                <div className="whitespace-pre-wrap text-sm leading-relaxed" dir="rtl">
                  {summary}
                </div>
              </ScrollArea>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={copyToClipboard}
                  className="flex-1 gap-2"
                  variant={copied ? 'outline' : 'default'}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      הועתק!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      העתק ללוח
                    </>
                  )}
                </Button>
                <Button onClick={generateSummary} variant="outline" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  צור מחדש
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
