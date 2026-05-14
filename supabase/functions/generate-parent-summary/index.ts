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

function createUserClient(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate caller
    const userClient = createUserClient(req);
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Determine caller's family (do NOT trust client-supplied family_id)
    const { data: callerFamilyId, error: famErr } = await userClient.rpc("get_my_family_id");
    if (famErr || !callerFamilyId) {
      return new Response(JSON.stringify({ error: "No family found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { child_name, child_id } = await req.json();
    // family_id from body is ignored for security; we use the caller's family
    const family_id = callerFamilyId;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 3. Validate child_id belongs to caller's family
    if (child_id) {
      const { data: childRow } = await adminClient
        .from("profiles")
        .select("family_id")
        .eq("id", child_id)
        .eq("role", "child")
        .single();
      if (!childRow || childRow.family_id !== family_id) {
        return new Response(JSON.stringify({ error: "Child not found in your family" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 4. Get tasks for this family
    let tasksQuery = adminClient
      .from("tasks")
      .select("id, title, category")
      .eq("family_id", family_id);

    if (child_id) {
      tasksQuery = tasksQuery.eq("assigned_to", child_id);
    }

    const { data: tasks, error: tasksError } = await tasksQuery;
    if (tasksError) throw tasksError;

    // 5. Get completions from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split("T")[0];

    let completionsQuery = adminClient
      .from("daily_progress")
      .select("task_id, date, completed, child_id")
      .eq("family_id", family_id)
      .gte("date", dateStr)
      .order("date", { ascending: true });

    if (child_id) {
      completionsQuery = completionsQuery.eq("child_id", child_id);
    }

    const { data: completions, error: completionsError } = await completionsQuery;
    if (completionsError) throw completionsError;

    // Analyze task performance
    const taskAnalysis: Record<string, CompletionData> = {};
    for (const task of tasks || []) {
      const taskCompletions = (completions || []).filter(c => c.task_id === task.id);
      const completedCount = taskCompletions.filter(c => c.completed).length;
      const missedCount = taskCompletions.filter(c => !c.completed).length;

      let streak = 0;
      let currentStreak = 0;
      const sortedCompletions = taskCompletions
        .filter(c => c.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (sortedCompletions.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const latest = new Date(sortedCompletions[0].date).toISOString().split("T")[0];
        if (latest === today) {
          currentStreak = 1;
          for (let i = 1; i < sortedCompletions.length; i++) {
            const prev = new Date(sortedCompletions[i - 1].date);
            const curr = new Date(sortedCompletions[i].date);
            const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 1) currentStreak++;
            else break;
          }
          streak = currentStreak;
        }
      }

      taskAnalysis[task.id] = {
        task_title: task.title,
        completions: completedCount,
        streak,
        missed: missedCount,
      };
    }

    const totalCompleted = (completions || []).filter(c => c.completed).length;
    const totalMissed = (completions || []).filter(c => !c.completed).length;
    const completionRate = (completions || []).length > 0
      ? Math.round((totalCompleted / (completions || []).length) * 100)
      : 0;

    const categories = [...new Set((tasks || []).map(t => t.category))];
    const categoryBreakdown = categories.map(cat => {
      const catTasks = (tasks || []).filter(t => t.category === cat);
      const catCompletions = (completions || []).filter(c =>
        catTasks.some(t => t.id === c.task_id)
      );
      const completed = catCompletions.filter(c => c.completed).length;
      const total = catCompletions.length;
      return {
        category: cat,
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    const childNameDisplay = child_name || "your child";
    const summary = `## Weekly Parent Summary for ${childNameDisplay}

**Overall Completion Rate:** ${completionRate}% (${totalCompleted} completed, ${totalMissed} missed)

### Category Breakdown
${categoryBreakdown.map(c => `- **${c.category}:** ${c.rate}% (${c.completed}/${c.total})`).join("\n")}

### Task Performance
${Object.values(taskAnalysis).map((t: CompletionData) =>
  `- **${t.task_title}:** ${t.completions} completions, ${t.missed} missed (streak: ${t.streak} days)`
).join("\n")}

### Coaching Tips
${completionRate >= 80
  ? `Great week! ${childNameDisplay} is showing strong consistency. Consider introducing a new challenge or reward tier to keep momentum.`
  : completionRate >= 50
  ? `Steady progress! Focus on building routines around the missed tasks. Short, consistent sessions work better than long ones.`
  : `A challenging week. Check in with ${childNameDisplay} about what feels hard. Breaking tasks into smaller steps often helps.`
}`;

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Summary error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
