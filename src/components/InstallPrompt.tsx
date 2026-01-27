import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Smartphone, 
  Zap, 
  Bell, 
  Wifi,
  ArrowDown,
  Share,
  Plus,
  CheckCircle2,
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

// iOS-specific instruction steps
const iosSteps = [
  { step: 1, icon: Share, text: 'לחצו על כפתור השיתוף', highlight: 'Share' },
  { step: 2, icon: Plus, text: 'בחרו "הוסף למסך הבית"', highlight: 'Add to Home Screen' },
  { step: 3, icon: CheckCircle2, text: 'לחצו "הוסף" וזהו!', highlight: 'Add' },
];

function IOSInstructions() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 mb-3">
          <Smartphone className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          התקינו את BUFF על האייפון
        </h3>
        <p className="text-sm text-muted-foreground">
          עקבו אחר הצעדים הפשוטים הבאים
        </p>
      </div>

      <div className="space-y-3">
        {iosSteps.map((step, index) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold">{step.step}</span>
            </div>
            <div className="flex-1">
              <p className="text-foreground font-medium">{step.text}</p>
              <p className="text-xs text-muted-foreground">
                {step.highlight}
              </p>
            </div>
            <step.icon className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        ))}
      </div>

      {/* Visual Safari Share Button hint */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-b from-muted/50 to-muted/20 border border-border/50">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ArrowDown className="w-4 h-4 animate-bounce" />
          <span>כפתור השיתוף נמצא בתחתית הדפדפן</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </div>
      </div>
    </div>
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
    isInstallable, 
    canShowPrompt,
    isInstalled,
    triggerInstall, 
    dismiss 
  } = usePWAInstall();
  
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Don't render if already installed or can't show prompt
  if (isInstalled || !canShowPrompt) {
    return null;
  }

  const handleInstall = async () => {
    if (deviceOS === 'ios') {
      setShowIOSGuide(true);
      return;
    }

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

  const handleCloseFull = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  // Full-screen modal version
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
              onClick={handleCloseFull}
              className="absolute top-4 left-4 h-8 w-8 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-glow opacity-50 pointer-events-none" />

            <div className="relative">
              {showIOSGuide || deviceOS === 'ios' ? (
                <IOSInstructions />
              ) : (
                <AndroidDesktopInstructions 
                  onInstall={handleInstall} 
                  deviceOS={deviceOS}
                />
              )}
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

  // Bottom sheet version (compact)
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
