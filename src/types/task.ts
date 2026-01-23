export type TaskCategory = 'medication' | 'hygiene' | 'nutrition' | 'school';

export type WeekDay = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday';

export const WEEK_DAYS: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  sunday: 'Sun',
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
};

export interface PeriodInfo {
  subject: string;
  startTime: string; // HH:MM format
}

export interface Timetable {
  [day: string]: PeriodInfo[]; // 8 periods per day
}

export interface Task {
  id: string;
  title: string;
  time: string; // HH:MM format
  category: TaskCategory;
  credits: number;
  completed: boolean;
  completedAt?: Date;
}

export interface Lesson {
  id: string;
  label: string;
  credits: number;
  completed: boolean;
}

export interface Reward {
  id: string;
  title: string;
  requiredCredits: number;
  icon: string;
}

export interface StoreReward {
  id: string;
  title: string;
  icon: string;
  price: number;
  claimed: boolean;
  claimedAt?: string;
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  earnedCredits: number;
  completedTasks: string[]; // task IDs
  completedLessons: string[]; // lesson IDs
}

export interface VaultData {
  totalBalance: number;
  lastUpdatedDate: string;
  storeRewards: StoreReward[];
}
