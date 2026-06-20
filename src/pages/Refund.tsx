import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function Refund() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Refund Policy</h1>
        <p className="text-sm text-muted-foreground mb-6">Last updated: June 20, 2026</p>
        <Separator className="mb-8" />

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <p>BUFF is built for families, and our billing should feel as fair as the rest of the app — no traps, no dark patterns.</p>

          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Try before you pay</h2>
            <p>BUFF is free to use with one child, forever. You can explore the app fully before deciding to upgrade.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Cancel anytime</h2>
            <p>You can cancel Premium at any time. You keep Premium access until the end of the period you've already paid for, and you won't be charged again.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. 14-day money-back guarantee</h2>
            <p>If you're not happy with a Premium purchase, contact us within 14 days of the charge and we'll refund it in full — no questions asked. This applies to monthly, annual, and one-time Lifetime / Founding purchases.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. How to request a refund</h2>
            <p>Email <a href="mailto:adi@buffadhd.com" className="text-primary hover:underline">adi@buffadhd.com</a> from (or mentioning) the email on your account. Refunds are returned to your original payment method, usually within 5–10 business days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Payments &amp; Merchant of Record</h2>
            <p>Online payments for BUFF are processed by our reseller and Merchant of Record, Paddle.com, who handle billing, tax, and refunds on our behalf in line with this policy. Purchases made through the Google Play Store or Apple App Store are governed by those stores' refund policies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Your data</h2>
            <p>Cancelling or refunding doesn't delete your family's data. To delete your account and data, see our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Contact</h2>
            <p>Questions? Reach out at <a href="mailto:adi@buffadhd.com" className="text-primary hover:underline">adi@buffadhd.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
