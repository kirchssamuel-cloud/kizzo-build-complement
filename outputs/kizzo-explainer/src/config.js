// Configuration centrale : charte, textes (EN par défaut, ?lang=fr) et timeline.

const params = new URLSearchParams(location.search);

export const PARAMS = {
  lang: params.get('lang') === 'fr' ? 'fr' : 'en',
  exportMode: params.get('export') === '1',
  autoplay: params.get('autoplay') === '1',
  loop: params.get('loop') === '1',
  start: parseFloat(params.get('t') || '0') || 0,
  quality: ['low', 'medium', 'high'].includes(params.get('quality')) ? params.get('quality') : 'auto',
  debug: params.get('debug') === '1',
  // hauteur de rendu en mode export (1920 par défaut ; 960 pour les aperçus rapides)
  exportH: parseInt(params.get('h') || '1920', 10) || 1920,
};

export const DURATION = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Charte Kizzo : orange signature, navy, cyan du logo, Outfit / Inter, radius 20px.
export const BRAND = {
  orange: '#F97316',
  orangeLight: '#FF9D5C',
  amber: '#FAB43B',
  cyan: '#3DB5DA',
  cyanLight: '#7FD3EC',
  navy: '#0F172A',
  navyLogo: '#1E293B',
  navy2: '#152A4A',
  ink: '#0F172A',
  white: '#FFFFFF',
  mist: '#F4F8FA',
  slate: '#94A3B8',
  green: '#22C55E',
  red: '#EF4444',
  radius: 20,
};

const COPY = {
  en: {
    t1: ['Screen Time,', 'Smarter'],
    t2: ['Learn to', 'Unlock'],
    burst: 'MINUTES UNLOCKED',
    t3: ['+15 Minutes', 'Earned'],
    t4: ['You Set', 'the Rules'],
    tagline: 'Screen time earned through learning',
    kid: {
      name: 'Léo',
      hi: 'Hi Léo!',
      level: 'Level 7 · 5-day streak',
      timeLeft: 'Screen time',
      locked: 'Time’s up',
      zero: '0 min left',
      quest: 'Earn +15 min',
      questSub: 'Answer 3 questions',
      start: 'Start quiz',
      chips: ['Math', 'Science', 'Words'],
      unlocked: 'Unlocked!',
      enjoy: 'Enjoy your 15 minutes',
      synced: 'Rules updated',
      game: 'Candy Jump',
      score: 'Score',
      video: 'Space Pals · Ep. 4',
      paused: 'Locked by Kizzo',
    },
    quiz: [
      { q: '7 × 8 = ?', a: ['54', '56', '64', '48'], ok: 1, tag: 'Math' },
      { q: 'Which planet is the Red Planet?', a: ['Venus', 'Mars', 'Jupiter', 'Saturn'], ok: 1, tag: 'Science' },
      { q: 'One mouse, two …', a: ['mouses', 'mices', 'mice', 'meese'], ok: 2, tag: 'Words' },
    ],
    question: 'Question',
    of: 'of',
    parent: {
      hello: 'Good evening',
      child: 'Léo · 8 y/o',
      today: 'Today',
      limit: 'Daily limit',
      used: '1h 45 of 2h',
      schedule: 'Schedule',
      school: 'School',
      homework: 'Homework',
      bedtime: 'Bedtime',
      usage: 'This week',
      learning: 'Learning',
      quizzes: '12 quizzes',
      earned: '+90 min earned',
      rules: ['Daily limit · 2h', 'Bedtime · 8:30 pm', 'Quiz unlock · +15 min'],
      days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      online: 'Léo’s phone · synced',
    },
  },
  fr: {
    t1: ['Le temps d’écran,', 'en plus malin'],
    t2: ['Apprendre pour', 'débloquer'],
    burst: 'MINUTES DÉBLOQUÉES',
    t3: ['+15 minutes', 'gagnées'],
    t4: ['Vous fixez', 'les règles'],
    tagline: 'Le temps d’écran se gagne en apprenant',
    kid: {
      name: 'Léo',
      hi: 'Salut Léo !',
      level: 'Niveau 7 · série de 5 jours',
      timeLeft: 'Temps d’écran',
      locked: 'Temps écoulé',
      zero: '0 min',
      quest: 'Gagne +15 min',
      questSub: 'Réponds à 3 questions',
      start: 'Lancer le quiz',
      chips: ['Maths', 'Sciences', 'Mots'],
      unlocked: 'Débloqué !',
      enjoy: 'Profite de tes 15 minutes',
      synced: 'Règles mises à jour',
      game: 'Candy Jump',
      score: 'Score',
      video: 'Space Pals · Ép. 4',
      paused: 'Verrouillé par Kizzo',
    },
    quiz: [
      { q: '7 × 8 = ?', a: ['54', '56', '64', '48'], ok: 1, tag: 'Maths' },
      { q: 'Quelle est la planète rouge\u00a0?', a: ['Vénus', 'Mars', 'Jupiter', 'Saturne'], ok: 1, tag: 'Sciences' },
      { q: 'Un cheval, des …', a: ['chevals', 'chevaux', 'chevaus', 'cheveux'], ok: 1, tag: 'Mots' },
    ],
    question: 'Question',
    of: 'sur',
    parent: {
      hello: 'Bonsoir',
      child: 'Léo · 8 ans',
      today: 'Aujourd’hui',
      limit: 'Limite quotidienne',
      used: '1 h 45 sur 2 h',
      schedule: 'Planning',
      school: 'École',
      homework: 'Devoirs',
      bedtime: 'Coucher',
      usage: 'Cette semaine',
      learning: 'Apprentissage',
      quizzes: '12 quiz',
      earned: '+90 min gagnées',
      rules: ['Limite · 2 h', 'Coucher · 20 h 30', 'Quiz · +15 min'],
      days: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
      online: 'Téléphone de Léo · synchronisé',
    },
  },
};
export const T = COPY[PARAMS.lang];

/**
 * Timeline maîtresse (secondes). Chaque plan se fond dans le suivant :
 * les recouvrements sont volontaires (pas de coupe sèche hors flash).
 */
export const TL = {
  // Plan A — l'enfant joue, le compte à rebours tombe à zéro
  fadeIn: [0, 0.9],
  ticks: [0.85, 1.65, 2.45],
  zero: 2.45,
  freeze: [2.45, 3.3],
  title1: [2.95, 4.75],
  push: [2.7, 4.95],
  flash: 4.92,
  // Plan B — l'app Kizzo émerge du téléphone
  emerge: [5.25, 7.1],
  title2: [6.15, 8.55],
  cta: 8.25,
  toQuiz: [8.45, 9.35],
  // Plan C — quiz (3 questions)
  q: [
    { in: 9.05, tap: 10.35, out: 11.05 },
    { in: 11.2, tap: 12.55, out: 13.25 },
    { in: 13.4, tap: 14.75, out: 99 },
  ],
  lockIn: [14.95, 15.4],
  ringDone: 15.95,
  // Plan D — récompense
  burst: 16.05,
  burstText: [16.45, 18.35],
  toPhone: [18.1, 19.0],
  title3: [18.55, 20.35],
  // Plan E — parent
  parentIn: [20.05, 21.25],
  title4: [21.1, 24.85],
  trails: [22.0, 22.35, 22.7],
  trailDur: 1.05,
  // Plan F — logo
  converge: [25.05, 26.1],
  logoAssemble: [25.7, 27.0],
  logoLock: 27.0,
  sweep: [27.15, 28.6],
  wordmark: 27.45,
  tagline: 28.05,
};
