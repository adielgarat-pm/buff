import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { V2QuizData } from '../V2OnboardingFlow';
import { getPreviewTasks } from '../utils/previewTasks';

interface RoadmapStepProps {
  data: V2QuizData;
  onNext: () => void;
  onBack: () => void;
}

export function RoadmapStep({ data, onNext, onBack }: RoadmapStepProps) {
  const { t, isRTL } = useLanguage();
  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  const goalLabel = t(`v2.goal.${data.successGoal}`) || data.successGoal;
  const previewTasks = getPreviewTasks(data.language, data.morningChallenge);

  return (
    <div className="flex flex-col gap-6 pt-4 max-w-sm mx-auto">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors self-start">
        <BackIcon className="w-4 h-4" />
        {t('v2.back')}
      </button>

      {/* Hero text */}
      <div className="text-center space-y-3">
        <Sparkles className="w-10 h-10 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-foreground leading-snug">
          {t('v2.roadmapTitle')
            .replace('{name}', data.childName)
            .replace('{goal}', goalLabel)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('v2.roadmapDesc')}
        </p>
      </div>

      {/* Task preview cards */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('v2.yourPlan')}
        </p>
        {previewTasks.map((task, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60"
          >
            <span className="text-xl">{task.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">{task.time}</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-primary/40" />
          </div>
        ))}
      </div>

      {/* 7-day badge */}
      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center">
        <p className="text-sm font-semibold text-primary">
          {t('v2.roadmap7day')}
        </p>
      </div>

      {/* CTA */}
      <Button onClick={onNext} className="w-full rounded-2xl h-12 text-base" size="lg">
        {t('v2.saveMyPlan')}
      </Button>
    </div>
  );
}
