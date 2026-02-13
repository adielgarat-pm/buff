import { useState, useCallback } from 'react';
import {
  Sparkles, 
  Trophy, 
  Calendar, 
  Brain,
  Heart,
  X,
  Share2,
  Zap,
  Shield,
  Flame,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from './ui/carousel';

interface BuffPhilosophyPageProps {
  onBack?: () => void;
  isModal?: boolean;
  onClose?: () => void;
  onNavigateToSettings?: () => void;
  onStartOnboarding?: () => void;
}

const CARD_THEMES = [
  { bg: 'from-indigo-500/15 to-purple-500/10', border: 'border-indigo-500/20', icon: 'from-indigo-500 to-purple-600', dot: 'bg-indigo-500', punchline: 'text-indigo-600 dark:text-indigo-400' },
  { bg: 'from-rose-500/15 to-pink-500/10', border: 'border-rose-500/20', icon: 'from-rose-500 to-pink-600', dot: 'bg-rose-500', punchline: 'text-rose-600 dark:text-rose-400' },
  { bg: 'from-green-500/15 to-emerald-500/10', border: 'border-green-500/20', icon: 'from-green-500 to-emerald-600', dot: 'bg-green-500', punchline: 'text-green-600 dark:text-green-400' },
  { bg: 'from-amber-500/15 to-orange-500/10', border: 'border-amber-500/20', icon: 'from-amber-500 to-orange-600', dot: 'bg-amber-500', punchline: 'text-amber-600 dark:text-amber-400' },
  { bg: 'from-emerald-500/15 to-teal-500/10', border: 'border-emerald-500/20', icon: 'from-emerald-500 to-teal-600', dot: 'bg-emerald-500', punchline: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'from-blue-500/15 to-cyan-500/10', border: 'border-blue-500/20', icon: 'from-blue-500 to-cyan-600', dot: 'bg-blue-500', punchline: 'text-blue-600 dark:text-blue-400' },
  { bg: 'from-green-500/15 to-lime-500/10', border: 'border-green-500/20', icon: 'from-green-500 to-lime-600', dot: 'bg-green-500', punchline: 'text-green-600 dark:text-green-400' },
];

export function BuffPhilosophyPage({ onBack, isModal, onClose, onNavigateToSettings, onStartOnboarding }: BuffPhilosophyPageProps) {
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const philosophyPoints = [
    { id: 'branding', icon: Zap, title: t('philosophy.branding.title'), buffInsight: t('philosophy.branding.insight') },
    { id: 'rewards', icon: Trophy, title: t('philosophy.rewards.title'), buffInsight: t('philosophy.rewards.insight') },
    { id: 'positive', icon: Shield, title: t('philosophy.positive.title'), buffInsight: t('philosophy.positive.insight') },
    { id: 'bonus', icon: Heart, title: t('philosophy.bonus.title'), buffInsight: t('philosophy.bonus.insight') },
    { id: 'dayTypes', icon: Calendar, title: t('philosophy.dayTypes.title'), buffInsight: t('philosophy.dayTypes.insight') },
    { id: 'smartGoal', icon: Flame, title: t('philosophy.smartGoal.title'), buffInsight: t('philosophy.smartGoal.insight') },
    { id: 'community', icon: MessageCircle, title: t('philosophy.community.title'), buffInsight: t('philosophy.community.insight'), isWhatsApp: true },
  ];

  const onApiChange = useCallback((emblaApi: CarouselApi) => {
    if (!emblaApi) return;
    setApi(emblaApi);
    setCurrent(emblaApi.selectedScrollSnap());
    emblaApi.on('select', () => setCurrent(emblaApi.selectedScrollSnap()));
  }, []);

  const handleStartClick = () => {
    if (isModal && onClose) onClose();
    if (onStartOnboarding) onStartOnboarding();
    else if (onNavigateToSettings) onNavigateToSettings();
    else if (onBack) onBack();
    else navigate('/dashboard');
  };

  const handleShare = () => {
    const shareText = language === 'he'
      ? `🎮 *${t('philosophy.title')}*\n🔗 https://buff.lovable.app`
      : `🎮 *${t('philosophy.title')}*\n🔗 https://buff.lovable.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div className="theme-parent-zen flex flex-col overflow-hidden" style={{ height: isModal ? '90vh' : '100dvh' }}>
      {/* Header */}
      <div className={`shrink-0 ${isModal ? 'px-4 pt-3' : 'max-w-2xl mx-auto w-full px-5 pt-3'}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <Brain className="w-4 h-4 text-primary shrink-0" />
            <h1 className="text-sm font-bold text-foreground font-display truncate">
              {t('philosophy.title')}
            </h1>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="outline" size="icon" onClick={handleShare} className="w-8 h-8 rounded-xl touch-target text-primary hover:bg-primary/10 border-primary/30">
              <Share2 className="w-3.5 h-3.5" />
            </Button>
            {isModal && onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8 rounded-xl touch-target">
                <X className="w-4 h-4" />
              </Button>
            )}
            {!isModal && onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="w-8 h-8 rounded-xl touch-target text-muted-foreground">
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Carousel – fills remaining space */}
      <div dir={isRTL ? 'rtl' : 'ltr'} className={`flex-1 min-h-0 flex flex-col ${isModal ? 'px-2' : 'max-w-2xl mx-auto w-full px-3'}`}>
        <Carousel
          setApi={onApiChange}
          opts={{ align: 'start', loop: false, direction: isRTL ? 'rtl' : 'ltr', containScroll: false }}
          className="flex-1 min-h-0 flex flex-col"
        >
          <CarouselContent className="-ml-2 h-full">
            {philosophyPoints.map((point, index) => {
              const theme = CARD_THEMES[index];
              const IconComp = point.icon;
              return (
                <CarouselItem
                  key={point.id}
                  className={`pl-2 ${isMobile ? 'basis-[88%]' : 'basis-1/2 lg:basis-1/3'}`}
                >
                  {/* Poster Card */}
                  <div className={`relative rounded-3xl border ${theme.border} bg-gradient-to-b ${theme.bg} shadow-lg h-full flex flex-col items-center justify-center text-center overflow-hidden px-6 py-8`}>
                    {/* Counter */}
                    <span className="absolute top-3 right-3 text-[10px] font-medium text-muted-foreground/60">
                      {index + 1}/{philosophyPoints.length}
                    </span>

                    {/* Spacer top */}
                    <div className="flex-1" />

                    {/* HUGE Icon */}
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${theme.icon} text-white flex items-center justify-center shadow-xl mb-6`}>
                      <IconComp className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={1.5} />
                    </div>

                    {/* Massive Title */}
                    <h2 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight mb-8 max-w-[280px]">
                      {point.title}
                    </h2>

                    {/* Spacer middle */}
                    <div className="flex-1" />

                    {/* Punchline */}
                    <p className={`text-sm sm:text-base font-semibold leading-relaxed ${theme.punchline} max-w-[260px]`}>
                      {point.buffInsight}
                    </p>

                    {/* WhatsApp CTA for community card */}
                    {point.isWhatsApp && (
                      <a
                        href={t('philosophy.community.link')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br ${theme.icon} text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {t('philosophy.community.buttonText')}
                      </a>
                    )}

                    {/* Spacer bottom */}
                    <div className="flex-[0.5]" />
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 py-2 shrink-0">
          <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={() => api?.scrollPrev()} disabled={current === 0}>
            {isRTL ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </Button>
          <div className="flex items-center gap-1.5">
            {philosophyPoints.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? `w-5 h-1.5 ${CARD_THEMES[i].dot}` : 'w-1.5 h-1.5 bg-muted-foreground/25'
                }`}
              />
            ))}
          </div>
          <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={() => api?.scrollNext()} disabled={current === philosophyPoints.length - 1}>
            {isRTL ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* CTA pinned bottom */}
      <div className={`shrink-0 ${isModal ? 'px-4' : 'max-w-2xl mx-auto w-full px-5'}`} style={{ paddingBottom: isModal ? '0.75rem' : 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <Button
          onClick={handleStartClick}
          className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all touch-target"
        >
          <Sparkles className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('philosophy.letsStart')}
        </Button>
      </div>
    </div>
  );
}
