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
import { useLanguage } from '@/contexts/LanguageContext';
import buffLogoNoBg from '@/assets/buff-logo-no-bg.png';

interface InstallPromptProps {
  onClose?: () => void;
  showAsModal?: boolean;
}

// Floating Arrow Component for iOS
function FloatingArrow() {
  const { language } = useLanguage();
  const isHe = language === 'he';
  
  return (
    <motion.div
      className="fixed left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ zIndex: 9999, bottom: '290px' }}
      initial={{ y: 0 }}
      animate={{ y: [0, 12, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 blur-lg bg-primary/50 rounded-full scale-[2]" />
        <ChevronDown className="w-12 h-12 text-primary relative z-10 drop-shadow-lg" strokeWidth={3} />
        <span className="text-sm text-primary font-bold mt-1 relative z-10 whitespace-nowrap bg-background/80 px-3 py-1 rounded-full backdrop-blur-sm">
          {isHe ? 'לחצו כאן למטה ↓' : 'Tap here below ↓'}
        </span>
      </div>
    </motion.div>
  );
}

// Apple Share Icon SVG
function AppleShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

// iOS-specific instruction component
function IOSInstallGuide({ onDismiss, onDismissPermanently }: { onDismiss: () => void; onDismissPermanently: () => void }) {
  const { language } = useLanguage();
  const isHe = language === 'he';

  return (
    <>
      <FloatingArrow />
      
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 inset-x-0"
        style={{ zIndex: 9998 }}
      >
        <div className="bg-card/95 backdrop-blur-xl border-t border-border rounded-t-3xl shadow-2xl">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
          
          <div className="p-5 pb-safe max-w-lg mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] flex items-center justify-center shadow-lg">
                  <img src={buffLogoNoBg} alt="BUFF" className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    {isHe ? 'התקינו את BUFF' : 'Install BUFF'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isHe ? 'הוסיפו לקיצורי הדרך שלכם' : 'Add to your home screen'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismissPermanently}
                className="h-8 w-8 rounded-full -mt-1 -ml-2"
                title={isHe ? 'סגור לצמיתות' : 'Dismiss permanently'}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                <div className="flex-1">
                  <p className="text-foreground font-medium text-sm">{isHe ? 'לחצו על כפתור השיתוף' : 'Tap the Share button'}</p>
                  <p className="text-xs text-muted-foreground">{isHe ? 'בתחתית המסך ב-Safari' : 'At the bottom of Safari'}</p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AppleShareIcon className="w-5 h-5 text-primary" />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                <div className="flex-1">
                  <p className="text-foreground font-medium text-sm">{isHe ? 'גללו ובחרו "הוסף למסך הבית"' : 'Scroll and select "Add to Home Screen"'}</p>
                  <p className="text-xs text-muted-foreground">Add to Home Screen</p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-accent" />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">3</div>
                <div className="flex-1">
                  <p className="text-foreground font-medium text-sm">{isHe ? 'לחצו "הוסף" וזהו! 🎉' : 'Tap "Add" and you\'re done! 🎉'}</p>
                  <p className="text-xs text-muted-foreground">{isHe ? 'BUFF יופיע במסך הבית' : 'BUFF will appear on your home screen'}</p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
              </motion.div>
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onDismiss}
              className="w-full mt-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              {isHe ? 'לא עכשיו, הזכירו לי מאוחר יותר' : 'Not now, remind me later'}
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
  const { language } = useLanguage();
  const isHe = language === 'he';
  
  const features = isHe
    ? [
        { icon: Zap, title: 'גישה מהירה', description: 'פתחו מהמסך הראשי' },
        { icon: Bell, title: 'התראות', description: 'קבלו עדכונים בזמן אמת' },
        { icon: Wifi, title: 'עובד אופליין', description: 'גם בלי אינטרנט' },
      ]
    : [
        { icon: Zap, title: 'Quick Access', description: 'Open from home screen' },
        { icon: Bell, title: 'Notifications', description: 'Get real-time updates' },
        { icon: Wifi, title: 'Works Offline', description: 'Even without internet' },
      ];

  const getMessageStyle = () => {
    if (childrenCount >= 3 || personalizedMessage.length > 70) return 'text-sm leading-relaxed';
    if (childrenCount >= 2 || personalizedMessage.length > 50) return 'text-base leading-relaxed';
    return 'text-lg';
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#DCFCE7] shadow-lg mb-4"
        >
          <img src={buffLogoNoBg} alt="BUFF" className="w-16 h-16 object-contain" />
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`font-bold text-foreground mb-2 px-2 ${getMessageStyle()}`}
        >
          {personalizedMessage}
        </motion.h2>
      </div>

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
            {isHe ? 'התקן עכשיו' : 'Install Now'}
            <Sparkles className="w-5 h-5" />
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {isHe ? 'ההתקנה האוטומטית לא זמינה כרגע' : 'Auto-install is not available right now'}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {isHe
                  ? (browserName !== 'דפדפן' 
                      ? `אתם משתמשים ב-${browserName}. נסו לפתוח ב-Chrome או Edge.`
                      : 'נסו להשתמש ב-Chrome או Edge')
                  : `Try opening in Chrome or Edge for the best experience.`
                }
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground text-center">
                {isHe ? `להתקנה ידנית ב-${browserName}:` : `To install manually in ${browserName}:`}
              </p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <p className="text-sm text-foreground">
                  {isHe ? `לחצו על ${menuIcon} ${menuLocation}` : `Tap ${menuIcon} ${menuLocation}`}
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <p className="text-sm text-foreground">
                  {isHe ? `בחרו "${installAction}"` : `Select "${installAction}"`}
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
  const { language } = useLanguage();
  const isHe = language === 'he';
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

  if (isInstalled || !canShowPrompt) return null;

  const handleInstall = async () => {
    const success = await triggerInstall();
    if (success) {
      setIsVisible(false);
      onClose?.();
    }
  };

  const handleDismiss = () => {
    dismiss(24);
    setIsVisible(false);
    onClose?.();
  };

  const handleDismissPermanently = () => {
    dismissPermanently();
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismissPermanently}
              className="absolute top-4 left-4 h-8 w-8 rounded-full"
              title={isHe ? 'סגור לצמיתות' : 'Dismiss permanently'}
            >
              <X className="w-4 h-4" />
            </Button>

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

            <div className="mt-6 text-center">
              <button
                onClick={handleDismiss}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isHe ? 'לא עכשיו, הזכירו לי מאוחר יותר' : 'Not now, remind me later'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Bottom sheet version
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
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[#DCFCE7] flex items-center justify-center shadow-lg">
                <img src={buffLogoNoBg} alt="BUFF" className="w-12 h-12 object-contain" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  {isHe ? 'שדרגו לחוויה מלאה' : 'Upgrade to the full experience'}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {isHe ? 'התקינו את BUFF למסך הבית' : 'Install BUFF to your home screen'}
                </p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleDismissPermanently} className="text-muted-foreground">
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleInstall} className="gap-1.5 bg-gradient-primary shadow-buff-glow">
                  <Zap className="w-4 h-4" />
                  {isHe ? 'התקן' : 'Install'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
