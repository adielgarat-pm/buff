import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, BookOpen, X } from 'lucide-react';
import { Phase, getPhaseConfig } from '@/types/phase';
import { useLanguage } from '@/contexts/LanguageContext';

interface PhaseTransitionBannerProps {
  show: boolean;
  fromPhase?: Phase;
  toPhase?: Phase;
  onDismiss: () => void;
}

export function PhaseTransitionBanner({ 
  show, 
  fromPhase = 'school', 
  toPhase = 'afternoon',
  onDismiss 
}: PhaseTransitionBannerProps) {
  const [isVisible, setIsVisible] = useState(show);
  const { t, language } = useLanguage();

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  const toPhaseConfig = getPhaseConfig(toPhase);

  const getMessage = () => {
    if (fromPhase === 'school' && toPhase === 'afternoon') {
      return {
        title: t('phase.schoolEnded'),
        subtitle: t('phase.switchToAfternoon'),
        icon: <Sun className="w-6 h-6 text-chart-1" />,
      };
    }
    if (fromPhase === 'morning' && toPhase === 'school') {
      return {
        title: t('phase.schoolStarted'),
        subtitle: t('phase.switchToSchool'),
        icon: <BookOpen className="w-6 h-6 text-chart-2" />,
      };
    }
    return {
      title: `${toPhaseConfig.icon} ${language === 'he' ? toPhaseConfig.labelHe : toPhaseConfig.label}`,
      subtitle: t('phase.transition'),
      icon: null,
    };
  };

  const message = getMessage();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/90 to-primary shadow-2xl border border-primary/20">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: 2, duration: 1, ease: 'easeInOut' }}
            />
            
            <div className="relative p-4 flex items-center gap-4">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
              >
                {message.icon || <span className="text-2xl">{toPhaseConfig.icon}</span>}
              </motion.div>
              
              <div className="flex-1">
                <motion.h3
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg font-bold text-white"
                >
                  {message.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-white/80"
                >
                  {message.subtitle}
                </motion.p>
              </div>
              
              <button
                onClick={onDismiss}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <motion.div
              className="h-1 bg-white/30"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: 'linear' }}
              style={{ transformOrigin: 'right' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
