import { Sunrise, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface NewDayBannerProps {
  show: boolean;
  onDismiss: () => void;
}

export function NewDayBanner({ show, onDismiss }: NewDayBannerProps) {
  const { language } = useLanguage();

  if (!show) return null;

  const title = language === 'he' ? 'בוקר טוב!' : 'Good Morning!';
  const subtitle = language === 'he' 
    ? 'המשימות החדשות מוכנות. יום חדש, הזדמנויות חדשות! 🚀'
    : 'New Quests are ready. Fresh day, new opportunities! 🚀';

  return (
    <div 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 animate-slide-up',
        'bg-gradient-to-r from-buff via-primary to-buff',
        'p-4 shadow-lg'
      )}
    >
      <div className="max-w-md mx-auto flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-full">
          <Sunrise className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg">{title}</h3>
          <p className="text-white/90 text-sm">{subtitle}</p>
        </div>
        <button 
          onClick={onDismiss}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
