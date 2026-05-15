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

// ── MASTER KILL SWITCH ──────────────────────────────────────────────
// Set to true to enable cron (automated) sending.
// Test sends from Admin are always allowed regardless of this flag.
const CRON_ENABLED = false;

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

function getUnsubscribeUrl(profileId: string): string {
  const token = btoa(profileId);
  return `${APP_URL}/unsubscribe?token=${token}`;
}

function getTemplate(key: TemplateKey, lang: "en" | "he", name: string, unsubUrl: string) {
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
            <a href="${unsubUrl}" style="color:#888">להסרה מרשימת התפוצה</a>
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
          <a href="${unsubUrl}" style="color:#888">Unsubscribe</a>
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
          <a href="${unsubUrl}" style="color:#888">להסרה מרשימת התפוצה</a>
        </p>
      </div>`,
    };
  }
  return {
    subject: 'Your first "Win" is just a task away! 🏆',
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#333">
      <p>Hi ${name},</p>
      <p>You're all set up! The best way to start is by picking one simple daily task (like "brushing teeth" or "packing bag").</p>
      <p>Our philosophy is all about small, positive wins. Let's start today!</p>
      <p style="text-align:center;margin:28px 0">
        <a href="${APP_URL}/dashboard" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Pick First Task</a>
      </p>
      <p style="font-size:13px;color:#888">
        <a href="${unsubUrl}" style="color:#888">Unsubscribe</a>
      </p>
    </div>`,
  };
}

/* ── RFC 2047 Base64 encoding for headers ────────────────────────── */

function encodeUtf8Base64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  // Convert Uint8Array to binary string for btoa
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

function mimeEncode(str: string): string {
  // If pure ASCII, no encoding needed
  if (/^[\x20-\x7E]*$/.test(str)) return str;
  return `=?UTF-8?B?${encodeUtf8Base64(str)}?=`;
}

/* ── Raw SMTP over TLS ──────────────────────────────────────────── */

async function smtpCommand(
  conn: Deno.TlsConn,
  command: string
): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  await conn.write(encoder.encode(command + "\r\n"));

  const buf = new Uint8Array(4096);
  const n = await conn.read(buf);
  if (n === null) throw new Error("SMTP connection closed unexpectedly");
  return decoder.decode(buf.subarray(0, n));
}

