import { PhaseConfig } from '@/types/phase';
import { cn } from '@/lib/utils';

interface PhaseProgressCircleProps {
  phase: PhaseConfig;
  completed: number;
  total: number;
  earnedCredits: number;
  totalCredits: number;
}

export function PhaseProgressCircle({ 
  phase, 
  completed, 
  total, 
  earnedCredits,
  totalCredits 
}: PhaseProgressCircleProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = completed === total && total > 0;
  
  // SVG circle parameters
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg 
          width={size} 
          height={size} 
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth={strokeWidth}
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl mb-1">{phase.icon}</span>
          <span className={cn(
            "text-2xl font-bold",
            isComplete ? "text-primary" : "text-foreground"
          )}>
            {completed}/{total}
          </span>
        </div>
      </div>
      
      {/* Phase label */}
      <h2 className="text-lg font-semibold text-foreground mt-4">
        {phase.label}
      </h2>
      
      {/* Credits earned */}
      <p className="text-sm text-muted-foreground">
        {earnedCredits} / {totalCredits} credits
      </p>
      
      {isComplete && (
        <span className="mt-2 text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
          ✓ Phase Complete!
        </span>
      )}
    </div>
  );
}
