import { useState } from 'react';
import { HelpCircle, Play, MessageCircle, Mail, Copy, Check, ChevronDown, ChevronUp, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { toast } from 'sonner';

/**
 * Share installation guide via different methods
 */
function shareInstallGuide(method: 'whatsapp' | 'email' | 'copy') {
  const url = `${window.location.origin}/install`;
  const message = 'צפו בסרטון הקצר כדי להתקין את BUFF על הטלפון 📱';

  switch (method) {
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(message + '\n\n' + url)}`, '_blank');
      break;
    case 'email':
      window.open(`mailto:?subject=${encodeURIComponent('התקנת BUFF')}&body=${encodeURIComponent(message + '\n\n' + url)}`, '_blank');
      break;
    case 'copy':
      navigator.clipboard.writeText(url).then(() => {
        toast.success('הלינק הועתק!');
      }).catch(() => {
        toast.error('שגיאה בהעתקה');
      });
      break;
  }
}

export function ParentHelpSection() {
  const [expanded, setExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopy = () => {
    shareInstallGuide('copy');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center gap-3 text-right hover:bg-muted/30 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">עזרה והתקנה</h2>
          <p className="text-xs text-muted-foreground">סרטון הדרכה ושיתוף לילדים</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
              {/* Video Player */}
              <div className="rounded-xl overflow-hidden bg-muted">
                <div className="aspect-video">
                  <video
                    src="/videos/install-guide.mp4"
                    muted
                    playsInline
                    controls
                    className="w-full h-full object-cover"
                  >
                    הדפדפן שלכם לא תומך בווידאו
                  </video>
                </div>
              </div>

              {/* Video label */}
              <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                סרטון הדרכה קצר - איך להתקין את BUFF
              </p>

              {/* Share Section */}
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  שלח מדריך התקנה לילד:
                </p>
                
                <div className="grid grid-cols-3 gap-2">
                  {/* WhatsApp */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareInstallGuide('whatsapp')}
                    className="flex-col h-auto py-3 gap-1.5"
                  >
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <span className="text-xs">WhatsApp</span>
                  </Button>

                  {/* Email */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareInstallGuide('email')}
                    className="flex-col h-auto py-3 gap-1.5"
                  >
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-xs">אימייל</span>
                  </Button>

                  {/* Copy Link */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex-col h-auto py-3 gap-1.5"
                  >
                    {copiedLink ? (
                      <Check className="w-5 h-5 text-primary" />
                    ) : (
                      <Copy className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="text-xs">{copiedLink ? 'הועתק!' : 'העתק לינק'}</span>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
