// Web Audio API celebration sounds - calm, satisfying, low-dopamine design
// No gambling-like effects, no flashing. Warm and gentle.
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/**
 * Plays a gentle, warm ascending chime.
 * Uses soft sine waves with slow attack - satisfying but calm.
 */
export function playCelebrationChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Gentle ascending notes - slower, warmer
    const notes = [392, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      const startTime = now + i * 0.2; // Slower spacing
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.06); // Softer volume
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8); // Longer decay
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.8);
    });
  } catch (e) {
    console.warn('Audio not available:', e);
  }
}

/**
 * Plays a soft, subtle credit ding - not attention-grabbing.
 */
export function playCreditDing() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5 - warm note
    
    gain.gain.setValueAtTime(0.06, now); // Very soft
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {
    console.warn('Audio not available:', e);
  }
}
