import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompletionData {
  task_title: string;
  completions: number;
  streak: number;
  missed: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { family_id, child_name } = await req.json();
    
    if (!family_id) {
      throw new Error("family_id is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get tasks for this family
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, category")
      .eq("family_id", family_id);

    if (tasksError) throw tasksError;

    // Get completions from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split("T")[0];

    const { data: completions, error: completionsError } = await supabase
      .from("daily_progress")
      .select("task_id, date, completed")
      .eq("family_id", family_id)
      .gte("date", dateStr)
      .order("date", { ascending: true });

    if (completionsError) throw completionsError;

    // Analyze task performance
    const taskAnalysis: Record<string, CompletionData> = {};
    
    for (const task of tasks || []) {
      const taskCompletions = (completions || []).filter(c => c.task_id === task.id);
      const completedCount = taskCompletions.filter(c => c.completed).length;
      const missedCount = taskCompletions.filter(c => !c.completed).length;
      
      // Calculate streak (consecutive completed days)
      let streak = 0;
      let currentStreak = 0;
      const sortedCompletions = taskCompletions
        .filter(c => c.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      for (let i = 0; i < sortedCompletions.length; i++) {
        if (i === 0) {
          currentStreak = 1;
        } else {
          const prevDate = new Date(sortedCompletions[i - 1].date);
          const currDate = new Date(sortedCompletions[i].date);
          const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
      streak = currentStreak;

      taskAnalysis[task.id] = {
        task_title: task.title,
        completions: completedCount,
        streak,
        missed: missedCount,
      };
    }

    // Identify wins (streak >= 3) and challenges (missed >= 2)
    const wins = Object.values(taskAnalysis).filter(t => t.streak >= 3);
    const challenges = Object.values(taskAnalysis).filter(t => t.missed >= 2);

    // Build prompt for AI
    const childRef = child_name || "הילד/ה";
    
    const prompt = `את עדי, אמא לילדים עם אתגרי קשב וריכוז, ויוצרת BUFF. את כותבת סיכום שבועי לאמא אחרת בקהילה שלך - בגובה העיניים, חמה, אותנטית, כמו חברה שנמצאת איתה בבוץ ובניצחונות.

שם הילד/ה: ${childRef}

הצלחות השבוע (משימות עם רצף של 3+ ימים):
${wins.length > 0 ? wins.map(w => `- ${w.task_title}: רצף של ${w.streak} ימים`).join("\n") : "- אין רצפים ארוכים השבוע"}

אתגרים (משימות שהוחמצו 2+ פעמים):
${challenges.length > 0 ? challenges.map(c => `- ${c.task_title}: הוחמצה ${c.missed} פעמים`).join("\n") : "- אין אתגרים משמעותיים השבוע"}

כתבי סיכום בפורמט הבא בדיוק, עם אימוג'ים ובטון אישי וחם:

היי! איזה שבוע מעודד עבר עליכם! הנה מה שקרה ב-BUFF השבוע:

✨ **הנחת של השבוע:**
[תארי את ההצלחות בשפה חמה. השתמשי בביטויים כמו "וואו, תראי איזו עקביות!", "זה לא מובן מאליו בכלל", "אני בטוחה שזה הופך את האווירה בבית להרבה יותר רגועה". ציני את שמות המשימות הספציפיות ואת הרצפים]

${challenges.length > 0 ? `⚡ **קצת אתגרים (וזה בסדר גמור):**
[תארי את האתגרים בצורה רכה ומנרמלת, עם הצעה מעשית קטנה]

` : ""}💡 **משהו קטן ממני:**
${wins.length > 0 ? `[כתבי טיפ על "צעדי קיסם" בסגנון הזה:
"מהניסיון שלי, כשהם על הגל, זה הזמן הכי טוב לחשוב יחד על היעד הבא – אבל להכניס אותו ב**'צעדי קיסם'**. אם יש מטרה חדשה, אל תוסיפי משימה גדולה, אלא רק את הצעד הראשון שלה. כשההצלחה מובטחת, הביטחון שלהם עולה."
התאימי את הדוגמה למשימות הספציפיות של הילד - למשל אם המטרה היא עצמאות בלימודים, הציעי רק 'להוציא את הספר מהתיק']` : `[תני עצה מעשית וחברית לאתגרים בגישת "צעדי קיסם" - צעדים קטנים שמבטיחים הצלחה]`}

🙏 **חשוב לי לשמוע מכם:**
אני בונה את BUFF תוך כדי תנועה, והדעה שלכם הכי חשובה לי בעולם. אשמח ממש לשמוע - איך החוויה שלכם עד כה? יש משהו שהייתם רוצים לראות באפליקציה ועדיין לא שם? כל מחשבה תעזור לי לדייק את זה עבור כולנו.

שיהיה שבוע רגוע ❤️
עדי מ-BUFF

חשוב מאוד:
- אל תשתמשי במונחים מקצועיים או בשמות שיטות
- כתבי כמו הודעת וואטסאפ לחברה
- פסקאות קצרות וקלות לסריקה
- הדגישי מילות מפתח עם **כוכביות**
- שמרי על הפורמט המדויק עם הסקשנים והאימוג'ים`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "את עדי, אמא לילדים עם אתגרי קשב וריכוז ויוצרת BUFF. את כותבת לאמהות אחרות בקהילה שלך - בגובה העיניים, חמה, אותנטית. התשובות שלך תמיד בעברית, כמו הודעת וואטסאפ לחברה טובה." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || "לא הצלחנו לייצר סיכום. נסה שוב מאוחר יותר.";

    return new Response(JSON.stringify({ summary, wins, challenges }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-parent-summary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
