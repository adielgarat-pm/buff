import { Task, TaskCategory } from '@/types/task';
import { Book, CalendarCheck, Sparkles, Home, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsRowProps {
  tasks: Task[];
}

const categoryConfig: Record<TaskCategory, { icon: typeof Book; label: string; labelHe: string; colorClass: string; bgClass: string }> = {
  learning: { icon: Book, label: 'Learning', labelHe: 'למידה', colorClass: 'text-learning', bgClass: 'bg-learning/20' },
  organization: { icon: CalendarCheck, label: 'Organize', labelHe: 'התארגנות', colorClass: 'text-organization', bgClass: 'bg-organization/20' },
  'self-care': { icon: Sparkles, label: 'Self-Care', labelHe: 'טיפול עצמי', colorClass: 'text-self-care', bgClass: 'bg-self-care/20' },
  responsibility: { icon: Home, label: 'Home', labelHe: 'בית', colorClass: 'text-responsibility', bgClass: 'bg-responsibility/20' },
  movement: { icon: Zap, label: 'Move', labelHe: 'תנועה', colorClass: 'text-movement', bgClass: 'bg-movement/20' },
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
    <div className="grid grid-cols-5 gap-2">
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
