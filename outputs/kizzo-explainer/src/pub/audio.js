// Bande-son de la pub « 23:47 » : nuit tendue (vibrations, messages, cœur qui bat),
// silence + impacts sur la bascule, groove lumineux pendant la démo, signature.
// La musique s'efface sous la voix off.
import { VO, S, T, K, PD, OUT, DURATION } from './config.js';
import { voiceBuffers, VO_DUR } from './vo.js';
import { createMixer, renderWav } from '../audio-core.js';

/** Voix off incluse (définie à la compilation : variante « sans voix »). */
export const WITH_VO = typeof __PUB_VO__ === 'undefined' ? true : __PUB_VO__;

export function scheduleSoundtrack(ctx, out, t0, offset = 0) {
  const mx = createMixer(ctx, out, t0, offset);
  const { pad, sub, noiseHit, pluck, kick, tick, whoosh, riser, impact, sparkle, sample } = mx;
  const duck = (t) => (!WITH_VO ? 1.15 : VO.some((v) => t > v.at - 0.1 && t < v.at + VO_DUR[v.id] + 0.1) ? 0.5 : 1);
  const buzz = (t) => {
    // vibration du téléphone : grondement grave haché
    for (let i = 0; i < 3; i++) sub(t + i * 0.09, 150, 120, 0.07, 0.22);
    noiseHit(t, 0.28, { type: 'bandpass', f0: 180, f1: 160, q: 3, gain: 0.08, wet: 0.1 });
  };

  // ---------------- 1. écran verrouillé : nuit, vibrations
  pad(0, 5.0, [38, 45, 50, 53], 0.05, 650, 0.2, 0.9, 0.6);
  T.lock.notifs.forEach((n) => {
    const at = Math.max(0.02, n.at);
    buzz(at);
    pluck(at + 0.02, n.hot ? 86 : 81, 0.07, 0.5, 0.35, 0.9);
  });
  for (let t = 0.8; t < 10.2; t += t < S.chat[0] ? 0.9 : 0.62) {
    sub(t, 62, 40, 0.18, 0.3 * duck(t));
    sub(t + 0.17, 58, 38, 0.2, 0.2 * duck(t));
  }

  // ---------------- 2. conversation : envoi / réception, tension croissante
  pad(S.chat[0], 5.5, [37, 44, 49, 52, 56], 0.045, 900, 0.3, 0.5, 0.6);
  T.chat.msgs.forEach((m) => {
    if (m.who === 'me') {
      noiseHit(m.at - 0.04, 0.16, { type: 'bandpass', f0: 1200, f1: 3800, q: 1.5, gain: 0.08, attack: 0.1, wet: 0.2 });
      pluck(m.at, 84, 0.06, 0.25, 0.3, 0.6);
    } else {
      pluck(m.at, 79, 0.07, 0.3, 0.3, 0.7);
      pluck(m.at + 0.07, 83, 0.05, 0.3, 0.3, 0.7);
      for (let t = m.typing; t < m.at - 0.05; t += 0.12) tick(t, 0.03, 3200);
    }
  });
  riser(8.6, 1.7, 0.15);

  // ---------------- 3. bascule : coupure nette, chaque mot claque
  impact(S.turn[0], 0.5);
  T.turn.forEach((w) => {
    sub(w.at, w.hot ? 110 : 90, 38, w.hot ? 0.9 : 0.45, w.hot ? 0.6 : 0.4);
    noiseHit(w.at, 0.25, { type: 'lowpass', f0: 5000, f1: 300, q: 0.7, gain: w.hot ? 0.2 : 0.12, wet: 0.5 });
  });
  riser(12.4, S.turn[1] - 12.4, 0.16);

  // ---------------- 4–5. démos : groove lumineux (ré majeur)
  impact(S.kid[0], 0.65);
  sparkle(S.kid[0] + 0.02, 86, 8, 0.04, 0.07);
  const beat = 0.5;
  for (let t = S.kid[0]; t < S.outro[0] - 0.1; t += beat) kick(t, 0.3 * duck(t));
  for (let t = S.kid[0] + 0.25; t < S.outro[0] - 0.1; t += beat) noiseHit(t, 0.05, { type: 'highpass', f0: 7500, f1: 7500, gain: 0.028 * duck(t), wet: 0.15 });
  pad(S.kid[0], 4.1, [43, 50, 54, 59, 62], 0.05, 2200, 0.3, 0.8);
  pad(S.parent[0], 5.3, [45, 52, 57, 61, 64], 0.05, 2400, 0.3, 0.8);
  for (let t = S.kid[0], i = 0; t < S.outro[0] - 0.1; t += 0.25, i++) pluck(t, [74, 78, 81, 78][i % 4] + (t > S.parent[0] ? 2 : 0), 0.02 * duck(t), 0.35, 0.4, 0.5);
  // enfant : gel, verrou, toucher, bonne réponse, +15
  noiseHit(K.zero, 0.9, { type: 'bandpass', f0: 7000, f1: 900, q: 6, gain: 0.1, attack: 0.02, wet: 0.8 });
  sub(K.zero, 90, 40, 0.4, 0.35);
  tick(K.tapCta, 0.22, 2300);
  whoosh(K.quiz - 0.05, 0.4, 0.08, true, [0.6, -0.4]);
  tick(K.tapOk, 0.24, 2500);
  [0, 0.09, 0.18].forEach((d, i) => pluck(K.tapOk + 0.15 + d, [79, 83, 86][i], 0.12, 1.0, 0.5, 1));
  impact(K.result, 0.55);
  sparkle(K.result + 0.05, 88, 9, 0.035, 0.08);
  for (let i = 0; i < 6; i++) pluck(K.result + 0.2 + i * 0.05, 91 + (i % 3) * 2, 0.03, 0.3, 0.5, 0.6);
  whoosh(K.back - 0.05, 0.4, 0.07, false, [-0.4, 0.4]);
  // parent : photo, analyse, toucher « 15 min »
  noiseHit(PD.scan[0], PD.scan[1] - PD.scan[0], { type: 'bandpass', f0: 900, f1: 3200, q: 9, gain: 0.04, attack: 0.3, wet: 0.5 });
  noiseHit(PD.shutter, 0.05, { type: 'highpass', f0: 4000, f1: 4000, gain: 0.28, wet: 0.2 });
  noiseHit(PD.shutter + 0.06, 0.07, { type: 'bandpass', f0: 2200, f1: 1600, q: 3, gain: 0.2, wet: 0.2 });
  for (let i = 0; i < 6; i++) pluck(PD.read + 0.05 + i * 0.1, [74, 76, 79, 81, 83, 86][i], 0.035, 0.45, 0.55, 0.6);
  whoosh(PD.questions - 0.05, 0.35, 0.06, true, [0.5, -0.5]);
  whoosh(PD.rules - 0.05, 0.35, 0.06, true, [0.5, -0.5]);
  tick(PD.tap15, 0.24, 2400);
  pluck(PD.tap15 + 0.03, 86, 0.1, 0.9, 0.5, 1);

  // ---------------- 6. fin
  whoosh(S.outro[0] - 0.1, 0.6, 0.12, true, [-0.6, 0.6]);
  sub(OUT.strike, 200, 60, 0.25, 0.25);
  noiseHit(OUT.strike, 0.3, { type: 'bandpass', f0: 2500, f1: 900, q: 2, gain: 0.1, wet: 0.3 });
  riser(OUT.strike, OUT.logo - OUT.strike, 0.12);
  impact(OUT.logo, 0.75);
  pad(OUT.logo, DURATION - OUT.logo + 0.5, [38, 50, 54, 57, 61, 64], 0.065, 2600, 0.05, 1.6, 0.75);
  sparkle(OUT.logo + 0.02, 86, 9, 0.04, 0.08);
  pluck(OUT.word, 81, 0.07, 1.6, 0.7, 0.6);
  pluck(OUT.cta, 88, 0.08, 1.4, 0.6, 0.9);
  pluck(OUT.cta + 0.12, 93, 0.06, 1.4, 0.6, 0.9);

  // ---------------- voix off
  const vb = WITH_VO ? voiceBuffers() : null;
  if (vb) for (const v of VO) sample(v.at, vb[v.id], { gain: 1.25, wet: 0.07 });

  return mx.handle;
}

export function renderSoundtrackWav(duration = DURATION, rate = 48000) {
  return renderWav(scheduleSoundtrack, duration, rate);
}
