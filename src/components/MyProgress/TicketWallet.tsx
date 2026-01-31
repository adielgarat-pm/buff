import { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, HelpCircle } from 'lucide-react';
import { RestTicketInfoModal } from './RestTicketInfoModal';

interface TicketWalletProps {
  restTickets: number;
  maxTickets?: number;
}

export function TicketWallet({ restTickets, maxTickets = 3 }: TicketWalletProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <>
      <div className="bg-card/50 rounded-2xl p-5 border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>🎫</span>
              ארנק כרטיסים
            </h3>
            {/* Info Icon */}
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all hover:scale-110 active:scale-95"
              title="איך עובדים כרטיסי מנוחה?"
            >
              <HelpCircle className="w-4 h-4 text-primary" />
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {restTickets}/{maxTickets} זמינים
          </span>
        </div>

        {/* Tickets Display */}
        <div className="relative h-28 flex items-center justify-center">
          {/* Ticket stack animation */}
          <div className="relative flex items-center justify-center">
          {Array.from({ length: maxTickets }).map((_, index) => {
            const isAvailable = index < restTickets;
            const offset = (maxTickets - 1 - index) * 6;
            const rotation = (index - Math.floor(maxTickets / 2)) * 5;
            
            return (
              <motion.div
                key={index}
                initial={{ 
                  y: 50, 
                  opacity: 0,
                  rotate: rotation,
                }}
                animate={{ 
                  y: 0, 
                  opacity: isAvailable ? 1 : 0.3,
                  rotate: isAvailable ? rotation : 0,
                  scale: isAvailable ? 1 : 0.9,
                }}
                transition={{ 
                  delay: index * 0.1, 
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                whileHover={isAvailable ? { 
                  y: -8, 
                  scale: 1.05,
                  rotate: 0,
                } : undefined}
                className="absolute"
                style={{
                  zIndex: maxTickets - index,
                  left: `calc(50% - 48px + ${offset}px)`,
                }}
              >
                {/* Ticket Shape */}
                <div
                  className={`
                    relative w-24 h-16 rounded-xl
                    transition-all duration-300 cursor-pointer
                    ${isAvailable 
                      ? 'bg-gradient-to-br from-accent to-accent/80 shadow-buff-glow' 
                      : 'bg-secondary/50 border border-border/50'}
                  `}
                  style={{
                    clipPath: `polygon(
                      0% 0%, 
                      100% 0%, 
                      100% 35%, 
                      96% 35%, 
                      96% 40%, 
                      100% 40%, 
                      100% 60%, 
                      96% 60%, 
                      96% 65%, 
                      100% 65%, 
                      100% 100%, 
                      0% 100%, 
                      0% 65%, 
                      4% 65%, 
                      4% 60%, 
                      0% 60%, 
                      0% 40%, 
                      4% 40%, 
                      4% 35%, 
                      0% 35%
                    )`,
                  }}
                >
                  {/* Ticket content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Ticket 
                      className={`w-6 h-6 ${isAvailable ? 'text-accent-foreground' : 'text-muted-foreground'}`} 
                    />
                    {isAvailable && (
                      <span className="text-[10px] font-bold text-accent-foreground mt-0.5">
                        מנוחה
                      </span>
                    )}
                  </div>
                  
                  {/* Dotted line separator */}
                  <div 
                    className={`absolute top-1/2 -translate-y-1/2 w-full border-t-2 border-dashed ${
                      isAvailable ? 'border-accent-foreground/30' : 'border-muted-foreground/20'
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-muted-foreground mt-4"
      >
        {restTickets === 0 
          ? '😴 אין כרטיסי מנוחה זמינים'
          : restTickets === 1 
            ? '🌟 נשאר כרטיס מנוחה אחד!'
            : `✨ יש לך ${restTickets} כרטיסי מנוחה`
        }
      </motion.p>
      </div>

      {/* Info Modal */}
      <RestTicketInfoModal 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)} 
      />
    </>
  );
}
