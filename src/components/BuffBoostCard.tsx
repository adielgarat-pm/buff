import { useState } from 'react';
import { Rocket, Coffee, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBuffBoost } from '@/hooks/useBuffBoost';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to format multiple children names nicely
function formatChildrenNames(names: string[]): string {
  if (names.length === 0) return 'הילדים';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} ו${names[1]}`;
  // For 3+ names: "name1, name2 ו-name3"
  const lastNameWithVav = `ו${names[names.length - 1]}`;
  return `${names.slice(0, -1).join(', ')} ${lastNameWithVav}`;
}

export function BuffBoostCard() {
  const {
    isLoading,
    shouldShow,
    childrenNames,
    handleSupport,
    handleDismiss,
  } = useBuffBoost();

  const [isVisible, setIsVisible] = useState(true);

  if (isLoading || !shouldShow || !isVisible) {
    return null;
  }

  const formattedNames = formatChildrenNames(childrenNames);

  const onSupportClick = async () => {
    const supported = await handleSupport();
    if (supported) {
      // Show thank you toast when they return
      setTimeout(() => {
        toast({
          title: '💜 תודה רבה!',
          description: 'התמיכה שלכם עוזרת לנו להמשיך לפתח עבור משפחות נוספות.',
        });
      }, 2000);
    }
  };

  const onDismissClick = async () => {
    await handleDismiss();
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="relative mx-4 my-4"
        dir="rtl"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-success/10 to-warning/10 border border-primary/20 p-5 shadow-lg">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-success/5 rounded-full translate-x-12 translate-y-12" />

          {/* Dismiss button */}
          <button
            onClick={onDismissClick}
            className="absolute top-3 left-3 p-1.5 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
            aria-label="סגור"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Content */}
          <div className="relative z-10">
            {/* Icon & Title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-success flex items-center justify-center shadow-md">
                <Rocket className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground leading-tight">
                  זה עובד! {formattedNames} בדרך להצלחה 🌟
                </h3>
              </div>
            </div>

            {/* Body Text */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              כבר כמה ימים ש-BUFF עוזרת לכם לייצר שגרה חיובית בבית. 
              אנחנו פרויקט קהילתי, ואם אתם מקבלים מאיתנו ערך - נשמח ל-Boost קטן שיעזור לנו להמשיך לפתח עבורכם.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={onSupportClick}
                className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-l from-primary to-success hover:opacity-90 transition-opacity"
              >
                <Coffee className="w-5 h-5 ml-2" />
                אני רוצה לתת Boost
                <Heart className="w-4 h-4 mr-2 animate-pulse" />
              </Button>

              <button
                onClick={onDismissClick}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                אולי פעם אחרת
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
