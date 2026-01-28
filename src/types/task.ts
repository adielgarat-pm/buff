export type TaskCategory = 'medication' | 'hygiene' | 'nutrition' | 'school';

export type WeekDay = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export const WEEK_DAYS: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

export const WEEK_DAYS_WITH_FRIDAY: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  sunday: 'ראשון',
  monday: 'שני',
  tuesday: 'שלישי',
  wednesday: 'רביעי',
  thursday: 'חמישי',
  friday: 'שישי',
};

export const WEEK_DAY_LABELS_EN: Record<WeekDay, string> = {
  sunday: 'Sun',
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  medication: 'Medication',
  hygiene: 'Hygiene',
  nutrition: 'Nutrition',
  school: 'School',
};

export interface PeriodInfo {
  subject: string;
  startTime: string; // HH:MM format
  equipment?: string; // Required equipment for this lesson
}

export interface Timetable {
  [day: string]: PeriodInfo[]; // Up to 10 periods per day
}

export interface Task {
  id: string;
  title: string;
  time: string; // HH:MM format
  category: TaskCategory;
  credits: number;
  completed: boolean;
  completedAt?: Date;
  hideOnWeekend?: boolean;
  description?: string;
  icon?: string;
  assignedTo?: string; // Child profile ID for per-child tasks
  strategyId?: string; // Buff strategy booster ID
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
  assignedTo?: string; // Child profile ID for per-child rewards
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

export interface WeeklySummaryData {
  weekStartDate: string;
  weekEndDate: string;
  totalCreditsEarned: number;
  redeemedRewards: StoreReward[];
  tasksByCategory: Record<TaskCategory, number>;
  dailyCredits: { day: string; credits: number }[];
}
