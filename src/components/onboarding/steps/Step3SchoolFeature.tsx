import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Backpack, Home, Dumbbell, Lightbulb, Lock,
  ArrowRight, ArrowLeft, Sparkles, Star,
  BookOpen, ClipboardCheck, Zap, Apple, FlaskConical, BarChart3,
  Sun, Bed,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { FocusArea } from './Step2FocusArea';

// Each focus area has exactly 2 starter packs
export type StarterPack =
  | 'school_quest' | 'homework_hero'     // homework (learning)
  | 'morning_pro' | 'room_power'         // home
  | 'daily_dash' | 'fuel_up'             // fitness
  | 'innovation_lab' | 'progress_log';   // project

// Keep backward compat alias
export type SchoolFeature = StarterPack;

interface PackMeta {
  icon: typeof Backpack;
  titleKey: string;
  descKey: string;
}

const PACKS_BY_FOCUS: Record<FocusArea, [StarterPack, StarterPack]> = {
  homework: ['school_quest', 'homework_hero'],
  home:     ['morning_pro', 'room_power'],
  fitness:  ['daily_dash', 'fuel_up'],
  project:  ['innovation_lab', 'progress_log'],
};

const PACK_META: Record<StarterPack, PackMeta> = {
  school_quest:   { icon: Backpack,      titleKey: 'onboarding.step3.pack.school_quest',      descKey: 'onboarding.step3.pack.school_quest.desc' },
  homework_hero:  { icon: BookOpen,      titleKey: 'onboarding.step3.pack.homework_hero',     descKey: 'onboarding.step3.pack.homework_hero.desc' },
  morning_pro:    { icon: Sun,           titleKey: 'onboarding.step3.pack.morning_pro',       descKey: 'onboarding.step3.pack.morning_pro.desc' },
  room_power:     { icon: Home,          titleKey: 'onboarding.step3.pack.room_power',        descKey: 'onboarding.step3.pack.room_power.desc' },
  daily_dash:     { icon: Dumbbell,      titleKey: 'onboarding.step3.pack.daily_dash',        descKey: 'onboarding.step3.pack.daily_dash.desc' },
  fuel_up:        { icon: Apple,         titleKey: 'onboarding.step3.pack.fuel_up',           descKey: 'onboarding.step3.pack.fuel_up.desc' },
  innovation_lab: { icon: FlaskConical,  titleKey: 'onboarding.step3.pack.innovation_lab',    descKey: 'onboarding.step3.pack.innovation_lab.desc' },
  progress_log:   { icon: BarChart3,     titleKey: 'onboarding.step3.pack.progress_log',      descKey: 'onboarding.step3.pack.progress_log.desc' },
};

interface Step3SchoolFeatureProps {
  initialValue?: StarterPack;
  focusArea?: FocusArea;
  onNext: (data: { schoolFeature: StarterPack }) => void;
  onBack: () => void;
}

export function Step3SchoolFeature({ initialValue, focusArea, onNext, onBack }: Step3SchoolFeatureProps) {
  const { t, isRTL, language } = useLanguage();
  const isHe = language === 'he';
  const [selected, setSelected] = useState<StarterPack | null>(initialValue || null);
  const [tappedId, setTappedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialValue) setSelected(initialValue);
  }, [initialValue]);

  // Get the 2 packs for the current focus area (default to homework)
  const activeFocus: FocusArea = focusArea || 'homework';
  const [packA, packB] = PACKS_BY_FOCUS[activeFocus];
  const packs: StarterPack[] = [packA, packB];

  // First pack is always the "most popular" for the focus area
  const popularPack = packA;

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
            const meta = PACK_META[packId];
            const Icon = meta.icon;
            const isSelected = selected === packId;
            const isPopular = popularPack === packId;
            const isTapped = tappedId === packId;

            return (
              <button
                key={packId}
                type="button"
                onClick={() => handleSelect(packId)}
                className={cn(
                  'w-full p-3 rounded-xl border-2 text-start transition-all duration-200 relative',
                  'hover:border-primary/50 hover:bg-primary/5',
                  isTapped && 'scale-[0.96]',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                    : 'border-border bg-card'
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

                <div className="flex items-start gap-2.5">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                    isSelected ? 'bg-primary/20' : 'bg-muted'
                  )}>
                    <Icon className={cn(
                      'w-4.5 h-4.5',
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      'font-bold text-sm leading-tight',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}>
                      {t(meta.titleKey)}
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {t(meta.descKey)}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1 italic">
                      {t('onboarding.step3.includes')}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Pro Teaser Card */}
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
