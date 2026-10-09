// Film 2 « Les règles du jeu » (format carré 1:1) : textes et timeline.
// Le parent règle les quiz (écran réel « Règles des quiz »), l'enfant répond matière par
// matière, gagne +15 min, signature Kizzo.
import { PARAMS } from '../config.js';

export { PARAMS };
export const WIDTH = 1080;
export const HEIGHT = 1080;
export const DURATION = 32;

export const T = {
  start: { cta: 'Lancer avec le son', sub: 'Les règles du jeu, fixées par les parents.' },
  titles: {
    hook: ['15 minutes d’applis…', '…puis un quiz.'],
    rules0: ['Vous fixez', 'les règles du jeu'],
    freq: ['Un quiz toutes les', '15 minutes d’applis'],
    rules: ['Le nombre de questions', 'et les matières'],
    kid: ['Il répond,', 'matière par matière'],
    reward: ['+15 minutes d’écran,', 'bien méritées'],
  },
  tagline: 'Le temps d’écran se gagne en apprenant',
  url: 'kizzo.fr',
  apps: {
    title: 'Mes applis',
    usage: 'Temps d’applis',
    limit: '15:00',
    next: (m) => `Prochain quiz dans ${m} min`,
    names: ['Jeux', 'Vidéos', 'Musique', 'Messages', 'Dessins', 'Photos', 'Lecture', 'Sport'],
    unlocked: '+15 min débloquées',
  },
  rules: {
    title: 'Règles des quiz',
    sub: 'Comment les quiz se déclenchent',
    unlock: 'Quiz de déblocage',
    on: 'Activé',
    off: 'Désactivé',
    every: 'Un quiz toutes les…',
    freqOpts: [10, 15, 20, 30, 40, 50, 60, 90, 120],
    freqNote: (m) => ['Un quiz apparaît toutes les ', `${m} minutes`, ' d’usage des', 'applications décomptées.'],
    perQuiz: 'Questions par quiz',
    qOpts: [3, 4, 5, 6, 7, 8, 9, 10],
    qNote: (n) => ['À réussir pour terminer le quiz : ', `${n} questions`, '.'],
    subjects: 'Matières',
    subjectNames: ['Maths', 'Français', 'Histoire-Géo', 'Sciences', 'Anglais', 'Autres'],
    save: 'Enregistrer',
  },
  callouts: {
    unlock: 'Quiz de déblocage · Activé',
    freq: 'Décompté sur le temps d’applis',
    perQuiz: '5 questions à réussir',
  },
  quiz: {
    of: (i, n) => `Question ${i} sur ${n}`,
    items: [
      { subject: 0, q: 'Combien font 7 × 8 ?', options: ['54', '56', '64'], ok: 1 },
      { subject: 1, q: 'Quel est le pluriel de « cheval » ?', options: ['des chevals', 'des chevaux', 'des chevaus'], ok: 1 },
      { subject: 2, q: 'Quelle est la capitale de l’Italie ?', options: ['Rome', 'Milan', 'Naples'], ok: 0 },
      { subject: 3, q: 'Grâce à quoi les plantes fabriquent-elles leur nourriture ?', options: ['La lune', 'La lumière', 'Le vent'], ok: 1 },
      { subject: 4, q: 'Comment dit-on « pomme » en anglais ?', options: ['Pear', 'Apple', 'Peach'], ok: 1 },
    ],
  },
  result: { title: 'Quiz réussi !', score: '5 bonnes réponses sur 5', earned: 'Temps gagné', back: 'Retour à mes applis' },
};

/** Timeline (secondes). */
export const S = {
  // 1. Accroche : les applis décomptent, l'anneau se remplit, verrou
  iconsOut: [0.25, 1.35],
  usage: [0.9, 3.55],
  full: 3.55,
  iconsIn: [3.62, 4.2],
  lock: 4.0,
  whip: [4.62, 5.3],
  // 2. Règles des quiz (téléphone parent), éléments extraits en 3D
  parentIn: [4.85, 5.9],
  toggle: { out: 5.65, flip: 6.35, back: 7.0 },
  chips: { out: 7.3, sel: 7.95, tap: 8.5, back: 9.75 },
  coins: { out: 10.3, steps: [10.85, 11.2], back: 12.05 },
  subjects: { out: 12.45, stagger: 0.12, back: 14.75 },
  save: 14.45,
  // 3. Carrousel de quiz (une carte par matière)
  carousel: [14.7, 15.95],
  q: [0, 1, 2, 3, 4].map((i) => ({ front: 16.05 + i * 1.5, tap: 16.8 + i * 1.5 })),
  done: 23.35,
  // 4. Récompense : sablier, +15, les applis se libèrent
  reward: [23.45, 24.3],
  flip: [24.25, 24.95],
  plus: 24.9,
  unlock: 26.1,
  // 5. Signature
  converge: [27.9, 28.9],
  logoLock: 29.25,
  sweep: [29.4, 30.8],
  wordmark: 29.6,
  tagline: 30.15,
  cta: 30.7,
};

/** Fenêtres des titres. */
export const TITLES = {
  hook: { win: [0.55, 4.6], starts: [0.55, 3.62] },
  rules0: { win: [5.45, 7.2] },
  freq: { win: [7.25, 10.05] },
  rules: { win: [10.3, 14.7] },
  kid: { win: [15.9, 20.6] },
  reward: { win: [24.85, 27.75] },
};
