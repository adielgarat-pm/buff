import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Backpack, Home, Dumbbell, Lock,
  ArrowRight, ArrowLeft, Sparkles, Star,
  BookOpen, Apple, FlaskConical,
  Sun, Bed, Crown,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { FocusArea } from './Step2FocusArea';
import { useSubscription } from '@/hooks/useSubscription';
import {
  StarterPack,
  PACKS_BY_FOCUS,
  PACK_DEFINITIONS,
} from '@/data/starterPacks';

// Keep backward compat alias
export type SchoolFeature = StarterPack;
export type { StarterPack };

const ICON_MAP: Record<string, typeof Backpack> = {
  Backpack, BookOpen, Sun, Bed, Dumbbell, Apple, FlaskConical,
};

interface Step3SchoolFeatureProps {
  initialValue?: StarterPack;
  focusArea?: FocusArea;
  onNext: (data: { schoolFeature: StarterPack }) => void;
  onBack: () => void;
  onUpgrade?: () => void;
}

export function Step3SchoolFeature({ initialValue, focusArea, onNext, onBack, onUpgrade }: Step3SchoolFeatureProps) {
  const { t, isRTL, language } = useLanguage();
  const isHe = language === 'he';
  const { isProUser } = useSubscription();
  const [selected, setSelected] = useState<StarterPack | null>(initialValue || null);
  const [tappedId, setTappedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialValue) setSelected(initialValue);
  }, [initialValue]);

  const activeFocus: FocusArea = focusArea || 'homework';
  const packs = PACKS_BY_FOCUS[activeFocus];

  // First free pack is the "most popular"
  const popularPack = packs.find(p => !PACK_DEFINITIONS[p].isPremium) || packs[0];

  // Reset selection if it doesn't belong to the current focus area
  useEffect(() => {
    if (selected && !packs.includes(selected)) {
      setSelected(null);
    }
  }, [activeFocus]);

  const handleNext = () => {
    if (selected) {
      setTappedId('cta');
      onNext({ schoolFeature: selected });
    }
  };

  const handleSelect = (pack: StarterPack) => {
    const def = PACK_DEFINITIONS[pack];
    if (def.isPremium && !isProUser) {
      onUpgrade?.();
      return;
    }
    setSelected(pack);
    setTappedId(pack);
    setTimeout(() => setTappedId(null), 200);
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex-1 px-4 pt-2 pb-2 space-y-2.5 overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-0.5 relative">
          <button
            type="button"
            onClick={onBack}
            className="absolute start-0 top-0 p-1.5 rounded-full hover:bg-muted transition-colors"
            aria-label={isHe ? 'חזרה' : 'Back'}
          >
            <BackArrow className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
          </div>
          <h1 className="text-base font-bold text-foreground leading-tight px-6">
            {t('onboarding.step3.title')}
          </h1>
          <p className="text-[11px] text-muted-foreground">
            {t('onboarding.step3.subtitle')}
          </p>
        </div>

        {/* Starter Pack Cards */}
        <div className="space-y-2">
          {packs.map((packId) => {
            const def = PACK_DEFINITIONS[packId];
            const Icon = ICON_MAP[def.iconName] || Backpack;
            const isSelected = selected === packId;
            const isPopular = popularPack === packId && !def.isPremium;
            const isTapped = tappedId === packId;
            const isLocked = def.isPremium && !isProUser;

            return (
              <button
                key={packId}
                type="button"
                onClick={() => handleSelect(packId)}
                className={cn(
                  'w-full p-3 rounded-xl border-2 text-start transition-all duration-200 relative',
                  isTapped && 'scale-[0.96]',
                  isLocked
                    ? 'border-dashed border-border/60 bg-muted/30 opacity-70'
                    : isSelected
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                )}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <span className={cn(
                    'absolute -top-2.5 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
                    isRTL ? 'end-3' : 'start-3'
                  )}>
                    <Star className="w-3 h-3 fill-current" />
                    {t('onboarding.step3.mostPopular')}
                  </span>
                )}

                {/* PRO Badge */}
                {def.isPremium && (
                  <span className={cn(
                    'absolute -top-2.5 bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
                    isRTL ? 'start-3' : 'end-3'
                  )}>
                    {isLocked ? <Lock className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                    PRO
                  </span>
                )}

                <div className="flex items-start gap-2.5">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                    isLocked ? 'bg-muted' : isSelected ? 'bg-primary/20' : 'bg-muted'
                  )}>
                    {isLocked
                      ? <Lock className="w-4.5 h-4.5 text-muted-foreground" />
                      : <Icon className={cn('w-4.5 h-4.5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      'font-bold text-sm leading-tight',
                      isLocked ? 'text-muted-foreground' : isSelected ? 'text-primary' : 'text-foreground'
                    )}>
                      {t(def.titleKey)}
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {t(def.descKey)}
                    </p>
                    {!isLocked && def.tasks.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/70 mt-1 italic">
                        {t('onboarding.step3.includes').replace('{n}', String(def.tasks.length))}
                      </p>
                    )}
                    {isLocked && (
                      <p className="text-[10px] text-primary/70 mt-1 font-medium">
                        {t('onboarding.step3.upgradeToUnlock')}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Global Pro Teaser (only if project focus doesn't already show a premium pack) */}
        {activeFocus !== 'project' && activeFocus !== 'homework' && (
          <div className="p-3 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 opacity-70 relative">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-muted-foreground leading-tight">
                    {t('onboarding.step3.proPacks')}
                  </h3>
                  <span className="text-[9px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/70 leading-snug mt-0.5">
                  {t('onboarding.step3.proDesc')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Note */}
        <p className="text-[10px] text-muted-foreground text-center">
          {t('onboarding.step3.note')}
        </p>
      </div>

      {/* CTA */}
      <div className="px-4 pb-5 pt-2 flex-shrink-0 bg-background">
        <Button
          onClick={handleNext}
          disabled={!selected}
          className="w-full h-11 font-bold rounded-xl bg-gradient-to-l from-primary to-success"
        >
          {t('onboarding.step3.cta')}
        </Button>
      </div>
    </div>
  );
}
