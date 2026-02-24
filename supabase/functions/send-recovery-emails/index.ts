import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 465;
const SMTP_FROM = "buff.parenting@gmail.com";
const SMTP_FROM_NAME = "Adi from BUFF";
const APP_URL = "https://buff.lovable.app";
const UNSUBSCRIBE_URL =
  "https://iyejaxnugjgjeceqdcky.supabase.co/functions/v1/unsubscribe";

/* ── helpers ─────────────────────────────────────────────────────── */

function detectLanguage(
  displayName: string | null,
  email: string | null,
  preferredLang: string | null
): "en" | "he" {
  if (preferredLang === "he") return "he";
  if (displayName && /[\u0590-\u05FF]/.test(displayName)) return "he";
  if (email && email.endsWith(".il")) return "he";
  return "en";
}

type TemplateKey = "onboarding_nudge" | "first_task_boost";

function getTemplate(key: TemplateKey, lang: "en" | "he", name: string) {
  if (key === "onboarding_nudge") {
    if (lang === "he") {
      return {
        subject: "צריכה עזרה קטנה עם הצעד הראשון? ❤️",
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#333">
          <p>היי ${name},</p>
          <p>אני עדי, אמא לשלושה והיוצרת של BUFF.</p>
          <p>ראיתי שהתחלת להירשם אבל עוד לא הספקת לסיים. אני יודעת בדיוק כמה הימים שלנו יכולים להיות עמוסים.</p>
          <p>הוספת הילד/ה היא הצעד הראשון ליצירת מוטיבציה חיובית בבית, וזה לוקח פחות מדקה. אני כאן לכל שאלה!</p>
          <p style="text-align:center;margin:28px 0">
            <a href="${APP_URL}/onboarding" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">לסיום ההגדרה</a>
          </p>
          <p style="font-size:13px;color:#888">
            <a href="${UNSUBSCRIBE_URL}?token=__TOKEN__" style="color:#888">להסרה מרשימת התפוצה</a>
          </p>
        </div>`,
      };
    }
    return {
      subject: "Need a hand with the first step? ❤️",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#333">
        <p>Hi ${name},</p>
        <p>I'm Adi, a mom of three and the creator of BUFF.</p>
        <p>I noticed you started setting up your profile but didn't get a chance to finish. I know how hectic our days can be!</p>
        <p>Adding your child is the first step toward a more positive atmosphere at home. It takes less than a minute—I'm here if you have any questions.</p>
        <p style="text-align:center;margin:28px 0">
          <a href="${APP_URL}/onboarding" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Finish Setup</a>
        </p>
        <p style="font-size:13px;color:#888">
          <a href="${UNSUBSCRIBE_URL}?token=__TOKEN__" style="color:#888">Unsubscribe</a>
        </p>
      </div>`,
    };
  }

  // first_task_boost
  if (lang === "he") {
    return {
      subject: "הניצחון הראשון שלכם כבר כאן 🏆",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#333">
        <p>היי ${name},</p>
        <p>הכל מוכן! הדרך הטובה ביותר להתחיל היא לבחור משימה יומית אחת פשוטה (כמו "צחצוח שיניים" או "לארוז תיק").</p>
        <p>הפילוסופיה שלנו מבוססת על ניצחונות קטנים וחיוביים. בואי נתחיל היום!</p>
        <p style="text-align:center;margin:28px 0">
          <a href="${APP_URL}/dashboard" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">לבחירת משימה ראשונה</a>
        </p>
        <p style="font-size:13px;color:#888">
          <a href="${UNSUBSCRIBE_URL}?token=__TOKEN__" style="color:#888">להסרה מרשימת התפוצה</a>
        </p>
      </div>`,
    };
  }
  return {
    subject: "Your first \"Win\" is just a task away! 🏆",
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#333">
      <p>Hi ${name},</p>
      <p>You're all set up! The best way to start is by picking one simple daily task (like "brushing teeth" or "packing bag").</p>
      <p>Our philosophy is all about small, positive wins. Let's start today!</p>
      <p style="text-align:center;margin:28px 0">
        <a href="${APP_URL}/dashboard" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Pick First Task</a>
      </p>
      <p style="font-size:13px;color:#888">
        <a href="${UNSUBSCRIBE_URL}?token=__TOKEN__" style="color:#888">Unsubscribe</a>
      </p>
    </div>`,
  };
}

/* ── SMTP via Deno ───────────────────────────────────────────────── */

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  smtpPassword: string
) {
  const { SMTPClient } = await import(
    "https://deno.land/x/denomailer@1.6.0/mod.ts"
  );

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: true,
      auth: {
        username: SMTP_FROM,
        password: smtpPassword,
      },
    },
  });

  await client.send({
    from: `${SMTP_FROM_NAME} <${SMTP_FROM}>`,
    to,
    subject,
    html,
  });

  await client.close();
}

/* ── Send-Once Guard ─────────────────────────────────────────────── */

async function alreadySent(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  templateKey: TemplateKey
): Promise<boolean> {
  const { data } = await supabase
    .from("email_logs")
    .select("id")
    .eq("profile_id", profileId)
    .eq("template_key", templateKey)
    .eq("status", "sent")
    .limit(1);
  return !!(data && data.length > 0);
}

