import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Zap, 
  Bell, 
  Wifi,
  Plus,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { Button } from './ui/button';
import { usePWAInstall, DeviceOS } from '@/hooks/usePWAInstall';
import buffLogo from '@/assets/buff-logo.png';

interface InstallPromptProps {
  onClose?: () => void;
  showAsModal?: boolean;
}

// Feature benefits to show
const features = [
  { icon: Zap, title: 'גישה מהירה', description: 'פתחו מהמסך הראשי' },
  { icon: Bell, title: 'התראות', description: 'קבלו עדכונים בזמן אמת' },
  { icon: Wifi, title: 'עובד אופליין', description: 'גם בלי אינטרנט' },
];

// Floating Arrow Component for iOS
function FloatingArrow() {
  return (
    <motion.div
      className="absolute -top-14 left-1/2 -translate-x-1/2 z-10"
      initial={{ y: 0 }}
      animate={{ y: [0, 8, 0] }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Glow effect behind arrow */}
        <div className="absolute inset-0 blur-md bg-primary/40 rounded-full scale-150" />
        <ChevronDown className="w-10 h-10 text-primary relative z-10" strokeWidth={3} />
        <span className="text-xs text-primary font-medium mt-1 relative z-10 whitespace-nowrap">
          לחצו על השיתוף למטה
        </span>
      </div>
    </motion.div>
  );
}

// Apple Share Icon SVG
function AppleShareIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

// iOS-specific instruction component with floating arrow
function IOSInstallGuide({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-0 inset-x-0 z-[100]"
    >
      {/* Floating Arrow pointing to Safari Share button */}
      <FloatingArrow />
      
      {/* Main Banner */}
      <div className="bg-card/95 backdrop-blur-xl border-t border-border rounded-t-3xl shadow-2xl">
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
        
        <div className="p-5 pb-safe max-w-lg mx-auto">
          {/* Header with dismiss */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-buff-glow">
                <img src={buffLogo} alt="BUFF" className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  התקינו את BUFF
                </h3>
                <p className="text-sm text-muted-foreground">
                  הוסיפו לקיצורי הדרך שלכם
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-8 w-8 rounded-full -mt-1 -ml-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Step-by-step instructions */}
          <div className="space-y-3">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border border-border/50"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium text-sm">
                  לחצו על כפתור השיתוף
                </p>
                <p className="text-xs text-muted-foreground">
                  בתחתית המסך ב-Safari
                </p>
              </div>
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <AppleShareIcon className="w-5 h-5 text-primary" />
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border border-border/50"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium text-sm">
                  גללו ובחרו "הוסף למסך הבית"
                </p>
                <p className="text-xs text-muted-foreground">
                  Add to Home Screen
                </p>
              </div>
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-accent" />
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border border-border/50"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium text-sm">
                  לחצו "הוסף" וזהו! 🎉
                </p>
                <p className="text-xs text-muted-foreground">
                  BUFF יופיע במסך הבית
                </p>
              </div>
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </motion.div>
          </div>

          {/* Dismiss text */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onDismiss}
            className="w-full mt-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            לא עכשיו, אולי אחר כך
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function AndroidDesktopInstructions({ onInstall, deviceOS }: { onInstall: () => void; deviceOS: DeviceOS }) {
  const isDesktop = deviceOS === 'desktop';
  
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-primary shadow-buff-glow mb-4"
        >
          <img src={buffLogo} alt="BUFF" className="w-14 h-14" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">
          שדרגו את החוויה!
        </h2>
        <p className="text-muted-foreground">
          {isDesktop 
            ? 'התקינו את BUFF על המחשב לגישה מהירה'
            : 'הוסיפו את BUFF למסך הבית'}
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-3 gap-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="p-3 rounded-xl bg-card border border-border text-center"
          >
            <feature.icon className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-xs font-medium text-foreground">{feature.title}</p>
            <p className="text-[10px] text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Install CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={onInstall}
          size="lg"
          className="w-full h-14 text-lg font-bold gap-3 bg-gradient-primary shadow-buff-glow hover:shadow-buff-glow-intense transition-all"
        >
          <Sparkles className="w-5 h-5" />
          התקן עכשיו
          <Sparkles className="w-5 h-5" />
        </Button>
      </motion.div>
    </div>
  );
}

export function InstallPrompt({ onClose, showAsModal = true }: InstallPromptProps) {
  const { 
    deviceOS, 
    canShowPrompt,
    isInstalled,
    triggerInstall, 
    dismiss 
  } = usePWAInstall();
  
  const [isVisible, setIsVisible] = useState(true);

  // Don't render if already installed or can't show prompt
  if (isInstalled || !canShowPrompt) {
    return null;
  }

  const handleInstall = async () => {
    const success = await triggerInstall();
    if (success) {
      setIsVisible(false);
      onClose?.();
    }
  };

  const handleDismiss = () => {
    dismiss(24); // Dismiss for 24 hours
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  // iOS gets the special floating arrow guide
  if (deviceOS === 'ios') {
    return (
      <AnimatePresence>
        <IOSInstallGuide onDismiss={handleDismiss} />
      </AnimatePresence>
    );
  }

  // Full-screen modal version for Android/Desktop
  if (showAsModal) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl border border-border relative"
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="absolute top-4 left-4 h-8 w-8 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-glow opacity-50 pointer-events-none" />

            <div className="relative">
              <AndroidDesktopInstructions 
                onInstall={handleInstall} 
                deviceOS={deviceOS}
              />
            </div>

            {/* Dismiss option */}
            <div className="mt-6 text-center">
              <button
                onClick={handleDismiss}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                לא עכשיו, אולי אחר כך
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Bottom sheet version (compact) for non-modal display
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 inset-x-0 z-50"
      >
        <div className="bg-card border-t border-border rounded-t-3xl p-4 pb-safe shadow-2xl">
          <div className="max-w-lg mx-auto">
            {/* Handle bar */}
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-buff-glow">
                <img src={buffLogo} alt="BUFF" className="w-10 h-10" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  שדרגו לחוויה מלאה
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  התקינו את BUFF למסך הבית
                </p>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-muted-foreground"
                >
                  לא עכשיו
                </Button>
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="gap-1.5 bg-gradient-primary shadow-buff-glow"
                >
                  <Zap className="w-4 h-4" />
                  התקן
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
