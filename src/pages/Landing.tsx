import { Link } from 'react-router-dom';
import { Zap, Brain, Users, BarChart3, ChevronRight, Sparkles, Shield, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import buffLogo from '@/assets/buff-logo.png';

// BUFF Logo Component
function BuffLogo({ size = 'default' }: { size?: 'default' | 'large' }) {
  const logoSize = size === 'large' ? 'h-20 w-20' : 'h-10 w-10';
  
  return (
    <div className="flex items-center gap-2">
      <img 
        src={buffLogo} 
        alt="BUFF Logo" 
        className={`${logoSize} object-contain`}
      />
      {size !== 'large' && (
        <span className="font-display text-2xl font-bold tracking-wide text-primary">
          BUFF
        </span>
      )}
    </div>
  );
}

// Feature Card Component
function FeatureCard({ 
  icon: Icon, 
  title, 
  description,
  gradient 
}: { 
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="relative group">
      {/* Glowing border effect */}
      <div className={`absolute -inset-0.5 ${gradient} rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500`} />
      
      <div className="relative bg-card rounded-2xl p-6 border border-border h-full">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground mb-2 tracking-wide">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

// Mobile Mockup Component
function MobileMockup() {
  return (
    <div className="relative mx-auto w-[280px] h-[560px]">
      {/* Phone frame */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl border-4 border-gray-700">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl" />
        
        {/* Screen content */}
        <div className="absolute inset-4 top-8 bg-background rounded-[2rem] overflow-hidden">
          {/* App header */}
          <div className="p-4 border-b border-border">
            <BuffLogo size="default" />
            <p className="text-xs text-muted-foreground mt-1">Monday, Jan 24</p>
          </div>
          
          {/* XP Bar */}
          <div className="p-4">
            <div className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-display font-bold">Daily XP</span>
                <span className="text-buff font-bold">65/100</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-[65%] bg-gradient-to-r from-buff/80 to-buff rounded-full" />
              </div>
            </div>
          </div>
          
          {/* Task Cards */}
          <div className="px-4 space-y-3">
            <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Morning Routine</p>
                <p className="text-xs text-muted-foreground">8:00 AM</p>
              </div>
              {/* Buff button */}
              <div className="w-8 h-8 rounded-xl bg-buff/20 flex items-center justify-center animate-buff-pulse">
                <Zap className="w-4 h-4 text-buff fill-buff" />
              </div>
            </div>
            
            <div className="bg-card rounded-2xl p-4 border border-buff/30 flex items-center gap-3 buff-active-glow">
              <div className="w-10 h-10 rounded-xl bg-buff/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-buff" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Start Homework</p>
                <p className="text-xs text-muted-foreground">4:00 PM</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-buff flex items-center justify-center">
                <Zap className="w-4 h-4 text-buff-foreground fill-current" />
              </div>
            </div>
            
            <div className="bg-buff/10 rounded-2xl p-3 border border-buff/20 mt-2">
              <p className="text-xs font-display text-buff flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" />
                Buff Activated!
              </p>
              <p className="text-xs text-foreground/80 mt-1">
                Break it down: Focus on just the first 5 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating glow effects */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-buff/30 rounded-full blur-3xl" />
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <BuffLogo />
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#for-parents" className="text-muted-foreground hover:text-foreground transition-colors">
                For Parents
              </a>
            </div>
            
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" className="rounded-2xl">
                  Log In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="rounded-2xl bg-buff text-buff-foreground hover:bg-buff/90 cta-buff-button">
                  Get Started
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-buff/10 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Based on the Cog-Fun Model</span>
          </div>
          
          <div className="flex flex-col items-center mb-6">
            <img 
              src={buffLogo} 
              alt="BUFF Logo" 
              className="h-32 w-32 object-contain mb-4"
            />
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-wide">
              <span className="text-primary">BUFF</span>
            </h1>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground">The Executive Function </span>
            <span className="text-gradient">Power-up</span>
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Master your daily routine with research-based <span className="text-buff font-semibold">Cog-Fun strategies</span> designed for the ADHD brain.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="rounded-2xl bg-buff text-buff-foreground hover:bg-buff/90 text-lg px-8 py-6 cta-buff-button animate-cta-glow">
                <Zap className="w-5 h-5 mr-2 fill-current" />
                Try BUFF for Free
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="rounded-2xl text-lg px-8 py-6">
                See How It Works
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-wide mb-4">
              Unlock Your <span className="text-gradient">Daily Buffs</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Cognitive power-ups that transform overwhelming tasks into achievable victories.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Activate Daily Buffs"
              description="Use cognitive strategies to break through task paralysis and conquer 'Mountain' assignments one step at a time."
              gradient="bg-gradient-to-r from-buff to-green-400"
            />
            <FeatureCard
              icon={Users}
              title="Family Sync"
              description="Collaborative goal setting where the parent is the coach and the teen is the hero of their own journey."
              gradient="bg-gradient-to-r from-primary to-purple-500"
            />
            <FeatureCard
              icon={BarChart3}
              title="Smart Insights"
              description="A data-driven dashboard that helps parents identify patterns and offer the right support at the right time."
              gradient="bg-gradient-to-r from-blue-500 to-primary"
            />
          </div>
        </div>
      </section>

      {/* Mobile Preview Section */}
      <section id="how-it-works" className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-wide mb-6">
                Power-ups for the <span className="text-buff">ADHD Brain</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                BUFF uses the research-backed Cog-Fun model to provide personalized cognitive strategies exactly when your teen needs them most.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-buff/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-buff" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Environment Buffs</h4>
                    <p className="text-sm text-muted-foreground">Optimize your space for focus and reduce sensory distractions.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Focus Buffs</h4>
                    <p className="text-sm text-muted-foreground">Break down overwhelming tasks into micro-achievements.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Energy Buffs</h4>
                    <p className="text-sm text-muted-foreground">Self-regulation techniques to manage energy and emotions.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <MobileMockup />
            </div>
          </div>
        </div>
      </section>

      {/* For Parents Section */}
      <section id="for-parents" className="py-20 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-wide mb-6">
            For Parents: Be the <span className="text-primary">Coach</span>, Not the Boss
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
            BUFF empowers parents with insights and strategies to support their teen's executive function development without micromanaging. Collaboration over control.
          </p>
          
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            <div className="bg-background rounded-2xl p-6 border border-border">
              <div className="text-3xl mb-4">📊</div>
              <h4 className="font-semibold mb-2">Pattern Recognition</h4>
              <p className="text-sm text-muted-foreground">Identify when and where struggles happen to offer targeted support.</p>
            </div>
            <div className="bg-background rounded-2xl p-6 border border-border">
              <div className="text-3xl mb-4">💡</div>
              <h4 className="font-semibold mb-2">Coaching Tips</h4>
              <p className="text-sm text-muted-foreground">Receive research-based suggestions for supporting your teen.</p>
            </div>
            <div className="bg-background rounded-2xl p-6 border border-border">
              <div className="text-3xl mb-4">🤝</div>
              <h4 className="font-semibold mb-2">Collaborative Goals</h4>
              <p className="text-sm text-muted-foreground">Set rewards and milestones together as a team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-buff/10 to-primary/10" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-wide mb-6">
            Ready to Power Up?
          </h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            Join families who are transforming daily routines into achievable victories.
          </p>
          <Link to="/auth">
            <Button size="lg" className="rounded-2xl bg-buff text-buff-foreground hover:bg-buff/90 text-lg px-10 py-6 cta-buff-button animate-cta-glow">
              <Zap className="w-5 h-5 mr-2 fill-current" />
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <BuffLogo />
              <span className="text-sm text-muted-foreground">
                Executive Function Power-up
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#for-parents" className="hover:text-foreground transition-colors">For Parents</a>
              <Link to="/auth" className="hover:text-foreground transition-colors">Get Started</Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Brain className="w-4 h-4" />
              Based on the <span className="text-primary font-medium">Cog-Fun Model</span> — Research-backed cognitive strategies
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              © {new Date().getFullYear()} BUFF. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}