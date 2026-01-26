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
    <div className="bg-background min-h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/98 backdrop-blur-lg border-b border-border/50 flex-shrink-0">
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

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-5 tab-content">
          {/* Credit Vault */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 shadow-glow">
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

          {/* Available Rewards - 2 Column Grid */}
          {availableRewards.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                {t('store.availableRewards')}
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {availableRewards.map((reward) => {
                  const canAfford = totalBalance >= reward.price;
                  const progress = Math.min((totalBalance / reward.price) * 100, 100);
                  const isRedeeming = redeemingId === reward.id;
                  
                  return (
                    <div
                      key={reward.id}
                      className={cn(
                        "p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center text-center",
                        canAfford 
                          ? "bg-card border-primary/50 shadow-buff-glow" 
                          : "bg-card/50 border-border shadow-card"
                      )}
                    >
                      {/* Icon at top */}
                      <span className="text-4xl mb-3">{reward.icon}</span>
                      
                      {/* Reward name in middle */}
                      <h3 className="font-semibold text-foreground mb-2 text-sm line-clamp-2 min-h-[2.5rem]">
                        {reward.title}
                      </h3>
                      
                      {/* Progress indicator */}
                      <div className="w-full mb-3">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {totalBalance.toLocaleString()} / {reward.price.toLocaleString()}
                        </p>
                      </div>
                      
                      {/* Buy button at bottom */}
                      <Button
                        onClick={() => handleRedeem(reward)}
                        disabled={!canAfford || isRedeeming}
                        size="sm"
                        className={cn(
                          "w-full h-10 text-xs font-semibold rounded-xl transition-all touch-target",
                          canAfford 
                            ? "bg-primary text-primary-foreground active:bg-primary/90" 
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {isRedeeming ? (
                          <Sparkles className="w-4 h-4 animate-spin" />
                        ) : canAfford ? (
                          <>
                            <Gift className={cn("w-4 h-4", isRTL ? "ml-1" : "mr-1")} />
                            {t('store.claim')}
                          </>
                        ) : (
                          <>
                            <Lock className={cn("w-4 h-4", isRTL ? "ml-1" : "mr-1")} />
                            {reward.price.toLocaleString()}
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Claimed Rewards - 2 Column Grid */}
          {claimedRewards.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-2">
                <Check className="w-4 h-4" />
                {t('store.claimedRewards')}
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {claimedRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="p-4 rounded-2xl bg-success/10 border border-success/30 flex flex-col items-center text-center"
                  >
                    <span className="text-3xl opacity-75 mb-2">{reward.icon}</span>
                    <h3 className="font-medium text-foreground text-sm mb-1">{reward.title}</h3>
                    <div className="flex items-center gap-1 text-success text-xs">
                      <Check className="w-4 h-4" />
                      <span>{t('store.claimed')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {storeRewards.length === 0 && (
            <div className="text-center py-16">
              <div className="relative inline-block mb-4">
                <Vault className="w-20 h-20 mx-auto text-muted-foreground/30" />
                <Gift className="w-8 h-8 absolute -bottom-1 -right-1 text-primary/50" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {t('store.vaultEmpty')}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                {t('store.askParentToAdd')}
              </p>
            </div>
          )}

          {/* Bottom padding for safe area */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}