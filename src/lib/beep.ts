/**
 * A short beep for "rest is over". iPhone only allows sound after a tap, so the audio is unlocked
 * when you tick a set (which starts the rest timer) and played when the timer reaches zero.
 */
let ctx: AudioContext | null = null;

export function primeAudio() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch { /* no audio: the timer still shows GO */ }
}

export function beep() {
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    for (const [i, f] of [880, 1175].entries()) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, t + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.3, t + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t + i * 0.18);
      osc.stop(t + i * 0.18 + 0.17);
    }
  } catch { /* ignore */ }
}
