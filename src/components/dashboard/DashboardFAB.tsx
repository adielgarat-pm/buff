import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardFABProps {
  hasChildren: boolean;
  onAddChild: () => void;
  onAddTask: () => void;
}

export function DashboardFAB({ hasChildren, onAddChild, onAddTask }: DashboardFABProps) {
  const handleClick = () => {
    if (hasChildren) {
      onAddTask();
    } else {
      onAddChild();
    }
  };

  const label = hasChildren ? 'הוספת משימה' : 'הוספת ילד';

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className={cn(
        "fixed bottom-24 left-5 z-40",
        "w-14 h-14 rounded-full shadow-lg",
        "bg-gradient-to-br from-primary to-accent text-primary-foreground",
        "hover:scale-105 active:scale-95 transition-transform",
        "flex items-center justify-center"
      )}
      aria-label={label}
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}
