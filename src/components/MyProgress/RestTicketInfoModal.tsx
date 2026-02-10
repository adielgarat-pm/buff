import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, Zap, Calendar, Battery } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface RestTicketInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RestTicketInfoModal({ isOpen, onClose }: RestTicketInfoModalProps) {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50"
          >
            <div className="bg-card rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
              <div className="relative bg-gradient-to-br from-accent/20 to-primary/10 p-6 pb-8">
                <motion.div
                  className="absolute top-4 right-8"
                  animate={{ y: [0, -5, 0], rotate: [5, 8, 5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Ticket className="w-8 h-8 text-accent opacity-60" />
                </motion.div>
                <motion.div
                  className="absolute top-8 left-6"
                  animate={{ y: [0, -8, 0], rotate: [-10, -5, -10] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                >
                  <Ticket className="w-6 h-6 text-primary opacity-40" />
                </motion.div>

                <button
                  onClick={onClose}
                  className="absolute top-4 left-4 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>

                <div className="text-center mt-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="w-16 h-16 mx-auto mb-4 bg-accent rounded-2xl flex items-center justify-center shadow-buff-glow"
                  >
                    <span className="text-3xl">🎫</span>
                  </motion.div>
                  <h2 className="text-xl font-bold text-foreground">
                    {t('tickets.infoTitle')}
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex gap-4 items-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium leading-relaxed">
                      {t('tickets.rule1')} <span className="text-primary font-bold">{t('tickets.rule1Tasks')}</span> {t('tickets.rule1End')}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex gap-4 items-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium leading-relaxed">
                      {t('tickets.rule2')} <span className="text-accent font-bold">{t('tickets.rule2Skip')}</span> {t('tickets.rule2End')}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-4 items-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Battery className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium leading-relaxed">
                      {t('tickets.rule3')} <span className="text-muted-foreground">{t('tickets.rule3Tip')}</span>
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="pt-4 border-t border-border/50"
                >
                  <div className="flex justify-center">
                    <motion.div className="relative" whileHover={{ scale: 1.05 }}>
                      <div className="relative w-32 h-20 bg-gradient-to-br from-accent to-accent/80 rounded-xl shadow-buff-glow overflow-hidden">
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 bg-card rounded-full -ml-1.5" />
                        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-3 bg-card rounded-full -mr-1.5" />
                        <div className="absolute top-1/2 -translate-y-1/2 w-full border-t-2 border-dashed border-accent-foreground/30" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Ticket className="w-6 h-6 text-accent-foreground" />
                          <span className="text-xs font-bold text-accent-foreground mt-1">{t('tickets.rest')}</span>
                        </div>
                        <motion.div
                          className="absolute inset-0 bg-foreground/10"
                          animate={{ opacity: [0, 0.3, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>

              <div className="px-6 pb-6">
                <Button
                  onClick={onClose}
                  className="w-full rounded-xl h-12 font-bold"
                >
                  {t('tickets.gotIt')}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
