// Cog-Fun Model Strategy Library
// Strategies are categorized into Environmental, Task-based, and Self-regulation

export type StrategyCategory = 'environmental' | 'task-based' | 'self-regulation';

export interface Strategy {
  id: string;
  category: StrategyCategory;
  title: string;
  tip: string;
  icon: string;
}

export const STRATEGY_CATEGORIES: Record<StrategyCategory, { label: string; labelHe: string; color: string }> = {
  'environmental': { 
    label: 'Environment Buff', 
    labelHe: 'באף סביבה',
    color: 'text-green-500' 
  },
  'task-based': { 
    label: 'Focus Buff', 
    labelHe: 'באף מיקוד',
    color: 'text-blue-500' 
  },
  'self-regulation': { 
    label: 'Energy Buff', 
    labelHe: 'באף אנרגיה',
    color: 'text-purple-500' 
  },
};

export const STRATEGIES: Strategy[] = [
  // Environmental Strategies
  {
    id: 'env-quiet-space',
    category: 'environmental',
    title: 'Quiet Space',
    tip: 'Find a quiet spot away from distractions. Turn off the TV and put your phone in another room.',
    icon: '🔇',
  },
  {
    id: 'env-visual-cues',
    category: 'environmental',
    title: 'Visual Cues',
    tip: 'Put a sticky note or picture where you can see it to remind you what to do.',
    icon: '👁️',
  },
  {
    id: 'env-organized-space',
    category: 'environmental',
    title: 'Organized Space',
    tip: 'Make sure everything you need is ready before you start. Put away things you don\'t need.',
    icon: '📦',
  },
  {
    id: 'env-timer-visible',
    category: 'environmental',
    title: 'Visible Timer',
    tip: 'Use a timer you can see to know how much time you have. It helps you stay on track!',
    icon: '⏱️',
  },
  {
    id: 'env-reduce-noise',
    category: 'environmental',
    title: 'Reduce Noise',
    tip: 'Use headphones with calm music or white noise to help you focus better.',
    icon: '🎧',
  },

  // Task-based Strategies
  {
    id: 'task-break-down',
    category: 'task-based',
    title: 'Break It Down',
    tip: 'Split this big task into smaller steps. Do one step at a time - you\'ve got this!',
    icon: '📋',
  },
  {
    id: 'task-first-step',
    category: 'task-based',
    title: 'First Step Focus',
    tip: 'Just focus on the very first step. Don\'t worry about everything else yet.',
    icon: '1️⃣',
  },
  {
    id: 'task-checklist',
    category: 'task-based',
    title: 'Use a Checklist',
    tip: 'Write down each small step and check them off as you go. It feels great!',
    icon: '✅',
  },
  {
    id: 'task-visual-steps',
    category: 'task-based',
    title: 'Visual Steps',
    tip: 'Look at pictures or a chart showing what to do step by step.',
    icon: '🖼️',
  },
  {
    id: 'task-body-double',
    category: 'task-based',
    title: 'Body Double',
    tip: 'Ask someone to sit near you while you work. Having company can help you focus!',
    icon: '👥',
  },

  // Self-regulation Strategies
  {
    id: 'self-deep-breaths',
    category: 'self-regulation',
    title: 'Deep Breaths',
    tip: 'Take 3 slow, deep breaths before starting. Breathe in for 4 counts, out for 4 counts.',
    icon: '🌬️',
  },
  {
    id: 'self-body-check',
    category: 'self-regulation',
    title: 'Body Check',
    tip: 'Check how your body feels. Are you hungry? Tired? Take care of that first if needed.',
    icon: '🧘',
  },
  {
    id: 'self-positive-talk',
    category: 'self-regulation',
    title: 'Positive Self-Talk',
    tip: 'Say to yourself: "I can do this!" or "One step at a time." You\'re stronger than you think!',
    icon: '💪',
  },
  {
    id: 'self-movement-break',
    category: 'self-regulation',
    title: 'Movement Break',
    tip: 'Do 10 jumping jacks or stretch before starting. Moving your body helps your brain focus!',
    icon: '🏃',
  },
  {
    id: 'self-reward-plan',
    category: 'self-regulation',
    title: 'Plan Your Reward',
    tip: 'Think about what you\'ll do after finishing. Having something to look forward to helps!',
    icon: '🎁',
  },
  {
    id: 'self-fidget-tool',
    category: 'self-regulation',
    title: 'Fidget Tool',
    tip: 'Use a fidget toy or squeeze ball while working. It can help your brain focus better!',
    icon: '🔮',
  },
];

export function getStrategyById(id: string): Strategy | undefined {
  return STRATEGIES.find(s => s.id === id);
}

export function getStrategiesByCategory(category: StrategyCategory): Strategy[] {
  return STRATEGIES.filter(s => s.category === category);
}
