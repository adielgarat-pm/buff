import { FocusArea } from '@/components/onboarding/steps/Step2FocusArea';

export type StarterPack =
  | 'school_quest' | 'homework_hero'
  | 'morning_pro' | 'evening_routine'
  | 'daily_dash' | 'fuel_up'
  | 'steam_startup';

export interface PackTask {
  titleKey: string;
  category: string;
  credits: number;
  time: string;
  icon: string;
}

export interface PackDefinition {
  titleKey: string;
  descKey: string;
  iconName: string; // lucide icon name reference
  isPremium: boolean;
  tasks: PackTask[];
}

export const PACKS_BY_FOCUS: Record<FocusArea, StarterPack[]> = {
  homework: ['school_quest', 'homework_hero'],
  home: ['morning_pro', 'evening_routine'],
  fitness: ['daily_dash', 'fuel_up'],
  project: ['steam_startup'],
};

export const PACK_DEFINITIONS: Record<StarterPack, PackDefinition> = {
  // Learning — Pack A (PREMIUM)
  school_quest: {
    titleKey: 'onboarding.step3.pack.school_quest',
    descKey: 'onboarding.step3.pack.school_quest.desc',
    iconName: 'Backpack',
    isPremium: true,
    tasks: [
      { titleKey: 'pack.task.class_prep', category: 'learning', credits: 5, time: '08:00', icon: '📋' },
      { titleKey: 'pack.task.active_listening', category: 'learning', credits: 10, time: '09:00', icon: '👂' },
      { titleKey: 'pack.task.record_hw', category: 'learning', credits: 10, time: '14:00', icon: '📝' },
    ],
  },
  // Learning — Pack B (FREE)
  homework_hero: {
    titleKey: 'onboarding.step3.pack.homework_hero',
    descKey: 'onboarding.step3.pack.homework_hero.desc',
    iconName: 'BookOpen',
    isPremium: false,
    tasks: [
      { titleKey: 'pack.task.check_hw', category: 'learning', credits: 5, time: '15:00', icon: '🔍' },
      { titleKey: 'pack.task.complete_hw', category: 'learning', credits: 15, time: '16:00', icon: '✏️' },
      { titleKey: 'pack.task.bonus_academic', category: 'learning', credits: 10, time: '17:00', icon: '⭐' },
    ],
  },
  // Home — Pack A (FREE)
  morning_pro: {
    titleKey: 'onboarding.step3.pack.morning_pro',
    descKey: 'onboarding.step3.pack.morning_pro.desc',
    iconName: 'Sun',
    isPremium: false,
    tasks: [
      { titleKey: 'pack.task.ready_on_time', category: 'organization', credits: 10, time: '07:00', icon: '⏰' },
      { titleKey: 'pack.task.teeth_morning', category: 'self-care', credits: 5, time: '07:15', icon: '🦷' },
      { titleKey: 'pack.task.healthy_breakfast', category: 'self-care', credits: 5, time: '07:30', icon: '🥣' },
      { titleKey: 'pack.task.medication', category: 'self-care', credits: 5, time: '07:45', icon: '💊' },
    ],
  },
  // Home — Pack B (FREE)
  evening_routine: {
    titleKey: 'onboarding.step3.pack.evening_routine',
    descKey: 'onboarding.step3.pack.evening_routine.desc',
    iconName: 'Bed',
    isPremium: false,
    tasks: [
      { titleKey: 'pack.task.screens_off', category: 'self-care', credits: 15, time: '20:00', icon: '📵' },
      { titleKey: 'pack.task.shower_teeth', category: 'self-care', credits: 10, time: '20:30', icon: '🚿' },
      { titleKey: 'pack.task.bed_on_time', category: 'self-care', credits: 10, time: '21:00', icon: '🛏️' },
    ],
  },
  // Fitness — Pack A (FREE)
  daily_dash: {
    titleKey: 'onboarding.step3.pack.daily_dash',
    descKey: 'onboarding.step3.pack.daily_dash.desc',
    iconName: 'Dumbbell',
    isPremium: false,
    tasks: [
      { titleKey: 'pack.task.short_walk', category: 'movement', credits: 5, time: '16:00', icon: '🚶' },
      { titleKey: 'pack.task.short_sport', category: 'movement', credits: 10, time: '17:00', icon: '🏃' },
      { titleKey: 'pack.task.long_sport', category: 'movement', credits: 15, time: '18:00', icon: '🏋️' },
    ],
  },
  // Fitness — Pack B (FREE)
  fuel_up: {
    titleKey: 'onboarding.step3.pack.fuel_up',
    descKey: 'onboarding.step3.pack.fuel_up.desc',
    iconName: 'Apple',
    isPremium: false,
    tasks: [
      { titleKey: 'pack.task.hydration', category: 'self-care', credits: 5, time: '10:00', icon: '💧' },
      { titleKey: 'pack.task.healthy_snack', category: 'self-care', credits: 5, time: '14:00', icon: '🍎' },
      { titleKey: 'pack.task.screen_free_play', category: 'movement', credits: 10, time: '16:00', icon: '🎯' },
    ],
  },
  // Project — PREMIUM locked
  steam_startup: {
    titleKey: 'onboarding.step3.pack.steam_startup',
    descKey: 'onboarding.step3.pack.steam_startup.desc',
    iconName: 'FlaskConical',
    isPremium: true,
    tasks: [],
  },
};
