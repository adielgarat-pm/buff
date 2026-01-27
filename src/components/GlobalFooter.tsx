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
      <footer className={`w-full py-4 text-center ${className || ''}`}>
        <button
          type="button"
          onClick={() => setDisclaimerOpen(true)}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
        >
          {t('legal.footerLink')}
        </button>
      </footer>
      <LegalDisclaimer open={disclaimerOpen} onOpenChange={setDisclaimerOpen} />
    </>
  );
}
