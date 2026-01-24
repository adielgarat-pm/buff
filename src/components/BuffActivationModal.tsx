import { useEffect, useState } from 'react';
import { X, Zap } from 'lucide-react';
import { Strategy, STRATEGY_CATEGORIES } from '@/data/cogFunStrategies';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface BuffActivationModalProps {
  strategy: Strategy;
  onClose: () => void;
}

export function BuffActivationModal({ strategy, onClose }: BuffActivationModalProps) {
  const { language, isRTL } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const categoryInfo = STRATEGY_CATEGORIES[strategy.category];
  const categoryLabel = language === 'he' ? categoryInfo.labelHe : categoryInfo.label;

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200",
        isVisible ? "bg-black/70 backdrop-blur-sm" : "bg-transparent"
      )}
      onClick={handleClose}
    >
      <div 
        className={cn(
          "relative w-full max-w-sm bg-card border-2 border-buff/50 rounded-3xl p-6 shadow-buff-glow-intense transition-all duration-300",
          isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Buff Icon with glow */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-buff/30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-buff/20 border-2 border-buff flex items-center justify-center">
              <span className="text-4xl">{strategy.icon}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-buff animate-pulse" />
            <span className="text-buff font-bold uppercase tracking-wider text-sm">
              {language === 'he' ? 'באף הופעל!' : 'Buff Activated!'}
            </span>
            <Zap className="w-5 h-5 text-buff animate-pulse" />
          </div>
          <h2 className="buff-heading text-2xl text-foreground mb-1">
            {strategy.title}
          </h2>
          <span className={cn("text-sm font-medium", categoryInfo.color)}>
            {categoryLabel}
          </span>
        </div>

        {/* Strategy Tip */}
        <div className="bg-secondary/50 rounded-2xl p-4 mb-6">
          <p className="text-foreground text-center leading-relaxed">
            {strategy.tip}
          </p>
        </div>

        {/* Got it button */}
        <button
          onClick={handleClose}
          className="w-full py-4 rounded-2xl bg-gradient-buff text-buff-foreground font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-buff-glow"
        >
          {language === 'he' ? 'הבנתי! 💪' : 'Got it! 💪'}
        </button>
      </div>
    </div>
  );
}