import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Check, CircuitBoard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoreSyncAnimationProps {
  isActive: boolean;
  credits: number;
  onComplete: () => void;
}

export function CoreSyncAnimation({ isActive, credits, onComplete }: CoreSyncAnimationProps) {
  const [phase, setPhase] = useState<'syncing' | 'powerup' | 'complete'>('syncing');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setPhase('syncing');
      setProgress(0);
      return;
    }

    // Progress bar animation (3 seconds)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 3.33; // ~3 seconds to complete
      });
    }, 100);

    // Phase transitions
    const syncTimeout = setTimeout(() => {
      setPhase('powerup');
    }, 3000);

    const completeTimeout = setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, 4500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(syncTimeout);
      clearTimeout(completeTimeout);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
      >
        <div className="relative flex flex-col items-center gap-6">
          {/* Glowing Circuit Lines Background */}
          <div className="absolute inset-0 -m-20 overflow-hidden opacity-30">
            <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-protocol-cyan via-protocol-purple to-transparent" />
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-protocol-cyan to-transparent" />
            <div className="absolute top-1/4 left-1/4 w-20 h-20 rounded-full border border-protocol-cyan/30 animate-ping" />
            <div className="absolute bottom-1/4 right-1/4 w-16 h-16 rounded-full border border-protocol-purple/30 animate-ping" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Main Icon Container */}
          <motion.div
            animate={{
              scale: phase === 'powerup' ? [1, 1.2, 1] : 1,
              rotate: phase === 'syncing' ? 360 : 0,
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
              scale: { duration: 0.5 },
            }}
            className={cn(
              "relative w-28 h-28 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-protocol-cyan/20 to-protocol-purple/20",
              "border-2",
              phase === 'complete' 
                ? "border-buff shadow-buff-glow" 
                : "border-protocol-cyan shadow-protocol-glow"
            )}
          >
            {phase === 'syncing' && (
              <Cpu className="w-12 h-12 text-protocol-cyan animate-pulse" />
            )}
            {phase === 'powerup' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <Zap className="w-14 h-14 text-protocol-cyan fill-protocol-cyan/30" />
              </motion.div>
            )}
            {phase === 'complete' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              >
                <Check className="w-14 h-14 text-buff" />
              </motion.div>
            )}

            {/* Orbiting Elements */}
            {phase === 'syncing' && (
              <>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                >
                  <CircuitBoard className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 text-protocol-purple" />
                </motion.div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                >
                  <Zap className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 text-protocol-cyan" />
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Status Text */}
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className={cn(
              "text-xl font-bold tracking-wider",
              phase === 'complete' ? 'text-buff' : 'text-protocol-cyan'
            )}>
              {phase === 'syncing' && 'SYNCING...'}
              {phase === 'powerup' && 'POWER UP!'}
              {phase === 'complete' && 'SYNC COMPLETE'}
            </h2>
            
            {phase === 'syncing' && (
              <p className="text-sm text-muted-foreground mt-1">
                Core protocol initializing
              </p>
            )}
            {phase === 'powerup' && (
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-lg font-bold text-protocol-purple mt-1"
              >
                +{credits} BP
              </motion.p>
            )}
            {phase === 'complete' && (
              <p className="text-sm text-buff/80 mt-1">
                Systems optimal ✓
              </p>
            )}
          </motion.div>

          {/* Progress Bar (during syncing) */}
          {phase === 'syncing' && (
            <div className="w-48 h-2 bg-protocol-cyan/10 rounded-full overflow-hidden border border-protocol-cyan/30">
              <motion.div
                className="h-full bg-gradient-to-r from-protocol-cyan to-protocol-purple"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
