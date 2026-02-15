import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageStepProps {
  value: 'en' | 'he';
  onChange: (lang: 'en' | 'he') => void;
  onNext: () => void;
}

export function LanguageStep({ value, onChange, onNext }: LanguageStepProps) {
  const { setLanguage, t } = useLanguage();

  const handleSelect = (lang: 'en' | 'he') => {
    onChange(lang);
    setLanguage(lang);
    localStorage.setItem('buff-language', lang);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 pt-8 max-w-sm mx-auto">
      <Globe className="w-12 h-12 text-primary" />

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {t('v2.languageTitle')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('v2.languageDesc')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <button
          onClick={() => handleSelect('he')}
          className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all ${
            value === 'he'
              ? 'border-primary bg-primary/10 shadow-lg'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <span className="text-3xl">🇮🇱</span>
          <span className="font-semibold text-foreground">עברית</span>
        </button>

        <button
          onClick={() => handleSelect('en')}
          className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all ${
            value === 'en'
              ? 'border-primary bg-primary/10 shadow-lg'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <span className="text-3xl">🇺🇸</span>
          <span className="font-semibold text-foreground">English</span>
        </button>
      </div>

      <Button onClick={onNext} className="w-full rounded-2xl h-12 text-base" size="lg">
        {t('v2.continue')}
      </Button>
    </div>
  );
}
