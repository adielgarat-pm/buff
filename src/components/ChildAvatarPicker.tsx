import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AVATAR_OPTIONS = [
  // גיבורים
  '🦸', '🦹', '🧙', '🧚', '👑', '🎭', '🥷', '🦾',
  // מדע וחלל
  '🚀', '🌙', '🪐', '👾', '🤖', '🔬', '🛸', '⭐',
  // חיות
  '🦄', '🐉', '🦊', '🐱', '🐶', '🦁', '🐼', '🦋', '🐬', '🦉', '🐧', '🦈',
];

interface ChildAvatarPickerProps {
  currentAvatar: string;
  onChangeAvatar: (newAvatar: string) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
}

export function ChildAvatarPicker({ 
  currentAvatar, 
  onChangeAvatar,
  size = 'md' 
}: ChildAvatarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelect = async (avatar: string) => {
    if (avatar === currentAvatar) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onChangeAvatar(avatar);
      toast.success('האווטאר שלך עודכן! 🎉');
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('לא הצלחנו לעדכן את האווטאר');
    } finally {
      setIsUpdating(false);
    }
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-14 h-14 text-3xl',
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "rounded-full bg-primary/20 flex items-center justify-center",
            "hover:bg-primary/30 hover:scale-105 transition-all duration-200",
            "ring-2 ring-primary/30 hover:ring-primary/50",
            "focus:outline-none focus:ring-primary",
            sizeClasses[size]
          )}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            currentAvatar
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-3 bg-card border-border" 
        align="start"
        side="bottom"
      >
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground text-center">
            בחר אווטאר חדש ✨
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar}
                onClick={() => handleSelect(avatar)}
                disabled={isUpdating}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg text-lg",
                  "transition-all duration-150 hover:scale-110",
                  avatar === currentAvatar
                    ? "bg-primary/30 ring-2 ring-primary"
                    : "bg-secondary/50 hover:bg-primary/20"
                )}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
