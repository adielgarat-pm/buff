import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(renderPage("Missing token", "he"), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  let profileId: string;
  try {
    profileId = atob(token);
  } catch {
    return new Response(renderPage("Invalid token", "en"), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { error } = await supabase
    .from("profiles")
    .update({ marketing_consent: false })
    .eq("id", profileId);

  if (error) {
    return new Response(renderPage("Error processing request", "en"), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Detect language from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", profileId)
    .single();

  const lang = profile?.preferred_language === "he" ? "he" : "en";

  return new Response(renderPage("success", lang), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
});

function renderPage(status: string, lang: string): string {
  const isHe = lang === "he";
  const title = status === "success"
    ? isHe ? "הוסרת בהצלחה" : "Successfully Unsubscribed"
    : isHe ? "שגיאה" : "Error";
  const body = status === "success"
    ? isHe
      ? "הוסרת מרשימת התפוצה שלנו. לא תקבל/י מאיתנו אימיילים נוספים."
      : "You've been removed from our mailing list. You won't receive any more emails from us."
    : status;

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${isHe ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;color:#333}
.card{background:#fff;border-radius:12px;padding:40px;max-width:420px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.08)}
h1{font-size:24px;margin-bottom:12px}p{font-size:16px;line-height:1.6;color:#666}</style>
</head>
<body><div class="card"><h1>${title}</h1><p>${body}</p></div></body></html>`;
}
