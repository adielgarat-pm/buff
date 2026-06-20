import { ArrowLeft, Check, Crown, Sparkles, Sprout } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const plans = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'always free',
    icon: Sprout,
    highlight: false,
    features: ['1 child profile', 'Daily routines & tasks', 'BUDDY companion'],
  },
  {
    name: 'Premium',
    price: '$9',
    cadence: '/ month · or $59 / year (save ~45%)',
    icon: Sparkles,
    highlight: true,
    features: ['Everything in Free', 'Unlimited children', 'Insights over time', 'Rewards shop, skins & themes'],
  },
  {
    name: 'Founding 100',
    price: 'from $99',
    cadence: 'one-time · lifetime · first 100 families',
    icon: Crown,
    highlight: false,
    features: ['Pay once, premium forever', 'All Premium features', 'Founding Member badge'],
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Pricing</h1>
        <p className="text-sm text-muted-foreground mb-6">Free for one child, forever. Upgrade only if you want more.</p>
        <Separator className="mb-8" />

        <div className="space-y-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`rounded-lg p-5 bg-card border ${plan.highlight ? 'border-primary border-2' : 'border-border'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
                  </div>
                  {plan.highlight && (
                    <span className="text-xs font-medium text-primary bg-primary/10 rounded-md px-2 py-1">Most popular</span>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">{plan.price}</p>
                <p className="text-sm text-muted-foreground mb-4">{plan.cadence}</p>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-sm text-muted-foreground space-y-2">
          <p>
            No ads. We never sell your data. Cancel anytime — see our{' '}
            <Link to="/refund" className="text-primary hover:underline">Refund Policy</Link>.
          </p>
          <p>Prices are in USD. Subscriptions auto-renew until cancelled. Purchases made through the Google Play Store or Apple App Store follow those stores' billing.</p>
        </div>
      </div>
    </div>
  );
}
