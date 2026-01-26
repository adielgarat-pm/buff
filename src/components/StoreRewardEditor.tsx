import { useEffect, useState } from 'react';
import { StoreReward } from '@/types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Trash2, Plus, Save, Gift, Gamepad2, Headphones, Pizza, Ticket, ShoppingBag, Star, Trophy } from 'lucide-react';

interface StoreRewardEditorProps {
  open: boolean;
  onClose: () => void;
  rewards: StoreReward[];
  onSave: (rewards: StoreReward[]) => void;
  dailyGoal?: number;
}

// Days of Success tiers for smart price suggestions
const REWARD_TIERS = [
  { days: 1, label: 'יום 1', description: 'תוספת זמן מסך / קינוח' },
  { days: 2, label: 'יומיים', description: 'פטור ממטלה' },
  { days: 4, label: '4 ימים', description: 'ערב סרט' },
  { days: 5, label: '5 ימים', description: 'פיצה / סושי' },
  { days: 10, label: '10 ימים', description: 'יום כיף' },
];

const ICON_OPTIONS = [
  { icon: '🎮', label: 'Gaming' },
  { icon: '🎧', label: 'Headphones' },
  { icon: '🍕', label: 'Food' },
  { icon: '🎟️', label: 'Tickets' },
  { icon: '🛍️', label: 'Shopping' },
  { icon: '⭐', label: 'Star' },
  { icon: '🏆', label: 'Trophy' },
  { icon: '🎁', label: 'Gift' },
  { icon: '📱', label: 'Phone' },
  { icon: '👟', label: 'Shoes' },
  { icon: '🎬', label: 'Movie' },
  { icon: '🎪', label: 'Event' },
];

export function StoreRewardEditor({ open, onClose, rewards, onSave, dailyGoal = 100 }: StoreRewardEditorProps) {
  const [localRewards, setLocalRewards] = useState<StoreReward[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Calculate smart goal (70% of daily goal)
  const smartGoal = Math.round((dailyGoal * 70) / 100);
  
  const [newReward, setNewReward] = useState({
    title: '',
    icon: '🎁',
    price: smartGoal, // Default to 1 day of success
  });

  // Reset initialization flag when dialog closes
  useEffect(() => {
    if (!open) {
      setHasInitialized(false);
    }
  }, [open]);

  // Sync rewards when dialog opens OR when rewards arrive while dialog is open
  useEffect(() => {
    if (!open) return;
    
    // Only sync if we haven't initialized yet, or if this is fresh data from DB
    if (!hasInitialized || (rewards.length > 0 && localRewards.length === 0)) {
      setLocalRewards(rewards);
      setShowAddForm(false);
      setNewReward({ title: '', icon: '🎁', price: 500 });
      if (rewards.length > 0 || hasInitialized === false) {
        setHasInitialized(true);
      }
    }
  }, [open, rewards, hasInitialized, localRewards.length]);

  const handleAddReward = () => {
    if (newReward.title.trim()) {
      const reward: StoreReward = {
        id: crypto.randomUUID(), // Generate valid UUID for Supabase
        title: newReward.title,
        icon: newReward.icon,
        price: newReward.price,
        claimed: false,
      };
      setLocalRewards([...localRewards, reward]);
      setNewReward({ title: '', icon: '🎁', price: 500 });
      setShowAddForm(false);
    }
  };

  const handleDeleteReward = (id: string) => {
    setLocalRewards(localRewards.filter(r => r.id !== id));
  };

  const handleUpdateReward = (id: string, updates: Partial<StoreReward>) => {
    setLocalRewards(localRewards.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ));
  };

  const handleSave = () => {
    onSave(localRewards);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden bg-card border-border">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            ניהול פרסים
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            הוסף פרסים גדולים שניתן לממש עם קרדיטים שנצברו.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="space-y-4">
            {/* Add Button */}
            {!showAddForm && (
              <Button
                variant="outline"
                onClick={() => setShowAddForm(true)}
                className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 ml-2" />
                הוסף פרס חדש
              </Button>
            )}

            {/* Add Form */}
            {showAddForm && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-3">
                <Input
                  placeholder="שם הפרס (לדוגמה: ערב סרט)"
                  value={newReward.title}
                  onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                  className="bg-background border-border text-foreground"
                  dir="rtl"
                />
                
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">אייקון</Label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map((opt) => (
                      <button
                        key={opt.icon}
                        onClick={() => setNewReward({ ...newReward, icon: opt.icon })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                          newReward.icon === opt.icon
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {opt.icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">מחיר (קרדיטים)</Label>
                  <Input
                    type="number"
                    value={newReward.price}
                    onChange={(e) => setNewReward({ ...newReward, price: parseInt(e.target.value) || 0 })}
                    className="bg-background border-border text-foreground"
                    dir="ltr"
                  />
                  {/* Smart Price Suggestions */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {REWARD_TIERS.map((tier) => {
                      const suggestedPrice = smartGoal * tier.days;
                      return (
                        <button
                          key={tier.days}
                          onClick={() => setNewReward({ ...newReward, price: suggestedPrice })}
                          className={`px-2 py-1 text-xs rounded-md transition-all ${
                            newReward.price === suggestedPrice
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                          }`}
                        >
                          {tier.label}: {suggestedPrice}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 המלצות מבוססות על 70% מהיעד היומי ({smartGoal} נקודות)
                  </p>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                    ביטול
                  </Button>
                  <Button size="sm" onClick={handleAddReward} className="bg-primary text-primary-foreground">
                    הוסף פרס
                  </Button>
                </div>
              </div>
            )}

            {/* Existing Rewards */}
            {localRewards.map((reward) => (
              <div
                key={reward.id}
                className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{reward.icon}</span>
                  <div className="flex-1">
                    <Input
                      value={reward.title}
                      onChange={(e) => handleUpdateReward(reward.id, { title: e.target.value })}
                      className="bg-background border-border text-foreground font-medium"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteReward(reward.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">אייקון</Label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map((opt) => (
                      <button
                        key={opt.icon}
                        onClick={() => handleUpdateReward(reward.id, { icon: opt.icon })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                          reward.icon === opt.icon
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {opt.icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">מחיר</Label>
                    <Input
                      type="number"
                      value={reward.price}
                      onChange={(e) => handleUpdateReward(reward.id, { price: parseInt(e.target.value) || 0 })}
                      className="bg-background border-border text-foreground"
                      dir="ltr"
                    />
                    {/* Quick price suggestions for existing rewards */}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {REWARD_TIERS.map((tier) => {
                        const suggestedPrice = smartGoal * tier.days;
                        return (
                          <button
                            key={tier.days}
                            onClick={() => handleUpdateReward(reward.id, { price: suggestedPrice })}
                            className={`px-1.5 py-0.5 text-xs rounded transition-all ${
                              reward.price === suggestedPrice
                                ? 'bg-primary/20 text-primary'
                                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                            }`}
                          >
                            {tier.days}d
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {reward.claimed && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      נוצל
                    </span>
                  )}
                </div>
              </div>
            ))}

            {localRewards.length === 0 && !showAddForm && (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>עדיין אין פרסים. הוסף פרסים גדולים!</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end pt-4 border-t border-border">
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">
            <Save className="w-4 h-4 ml-2" />
            שמור שינויים
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
