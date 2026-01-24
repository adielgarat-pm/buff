import { useState } from 'react';
import { StoreReward } from '@/types/task';
import { Button } from './ui/button';
import { Vault, Gift, Check, Lock, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

interface RewardsStoreProps {
  totalBalance: number;
  storeRewards: StoreReward[];
  onRedeem: (rewardId: string) => void;
  onClose?: () => void;
  showBackButton?: boolean;
}

export function RewardsStore({ totalBalance, storeRewards, onRedeem, onClose, showBackButton = false }: RewardsStoreProps) {
  const { t, isRTL } = useLanguage();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const handleRedeem = (reward: StoreReward) => {
    if (totalBalance >= reward.price && !reward.claimed) {
      setRedeemingId(reward.id);
      setTimeout(() => {
        onRedeem(reward.id);
        setRedeemingId(null);
      }, 500);
    }
  };

  const availableRewards = storeRewards.filter(r => !r.claimed);
  const claimedRewards = storeRewards.filter(r => r.claimed);
  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <div className="bg-background min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/98 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {showBackButton && onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground w-11 h-11 touch-target"
              >
                <BackIcon className="w-6 h-6" />
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{t('store.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('store.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5 tab-content">
        {/* Credit Vault */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Vault className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('store.totalBalance')}</p>
              <p className="text-3xl font-bold text-foreground">
                {totalBalance.toLocaleString()}
                <span className="text-base font-normal text-muted-foreground mx-1">{t('store.credits')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Available Rewards */}
        {availableRewards.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              {t('store.availableRewards')}
            </h2>
            
            {availableRewards.map((reward) => {
              const canAfford = totalBalance >= reward.price;
              const progress = Math.min((totalBalance / reward.price) * 100, 100);
              const isRedeeming = redeemingId === reward.id;
              
              return (
                <div
                  key={reward.id}
                  className={cn(
                    "p-4 sm:p-5 rounded-2xl border transition-all duration-200",
                    canAfford 
                      ? "bg-card border-primary/50 active:border-primary" 
                      : "bg-card/50 border-border"
                  )}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="text-3xl sm:text-4xl">{reward.icon}</span>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1 text-base">{reward.title}</h3>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn(
                          "text-lg font-bold",
                          canAfford ? "text-primary" : "text-muted-foreground"
                        )}>
                          {reward.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">{t('store.credits')}</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <Progress value={progress} className="h-2.5" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{totalBalance.toLocaleString()} / {reward.price.toLocaleString()}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Claim button - full width on mobile for easy tapping */}
                  <Button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford || isRedeeming}
                    className={cn(
                      "w-full mt-4 h-12 text-base font-semibold rounded-xl transition-all touch-target",
                      canAfford 
                        ? "bg-primary text-primary-foreground active:bg-primary/90" 
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {isRedeeming ? (
                      <Sparkles className="w-5 h-5 animate-spin" />
                    ) : canAfford ? (
                      <>
                        <Gift className={cn("w-5 h-5", isRTL ? "ml-2" : "mr-2")} />
                        {t('store.claim')}
                      </>
                    ) : (
                      <>
                        <Lock className={cn("w-5 h-5", isRTL ? "ml-2" : "mr-2")} />
                        {t('store.locked')}
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Claimed Rewards */}
        {claimedRewards.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-2">
              <Check className="w-4 h-4" />
              {t('store.claimedRewards')}
            </h2>
            
            {claimedRewards.map((reward) => (
              <div
                key={reward.id}
                className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl sm:text-3xl opacity-75">{reward.icon}</span>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{reward.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {reward.price.toLocaleString()} {t('store.credits')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-green-400">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">{t('store.claimed')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {storeRewards.length === 0 && (
          <div className="text-center py-16">
            <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t('store.noRewards')}</h3>
            <p className="text-muted-foreground">
              {t('store.askParent')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}