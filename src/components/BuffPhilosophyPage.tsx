import { useState } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Trophy, 
  Target, 
  Calendar, 
  Lightbulb,
  Brain,
  Heart,
  Zap,
  BookOpen,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

interface BuffPhilosophyPageProps {
  onBack?: () => void;
  isModal?: boolean;
  onClose?: () => void;
}

export function BuffPhilosophyPage({ onBack, isModal, onClose }: BuffPhilosophyPageProps) {
  const philosophyPoints = [
    {
      id: 'branding',
      icon: Sparkles,
      title: 'מיתוג גיימינג - שפת הילדים',
      subtitle: '"Buff" - לא עוד אפליקציית משימות',
      content: `במשחקי וידאו, "Buff" הוא בונוס זמני שמחזק את הדמות. בחרנו בשם הזה כי זו בדיוק המטרה שלנו - לתת לילדים כלים שמחזקים אותם בחיי היומיום.

הילדים לא "מסמנים משימות" - הם "משלימים קווסטים" וצוברים "Buff Points" לתוך "הכספת" (The Vault). השפה הזו יוצרת חיבור רגשי והופכת שגרה משעממת להרפתקה.`,
      cogFunInsight: 'גישת Cog-Fun מדגישה שמוטיבציה פנימית נבנית כשהפעילות מרגישה משמעותית ומהנה. שפת גיימינג ממזערת התנגדות ומגבירה מעורבות אצל ילדים עם ADHD.',
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'positive',
      icon: Heart,
      title: 'חיזוק חיובי בלבד',
      subtitle: 'אין עונשים, אין הפסדים - רק הישגים',
      content: `המערכת מבוססת על חיזוק חיובי בלבד. ילדים יכולים רק להרוויח נקודות - לעולם לא להפסיד אותן. לא מעניקים נקודות "שליליות" ולא מחסרים Buff Points על אי-השלמה.

כשמשימה לא הושלמה, היא פשוט לא צברה נקודות. ההתמקדות היא תמיד במה שכן הושג, לא במה שהוחמץ.`,
      cogFunInsight: 'מחקרים מראים שילדים עם ADHD מגיבים טוב יותר לחיזוק חיובי מאשר לעונשים. חיזוק שלילי יוצר חרדה ונמנעות, בעוד חיזוק חיובי בונה ביטחון עצמי ומוטיבציה פנימית.',
      color: 'from-rose-500 to-pink-600',
    },
    {
      id: 'bonus',
      icon: Trophy,
      title: 'כפתור הבונוס היומי',
      subtitle: 'הכרה בעבודה הקשה של הילד',
      content: `בכל יום, ההורה יכול להעניק "בונוס יום נקי" של 50 Buff Points נוספים. זה לא אוטומטי - זו החלטה מודעת של ההורה להכיר במאמץ הילד.

הבונוס הזה מחזק את הקשר בין הורה לילד, יוצר הזדמנות לשיחה על ההישגים, ומלמד שמאמץ מתמשך מביא לתגמול נוסף מעבר להישג הבסיסי.`,
      cogFunInsight: 'אינטראקציה חיובית בין הורה לילד היא מרכיב קריטי בפיתוח תפקודים ניהוליים. הבונוס משמש כ"גשר רגשי" ומחזק את תחושת ה-Agency של הילד.',
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'dayTypes',
      icon: Calendar,
      title: 'שני סוגי ימים - גמישות מובנית',
      subtitle: 'יום לימודים vs. יום חופש',
      content: `המערכת מבחינה אוטומטית בין "יום לימודים" (ראשון-חמישי) ל"יום חופש" (שישי-שבת וחגים). לכל סוג יום יש תבנית משימות שונה.

ביום לימודים - דגש על שגרת בוקר, הכנה לבית ספר, והתארגנות לערב.
ביום חופש - דגש על מנוחה, עזרה בבית, ויצירתיות.

ההתאמה האוטומטית מונעת תסכול ויוצרת ציפיות ריאליסטיות.`,
      cogFunInsight: 'ילדים עם ADHD זקוקים למבנה, אבל גם לגמישות. היכולת לזהות "סוג יום" ולהתאים ציפיות מפחיתה עומס קוגניטיבי ומאפשרת להם להתמקד בביצוע.',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'smartGoal',
      icon: Target,
      title: 'היעד החכם - כלל ה-70%',
      subtitle: 'הצלחה נבנית על הישגים ריאליסטיים',
      content: `במקום יעד קבוע ושרירותי, המערכת מחשבת אוטומטית יעד של 70% מסך הנקודות האפשריות ליום ספציפי.

למה 70%? כי זה מספיק גבוה לאתגר, אבל נמוך מספיק כדי להיות מושג. הילד שמגיע ל-70% מרגיש הצלחה אמיתית, ומי שמגיע ליותר - מרגיש שהוא "עולה על הציפיות".

זה בונה ביטחון עצמי במקום לקבע תחושת כישלון.`,
      cogFunInsight: 'יעדים לא ריאליסטיים הם אחד הגורמים העיקריים לנשירה ממערכות התנהגותיות. כלל ה-70% מבוסס על עקרון "הצלחה בנויה על הצלחה" - כל הישג מחזק את המוטיבציה להמשך.',
      color: 'from-blue-500 to-cyan-600',
    },
  ];

  const containerClass = isModal 
    ? 'max-h-[80vh] overflow-y-auto' 
    : 'min-h-screen bg-background safe-area-all';

  return (
    <div className={containerClass}>
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
              הפילוסופיה מאחורי המערכת
            </p>
          </div>
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

        {/* Introduction Card */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                מבוסס על גישת Cog-Fun
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Buff נבנה על עקרונות קוגניטיביים-פונקציונליים שהוכחו מחקרית כיעילים לילדים עם ADHD. 
                השילוב של אסתטיקת גיימינג עם מדע התנהגותי יוצר מערכת שעובדת עם הילד, לא נגדו.
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
                        {index + 1}/5
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

        {/* Footer Note */}
        <div className="mt-8 p-4 rounded-xl bg-secondary/30 border border-border text-center">
          <p className="text-xs text-muted-foreground">
            💡 טיפ: שתפו את העמוד הזה עם בני זוג, מורים, או מטפלים - 
            כדי שכולם יבינו את הגישה וידעו לתמוך בילד בצורה עקבית.
          </p>
        </div>
      </div>
    </div>
  );
}