/* ── main handler ────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const smtpPassword = Deno.env.get("SMTP_PASSWORD");
  if (!smtpPassword) {
    return new Response(JSON.stringify({ error: "SMTP_PASSWORD not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // ── Test mode: { test_email, template_key, language } ──
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // empty body = normal cron run
  }

  if (body.test_email && body.template_key) {
    const testEmail = body.test_email as string;
    const templateKey = body.template_key as TemplateKey;
    const lang = (body.language as "en" | "he") || "en";
    const name = (body.test_name as string) || testEmail.split("@")[0];

    try {
      const template = getTemplate(templateKey, lang, name);
      const token = btoa("test-profile-id");
      const html = template.html.replace(/__TOKEN__/g, token);
      await sendEmail(testEmail, `[TEST] ${template.subject}`, html, smtpPassword);

      return new Response(
        JSON.stringify({ success: true, message: `Test email sent to ${testEmail}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(
        JSON.stringify({ success: false, error: msg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // ── Normal cron run ──
  const results = {
    onboarding_nudge_sent: 0,
    first_task_boost_sent: 0,
    skipped_already_sent: 0,
    errors: [] as string[],
  };

  try {
    // ── Segment A: Stuck users (signed up >24h, onboarding < 6) ──
    const { data: stuckUsers, error: e1 } = await supabase
      .from("profiles")
      .select(
        "id, user_id, display_name, preferred_language, marketing_consent"
      )
      .eq("role", "parent")
      .eq("marketing_consent", true)
      .lt("onboarding_step", 6)
      .not("user_id", "is", null);

    if (e1) throw new Error(`Stuck query error: ${e1.message}`);

    for (const profile of stuckUsers || []) {
      try {
        // Send-Once Guard
        if (await alreadySent(supabase, profile.id, "onboarding_nudge")) {
          results.skipped_already_sent++;
          continue;
        }

        const { data: authUser } = await supabase.auth.admin.getUserById(
          profile.user_id
        );
        if (!authUser?.user) continue;

        const signupAge =
          Date.now() - new Date(authUser.user.created_at).getTime();
        if (signupAge < 24 * 60 * 60 * 1000) continue;

        const email = authUser.user.email;
        if (!email) continue;

        const lang = detectLanguage(
          profile.display_name,
          email,
          profile.preferred_language
        );
        const name = profile.display_name || email.split("@")[0];
        const template = getTemplate("onboarding_nudge", lang, name);
        const token = btoa(profile.id);
        const html = template.html.replace(/__TOKEN__/g, token);

        await sendEmail(email, template.subject, html, smtpPassword);

        await supabase.from("email_logs").insert({
          user_id: profile.user_id,
          profile_id: profile.id,
          email_to: email,
          template_key: "onboarding_nudge",
          language: lang,
          status: "sent",
        });

        results.onboarding_nudge_sent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.errors.push(`onboarding_nudge/${profile.id}: ${msg}`);

        await supabase.from("email_logs").insert({
          user_id: profile.user_id,
          profile_id: profile.id,
          email_to: "unknown",
          template_key: "onboarding_nudge",
          language: "en",
          status: "error",
          error_message: msg,
        });
      }
    }

    // ── Segment B: Inactive users (onboarding complete, 0 completions, >48h) ──
    const { data: completedUsers, error: e2 } = await supabase
      .from("profiles")
      .select(
        "id, user_id, display_name, preferred_language, family_id, marketing_consent"
      )
      .eq("role", "parent")
      .eq("marketing_consent", true)
      .gte("onboarding_step", 6)
      .not("user_id", "is", null)
      .not("family_id", "is", null);

    if (e2) throw new Error(`Inactive query error: ${e2.message}`);

    for (const profile of completedUsers || []) {
      try {
        // Send-Once Guard
        if (await alreadySent(supabase, profile.id, "first_task_boost")) {
          results.skipped_already_sent++;
          continue;
        }

        const { data: authUser } = await supabase.auth.admin.getUserById(
          profile.user_id
        );
        if (!authUser?.user) continue;

        const signupAge =
          Date.now() - new Date(authUser.user.created_at).getTime();
        if (signupAge < 48 * 60 * 60 * 1000) continue;

        const email = authUser.user.email;
        if (!email) continue;

        // Check if family has any task completions
        const { count } = await supabase
          .from("daily_progress")
          .select("id", { count: "exact", head: true })
          .eq("family_id", profile.family_id)
          .eq("completed", true);

        if (count && count > 0) continue;

        const lang = detectLanguage(
          profile.display_name,
          email,
          profile.preferred_language
        );
        const name = profile.display_name || email.split("@")[0];
        const template = getTemplate("first_task_boost", lang, name);
        const token = btoa(profile.id);
        const html = template.html.replace(/__TOKEN__/g, token);

        await sendEmail(email, template.subject, html, smtpPassword);

        await supabase.from("email_logs").insert({
          user_id: profile.user_id,
          profile_id: profile.id,
          email_to: email,
          template_key: "first_task_boost",
          language: lang,
          status: "sent",
        });

        results.first_task_boost_sent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.errors.push(`first_task_boost/${profile.id}: ${msg}`);

        await supabase.from("email_logs").insert({
          user_id: profile.user_id,
          profile_id: profile.id,
          email_to: "unknown",
          template_key: "first_task_boost",
          language: "en",
          status: "error",
          error_message: msg,
        });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
