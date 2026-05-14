import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import buffLogo from '@/assets/buff-logo-no-bg.png';

const sections = [
  {
    icon: '⚡',
    titleHe: 'השם Buff — העצמה',
    titleEn: 'The Name "Buff" — Empowerment',
    contentHe: '"Buff" בגיימינג הוא בונוס שמעצים את הדמות שלך. אנחנו הופכים שגרות יומיות להרפתקאות בשפה שילדים אוהבים — משימות, נקודות וחנות פרסים.',
    contentEn: '"Buff" in gaming is a power-up bonus. We turn daily routines into adventures using the language kids love — quests, points, and a reward shop.',
    insightHe: 'שפת גיימינג מפחיתה התנגדות ומגבירה מעורבות בילדים עם קשיי קשב.',
    insightEn: 'Gaming language minimizes resistance and increases engagement in children with attention difficulties.',
    color: '#6366f1',
  },
  {
    icon: '🏆',
    titleHe: 'גשר הדופמין — פרסים חכמים',
    titleEn: 'Dopamine Bridge — Smart Rewards',
    contentHe: 'פרסים רחוקים לא מניעים מוח עם ADHD. לכן בנינו מערכת מדורגת — מתגמול יומי קטן ועד יום כיף אחרי 10 ימי הצלחה.',
    contentEn: 'Distant rewards don\'t motivate an ADHD brain. We built a tiered system — from small daily rewards to a fun day out after 10 success days.',
    insightHe: 'פרסים קטנים ותכופים יעילים יותר מפרס גדול אחד רחוק.',
    insightEn: 'Small, frequent rewards are more effective than one large distant reward.',
    color: '#ec4899',
  },
  {
    icon: '🛡️',
    titleHe: 'נמל מבטחים — רק חיזוק חיובי',
    titleEn: 'Safe Harbor — Positive Only',
    contentHe: 'הילד יכול רק להרוויח נקודות — לעולם לא להפסיד. אין הורדות, אין עונשים. משימה שלא הושלמה פשוט לא צברה נקודות.',
    contentEn: 'Your child can only earn points — never lose them. No deductions, no punishments. An incomplete task simply didn\'t earn points.',
    insightHe: 'חיזוק חיובי בונה ביטחון עצמי ומוטיבציה פנימית לטווח ארוך.',
    insightEn: 'Positive reinforcement builds self-confidence and long-term intrinsic motivation.',
    color: '#10b981',
  },
  {
    icon: '❤️',
    titleHe: 'בונוס הורה — המאמץ השקוף',
    titleEn: 'Parent Bonus — The Invisible Effort',
    contentHe: 'להתאפק, להישאר ממוקד, להתגבר על דחף — מאמץ עצום שלא מתועד. "בונוס יום מוצלח" הוא הדרך שלכם להגיד: "ראיתי אותך היום".',
    contentEn: 'Staying focused, restraining impulses — enormous effort that goes unrecorded. The "Daily Win Bonus" is your way to say: "I see you today."',
    insightHe: 'הבונוס משמש כ"גשר רגשי" ומחזק את תחושת הילד שהוא יכול להשפיע.',
    insightEn: 'The bonus serves as an "emotional bridge" and strengthens the child\'s sense of agency.',
    color: '#f59e0b',
  },
  {
    icon: '📅',
    titleHe: 'סוגי ימים — ניהול אנרגיה',
    titleEn: 'Day Types — Energy Management',
    contentHe: 'ילדים עם ADHD "רצים מרתון כשאחרים רצים ספרינט". המערכת מתאימה אוטומטית את המשימות ליום לימודים או יום חופש.',
    contentEn: 'Kids with ADHD "run a marathon while others sprint." The system auto-adjusts tasks for school days vs. rest days.',
    insightHe: 'התאמת ציפיות מפחיתה עומס קוגניטיבי ומונעת שחיקה.',
    insightEn: 'Adjusting expectations reduces cognitive load and prevents burnout.',
    color: '#14b8a6',
  },
  {
    icon: '🔥',
    titleHe: 'יעד ה-70% — רצף ניצחונות',
    titleEn: 'The 70% Goal — Winning Streak',
    contentHe: 'אנחנו לא מחפשים פרפקציוניזם. הגעה ל-70% היא ההצלחה האמיתית שבונה ביטחון עצמי ורצף ניצחונות.',
    contentEn: 'We don\'t chase perfection. Reaching 70% is the real success that builds confidence and a winning streak.',
    insightHe: 'יעדים ריאליסטיים הם המפתח למניעת נשירה.',
    insightEn: 'Realistic goals are the key to preventing dropout.',
    color: '#3b82f6',
  },
];

