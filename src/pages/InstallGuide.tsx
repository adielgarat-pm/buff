import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowLeft, Share2, Plus, Check, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import buffLogo from '@/assets/buff-logo.png';

export default function InstallGuide() {
  const navigate = useNavigate();

  const installSteps = [
    { 
      icon: Share2, 
      text: 'לחצו על כפתור השיתוף/תפריט',
      detail: 'ב-Safari זה ↑ למטה, ב-Chrome זה ⋮ למעלה'
    },
    { 
      icon: Plus, 
      text: 'בחרו "הוסף למסך הבית"',
      detail: 'או "Add to Home Screen" באנגלית'
    },
    { 
      icon: Check, 
      text: 'לחצו "הוסף" וזהו!',
      detail: 'BUFF יופיע כאייקון על המסך הראשי'
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10 pointer-events-none" />
      
      <div className="relative max-w-lg mx-auto px-6 py-8 safe-area-px">
        {/* Logo and Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-8"
        >
          <img 
            src={buffLogo} 
            alt="BUFF" 
            className="w-20 h-20 mx-auto drop-shadow-2xl"
          />
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ברוכים הבאים ל-BUFF!
          </h1>
          <p className="text-lg text-muted-foreground">
            בואו נתקין את האפליקציה
          </p>
        </motion.div>

        {/* Video Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border border-border/50 bg-card">
            <div className="aspect-video">
              <video
                src="/videos/install-guide.mp4"
                autoPlay
                muted
                playsInline
                controls
                className="w-full h-full object-cover"
                poster="/placeholder.svg"
              >
                הדפדפן שלכם לא תומך בווידאו
              </video>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-3 flex items-center justify-center gap-2">
            <Play className="w-4 h-4" />
            סרטון קצר (45 שניות) - איך להתקין את BUFF
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8"
        >
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/30"
          >
            <Smartphone className="w-5 h-5 ml-2" />
            הבנתי, בואו נתחיל!
          </Button>
        </motion.div>

        {/* Installation Steps Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-center text-foreground/80">
            סיכום שלבי ההתקנה:
          </h2>
          <div className="space-y-3">
            {installSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">{index + 1}</span>
                </div>
                <div className="flex-1 text-right">
                  <p className="font-medium text-foreground">{step.text}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.detail}</p>
                </div>
                <step.icon className="w-5 h-5 text-primary/60 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Skip link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <button
            onClick={() => navigate('/auth')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            דלג להתחברות
            <ArrowLeft className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
