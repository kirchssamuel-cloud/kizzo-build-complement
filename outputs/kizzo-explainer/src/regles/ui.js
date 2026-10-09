// Écrans du film « Les règles du jeu » : écran parent « Règles des quiz » (d'après la
// capture réelle), accueil enfant avec ses applis, cartes de quiz par matière, résultat,
// et faces des objets 3D (puces, jetons, icônes d'applis).
import { rr, txt, disp, icon, shadow, noShadow, statusBar, F_BODY, F_DISPLAY, F_NUM } from '../ui-canvas.js';
import { K, P, appBg, avatar, button, ic, wrap, lockedCard, lightBg, rgba, darkCard, lightCard, tapRipple } from '../ui-kizzo.js';
import { clamp, lerp, TAU } from '../util.js';
import { T } from './config.js';

// couleurs de l'écran réel « Règles des quiz »
export const R = {
  cyan: '#2E9FC0',
  chip: '#D5DEE3',
  chipInk: '#3C5866',
  note: '#EEF4F7',
  ink: '#102B3B',
  muted: '#6F818B',
  orange: '#EC6A2C',
  off: '#C9D3D8',
};

/** Couleur de chaque matière (pastilles, cartes, illustrations). */
export const SUBJECT_COL = ['#3DB4D9', '#F97316', '#22B07D', '#A78BFA', '#F25C7A', '#FAB43B'];

