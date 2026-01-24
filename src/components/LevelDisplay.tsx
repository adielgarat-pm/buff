import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface LevelDisplayProps {
  totalXP: number;
  className?: string;
}

// Level thresholds and names
const LEVELS = [
  { threshold: 0, name: 'Rookie', nameHe: 'טירון', icon: '🌱' },
  { threshold: 500, name: 'Explorer', nameHe: 'חוקר', icon: '🔍' },
  { threshold: 1500, name: 'Achiever', nameHe: 'משיג', icon: '⭐' },
  { threshold: 3000, name: 'Strategist', nameHe: 'אסטרטג', icon: '🧠' },
  { threshold: 5000, name: 'Champion', nameHe: 'אלוף', icon: '🏆' },
  { threshold: 8000, name: 'Master', nameHe: 'מאסטר', icon: '👑' },
  { threshold: 12000, name: 'Legend', nameHe: 'אגדה', icon: '🌟' },
];

export function getLevelInfo(totalXP: number) {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];
  
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].threshold) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || LEVELS[i];
      break;
    }
  }
  
  const levelIndex = LEVELS.indexOf(currentLevel) + 1;
  const progressToNext = nextLevel !== currentLevel 
    ? ((totalXP - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100
    : 100;
  const xpToNext = nextLevel !== currentLevel ? nextLevel.threshold - totalXP : 0;
  
  return { currentLevel, nextLevel, levelIndex, progressToNext, xpToNext };
}

export function LevelDisplay({ totalXP, className }: LevelDisplayProps) {
  const { language, t } = useLanguage();
  const { currentLevel, nextLevel, levelIndex, progressToNext, xpToNext } = getLevelInfo(totalXP);
  
  const levelName = language === 'he' ? currentLevel.nameHe : currentLevel.name;
  const isMaxLevel = currentLevel === nextLevel;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Level Badge */}
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
          <span className="text-2xl">{currentLevel.icon}</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-buff text-buff-foreground flex items-center justify-center text-xs font-bold border-2 border-background">
          {levelIndex}
        </div>
      </div>
      
      {/* Level Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('progress.level')} {levelIndex}
          </span>
          <span className="text-foreground font-bold">{levelName}</span>
        </div>
        
        {/* Mini progress to next level */}
        {!isMaxLevel && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-buff rounded-full transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {xpToNext} {t('common.xp')}
            </span>
          </div>
        )}
        
        {isMaxLevel && (
          <div className="flex items-center gap-1 text-buff text-xs">
            <Trophy className="w-3 h-3" />
            <span>{t('progress.maxLevel')}</span>
          </div>
        )}
      </div>
    </div>
  );
}