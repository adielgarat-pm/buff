import { useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';

interface DailyEssentialsProps {
  // No props needed - static items, no points
}

// Static essential items that should always be checked before leaving
const DAILY_ESSENTIALS = [
  { id: 'water_bottle', label: 'בקבוק מים', icon: '💧' },
  { id: 'food_sandwich', label: 'אוכל/כריך', icon: '🥪' },
  { id: 'phone', label: 'טלפון', icon: '📱' },
  { id: 'keys', label: 'מפתחות', icon: '🔑' },
];

/**
 * Daily Essentials - Static morning checklist (NO POINTS)
 * Goal: Operational checklist to ensure the child leaves the house ready
 * Displayed as the final stage of the morning routine
 */
export function DailyEssentials({}: DailyEssentialsProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const handleCheckItem = (itemId: string, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: checked }));
  };

  const allChecked = DAILY_ESSENTIALS.every(item => checkedItems[item.id]);

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h3 className="font-bold text-foreground text-sm">לפני שיוצאים</h3>
        </div>
        <div className="px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
          ללא נקודות
        </div>
      </div>

      {/* Essentials Grid */}
      <div className="grid grid-cols-2 gap-2">
        {DAILY_ESSENTIALS.map((essential) => (
          <label
            key={essential.id}
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
              checkedItems[essential.id]
                ? "bg-primary/10 border-primary/30"
                : "bg-background border-border hover:border-primary/30"
            )}
          >
            <Checkbox
              checked={checkedItems[essential.id] || false}
              onCheckedChange={(checked) => handleCheckItem(essential.id, !!checked)}
              className="h-4 w-4"
            />
            <span className="text-lg">{essential.icon}</span>
            <span className={cn(
              "text-xs transition-all",
              checkedItems[essential.id] ? "text-muted-foreground line-through" : "text-foreground"
            )}>
              {essential.label}
            </span>
          </label>
        ))}
      </div>

      {/* Status */}
      {allChecked && (
        <div className="text-center py-2 bg-primary/10 rounded-lg">
          <p className="text-sm font-bold text-primary">מוכנים לצאת! 🚀</p>
        </div>
      )}
    </div>
  );
}
