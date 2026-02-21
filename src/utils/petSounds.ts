// Pet-specific sound effects using Web Audio API
// Respects the global mute setting from soundEffects.ts
import { isMuted } from './soundEffects';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (isMuted()) return null;
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

/** Soft sparkle blip when tapping/hovering a pet option */
export function playPetTapBlip() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch { /* audio unavailable */ }
}

/** Egg crack + pop sound for hatching */
export function playHatchSound() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Crack – short noise burst
    const bufSize = ctx.sampleRate * 0.08;
    const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // Pop – ascending tone after crack
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
    gain.gain.setValueAtTime(0, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.13);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + 0.1);
    osc.stop(now + 0.4);
  } catch { /* audio unavailable */ }
}

/** Pet-specific cheerful confirmation sounds */
export function playPetConfirmSound(petId: string) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Each pet gets a slightly different set of ascending notes
    const tones: Record<string, number[]> = {
      puppy:      [392, 523, 659],     // G4 C5 E5 – happy bark
      ginger_cat: [440, 554, 659],     // A4 C#5 E5 – purr melody
      rabbit:     [523, 659, 784],     // C5 E5 G5 – soft hop
      panda:      [349, 440, 523],     // F4 A4 C5 – gentle rumble
      capybara:   [494, 622, 784],     // B4 D#5 G5 – happy squeak
    };

    const notes = tones[petId] || tones.puppy;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  } catch { /* audio unavailable */ }
}
