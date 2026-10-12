// Bande-son du film « La demande » (130 BPM, 32 temps) : intro retenue (pad pompé, frappe),
// montée vers le temps fort (12), puis groove plein. Un bruitage par évènement à l'image.
import { E, BEAT, DURATION } from './config.js';
import { createMixer, renderWav } from '../audio-core.js';
import { rng } from '../util.js';
import { VO, inVoice, voiceBuffers } from './vo.js';

export function scheduleSoundtrack(ctx, out, t0, offset = 0) {
  const mx = createMixer(ctx, out, t0, offset);
  const { pad, sub, noiseHit, pluck, kick, tick, whoosh, riser, impact, sparkle, sample } = mx;
  const r = rng(11);
  // la musique s'efface sous la voix
  const duck = (t) => (inVoice(t) ? 0.55 : 1);
  const clap = (t, g = 0.16) => {
    noiseHit(t, 0.14, { type: 'bandpass', f0: 1700, f1: 1200, q: 0.9, gain: g, attack: 0.003, wet: 0.4 });
    noiseHit(t + 0.012, 0.09, { type: 'bandpass', f0: 2400, f1: 1800, q: 1.2, gain: g * 0.6, wet: 0.3 });
  };
  const hat = (t, g = 0.035) => noiseHit(t, 0.04, { type: 'highpass', f0: 9000, f1: 9000, gain: g, wet: 0.1 });
  const stab = (t, notes, g = 0.05, len = 0.3) => pad(t, len, notes, g * duck(t), 3000, 0.008, 0.14, 0.35);
  const bass = (t, n, g = 0.12, d = 0.22) => pluck(t, n, g * duck(t), d, 0.08, 0.5);

  // =================================================================== intro (temps 0 → 12)
  // nappe douce, pompée à chaque temps ; grosse caisse feutrée dès le temps 4
  const intro = [
    [0, [53, 57, 60, 65]], // fa
    [4 * BEAT, [48, 55, 60, 64]], // do
    [8 * BEAT, [55, 59, 62, 67]], // sol
  ];
  intro.forEach(([at, chord]) => {
    for (let t = at; t < at + 4 * BEAT - 0.01; t += BEAT) stab(t + 0.02, chord.map((n) => n + 12), 0.03, BEAT * 0.8);
  });
  for (let t = 4 * BEAT; t < E.drop - 0.01; t += BEAT) kick(t, 0.3);
  for (let t = 8 * BEAT; t < E.drop - 0.01; t += BEAT / 2) hat(t, 0.02);
  // frappe : un tic feutré par caractère (rythme naturel, voir KEYS du film)
  const typeN = 50;
  for (let i = 0; i < typeN; i++) {
    const tt = E.type0 + (i / (typeN - 1)) * (E.typeEnd - E.type0) + (r() - 0.5) * 0.03;
    tick(tt, 0.05 + r() * 0.03, 2600 + r() * 900);
  }
  // envoi : pop + onde
  tick(E.send, 0.14, 2100);
  pluck(E.send + 0.02, 88, 0.1, 0.5, 0.4, 0.8);
  pluck(E.send + 0.09, 95, 0.09, 0.6, 0.4, 0.8);
  whoosh(E.send + 0.05, 0.45, 0.08, false, [0.4, -0.4]); // recul de caméra
  // le bouton devient le bol
  whoosh(E.bowl, 0.5, 0.1, true, [0.5, 0]);
  sub(E.bowl + 0.45, 90, 55, 0.3, 0.3);
  // « Kizzo mijote… » : scintillement
  sparkle(E.cook + 0.05, 88, 5, 0.05, 0.035);
  // lancers de matières : un pluck montant + petite chute
  E.toss.forEach((t, i) => {
    pluck(t, 72 + i * 2, 0.08, 0.35, 0.3, 0.9);
    noiseHit(t, 0.12, { type: 'bandpass', f0: 1200, f1: 3500, q: 2, gain: 0.05, attack: 0.01, wet: 0.3 });
    sub(t, 160, 70, 0.12, 0.2);
  });
  riser(E.toss[0], E.drop - E.toss[0] - 0.02, 0.2);
  for (let i = 0; i < 8; i++) clap(E.drop - BEAT + i * (BEAT / 8), 0.05 + i * 0.012);

  // =================================================================== temps fort : inondation
  impact(E.drop, 0.9);
  kick(E.drop, 0.65);
  noiseHit(E.drop, 0.6, { type: 'highpass', f0: 8000, f1: 2500, q: 0.7, gain: 0.3, attack: 0.002, wet: 0.5 });
  whoosh(E.drop, 0.35, 0.14, true, [-0.7, 0.7]);
  stab(E.drop, [53, 57, 60, 65], 0.08, 0.7);

  // =================================================================== groove (temps 12 → 32)
  const prog = [
    [E.drop, [53, 57, 60, 65], 41], // fa
    [E.drop + 4 * BEAT, [48, 55, 60, 64], 36], // do
    [E.drop + 8 * BEAT, [55, 59, 62, 67], 43], // sol
    [E.drop + 12 * BEAT, [57, 60, 64, 67], 45], // la m
    [E.drop + 16 * BEAT, [53, 57, 60, 65], 41], // fa (dernière mesure, la plus forte)
    [E.mark, [48, 55, 60, 64, 67], 36], // do (fin)
  ];
  prog.forEach(([at, chord, root], i) => {
    const end = i + 1 < prog.length ? prog[i + 1][0] : DURATION;
    const last = i === prog.length - 1;
    for (let t = at; t < end - 0.01; t += BEAT) stab(t + 0.02, chord.map((n) => n + 12), last ? 0.04 : 0.045, last ? BEAT * 2.5 : BEAT * 0.85);
    if (!last) for (let t = at; t < end - 0.01; t += BEAT / 2) bass(t, root + (Math.round((t - at) / (BEAT / 2)) % 4 === 3 ? 12 : 0));
    else pluck(at, root - 12, 0.2, 2.6, 0.2, 0.5);
  });
  for (let t = E.drop; t < E.mark - 0.01; t += BEAT) {
    const n = Math.round((t - E.drop) / BEAT);
    kick(t, 0.55 * duck(t));
    if (n % 2 === 1) clap(t, 0.17 * duck(t));
    hat(t + BEAT / 2, 0.04 * duck(t));
    if (t >= E.page) hat(t + BEAT / 4, 0.02), hat(t + (3 * BEAT) / 4, 0.02);
  }
  // petite mélodie en contre-chant sur les cartes et la discussion
  const mel = [[E.cards, 77], [E.cards + BEAT, 79], [E.slide, 81], [E.land, 84], [E.pill, 88], [E.reply1, 79], [E.reply2, 81], [E.pills, 84]];
  mel.forEach(([t, n]) => pluck(t, n, 0.05, 0.4, 0.4, 0.8));

  // =================================================================== bruitages
  whoosh(E.cards - 0.05, 0.35, 0.1, true, [0, 0]); // les cartes jaillissent
  [0, 1, 2].forEach((i) => tick(E.cards + i * 0.05, 0.08, 1500 + i * 300));
  whoosh(E.slide, 0.5, 0.09, false, [0.6, -0.6]); // la bande glisse
  sub(E.land, 140, 60, 0.25, 0.3); // la carte se soulève
  pluck(E.pill + 0.02, 91, 0.08, 0.45, 0.4, 0.8); // pastille
  whoosh(E.shrink, 0.45, 0.12, false, [-0.5, 0.5]); // l'orange se rétracte
  sub(E.shrink + 0.42, 120, 50, 0.2, 0.3);
  tick(E.sys, 0.06, 3000);
  [E.reply1, E.reply2].forEach((t) => (pluck(t + 0.02, 84, 0.09, 0.45, 0.4, 0.8), pluck(t + 0.1, 91, 0.08, 0.55, 0.4, 0.8))); // messages reçus
  [E.pills, E.pills + 0.08].forEach((t, i) => tick(t, 0.09, 1800 + i * 300));
  tick(E.click, 0.14, 2200); // clic
  for (let i = 0; i < 7; i++) tick(E.spin + 0.08 + i * 0.1, 0.03, 3600); // roue
  sparkle(E.ok + 0.02, 88, 7, 0.045, 0.06); // ✓
  sub(E.ok, 130, 45, 0.4, 0.4);
  whoosh(E.page, 0.55, 0.14, true, [-0.4, 0.4]); // la page se remplit
  impact(E.page + 0.1, 0.5);
  whoosh(E.labelOut, 0.3, 0.08, false, [0.3, -0.8]);
  // titre : un coup par mot
  [0, 1, 2].forEach((i) => sub(E.h1 + (i * BEAT) / 4, 150, 50, 0.22, 0.3));
  [0, 1, 2, 3].forEach((i) => sub(E.h2 + (i * BEAT) / 4, 150, 50, 0.22, 0.32));
  impact(E.h2 + (3 * BEAT) / 4, 0.4);
  whoosh(E.hOut, 0.4, 0.07, true, [0, 0]);
  // parcours : trois étapes montantes, arrivée
  [0.27, 0.54, 0.8].forEach((f, i) => pluck(E.route + f * (E.pin - E.route), 79 + i * 5, 0.09, 0.5, 0.4, 0.8));
  impact(E.pin, 0.55);
  kick(E.pin, 0.5);
  // logo, nom, phrase, CTA
  impact(E.mark, 0.75);
  kick(E.mark, 0.6);
  sparkle(E.mark + 0.05, 86, 8, 0.05, 0.06);
  whoosh(E.word - 0.05, 0.45, 0.1, true, [-0.6, 0.6]);
  pluck(E.tag + 0.03, 84, 0.07, 0.5, 0.4, 0.8);
  for (let t = E.mark + BEAT; t < DURATION - 0.6; t += BEAT) kick(t, 0.3 * duck(t));
  tick(E.cta, 0.1, 2300);
  pluck(E.cta + 0.03, 91, 0.09, 0.6, 0.4, 0.8);
  sparkle(E.cta + 0.06, 93, 5, 0.05, 0.04);

  // voix off
  const vb = voiceBuffers();
  if (vb) for (const v of VO) sample(v.at, vb[v.id], { gain: 1.35, wet: 0.06 });

  return mx.handle;
}

export const renderSoundtrackWav = (duration) => renderWav(scheduleSoundtrack, duration);
