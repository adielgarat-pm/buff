import { 
  ArrowRight, 
  Sparkles, 
  Trophy, 
  Target, 
  Calendar, 
  Lightbulb,
  Brain,
  Heart,
  BookOpen,
  X,
  Share2,
  Zap,
  Shield,
  Flame
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface BuffPhilosophyPageProps {
  onBack?: () => void;
  isModal?: boolean;
  onClose?: () => void;
  onNavigateToSettings?: () => void;
  onStartOnboarding?: () => void;
}

export function BuffPhilosophyPage({ onBack, isModal, onClose, onNavigateToSettings, onStartOnboarding }: BuffPhilosophyPageProps) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const philosophyPoints = [
    {
      id: 'branding',
      icon: Zap,
      title: t('philosophy.branding.title'),
      subtitle: t('philosophy.branding.subtitle'),
      content: t('philosophy.branding.content'),
      buffInsight: t('philosophy.branding.insight'),
      color: 'from-indigo-500 to-purple-600',
    },
    {
      id: 'rewards',
      icon: Trophy,
      title: t('philosophy.rewards.title'),
      subtitle: t('philosophy.rewards.subtitle'),
      content: t('philosophy.rewards.content'),
      buffInsight: t('philosophy.rewards.insight'),
      color: 'from-rose-500 to-pink-600',
    },
    {
      id: 'positive',
      icon: Shield,
      title: t('philosophy.positive.title'),
      subtitle: t('philosophy.positive.subtitle'),
      content: t('philosophy.positive.content'),
      buffInsight: t('philosophy.positive.insight'),
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'bonus',
      icon: Heart,
      title: t('philosophy.bonus.title'),
      subtitle: t('philosophy.bonus.subtitle'),
      content: t('philosophy.bonus.content'),
      buffInsight: t('philosophy.bonus.insight'),
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'dayTypes',
      icon: Calendar,
      title: t('philosophy.dayTypes.title'),
      subtitle: t('philosophy.dayTypes.subtitle'),
      content: t('philosophy.dayTypes.content'),
      buffInsight: t('philosophy.dayTypes.insight'),
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'smartGoal',
      icon: Flame,
      title: t('philosophy.smartGoal.title'),
      subtitle: t('philosophy.smartGoal.subtitle'),
      content: t('philosophy.smartGoal.content'),
      buffInsight: t('philosophy.smartGoal.insight'),
      color: 'from-blue-500 to-cyan-600',
    },
  ];

  const handleStartClick = () => {
    if (isModal && onClose) {
      onClose();
    }
    if (onStartOnboarding) {
      onStartOnboarding();
    } else if (onNavigateToSettings) {
      onNavigateToSettings();
    } else if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };

  const handleShare = () => {
    const shareText = language === 'he' 
      ? `🎮 *${t('philosophy.title')}* - אפליקציה לילדים עם ADHD

📱 Buff משתמשת בשפת גיימינג ועקרונות מקצועיים לחיזוק תפקודים ניהוליים כדי לעזור לילדים לבנות שגרה יומית בצורה מהנה וחיובית.

✨ *עקרונות מרכזיים:*
• העצמה במקום רשימת מטלות
• חיזוק חיובי בלבד - נמל מבטחים
• בונוס הורה לזיהוי מאמץ שקוף
• התאמה אוטומטית לסוג היום
• יעד 70% לבניית רצף ניצחונות

🔗 למידע נוסף: https://buff.lovable.app`
      : `🎮 *${t('philosophy.title')}* - App for children with ADHD

📱 Buff uses gaming language and professional Executive Functioning principles to help children build daily routines in a fun and positive way.

✨ *Key Principles:*
• Empowerment instead of task lists
• Positive reinforcement only - Safe Harbor
• Parent bonus for recognizing invisible effort
• Automatic adjustment to day type
• 70% goal for building winning streaks

🔗 Learn more: https://buff.lovable.app`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const containerClass = isModal 
    ? 'max-h-[80vh] overflow-y-auto' 
    : 'min-h-[100dvh] bg-background overflow-x-hidden';

  return (
    <div className={`theme-parent-zen ${containerClass}`}>
      <div className={isModal ? 'p-6' : 'max-w-2xl mx-auto px-5 py-6 pb-24 safe-area-all'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground font-display">
                {t('philosophy.title')}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('philosophy.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="text-primary hover:bg-primary/10"
            >
              <Share2 className="w-4 h-4 ml-1" />
              {t('philosophy.share')}
            </Button>
            {isModal && onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            )}
            {!isModal && onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
                <ArrowRight className="w-4 h-4 ml-1" />
                {t('philosophy.back')}
              </Button>
            )}
          </div>
        </div>

        {/* Introduction Card */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                {t('philosophy.fromParents')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('philosophy.intro')}
              </p>
            </div>
          </div>
        </div>

        {/* Philosophy Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {philosophyPoints.map((point, index) => (
            <AccordionItem 
              key={point.id} 
              value={point.id}
              className="border border-border rounded-2xl overflow-hidden bg-card data-[state=open]:shadow-md transition-shadow"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4 text-right w-full">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${point.color} text-white shrink-0`}>
                    <point.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {index + 1}/{philosophyPoints.length}
                      </span>
                      <h3 className="font-semibold text-foreground truncate">
                        {point.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {point.subtitle}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="space-y-4 pt-2">
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {point.content}
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-primary/20 shrink-0">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground text-sm mb-1">
                          {t('philosophy.buffInsight')}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {point.buffInsight}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* CTA Button */}
        <div className="mt-8">
          <Button
            onClick={handleStartClick}
            className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            <Sparkles className="w-5 h-5 ml-2" />
            {t('philosophy.letsStart')}
          </Button>
        </div>

        {/* Footer Note */}
        <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border text-center">
          <p className="text-xs text-muted-foreground">
            {t('philosophy.tip')}
          </p>
        </div>

        {/* Link to About Page */}
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => {
              if (isModal && onClose) onClose();
              navigate('/about');
            }}
            className="text-primary hover:text-primary/80"
          >
            <Heart className="w-4 h-4 ml-1" />
            {t('philosophy.readStory')}
          </Button>
        </div>
      </div>
    </div>
  );
}
