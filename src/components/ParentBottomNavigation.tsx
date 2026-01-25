import { Activity, Sliders, BarChart3, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export type ParentNavTab = 'overview' | 'settings' | 'reports';

interface ParentBottomNavigationProps {
  activeTab: ParentNavTab;
  onTabChange: (tab: ParentNavTab) => void;
  onViewAsChild?: () => void;
  isViewingAsChild?: boolean;
}

export function ParentBottomNavigation({ 
  activeTab, 
  onTabChange, 
  onViewAsChild,
  isViewingAsChild 
}: ParentBottomNavigationProps) {
  const { t } = useLanguage();

  // Clear distinction: Monitoring (Activity) vs Configuring (Sliders)
  const NAV_ITEMS = [
    { id: 'overview' as const, label: 'מעקב', sublabel: 'Monitoring', icon: Activity },
    { id: 'settings' as const, label: 'הגדרות', sublabel: 'Configure', icon: Sliders },
    { id: 'reports' as const, label: 'דוחות', sublabel: 'Reports', icon: BarChart3 },
  ];

  const handleTabChange = (tab: ParentNavTab) => {
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
                  "flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[56px] py-2 px-3 rounded-2xl",
                  "transition-all duration-200 touch-feedback touch-target",
                  "active:scale-95",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-12 h-8 rounded-xl transition-all duration-200",
                  isActive && "bg-primary/20 shadow-glow"
                )}>
                  <Icon className={cn(
                    "w-6 h-6 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                </div>
                <span className={cn(
                  "text-[11px] font-semibold tracking-wide",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
          
          {/* View as Child Button */}
          {onViewAsChild && (
            <button
              onClick={onViewAsChild}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[56px] py-2 px-3 rounded-2xl",
                "transition-all duration-200 touch-feedback touch-target",
                "active:scale-95",
                isViewingAsChild
                  ? "text-accent"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-12 h-8 rounded-xl transition-all duration-200",
                isViewingAsChild && "bg-accent/20 shadow-reward-glow"
              )}>
                <Eye className={cn(
                  "w-6 h-6 transition-transform duration-200",
                  isViewingAsChild && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[11px] font-semibold tracking-wide",
                isViewingAsChild && "text-accent"
              )}>
                צפה כילד
              </span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
