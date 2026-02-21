import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { X, Leaf, Gamepad2, Lock, Crown, Check, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useChildPet } from '@/hooks/useChildPet';
import { ChildPreferences, ChildTheme, AgeMode } from '@/hooks/useChildPreferences';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { isMuted, setMuted } from '@/utils/soundEffects';
import { playPetTapBlip, playPetConfirmSound, playLockedSound } from '@/utils/petSounds';
import { PET_SKINS, type PetSkinDef } from './PetDisplay';
import { supabase } from '@/integrations/supabase/client';

interface ChildCommandCenterProps {
  open: boolean;
  onClose: () => void;
  preferences: ChildPreferences;
  onSave: (prefs: ChildPreferences) => Promise<void>;
  childId?: string;
}

type SkinTier = 'FREE' | 'PRO' | 'LIFE';

interface SkinOption {
  id: ChildTheme;
  icon: typeof Leaf;
  tier: SkinTier;
}

// Pet skin options derived from shared PET_SKINS
const PET_SKIN_OPTIONS = Object.entries(PET_SKINS).map(([id, def]) => ({ id, ...def }));

const SKINS: SkinOption[] = [
  { id: 'mint', icon: Leaf, tier: 'FREE' },
  { id: 'gamer', icon: Gamepad2, tier: 'FREE' },
];

