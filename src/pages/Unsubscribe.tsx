import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    const done = searchParams.get("done");

    if (!token) {
      setStatus("error");
      return;
    }

    // If redirected from edge function GET (already processed server-side)
    if (done === "1") {
      setStatus("success");
      return;
    }

    // POST to edge function to process unsubscribe
    const processUnsubscribe = async () => {
      try {
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-xl p-8 max-w-md w-full text-center shadow-lg border" dir="rtl">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">מעבד...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">הוסרת בהצלחה</h1>
            <p className="text-muted-foreground">
              הוסרת מרשימת התפוצה שלנו. לא תקבל/י מאיתנו אימיילים נוספים.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">שגיאה</h1>
            <p className="text-muted-foreground">
              לא הצלחנו לעבד את הבקשה. נסה/י שוב מאוחר יותר.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
