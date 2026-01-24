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
    <div className="bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {showBackButton && onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground"
              >
                <BackIcon className="w-5 h-5" />
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{t('store.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('store.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Credit Vault */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Vault className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('store.totalBalance')}</p>
              <p className="text-3xl font-bold text-foreground">
                {totalBalance.toLocaleString()}
                <span className="text-lg font-normal text-muted-foreground mx-1">{t('store.credits')}</span>
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
                    "p-5 rounded-2xl border transition-all duration-300",
                    canAfford 
                      ? "bg-card border-primary/50 hover:border-primary" 
                      : "bg-card/50 border-border"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{reward.icon}</span>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1">{reward.title}</h3>
                      
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
                      <div className="space-y-1">
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{totalBalance.toLocaleString()} / {reward.price.toLocaleString()}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleRedeem(reward)}
                      disabled={!canAfford || isRedeeming}
                      className={cn(
                        "transition-all",
                        canAfford 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {isRedeeming ? (
                        <Sparkles className="w-4 h-4 animate-spin" />
                      ) : canAfford ? (
                        <>
                          <Gift className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                          {t('store.claim')}
                        </>
                      ) : (
                        <>
                          <Lock className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                          {t('store.locked')}
                        </>
                      )}
                    </Button>
                  </div>
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
                  <span className="text-3xl opacity-75">{reward.icon}</span>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{reward.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {reward.price.toLocaleString()} {t('store.credits')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 text-green-400">
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
          <div className="text-center py-12">
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