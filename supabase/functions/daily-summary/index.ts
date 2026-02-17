import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Use service role for data access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify parent is Pro
    const { data: parentProfile } = await supabase
      .from("profiles")
      .select("id, family_id, role, is_pro, is_lifetime_access")
      .eq("user_id", userId)
      .single();

    if (!parentProfile || parentProfile.role !== "parent") {
      return new Response(JSON.stringify({ error: "Only parents can access summaries" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Silent Launch: Pro gate bypassed — all users can access this feature
    // (is_pro / is_lifetime_access check removed until launch)

    const { child_id, language } = await req.json();
    if (!child_id) {
      return new Response(JSON.stringify({ error: "child_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const familyId = parentProfile.family_id;

    // Get child profile
    const { data: childProfile } = await supabase
      .from("profiles")
      .select("display_name, pet_state, daily_goal")
      .eq("id", child_id)
      .eq("family_id", familyId)
      .single();

    if (!childProfile) {
      return new Response(JSON.stringify({ error: "Child not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const todayKey = new Date().toISOString().split("T")[0];

    // Fetch today's tasks and progress
    const [{ data: tasks }, { data: progress }] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, category, credits, time")
        .eq("family_id", familyId)
        .eq("assigned_to", child_id),
      supabase
        .from("daily_progress")
        .select("task_id, completed, completed_at")
        .eq("family_id", familyId)
        .eq("child_id", child_id)
        .eq("date", todayKey),
    ]);

    const completedIds = new Set(
      (progress || []).filter((p) => p.completed).map((p) => p.task_id)
    );

    const tasksCompleted = (tasks || []).filter((t) => completedIds.has(t.id)).length;
    const tasksTotal = (tasks || []).length;
    const creditsEarned = (tasks || [])
      .filter((t) => completedIds.has(t.id))
      .reduce((sum, t) => sum + t.credits, 0);

    const petState = (childProfile.pet_state as Record<string, unknown>) || {};
    const dailyStreak = (petState.daily_streak as number) || 0;
    const evolutionStage = (petState.evolution_stage as string) || "egg";

    const successScore = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

    // Identify patterns for coaching tip
    const missedTasks = (tasks || []).filter((t) => !completedIds.has(t.id));
    const completedTasks = (tasks || []).filter((t) => completedIds.has(t.id));

    // Group missed tasks by time period
    const eveningMissed = missedTasks.filter((t) => {
      const hour = parseInt(t.time.split(":")[0]);
      return hour >= 18;
    });
    const morningMissed = missedTasks.filter((t) => {
      const hour = parseInt(t.time.split(":")[0]);
      return hour < 12;
    });

    // Build AI coaching tip
    const isHe = language === "he";
    const childName = childProfile.display_name;

    let contextHint = "";
    if (successScore === 100) {
      contextHint = isHe
        ? `${childName} סיים/ה את כל המשימות היום! שבחו אותו/ה על המאמץ.`
        : `${childName} completed all tasks today! Celebrate the effort.`;
    } else if (eveningMissed.length > 0) {
      const missedNames = eveningMissed.map((t) => t.title).join(", ");
      contextHint = isHe
        ? `המשימות שהוחמצו היום היו בערב (${missedNames}). אולי שווה לבדוק אם השגרה של הערב צריכה התאמה.`
        : `Missed tasks were in the evening (${missedNames}). Consider adjusting the evening routine.`;
    } else if (morningMissed.length > 0) {
      const missedNames = morningMissed.map((t) => t.title).join(", ");
      contextHint = isHe
        ? `המשימות שהוחמצו היום היו בבוקר (${missedNames}). אולי להכין יותר דברים מהערב?`
        : `Missed tasks were in the morning (${missedNames}). Maybe prepare more the night before?`;
    } else if (missedTasks.length > 0) {
      contextHint = isHe
        ? `הוחמצו כמה משימות היום. זה בסדר גמור - מחר יום חדש!`
        : `Some tasks were missed today. That's totally okay - tomorrow is a fresh start!`;
    }

    const tipPrompt = isHe
      ? `את מאמנת הורים חמה ותומכת. כתבי טיפ אימון קצר (2-3 משפטים) בעברית, בטון חם ולא שיפוטי, בהתבסס על הנתונים:
שם הילד/ה: ${childName}
משימות שהושלמו: ${tasksCompleted}/${tasksTotal}
ציון הצלחה: ${successScore}%
רצף ימים: ${dailyStreak}
הקשר: ${contextHint}

כתבי טיפ מעשי אחד שההורה יכול ליישם מחר. אל תשתמשי במונחים מקצועיים. כמו הודעה לחברה.`
      : `You are a warm, supportive parenting coach. Write a short coaching tip (2-3 sentences) in English, warm and non-judgmental tone, based on:
Child: ${childName}
Tasks completed: ${tasksCompleted}/${tasksTotal}
Success score: ${successScore}%
Streak: ${dailyStreak} days
Context: ${contextHint}

Write one practical tip the parent can apply tomorrow. Keep it friendly and encouraging.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let coachingTip = contextHint; // Fallback

    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: isHe
                    ? "את מאמנת הורים חמה ותומכת. כתבי בעברית, קצר וחם."
                    : "You are a warm parenting coach. Write in English, brief and warm.",
                },
                { role: "user", content: tipPrompt },
              ],
            }),
          }
        );

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          coachingTip =
            aiData.choices?.[0]?.message?.content || coachingTip;
        }
      } catch (e) {
        console.error("AI tip generation failed, using fallback:", e);
      }
    }

    // Build suggested task for tomorrow based on patterns
    let suggestedTask = null;
    if (eveningMissed.length > 0) {
      // Suggest moving the first missed evening task earlier
      const task = eveningMissed[0];
      const [h, m] = task.time.split(":").map(Number);
      const earlierTime = `${String(Math.max(h - 1, 16)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      suggestedTask = {
        title: task.title,
        originalTime: task.time,
        suggestedTime: earlierTime,
        taskId: task.id,
      };
    } else if (morningMissed.length > 0) {
      suggestedTask = {
        title: morningMissed[0].title,
        originalTime: morningMissed[0].time,
        suggestedTime: morningMissed[0].time,
        taskId: morningMissed[0].id,
      };
    }

    return new Response(
      JSON.stringify({
        childName,
        date: todayKey,
        tasksCompleted,
        tasksTotal,
        creditsEarned,
        successScore,
        dailyStreak,
        evolutionStage,
        coachingTip,
        suggestedTask,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("daily-summary error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
