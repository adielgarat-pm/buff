import { useState } from 'react';
import { 
  ArrowRight, 
  Heart, 
  MessageCircle,
  Users,
  Sparkles,
  X,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Separator } from './ui/separator';

interface AboutPageProps {
  onBack?: () => void;
  isModal?: boolean;
  onClose?: () => void;
  onNavigateToPhilosophy?: () => void;
}

export function AboutPage({ onBack, isModal, onClose, onNavigateToPhilosophy }: AboutPageProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleWhatsAppContact = () => {
    window.open('https://chat.whatsapp.com/JUCsJ7yrNWQC4E25vqNIK5?mode=gi_t', '_blank');
  };

  const containerClass = isModal 
    ? 'max-h-[80vh] overflow-y-auto' 
    : 'min-h-screen bg-background safe-area-all';

  return (
    <div className={`theme-parent-zen ${containerClass}`}>
      <div className={isModal ? 'p-6' : 'max-w-2xl mx-auto px-5 py-6 pb-24'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground font-display">
                אודות
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              הסיפור מאחורי Buff
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isModal && onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            )}
            {!isModal && onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
                <ArrowRight className="w-4 h-4 ml-1" />
                חזרה
              </Button>
            )}
          </div>
        </div>

        {/* Creator Profile */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-2xl font-bold">
              ע
            </AvatarFallback>
          </Avatar>
          <p className="text-lg text-foreground leading-relaxed max-w-md">
            היי, אני <span className="font-semibold text-primary">עדי אלגרט גרמן</span> - מנהלת מוצר ביומיום, אבל לפני הכל – אני אמא של איתי ואמי.
          </p>
        </div>

        {/* The Mission */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/20 shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                המשימה
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Buff נולדה מתוך מחקר מעמיק בעולמות התפקודים הניהוליים (Executive Functions) ואימון קוגניטיבי, בשילוב הניסיון האישי שלי כאמא וכמנהלת מוצר.
                רציתי להפסיק להיות ה'שוטרת' של המשימות ולהפוך למאמנת של הילדים שלי, תוך שימוש בכלים שבאמת מדברים אליהם.
              </p>
            </div>
          </div>
        </div>

        {/* The Philosophy */}
        <div className="mb-6 p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-secondary shrink-0">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                הפילוסופיה
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                האפליקציה הזו היא לא רק כלי טכנולוגי; היא הדרך שלנו להפוך את ניהול השגרה למשחק של העצמה, בניית חוסן ותחושת מסוגלות.
              </p>
            </div>
          </div>
        </div>

        {/* Community & Contact */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-xl bg-accent/20 shrink-0">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                קהילה ושיח
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                אני מאמינה גדולה בכוח של קהילה. אשמח לשמוע מכם, ללמוד מהניסיון שלכם ולחשוב יחד איך להפוך את Buff לטובה יותר עבור הילדים של כולנו.
              </p>
            </div>
          </div>

          {/* WhatsApp Button */}
          <Button
            onClick={handleWhatsAppContact}
            className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <MessageCircle className="w-5 h-5 ml-2" />
            דברו איתי בוואטסאפ
          </Button>
        </div>

        {/* Link to Philosophy Page */}
        {onNavigateToPhilosophy && (
          <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border">
            <Button
              variant="ghost"
              onClick={onNavigateToPhilosophy}
              className="w-full justify-center text-primary hover:bg-primary/10"
            >
              <Lightbulb className="w-4 h-4 ml-2" />
              קראו את תפיסת העולם של Buff
            </Button>
          </div>
        )}

        {/* Legal Disclaimer Section */}
        <div className="mt-8">
          <Separator className="mb-6" />
          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted shrink-0">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  {t('legal.title')}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('legal.disclaimer')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            💜 נבנה באהבה, להורים ולילדים
          </p>
        </div>
      </div>
    </div>
  );
}
