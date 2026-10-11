// Bande-son du « Crash test » : nappe grave et battements de cœur pendant le ralenti, riser,
// arrêt sur image (bande qui ralentit, puis silence : il ne se passe rien), aspiration, puis
// morceau à 120 BPM (fa – sol – la m – fa – sol – do) où chaque évènement de l'interface tombe
// sur un temps et a son propre son.
import { DROP, FREEZE, M, b, BEAT, DURATION, SHOT, T } from './config.js';
import { sliderDetents } from './motion.js';
import { createMixer, renderWav } from '../audio-core.js';

export function scheduleSoundtrack(ctx, out, t0, offset = 0) {
  const mx = createMixer(ctx, out, t0, offset);
  const { pad, sub, noiseHit, pluck, kick, tick, whoosh, riser, impact, sparkle } = mx;

  // =================================================================== 1. ralenti (0 – 11,6 s)
  // nappe sombre qui s'épaissit, coupée net à l'arrêt sur image
  pad(0, FREEZE, [33, 40, 45], 0.055, 420, 1.2, 0.08, 0.7);
  pad(5.0, FREEZE - 5.0, [52, 57], 0.022, 900, 3.0, 0.08, 0.8);
  // couche médium audible sur un haut-parleur de téléphone : la tension monte jusqu'au gel
  pad(2.0, FREEZE - 2.0, [57, 64, 69], 0.018, 1600, 6.0, 0.06, 0.7);
  // tic-tac (calé sur la grille du morceau) qui s'arrête net au gel
  for (let t = 0.5; t < FREEZE - 0.05; t += BEAT) tick(t, t > 8 ? 0.035 : 0.025, 3800);
  noiseHit(0, FREEZE, { type: 'lowpass', f0: 500, f1: 1400, q: 0.5, gain: 0.03, attack: 8, wet: 0.6 });
  // bip d'enregistrement de la caméra rapide
  pluck(0.12, 93, 0.05, 0.12, 0.2, 0.3);
  pluck(0.3, 93, 0.05, 0.12, 0.2, 0.3);
  // cœur : de plus en plus présent
  for (let t = 0.5; t < FREEZE - 0.3; t += 1.0) {
    const g = 0.1 + 0.07 * (t / 11);
    sub(t, 90, 45, 0.2, g);
    sub(t + 0.19, 80, 42, 0.22, g * 0.7);
    // attaque médium (le « toc » du cœur s'entend aussi sur un petit haut-parleur)
    noiseHit(t, 0.12, { type: 'lowpass', f0: 420, f1: 120, q: 0.8, gain: 0.09, attack: 0.004, wet: 0.2 });
    noiseHit(t + 0.19, 0.12, { type: 'lowpass', f0: 360, f1: 110, q: 0.8, gain: 0.06, attack: 0.004, wet: 0.2 });
  }
  // coupes : souffle grave
  for (const t of [SHOT.side[0], SHOT.macro[0], SHOT.orbit[0], SHOT.extreme[0]]) {
    noiseHit(t - 0.05, 0.5, { type: 'lowpass', f0: 1800, f1: 120, q: 0.6, gain: 0.07, wet: 0.5 });
    sub(t, 110, 40, 0.4, 0.12);
  }
  // apparitions de texte
  T.lines.forEach((l) => !l.big && tick(l.at, 0.05, 2400));
  // « 1 image avant l'impact » : la tension monte…
  tick(10.6, 0.08, 3000);
  riser(10.6, FREEZE - 10.6, 0.2);
  noiseHit(10.8, FREEZE - 10.8, { type: 'bandpass', f0: 3000, f1: 9000, q: 6, gain: 0.03, attack: 0.95, wet: 0.4 });

  // =================================================================== 2. … et il ne se passe rien
  // arrêt sur image : la bande ralentit et meurt, puis silence
  sub(FREEZE, 420, 26, 0.55, 0.32);
  sub(FREEZE, 210, 18, 0.6, 0.22);
  noiseHit(FREEZE, 0.5, { type: 'lowpass', f0: 4000, f1: 80, q: 1.2, gain: 0.12, attack: 0.004, wet: 0.2 });
  tick(FREEZE + 0.02, 0.07, 900);
  // aspiration vers la forme (souffle inversé), la forme naît sur le temps
  noiseHit(DROP - 0.35, M.seed - DROP + 0.35, { type: 'bandpass', f0: 300, f1: 6500, q: 1.1, gain: 0.26, attack: M.seed - DROP + 0.3, wet: 0.5 });
  sub(DROP - 0.3, 40, 120, M.seed - DROP + 0.3, 0.18);
  pluck(M.seed, 84, 0.12, 0.35, 0.4, 0.8);
  kick(M.seed, 0.4);

  // =================================================================== 3. morceau 120 BPM
  const BAR = BEAT * 4;
  const prog = [
    // [début, accord (nappe), basse]
    [b(4), [53, 57, 60, 64], 41], // fa maj7
    [b(8), [55, 59, 62, 67], 43], // sol
    [b(12), [57, 60, 64, 67], 45], // la m7
    [b(16), [53, 57, 60, 64], 41], // fa maj7
    [b(20), [55, 59, 62, 67], 43], // sol
    [b(24), [48, 55, 60, 64, 62], 36], // do add9 (logo)
  ];
  // plein cadre orange (« Mais t'es encore là. ») : accord frappé ; logo sur le temps suivant
  impact(M.bleed, 0.5);
  pad(M.bleed, 0.9, [53, 60, 64, 69], 0.06, 2600, 0.01, 0.5, 0.5);
  kick(M.bleed, 0.5);
  noiseHit(M.bleed, 0.5, { type: 'highpass', f0: 6000, f1: 4000, gain: 0.08, wet: 0.7 });
  kick(M.brand, 0.5);
  sparkle(M.brand + 0.02, 86, 6, 0.04, 0.05);
  pad(M.brand, 0.5, [55, 62, 67, 71], 0.05, 2600, 0.01, 0.4, 0.5);

  prog.forEach(([at, chord, root], i) => {
    const last = i === prog.length - 1;
    pad(at, last ? BAR + 1.1 : BAR - 0.05, chord, last ? 0.05 : 0.038, last ? 2400 : 1700, 0.04, last ? 1.4 : 0.3, 0.55);
    // basse en croches
    for (let k = 0; k < 8; k++) {
      const t = at + k * (BEAT / 2);
      if (last && k > 0) break;
      pluck(t, root + (k % 2 ? 12 : 0), last ? 0.16 : 0.1, last ? 1.6 : 0.24, 0.12, 0.5);
    }
    // arpège en doubles croches (mesures 3 à 6)
    if (i >= 1 && i <= 4) {
      for (let k = 0; k < 16; k++) {
        const n = chord[[0, 2, 1, 3][k % 4]] + 12 + (k >= 8 ? 12 : 0) * (i % 2);
        pluck(at + k * (BEAT / 4), n, 0.022 + (k % 4 === 0 ? 0.01 : 0), 0.22, 0.45, 0.8);
      }
    }
  });
  // batterie
  for (let t = M.play; t < b(24) - 0.01; t += BEAT) {
    kick(t, 0.42);
    const n = Math.round((t - DROP) / BEAT);
    if (n % 2 === 1) {
      noiseHit(t, 0.13, { type: 'bandpass', f0: 1700, f1: 1300, q: 0.9, gain: 0.13, attack: 0.002, wet: 0.35 });
      noiseHit(t, 0.06, { type: 'highpass', f0: 5000, f1: 5000, gain: 0.06, wet: 0.2 });
    }
    noiseHit(t + BEAT / 2, 0.045, { type: 'highpass', f0: 8000, f1: 8000, gain: 0.035, wet: 0.15 });
    if (t >= b(12)) noiseHit(t + BEAT / 4, 0.03, { type: 'highpass', f0: 9000, f1: 9000, gain: 0.016, wet: 0.1 });
    if (t >= b(12)) noiseHit(t + (BEAT * 3) / 4, 0.03, { type: 'highpass', f0: 9000, f1: 9000, gain: 0.016, wet: 0.1 });
  }
  // mesure 7 : demi-temps, la signature respire
  kick(b(24), 0.55);
  kick(b(26), 0.4);
  // fin
  impact(b(28), 0.55);
  kick(b(28), 0.5);
  pad(b(28), DURATION - b(28), [36, 48, 55, 60, 64, 67, 74], 0.05, 2800, 0.02, 1.2, 0.7);
  sparkle(b(28) + 0.02, 88, 7, 0.05, 0.05);

  // =================================================================== 4. sons de l'interface
  const click = (t) => {
    tick(t, 0.11, 2300);
    noiseHit(t, 0.02, { type: 'highpass', f0: 6000, f1: 6000, gain: 0.08, wet: 0.05 });
  };
  [M.tapPlay, M.tapQuiz, M.tapAnswer, M.tapToggle, M.tapTab, M.drag, M.tapCta].forEach(click);
  // chaque métamorphose de la forme : petit souffle
  [M.bleed, M.brand, M.play, M.loader, M.lock, M.tapQuiz, M.reward, M.countdown, M.settings, M.tabs, M.chart, M.slider, M.toast, M.dot, M.logo].forEach((t, i) =>
    whoosh(t - 0.06, 0.22, 0.05, i % 2 === 0, i % 2 ? [0.4, -0.3] : [-0.4, 0.3])
  );
  // chargement
  for (let i = 0; i < 4; i++) tick(M.loader + 0.05 + i * 0.11, 0.025, 3600);
  // bonne réponse
  pluck(M.tapAnswer + 0.02, 79, 0.08, 0.4, 0.4, 0.8);
  pluck(M.tapAnswer + 0.08, 84, 0.08, 0.5, 0.4, 0.8);
  sparkle(M.tapAnswer + 0.1, 91, 5, 0.035, 0.04);
  // +15:00 qui compte
  for (let i = 0; i < 7; i++) tick(M.reward + 0.05 + i * 0.045, 0.04, 2600 + i * 180);
  pluck(M.reward + 0.36, 91, 0.06, 0.4, 0.5, 0.8);
  tick(M.countdown + 0.43, 0.04, 1800);
  // interrupteur, onglets
  pluck(M.tapToggle + 0.03, 86, 0.05, 0.2, 0.3, 0.6);
  whoosh(M.tapTab, 0.16, 0.04, true, [-0.3, 0.3]);
  // la courbe se trace : notes montantes sur chaque point
  for (let i = 0; i < 7; i++) {
    const t = Math.max(M.chart + 0.08 + (i / 6) * (M.dots + 0.34 - M.chart - 0.08), M.dots - 0.05 + i * 0.03);
    pluck(t, [72, 74, 76, 79, 81, 84, 86][i], 0.035, 0.25, 0.4, 0.7);
  }
  pluck(M.tooltip + 0.02, 88, 0.05, 0.3, 0.4, 0.7);
  // crans du curseur de réglage
  sliderDetents().forEach((t) => tick(t, 0.06, 3200));
  tick(M.release, 0.06, 1500);
  // notification
  pluck(M.toast + 0.08, 88, 0.07, 0.35, 0.4, 0.8);
  pluck(M.toast + 0.18, 93, 0.07, 0.5, 0.4, 0.8);
  // repli en pastille, logo, nom, signature
  sub(M.dot, 120, 50, 0.3, 0.3);
  impact(M.logo, 0.4);
  sparkle(M.logo + 0.03, 84, 6, 0.04, 0.05);
  for (let i = 0; i < 5; i++) tick(M.word + i * 0.045, 0.035, 2000 + i * 200);
  whoosh(M.tagline, 0.4, 0.035, true);
  pluck(M.cta + 0.02, 84, 0.06, 0.4, 0.4, 0.7);

  return mx.handle;
}

export const renderSoundtrackWav = (duration) => renderWav(scheduleSoundtrack, duration);
