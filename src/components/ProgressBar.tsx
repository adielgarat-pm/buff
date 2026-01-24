import { FocusFuelMeter } from './FocusFuelMeter';

interface ProgressBarProps {
  earned: number;
  goal: number;
  percent: number;
  totalBalance?: number;
  buffsActivated?: number;
}

export function ProgressBar({ earned, goal, percent, buffsActivated = 0 }: ProgressBarProps) {
  return (
    <FocusFuelMeter
      earned={earned}
      goal={goal}
      buffsActivated={buffsActivated}
    />
  );
}