const mix = (c1, c2, k) => {
  const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const A = p(c1), B = p(c2);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(k)))).join(',')})`;
};

// ===========================================================================
// Icônes d'applis (grille de l'enfant + faces des tuiles 3D)

export const APP_COL = [
  ['#A78BFA', '#6D28D9'],
  ['#F87171', '#DC2626'],
  ['#F472B6', '#DB2777'],
  ['#4ADE80', '#16A34A'],
  ['#FDBA74', '#EA580C'],
  ['#FCD34D', '#F59E0B'],
  ['#7DD3FC', '#0284C7'],
  ['#93C5FD', '#2563EB'],
];

function appGlyph(ctx, i, s) {
  // glyphe blanc centré dans un carré de côté s (origine au centre)
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const u = s / 24;
  ctx.save();
  ctx.scale(u, u);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (i === 0) {
    // manette
    rr(ctx, -9, -5, 18, 10, 5);
    ctx.fill();
    ctx.fillStyle = APP_COL[0][1];
    ctx.fillRect(-6.4, -0.6, 4.6, 1.3);
    ctx.fillRect(-4.75, -2.3, 1.3, 4.6);
    ctx.beginPath();
    ctx.arc(4.2, -1.3, 1, 0, TAU);
    ctx.arc(6.2, 0.9, 1, 0, TAU);
    ctx.fill();
  } else if (i === 1) {
    // lecture vidéo
    ctx.moveTo(-4, -6.5);
    ctx.lineTo(7, 0);
    ctx.lineTo(-4, 6.5);
    ctx.closePath();
    ctx.fill();
  } else if (i === 2) {
    // note de musique
    ctx.arc(-3.5, 5, 3, 0, TAU);
    ctx.fill();
    ctx.fillRect(-1.1, -7, 2.2, 12);
    ctx.beginPath();
    ctx.moveTo(-0.5, -7);
    ctx.quadraticCurveTo(5, -6, 6, -2.5);
    ctx.quadraticCurveTo(3, -4, -0.5, -3.6);
    ctx.fill();
  } else if (i === 3) {
    // bulle de message
    rr(ctx, -8, -7, 16, 12, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-4, 4);
    ctx.lineTo(-6, 8.5);
    ctx.lineTo(1, 4);
    ctx.fill();
  } else if (i === 4) {
    // pinceau
    ctx.save();
    ctx.rotate(-0.7);
    rr(ctx, -1.6, -9, 3.2, 10, 1.4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2.6, 1.5);
    ctx.quadraticCurveTo(-3, 7, 0, 8.5);
    ctx.quadraticCurveTo(3, 7, 2.6, 1.5);
    ctx.fill();
    ctx.restore();
  } else if (i === 5) {
    // appareil photo
    rr(ctx, -8.5, -5, 17, 12, 3);
    ctx.fill();
    rr(ctx, -3.5, -7.5, 7, 3, 1);
    ctx.fill();
    ctx.fillStyle = APP_COL[5][1];
    ctx.beginPath();
    ctx.arc(0, 1, 3.6, 0, TAU);
    ctx.fill();
  } else if (i === 6) {
    // livre
    ctx.moveTo(0, -5);
    ctx.quadraticCurveTo(-4, -7.5, -8.5, -6);
    ctx.lineTo(-8.5, 6);
    ctx.quadraticCurveTo(-4, 4.5, 0, 7);
    ctx.quadraticCurveTo(4, 4.5, 8.5, 6);
    ctx.lineTo(8.5, -6);
    ctx.quadraticCurveTo(4, -7.5, 0, -5);
    ctx.fill();
    ctx.strokeStyle = APP_COL[6][1];
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -4.5);
    ctx.lineTo(0, 6.5);
    ctx.stroke();
  } else {
    // ballon
    ctx.arc(0, 0, 7.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = APP_COL[7][1];
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, TAU);
    ctx.moveTo(-7.5, 0);
    ctx.lineTo(7.5, 0);
    ctx.moveTo(0, -7.5);
    ctx.quadraticCurveTo(-5, 0, 0, 7.5);
    ctx.moveTo(0, -7.5);
    ctx.quadraticCurveTo(5, 0, 0, 7.5);
    ctx.stroke();
  }
  ctx.restore();
}

/** Icône d'appli (squircle dégradé + glyphe) centrée en (cx, cy). */
export function drawAppIcon(ctx, i, cx, cy, s, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const g = ctx.createLinearGradient(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2);
  g.addColorStop(0, APP_COL[i][0]);
  g.addColorStop(1, APP_COL[i][1]);
  ctx.fillStyle = g;
  rr(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.28);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  rr(ctx, cx - s / 2 + 2, cy - s / 2 + 2, s - 4, s * 0.42, s * 0.24);
  ctx.fill();
  ctx.translate(cx, cy);
  appGlyph(ctx, i, s * 0.62);
  ctx.restore();
}

/** Face d'une tuile 3D : icône pleine page (bords arrondis transparents). */
export function appTileFace(ctx, W, H, i) {
  drawAppIcon(ctx, i, W / 2, H / 2, W);
}

// ===========================================================================
// Accueil enfant : applis, temps décompté, verrou

export const KID_GRID = Array.from({ length: 8 }, (_, i) => [52 + (i % 4) * 95, 330 + Math.floor(i / 4) * 118]);
export const APP_ICON_PX = 66;

/**
 * @param {object} s
 * @param {number} s.used minutes d'applis utilisées (0..15)
 * @param {number} s.out 0..1 — les 6 premières icônes ont quitté l'écran (tuiles 3D)
 * @param {number} s.lock 0..1 — écran de verrouillage
 * @param {number} s.unlocked 0..1 — +15 min débloquées
 */
export function kidAppsScreen(ctx, W, H, s = {}) {
  const { used = 0, out = 0, lock = 0, unlocked = 0, t = 0 } = s;
  appBg(ctx, W, H);
  statusBar(ctx, '#fff', '16:42');
  txt(ctx, T.apps.title, 24, 92, disp({ size: 28, weight: 700 }));
  avatar(ctx, W - 50, 82, 42, 'B', K.cyan);

  // widget « Temps d'applis »
  const wy = 120;
  const warn = clamp((used - 12) / 3) * (1 - unlocked);
  darkCard(ctx, 20, wy, W - 40, 150, 24, { bg: rgba(K.surface, 0.5), border: unlocked > 0 ? rgba(K.green, 0.5 * unlocked) : rgba(K.orange, 0.15 + warn * 0.5), glow: unlocked > 0 ? 14 * unlocked : 0 });
  ic.hourglass(ctx, 40, wy + 22, 20, unlocked > 0.5 ? K.green : K.cyan);
  txt(ctx, T.apps.usage, 68, wy + 38, { size: 14, weight: 600, color: K.inkSoft, font: F_BODY });
  const shown = unlocked > 0.5 ? 0 : used;
  const mm = Math.floor(shown), ss = Math.floor((shown - mm) * 60);
  const clock = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  txt(ctx, clock, 40, wy + 92, { size: 46, weight: 700, color: warn > 0.5 ? K.orangeLight : K.ink, font: F_NUM });
  ctx.font = `700 46px ${F_NUM}`;
  const cw = ctx.measureText(clock).width;
  txt(ctx, ` / ${T.apps.limit}`, 40 + cw, wy + 92, { size: 20, weight: 700, color: K.inkMuted, font: F_NUM });
  // barre
  const bx = 40, by = wy + 108, bw = W - 80;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  rr(ctx, bx, by, bw, 10, 5);
  ctx.fill();
  const k = clamp(shown / 15);
  if (k > 0) {
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, K.cyan);
    g.addColorStop(1, K.orange);
    ctx.fillStyle = g;
    rr(ctx, bx, by, Math.max(10, bw * k), 10, 5);
    ctx.fill();
  }
  if (unlocked > 0) {
    ctx.save();
    ctx.globalAlpha = unlocked;
    txt(ctx, T.apps.unlocked, bx, wy + 140, { size: 14, weight: 700, color: K.green, font: F_BODY });
    ctx.restore();
  } else {
    txt(ctx, T.apps.next(Math.max(0, Math.ceil(15 - used))), bx, wy + 140, { size: 13, weight: 500, color: K.inkMuted, font: F_BODY });
  }

  // grille d'applis (les 6 premières deviennent des tuiles 3D quand elles sortent)
  KID_GRID.forEach(([x, y], i) => {
    const gone = i < 6 ? out : 0;
    if (gone > 0) {
      ctx.save();
      ctx.globalAlpha = gone * 0.8;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1.5;
      rr(ctx, x - APP_ICON_PX / 2, y - APP_ICON_PX / 2, APP_ICON_PX, APP_ICON_PX, 18);
      ctx.stroke();
      ctx.restore();
    }
    drawAppIcon(ctx, i, x, y, APP_ICON_PX, 1 - gone);
    txt(ctx, T.apps.names[i], x, y + 52, { size: 12.5, weight: 600, color: K.inkSoft, align: 'center', font: F_BODY });
  });

  // carte « Kizzo » en bas
  darkCard(ctx, 20, 572, W - 40, 70, 22, { bg: rgba(K.surface, 0.4), border: rgba(K.cyan, 0.25) });
  ic.sparkles(ctx, 40, 594, 24, K.cyan);
  txt(ctx, 'Quiz Kizzo', 76, 604, disp({ size: 16, weight: 600 }));
  txt(ctx, 'Maths · Français · Histoire-Géo…', 76, 624, { size: 12, weight: 500, color: K.inkMuted, font: F_BODY });

  // verrouillage
  if (lock > 0) {
    ctx.fillStyle = `rgba(10,21,38,${0.62 * clamp(lock * 1.5)})`;
    ctx.fillRect(0, 0, W, H);
    lockedCard(ctx, W / 2, H / 2 + 10, lock, t);
  }
}

// ===========================================================================
// Écran parent « Règles des quiz » (capture réelle, 736 × 1600 -> 390 × 848)

export const RULES = {
  unlock: [17, 132, 356, 62],
  freq: [17, 207, 356, 182],
  perQuiz: [17, 402, 356, 150],
  subjects: [17, 565, 356, 122],
  save: [17, 712, 356, 50],
  toggle: [303, 148, 56, 30],
};

/** Puces de fréquence : [x, y, w] (2 lignes, comme la capture). */
export const FREQ_CHIPS = (() => {
  const w = [52, 52, 52, 52, 52, 52, 52, 52, 56];
  const out = [];
  let x = 33;
  for (let i = 0; i < 9; i++) {
    if (i === 5) x = 33;
    out.push([x, i < 5 ? 255 : 288, w[i]]);
    x += w[i] + 6.5;
  }
  return out;
})();
export const Q_DOTS = T.rules.qOpts.map((_, i) => [46 + i * 31.4, 466]);
export const SUBJECT_CHIPS = (() => {
  const w = [58, 70, 98, 76, 64, 58];
  const out = [];
  let x = 33;
  for (let i = 0; i < 6; i++) {
    if (i === 4) x = 33;
    out.push([x, i < 4 ? 610 : 645, w[i]]);
    x += w[i] + 6;
  }
  return out;
})();

/**
 * @param {object} s
 * @param {number} s.toggle 0..1 interrupteur
 * @param {number} s.freq index (flottant) de la puce de fréquence sélectionnée
 * @param {number} s.q index (flottant) du nombre de questions
 * @param {number} s.subj nombre de matières activées (0..6)
 * @param {number} s.focus section mise en avant (0..4), s.focusK intensité
 * @param {number} s.save appui sur « Enregistrer » 0..1
 * @param {number[]} s.tap [x, y, k] onde de toucher
 */
export function rulesScreen(ctx, W, H, s = {}) {
  const { toggle = 1, freq = 1, q = 2, subj = 6, focus = -1, focusK = 0, save = 0, tap = null } = s;
  lightBg(ctx, W, H);
  statusBar(ctx, '#0f1d26', '14:48');
  // en-tête
  ctx.fillStyle = '#F4F9FB';
  rr(ctx, 19, 62, 32, 32, 10);
  ctx.fill();
  ic.arrowLeft(ctx, 24, 67, 22, R.ink);
  txt(ctx, T.rules.title, 60, 86, disp({ size: 22, weight: 700, color: R.ink }));
  txt(ctx, T.rules.sub, 65, 116, { size: 12.5, weight: 400, color: R.muted, font: F_DISPLAY });

  const sections = [RULES.unlock, RULES.freq, RULES.perQuiz, RULES.subjects, RULES.save];
  for (let i = 0; i < 4; i++) {
    const [x, y, w, h] = sections[i];
    lightCard(ctx, x, y, w, h, 18, 'rgba(255,255,255,0.92)', 'rgba(255,255,255,0.9)');
  }

  // 1. Quiz de déblocage
  {
    const [x, y] = RULES.unlock;
    txt(ctx, T.rules.unlock, x + 16, y + 28, disp({ size: 15, weight: 600, color: R.ink }));
    txt(ctx, toggle > 0.5 ? T.rules.on : T.rules.off, x + 16, y + 47, { size: 12.5, weight: 400, color: R.muted, font: F_DISPLAY });
    const [tx, ty, tw, th] = RULES.toggle;
    ctx.fillStyle = mix(R.off, R.cyan, toggle);
    rr(ctx, tx, ty, tw, th, th / 2);
    ctx.fill();
    shadow(ctx, 4, 1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(lerp(tx + 15, tx + tw - 15, toggle), ty + th / 2, 12, 0, TAU);
    ctx.fill();
    noShadow(ctx);
  }

  // 2. Fréquence
  {
    const [x, y] = RULES.freq;
    const sel = Math.round(freq);
    const m = T.rules.freqOpts[clamp(sel, 0, 8)];
    txt(ctx, T.rules.every, x + 16, y + 30, disp({ size: 14.5, weight: 600, color: R.ink }));
    txt(ctx, `${m} min`, x + 340, y + 32, disp({ size: 17, weight: 700, color: R.cyan, align: 'right' }));
    FREQ_CHIPS.forEach(([cx, cy, cw], i) => {
      const on = clamp(1 - Math.abs(freq - i));
      ctx.fillStyle = mix(R.chip, R.cyan, on);
      rr(ctx, cx, cy, cw, 27, 13.5);
      ctx.fill();
      txt(ctx, `${T.rules.freqOpts[i]} min`, cx + cw / 2, cy + 18, { size: 11.5, weight: 500, color: on > 0.5 ? '#fff' : R.chipInk, align: 'center', font: F_DISPLAY });
    });
    ctx.fillStyle = R.note;
    rr(ctx, x + 16, y + 126, 324, 44, 12);
    ctx.fill();
    const [a1, hl, a2, l2] = T.rules.freqNote(m);
    ctx.font = `400 11.5px ${F_DISPLAY}`;
    const w1 = ctx.measureText(a1).width;
    txt(ctx, a1, x + 25, y + 144, { size: 11.5, weight: 400, color: R.muted, font: F_DISPLAY });
    txt(ctx, hl, x + 25 + w1, y + 145, { size: 14, weight: 500, color: R.cyan, font: F_DISPLAY });
    ctx.font = `500 14px ${F_DISPLAY}`;
    const w2 = ctx.measureText(hl).width;
    txt(ctx, a2, x + 25 + w1 + w2, y + 144, { size: 11.5, weight: 400, color: R.muted, font: F_DISPLAY });
    txt(ctx, l2, x + 25, y + 161, { size: 11.5, weight: 400, color: R.muted, font: F_DISPLAY });
  }

  // 3. Questions par quiz
  {
    const [x, y] = RULES.perQuiz;
    const n = T.rules.qOpts[clamp(Math.round(q), 0, 7)];
    txt(ctx, T.rules.perQuiz, x + 16, y + 32, disp({ size: 14.5, weight: 600, color: R.ink }));
    txt(ctx, String(n), x + 340, y + 34, disp({ size: 17, weight: 700, color: R.cyan, align: 'right' }));
    Q_DOTS.forEach(([cx, cy], i) => {
      const on = clamp(1 - Math.abs(q - i));
      ctx.fillStyle = mix(R.chip, R.orange, on);
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, TAU);
      ctx.fill();
      txt(ctx, String(T.rules.qOpts[i]), cx, cy + 4.5, { size: 12, weight: 500, color: on > 0.5 ? '#fff' : R.chipInk, align: 'center', font: F_DISPLAY });
    });
    ctx.fillStyle = R.note;
    rr(ctx, x + 16, y + 92, 324, 38, 12);
    ctx.fill();
    const [b1, bh, b2] = T.rules.qNote(n);
    ctx.font = `400 11.5px ${F_DISPLAY}`;
    const w1 = ctx.measureText(b1).width;
    txt(ctx, b1, x + 25, y + 116, { size: 11.5, weight: 400, color: R.muted, font: F_DISPLAY });
    txt(ctx, bh, x + 25 + w1, y + 117, { size: 14, weight: 500, color: R.cyan, font: F_DISPLAY });
    ctx.font = `500 14px ${F_DISPLAY}`;
    txt(ctx, b2, x + 25 + w1 + ctx.measureText(bh).width, y + 116, { size: 11.5, weight: 400, color: R.muted, font: F_DISPLAY });
  }

  // 4. Matières
  {
    const [x, y] = RULES.subjects;
    icon.book(ctx, x + 16, y + 14, 20, R.cyan);
    txt(ctx, T.rules.subjects, x + 42, y + 30, disp({ size: 15, weight: 600, color: R.ink }));
    SUBJECT_CHIPS.forEach(([cx, cy, cw], i) => {
      const on = clamp(subj - i);
      ctx.fillStyle = mix(R.chip, R.cyan, on);
      rr(ctx, cx, cy, cw, 28, 14);
      ctx.fill();
      txt(ctx, T.rules.subjectNames[i], cx + cw / 2, cy + 19, { size: 12.5, weight: 500, color: on > 0.5 ? '#fff' : R.chipInk, align: 'center', font: F_DISPLAY });
    });
  }

  // section mise en avant
  if (focus >= 0 && focusK > 0) {
    const [x, y, w, h] = sections[Math.round(focus)];
    ctx.save();
    ctx.globalAlpha = focusK;
    shadow(ctx, 18, 0, 'rgba(46,159,192,0.75)');
    ctx.strokeStyle = R.cyan;
    ctx.lineWidth = 2.5;
    rr(ctx, x - 1, y - 1, w + 2, h + 2, 19);
    ctx.stroke();
    noShadow(ctx);
    ctx.restore();
  }

  // Enregistrer
  {
    const [x, y, w, h] = RULES.save;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(1 - save * 0.04, 1 - save * 0.04);
    ctx.translate(-(x + w / 2), -(y + h / 2));
    shadow(ctx, 22 + save * 14, 3, 'rgba(46,159,192,0.55)');
    ctx.fillStyle = R.cyan;
    rr(ctx, x, y, w, h, 22);
    ctx.fill();
    noShadow(ctx);
    txt(ctx, T.rules.save, x + w / 2, y + 31, disp({ size: 16.5, weight: 500, color: '#fff', align: 'center' }));
    ctx.restore();
  }
  if (tap) tapRipple(ctx, tap[0], tap[1], tap[2]);
}

// ===========================================================================
// Cartes de quiz (une par matière) — style de l'app enfant

export const QCARD_PX = [380, 262];

export function quizCard(ctx, W, H, i, s = {}) {
  const { tap = 0, ok = 0 } = s;
  const it = T.quiz.items[i];
  const col = SUBJECT_COL[it.subject];
  // fond
  shadow(ctx, 26, 0, rgba(col, 0.45));
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1d3a60');
  g.addColorStop(1, '#10223d');
  ctx.fillStyle = g;
  rr(ctx, 4, 4, W - 8, H - 8, 26);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = rgba(col, 0.75);
  ctx.lineWidth = 2;
  rr(ctx, 5, 5, W - 10, H - 10, 25);
  ctx.stroke();
  // en-tête : pastille matière + progression
  const name = T.rules.subjectNames[it.subject];
  ctx.font = `700 13px ${F_BODY}`;
  const pw = ctx.measureText(name.toUpperCase()).width + 26;
  ctx.fillStyle = col;
  rr(ctx, 20, 20, pw, 26, 13);
  ctx.fill();
  txt(ctx, name.toUpperCase(), 20 + pw / 2, 38, { size: 12, weight: 700, color: '#fff', ls: 0.8, align: 'center', font: F_BODY });
  txt(ctx, T.quiz.of(i + 1, 5), W - 22, 38, { size: 12.5, weight: 600, color: K.inkMuted, align: 'right', font: F_BODY });
  // question
  wrap(ctx, it.q, 22, 78, W - 44, 24, { size: 19, weight: 700, color: K.ink, font: F_DISPLAY });
  // réponses
  it.options.forEach((o, j) => {
    const y = 130 + j * 41;
    const isOk = j === it.ok;
    const sel = isOk ? clamp(tap * 3) : 0;
    const good = isOk ? ok : 0;
    const base = 'rgba(255,255,255,0.06)';
    ctx.fillStyle = good > 0 ? rgba('#22C55E', 0.25 + 0.15 * good) : sel > 0 ? rgba(K.cyan, 0.3 * sel) : base;
    rr(ctx, 20, y, W - 40, 34, 12);
    ctx.fill();
    ctx.strokeStyle = good > 0 ? '#22C55E' : sel > 0 ? K.cyan : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = sel > 0 || good > 0 ? 2 : 1.2;
    rr(ctx, 20, y, W - 40, 34, 12);
    ctx.stroke();
    ctx.fillStyle = good > 0 ? '#22C55E' : sel > 0 ? K.cyan : 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.arc(40, y + 17, 10, 0, TAU);
    ctx.fill();
    txt(ctx, 'ABC'[j], 40, y + 21.5, { size: 11, weight: 700, color: '#fff', align: 'center', font: F_BODY });
    txt(ctx, o, 60, y + 22.5, { size: 15, weight: 600, color: K.ink, font: F_BODY });
    if (good > 0.05) icon.check(ctx, W - 50, y + 6, 22, '#4ADE80', 3);
  });
}

// ===========================================================================
// Résultat (après les 5 questions)

export function resultScreen(ctx, W, H, s = {}) {
  const { stars = 5, pulse = 0, back = 0 } = s;
  appBg(ctx, W, H);
  statusBar(ctx, '#fff', '16:58');
  const cy = 196;
  ctx.fillStyle = rgba(K.green, 0.18 + pulse * 0.1);
  ctx.beginPath();
  ctx.arc(W / 2, cy, 58, 0, TAU);
  ctx.fill();
  icon.check(ctx, W / 2 - 30, cy - 30, 60, K.green, 3.4);
  txt(ctx, T.result.title, W / 2, 312, disp({ size: 32, weight: 700, align: 'center' }));
  txt(ctx, T.result.score, W / 2, 342, { size: 15, weight: 600, color: K.inkSoft, align: 'center', font: F_BODY });
  // une pastille par matière
  for (let i = 0; i < 5; i++) {
    const k = clamp(stars - i);
    const x = W / 2 + (i - 2) * 46, y = 392;
    ctx.fillStyle = k > 0 ? SUBJECT_COL[i] : 'rgba(255,255,255,0.1)';
    ctx.globalAlpha = 0.35 + 0.65 * k;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (k > 0.5) icon.check(ctx, x - 9, y - 9, 18, '#fff', 3);
  }
  darkCard(ctx, 24, 440, W - 48, 132, 24, { bg: rgba(K.surface, 0.5), border: rgba(K.green, 0.4), glow: 10 });
  txt(ctx, T.result.earned, W / 2, 480, { size: 14, weight: 500, color: K.inkSoft, align: 'center', font: F_BODY });
  shadow(ctx, 18, 0, rgba(K.green, 0.6 + pulse * 0.3));
  txt(ctx, '+15 min', W / 2, 542, { size: 50, weight: 700, color: K.green, align: 'center', font: F_NUM });
  noShadow(ctx);
  button(ctx, 24, 740, W - 48, 54, T.result.back, { press: back });
}

// ===========================================================================
// Faces des objets 3D

/** Puce de fréquence 3D. */
export function chipFace(ctx, W, H, label, sel = 0) {
  ctx.fillStyle = mix('#E6EDF1', R.cyan, sel);
  rr(ctx, 2, 2, W - 4, H - 4, (H - 4) / 2);
  ctx.fill();
  txt(ctx, label, W / 2, H / 2 + 9, { size: 25, weight: 600, color: sel > 0.5 ? '#fff' : R.chipInk, align: 'center', font: F_DISPLAY });
}

/** Jeton « nombre de questions ». */
export function coinFace(ctx, W, H, n, sel = 0) {
  ctx.fillStyle = mix('#E6EDF1', R.orange, sel);
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W / 2 - 2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = sel > 0.5 ? 'rgba(255,255,255,0.55)' : 'rgba(16,43,59,0.08)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W / 2 - 10, 0, TAU);
  ctx.stroke();
  txt(ctx, String(n), W / 2, H / 2 + 17, { size: 48, weight: 700, color: sel > 0.5 ? '#fff' : R.chipInk, align: 'center', font: F_DISPLAY });
}

/** Grande valeur (« 15 min », « 5 questions »). */
export function valueFace(ctx, W, H, big, small, col = R.cyan) {
  shadow(ctx, 18, 4, 'rgba(16,43,59,0.25)');
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  rr(ctx, 4, 4, W - 8, H - 8, 30);
  ctx.fill();
  noShadow(ctx);
  ctx.font = `700 64px ${F_DISPLAY}`;
  const bw = ctx.measureText(big).width;
  ctx.font = `600 28px ${F_DISPLAY}`;
  const sw = ctx.measureText(small).width;
  const x0 = W / 2 - (bw + 10 + sw) / 2;
  txt(ctx, big, x0, H / 2 + 22, { size: 64, weight: 700, color: col, font: F_DISPLAY });
  txt(ctx, small, x0 + bw + 10, H / 2 + 22, { size: 28, weight: 600, color: R.ink, font: F_DISPLAY });
}

/** Étiquette de matière sous une illustration 3D. */
export function subjectLabel(ctx, W, H, i) {
  ctx.fillStyle = SUBJECT_COL[i];
  rr(ctx, 2, 2, W - 4, H - 4, (H - 4) / 2);
  ctx.fill();
  txt(ctx, T.rules.subjectNames[i], W / 2, H / 2 + 8, { size: 23, weight: 700, color: '#fff', align: 'center', font: F_DISPLAY });
}
