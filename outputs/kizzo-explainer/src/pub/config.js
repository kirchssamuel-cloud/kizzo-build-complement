// Pub 9:16 « 23:47 » pour Facebook / Instagram / TikTok — format natif, vu à travers le
// téléphone du parent : écran verrouillé de nuit, dispute par SMS, bascule typographique,
// démo de l'app en plein écran, signature. Voix off grave + sous-titres incrustés.
import { PARAMS } from '../config.js';

export { PARAMS };
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 30.2;

/** Scènes (s). */
export const S = {
  lock: [0, 4.85],
  chat: [4.85, 10.3],
  turn: [10.3, 13.1],
  kid: [13.1, 17.2],
  parent: [17.2, 22.45],
  outro: [22.45, 30.2],
};

export const T = {
  start: { cta: 'Lancer avec le son', sub: 'Pub 9:16 · voix off · sous-titres' },
  child: 'Ben',
  lock: {
    date: 'mercredi 8 octobre',
    time: '23:47',
    // la plus récente en haut ; `at` = apparition
    notifs: [
      { app: 'TEMPS D’ÉCRAN', title: 'Ben · 6 h 42 aujourd’hui', body: '2 h de plus qu’hier', icon: 'hourglass', at: -0.3, hot: true },
      { app: 'CANDY JUMP', title: 'Ben a battu son record !', body: 'Niveau 48 · il joue depuis 3 h', icon: 'game', at: 1.25 },
      { app: 'MESSAGES', title: 'Ben', body: 'jdors bientot promis', icon: 'msg', at: 2.85 },
    ],
  },
  chat: {
    status: 'en ligne',
    input: 'Message',
    msgs: [
      { who: 'me', text: 'Tu dors ?', at: 5.15 },
      { who: 'kid', text: 'oui', at: 6.05, typing: 5.55 },
      { who: 'me', text: 'Tu es en ligne depuis 6 h.', at: 6.8 },
      { who: 'kid', text: 'encore 5 min stp', at: 7.75, typing: 7.2 },
      { who: 'me', text: 'Lâche ce téléphone. Tout\u00a0de\u00a0suite.', at: 8.45 },
      { who: 'kid', text: 't’es pas juste', at: 9.4, typing: 8.95 },
    ],
  },
  turn: [
    { w: 'Et si,', at: 10.45 },
    { w: 'pour jouer…', at: 10.95 },
    { w: 'il devait', at: 11.75 },
    { w: 'd’abord', at: 12.05 },
    { w: 'apprendre ?', at: 12.4, hot: true },
  ],
  quiz: { subject: 'MATHS', of: 'Question 1 sur 3', q: 'Combien font 7 × 8 ?', options: ['54', '56', '64', '48'], ok: 1 },
  result: { title: 'Bien joué !', unlocked: 'Temps de jeu débloqué', back: 'Retour au jeu' },
  outro: { fight: 'Fini les', fightWord: 'disputes.', tagline: 'Le temps d’écran se gagne en apprenant', cta: 'Télécharger Kizzo' },
};

/** Démos (s). */
export const K = { zero: 13.62, lock: 13.66, tapCta: 14.15, quiz: 14.42, tapOk: 15.05, result: 15.75, back: 16.65 };
export const PD = { scan: [17.35, 18.4], shutter: 18.5, read: 18.65, questions: 19.35, rules: 20.6, tap15: 21.1 };
export const OUT = { fight: 22.55, strike: 23.2, logo: 23.9, word: 24.05, tagline: 24.35, cta: 26.6 };

/**
 * Voix off (Piper « tom », voix grave retraitée) : une phrase par fichier, posée à `at`.
 * `cap` : sous-titre (null = pas de sous-titre, le texte est déjà à l'écran),
 * `pos` : 'top' | 'bottom', `hl` : mots mis en valeur.
 */
export const VO = [
  { id: 'v01', at: 0.15, cap: 'Il est 23 h 47.', pos: 'bottom', hl: ['23', 'h', '47.'] },
  { id: 'v02', at: 2.45, cap: 'Et votre enfant… est encore sur son téléphone.', pos: 'bottom', hl: ['téléphone.'] },
  { id: 'v03', at: 5.0, cap: 'Chaque soir, c’est la même bataille.', pos: 'top', hl: ['bataille.'] },
  { id: 'v04', at: 7.4, cap: 'Les cris. Les négociations. Les portes qui claquent.', pos: 'top', hl: ['cris.', 'claquent.'] },
  { id: 'v05', at: 10.45, cap: null },
  { id: 'v06', at: 13.2, cap: 'Avec Kizzo, son téléphone se débloque en répondant à des quiz.', pos: 'bottom', hl: ['Kizzo,', 'quiz.'] },
  { id: 'v07', at: 17.4, cap: 'Vous photographiez ses leçons. Kizzo en fait des quiz.', pos: 'bottom', hl: ['leçons.', 'quiz.'] },
  { id: 'v08', at: 20.7, cap: 'Et c’est vous qui fixez les règles.', pos: 'bottom', hl: ['règles.'] },
  { id: 'v09', at: 22.55, cap: null },
  { id: 'v10', at: 24.0, cap: null },
  { id: 'v11', at: 26.65, cap: null },
];
