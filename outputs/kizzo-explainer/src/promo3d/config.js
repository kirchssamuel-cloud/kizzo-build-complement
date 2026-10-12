// Promo 3D « La reconstruction » (9:16, 16,3 s, 120 BPM) — à coller derrière l'accroche filmée
// où un téléphone se fait écraser. Concept : le téléphone écrasé se reconstruit, et cette fois
// il fait apprendre. Chaque plan naît du précédent ; un évènement par temps.
import { PARAMS } from '../config.js';

export { PARAMS };
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 16.3;

export const BPM = 120;
export const BEAT = 60 / BPM;
/** Premier temps fort : les éclats se recollent. */
export const DROP = 1.0;
/** Temps n après le temps fort (0 = recollage). */
export const b = (n) => DROP + n * BEAT;

/** Instants (s). Une mesure = 4 temps = 2 s. */
export const E = {
  glow: 0.45, // l'orange revient derrière les fissures, les éclats lévitent
  snap: b(0), // les éclats se recollent : PAS BESOIN
  w2: b(0.5), // D'EN ARRIVER
  w3: b(1), // LÀ.
  splash: b(2), // l'écran affiche le logo, les mots s'envolent
  game: b(3), // le jeu de l'enfant (fond navy)
  lock: b(4), // « C'est l'heure d'un quiz ! » sort de l'écran
  tapLock: b(5),
  quiz: b(6), // la question et les réponses sortent en 3D
  tapAnswer: b(7),
  plus15: b(8), // +15 en relief (fond orange)
  result: b(9),
  spin: b(10), // le téléphone tourne sur lui-même : côté parent (fond clair)
  parent: b(10.5),
  you1: b(11), // ET C'EST TOI
  you2: b(12), // QUI FIXES LES RÈGLES.
  chips: b(12), // puces de fréquence
  pick: b(13), // 15 min
  toggle: b(14), // quiz de déblocage
  chart: b(15), // courbe de progression 3D
  notif: b(16), // « Ben a gagné 15 min »
  pull: b(17),
  s1: b(18), // LE TEMPS D'ÉCRAN — dernière mesure, la plus forte
  s2: b(19), // SE GAGNE
  s3: b(20), // EN APPRENANT.
  s4: b(21),
  logo: b(22), // logo en relief
  word: b(22.5),
  cta: b(24), // Télécharger Kizzo
  tapCta: b(26),
};

export const T = {
  start: { cta: 'Lancer avec le son', sub: 'Kizzo · promo 9:16' },
  w: ['PAS BESOIN', 'D’EN ARRIVER', 'LÀ.'],
  play: ['IL VEUT', 'JOUER ?'],
  learn: ['IL RÉPOND', 'D’ABORD.'],
  you: ['ET C’EST TOI', 'QUI FIXES', 'LES RÈGLES.'],
  sig: ['LE TEMPS', 'D’ÉCRAN', 'SE GAGNE', 'EN APPRENANT.'],
  quiz: { subject: 'MATHS', of: 'Question 1 / 3', q: ['Combien font', '7 × 8 ?'], options: ['54', '56', '64', '48'], ok: 1 },
  plus: '+15 MIN DE JEU',
  chips: ['10 min', '15 min', '20 min', '30 min'],
  toggle: { title: 'Quiz de déblocage', sub: 'Avant chaque session de jeu' },
  chart: { title: 'Progression de Ben', value: '92 %', sub: 'de bonnes réponses' },
  notif: { app: 'KIZZO', title: 'Ben a gagné 15 min', body: 'Quiz de maths réussi · 3/3' },
  tagline: 'Le temps d’écran se gagne en apprenant',
  cta: 'Télécharger Kizzo',
};

/** Charte : orange, navy, cyan du logo, blanc. */
export const COL = {
  orange: '#F97316',
  navy: '#0F172A',
  navy2: '#152A4A',
  cyan: '#3DB5DA',
  white: '#FFFFFF',
  light: '#F3F0EA',
  black: '#05070C',
};
