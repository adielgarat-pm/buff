import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Mountain, BarChart3, Handshake, Heart, MessageCircle, Brain } from 'lucide-react';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { Button } from '@/components/ui/button';
import buffLogo from '@/assets/buff-logo.png';
import buffLogoNoBg from '@/assets/buff-logo-no-bg.png';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect } from 'react';

// JSON-LD Structured Data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "BUFF - ADHD Routine App for Kids & Teens",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web, iOS, Android (PWA)",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "BUFF helps kids and teens with ADHD master daily routines using research-backed executive function strategies. Turn overwhelming tasks into achievable victories with coaching-inspired motivation.",
  "url": "https://buff.lovable.app",
  "author": {
    "@type": "Person",
    "name": "Adi Elgart German"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150"
  },
  "keywords": "ADHD, ADHD kids, ADHD teens, ADHD routine app, executive function app, ADHD children, ADHD task manager, ADHD daily routine, ADHD parenting tool, executive functioning skills"
};

function BuffLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center">
        <img src={buffLogo} alt="BUFF Logo" className="h-8 w-8 object-contain" />
      </div>
    </div>
  );
}

// Benefit card component
function BenefitCard({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow duration-300">
      <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-display text-lg font-bold text-foreground mb-3 tracking-wide">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}

export default function Landing() {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const goToAuth = () => {
    navigate('/auth');
  };

  // Inject JSON-LD and update meta tags for SEO
  useEffect(() => {
    const existingScript = document.querySelector('script[data-schema="buff-app"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-schema', 'buff-app');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    document.title = 'BUFF — ADHD Routine App for Kids & Teens | Executive Function Coaching';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'BUFF helps kids and teens with ADHD master daily routines using research-backed executive function strategies. Free coaching-inspired app for the whole family.');
    }

    return () => {
      const script = document.querySelector('script[data-schema="buff-app"]');
      if (script) script.remove();
    };
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <BuffLogo />

            <div className="flex items-center gap-3">
              {/* Language Toggle - prominent text button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
                className="rounded-full px-4 text-sm font-medium"
              >
                {t('landing.langToggle')}
              </Button>

              <Button variant="ghost" className="rounded-full" onClick={goToAuth}>
                {t('nav.login')}
              </Button>
              <Button
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={goToAuth}
              >
                {t('nav.getStarted')}
                <ChevronRight className={`w-4 h-4 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="pt-28 pb-20 px-4 relative overflow-hidden">
        {/* Subtle wave background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Logo mark */}
          <div className="flex justify-center mb-8">
            <img
              src={buffLogoNoBg}
              alt="BUFF - ADHD routine app for kids and teens"
              className="h-24 w-24 object-contain"
              loading="eager"
            />
          </div>

          {/* Primary headline — emotionally resonant */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
            <span className="text-foreground">{t('landing.heroHeadline')}</span>
            <br />
            <span className="text-primary">{t('landing.heroHeadline2')}</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            {t('landing.heroSub')}
          </p>

          {/* SEO-rich subtitle */}
          <p className="text-sm text-muted-foreground/50 max-w-md mx-auto mb-8 -mt-4">
            The #1 ADHD routine app for kids — built on executive function research, loved by families worldwide.
          </p>

          {/* Single CTA */}
          <Button
            size="lg"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all"
            onClick={goToAuth}
          >
            {t('landing.startFree')}
            <ChevronRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      </section>

      {/* ── Benefits Section ── */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-wide mb-4">
              {t('landing.benefitsTitle')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <BenefitCard
              icon={Mountain}
              title={t('landing.benefit1Title')}
              description={t('landing.benefit1Desc')}
            />
            <BenefitCard
              icon={BarChart3}
              title={t('landing.benefit2Title')}
              description={t('landing.benefit2Desc')}
            />
            <BenefitCard
              icon={Handshake}
              title={t('landing.benefit3Title')}
              description={t('landing.benefit3Desc')}
            />
          </div>
        </div>
      </section>

      {/* ── Testimonials Section (from DB) ── */}
      <TestimonialsSection />

      {/* ── CTA Section ── */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-wide mb-4">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-muted-foreground mb-10 leading-relaxed max-w-lg mx-auto">
            {t('landing.ctaSubtitle')}
          </p>
          <Button
            size="lg"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all"
            onClick={goToAuth}
          >
            {t('landing.ctaButton')}
            <ChevronRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-5 border-t border-border bg-card/30">
        <div className="max-w-5xl mx-auto">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <BuffLogo />
            <span className="text-sm text-muted-foreground italic">
              {t('landing.foundedBy')}
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground mb-8">
            <Link to="/about" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {language === 'he' ? 'אודות' : 'About'}
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              {language === 'he' ? 'פרטיות' : 'Privacy'}
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              {language === 'he' ? 'תנאי שימוש' : 'Terms'}
            </Link>
            <a href="https://www.youtube.com/@buff.adhdapp" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              YouTube
            </a>
            <a href={language === 'he' ? 'https://chat.whatsapp.com/JUCsJ7yrNWQC4E25vqNIK5' : 'https://chat.whatsapp.com/KM1b9UmQO0cBGgCVI54W7R'} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {language === 'he' ? 'קהילה' : 'Community'}
            </a>
          </div>

          {/* Bottom */}
          <div className="pt-6 border-t border-border text-center space-y-2">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Brain className="w-4 h-4" />
              {t('landing.researchBacked')}
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} BUFF. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
