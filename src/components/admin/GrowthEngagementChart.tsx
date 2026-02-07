import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DailyTrend {
  date: string;
  new_signups: number;
  active_families: number;
}

interface GrowthEngagementChartProps {
  dailyTrends: DailyTrend[] | undefined;
  loading?: boolean;
}

const CHART_COLORS = {
  signups: '#6366f1',
  active: '#22c55e',
};

export function GrowthEngagementChart({ dailyTrends, loading }: GrowthEngagementChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Growth vs. Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted/50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (dailyTrends || [])
    .map((trend) => ({
      ...trend,
      date_label: format(new Date(trend.date), 'dd/MM'),
    }))
    .reverse(); // Oldest first for chart

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Growth vs. Engagement (Daily)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available for selected date range
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date_label"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="new_signups"
                  stroke={CHART_COLORS.signups}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.signups, r: 3 }}
                  name="New Signups"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="active_families"
                  stroke={CHART_COLORS.active}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.active, r: 3 }}
                  name="Active Families"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
