// Bande-son du film « Les règles du jeu » (fa majeur, ~116 bpm) : tic-tac des applis,
// clics d'interface pour chaque réglage, carillons des bonnes réponses, sablier, logo.
import { S, DURATION } from './config.js';
import { createMixer, renderWav } from '../audio-core.js';

export function scheduleSoundtrack(ctx, out, t0, offset = 0) {
  const mx = createMixer(ctx, out, t0, offset);
  const { pad, sub, noiseHit, pluck, kick, tick, whoosh, riser, impact, sparkle } = mx;
  const beat = 60 / 116;
  const F = [65, 67, 69, 72, 74, 77, 79, 81, 84]; // fa majeur pentatonique (aigu)

  // ---------------- A : les applis décomptent
  pad(0, 3.6, [53, 60, 64, 69], 0.065, 1500, 0.8, 0.9);
  for (let i = 0; i < 7; i++) pluck(0.2 + i * beat * 0.5, [72, 77, 81, 84, 81, 77, 79][i], 0.05, 0.5, 0.5, 0.6);
  // tic-tac qui accélère avec le temps d'applis
  for (let t = 0.9, d = 0.42; t < S.full - 0.05; t += d, d = Math.max(0.14, d * 0.9)) tick(t, 0.12 + (t / S.full) * 0.12, 1900 + (t / S.full) * 600);
  riser(S.usage[0] + 1.2, S.full - S.usage[0] - 1.2, 0.12);
  impact(S.full, 0.6);
  pluck(S.full + 0.02, 84, 0.12, 0.6, 0.5, 1);
  pluck(S.full + 0.16, 79, 0.12, 0.9, 0.5, 1);
  noiseHit(S.lock, 0.09, { type: 'bandpass', f0: 3200, f1: 2400, q: 8, gain: 0.28, wet: 0.3 });
  sub(S.lock, 200, 80, 0.14, 0.3);
  for (let i = 0; i < 6; i++) whoosh(S.iconsIn[0] + i * 0.05, 0.3, 0.035, false, [i % 2 ? 0.5 : -0.5, 0]);
  pad(S.lock, 1.0, [50, 57, 60, 65], 0.04, 700, 0.3, 0.6, 0.8);
  // raccord « whip »
  whoosh(S.whip[0] - 0.05, 0.75, 0.2, true, [-0.8, 0.8]);
  noiseHit(S.whip[0] + 0.3, 0.5, { type: 'highpass', f0: 5000, f1: 9000, gain: 0.05, attack: 0.2, wet: 0.7 });

  // ---------------- B : Règles des quiz
  const B0 = S.parentIn[0] + 0.2;
  for (let t = B0; t < S.carousel[0] - 0.1; t += beat) kick(t, 0.26);
  for (let t = B0 + beat / 2; t < S.carousel[0] - 0.1; t += beat) noiseHit(t, 0.05, { type: 'highpass', f0: 7500, f1: 7500, gain: 0.026, wet: 0.15 });
  pad(B0, 4.6, [46, 53, 58, 62, 65], 0.06, 2000, 0.5, 0.9);
  pad(B0 + 4.6, 5.0, [48, 55, 60, 64, 67], 0.06, 2200, 0.5, 0.9);
  for (let t = B0, i = 0; t < S.carousel[0] - 0.2; t += beat / 2, i++) pluck(t, [65, 69, 72, 77][i % 4] + (t > B0 + 4.6 ? 2 : 0), 0.018, 0.35, 0.4, 0.4);
  // interrupteur
  pluck(S.toggle.out + 0.1, 77, 0.06, 0.4, 0.4, 0.8);
  tick(S.toggle.flip, 0.22, 2600);
  sub(S.toggle.flip, 320, 160, 0.12, 0.18);
  sparkle(S.toggle.flip + 0.04, 84, 5, 0.04, 0.05);
  // puces de fréquence : petites bulles qui sortent
  for (let i = 0; i < 9; i++) pluck(S.chips.out + 0.15 + i * 0.05, F[i % F.length], 0.035, 0.3, 0.4, 0.5);
  tick(S.chips.sel, 0.12, 2200);
  tick(S.chips.tap, 0.24, 2500);
  pluck(S.chips.tap + 0.03, 81, 0.11, 0.9, 0.5, 1);
  pluck(S.chips.tap + 0.12, 86, 0.08, 1.0, 0.5, 1);
  whoosh(S.chips.back, 0.45, 0.06, false, [0.4, -0.4]);
  // jetons
  for (let i = 0; i < 8; i++) pluck(S.coins.out + 0.15 + i * 0.05, F[(i + 2) % F.length], 0.032, 0.3, 0.4, 0.5);
  S.coins.steps.forEach((t, i) => {
    tick(t, 0.2, 2300 + i * 200);
    pluck(t + 0.02, 79 + i * 2, 0.08, 0.5, 0.45, 0.9);
  });
  whoosh(S.coins.back, 0.45, 0.06, false, [0.4, -0.4]);
  // matières : une note par illustration
  for (let i = 0; i < 6; i++) {
    const t = S.subjects.out + i * S.subjects.stagger + 0.3;
    pluck(t, [77, 79, 81, 84, 86, 89][i], 0.075, 0.7, 0.5, 0.9);
    noiseHit(t, 0.05, { type: 'bandpass', f0: 3000, f1: 2500, q: 5, gain: 0.05, wet: 0.2 });
  }
  // enregistrer
  tick(S.save, 0.24, 2200);
  sparkle(S.save + 0.08, 86, 7, 0.04, 0.06);
  whoosh(S.carousel[0] - 0.05, 0.9, 0.16, true, [0.6, -0.6]);

  // ---------------- C : carrousel de quiz
  const C0 = S.carousel[1];
  for (let t = C0; t < S.done; t += beat) kick(t, 0.3);
  for (let t = C0 + beat / 2; t < S.done; t += beat) noiseHit(t, 0.05, { type: 'highpass', f0: 7000, f1: 7000, gain: 0.03, wet: 0.12 });
  pad(S.carousel[0], 4.0, [41, 48, 53, 57, 60], 0.06, 2000, 0.4, 0.8);
  pad(S.carousel[0] + 4.0, 4.7, [43, 50, 55, 58, 62], 0.062, 2300, 0.4, 0.8);
  for (let t = C0, i = 0; t < S.done - 0.1; t += beat / 2, i++) pluck(t, [69, 72, 77, 81][i % 4], 0.02, 0.32, 0.35, 0.5);
  S.q.forEach((q, i) => {
    if (i > 0) whoosh(q.front - 0.5, 0.5, 0.08, true, [0.5, -0.5]);
    tick(q.tap, 0.2, 2400);
    const base = 77 + i * 2;
    pluck(q.tap + 0.18, base, 0.13, 1.0, 0.5, 1);
    pluck(q.tap + 0.27, base + 4, 0.11, 1.0, 0.5, 1);
    pluck(q.tap + 0.36, base + 7, 0.09, 1.2, 0.55, 1);
    noiseHit(q.tap + 0.2, 0.5, { type: 'highpass', f0: 6000, f1: 9000, gain: 0.03, wet: 0.8 });
  });
  whoosh(S.done, 0.7, 0.18, false, [0.8, -0.8]);

  // ---------------- D : sablier, +15, déblocage
  pluck(S.reward[0] + 0.2, 72, 0.08, 0.7, 0.5, 0.7);
  sub(S.flip[0] + 0.2, 90, 45, 0.6, 0.35);
  noiseHit(S.flip[0], S.flip[1] - S.flip[0], { type: 'bandpass', f0: 400, f1: 2400, q: 2, gain: 0.08, attack: 0.5, wet: 0.5, pan0: -0.5, pan1: 0.5 });
  noiseHit(S.flip[1], S.converge[0] - S.flip[1], { type: 'highpass', f0: 6000, f1: 8000, gain: 0.018, attack: 0.4, wet: 0.6 });
  riser(S.plus, 0.85, 0.12);
  impact(S.plus + 0.85, 0.7);
  sparkle(S.plus + 0.87, 86, 9, 0.035, 0.08);
  pad(S.plus + 0.85, 3.2, [41, 48, 53, 57, 60, 65], 0.06, 3000, 0.05, 1.4, 0.7);
  for (let t = S.plus + 0.85; t < S.converge[0]; t += beat) kick(t, 0.32);
  sparkle(S.unlock, 91, 9, 0.04, 0.07);
  for (let i = 0; i < 6; i++) pluck(S.unlock + 0.15 + i * 0.06, F[i + 2], 0.05, 0.45, 0.45, 0.7);

  // ---------------- E : signature
  riser(S.converge[0], S.logoLock - S.converge[0], 0.15);
  pad(S.converge[0], 1.4, [46, 53, 58, 62], 0.05, 1200, 0.5, 0.7);
  impact(S.logoLock, 0.75);
  pad(S.logoLock, 2.6, [41, 53, 57, 60, 64, 69], 0.08, 2600, 0.04, 1.6, 0.75);
  sparkle(S.logoLock + 0.02, 84, 9, 0.04, 0.08);
  noiseHit(S.sweep[0], 1.2, { type: 'bandpass', f0: 2500, f1: 9000, q: 3, gain: 0.05, attack: 0.6, wet: 0.8, pan0: -0.7, pan1: 0.7 });
  pluck(S.wordmark, 77, 0.07, 1.6, 0.7, 0.6);
  pluck(S.tagline, 84, 0.05, 1.8, 0.75, 0.5);
  pluck(S.cta, 89, 0.06, 1.4, 0.7, 0.8);

  return mx.handle;
}

export function renderSoundtrackWav(duration = DURATION, rate = 48000) {
  return renderWav(scheduleSoundtrack, duration, rate);
}
