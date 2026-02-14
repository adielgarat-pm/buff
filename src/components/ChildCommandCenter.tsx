import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Leaf, Gamepad2, Lock, Crown, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/hooks/useSubscription';
import { ChildPreferences, ChildTheme, AgeMode } from '@/hooks/useChildPreferences';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { isMuted, setMuted } from '@/utils/soundEffects';

interface ChildCommandCenterProps {
  open: boolean;
  onClose: () => void;
  preferences: ChildPreferences;
  onSave: (prefs: ChildPreferences) => Promise<void>;
}

type SkinTier = 'FREE' | 'PRO' | 'LIFE';

interface SkinOption {
  id: ChildTheme;
  icon: typeof Leaf;
  tier: SkinTier;
}

const SKINS: SkinOption[] = [
  { id: 'mint', icon: Leaf, tier: 'FREE' },
  { id: 'gamer', icon: Gamepad2, tier: 'FREE' },
];

export function ChildCommandCenter({ open, onClose, preferences, onSave }: ChildCommandCenterProps) {
  const { t, language } = useLanguage();
  const { isProUser } = useSubscription();
  const isRTL = language === 'he';

  const [age, setAge] = useState<number | null>(preferences.age_mode === 'teen' ? 13 : 10);
  const [ageMode, setAgeMode] = useState<AgeMode>(preferences.age_mode);
  const [theme, setTheme] = useState<ChildTheme>(preferences.theme);
  const [petEnabled, setPetEnabled] = useState(preferences.pet_enabled);
  const [soundMuted, setSoundMuted] = useState(isMuted());
  const [saving, setSaving] = useState(false);

  const isTeen = ageMode === 'teen';

  const handleAgeSelect = useCallback((a: number) => {
    setAge(a);
    if (a >= 12) {
      setAgeMode('teen');
      setPetEnabled(false);
    } else {
      setAgeMode('kid');
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await onSave({
      theme,
      pet_enabled: petEnabled,
      age_mode: ageMode,
      child_onboarding_completed: true,
    });
    setSaving(false);
    onClose();
  }, [theme, petEnabled, ageMode, onSave, onClose]);

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
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                      age === a
                        ? 'bg-primary text-primary-foreground scale-105 shadow-md'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
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

              <div className="space-y-3">
                {SKINS.map((skin) => {
                  const isSelected = theme === skin.id;
                  const accessible = canAccessSkin(skin.tier);
                  const Icon = skin.icon;

                  return (
                    <button
                      key={skin.id}
                      onClick={() => accessible && setTheme(skin.id)}
                      disabled={!accessible}
                      className={`w-full p-4 rounded-2xl border-2 transition-all active:scale-[0.98] text-start ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : accessible
                            ? 'border-border bg-card hover:border-primary/50'
                            : 'border-border/50 bg-muted/30 opacity-60'
                      }`}
                    >
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
                              skin.tier === 'FREE'
                                ? 'bg-success/20 text-success-foreground'
                                : skin.tier === 'PRO'
                                  ? 'bg-reward/20 text-reward'
                                  : 'bg-streak/20 text-streak'
                            }`}>
                              {skin.tier}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t(`commandCenter.skinDesc.${skin.id}`)}
                          </p>
                        </div>
                        {!accessible && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Lock className="w-4 h-4" />
                          </div>
                        )}
                        {isSelected && (
                          <Sparkles className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

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

            {/* Section 3: Pet Toggle (only for kid mode & Pro families) */}
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

            {/* Section 4: Sound / Mute Toggle */}
            <section className="bg-card rounded-2xl border border-border p-4 space-y-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <span className="text-lg">{soundMuted ? '🔇' : '🔊'}</span>
                {t('commandCenter.muteLabel')}
              </h2>

              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div>
                  <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                    {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {t('commandCenter.muteLabel')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('commandCenter.muteDesc')}
                  </p>
                </div>
                <Switch
                  checked={soundMuted}
                  onCheckedChange={(val) => {
                    setSoundMuted(val);
                    setMuted(val);
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
