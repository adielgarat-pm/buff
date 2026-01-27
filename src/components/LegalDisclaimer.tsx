import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';

interface LegalDisclaimerProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LegalDisclaimer({ trigger, open, onOpenChange }: LegalDisclaimerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { t } = useLanguage();
  
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const disclaimerTextHe = `הבהרה חשובה: האפליקציה Buff היא כלי טכנולוגי לניהול משימות והתארגנות, שפותח על בסיס ניסיון אישי וכלים מעולם ניהול המוצר וההורות. השימוש באפליקציה, ובכלל זה ה"תובנות" המופיעות בה, נועד למטרות העשרה וסיוע בלבד ואינו מהווה תחליף לייעוץ רפואי, פסיכולוגי, אבחוני או טיפולי מקצועי. יוצרת האפליקציה אינה מטפלת מוסמכת, רופאה או פסיכולוגית. בכל שאלה הנוגעת לבריאותו הגופנית או הנפשית של ילדכם, יש להיוועץ באנשי מקצוע מוסמכים. השימוש באפליקציה הוא באחריות המשתמש בלבד.`;

  const disclaimerTextEn = `Important Disclaimer: The Buff app is a technological tool for task management and organization, developed based on personal experience and tools from product management and parenting. The use of the app, including the "insights" it provides, is intended for enrichment and assistance purposes only and does not constitute a substitute for medical, psychological, diagnostic, or professional therapeutic advice. The app's creator is not a licensed therapist, doctor, or psychologist. For any questions regarding your child's physical or mental health, please consult qualified professionals. Use of the app is at the user's sole responsibility.`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t('legal.title')}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="p-1">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {t('legal.disclaimer')}
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Inline link component for use in auth forms
export function LegalDisclaimerLink({ className }: { className?: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-primary hover:underline focus:outline-none ${className || ''}`}
      >
        {t('legal.termsLink')}
      </button>
      <LegalDisclaimer open={open} onOpenChange={setOpen} />
    </>
  );
}
