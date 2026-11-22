// audio.js — all sound is WebAudio oscillators, no audio files.
// A soft coin chime, a low alarm pulse while spotted, a win arpeggio and a
// caught descent. Nothing plays until the first user gesture creates the
// AudioContext, so the game stays silent on load.

let ctx = null;
let muted = false;
let alarmTimer = 0;

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, gain, when = 0) {
  if (muted || !ctx) return;
  try {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // Sound is garnish; a failed oscillator must never break the game.
  }
}

export function playPickup(value) {
  tone(880, 0.12, 'sine', 0.12);
  tone(1320, 0.18, 'sine', 0.1, 0.07);
  if (value >= 1000) {
    tone(1760, 0.3, 'sine', 0.12, 0.14);
    tone(2200, 0.4, 'sine', 0.1, 0.22);
  }
}

export function playSmoke() {
  tone(220, 0.35, 'triangle', 0.1);
  tone(165, 0.4, 'triangle', 0.08, 0.08);
}

export function playEmp() {
  tone(1400, 0.08, 'square', 0.06);
  tone(700, 0.12, 'square', 0.06, 0.08);
  tone(350, 0.2, 'square', 0.06, 0.16);
}

export function playLockpick() {
  tone(520, 0.07, 'square', 0.07);
  tone(780, 0.07, 'square', 0.07, 0.09);
}

export function playWin() {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((n, i) => tone(n, 0.35, 'triangle', 0.12, i * 0.11));
}

export function playCaught() {
  tone(392, 0.25, 'sawtooth', 0.1);
  tone(311, 0.3, 'sawtooth', 0.1, 0.2);
  tone(233, 0.5, 'sawtooth', 0.1, 0.45);
}

// A heartbeat pulse while the alarm is critical. Call every frame; it
// throttles itself.
export function alarmPulse(alarm, dt) {
  if (muted || !ctx || alarm < 75) return;
  alarmTimer -= dt;
  if (alarmTimer <= 0) {
    alarmTimer = alarm > 92 ? 0.45 : 0.8;
    tone(98, 0.16, 'sine', 0.16);
    tone(65, 0.2, 'sine', 0.12, 0.12);
  }
}
