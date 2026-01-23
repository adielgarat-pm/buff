import { Reward } from '@/types/task';
import { cn } from '@/lib/utils';
import { Lock, Unlock, Gift } from 'lucide-react';

interface RewardsSectionProps {
  rewards: Reward[];
  earnedCredits: number;
}

export function RewardsSection({ rewards, earnedCredits }: RewardsSectionProps) {
  return (
    <div className="rounded-2xl p-6 bg-gradient-card border border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/20">
          <Gift className="w-5 h-5 text-accent" />
        </div>
        <h2 className="font-bold text-foreground">Rewards</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {rewards.map((reward) => {
          const isUnlocked = earnedCredits >= reward.requiredCredits;
          const progress = Math.min((earnedCredits / reward.requiredCredits) * 100, 100);
          
          return (
            <div
              key={reward.id}
              className={cn(
                'relative p-4 rounded-xl border transition-all duration-300',
                isUnlocked 
                  ? 'bg-accent/10 border-accent/30 shadow-glow' 
                  : 'bg-secondary/50 border-border'
              )}
            >
              {/* Progress indicator for locked rewards */}
              {!isUnlocked && (
                <div 
                  className="absolute inset-0 bg-accent/5 rounded-xl transition-all"
                  style={{ 
                    clipPath: `inset(${100 - progress}% 0 0 0)`,
                  }}
                />
              )}

              <div className="relative flex items-center gap-3">
                <span className="text-2xl">{reward.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium truncate',
                    isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {reward.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reward.requiredCredits} credits
                  </p>
                </div>
                <div className={cn(
                  'p-1.5 rounded-full',
                  isUnlocked ? 'bg-accent/20' : 'bg-muted'
                )}>
                  {isUnlocked ? (
                    <Unlock className="w-4 h-4 text-accent" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
