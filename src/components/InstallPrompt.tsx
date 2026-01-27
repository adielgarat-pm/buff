import { useState, useEffect, useRef } from 'react';
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
import { trackPWAEvent } from '@/hooks/usePWAAnalytics';
import { useInstallPromptMessage } from '@/hooks/useInstallPromptMessage';
import { useBrowserDetection, detectBrowser } from '@/hooks/useBrowserDetection';
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

// Floating Arrow Component for iOS - isolated with high z-index
function FloatingArrow() {
  return (
    <motion.div
      className="fixed left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ zIndex: 9999, bottom: '290px' }}
      initial={{ y: 0 }}
      animate={{ y: [0, 12, 0] }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Glow effect behind arrow */}
        <div className="absolute inset-0 blur-lg bg-primary/50 rounded-full scale-[2]" />
        <ChevronDown className="w-12 h-12 text-primary relative z-10 drop-shadow-lg" strokeWidth={3} />
        <span className="text-sm text-primary font-bold mt-1 relative z-10 whitespace-nowrap bg-background/80 px-3 py-1 rounded-full backdrop-blur-sm">
          לחצו כאן למטה ↓
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
function IOSInstallGuide({ onDismiss, onDismissPermanently }: { onDismiss: () => void; onDismissPermanently: () => void }) {
  return (
    <>
      {/* Floating Arrow - positioned separately with fixed positioning */}
      <FloatingArrow />
      
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 inset-x-0"
        style={{ zIndex: 9998 }}
      >
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
                onClick={onDismissPermanently}
                className="h-8 w-8 rounded-full -mt-1 -ml-2"
                title="סגור לצמיתות"
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
              לא עכשיו, הזכירו לי מאוחר יותר
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

interface AndroidDesktopInstructionsProps {
  onInstall: () => void;
  deviceOS: DeviceOS;
  isInstallable: boolean;
  personalizedMessage: string;
  childrenCount: number;
  browserName: string;
  menuIcon: string;
  menuLocation: string;
  installAction: string;
}

function AndroidDesktopInstructions({ 
  onInstall, 
  deviceOS, 
  isInstallable,
  personalizedMessage,
  childrenCount,
  browserName,
  menuIcon,
  menuLocation,
  installAction,
}: AndroidDesktopInstructionsProps) {
  const isDesktop = deviceOS === 'desktop';
  // Adjust font size based on message length and number of children
  const getMessageStyle = () => {
    if (childrenCount >= 3 || personalizedMessage.length > 70) {
      return 'text-sm leading-relaxed';
    }
    if (childrenCount >= 2 || personalizedMessage.length > 50) {
      return 'text-base leading-relaxed';
    }
    return 'text-lg';
  };
  
  return (
    <div className="space-y-6">
      {/* Hero Section with personalized message */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-primary shadow-buff-glow mb-4"
        >
          <img src={buffLogo} alt="BUFF" className="w-14 h-14" />
        </motion.div>
        
        {/* Dynamic personalized header */}
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`font-bold text-foreground mb-2 px-2 ${getMessageStyle()}`}
        >
          {personalizedMessage}
        </motion.h2>
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

      {/* Install CTA or Alternative Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {isInstallable ? (
          <Button
            onClick={onInstall}
            size="lg"
            className="w-full h-14 text-lg font-bold gap-3 bg-gradient-primary shadow-buff-glow hover:shadow-buff-glow-intense transition-all"
          >
            <Sparkles className="w-5 h-5" />
            התקן עכשיו
            <Sparkles className="w-5 h-5" />
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Explanation why install isn't available */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
              <p className="text-sm text-muted-foreground mb-2">
                ההתקנה האוטומטית לא זמינה כרגע
              </p>
              <p className="text-xs text-muted-foreground/70">
                {browserName !== 'דפדפן' 
                  ? `אתם משתמשים ב-${browserName}. נסו לפתוח ב-Chrome או Edge.`
                  : 'נסו להשתמש ב-Chrome או Edge'}
              </p>
            </div>
            
            {/* Manual installation instructions */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground text-center">
                להתקנה ידנית ב-{browserName}:
              </p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <p className="text-sm text-foreground">
                  לחצו על {menuIcon} {menuLocation}
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <p className="text-sm text-foreground">
                  בחרו "{installAction}"
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function InstallPrompt({ onClose, showAsModal = true }: InstallPromptProps) {
  const { 
    deviceOS, 
    canShowPrompt,
    isInstalled,
    isInstallable,
    triggerInstall, 
    dismiss,
    dismissPermanently,
  } = usePWAInstall();
  
  const { message: personalizedMessage, messageType, templateIndex, childrenCount } = useInstallPromptMessage();
  const isDesktop = deviceOS === 'desktop';
  const browserInfo = useBrowserDetection(isDesktop);
  const browser = detectBrowser();
  
  const [isVisible, setIsVisible] = useState(true);
  const impressionTracked = useRef(false);

  // Track impression when prompt is shown - including message type and browser
  useEffect(() => {
    if (!isInstalled && canShowPrompt && !impressionTracked.current) {
      trackPWAEvent('pwa_prompt_impression', deviceOS, {
        message_type: messageType,
        template_index: templateIndex,
        browser,
      });
      impressionTracked.current = true;
    }
  }, [isInstalled, canShowPrompt, deviceOS, messageType, templateIndex, browser]);

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

  const handleDismissPermanently = () => {
    dismissPermanently();
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  // iOS gets the special floating arrow guide
  if (deviceOS === 'ios') {
    return (
      <AnimatePresence>
        <IOSInstallGuide 
          onDismiss={handleDismiss} 
          onDismissPermanently={handleDismissPermanently}
        />
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
          className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9998 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl border border-border relative"
          >
            {/* Close button - dismisses permanently */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismissPermanently}
              className="absolute top-4 left-4 h-8 w-8 rounded-full"
              title="סגור לצמיתות"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-glow opacity-50 pointer-events-none" />

            <div className="relative">
              <AndroidDesktopInstructions 
                onInstall={handleInstall} 
                deviceOS={deviceOS}
                isInstallable={isInstallable}
                personalizedMessage={personalizedMessage}
                childrenCount={childrenCount}
                browserName={browserInfo.displayName}
                menuIcon={browserInfo.menuIcon}
                menuLocation={browserInfo.menuLocation}
                installAction={browserInfo.installAction}
              />
            </div>

            {/* Dismiss option - temporary */}
            <div className="mt-6 text-center">
              <button
                onClick={handleDismiss}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                לא עכשיו, הזכירו לי מאוחר יותר
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
        className="fixed bottom-0 inset-x-0"
        style={{ zIndex: 9998 }}
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
                  onClick={handleDismissPermanently}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4" />
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
