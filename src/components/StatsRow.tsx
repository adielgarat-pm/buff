import { Task } from '@/types/task';
import { Pill, Droplets, Apple, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsRowProps {
  tasks: Task[];
}

const categoryConfig = {
  medication: { icon: Pill, label: 'Meds', colorClass: 'text-medication', bgClass: 'bg-medication/20' },
  hygiene: { icon: Droplets, label: 'Hygiene', colorClass: 'text-hygiene', bgClass: 'bg-hygiene/20' },
  nutrition: { icon: Apple, label: 'Nutrition', colorClass: 'text-nutrition', bgClass: 'bg-nutrition/20' },
  school: { icon: BookOpen, label: 'School', colorClass: 'text-school', bgClass: 'bg-school/20' },
};

export function StatsRow({ tasks }: StatsRowProps) {
  const categories = Object.entries(categoryConfig).map(([key, config]) => {
    const categoryTasks = tasks.filter(t => t.category === key);
    const completed = categoryTasks.filter(t => t.completed).length;
    const total = categoryTasks.length;
    const Icon = config.icon;

    return {
      key,
      ...config,
      Icon,
      completed,
      total,
      percent: total > 0 ? (completed / total) * 100 : 0,
    };
  });

  return (
    <div className="grid grid-cols-4 gap-3">
      {categories.map((cat) => (
        <div
          key={cat.key}
          className={cn(
            'relative p-3 rounded-xl border border-border overflow-hidden',
            'bg-gradient-card transition-all',
            cat.completed === cat.total && cat.total > 0 && 'border-success/30'
          )}
        >
          {/* Progress fill */}
          <div
            className={cn('absolute inset-0 opacity-20', cat.bgClass)}
            style={{ clipPath: `inset(${100 - cat.percent}% 0 0 0)` }}
          />
          
          <div className="relative flex flex-col items-center text-center">
            <div className={cn('p-2 rounded-lg mb-2', cat.bgClass)}>
              <cat.Icon className={cn('w-4 h-4', cat.colorClass)} />
            </div>
            <span className="text-xs text-muted-foreground">{cat.label}</span>
            <span className={cn(
              'text-sm font-bold',
              cat.completed === cat.total && cat.total > 0 ? 'text-success' : 'text-foreground'
            )}>
              {cat.completed}/{cat.total}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