async function sendEmailRawSmtp(
  toEmail: string,
  subject: string,
  htmlBody: string,
  smtpPassword: string
) {
  // Connect with TLS directly (port 465 = implicit TLS)
  const conn = await Deno.connectTls({
    hostname: SMTP_HOST,
    port: SMTP_PORT,
  });

  const decoder = new TextDecoder();
  const buf = new Uint8Array(4096);

  // Read server greeting
  const n = await conn.read(buf);
  if (n === null) throw new Error("No SMTP greeting");
  const greeting = decoder.decode(buf.subarray(0, n));
  if (!greeting.startsWith("220")) throw new Error(`Bad greeting: ${greeting}`);

  // EHLO
  let resp = await smtpCommand(conn, "EHLO buff.lovable.app");
  if (!resp.includes("250")) throw new Error(`EHLO failed: ${resp}`);

  // AUTH LOGIN
  resp = await smtpCommand(conn, "AUTH LOGIN");
  if (!resp.startsWith("334")) throw new Error(`AUTH failed: ${resp}`);

  // Username (base64)
  resp = await smtpCommand(conn, btoa(SMTP_FROM));
  if (!resp.startsWith("334")) throw new Error(`AUTH user failed: ${resp}`);

  // Password (base64)
  resp = await smtpCommand(conn, btoa(smtpPassword));
  if (!resp.startsWith("235")) throw new Error(`AUTH pass failed: ${resp}`);

  // MAIL FROM
  resp = await smtpCommand(conn, `MAIL FROM:<${SMTP_FROM}>`);
  if (!resp.startsWith("250")) throw new Error(`MAIL FROM failed: ${resp}`);

  // RCPT TO
  resp = await smtpCommand(conn, `RCPT TO:<${toEmail}>`);
  if (!resp.startsWith("250")) throw new Error(`RCPT TO failed: ${resp}`);

  // DATA
  resp = await smtpCommand(conn, "DATA");
  if (!resp.startsWith("354")) throw new Error(`DATA failed: ${resp}`);

  // Build the full MIME message with proper UTF-8 encoding
  const encodedSubject = mimeEncode(subject);
  const encodedFromName = mimeEncode(SMTP_FROM_NAME);
  const htmlBase64 = encodeUtf8Base64(htmlBody);

  // Split base64 into 76-char lines per RFC 2045
  const htmlBase64Lines = htmlBase64.match(/.{1,76}/g)?.join("\r\n") || htmlBase64;

  const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@buff.lovable.app>`;

  const message = [
    `Message-ID: ${messageId}`,
    `Date: ${new Date().toUTCString()}`,
    `From: ${encodedFromName} <${SMTP_FROM}>`,
    `To: <${toEmail}>`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    htmlBase64Lines,
    ``,
    `.`,
  ].join("\r\n");

  const encoder = new TextEncoder();
  await conn.write(encoder.encode(message + "\r\n"));

  // Read response after DATA
  const buf2 = new Uint8Array(4096);
  const n2 = await conn.read(buf2);
  if (n2 === null) throw new Error("No response after DATA");
  const dataResp = decoder.decode(buf2.subarray(0, n2));
  if (!dataResp.startsWith("250")) throw new Error(`DATA send failed: ${dataResp}`);

  // QUIT
  try {
    await smtpCommand(conn, "QUIT");
  } catch {
    // ignore quit errors
  }

  try { conn.close(); } catch { /* ignore */ }
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

  // ── Parse body (test mode or cron) ──
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // empty body = normal cron run
  }

  // ── Global auth gate: require admin for ALL invocations ──
  {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ── Recovery batch mode ──
  if (body.mode === "recovery_batch") {
    const results = { sent: 0, errors: [] as string[] };

    try {
      // Get all users who received gibberish emails in the last 6 hours
      const { data: affectedLogs, error: logErr } = await supabase
        .from("email_logs")
        .select("profile_id, email_to, user_id")
        .eq("status", "sent")
        .gte("sent_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
        .not("profile_id", "is", null);

      if (logErr) throw new Error(`Query error: ${logErr.message}`);

      // Deduplicate by email
      const seenEmails = new Set<string>();
      const uniqueRecipients: typeof affectedLogs = [];
      for (const log of affectedLogs || []) {
        if (!seenEmails.has(log.email_to)) {
          seenEmails.add(log.email_to);
          uniqueRecipients.push(log);
        }
      }

      for (const log of uniqueRecipients) {
        try {
          // Skip if already sent recovery
          const { data: alreadyRecovered } = await supabase
            .from("email_logs")
            .select("id")
            .eq("profile_id", log.profile_id)
            .eq("template_key", "recovery_correction")
            .eq("status", "sent")
            .limit(1);

          if (alreadyRecovered && alreadyRecovered.length > 0) continue;

          // Get profile display_name for personalization
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", log.profile_id)
            .single();

          const name = profile?.display_name || log.email_to.split("@")[0];
          const unsubUrl = getUnsubscribeUrl(log.profile_id!);

          const subject = "אופס... אפילו האפליקציה שלי התרגשה ❤️";
          const html = `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#333">
            <p>היי ${name},</p>
            <p>אני עדי, היוצרת של BUFF.</p>
            <p>קיבלת ממני מייל קודם שנראה קצת... מוזר? 😅</p>
            <p>זה בגלל שהאפליקציה שלי התרגשה כל כך לשלוח לך הודעה שהיא שכחה לדבר בעברית.</p>
            <p>אז הנה מה שרציתי להגיד:</p>
            <p>אני אמא לשלושה, וכמוך — אני יודעת כמה זה מאתגר לנהל את הבוקר, את השיעורים, את הסדר. בניתי את BUFF כדי להפוך את כל זה למשחק שהילדים שלנו באמת רוצים לשחק בו.</p>
            <p>אם עוד לא הספקת לנסות — אני כאן בשבילך, לכל שאלה.</p>
            <p style="text-align:center;margin:28px 0">
              <a href="${APP_URL}" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">לחזור ל-BUFF</a>
            </p>
            <p>בהצלחה,<br>עדי 💜</p>
            <p style="font-size:13px;color:#888">
              <a href="${unsubUrl}" style="color:#888">להסרה מרשימת התפוצה</a>
            </p>
          </div>`;

          await sendEmailRawSmtp(log.email_to, subject, html, smtpPassword);

          await supabase.from("email_logs").insert({
            user_id: log.user_id,
            profile_id: log.profile_id,
            email_to: log.email_to,
            template_key: "recovery_correction",
            language: "he",
            status: "sent",
          });

          results.sent++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          results.errors.push(`${log.email_to}: ${msg}`);

          await supabase.from("email_logs").insert({
            user_id: log.user_id,
            profile_id: log.profile_id,
            email_to: log.email_to,
            template_key: "recovery_correction",
            language: "he",
            status: "error",
            error_message: msg,
          });
        }
      }

      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ── Test mode: always allowed regardless of CRON_ENABLED ──
  if (body.test_email && body.template_key) {
    // Verify admin before allowing test sends
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const testEmail = body.test_email as string;
    const templateKey = body.template_key as TemplateKey;
    const lang = (body.language as "en" | "he") || "en";
    const name = (body.test_name as string) || testEmail.split("@")[0];
    const unsubUrl = getUnsubscribeUrl("test-profile-id");

    try {
      const template = getTemplate(templateKey, lang, name, unsubUrl);
      await sendEmailRawSmtp(
        testEmail,
        `[TEST] ${template.subject}`,
        template.html,
        smtpPassword
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: `Test email sent to ${testEmail}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ success: false, error: msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ── Cron guard ──
  if (!CRON_ENABLED) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Automated sending is disabled. Only test sends are allowed.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
        const unsubUrl = getUnsubscribeUrl(profile.id);
        const template = getTemplate("onboarding_nudge", lang, name, unsubUrl);

        await sendEmailRawSmtp(email, template.subject, template.html, smtpPassword);

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
        const unsubUrl = getUnsubscribeUrl(profile.id);
        const template = getTemplate("first_task_boost", lang, name, unsubUrl);

        await sendEmailRawSmtp(email, template.subject, template.html, smtpPassword);

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
