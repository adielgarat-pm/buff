import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Filter, FlaskConical } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRangePreset } from '@/hooks/useAdminAnalyticsV2';

interface DateRangeFilterProps {
  dateRange: DateRangePreset;
  setDateRange: (range: DateRangePreset) => void;
  customStartDate: Date | null;
  setCustomStartDate: (date: Date | null) => void;
  customEndDate: Date | null;
  setCustomEndDate: (date: Date | null) => void;
  excludeTestAccounts: boolean;
  setExcludeTestAccounts: (exclude: boolean) => void;
  onRefresh: () => void;
}

export function DateRangeFilter({
  dateRange,
  setDateRange,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  excludeTestAccounts,
  setExcludeTestAccounts,
  onRefresh,
}: DateRangeFilterProps) {
  const presets: { value: DateRangePreset; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range Presets */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Cohort Filter:</span>
            <div className="flex gap-1">
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={dateRange === preset.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Range Pickers */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : 'Start'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate || undefined}
                    onSelect={(date) => setCustomStartDate(date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : 'End'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate || undefined}
                    onSelect={(date) => setCustomEndDate(date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button size="sm" onClick={onRefresh}>
                Apply
              </Button>
            </div>
          )}

          {/* Exclude Test Accounts Toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <FlaskConical className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="exclude-test" className="text-sm cursor-pointer">
              Exclude Test Accounts
            </Label>
            <Switch
              id="exclude-test"
              checked={excludeTestAccounts}
              onCheckedChange={setExcludeTestAccounts}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
