import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { StoreReward } from '@/types/task';

interface RewardMilestoneToastProps {
  totalBalance: number;
  storeRewards: StoreReward[];
}

const MILESTONE_KEY = 'buff_reward_milestones_seen';
const MILESTONES = [50, 75, 90]; // percentage thresholds

function getSeenMilestones(): Record<string, number[]> {
  try {
    return JSON.parse(localStorage.getItem(MILESTONE_KEY) || '{}');
  } catch {
    return {};
  }
}

function markMilestoneSeen(rewardId: string, percent: number) {
  const seen = getSeenMilestones();
  if (!seen[rewardId]) seen[rewardId] = [];
  seen[rewardId].push(percent);
  localStorage.setItem(MILESTONE_KEY, JSON.stringify(seen));
}

export function RewardMilestoneToast({ totalBalance, storeRewards }: RewardMilestoneToastProps) {
  const { t } = useLanguage();
  const [toast, setToast] = useState<{ reward: StoreReward; percent: number } | null>(null);
  const prevBalance = useRef(totalBalance);

  useEffect(() => {
    // Only trigger on balance increase
    if (totalBalance <= prevBalance.current) {
      prevBalance.current = totalBalance;
      return;
    }
    prevBalance.current = totalBalance;

    const available = storeRewards.filter(r => !r.claimed);
    const seen = getSeenMilestones();

    for (const reward of available) {
      const pct = Math.floor((totalBalance / reward.price) * 100);
      const seenForReward = seen[reward.id] || [];

      for (const milestone of MILESTONES) {
        if (pct >= milestone && !seenForReward.includes(milestone)) {
          markMilestoneSeen(reward.id, milestone);
          setToast({ reward, percent: milestone });

          setTimeout(() => setToast(null), 4000);
          return; // only one toast at a time
        }
      }
    }
  }, [totalBalance, storeRewards]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="fixed bottom-28 inset-x-0 z-50 flex justify-center pointer-events-none"
        >
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-card border border-primary/30 shadow-lg max-w-[320px]">
            <div className="p-2 rounded-xl bg-primary/15">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-medium text-foreground">
              {t('pet.rewardMilestone')
                .replace('{percent}', String(toast.percent))
                .replace('{reward}', toast.reward.title)}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