const principles = [
  {
    titleHe: 'חוק 15 הדקות',
    titleEn: 'The 15-Minute Rule',
    descHe: 'עידוד להתחיל במשימה קטנה מאוד למשך 15 דקות בלבד — כדי לייצר דופמין ולהתגבר על קושי בהתנעה.',
    descEn: 'Encourage starting with a tiny task for just 15 minutes — to generate dopamine and overcome startup difficulty.',
    icon: '⏱️',
  },
  {
    titleHe: 'שותפות, לא שיטור',
    titleEn: 'Partnership, Not Policing',
    descHe: 'האפליקציה משמשת כ"מנהלת" השגרה — ההורה עובר מתפקיד אוכף לתפקיד מלווה ששואל: "מה BUFF מראה להיום?"',
    descEn: 'The app manages the routine — the parent shifts from enforcer to coach who asks: "What does BUFF show for today?"',
    icon: '🤝',
  },
  {
    titleHe: 'מנוחה היא חלק מהאימון',
    titleEn: 'Rest Is Part of the Training',
    descHe: 'כרטיסי מנוחה מלמדים שמנוחה יזומה היא חלק מהצלחה ארוכת טווח, לא ויתור.',
    descEn: 'Rest Tickets teach that proactive rest is part of long-term success, not surrender.',
    icon: '😴',
  },
  {
    titleHe: 'הפרדה בין מתכנן למבצע',
    titleEn: 'Planner vs. Executor',
    descHe: 'ההורה מתכנן, הילד מבצע. זה מפחית עומס קוגניטיבי ו"שיתוק החלטות" אצל הילד.',
    descEn: 'Parent plans, child executes. This reduces cognitive load and decision paralysis for the child.',
    icon: '🧩',
  },
];

