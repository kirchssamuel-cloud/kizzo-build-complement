// Bande-son de la promo 3D (120 BPM, la mineur → do) : dalle cassée qui grésille, verre qui se
// recolle à l'envers jusqu'au temps fort, puis un groove plein (grosse caisse, claps, charley,
// basse en croches, accords pompés) avec un son pour chaque évènement à l'image.
import { E, BEAT, DROP, DURATION } from './config.js';
import { createMixer, renderWav } from '../audio-core.js';
import { rng } from '../util.js';

export function scheduleSoundtrack(ctx, out, t0, offset = 0) {
  const mx = createMixer(ctx, out, t0, offset);
  const { pad, sub, noiseHit, pluck, kick, tick, whoosh, riser, impact, sparkle } = mx;
  const r = rng(31);
  const snare = (t, g = 0.18) => {
    noiseHit(t, 0.16, { type: 'bandpass', f0: 1900, f1: 1400, q: 0.8, gain: g, attack: 0.002, wet: 0.35 });
    noiseHit(t, 0.08, { type: 'highpass', f0: 6000, f1: 6000, gain: g * 0.5, wet: 0.2 });
    sub(t, 220, 160, 0.09, g * 0.9);
  };
  const hat = (t, g = 0.04) => noiseHit(t, 0.045, { type: 'highpass', f0: 8500, f1: 8500, gain: g, wet: 0.12 });
  const stab = (t, notes, g = 0.05, len = 0.32) => pad(t, len, notes, g, 3200, 0.008, 0.12, 0.35);

  // =================================================================== intro : écran écrasé
  noiseHit(0, DROP - 0.05, { type: 'bandpass', f0: 110, f1: 100, q: 5, gain: 0.07, wet: 0.1 });
  [0.04, 0.12, 0.19, 0.33, 0.41].forEach((d, i) => tick(d, 0.05 - i * 0.006, 4300 - i * 420));
  // le verre se recolle « à l'envers » : tintements de plus en plus serrés jusqu'au temps fort
  for (let i = 0; i < 40; i++) {
    const k = Math.pow(i / 40, 0.55);
    pluck(0.35 + k * (DROP - 0.37), 92 + Math.floor(r() * 20), 0.01 + 0.02 * k, 0.12, 0.5, 1.6);
  }
  riser(0.3, DROP - 0.3, 0.2);
  sub(0.45, 40, 160, DROP - 0.45, 0.16);

  // =================================================================== temps fort : le verre se recolle
  impact(E.snap, 0.85);
  kick(E.snap, 0.6);
  noiseHit(E.snap, 0.5, { type: 'highpass', f0: 9000, f1: 3000, q: 0.7, gain: 0.28, attack: 0.002, wet: 0.5 });
  stab(E.snap, [57, 64, 69, 72], 0.07, 0.6);
  [E.w2, E.w3].forEach((t, i) => {
    sub(t, 140, 40, 0.3, 0.38 + i * 0.06);
    snare(t, 0.15 + i * 0.05);
  });

  // =================================================================== groove
  const prog = [
    [DROP, [57, 60, 64], 45], // la m
    [DROP + 2, [53, 57, 60], 41], // fa
    [DROP + 4, [48, 55, 60, 64], 36], // do
    [DROP + 6, [55, 59, 62], 43], // sol
    [DROP + 8, [57, 60, 64], 45], // la m
    [E.s1, [53, 57, 60, 65], 41], // fa (signature)
    [E.s3, [55, 59, 62, 67], 43], // sol
    [E.logo, [48, 55, 60, 64, 67], 36], // do (fin)
  ];
  prog.forEach(([at, chord, root], i) => {
    const end = i + 1 < prog.length ? prog[i + 1][0] : DURATION;
    const last = i === prog.length - 1;
    // accords « pompés » : relancés à chaque temps (effet sidechain)
    for (let t = at; t < end - 0.01; t += BEAT) stab(t + 0.03, chord.map((n) => n + 12), last ? 0.035 : 0.042, last ? BEAT * 2 : BEAT * 0.9);
    // basse en croches
    if (at >= E.splash || i > 0) for (let t = at; t < Math.min(end, last ? at + 0.01 : end) - 0.01; t += BEAT / 2) pluck(t, root + ((t - at) / (BEAT / 2)) % 2 * 12, 0.12, 0.22, 0.1, 0.55);
    if (last) pluck(at, root, 0.2, 2.5, 0.2, 0.5);
  });
  for (let t = E.splash; t < E.logo - 0.01; t += BEAT) {
    const n = Math.round((t - DROP) / BEAT);
    kick(t, 0.5);
    if (n % 2 === 1) snare(t);
    hat(t + BEAT / 2);
    if (t >= E.spin) hat(t + BEAT / 4, 0.02), hat(t + (3 * BEAT) / 4, 0.02);
  }
  // roulement de caisse claire vers la dernière mesure
  for (let i = 0; i < 8; i++) snare(E.s1 - 0.5 + i * (BEAT / 8), 0.05 + i * 0.012);
  riser(E.notif, E.s1 - E.notif - 0.02, 0.18);
  // signature : un coup par mot
  [E.s1, E.s2, E.s3, E.s4].forEach((t, i) => {
    impact(t, 0.35 + i * 0.05);
    sub(t, 150, 40, 0.35, 0.4);
  });
  // fin : logo, bouton, clic
  impact(E.logo, 0.7);
  kick(E.logo, 0.55);
  sparkle(E.logo + 0.05, 86, 7, 0.05, 0.06);
  for (let t = E.logo + BEAT * 2; t < E.tapCta + 0.01; t += BEAT * 2) kick(t, 0.35);
  whoosh(E.cta - 0.15, 0.3, 0.06, true);
  tick(E.tapCta, 0.12, 2300);
  impact(E.tapCta, 0.35);
  sparkle(E.tapCta + 0.03, 91, 6, 0.04, 0.05);

  // =================================================================== bruitages des évènements
  whoosh(E.splash - 0.1, 0.35, 0.08, true); // les mots s'envolent
  [0, 1, 2].forEach((i) => pluck(E.game + 0.04 + i * 0.07, [84, 88, 91][i], 0.05, 0.2, 0.3, 0.9)); // jeu
  sub(E.lock, 90, 45, 0.25, 0.35); // verrouillage
  noiseHit(E.lock, 0.12, { type: 'lowpass', f0: 2500, f1: 400, gain: 0.12, wet: 0.2 });
  tick(E.tapLock, 0.12, 2300); // appui
  whoosh(E.quiz - 0.08, 0.25, 0.07, true, [-0.5, 0.5]);
  for (let i = 0; i < 4; i++) pluck(E.quiz + 0.12 + i * 0.06, 76 + i * 3, 0.04, 0.15, 0.3, 0.8);
  tick(E.tapAnswer, 0.12, 2300);
  pluck(E.tapAnswer + 0.03, 84, 0.08, 0.5, 0.4, 0.8);
  pluck(E.tapAnswer + 0.1, 91, 0.07, 0.6, 0.4, 0.8);
  sparkle(E.plus15 + 0.05, 88, 8, 0.04, 0.06); // +15
  sub(E.plus15, 120, 38, 0.6, 0.45);
  pluck(E.result, 79, 0.06, 0.4, 0.4, 0.8);
  whoosh(E.spin - 0.05, 0.5, 0.12, true, [-0.8, 0.8]); // le téléphone tourne
  noiseHit(E.spin, 0.5, { type: 'bandpass', f0: 500, f1: 5000, q: 1.4, gain: 0.08, attack: 0.25, wet: 0.4 });
  [E.you1, E.you2].forEach((t) => sub(t, 130, 40, 0.3, 0.3));
  for (let i = 0; i < 4; i++) pluck(E.chips + i * 0.06, 79 + i * 2, 0.035, 0.15, 0.3, 0.8);
  tick(E.pick, 0.11, 2300);
  pluck(E.pick + 0.03, 88, 0.07, 0.4, 0.4, 0.8);
  tick(E.toggle + 0.25, 0.1, 1900);
  for (let i = 0; i < 7; i++) pluck(E.chart + 0.05 + (i / 6) * 0.5, [72, 74, 76, 79, 81, 84, 88][i], 0.04, 0.25, 0.4, 0.7);
  pluck(E.notif + 0.05, 88, 0.07, 0.35, 0.4, 0.8);
  pluck(E.notif + 0.15, 93, 0.07, 0.5, 0.4, 0.8);

  return mx.handle;
}

export const renderSoundtrackWav = (duration) => renderWav(scheduleSoundtrack, duration);
