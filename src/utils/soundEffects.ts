// Sound effects system for BUFF - gentle, satisfying, low-dopamine design
// Respects user's mute preference stored in localStorage

const MUTE_KEY = 'buff-sound-muted';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (isMuted()) return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function isMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === 'true';
}

export function setMuted(muted: boolean): void {
  localStorage.setItem(MUTE_KEY, muted ? 'true' : 'false');
}

/**
 * Soft click sound for menu/button interactions.
 * Very subtle, non-distracting.
 */
export function playClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.05);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Audio not available
  }
}

/**
 * Celebratory success chime when a task is marked done.
 * Warm ascending notes - satisfying but calm.
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 - major chord
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const startTime = now + i * 0.1;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  } catch {
    // Audio not available
  }
}
