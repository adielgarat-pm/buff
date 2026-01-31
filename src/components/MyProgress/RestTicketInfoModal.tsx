import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, Zap, Calendar, Battery } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RestTicketInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RestTicketInfoModal({ isOpen, onClose }: RestTicketInfoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50"
          >
            <div className="bg-card rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
              {/* Header with animated ticket */}
              <div className="relative bg-gradient-to-br from-accent/20 to-primary/10 p-6 pb-8">
                {/* Floating tickets animation */}
                <motion.div
                  className="absolute top-4 right-8"
                  animate={{ 
                    y: [0, -5, 0],
                    rotate: [5, 8, 5],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Ticket className="w-8 h-8 text-accent opacity-60" />
                </motion.div>
                <motion.div
                  className="absolute top-8 left-6"
                  animate={{ 
                    y: [0, -8, 0],
                    rotate: [-10, -5, -10],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                >
                  <Ticket className="w-6 h-6 text-primary opacity-40" />
                </motion.div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 left-4 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* Title */}
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
                    איך עובדים כרטיסי מנוחה?
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Rule 1 - Earn */}
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
                      כל <span className="text-primary font-bold">5 משימות</span> שהשלמת בהצלחה מזכות אותך בכרטיס מנוחה אחד.
                    </p>
                  </div>
                </motion.div>

                {/* Rule 2 - Use */}
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
                      אפשר להשתמש בכרטיס כדי <span className="text-accent font-bold">"לדלג"</span> על יום בלי לפגוע במטרה השבועית שלך (ה-70%).
                    </p>
                  </div>
                </motion.div>

                {/* Rule 3 - Philosophy */}
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
                      מנוחה היא חלק מהאימון! 💪 <span className="text-muted-foreground">השתמש בהם בחוכמה בימים עמוסים.</span>
                    </p>
                  </div>
                </motion.div>

                {/* Animated ticket punch effect */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="pt-4 border-t border-border/50"
                >
                  <div className="flex justify-center">
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.05 }}
                    >
                      {/* Ticket visual */}
                      <div className="relative w-32 h-20 bg-gradient-to-br from-accent to-accent/80 rounded-xl shadow-buff-glow overflow-hidden">
                        {/* Punch holes */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 bg-card rounded-full -ml-1.5" />
                        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-3 bg-card rounded-full -mr-1.5" />
                        
                        {/* Dashed line */}
                        <div className="absolute top-1/2 -translate-y-1/2 w-full border-t-2 border-dashed border-accent-foreground/30" />
                        
                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Ticket className="w-6 h-6 text-accent-foreground" />
                          <span className="text-xs font-bold text-accent-foreground mt-1">מנוחה</span>
                        </div>

                        {/* Glow effect */}
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

              {/* Footer */}
              <div className="px-6 pb-6">
                <Button
                  onClick={onClose}
                  className="w-full rounded-xl h-12 font-bold"
                >
                  הבנתי! 🚀
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
