import { Swords, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export type ChildNavTab = 'tasks' | 'store';

interface ChildBottomNavigationProps {
  activeTab: ChildNavTab;
  onTabChange: (tab: ChildNavTab) => void;
}

export function ChildBottomNavigation({ activeTab, onTabChange }: ChildBottomNavigationProps) {
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { id: 'tasks' as const, labelKey: 'nav.tasks', icon: Swords },
    { id: 'store' as const, labelKey: 'nav.store', icon: ShoppingBag },
  ];

  const handleTabChange = (tab: ChildNavTab) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onTabChange(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-lg border-t border-border/50">
      <div className="max-w-lg mx-auto safe-area-px" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}>
        <div className="flex items-center justify-around py-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-[80px] min-h-[56px] py-2 px-4 rounded-2xl",
                  "transition-all duration-200 touch-feedback touch-target",
                  "active:scale-95",
                  isActive 
                    ? "text-accent" 
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-12 h-8 rounded-xl transition-all duration-200",
                  isActive && "bg-accent/20 shadow-reward-glow"
                )}>
                  <Icon className={cn(
                    "w-6 h-6 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                </div>
                <span className={cn(
                  "text-[11px] font-semibold tracking-wide",
                  isActive && "text-accent"
                )}>
                  {t(item.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
