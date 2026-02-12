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

const CARD_COLORS = [
  { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: 'bg-gradient-to-br from-indigo-500 to-purple-600', dot: 'bg-indigo-500', takeaway: 'bg-indigo-500/8 border-indigo-500/15' },
  { bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: 'bg-gradient-to-br from-rose-500 to-pink-600', dot: 'bg-rose-500', takeaway: 'bg-rose-500/8 border-rose-500/15' },
  { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: 'bg-gradient-to-br from-green-500 to-emerald-600', dot: 'bg-green-500', takeaway: 'bg-green-500/8 border-green-500/15' },
  { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'bg-gradient-to-br from-amber-500 to-orange-600', dot: 'bg-amber-500', takeaway: 'bg-amber-500/8 border-amber-500/15' },
  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'bg-gradient-to-br from-emerald-500 to-teal-600', dot: 'bg-emerald-500', takeaway: 'bg-emerald-500/8 border-emerald-500/15' },
  { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'bg-gradient-to-br from-blue-500 to-cyan-600', dot: 'bg-blue-500', takeaway: 'bg-blue-500/8 border-blue-500/15' },
];

export function BuffPhilosophyPage({ onBack, isModal, onClose, onNavigateToSettings, onStartOnboarding }: BuffPhilosophyPageProps) {
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const philosophyPoints = [
    { id: 'branding', icon: Zap, title: t('philosophy.branding.title'), subtitle: t('philosophy.branding.subtitle'), content: t('philosophy.branding.content'), buffInsight: t('philosophy.branding.insight') },
    { id: 'rewards', icon: Trophy, title: t('philosophy.rewards.title'), subtitle: t('philosophy.rewards.subtitle'), content: t('philosophy.rewards.content'), buffInsight: t('philosophy.rewards.insight') },
    { id: 'positive', icon: Shield, title: t('philosophy.positive.title'), subtitle: t('philosophy.positive.subtitle'), content: t('philosophy.positive.content'), buffInsight: t('philosophy.positive.insight') },
    { id: 'bonus', icon: Heart, title: t('philosophy.bonus.title'), subtitle: t('philosophy.bonus.subtitle'), content: t('philosophy.bonus.content'), buffInsight: t('philosophy.bonus.insight') },
    { id: 'dayTypes', icon: Calendar, title: t('philosophy.dayTypes.title'), subtitle: t('philosophy.dayTypes.subtitle'), content: t('philosophy.dayTypes.content'), buffInsight: t('philosophy.dayTypes.insight') },
    { id: 'smartGoal', icon: Flame, title: t('philosophy.smartGoal.title'), subtitle: t('philosophy.smartGoal.subtitle'), content: t('philosophy.smartGoal.content'), buffInsight: t('philosophy.smartGoal.insight') },
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
      ? `🎮 *${t('philosophy.title')}* - אפליקציה לילדים עם ADHD\n\n🔗 https://buff.lovable.app`
      : `🎮 *${t('philosophy.title')}* - App for children with ADHD\n\n🔗 https://buff.lovable.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div className="theme-parent-zen flex flex-col" style={{ height: isModal ? '90vh' : '100dvh' }}>
      {/* Fixed header area */}
      <div className={`shrink-0 ${isModal ? 'px-4 pt-4' : 'max-w-2xl mx-auto w-full px-5 pt-4'}`}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Brain className="w-5 h-5 text-primary shrink-0" />
            <h1 className="text-base font-bold text-foreground font-display truncate">
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
        <p className="text-xs text-muted-foreground mb-3">{t('philosophy.subtitle')}</p>
      </div>

      {/* Carousel area – flex-1 fills remaining space */}
      <div className={`flex-1 min-h-0 flex flex-col ${isModal ? 'px-2' : 'max-w-2xl mx-auto w-full px-3'}`}>
        <Carousel
          setApi={onApiChange}
          opts={{ align: 'start', loop: false, direction: isRTL ? 'rtl' : 'ltr' }}
          className="flex-1 min-h-0 flex flex-col"
        >
          <CarouselContent className="-ml-2 flex-1 min-h-0">
            {philosophyPoints.map((point, index) => {
              const colors = CARD_COLORS[index];
              const IconComp = point.icon;
              return (
                <CarouselItem
                  key={point.id}
                  className={`pl-2 ${isMobile ? 'basis-[90%]' : 'basis-1/2 lg:basis-1/3'}`}
                >
                  {/* Card – flex column, overflow hidden, fills carousel height */}
                  <div className={`relative rounded-2xl border ${colors.border} ${colors.bg} shadow-md h-full flex flex-col overflow-hidden p-4`}>
                    {/* Counter */}
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold text-muted-foreground bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                      {index + 1}/{philosophyPoints.length}
                    </span>

                    {/* Icon – smaller on mobile */}
                    <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl ${colors.icon} text-white flex items-center justify-center mb-3 shadow-lg shrink-0`}>
                      <IconComp className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                    </div>

                    {/* Headline */}
                    <h3 className="text-[15px] font-bold text-foreground leading-tight mb-0.5 shrink-0">
                      {point.title}
                    </h3>
                    <p className="text-[11px] font-medium text-muted-foreground mb-2 shrink-0">
                      {point.subtitle}
                    </p>

                    {/* Body – flex-1, clips gracefully */}
                    <div className="flex-1 min-h-0 overflow-hidden mb-3">
                      <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">
                        {point.content}
                      </p>
                    </div>

                    {/* Takeaway – pinned to bottom */}
                    <div className={`shrink-0 flex items-start gap-2 p-2.5 rounded-xl border ${colors.takeaway}`}>
                      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                        {point.buffInsight}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-2.5 py-2.5 shrink-0">
          <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={() => api?.scrollPrev()} disabled={current === 0}>
            {isRTL ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </Button>
          <div className="flex items-center gap-1.5">
            {philosophyPoints.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? `w-5 h-1.5 ${CARD_COLORS[i].dot}` : 'w-1.5 h-1.5 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={() => api?.scrollNext()} disabled={current === philosophyPoints.length - 1}>
            {isRTL ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Fixed bottom CTA with safe-area padding */}
      <div className={`shrink-0 ${isModal ? 'px-4 pb-4' : 'max-w-2xl mx-auto w-full px-5'}`} style={{ paddingBottom: isModal ? '1rem' : 'max(1rem, env(safe-area-inset-bottom))' }}>
        <Button
          onClick={handleStartClick}
          className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all touch-target"
        >
          <Sparkles className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('philosophy.letsStart')}
        </Button>
        <div className="mt-1.5 text-center">
          <Button
            variant="link"
            size="sm"
            onClick={() => { if (isModal && onClose) onClose(); navigate('/about'); }}
            className="text-primary hover:text-primary/80 text-[11px] touch-target h-8"
          >
            <Heart className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
            {t('philosophy.readStory')}
          </Button>
        </div>
      </div>
    </div>
  );
}
