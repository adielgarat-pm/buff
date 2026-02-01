import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Shield, Sparkles } from 'lucide-react';

interface Step6ParentTipProps {
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function Step6ParentTip({ onComplete, onBack, isLoading }: Step6ParentTipProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-5 py-6 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            טיפ להורה המלווה 💜
          </h1>
          <p className="text-sm text-muted-foreground">
            שותפות, לא שיטור
          </p>
        </div>

        {/* Tips */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-right">
              <p className="text-sm font-medium text-foreground mb-1">שחררו את הלחץ</p>
              <p className="text-sm text-muted-foreground">
                תנו לאפליקציה להיות ה"מנהלת". אתם לא צריכים לזכור ולעקוב אחרי כל דבר.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
            <MessageCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="text-right">
              <p className="text-sm font-medium text-foreground mb-1">שאלה אחת ביום</p>
              <p className="text-sm text-muted-foreground">
                "מה BUFF מראה שתכננתם להיום?" – וזה הכל. פשוט וחכם.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
            <Sparkles className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-right">
              <p className="text-sm font-medium text-foreground mb-1">הרווח שלכם</p>
              <p className="text-sm text-muted-foreground">
                פחות ויכוחים, יותר עצמאות וביטחון לילדים. זה עובד!
              </p>
            </div>
          </div>
        </div>

        {/* Final message */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-success/10 border border-primary/20">
          <p className="text-center text-sm font-medium text-foreground">
            🎉 הכל מוכן! הילד/ה יכולים להתחבר עם הקוד המשפחתי ולהתחיל לצבור נקודות.
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="px-5 pb-8 pt-4 flex gap-3">
        <Button 
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 h-12 rounded-xl"
        >
          חזרה
        </Button>
        <Button 
          onClick={onComplete}
          disabled={isLoading}
          className="flex-[2] h-14 text-lg font-bold rounded-2xl bg-gradient-to-l from-primary to-success"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              יוצרים את המשפחה...
            </span>
          ) : (
            'יוצאים לדרך! 🚀'
          )}
        </Button>
      </div>
    </div>
  );
}
