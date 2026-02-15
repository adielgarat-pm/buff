import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const AVATAR_OPTIONS = [
  '🦸', '🦹', '🧙', '🧚', '👑', '🎭', '🥷', '🦾',
  '🚀', '🌙', '🪐', '👾', '🤖', '🔬', '🛸', '⭐',
  '🦄', '🐉', '🦊', '🐱', '🐶', '🦁', '🐼', '🦋', '🐬', '🦉', '🐧', '🦈',
];

interface ChildAvatarPickerProps {
  currentAvatar: string;
  onChangeAvatar: (newAvatar: string) => Promise<void>;
  userName?: string;
}

export function ChildAvatarPicker({ currentAvatar, onChangeAvatar, userName }: ChildAvatarPickerProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelect = async (avatar: string) => {
    if (avatar === currentAvatar) { setIsOpen(false); return; }
    setIsUpdating(true);
    try {
      await onChangeAvatar(avatar);
      toast.success(t('avatar.updated'));
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error(t('avatar.updateError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const displayAvatar = currentAvatar || (userName ? userName.charAt(0) : null);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            "relative overflow-hidden",
            "bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm",
            "ring-2 ring-primary/50 hover:ring-primary",
            "shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]",
            "transition-all duration-300 ease-out",
            "hover:scale-105 active:scale-95",
            "touch-target cursor-pointer"
          )}
          disabled={isUpdating}
          aria-label={t('avatar.changeLabel')}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-accent to-primary opacity-30" />
          <div className={cn("absolute inset-[2px] rounded-full", "bg-gradient-to-br from-card via-card/95 to-card/90", "flex items-center justify-center")}>
            {isUpdating ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : displayAvatar ? (
              <span className="text-2xl leading-none">{displayAvatar}</span>
            ) : (
              <User className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4 bg-card/95 backdrop-blur-md border-primary/20 shadow-xl shadow-primary/10" align="start" side="bottom" sideOffset={8}>
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-foreground">{t('avatar.pickNew')}</h3>
            <p className="text-xs text-muted-foreground">{t('avatar.pickHint')}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t('avatar.heroes')}</p>
            <div className="grid grid-cols-8 gap-1.5">
              {AVATAR_OPTIONS.slice(0, 8).map((avatar) => (
                <AvatarOption key={avatar} avatar={avatar} isSelected={avatar === currentAvatar} isUpdating={isUpdating} onSelect={handleSelect} />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t('avatar.scienceSpace')}</p>
            <div className="grid grid-cols-8 gap-1.5">
              {AVATAR_OPTIONS.slice(8, 16).map((avatar) => (
                <AvatarOption key={avatar} avatar={avatar} isSelected={avatar === currentAvatar} isUpdating={isUpdating} onSelect={handleSelect} />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t('avatar.animals')}</p>
            <div className="grid grid-cols-8 gap-1.5">
              {AVATAR_OPTIONS.slice(16).map((avatar) => (
                <AvatarOption key={avatar} avatar={avatar} isSelected={avatar === currentAvatar} isUpdating={isUpdating} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AvatarOption({ avatar, isSelected, isUpdating, onSelect }: { avatar: string; isSelected: boolean; isUpdating: boolean; onSelect: (avatar: string) => void; }) {
  return (
    <button
      onClick={() => onSelect(avatar)}
      disabled={isUpdating}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-lg text-lg",
        "transition-all duration-150",
        "hover:scale-110 active:scale-95",
        isSelected
          ? "bg-gradient-to-br from-primary/40 to-accent/40 ring-2 ring-primary shadow-md shadow-primary/20"
          : "bg-secondary/50 hover:bg-primary/20 hover:shadow-sm"
      )}
    >
      {avatar}
    </button>
  );
}
