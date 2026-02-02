import { cn } from '@/lib/utils';

interface DayScheduleTogglesProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
  className?: string;
}

const DAYS = [
  { index: 0, label: 'א׳', labelEn: 'Su' },
  { index: 1, label: 'ב׳', labelEn: 'Mo' },
  { index: 2, label: 'ג׳', labelEn: 'Tu' },
  { index: 3, label: 'ד׳', labelEn: 'We' },
  { index: 4, label: 'ה׳', labelEn: 'Th' },
  { index: 5, label: 'ו׳', labelEn: 'Fr' },
  { index: 6, label: 'ש׳', labelEn: 'Sa' },
];

export function DayScheduleToggles({ selectedDays, onChange, className }: DayScheduleTogglesProps) {
  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      // Don't allow deselecting all days
      if (selectedDays.length > 1) {
        onChange(selectedDays.filter(d => d !== dayIndex));
      }
    } else {
      onChange([...selectedDays, dayIndex].sort((a, b) => a - b));
    }
  };

  return (
    <div className={cn("flex gap-1 justify-between", className)}>
      {DAYS.map((day) => {
        const isSelected = selectedDays.includes(day.index);
        return (
          <button
            key={day.index}
            type="button"
            onClick={() => toggleDay(day.index)}
            className={cn(
              "w-9 h-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center",
              "border focus:outline-none focus:ring-2 focus:ring-primary/50",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50 hover:bg-secondary"
            )}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}
