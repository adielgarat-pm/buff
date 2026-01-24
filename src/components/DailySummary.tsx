import { Task, Lesson, StoreReward } from '@/types/task';
import { Button } from './ui/button';
import { ChevronLeft, Star, Trophy, Heart, Zap, BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailySummaryProps {
  tasks: Task[];
  lessons: Lesson[];
  earnedCredits: number;
  dailyGoal: number;
  respectfulLearningBonus: boolean;
  onClose: () => void;
}

export function DailySummary({
  tasks,
  lessons,
  earnedCredits,
  dailyGoal,
  respectfulLearningBonus,
  onClose,
}: DailySummaryProps) {
  const completedTasks = tasks.filter(t => t.completed);
  const completedLessons = lessons.filter(l => l.completed);
  const totalCompleted = completedTasks.length + completedLessons.length;
  
  const goalReached = earnedCredits >= dailyGoal;

  // Get encouraging message based on completion
  const getEncouragingMessage = () => {
    const percent = (earnedCredits / dailyGoal) * 100;
    if (percent >= 100) return "You absolutely crushed it today! 🏆";
    if (percent >= 80) return "Amazing effort! You're a superstar! ⭐";
    if (percent >= 60) return "Great progress! Every step counts! 💪";
    if (percent >= 40) return "You showed up and tried! That's what matters! 🌟";
    return "Tomorrow is a fresh start! You've got this! 💙";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">Today's Summary</h1>
              <p className="text-sm text-muted-foreground">Focus on what you achieved!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Main Achievement Card */}
        <div className={cn(
          "p-6 rounded-2xl border text-center",
          goalReached 
            ? "bg-gradient-to-br from-success/20 to-primary/10 border-success/40" 
            : "bg-gradient-card border-border"
        )}>
          <div className={cn(
            "inline-flex p-4 rounded-full mb-4",
            goalReached ? "bg-success/20" : "bg-primary/20"
          )}>
            {goalReached ? (
              <Trophy className="w-12 h-12 text-success" />
            ) : (
              <Star className="w-12 h-12 text-primary" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            You crushed {totalCompleted} {totalCompleted === 1 ? 'task' : 'tasks'} today!
          </h2>
          
          <p className="text-muted-foreground mb-4">
            {getEncouragingMessage()}
          </p>

          <div className={cn(
            "inline-flex items-center gap-2 px-6 py-3 rounded-full",
            goalReached ? "bg-success/20" : "bg-primary/20"
          )}>
            <Zap className={cn("w-5 h-5", goalReached ? "text-success" : "text-primary")} />
            <span className={cn("text-2xl font-bold", goalReached ? "text-success" : "text-primary")}>
              {earnedCredits}
            </span>
            <span className="text-muted-foreground">credits earned</span>
          </div>
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Tasks Completed
            </h3>
            
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <div className="p-1.5 rounded-full bg-success/20">
                    <Star className="w-4 h-4 text-success" />
                  </div>
                  <span className="flex-1 font-medium text-foreground">{task.title}</span>
                  <span className="text-sm text-success">+{task.credits}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Lessons */}
        {completedLessons.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Lessons Attended
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {completedLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/20 border border-primary/30"
                >
                  <span className="font-medium text-foreground">{lesson.label}</span>
                  <span className="text-xs text-primary">+{lesson.credits}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Respectful Learning Bonus */}
        {respectfulLearningBonus && (
          <div className="p-4 rounded-2xl bg-success/10 border border-success/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <Heart className="w-6 h-6 text-success fill-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-success">Respectful Learning Bonus!</h3>
                <p className="text-sm text-muted-foreground">No interruptions today</p>
              </div>
              <span className="text-lg font-bold text-success">+20</span>
            </div>
          </div>
        )}

        {/* Encouraging Footer */}
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm">
            Every completed task is a victory. 
            <br />
            You're doing great! 💙
          </p>
        </div>
      </div>
    </div>
  );
}
