import { X, Trophy, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeeklySummaryData, CATEGORY_LABELS, TaskCategory } from '@/types/task';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface WeeklySummaryProps {
  data: WeeklySummaryData;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  medication: 'hsl(var(--chart-1))',
  hygiene: 'hsl(var(--chart-2))',
  nutrition: 'hsl(var(--chart-3))',
  school: 'hsl(var(--chart-4))',
};

const CATEGORY_ICONS: Record<TaskCategory, string> = {
  medication: '💊',
  hygiene: '🚿',
  nutrition: '🍎',
  school: '📚',
};

export function WeeklySummary({ data, onClose }: WeeklySummaryProps) {
  const formatDateRange = () => {
    const start = new Date(data.weekStartDate);
    const end = new Date(data.weekEndDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const categoryData = Object.entries(data.tasksByCategory)
    .map(([category, count]) => ({
      category: category as TaskCategory,
      name: CATEGORY_LABELS[category as TaskCategory],
      count,
      fill: CATEGORY_COLORS[category as TaskCategory],
      icon: CATEGORY_ICONS[category as TaskCategory],
    }))
    .filter(item => item.count > 0);

  const totalTasks = Object.values(data.tasksByCategory).reduce((sum, count) => sum + count, 0);

  const chartConfig = {
    credits: {
      label: 'Credits',
      color: 'hsl(var(--primary))',
    },
    ...Object.fromEntries(
      Object.entries(CATEGORY_LABELS).map(([key, label]) => [
        key,
        { label, color: CATEGORY_COLORS[key as TaskCategory] },
      ])
    ),
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto">
      <div className="min-h-screen p-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Weekly Summary</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDateRange()}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Credits</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{data.totalCreditsEarned.toLocaleString()}</p>
          </div>

          <div className="p-5 rounded-2xl bg-accent/50 border border-accent">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-accent-foreground" />
              <span className="text-sm text-muted-foreground">Tasks Done</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalTasks}</p>
          </div>
        </div>

        {/* Daily Credits Chart */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Daily Progress
          </h2>
          <div className="p-4 rounded-2xl bg-card border border-border">
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <BarChart data={data.dailyCredits} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="day" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="credits" 
                  radius={[8, 8, 0, 0]}
                  fill="hsl(var(--primary))"
                />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* Tasks by Category */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Tasks by Category</h2>
          {categoryData.length > 0 ? (
            <div className="space-y-3">
              {categoryData.map(item => {
                const percentage = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;
                return (
                  <div
                    key={item.category}
                    className="p-4 rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground">{item.count}</span>
                        <span className="text-sm text-muted-foreground ml-1">tasks</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: item.fill 
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{percentage}% of total</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-card border border-border text-center">
              <p className="text-muted-foreground">No tasks completed this week</p>
            </div>
          )}
        </div>

        {/* Redeemed Rewards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Rewards Redeemed
          </h2>
          {data.redeemedRewards.length > 0 ? (
            <div className="space-y-3">
              {data.redeemedRewards.map(reward => (
                <div
                  key={reward.id}
                  className="p-4 rounded-xl bg-accent/30 border border-accent flex items-center gap-4"
                >
                  <span className="text-3xl">{reward.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{reward.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {reward.price.toLocaleString()} credits
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    Claimed!
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-card border border-border text-center">
              <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No rewards redeemed this week</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Keep earning credits!</p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <Button 
          onClick={onClose} 
          className="w-full py-6 text-lg font-semibold rounded-2xl"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
