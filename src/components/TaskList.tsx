import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
}

export function TaskList({ tasks, onComplete, onUncomplete }: TaskListProps) {
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-6">
      {/* Pending Tasks */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">Up Next</h2>
          <span className="ml-auto text-sm text-muted-foreground">
            {pendingTasks.length} remaining
          </span>
        </div>
        
        {pendingTasks.length > 0 ? (
          <div className="space-y-3">
            {pendingTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={onComplete}
                onUncomplete={onUncomplete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-success/20 mb-4 animate-pulse-glow">
              <Sparkles className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-bold text-foreground mb-2">All Done! 🎉</h3>
            <p className="text-muted-foreground text-sm">
              You've completed all your tasks for today!
            </p>
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h2 className="font-bold text-foreground">Completed</h2>
            <span className="ml-auto text-sm text-success">
              {completedTasks.length} done
            </span>
          </div>
          
          <div className="space-y-3">
            {completedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={onComplete}
                onUncomplete={onUncomplete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
