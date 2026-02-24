import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [lang, setLang] = useState<"en" | "he">("en");

  useEffect(() => {
    const token = searchParams.get("token");
    const done = searchParams.get("done");

    if (!token) {
      setStatus("error");
      return;
    }

    // If redirected from edge function GET (already processed server-side)
    if (done === "1") {
      // Detect lang from token
      try {
        const profileId = atob(token);
        supabase
          .from("profiles")
          .select("preferred_language")
          .eq("id", profileId)
          .single()
          .then(({ data }) => {
            if (data?.preferred_language === "he") setLang("he");
          });
      } catch { /* ignore */ }
      setStatus("success");
      return;
    }

    // POST flow from frontend
    const processUnsubscribe = async () => {
      try {
        let profileId: string;
        try { profileId = atob(token); } catch { setStatus("error"); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("id", profileId)
          .single();
        if (profile?.preferred_language === "he") setLang("he");

        const { error } = await supabase.functions.invoke("unsubscribe", {
          body: { token },
        });
        if (error) throw error;
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };
    processUnsubscribe();
  }, [searchParams]);

  const isHe = lang === "he";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-xl p-8 max-w-md w-full text-center shadow-lg border" dir={isHe ? "rtl" : "ltr"}>
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isHe ? "מעבד..." : "Processing..."}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">
              {isHe ? "הוסרת בהצלחה" : "Successfully Unsubscribed"}
            </h1>
            <p className="text-muted-foreground">
              {isHe
                ? "הוסרת מרשימת התפוצה שלנו. לא תקבל/י מאיתנו אימיילים נוספים."
                : "You've been removed from our mailing list. You won't receive any more emails from us."}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">
              {isHe ? "שגיאה" : "Error"}
            </h1>
            <p className="text-muted-foreground">
              {isHe
                ? "לא הצלחנו לעבד את הבקשה. נסה/י שוב מאוחר יותר."
                : "We couldn't process your request. Please try again later."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