export function ChildCommandCenter({ open, onClose, preferences, onSave, childId }: ChildCommandCenterProps) {
  const { t, language } = useLanguage();
  const { isProUser } = useSubscription();
  const { petState, changeSkin } = useChildPet(childId);
  const isRTL = language === 'he';

  const [age, setAge] = useState<number | null>(preferences.age_mode === 'teen' ? 13 : 10);
  const [ageMode, setAgeMode] = useState<AgeMode>(preferences.age_mode);
  const [theme, setTheme] = useState<ChildTheme>(preferences.theme);
  const [petEnabled, setPetEnabled] = useState(preferences.pet_enabled);
  const [soundEnabled, setSoundEnabled] = useState(!isMuted());
  const [saving, setSaving] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState(petState.current_skin || 'puppy');
  const [questsCompleted, setQuestsCompleted] = useState(0);
  const isTeen = ageMode === 'teen';

  const handleAgeSelect = useCallback((a: number) => {
    setAge(a);
    if (a >= 12) {
      setAgeMode('teen');
      setPetEnabled(false);
      setTheme('gamer');
    } else {
      setAgeMode('kid');
      setTheme('mint');
    }
  }, []);

  // Sync selectedSkin once petState loads
  useEffect(() => {
    if (petState.current_skin) setSelectedSkin(petState.current_skin);
  }, [petState.current_skin]);

  // Fetch total quests completed for this child
  useEffect(() => {
    if (!childId) return;
    const fetchQuests = async () => {
      const { count } = await supabase
        .from('daily_progress')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', childId)
        .eq('completed', true);
      setQuestsCompleted(count ?? 0);
    };
    fetchQuests();
  }, [childId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    // Save skin to pet_state
    if (selectedSkin !== petState.current_skin) {
      await changeSkin(selectedSkin);
    }
    // Play pet-specific confirmation sound
    playPetConfirmSound(selectedSkin);
    await onSave({
      theme,
      pet_enabled: petEnabled,
      age_mode: ageMode,
      child_onboarding_completed: true,
    });
    // Mark that user explicitly chose a pet
    if (childId) {
      localStorage.setItem(`buff-pet-choice-confirmed-${childId}`, 'true');
    }
    setSaving(false);
    onClose();
  }, [theme, petEnabled, ageMode, onSave, onClose, selectedSkin, petState.current_skin, changeSkin, childId]);

  // During beta all skins are accessible
  const isBeta = true;

  const canAccessSkin = (tier: SkinTier) => {
    if (isBeta) return true;
    if (tier === 'FREE') return true;
    if (tier === 'PRO' && isProUser) return true;
    return false;
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/98 backdrop-blur-sm overflow-y-auto"
      >
        <div className="max-w-md mx-auto p-4 pb-24 safe-area-px">
          {/* Header */}
          <div className="flex items-center justify-between py-4">
            <h1 className="text-xl font-bold text-foreground">
              {t('commandCenter.title')}
            </h1>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Section 1: Age / Mode */}
            <section className="bg-card rounded-2xl border border-border p-4 space-y-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <span className="text-lg">👤</span>
                {t('commandCenter.ageTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('commandCenter.ageDesc')}
              </p>

              <div className="grid grid-cols-6 gap-2">
                {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((a) => (
                  <button
                    key={a}
                    onClick={() => handleAgeSelect(a)}
                    className={`relative py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                      age === a
                        ? 'bg-primary text-primary-foreground scale-110 shadow-lg ring-2 ring-primary/30 ring-offset-2 ring-offset-card'
                        : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent hover:border-border'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {/* Mode indicator */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <span className="text-2xl">{isTeen ? '⚡' : '🥚'}</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {isTeen ? t('commandCenter.proMode') : t('commandCenter.hatchingMode')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isTeen ? t('commandCenter.proModeDesc') : t('commandCenter.hatchingModeDesc')}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Skins Gallery */}
            <section className="bg-card rounded-2xl border border-border p-4 space-y-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <span className="text-lg">🎨</span>
                {t('commandCenter.skinsTitle')}
              </h2>

              <LayoutGroup>
                <div className="space-y-3">
                  {SKINS.map((skin) => {
                    const isSelected = theme === skin.id;
                    const accessible = canAccessSkin(skin.tier);
                    const Icon = skin.icon;

                    return (
                      <motion.button
                        key={skin.id}
                        layout
                        onClick={() => accessible && setTheme(skin.id)}
                        disabled={!accessible}
                        className={`relative w-full p-4 rounded-2xl transition-all duration-200 active:scale-[0.98] text-start ${
                          isSelected
                            ? 'border-2 border-primary bg-primary/10 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.4)]'
                            : accessible
                              ? 'border border-border/60 bg-card hover:border-primary/40 hover:shadow-sm'
                              : 'border border-border/30 bg-muted/20 opacity-50'
                        }`}
                      >
                        {/* Checkmark badge */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 end-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md"
                          >
                            <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                          </motion.div>
                        )}

                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            skin.id === 'gamer'
                              ? 'bg-gradient-to-br from-accent/40 to-accent/20'
                              : 'bg-gradient-to-br from-primary/30 to-primary/10'
                          }`}>
                            <Icon className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-foreground">
                                {t(`commandCenter.skin.${skin.id}`)}
                              </h3>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                isSelected
                                  ? 'bg-primary/20 text-primary'
                                  : skin.tier === 'FREE'
                                    ? 'bg-success/20 text-success-foreground'
                                    : skin.tier === 'PRO'
                                      ? 'bg-reward/20 text-reward'
                                      : 'bg-streak/20 text-streak'
                              }`}>
                                {isSelected ? t('commandCenter.skinActive') : skin.tier}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t(`commandCenter.skinDesc.${skin.id}`)}
                            </p>
                          </div>
                          {!accessible && (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </LayoutGroup>

              {/* Locked nudge for future */}
              {!isBeta && !isProUser && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-reward/5 border border-reward/20">
                  <Crown className="w-5 h-5 text-reward" />
                  <p className="text-xs text-muted-foreground">
                    {t('commandCenter.proNudge')}
                  </p>
                </div>
              )}
            </section>

            {/* Section 3: Pet Buddy Picker */}
            {!isTeen && (
              <section className="bg-card rounded-2xl border border-border p-4 space-y-4">
                <h2 className="font-bold text-foreground flex items-center gap-2">
                  <span className="text-lg">🐾</span>
                  {isRTL ? 'בחר/י את החיה שלך' : 'Choose Your Buddy'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'הביצה תיראה כמו החיה שבחרת כשתבקע!' : 'Your egg will hatch into the buddy you pick!'}
                </p>
                <TooltipProvider delayDuration={0}>
                <div className="grid grid-cols-5 gap-2">
                  {PET_SKIN_OPTIONS.map((skin) => {
                    const isLocked = questsCompleted < skin.unlockAt;
                    const remaining = skin.unlockAt - questsCompleted;
                    const isSelected = selectedSkin === skin.id;

                    const button = (
                      <motion.button
                        key={skin.id}
                        whileTap={isLocked ? undefined : { scale: 0.92 }}
                        onClick={() => {
                          if (isLocked) {
                            playLockedSound();
                            return;
                          }
                          setSelectedSkin(skin.id);
                          playPetTapBlip();
                        }}
                        className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-200 ${
                          isLocked
                            ? 'bg-muted/30 border border-border/30 cursor-not-allowed'
                            : isSelected
                              ? 'bg-primary/15 border-2 border-primary shadow-[0_0_12px_-4px_hsl(var(--primary)/0.5)]'
                              : 'bg-secondary/50 border border-border/60 hover:border-primary/40'
                        }`}
                      >
                        {/* Lock icon overlay */}
                        {isLocked && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-muted-foreground/80 flex items-center justify-center shadow z-10">
                            <Lock className="w-2.5 h-2.5 text-background" strokeWidth={3} />
                          </div>
                        )}
                        {/* Selected checkmark */}
                        {isSelected && !isLocked && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow"
                          >
                            <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
                          </motion.div>
                        )}
                        {/* Pet visual – grayscale when locked */}
                        <motion.div
                          className={`text-2xl flex items-center justify-center ${isLocked ? 'grayscale opacity-40' : ''}`}
                          animate={isSelected && !isLocked ? { y: [0, -6, 0] } : { y: 0 }}
                          transition={isSelected && !isLocked ? { duration: 0.5, repeat: Infinity, repeatDelay: 1.5 } : {}}
                        >
                          {skin.type === 'image'
                            ? <img src={skin.src} alt={t(skin.nameKey)} className="w-8 h-8 object-contain" draggable={false} />
                            : <span>{skin.emoji}</span>}
                        </motion.div>
                        <span className="text-[9px] font-medium text-muted-foreground leading-none text-center">
                          {t(skin.nameKey)}
                        </span>
                        {/* Progress label for locked pets */}
                        {isLocked && (
                          <span className="text-[8px] text-muted-foreground/70 leading-tight text-center">
                            {isRTL ? `עוד ${remaining}` : `${remaining} more`}
                          </span>
                        )}
                      </motion.button>
                    );

                    // Wrap locked pets with a tooltip
                    if (isLocked) {
                      return (
                        <Tooltip key={skin.id}>
                          <TooltipTrigger asChild>
                            {button}
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs max-w-[160px] text-center">
                            {isRTL
                              ? `השלם/י עוד ${remaining} משימות כדי לפתוח! 💪`
                              : `Complete ${remaining} more quests to unlock! 💪`}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    return button;
                  })}
                </div>
                </TooltipProvider>
              </section>
            )}

            {/* Section 4: Pet Toggle (only for kid mode & Pro families) */}
            {!isTeen && isProUser && (
              <section className="bg-card rounded-2xl border border-border p-4 space-y-4">
                <h2 className="font-bold text-foreground flex items-center gap-2">
                  <span className="text-lg">🥚</span>
                  {t('commandCenter.petTitle')}
                </h2>

                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {t('commandCenter.petToggleLabel')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('commandCenter.petToggleDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={petEnabled}
                    onCheckedChange={setPetEnabled}
                  />
                </div>
              </section>
            )}

            <section className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  {soundEnabled
                    ? <Volume2 className="w-5 h-5 text-primary" />
                    : <VolumeX className="w-5 h-5 text-muted-foreground" />
                  }
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {t('commandCenter.soundLabel')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {soundEnabled ? t('commandCenter.soundOnDesc') : t('commandCenter.soundOffDesc')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={(val) => {
                    setSoundEnabled(val);
                    setMuted(!val);
                  }}
                />
              </div>
            </section>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 text-lg font-bold rounded-2xl"
            >
              {saving
                ? (isRTL ? 'שומר...' : 'Saving...')
                : t('commandCenter.save')
              }
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
