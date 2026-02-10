import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Timer, CheckCircle, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Step4FirstTaskProps {
  initialValue?: string;
  onNext: (data: { firstTask: string }) => void;
  onBack: () => void;
}

export function Step4FirstTask({ initialValue, onNext, onBack }: Step4FirstTaskProps) {
  const { t, isRTL } = useLanguage();
  const [firstTask, setFirstTask] = useState(initialValue || '');

  useEffect(() => {
    if (initialValue) setFirstTask(initialValue);
  }, [initialValue]);

  const handleNext = () => {
    onNext({ firstTask: firstTask.trim() || t('onboarding.step4.defaultTask') });
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex-1 px-5 py-3 space-y-3 overflow-y-auto">
        <div className="text-center space-y-1 relative">
          <button
            type="button"
            onClick={onBack}
            className={`absolute ${isRTL ? 'right-0 -mr-1.5' : 'left-0 -ml-1.5'} top-0 p-1.5 rounded-full hover:bg-muted transition-colors`}
            aria-label={t('onboarding.step1.back')}
          >
            <BackArrow className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-base font-bold text-foreground">
            {t('onboarding.step4.title')}
          </h1>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-start gap-2 p-2 rounded-xl bg-card border border-border">
            <Timer className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: t('onboarding.step4.tip1') }} />
          </div>
          
          <div className="flex items-start gap-2 p-2 rounded-xl bg-card border border-border">
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: t('onboarding.step4.tip2') }} />
          </div>
          
          <div className="flex items-start gap-2 p-2 rounded-xl bg-card border border-border">
            <Sparkles className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: t('onboarding.step4.tip3') }} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="firstTask" className="block font-semibold text-sm">
            {t('onboarding.step4.label')}
          </Label>
          <Input
            id="firstTask"
            value={firstTask}
            onChange={(e) => setFirstTask(e.target.value)}
            placeholder={t('onboarding.step4.placeholder')}
            className="h-11 text-base"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          <p className="text-xs text-muted-foreground">
            {t('onboarding.step4.hint')}
          </p>
        </div>
      </div>

      <div className="px-5 pb-6 pt-3 flex-shrink-0 bg-background">
        <Button 
          onClick={handleNext}
          className="w-full h-11 font-bold rounded-xl bg-gradient-to-l from-primary to-success"
        >
          {t('onboarding.step4.cta')}
        </Button>
      </div>
    </div>
  );
}
