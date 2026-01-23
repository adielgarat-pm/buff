export type TaskCategory = 'medication' | 'hygiene' | 'nutrition' | 'school';

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

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  earnedCredits: number;
  completedTasks: string[]; // task IDs
  completedLessons: string[]; // lesson IDs
}
