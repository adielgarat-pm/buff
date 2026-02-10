import { useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface DailyEssentialsProps {}

export function DailyEssentials({}: DailyEssentialsProps) {
  const { t } = useLanguage();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const DAILY_ESSENTIALS = [
    { id: 'water_bottle', label: t('essentials.waterBottle'), icon: '💧' },
    { id: 'food_sandwich', label: t('essentials.food'), icon: '🥪' },
    { id: 'phone', label: t('essentials.phone'), icon: '📱' },
    { id: 'keys', label: t('essentials.keys'), icon: '🔑' },
  ];

  const handleCheckItem = (itemId: string, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: checked }));
  };

  const allChecked = DAILY_ESSENTIALS.every(item => checkedItems[item.id]);

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h3 className="font-bold text-foreground text-sm">{t('essentials.title')}</h3>
        </div>
        <div className="px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
          {t('essentials.noPoints')}
        </div>
      </div>

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

      {allChecked && (
        <div className="text-center py-2 bg-primary/10 rounded-lg">
          <p className="text-sm font-bold text-primary">{t('essentials.allReady')}</p>
        </div>
      )}
    </div>
  );
}
