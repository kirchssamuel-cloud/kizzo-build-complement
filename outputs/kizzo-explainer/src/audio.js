// Sound design 100 % synthétisé (Web Audio) et calé sur la timeline du film explicatif.
// La même partition sert à la lecture temps réel et au rendu hors-ligne (export MP4).
import { TL, SC, SCAN0, SCAN1, SCAN_DUR, DURATION } from './config.js';
import { createMixer, renderWav } from './audio-core.js';

/**
 * Programme toute la bande-son.
 * @param {BaseAudioContext} ctx
 * @param {AudioNode} out destination
 * @param {number} t0 temps contexte correspondant à `offset`
 * @param {number} offset position (s) dans la vidéo à partir de laquelle jouer
 */
export function scheduleSoundtrack(ctx, out, t0, offset = 0) {
  const mx = createMixer(ctx, out, t0, offset);
  const { pad, sub, noiseHit, pluck, kick, tick, whoosh, riser, impact, sparkle } = mx;
  // les évènements des plans hérités sont écrits en temps "histoire" : décalés après le scan
  const toFilm = (t) => (t >= SCAN0 - 1e-6 ? t + SCAN_DUR : t);
  mx.setMap(toFilm);

  // ---------------- partition (ré majeur, ~120 bpm)

  // Plan A : nappe douce + tic-tac du compte à rebours
  pad(0, 2.4, [50, 57, 64, 66], 0.07, 1400, 0.9, 0.9);
  for (let i = 0; i < 6; i++) pluck(0.1 + i * 0.4, [74, 78, 81, 78, 74, 76][i], 0.075, 0.6, 0.5, 0.6);
  for (let t = 0.1; t < 2.4; t += 0.8) sub(t, 70, 45, 0.4, 0.18);
  TL.ticks.forEach((t, i) => tick(t, 0.22 + i * 0.05, 1500 + i * 120));
  // zéro : thunk + gel (glissando givré descendant)
  sub(TL.zero, 90, 40, 0.5, 0.45);
  noiseHit(TL.zero, 1.2, { type: 'bandpass', f0: 7000, f1: 900, q: 6, gain: 0.12, attack: 0.02, wet: 0.8 });
  for (let i = 0; i < 6; i++) pluck(TL.zero + 0.05 + i * 0.07, 96 - i * 3, 0.035, 0.8, 0.9, 0.3);
  pad(2.6, 1.9, [45, 52, 57, 60], 0.032, 600, 0.6, 0.7, 0.8);
  whoosh(TL.title1[0] - 0.1, 0.7, 0.08);
  // montée vers l'écran + impact lumineux
  riser(TL.push[0] + 0.7, TL.flash - TL.push[0] - 0.7, 0.16);
  impact(TL.flash, 0.65);
  sparkle(TL.flash + 0.02, 86, 8, 0.04, 0.07);

  // Plan B : nappe lumineuse + "pops" des calques
  pad(4.95, 4.2, [43, 50, 54, 59, 62], 0.075, 2400, 0.5, 1.2);
  for (let t = 5.5, i = 0; t < 8.9; t += 0.25, i++) pluck(t, [67, 71, 74, 79][i % 4], 0.03, 0.35, 0.4, 0.5);
  for (let t = 5.5; t < 8.9; t += 1.0) kick(t, 0.22);
  [0, 0.16, 0.32, 0.5, 0.62, 0.74, 0.92].forEach((d, i) => pluck(TL.emerge[0] + d, [79, 83, 86, 88, 90, 91, 95][i], 0.07, 0.5, 0.4, 0.8));
  whoosh(TL.title2[0] - 0.1, 0.6, 0.07);
  tick(TL.cta, 0.25, 2200);
  sub(TL.cta, 300, 120, 0.15, 0.2);
  whoosh(TL.toQuiz[0], 0.8, 0.14, true, [0.6, -0.4]);

  // Plan C : pulsation rythmique + bonnes réponses ascendantes
  const beat = 0.5;
  for (let t = 9.0; t < 16.0; t += beat) kick(t, 0.32);
  for (let t = 9.25; t < 16.0; t += beat) noiseHit(t, 0.06, { type: 'highpass', f0: 7000, f1: 7000, gain: 0.03, wet: 0.1 });
  pad(9.0, 3.3, [40, 47, 52, 55, 59], 0.06, 1800, 0.5, 0.8);
  pad(12.3, 3.6, [45, 52, 57, 61, 64], 0.062, 2100, 0.5, 0.8);
  const arp = [64, 67, 71, 74];
  for (let t = 9.0, i = 0; t < 15.9; t += 0.25, i++) pluck(t, arp[i % 4] + (t > 12.3 ? 5 : 0), 0.025, 0.35, 0.35, 0.5);
  TL.q.forEach((q, i) => {
    whoosh(q.in - 0.08, 0.55, 0.1, true, [i % 2 ? 0.5 : -0.5, 0]);
    tick(q.tap, 0.2, 2400);
    const base = [76, 79, 83][i];
    pluck(q.tap + 0.02, base, 0.14, 1.1, 0.5, 1);
    pluck(q.tap + 0.11, base + 4, 0.12, 1.1, 0.5, 1);
    pluck(q.tap + 0.2, base + 7, 0.1, 1.3, 0.55, 1);
    noiseHit(q.tap + 0.05, 0.6, { type: 'highpass', f0: 6000, f1: 9000, gain: 0.035, wet: 0.8 });
    if (q.out < 30) whoosh(q.out, 0.45, 0.07, false, [0, 0.6]);
  });
  // verrouillage de la réponse finale : clic métallique
  noiseHit(TL.lockIn[1], 0.09, { type: 'bandpass', f0: 3400, f1: 2600, q: 8, gain: 0.3, wet: 0.3 });
  sub(TL.lockIn[1], 220, 90, 0.12, 0.25);
  riser(TL.lockIn[1], TL.ringDone - TL.lockIn[1] + 0.05, 0.12);

  // Plan D : récompense spectaculaire
  impact(TL.burst, 0.8);
  pad(TL.burst, 4.0, [38, 45, 50, 54, 57, 62, 66], 0.06, 3200, 0.05, 1.8, 0.7);
  sparkle(TL.burst + 0.02, 86, 9, 0.035, 0.09);
  sparkle(TL.burst + 0.4, 91, 7, 0.05, 0.05);
  for (let i = 0; i < 18; i++) noiseHit(TL.burst + 0.1 + i * 0.09, 0.05, { type: 'highpass', f0: 8000, f1: 9000, gain: 0.03 * (1 - i / 18), wet: 0.6, pan0: Math.sin(i * 2.1) * 0.8, pan1: Math.sin(i * 2.1) * 0.8 });
  for (let t = TL.burst + 0.5; t < 20.0; t += beat) kick(t, 0.36);
  whoosh(TL.burstText[0] - 0.05, 0.4, 0.09);
  whoosh(TL.toPhone[0], 0.7, 0.12, false, [0, 0]);
  pluck(TL.toPhone[1], 88, 0.12, 1.4, 0.6, 1);
  pluck(TL.toPhone[1] + 0.08, 93, 0.09, 1.4, 0.6, 1);

  // Plan E : parent, calme et précis
  whoosh(TL.parentIn[0], 1.0, 0.13, true, [-0.8, 0.2]);
  pad(20.1, 5.0, [47, 54, 57, 62, 66], 0.075, 1900, 0.8, 1.2);
  for (let t = 20.5; t < 25.0; t += beat) kick(t, 0.24);
  for (let t = 20.75; t < 25.0; t += beat) noiseHit(t, 0.05, { type: 'highpass', f0: 7500, f1: 7500, gain: 0.025, wet: 0.15 });
  for (let t = 20.5, i = 0; t < 25.0; t += 0.25, i++) pluck(t, [66, 69, 73, 76][i % 4] + (t > 22.8 ? -2 : 0), 0.022, 0.4, 0.45, 0.4);
  [0, 0.15, 0.3, 0.45].forEach((d, i) => pluck(TL.parentIn[0] + 0.5 + d, [71, 74, 78, 81][i], 0.05, 0.5, 0.4, 0.5));
  TL.trails.forEach((t, i) => {
    noiseHit(t, TL.trailDur, { type: 'bandpass', f0: 600, f1: 5000, q: 4, gain: 0.06, attack: TL.trailDur * 0.8, wet: 0.5, pan0: -0.6, pan1: 0.6 });
    pluck(t + TL.trailDur, [83, 86, 90][i], 0.1, 1.0, 0.55, 0.9);
  });

  // Plan F : logo
  riser(TL.converge[0], TL.logoLock - TL.converge[0], 0.15);
  pad(25.2, 1.8, [43, 50, 55, 59], 0.06, 1200, 0.6, 0.8);
  impact(TL.logoLock, 0.75);
  pad(TL.logoLock, 2.4, [38, 50, 54, 57, 61, 64], 0.08, 2600, 0.04, 1.6, 0.75);
  sparkle(TL.logoLock + 0.02, 86, 9, 0.04, 0.08);
  noiseHit(TL.sweep[0], 1.2, { type: 'bandpass', f0: 2500, f1: 9000, q: 3, gain: 0.05, attack: 0.6, wet: 0.8, pan0: -0.7, pan1: 0.7 });
  pluck(TL.wordmark, 81, 0.07, 1.6, 0.7, 0.6);
  pluck(TL.tagline, 86, 0.05, 1.8, 0.75, 0.5);

  // ---------------- scène du scan (temps absolus)
  mx.setMap(null);
  impact(SCAN0, 0.55);
  sparkle(SCAN0 + 0.02, 86, 7, 0.04, 0.06);
  pad(SCAN0 + 0.05, SCAN_DUR - 0.2, [47, 54, 59, 62, 66], 0.07, 2000, 0.5, 1.0);
  for (let t = 5.5; t < SCAN1 - 0.2; t += 0.5) kick(t, 0.2);
  for (let t = 5.75; t < SCAN1 - 0.2; t += 0.5) noiseHit(t, 0.05, { type: 'highpass', f0: 7500, f1: 7500, gain: 0.022, wet: 0.15 });
  whoosh(SC.title1[0] - 0.1, 0.6, 0.07);
  tick(SC.openTap, 0.2, 2200);
  tick(SC.genTap, 0.2, 2400);
  pluck(SC.genTap + 0.05, 91, 0.06, 0.6, 0.5, 0.7);
  whoosh(SC.review[0] - 0.05, 0.5, 0.06, false, [0.3, -0.3]);
  pluck(SC.scan[0] - 0.12, 88, 0.06, 0.25, 0.3, 0.3);
  pluck(SC.scan[0] - 0.02, 93, 0.06, 0.3, 0.3, 0.3);
  noiseHit(SC.scan[0], SC.scan[1] - SC.scan[0], { type: 'bandpass', f0: 900, f1: 3200, q: 9, gain: 0.05, attack: 0.3, wet: 0.5, pan0: -0.4, pan1: 0.4 });
  sub(SC.scan[0], 220, 330, SC.scan[1] - SC.scan[0], 0.05);
  noiseHit(SC.shutter, 0.05, { type: 'highpass', f0: 4000, f1: 4000, gain: 0.3, wet: 0.2 });
  noiseHit(SC.shutter + 0.06, 0.07, { type: 'bandpass', f0: 2200, f1: 1600, q: 3, gain: 0.22, wet: 0.2 });
  const penta = [74, 76, 79, 81, 83, 86, 88, 91];
  for (let i = 0; i < 10; i++) pluck(SC.analyze[0] + 0.1 + i * 0.11, penta[i % penta.length], 0.04, 0.5, 0.6, 0.6);
  [0, 1, 2].forEach((i) => pluck(SC.analyze[0] + 0.75 + i * 0.12, [83, 86, 91][i], 0.09, 0.9, 0.5, 0.9));
  whoosh(SC.title2[0] - 0.1, 0.6, 0.07);
  whoosh(SC.freq[0], 0.5, 0.08, true, [0.3, -0.3]);
  tick(SC.freqTap, 0.24, 2300);
  pluck(SC.freqTap + 0.03, 86, 0.1, 0.9, 0.5, 1);
  tick(SC.send, 0.22, 2100);
  whoosh(SC.send + 0.08, 0.9, 0.14, true, [-0.4, 0.4]);
  pluck(SC.send + 0.1, 90, 0.08, 1.1, 0.6, 0.8);
  riser(SC.send + 0.2, SCAN1 - SC.send - 0.2, 0.13);
  mx.setMap(toFilm);

  return mx.handle;
}

/** Rendu hors-ligne de la bande-son complète -> WAV (base64) pour l'export vidéo. */
export function renderSoundtrackWav(duration = DURATION, rate = 48000) {
  return renderWav(scheduleSoundtrack, duration, rate);
}
