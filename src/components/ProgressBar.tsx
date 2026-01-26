import { FocusFuelMeter } from './FocusFuelMeter';

interface ProgressBarProps {
  earned: number;
  goal: number;
  percent: number;
  totalBalance?: number;
  totalPossible?: number;
  isWeekend?: boolean;
  buffsActivated?: number;
}

export function ProgressBar({ earned, goal, totalPossible = 0, isWeekend = false, buffsActivated = 0 }: ProgressBarProps) {
  return (
    <FocusFuelMeter
      earned={earned}
      goal={goal}
      totalPossible={totalPossible}
      isWeekend={isWeekend}
      buffsActivated={buffsActivated}
    />
  );
}
