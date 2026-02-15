import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LegalDisclaimer } from './LegalDisclaimer';

interface GlobalFooterProps {
  className?: string;
}

export function GlobalFooter({ className }: GlobalFooterProps) {
  const { t } = useLanguage();
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  return (
    <>
      <footer className={`w-full py-4 text-center space-y-2 ${className || ''}`}>
        <button
          type="button"
          onClick={() => setDisclaimerOpen(true)}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
        >
          {t('legal.footerLink')}
        </button>
        
        {/* Lovable Attribution */}
        <p className="text-xs text-muted-foreground/70">
          {t('footer.lovableAttribution')}{' '}
          <a
            href="https://lovable.dev/invite/PKVK9J3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/60 hover:text-primary hover:underline transition-colors"
          >
            Lovable
          </a>
        </p>
      </footer>
      <LegalDisclaimer open={disclaimerOpen} onOpenChange={setDisclaimerOpen} />
    </>
  );
}
