import { 
  ArrowRight, 
  Sparkles, 
  Trophy, 
  Target, 
  Calendar, 
  Lightbulb,
  Brain,
  Heart,
  BookOpen,
  X,
  Share2,
  Zap,
  Shield,
  Flame
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { useNavigate } from 'react-router-dom';

interface BuffPhilosophyPageProps {
  onBack?: () => void;
  isModal?: boolean;
  onClose?: () => void;
  onNavigateToSettings?: () => void;
}

export function BuffPhilosophyPage({ onBack, isModal, onClose, onNavigateToSettings }: BuffPhilosophyPageProps) {
  const navigate = useNavigate();

  const philosophyPoints = [
    {
      id: 'branding',
      icon: Zap,
      title: 'השם Buff - העצמה ושדרוג יכולות',
      subtitle: 'לא עוד רשימת מטלות - אלא כלי להעצמה',
      content: `במשחקי וידאו, "Buff" הוא בונוס שמחזק את הדמות באופן זמני ומאפשר לה להתמודד עם אתגרים שנראו בלתי אפשריים. זה בדיוק מה שאנחנו רוצים לתת לילד שלכם.

Buff היא לא עוד אפליקציה לניהול משימות. היא מערכת העצמה שמדברת בשפה שהילדים מבינים ואוהבים. הילדים שלכם לא "מסמנים משימות" - הם "משלימים קווסטים" וצוברים "Buff Points" לתוך "הכספת" (The Vault).

השפה הזו אינה גימיק - היא יוצרת חיבור רגשי עמוק והופכת את השגרה המאתגרת להרפתקה שהילד רוצה להיות חלק ממנה.`,
      cogFunInsight: 'גישת Cog-Fun מלמדת שמוטיבציה פנימית נבנית כאשר הפעילות מרגישה משמעותית ומהנה לילד עצמו. שפת גיימינג מוכרת ממזערת התנגדות ומגבירה מעורבות אצל ילדים עם קשיי קשב וריכוז.',
      color: 'from-indigo-500 to-purple-600',
    },
    {
      id: 'rewards',
      icon: Trophy,
      title: 'אסטרטגיית הפרסים - גשר הדופמין',
      subtitle: 'פרסים מדורגים לפי "ימי הצלחה" (1, 2, 4, 5, 10)',
      content: `עבור מוח עם ADHD, העתיד הרחוק הוא מופשט ולא מוחשי. פרסים גדולים "בעוד חודש" אינם מניעים - הם מרגישים כמו נצח.

לכן, בנינו מערכת פרסים מדורגת לפי "ימי הצלחה":

📱 יום אחד (1x יעד חכם) - תוספת זמן מסך או בחירת קינוח
🎉 יומיים (2x יעד חכם) - פטור ממטלה מעצבנת אחת
🎬 ארבעה ימים (4x יעד חכם) - ערב סרט ופופקורן
🍕 חמישה ימים (5x יעד חכם) - ערב פיצה או סושי
🎢 עשרה ימים (10x יעד חכם) - יום כיף

השיטה הזו יוצרת "גשר דופמין" - פרסים קטנים ונגישים כל יומיים בונים התמדה וביטחון עצמי, בעוד הפרסים הגדולים מלמדים דחיית סיפוקים בצורה הדרגתית.`,
      cogFunInsight: 'מחקרים מראים שילדים עם ADHD מגיבים טוב יותר לחיזוקים מיידיים וקרובים. פרסים קטנים ותכופים יעילים יותר מפרס גדול אחד רחוק. השילוב של שני הסוגים בונה גם מוטיבציה מיידית וגם יכולת לדחיית סיפוקים.',
      color: 'from-rose-500 to-pink-600',
    },
    {
      id: 'positive',
      icon: Shield,
      title: 'חיזוקים חיוביים בלבד - נמל מבטחים',
      subtitle: 'יצירת סביבה בטוחה ללא עונשים או הפחתות',
      content: `אנחנו יודעים כמה קשה לראות את הילד מתמודד עם תסכול. לכן בנינו מערכת שיוצרת "נמל מבטחים" רגשי - מקום בו הילד לא יכול להפסיד.

במערכת Buff, הילד יכול רק להרוויח נקודות - לעולם לא להפסיד אותן. אין נקודות שליליות, אין הורדות, אין עונשים. כשמשימה לא הושלמה, היא פשוט לא צברה נקודות - וזהו.

למה זה כל כך חשוב? כי ילדים עם ADHD חווים יותר ביקורת ותיקונים מאחרים. הם צריכים מרחב בו הם יכולים לנסות, להיכשל, ולנסות שוב - בלי פחד מעונש.

ההתמקדות תמיד במה שכן הושג. זה מפחית התנגדויות ובונה ביטחון עצמי.`,
      cogFunInsight: 'מחקרים מראים שילדים עם ADHD מגיבים טוב יותר לחיזוק חיובי מאשר לעונשים. חיזוק שלילי יוצר חרדה ונמנעות, בעוד חיזוק חיובי בונה ביטחון עצמי ומוטיבציה פנימית לטווח ארוך.',
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'bonus',
      icon: Heart,
      title: 'בונוס הורה - הכרה במאמץ השקוף',
      subtitle: 'כלי לזיהוי העבודה הקשה שלא תמיד נראית',
      content: `אנחנו יודעים שהרבה מהמאמץ של הילד שלכם הוא "שקוף" - הוא לא נראה לעין. להתגבר על הדחף לקום מהכיסא, להתאפק מלהגיב, להישאר ממוקד - כל אלה דורשים מאמץ עצום שלא מתועד במשימות.

לכן נתנו לכם כלי ייחודי: "בונוס יום מוצלח" - 20 Buff Points שאתם מעניקים לילד פעם ביום, לפי שיקול דעתכם.

זה לא אוטומטי. זו החלטה מודעת שלכם להגיד לילד: "ראיתי את המאמץ שלך היום".

הבונוס הזה יוצר הזדמנות לשיחה חיובית, מחזק את הקשר בינכם, ומלמד את הילד שמאמץ מוערך - גם כשהתוצאות לא מושלמות. זו גם הזדמנות להפגין גמישות כהורים.`,
      cogFunInsight: 'אינטראקציה חיובית בין הורה לילד היא מרכיב קריטי בפיתוח תפקודים ניהוליים. הבונוס משמש כ"גשר רגשי" ומחזק את תחושת ה-Agency של הילד - ההרגשה שהוא יכול להשפיע על מציאות חייו.',
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'dayTypes',
      icon: Calendar,
      title: 'סוגי ימים - ניהול אנרגיה ומניעת שחיקה',
      subtitle: 'התאמה אוטומטית בין יום לימודים ליום מנוחה',
      content: `ילדים עם ADHD צורכים יותר אנרגיה מנטלית במהלך היום. הם "רצים מרתון כשאחרים רצים ספרינט". לכן חיוני להתאים את הציפיות לסוג היום.

המערכת מזהה אוטומטית אם זה "יום לימודים" (ראשון-חמישי) או "יום חופש" (שישי-שבת וחגים) ומתאימה את המשימות בהתאם:

📚 יום לימודים - דגש על שגרת בוקר יעילה, הכנה לבית ספר, ושגרת ערב מרגיעה.

🌴 יום חופש - דגש על מנוחה והתאוששות, עזרה בבית בקצב רגוע, וזמן ליצירתיות.

ההתאמה הזו מונעת שחיקה. היא מלמדת את הילד שגם מנוחה היא חלק מהתוכנית, ושציפיות משתנות בהתאם להקשר - שיעור חשוב לחיים.`,
      cogFunInsight: 'ילדים עם ADHD זקוקים למבנה יציב, אבל גם לגמישות מותאמת. היכולת לזהות "סוג יום" ולהתאים ציפיות מפחיתה עומס קוגניטיבי ומונעת את תחושת הכישלון שנובעת מציפיות לא ריאליסטיות.',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'smartGoal',
      icon: Flame,
      title: 'יעד ה-70% - רצף ניצחונות',
      subtitle: 'בניית הצלחה על הצלחה',
      content: `אחד הלקחים החשובים ביותר שלמדנו מעבודה עם ילדים עם ADHD הוא שיעדים גבוהים מדי הורסים מוטיבציה.

לכן, במקום יעד קבוע של "100% מהמשימות", המערכת מחשבת אוטומטית יעד של 70% מסך הנקודות האפשריות ליום ספציפי.

למה דווקא 70%?
• גבוה מספיק לאתגר את הילד
• נמוך מספיק להיות מושג ביום רגיל
• משאיר מרווח ל"ימים קשים" בלי להרגיש כישלון

כשהילד מגיע ל-70%, הוא מרגיש הצלחה אמיתית. כשהוא עובר את ה-70%, הוא מרגיש שהוא "מנצח את המשחק".

זה יוצר "רצף ניצחונות" (Winning Streak) שבונה ביטחון עצמי במקום לקבע תחושת כישלון כרונית.`,
      cogFunInsight: 'יעדים לא ריאליסטיים הם אחד הגורמים העיקריים לנשירה ממערכות התנהגותיות. כלל ה-70% מבוסס על עקרון "הצלחה בנויה על הצלחה" - כל הישג מחזק את המוטיבציה להמשך וגורם לילד לרצות להמשיך לנסות.',
      color: 'from-blue-500 to-cyan-600',
    },
  ];

  const handleStartClick = () => {
    if (isModal && onClose) {
      onClose();
    }
    if (onNavigateToSettings) {
      onNavigateToSettings();
    } else if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
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
              <Brain className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground font-display">
                תפיסת העולם של Buff
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              מדריך מקצועי להורים - הפילוסופיה מאחורי המערכת
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const shareText = `🎮 *תפיסת העולם של Buff* - אפליקציה לילדים עם ADHD

📱 Buff משתמשת בשפת גיימינג ועקרונות Cog-Fun כדי לעזור לילדים לבנות שגרה יומית בצורה מהנה וחיובית.

✨ *עקרונות מרכזיים:*
• העצמה במקום רשימת מטלות
• חיזוק חיובי בלבד - נמל מבטחים
• בונוס הורה לזיהוי מאמץ שקוף
• התאמה אוטומטית לסוג היום
• יעד 70% לבניית רצף ניצחונות

🔗 למידע נוסף: https://buff.lovable.app`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="text-primary hover:bg-primary/10"
            >
              <Share2 className="w-4 h-4 ml-1" />
              שתף
            </Button>
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

        {/* Introduction Card */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                מהורים להורים
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                אנחנו יודעים כמה מאתגר לגדל ילד עם קשיי קשב וריכוז. הכנו עבורכם מדריך שמסביר את הגישה המקצועית שמאחורי Buff - 
                מערכת שנבנתה בשיתוף פעולה עם מומחים בתחום, מבוססת על עקרונות Cog-Fun שהוכחו מחקרית.
              </p>
            </div>
          </div>
        </div>

        {/* Philosophy Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {philosophyPoints.map((point, index) => (
            <AccordionItem 
              key={point.id} 
              value={point.id}
              className="border border-border rounded-2xl overflow-hidden bg-card data-[state=open]:shadow-md transition-shadow"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4 text-right w-full">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${point.color} text-white shrink-0`}>
                    <point.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {index + 1}/{philosophyPoints.length}
                      </span>
                      <h3 className="font-semibold text-foreground truncate">
                        {point.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {point.subtitle}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="space-y-4 pt-2">
                  {/* Main Content */}
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {point.content}
                  </div>

                  {/* Cog-Fun Insight Box */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-primary/20 shrink-0">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground text-sm mb-1">
                          תובנת Cog-Fun
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {point.cogFunInsight}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* CTA Button */}
        <div className="mt-8">
          <Button
            onClick={handleStartClick}
            className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            <Sparkles className="w-5 h-5 ml-2" />
            הבנתי, בואו נתחיל!
          </Button>
        </div>

        {/* Footer Note */}
        <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border text-center">
          <p className="text-xs text-muted-foreground">
            💡 טיפ: שתפו את העמוד הזה עם בני זוג, מורים, או מטפלים - 
            כדי שכולם יבינו את הגישה וידעו לתמוך בילד בצורה עקבית.
          </p>
        </div>
      </div>
    </div>
  );
}