export default function PhilosophyPrint() {
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    document.title = 'BUFF Philosophy — Professional Guide';
  }, []);

  return (
    <>
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-page { page-break-after: always; }
          .avoid-break { page-break-inside: avoid; }
          @page { margin: 1.5cm; size: A4; }
        }
        @media screen {
          /* Bilingual display: show only active language on screen.
             Print mode preserves both languages (the original PDF design). */
          html[lang="en"] [dir="rtl"] { display: none !important; }
          html[lang="he"] :has(+ [dir="rtl"]) { display: none !important; }
        }
      `}</style>

      {/* Top control bar — language toggle, print, back */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setLanguage(language === 'en' ? 'he' : 'en')}
          className="px-4 py-3 bg-muted text-muted-foreground font-medium rounded-xl shadow hover:bg-muted/80 transition-all"
          aria-label={language === 'en' ? 'עבור לעברית' : 'Switch to English'}
        >
          🌐 {language === 'en' ? 'עברית' : 'English'}
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:opacity-90 transition-all"
        >
          📄 Save as PDF / Print
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-3 bg-muted text-muted-foreground font-medium rounded-xl shadow hover:bg-muted/80 transition-all"
        >
          ← Back
        </button>
      </div>

      {/* ===== HERO (web only — hidden on print): Our Three Principles ===== */}
      <div className="no-print bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-b border-indigo-100">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-16">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 leading-tight">
              Our Three Principles
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-600 mb-6" dir="rtl">
              שלושת העקרונות שלנו
            </h2>
            <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
              Most ADHD apps hide their philosophy. Here's ours, in plain English.
            </p>
            <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed mt-2" dir="rtl">
              רוב אפליקציות ה-ADHD מסתירות את הפילוסופיה שלהן. זוהי שלנו, בשפה ברורה.
            </p>
          </div>

          <div className="space-y-6">
            {/* Pillar 1 — Intrinsic Motivation */}
            <div className="rounded-2xl bg-white border border-indigo-100 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold shrink-0">1</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Inner motivation that lasts</h3>
                  <h3 className="text-lg font-semibold text-gray-500 mb-3" dir="rtl">מוטיבציה פנימית שמחזיקה לאורך זמן</h3>
                  <p className="text-base text-gray-700 leading-relaxed mb-2">
                    The kind of motivation that doesn't fade when the novelty does. Built around what your child genuinely wants in their actual life — not around what an app dangles in front of them.
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed" dir="rtl">
                    המוטיבציה שלא נעלמת כשההתרגשות נגמרת. בנויה סביב מה שהילד באמת רוצה בחיים שלו — לא סביב מה שהאפליקציה מנופפת מולו.
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 2 — Positive Coaching */}
            <div className="rounded-2xl bg-white border border-emerald-100 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold shrink-0">2</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">A home where mistakes teach, not cost</h3>
                  <h3 className="text-lg font-semibold text-gray-500 mb-3" dir="rtl">בית שבו שגיאות מלמדות, לא גובות מחיר</h3>
                  <p className="text-base text-gray-700 leading-relaxed mb-2">
                    Shame is the silent destroyer of motivation in ADHD. We built BUFF without penalty mechanics, without broken-streak shaming, without sad characters demanding more. Coaching, never policing.
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed" dir="rtl">
                    בושה היא ההורסת השקטה של מוטיבציה ב-ADHD. בנינו את BUFF בלי עונשים, בלי רצפים שבורים, בלי דמויות עצובות שדורשות עוד. אימון, לעולם לא שיטור.
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 3 — Independence-Building (the differentiator — gets stronger visual treatment) */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold shrink-0">3</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Built to be outgrown — until they don't need us</h3>
                  <h3 className="text-lg font-semibold text-gray-600 mb-3" dir="rtl">בנויה כדי שיוכלו לעזוב אותה — עד שכבר לא יזדקקו לנו</h3>
                  <p className="text-base text-gray-700 leading-relaxed mb-2">
                    Most apps want you forever. We don't. The success metric for BUFF is a kid who eventually doesn't need it — who has internalized the routines, the self-coaching, the autonomy. We measure success in independence, not engagement.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed" dir="rtl">
                    רוב האפליקציות רוצות אותך לתמיד. אנחנו לא. ההצלחה של BUFF היא ילד שבסוף כבר לא צריך אותה — שהפנים את השגרה, את האימון העצמי, את העצמאות. אנחנו מודדים הצלחה בעצמאות, לא במעורבות.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 leading-relaxed">
              Below: how these three principles show up in BUFF — six mechanics, four practices, and the language that ties it all together.
            </p>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed" dir="rtl">
              למטה: איך שלושת העקרונות האלה מתבטאים ב-BUFF — שישה מנגנונים, ארבעה עקרונות, והשפה שמחברת ביניהם.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto bg-white text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>

        {/* ===== PAGE 1: Cover ===== */}
        <div className="print-page flex flex-col items-center justify-center min-h-[100vh] px-8 py-12 text-center">
          <img src={buffLogo} alt="BUFF" className="w-28 h-28 mb-8" />
          
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 leading-tight">
            The BUFF Philosophy
          </h1>
          <h2 className="text-3xl font-bold text-gray-600 mb-8" dir="rtl">
            תפיסת העולם של BUFF
          </h2>

          <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-500 rounded-full mb-8" />

          <p className="text-lg text-gray-500 max-w-md mb-2">
            A Professional Guide for Parents, Educators & Therapists
          </p>
          <p className="text-lg text-gray-500 max-w-md" dir="rtl">
            מדריך מקצועי להורים, מחנכים ומטפלים
          </p>

          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 max-w-lg">
            <p className="text-sm text-gray-600 leading-relaxed">
              Based on <strong>Executive Function</strong> strengthening principles — research-backed cognitive strategies tailored for the ADHD brain.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-2" dir="rtl">
              מבוסס על עקרונות לחיזוק <strong>תפקודים ניהוליים</strong> — אסטרטגיות קוגניטיביות מבוססות מחקר, מותאמות למוח ה-ADHD.
            </p>
          </div>

          <p className="mt-auto text-xs text-gray-400">
            buffadhd.com · Founded by Adi Elgart German
          </p>
        </div>

        {/* ===== PAGE 2: Philosophy Cards ===== */}
        <div className="print-page px-8 py-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl">🧠</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">The 6 Pillars</h2>
              <p className="text-sm text-gray-500" dir="rtl">ששת עמודי התווך</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {sections.map((s, i) => (
              <div key={i} className="avoid-break rounded-xl border p-5" style={{ borderColor: s.color + '30', backgroundColor: s.color + '08' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 text-white font-bold" style={{ backgroundColor: s.color }}>
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-gray-900">{s.titleEn}</h3>
                      <h3 className="text-base font-bold text-gray-600 shrink-0" dir="rtl">{s.titleHe}</h3>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-1">{s.contentEn}</p>
                    <p className="text-sm text-gray-500 leading-relaxed" dir="rtl">{s.contentHe}</p>
                    <div className="mt-3 p-2.5 rounded-lg bg-white/60 border" style={{ borderColor: s.color + '25' }}>
                      <p className="text-xs font-semibold" style={{ color: s.color }}>
                        💡 {s.insightEn}
                      </p>
                      <p className="text-xs mt-1" style={{ color: s.color + 'cc' }} dir="rtl">
                        💡 {s.insightHe}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== PAGE 3: Pedagogical Principles ===== */}
        <div className="print-page px-8 py-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">📚</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Core Principles</h2>
              <p className="text-sm text-gray-500" dir="rtl">עקרונות פדגוגיים מרכזיים</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 mb-10">
            {principles.map((p, i) => (
              <div key={i} className="avoid-break rounded-xl border border-gray-200 p-5 bg-gray-50/50">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{p.titleEn}</h3>
                <h3 className="text-sm font-semibold text-gray-500 mb-3" dir="rtl">{p.titleHe}</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">{p.descEn}</p>
                <p className="text-xs text-gray-500 leading-relaxed" dir="rtl">{p.descHe}</p>
              </div>
            ))}
          </div>

          {/* Key terminology */}
          <div className="avoid-break">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">📖</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Terminology</h2>
                <p className="text-sm text-gray-500" dir="rtl">מילון מונחים</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 font-semibold text-gray-700">English</th>
                    <th className="text-right p-3 font-semibold text-gray-700" dir="rtl">עברית</th>
                    <th className="text-left p-3 font-semibold text-gray-500">Concept</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Buffs', 'באפים', 'Points earned per mission'],
                    ['Missions', 'משימות', 'Daily tasks & quests'],
                    ['Stages', 'שלבים', 'Morning → School → Afternoon → Evening'],
                    ['The Shop', 'החנות', 'Reward redemption store'],
                    ['My Gear', 'הציוד שלי', 'Bag preparation system'],
                    ['Insights', 'תובנות', 'Data-driven parent analytics'],
                    ['Rest Tickets', 'כרטיסי מנוחה', 'Strategic rest days'],
                    ['Daily Win', 'ניצחון יומי', 'Parent-awarded bonus'],
                    ['Winning Streak', 'רצף ניצחונות', '70% weekly goal chain'],
                    ['Safe Harbor', 'נמל מבטחים', 'Positive-only environment'],
                    ['Dopamine Bridge', 'גשר דופמין', 'Tiered reward system'],
                    ['Executive Functions', 'תפקודים ניהוליים', 'Core cognitive skills'],
                  ].map(([en, he, desc], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 font-medium text-gray-900">{en}</td>
                      <td className="p-3 font-medium text-gray-700 text-right" dir="rtl">{he}</td>
                      <td className="p-3 text-gray-500 text-xs">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===== PAGE 4: Cognitive Strategies ===== */}
        <div className="print-page px-8 py-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">🧬</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cognitive Strategy Library</h2>
              <p className="text-sm text-gray-500" dir="rtl">ספריית אסטרטגיות קוגניטיביות (באפים)</p>
            </div>
          </div>

          {/* Environment */}
          <div className="avoid-break mb-6">
            <h3 className="text-lg font-bold text-green-700 mb-1 flex items-center gap-2">
              🌿 Environment Buffs <span className="text-sm font-normal text-gray-500" dir="rtl">באפים סביבתיים</span>
            </h3>
            <p className="text-xs text-gray-500 mb-3">Optimize your space for focus and reduce sensory distractions.</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                ['🔇', 'Quiet Space', 'מרחב שקט'],
                ['👁️', 'Visual Cues', 'רמזים חזותיים'],
                ['📦', 'Organized Space', 'מרחב מסודר'],
                ['⏱️', 'Visible Timer', 'טיימר גלוי'],
                ['🎧', 'Reduce Noise', 'הפחתת רעש'],
              ].map(([icon, en, he], i) => (
                <div key={i} className="text-center p-3 rounded-lg bg-green-50 border border-green-100">
                  <div className="text-2xl mb-1">{icon}</div>
                  <p className="text-xs font-semibold text-gray-800">{en}</p>
                  <p className="text-[10px] text-gray-500" dir="rtl">{he}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Focus */}
          <div className="avoid-break mb-6">
            <h3 className="text-lg font-bold text-blue-700 mb-1 flex items-center gap-2">
              🎯 Focus Buffs <span className="text-sm font-normal text-gray-500" dir="rtl">באפים למיקוד</span>
            </h3>
            <p className="text-xs text-gray-500 mb-3">Break overwhelming tasks into small achievements.</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                ['📋', 'Break It Down', 'פירוק למשימות'],
                ['1️⃣', 'First Step', 'צעד ראשון'],
                ['✅', 'Checklist', 'רשימת בדיקה'],
                ['🖼️', 'Visual Steps', 'צעדים חזותיים'],
                ['👥', 'Body Double', 'נוכחות תומכת'],
              ].map(([icon, en, he], i) => (
                <div key={i} className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="text-2xl mb-1">{icon}</div>
                  <p className="text-xs font-semibold text-gray-800">{en}</p>
                  <p className="text-[10px] text-gray-500" dir="rtl">{he}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div className="avoid-break mb-10">
            <h3 className="text-lg font-bold text-purple-700 mb-1 flex items-center gap-2">
              ⚡ Energy Buffs <span className="text-sm font-normal text-gray-500" dir="rtl">באפים לאנרגיה</span>
            </h3>
            <p className="text-xs text-gray-500 mb-3">Self-regulation techniques for managing energy and emotions.</p>
            <div className="grid grid-cols-6 gap-2">
              {[
                ['🌬️', 'Deep Breaths', 'נשימות'],
                ['🧘', 'Body Check', 'סריקת גוף'],
                ['💪', 'Self-Talk', 'דיבור חיובי'],
                ['🏃', 'Move', 'תנועה'],
                ['🎁', 'Reward Plan', 'פרס מתוכנן'],
                ['🔮', 'Fidget Tool', 'כלי פידג\'ט'],
              ].map(([icon, en, he], i) => (
                <div key={i} className="text-center p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <div className="text-2xl mb-1">{icon}</div>
                  <p className="text-xs font-semibold text-gray-800">{en}</p>
                  <p className="text-[10px] text-gray-500" dir="rtl">{he}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer / CTA */}
          <div className="avoid-break rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 p-6 text-center">
            <img src={buffLogo} alt="BUFF" className="w-12 h-12 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700 mb-1">
              "Be the Coach, Not the Boss"
            </p>
            <p className="text-sm font-semibold text-gray-500 mb-4" dir="rtl">
              "היו המאמן, לא הבוס"
            </p>
            <p className="text-xs text-gray-500">
              buffadhd.com · Founded by Adi Elgart German · 💜 Built with love, for parents and children
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Important: BUFF is an enrichment tool, not a substitute for professional medical or therapeutic advice.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
