import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, Wand2, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from './ui/button';
import { playClickSound } from '@/utils/soundEffects';

interface ChildSidebarProps {
  onOpenCommandCenter: () => void;
}

export function ChildSidebar({ onOpenCommandCenter }: ChildSidebarProps) {
  const [open, setOpen] = useState(false);
  const { language, setLanguage, t, isRTL } = useLanguage();

  const handleToggle = () => {
    playClickSound();
    setOpen(!open);
  };

  const handleLangSwitch = () => {
    playClickSound();
    setLanguage(language === 'he' ? 'en' : 'he');
  };

  const handleOpenCommandCenter = () => {
    playClickSound();
    onOpenCommandCenter();
    setOpen(false);
  };

  return (
    <>
      {/* Floating toggle button */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleToggle}
        className="fixed top-4 z-40 rounded-xl w-10 h-10 border-primary/30 bg-card/90 backdrop-blur-sm shadow-md hover:shadow-lg hover:scale-105 transition-all"
        style={{ [isRTL ? 'left' : 'left']: '1rem' }}
      >
        {open ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5 text-primary" />}
      </Button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: isRTL ? -280 : -280 }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? -280 : -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 z-35 h-full w-[260px] bg-card border-e border-border shadow-xl flex flex-col"
            style={{ [isRTL ? 'right' : 'left']: 0 }}
          >
            {/* Header */}
            <div className="pt-16 px-4 pb-4 border-b border-border">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {t('sidebar.title')}
              </h2>
            </div>

            {/* Menu items */}
            <nav className="flex-1 p-3 space-y-2">
              {/* Language Switcher */}
              <button
                onClick={handleLangSwitch}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary hover:scale-[1.02] active:scale-[0.98] transition-all text-start"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">
                    {t('sidebar.language')}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      language === 'en' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
                    }`}>
                      EN
                    </span>
                    <span className="text-xs text-muted-foreground">|</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      language === 'he' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
                    }`}>
                      עב
                    </span>
                  </div>
                </div>
              </button>

              {/* Command Center / Personalization */}
              <button
                onClick={handleOpenCommandCenter}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary hover:scale-[1.02] active:scale-[0.98] transition-all text-start"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center relative">
                  <User className="w-5 h-5 text-accent" />
                  <Wand2 className="w-3 h-3 text-primary absolute -bottom-0.5 -end-0.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">
                    {t('sidebar.personalize')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('sidebar.personalizeDesc')}
                  </p>
                </div>
              </button>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                BUFF • Mission Control
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
