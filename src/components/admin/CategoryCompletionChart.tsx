import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface CategoryCompletion {
  category: string;
  completions: number;
  potential: number;
}

interface CategoryCompletionChartProps {
  categoryCompletions: CategoryCompletion[] | undefined;
  loading?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  'learning': '📚 Learning',
  'organization': '📋 Organization',
  'self-care': '💆 Self-Care',
  'responsibility': '🏠 Responsibility',
  'movement': '🏃 Movement',
};

const CATEGORY_COLORS: Record<string, string> = {
  'learning': '#6366f1',
  'organization': '#f59e0b',
  'self-care': '#22c55e',
  'responsibility': '#ec4899',
  'movement': '#14b8a6',
};

export function CategoryCompletionChart({ categoryCompletions, loading }: CategoryCompletionChartProps) {
  const [viewMode, setViewMode] = useState<'bar' | 'pie'>('bar');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Task Completion by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] bg-muted/50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (categoryCompletions || []).map((cat) => ({
    ...cat,
    label: CATEGORY_LABELS[cat.category] || cat.category,
    color: CATEGORY_COLORS[cat.category] || '#94a3b8',
    rate: cat.potential > 0 ? Math.round((cat.completions / cat.potential) * 100) : 0,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Task Completion by Category (7 days)</CardTitle>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('bar')}
              className="h-7 w-7 p-0"
            >
              <BarChart2 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('pie')}
              className="h-7 w-7 p-0"
            >
              <PieChartIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No category data available
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'bar' ? (
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'completions' ? 'Completed' : 'Potential',
                    ]}
                  />
                  <Bar dataKey="completions" name="completions" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="completions"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ label, rate }) => `${label.split(' ')[0]} ${rate}%`}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
