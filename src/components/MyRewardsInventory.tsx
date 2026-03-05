import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { StoreReward } from '@/types/task';
import { translateTitle } from '@/utils/displayTranslation';
import { Button } from './ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog';

interface MyRewardsInventoryProps {
  claimedRewards: StoreReward[];
  onMarkUsed: (rewardId: string) => void;
}

export function MyRewardsInventory({ claimedRewards, onMarkUsed }: MyRewardsInventoryProps) {
  const { t, language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [confirmUsed, setConfirmUsed] = useState<StoreReward | null>(null);

  if (claimedRewards.length === 0) return null;

  return (
    <>
      <div className="rounded-2xl bg-card/50 border border-border/50 overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-card/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Ticket className="w-5 h-5 text-primary" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {claimedRewards.length}
              </span>
            </div>
            <span className="font-bold text-foreground text-sm">{t('ticket.myRewards')}</span>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 space-y-3">
                {claimedRewards.map((reward, i) => (
                  <motion.div
                    key={reward.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20"
                  >
                    <span className="text-2xl">{reward.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {translateTitle(reward.title, language)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('ticket.showToRedeem')}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmUsed(reward)}
                      className="h-8 px-3 text-xs rounded-xl border-primary/30 text-primary hover:bg-primary/10 shrink-0"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {t('ticket.used')}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AlertDialog open={!!confirmUsed} onOpenChange={(open) => !open && setConfirmUsed(null)}>
        <AlertDialogContent className="rounded-2xl max-w-xs mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">{t('ticket.markUsedTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {confirmUsed && (
                <>
                  {confirmUsed.icon} {translateTitle(confirmUsed.title, language)}
                  <br />
                  {t('ticket.markUsedDesc')}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-center">
            <AlertDialogCancel className="mt-0 flex-1">{t('store.confirmCancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                if (confirmUsed) onMarkUsed(confirmUsed.id);
                setConfirmUsed(null);
              }}
            >
              {t('ticket.confirmUsed')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
