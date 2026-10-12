// Film « La demande » (9:16, 130 BPM, 32 temps) — recette « film de lancement » : une seule prise
// continue, 2D, sans fondu ni coupe ; chaque scène naît de la précédente (le bouton d'envoi devient
// le bol, l'orange inonde l'image depuis le bol puis se rétracte dans la bulle, le bouton devient la page).
// Histoire : l'enfant écrit à sa mère pour avoir 30 min de plus… et c'est Kizzo qui répond, avec un quiz.
import { PARAMS } from '../config.js';

export { PARAMS };
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const BPM = 130;
export const BEAT = 60 / BPM;
export const b = (n) => n * BEAT;
/** 32 temps de film + une tenue du carton final (la voix off finit la phrase de marque). */
export const DURATION = b(36);

/** Instants (s), par temps. Le temps fort (drop) tombe au temps 12. */
export const E = {
  type0: b(0.6), // première frappe
  typeEnd: b(5.6), // dernière lettre
  send: b(6), // appui sur envoyer : onde, la saisie devient une bulle, recul de caméra
  bowl: b(6.5), // le bouton d'envoi devient le bol
  cook: b(7), // « Kizzo mijote ton quiz… »
  toss: [b(8), b(9), b(9.5), b(10), b(11), b(11.5)], // matières lancées en l'air
  drop: b(12), // l'orange inonde l'image depuis le bol
  cards: b(12.15), // les cartes jaillissent du centre
  slide: b(13.5), // la bande glisse d'une carte
  land: b(14.5), // « Les fractions » se soulève
  pill: b(15), // pastille « Leçon de mardi »
  shrink: b(16), // l'orange se rétracte dans la bulle ; la carte choisie file dans son logement
  sys: b(16.5), // « Maman utilise Kizzo »
  reply1: b(17), // « Trouvé ! … »
  reply2: b(18), // « On y va ? »
  pills: b(18.5), // C'est parti / Plus tard
  cursor: b(19), // le curseur arrive
  click: b(19.5), // clic
  spin: b(19.6), // roue
  ok: b(20.5), // ✓ 30 min débloquées
  page: b(21), // le bouton devient la page
  label: b(21.5), // son libellé grossit en titre
  labelOut: b(22.5), // … puis file
  h1: b(23), // Il voulait 30 min.
  h2: b(25), // Il les a gagnées.
  hOut: b(27), // le titre s'efface par le haut
  route: b(27), // le point suit le parcours (3 étapes)
  pin: b(28.75), // le point arrive sur l'épingle
  mark: b(29), // l'épingle devient le logo
  word: b(29.5), // « kizzo » sort de derrière le logo
  tag: b(30.25), // phrase de marque
  cta: b(31), // kizzo.fr
};

/** Couleurs : toile blanc chaud, UI navy, orange signature (inondation), cyan (bouton d'envoi, bol). */
export const C = {
  canvas: '#F5F3EE',
  navy: '#0F172A',
  navy2: '#152A4A',
  orange: '#F97316',
  orangeDeep: '#EA580C',
  cyan: '#3DB5DA',
  cyanDeep: '#1F9CC2',
  white: '#FFFFFF',
  ink: '#1C2333',
  gray: '#6B7280',
  grayLight: '#E6E2DA',
  bubbleGray: '#ECE9E2',
  yellow: '#FACC15',
  green: '#22C55E',
  violet: '#8B5CF6',
  pink: '#EC4899',
};

export const T = {
  start: { cta: 'Lancer avec le son', sub: 'Kizzo · La demande (9:16)' },
  contact: 'Maman',
  prev: 'Tu as fini tes devoirs ?',
  lines: ['Maman je peux avoir', 'encore 30 min ?', 'j’ai fini mes devoirs'],
  cook: 'Kizzo mijote ton quiz…',
  subjects: [
    { n: 'Fractions', icon: 'divide', col: '#F97316' },
    { n: 'Conjugaison', icon: 'letters', col: '#8B5CF6' },
    { n: 'Histoire', icon: 'book', col: '#FACC15' },
    { n: 'Anglais', icon: 'globe', col: '#22C55E' },
    { n: 'Sciences', icon: 'atom', col: '#3DB5DA' },
    { n: 'Géographie', icon: 'school', col: '#EC4899' },
  ],
  cards: [
    { n: 'Conjugaison', d: 'Le passé composé', icon: 'letters', col: '#8B5CF6', lvl: 'CM1' },
    { n: 'Histoire', d: 'Les rois de France', icon: 'book', col: '#FACC15', lvl: 'CM1' },
    { n: 'Les fractions', d: 'Quarts, demis et tiers', icon: 'divide', col: '#F97316', lvl: 'CM1' },
  ],
  reward: '3 questions · 30 min',
  best: 'Leçon de mardi',
  sys: 'Maman utilise Kizzo',
  reply1: ['Trouvé ! Les fractions,', 'la leçon de mardi.', '3 questions = 30 min.'],
  reply2: 'On y va ?',
  go: 'C’est parti',
  later: 'Plus tard',
  done: '30 min débloquées',
  h1: ['Il', 'voulait', '30 min.'],
  h2: ['Il', 'les', 'a', 'gagnées.'],
  steps: ['1', '2', '3'],
  tag: 'Le temps d’écran se gagne en apprenant.',
  cta: 'kizzo.fr · bêta gratuite',
};
