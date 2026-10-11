// Film « Crash test » 9:16 : accroche-appât en 3D réaliste (un crayon tombe au ralenti sur
// l'écran d'un téléphone… et se fige à une image de l'impact : il ne se passe rien), puis
// motion design calé sur la musique (120 BPM, 7 mesures, un évènement par temps) : une seule
// forme, jamais coupée, se transforme d'un écran Kizzo à l'autre.
import { PARAMS } from '../config.js';

export { PARAMS };
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 27.6;

/** Grille musicale : le motion design démarre sur le premier temps de la mesure 1. */
export const BPM = 120;
export const BEAT = 60 / BPM;
export const DROP = 12.5;
/** Le crayon se fige à une image de l'écran : l'impact n'aura jamais lieu. */
export const FREEZE = 11.6;
/** Instant du temps n (0 = départ du motion design). */
export const b = (n) => DROP + n * BEAT;
/**
 * Variante « promo seule » (définie à la compilation) : la vidéo commence au temps fort,
 * pour être collée derrière une accroche filmée (vidéo réaliste générée par IA).
 */
export const START = typeof __CRASH_START__ === 'undefined' ? 0 : __CRASH_START__;

/** Plans de l'accroche (s). */
export const SHOT = {
  wide: [0, 2.0],
  side: [2.0, 5.0],
  macro: [5.0, 8.5],
  orbit: [8.5, 11.0],
  extreme: [11.0, DROP],
};

/** Hauteur de la pointe au-dessus du verre (unités scène, 1 ≈ 9,6 cm) : ralentis successifs. */
export const FALL = [
  [0, 0.85],
  [2.0, 0.2],
  [5.0, 0.07],
  [8.5, 0.035],
  [11.0, 0.012],
  [FREEZE, 0.0016],
];

/** Instants du motion design. */
export const M = {
  seed: b(0.25), // l'image figée est aspirée, la forme naît
  bleed: b(1), // plein cadre orange : « Mais t'es encore là. »
  brand: b(2), // logo Kizzo
  play: b(3), // bouton « Jouer » (fond gris chaud révélé)
  tapPlay: b(4),
  loader: b(5),
  lock: b(6),
  lockBtn: b(7),
  tapQuiz: b(8),
  options: b(9),
  tapAnswer: b(10),
  reward: b(11),
  countdown: b(12),
  settings: b(13),
  tapToggle: b(13.5),
  tabs: b(14),
  tapTab: b(15),
  chart: b(16),
  dots: b(17),
  tooltip: b(18),
  slider: b(19),
  drag: b(20),
  release: b(21),
  toast: b(22),
  dot: b(23),
  logo: b(24),
  word: b(25),
  tagline: b(26),
  cta: b(27),
  tapCta: b(28),
};

export const T = {
  start: { cta: 'Lancer avec le son', sub: 'Crash test · 9:16' },
  hud: { title: 'CRASH TEST N°01', sub: 'Crayon HB  ×  écran de smartphone', fps: '1 000 IMG/S', slow: 'RALENTI ×1000', pause: 'PAUSE' },
  // compteur : le spectateur regarde depuis t secondes
  lines: [
    { at: 3.4, until: FREEZE, a: 'Tu regardes un crayon tomber', b: ['depuis ', '#', ' secondes.'] },
    { at: 6.6, until: FREEZE, a: 'Et tu regardes encore.', small: true },
    { at: FREEZE + 0.1, until: DROP, a: 'Il ne va rien', b: ['se ', '*passer.'], big: true },
  ],
  // derrière l'accroche filmée (téléphone écrasé), la phrase fait le pont vers Kizzo
  still: START > 0 ? ['Pas besoin', 'd’en arriver là.'] : ['Mais t’es', 'encore là.'],
  impactLabel: '1 image avant l’impact',
  // sous-titres du motion design (un mot ou groupe par temps)
  caps: [
    { at: b(3), until: b(8) - 0.04, words: [['Et si, pour jouer,', b(3)], ['il devait d’abord', b(5)], ['*apprendre ?', b(6)]] },
    { at: b(8), until: b(13) - 0.04, words: [['Une bonne réponse', b(8)], ['= *15 min de jeu.', b(11)]] },
    { at: b(13), until: b(23.6), words: [['Et c’est *toi', b(13)], ['qui fixes les règles.', b(14)]] },
  ],
  ui: {
    play: 'Jouer',
    lockTitle: ['C’est l’heure', 'd’un quiz !'],
    lockSub: 'Réponds pour débloquer ton jeu.',
    lockBtn: 'Faire un quiz',
    subject: 'MATHS',
    of: 'Question 1 / 3',
    q: ['Combien font', '7 × 8 ?'],
    options: ['54', '56', '64', '48'],
    ok: 1,
    reward: '+15:00',
    rewardSub: 'de jeu débloquées',
    timer: 'Temps de jeu',
    setting: 'Quiz de déblocage',
    settingSub: 'Avant chaque session de jeu',
    tabs: ['Maths', 'Français', 'Sciences'],
    chartTitle: 'Progression de Ben',
    chartSub: 'Bonnes réponses · 7 jours',
    tooltip: '92 % de réussite',
    sliderLabel: 'Un quiz toutes les',
    sliderStops: [5, 10, 15, 20, 30],
    toast: 'Ben a gagné 15 min',
    toastSub: 'Quiz de maths · 3/3',
    tagline: 'Le temps d’écran se gagne en apprenant',
    cta: 'Télécharger Kizzo',
  },
};

/** Palette du motion design : gris chaud, noir, blanc, un seul accent (orange Kizzo). */
export const C = {
  bg: '#E8E4DD',
  ink: '#121417',
  ink2: '#5C5F66',
  line: '#D9D4CC',
  white: '#FFFFFF',
  orange: '#F97316',
  night: '#05080F',
};
