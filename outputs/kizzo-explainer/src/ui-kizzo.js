// Écrans Kizzo reproduits d'après le code réel des apps (quiz-ia/enfant-app-work et
// parent-app-work) : thème sombre navy #152A4A → #0A1526, halos cyan/orange à 22 %,
// cartes à bord cyan lumineux, bouton cyan rayon 16, Outfit / Plus Jakarta Sans / Space Grotesk.
import { T } from './config.js';
import { rr, txt, disp, icon, shadow, noShadow, statusBar, F_BODY, F_DISPLAY, F_NUM, F_HAND, makeCanvas } from './ui-canvas.js';
import { clamp, lerp, TAU, rng } from './util.js';

export const K = {
  bgTop: '#152a4a',
  bgBottom: '#0a1526',
  surface: '#1e3a5f',
  surfaceSoft: '#1e293b',
  surfaceStrong: '#2c5e92',
  ink: '#fafafa',
  inkSoft: 'rgba(250,250,250,0.8)',
  inkMuted: 'rgba(250,250,250,0.55)',
  cyan: '#3db4d9',
  cyanLight: '#2cbfed',
  orange: '#f97316',
  orangeLight: '#ff9d5c',
  yellow: '#fab43b',
  green: '#1ed760',
  red: '#ef4444',
};
const a = (hex, al) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${al})`;
};

// ---------------------------------------------------------------------------
// Fond des apps (Screen.tsx : dégradé + halos flous "glow")

export function appBg(ctx, W, H, glow = true) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, K.bgTop);
  g.addColorStop(1, K.bgBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (!glow) return;
  const blob = (x, y, r, col) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, a(col, 0.24));
    rg.addColorStop(0.55, a(col, 0.12));
    rg.addColorStop(1, a(col, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  };
  blob(10, 110, 300, K.cyan);
  blob(170, H * 0.68, 300, K.orange);
}

function card(ctx, x, y, w, h, r, { bg = a(K.surface, 0.35), border = 'rgba(255,255,255,0.06)', glow = 0 } = {}) {
  if (glow) shadow(ctx, glow, 0, a(K.cyan, 0.45));
  ctx.fillStyle = bg;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  rr(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, r);
  ctx.stroke();
}

/** Bouton réel (Button.tsx) : h 54, rayon 16, cyan + halo, ou contour cyan. */
export function button(ctx, x, y, w, h, label, { variant = 'default', press = 0, icon: ic } = {}) {
  ctx.save();
  ctx.translate(0, press * 2);
  if (variant === 'default' || variant === 'orange') {
    const col = variant === 'orange' ? K.orange : K.cyan;
    shadow(ctx, 22, 0, a(variant === 'orange' ? K.orangeLight : K.cyanLight, 0.85));
    ctx.fillStyle = col;
    rr(ctx, x, y, w, h, 16);
    ctx.fill();
    noShadow(ctx);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    rr(ctx, x + 2, y + 2, w - 4, h * 0.45, 14);
    ctx.fill();
    txt(ctx, label, x + w / 2 + (ic ? 12 : 0), y + h / 2 + 6, { size: 16, weight: 600, color: '#fff', align: 'center', font: F_BODY });
    if (ic) ic(ctx, x + w / 2 - ctx.measureText(label).width / 2 - 26, y + h / 2 - 10, 20, '#fff');
  } else {
    shadow(ctx, 8, 0, a(K.cyan, 0.22));
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    rr(ctx, x, y, w, h, 16);
    ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = K.cyan;
    ctx.lineWidth = 2;
    rr(ctx, x + 1, y + 1, w - 2, h - 2, 15);
    ctx.stroke();
    txt(ctx, label, x + w / 2, y + h / 2 + 6, { size: 16, weight: 600, color: K.cyan, align: 'center', font: F_BODY });
  }
  ctx.restore();
}

export function avatar(ctx, cx, cy, size, letter = 'L', col = K.orange, ring = true) {
  if (ring) {
    ctx.strokeStyle = a(K.cyan, 0.3);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2 + 6.5, 0, TAU);
    ctx.stroke();
  }
  shadow(ctx, 12, 0, a(col, 0.45));
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, TAU);
  ctx.fill();
  noShadow(ctx);
  txt(ctx, letter, cx, cy + size * 0.15, { size: size * 0.4, weight: 700, color: '#fff', align: 'center', font: F_BODY });
}

// icônes complémentaires (lucide)
export const ic = {
  sparkles(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.fillStyle = color;
    const star = (cx, cy, r) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.quadraticCurveTo(cx + r * 0.12, cy - r * 0.12, cx + r, cy);
      ctx.quadraticCurveTo(cx + r * 0.12, cy + r * 0.12, cx, cy + r);
      ctx.quadraticCurveTo(cx - r * 0.12, cy + r * 0.12, cx - r, cy);
      ctx.quadraticCurveTo(cx - r * 0.12, cy - r * 0.12, cx, cy - r);
      ctx.fill();
    };
    star(10, 13, 8);
    star(19, 5, 3.6);
    star(19.5, 18.5, 2.6);
    ctx.restore();
  },
  camera(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(3, 8);
    ctx.lineTo(7, 8);
    ctx.lineTo(9, 5);
    ctx.lineTo(15, 5);
    ctx.lineTo(17, 8);
    ctx.lineTo(21, 8);
    ctx.lineTo(21, 19);
    ctx.lineTo(3, 19);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(12, 13, 3.5, 0, TAU);
    ctx.stroke();
    ctx.restore();
  },
  arrowLeft(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(19, 12);
    ctx.lineTo(5, 12);
    ctx.moveTo(11, 6);
    ctx.lineTo(5, 12);
    ctx.lineTo(11, 18);
    ctx.stroke();
    ctx.restore();
  },
  trending(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(2, 17);
    ctx.lineTo(9, 10);
    ctx.lineTo(13, 14);
    ctx.lineTo(22, 6);
    ctx.moveTo(16, 6);
    ctx.lineTo(22, 6);
    ctx.lineTo(22, 12);
    ctx.stroke();
    ctx.restore();
  },
  home(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(3, 10);
    ctx.lineTo(12, 3);
    ctx.lineTo(21, 10);
    ctx.lineTo(21, 21);
    ctx.lineTo(3, 21);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  },
  users(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(9, 8, 4, 0, TAU);
    ctx.moveTo(2, 21);
    ctx.quadraticCurveTo(9, 10, 16, 21);
    ctx.moveTo(17, 4);
    ctx.arc(17, 8, 3.5, -Math.PI / 2, Math.PI / 2);
    ctx.moveTo(18, 14);
    ctx.quadraticCurveTo(22, 16, 22, 21);
    ctx.stroke();
    ctx.restore();
  },
  settings(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x + s / 2, y + s / 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.085;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const r = i % 2 ? s * 0.36 : s * 0.46;
      const an = (i / 16) * TAU;
      ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.14, 0, TAU);
    ctx.stroke();
    ctx.restore();
  },
  hourglass(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(6, 3);
    ctx.lineTo(18, 3);
    ctx.moveTo(6, 21);
    ctx.lineTo(18, 21);
    ctx.moveTo(7, 3);
    ctx.quadraticCurveTo(7, 10, 12, 12);
    ctx.quadraticCurveTo(17, 10, 17, 3);
    ctx.moveTo(7, 21);
    ctx.quadraticCurveTo(7, 14, 12, 12);
    ctx.quadraticCurveTo(17, 14, 17, 21);
    ctx.stroke();
    ctx.restore();
  },
};

export function wrap(ctx, s, x, y, maxW, lh, o) {
  ctx.save();
  ctx.font = `${o.weight} ${o.size}px ${o.font}`;
  let line = '';
  let yy = y;
  for (const w of s.split(' ')) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      txt(ctx, line, x, yy, o);
      line = w;
      yy += lh;
    } else line = test;
  }
  txt(ctx, line, x, yy, o);
  ctx.restore();
  return yy;
}

// ---------------------------------------------------------------------------
// LockedScreen.tsx — carte "C'est l'heure d'un quiz !"

export function lockedCard(ctx, cx, cy, k = 1, t = 0) {
  const W = 330, H = 402;
  ctx.save();
  ctx.globalAlpha *= clamp(k * 1.3);
  ctx.translate(cx, cy);
  const s = 0.82 + 0.18 * k;
  ctx.scale(s, s);
  ctx.translate(-W / 2, -H / 2);
  shadow(ctx, 50, 25, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = 'rgba(21,42,74,0.97)';
  rr(ctx, 0, 0, W, H, 16);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1.5;
  rr(ctx, 0.75, 0.75, W - 1.5, H - 1.5, 16);
  ctx.stroke();
  // icône cadenas + particules
  const ix = W / 2, iy = 66;
  [
    [-56, -8, 4, 0.7],
    [40, -27, 5.5, 0.6],
    [-45, 28, 4, 0.5],
    [34, 32, 3, 0.5],
    [-33, -38, 3, 0.4],
  ].forEach(([dx, dy, r, o], i) => {
    ctx.fillStyle = a(K.cyan, o * (0.7 + 0.3 * Math.sin(t * 3 + i)));
    ctx.beginPath();
    ctx.arc(ix + dx, iy + dy, r, 0, TAU);
    ctx.fill();
  });
  shadow(ctx, 20, 0, a(K.cyan, 0.7));
  ctx.fillStyle = K.cyan;
  ctx.beginPath();
  ctx.arc(ix, iy, 30, 0, TAU);
  ctx.fill();
  noShadow(ctx);
  icon.lock(ctx, ix - 15, iy - 16, 30, K.bgBottom);
  txt(ctx, T.kid.lockTitle, W / 2, 144, { size: 19, weight: 600, color: K.ink, align: 'center', font: F_DISPLAY });
  txt(ctx, T.kid.lockBody, W / 2, 170, { size: 14, weight: 500, color: K.inkSoft, align: 'center', font: F_BODY });
  button(ctx, 24, 198, W - 48, 54, T.kid.lockCta);
  button(ctx, 24, 274, W - 48, 54, T.kid.lockAsk, { variant: 'outline' });
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 352);
  ctx.lineTo(W / 2 - 18, 352);
  ctx.moveTo(W / 2 + 18, 352);
  ctx.lineTo(W - 24, 352);
  ctx.stroke();
  txt(ctx, T.kid.or, W / 2, 357, { size: 13, weight: 500, color: K.inkMuted, align: 'center', font: F_BODY });
  txt(ctx, T.kid.parentCode, W / 2, 386, { size: 15, weight: 600, color: K.orange, align: 'center', font: F_BODY });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// HomeScreen.tsx (enfant) — en calques

export const KID_LAYOUT = {
  header: [0, 52, 390, 92],
  hero: [24, 152, 342, 296],
  evo: [24, 466, 342, 112],
  last: [24, 594, 342, 76],
  cta: [14, 682, 362, 74], // bouton 342×54 + marge pour le halo
  outline: [24, 768, 342, 54],
};

export function kidHomeBase(ctx, W, H, ghost = 1) {
  appBg(ctx, W, H);
  ctx.fillStyle = `rgba(5,12,24,${0.35 * ghost})`;
  for (const k of ['hero', 'evo', 'last']) {
    const [x, y, w, h] = KID_LAYOUT[k];
    rr(ctx, x, y, w, h, k === 'hero' ? 40 : 32);
    ctx.fill();
  }
  rr(ctx, 24, 692, 342, 54, 16);
  ctx.fill();
  statusBar(ctx, '#fff', '19:46');
}

export function kidHeader(ctx, W, H) {
  txt(ctx, T.kid.hi, 24, 42, disp({ size: 28, weight: 700 }));
  txt(ctx, T.kid.sub, 24, 70, { size: 14, weight: 500, color: K.inkSoft, font: F_BODY });
  avatar(ctx, W - 52, 40, 44, 'B', K.cyan);
}

export function kidHero(ctx, W, H, s = {}) {
  const { pulse = 0 } = s;
  shadow(ctx, 22 + pulse * 16, 0, a(K.cyan, 0.55));
  ctx.fillStyle = a(K.surface, 0.55);
  rr(ctx, 0, 0, W, H, 40);
  ctx.fill();
  noShadow(ctx);
  ctx.save();
  rr(ctx, 0, 0, W, H, 40);
  ctx.clip();
  const blob = (x, y, r, col) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, a(col, 0.5));
    rg.addColorStop(0.7, a(col, 0.35));
    rg.addColorStop(1, a(col, 0));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  };
  blob(W + 4, 0, 90, K.orange);
  blob(-10, H + 10, 110, K.cyan);
  ctx.restore();
  ctx.strokeStyle = K.cyan;
  ctx.lineWidth = 2;
  rr(ctx, 1, 1, W - 2, H - 2, 39);
  ctx.stroke();
  // contenu centré
  ctx.fillStyle = a(K.cyan, 0.15);
  ctx.beginPath();
  ctx.arc(W / 2, 74, 26, 0, TAU);
  ctx.fill();
  ic.sparkles(ctx, W / 2 - 14, 60, 28, K.cyan);
  txt(ctx, T.kid.heroTitle, W / 2, 148, disp({ size: 30, weight: 700, align: 'center' }));
  txt(ctx, T.kid.heroSub, W / 2, 180, disp({ size: 18, weight: 600, color: K.inkSoft, align: 'center' }));
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  rr(ctx, W / 2 - 92, 214, 184, 38, 19);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  rr(ctx, W / 2 - 92, 214, 184, 38, 19);
  ctx.stroke();
  txt(ctx, T.kid.heroPill, W / 2, 238, { size: 14, weight: 600, color: K.cyan, align: 'center', font: F_BODY });
}

export function kidEvolution(ctx, W, H) {
  card(ctx, 0, 0, W, H, 32, { bg: a(K.surface, 0.3), border: 'rgba(255,255,255,0.05)' });
  txt(ctx, T.kid.evo, 17, 32, { size: 12, weight: 700, color: K.cyan, ls: 1.4, font: F_BODY });
  ic.trending(ctx, 17, 42, 20, K.cyan);
  txt(ctx, T.kid.points, 46, 60, disp({ size: 22, weight: 700 }));
  ctx.fillStyle = K.cyan;
  rr(ctx, W - 112, 38, 95, 28, 14);
  ctx.fill();
  txt(ctx, T.kid.level, W - 64, 57, { size: 14, weight: 700, color: '#1e293b', align: 'center', font: F_BODY });
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  rr(ctx, 17, 74, W - 34, 14, 7);
  ctx.fill();
  shadow(ctx, 12, 0, a(K.cyan, 0.6));
  ctx.fillStyle = K.orange;
  rr(ctx, 17, 74, (W - 34) * 0.65, 14, 7);
  ctx.fill();
  noShadow(ctx);
  txt(ctx, T.kid.evoHint, 17, 104, { size: 12, weight: 500, color: K.inkSoft, font: F_BODY });
  txt(ctx, '65%', W - 17, 104, { size: 12, weight: 700, color: K.ink, align: 'right', font: F_BODY });
}

export function kidLastQuiz(ctx, W, H) {
  card(ctx, 0, 0, W, H, 32, { bg: a(K.surface, 0.3), border: 'rgba(255,255,255,0.05)', glow: 8 });
  ctx.fillStyle = a(K.cyan, 0.12);
  rr(ctx, 17, 18, 40, 40, 20);
  ctx.fill();
  icon.check(ctx, 26, 27, 22, K.cyan, 3);
  txt(ctx, T.kid.last, 73, 34, { size: 14, weight: 700, color: K.ink, font: F_BODY });
  txt(ctx, T.kid.lastSub, 73, 54, { size: 12, weight: 500, color: K.inkSoft, font: F_BODY });
}

export function kidCTA(ctx, W, H, press = 0) {
  button(ctx, 10, 10, W - 20, 54, T.kid.start, { press });
}

export function kidOutline(ctx, W, H) {
  button(ctx, 0, 0, W / 2 - 6, H, T.kid.badges, { variant: 'outline' });
  button(ctx, W / 2 + 6, 0, W / 2 - 6, H, T.kid.history, { variant: 'outline' });
}

// ---------------------------------------------------------------------------
// Quiz enfant (QuizPlayScreen.tsx) : carte question + options empilées (QuestionRenderer)

export const CARD_PX = [380, 175];
export const OPT_PX = [380, 48];
export const SLOT = { x: 22, y: 124, w: 336, h: 42 };

export function quizCardFace(ctx, W, H, i, locked = false) {
  const q = T.quiz.items[i];
  shadow(ctx, 18, 0, a(K.cyan, 0.4));
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1f3d64');
  g.addColorStop(1, '#162c4b');
  ctx.fillStyle = g;
  rr(ctx, 0, 0, W, H, 22);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = a(K.cyan, 0.55);
  ctx.lineWidth = 2;
  rr(ctx, 1, 1, W - 2, H - 2, 21);
  ctx.stroke();
  txt(ctx, T.quiz.questionOf(i + 1), 22, 30, { size: 12, weight: 700, color: K.cyan, ls: 1.3, font: F_BODY });
  txt(ctx, T.quiz.title, W - 22, 30, { size: 13, weight: 600, color: K.inkMuted, align: 'right', font: F_BODY });
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  rr(ctx, 22, 42, W - 44, 7, 3.5);
  ctx.fill();
  ctx.fillStyle = K.cyan;
  rr(ctx, 22, 42, ((W - 44) * (i + 1)) / 3, 7, 3.5);
  ctx.fill();
  const textW = q.prop === 'slot' ? W - 44 : W - 150;
  wrap(ctx, q.q, 22, 84, textW, 25, disp({ size: 20, weight: 600 }));
  if (q.prop === 'slot') {
    const { x, y, w, h } = SLOT;
    if (locked) {
      ctx.fillStyle = a(K.green, 0.14);
      rr(ctx, x, y, w, h, 14);
      ctx.fill();
      ctx.strokeStyle = K.green;
      ctx.lineWidth = 2.5;
      rr(ctx, x, y, w, h, 14);
      ctx.stroke();
    } else {
      ctx.setLineDash([7, 7]);
      ctx.strokeStyle = a(K.cyan, 0.6);
      ctx.lineWidth = 2.5;
      rr(ctx, x, y, w, h, 14);
      ctx.stroke();
      ctx.setLineDash([]);
      txt(ctx, T.quiz.yourAnswer, x + w / 2, y + h / 2 + 5, { size: 14, weight: 600, color: a(K.cyan, 0.7), align: 'center', font: F_BODY });
    }
  }
}

const LETTERS = ['A', 'B', 'C', 'D'];

/** Option de réponse : rayon 16, bord 2, pastille lettre cyan, actif = cyan. */
export function optionTile(ctx, W, H, label, j, active) {
  ctx.fillStyle = active ? 'rgba(30,70,100,0.96)' : 'rgba(22,44,75,0.94)';
  rr(ctx, 0, 0, W, H, 16);
  ctx.fill();
  if (active) {
    ctx.fillStyle = a(K.cyan, 0.14);
    rr(ctx, 0, 0, W, H, 16);
    ctx.fill();
  }
  ctx.strokeStyle = active ? K.cyan : 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2.5;
  rr(ctx, 1.25, 1.25, W - 2.5, H - 2.5, 15);
  ctx.stroke();
  ctx.fillStyle = K.cyan;
  ctx.beginPath();
  ctx.arc(30, H / 2, 13, 0, TAU);
  ctx.fill();
  txt(ctx, LETTERS[j], 30, H / 2 + 4.5, { size: 13, weight: 700, color: '#fff', align: 'center', font: F_BODY });
  txt(ctx, label, 56, H / 2 + 5.5, { size: 16, weight: active ? 800 : 600, color: active ? K.cyan : K.ink, font: F_BODY });
}

export function checkBadge(ctx, W, H) {
  ctx.fillStyle = K.green;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W / 2 - 2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#0a1526';
  ctx.lineWidth = 3;
  ctx.stroke();
  icon.check(ctx, W * 0.18, H * 0.18, W * 0.64, '#0a1526', 3.6);
}

/** Écran du téléphone couché qui projette le quiz. */
export function quizPhone(ctx, W, H, s) {
  appBg(ctx, W, H);
  statusBar(ctx, '#fff', '19:47');
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.arc(44, 86, 20, 0, TAU);
  ctx.fill();
  ic.arrowLeft(ctx, 33, 75, 22, K.ink);
  txt(ctx, T.quiz.title, 24, 160, disp({ size: 28, weight: 700 }));
  const qi = Math.min(2, s.q);
  txt(ctx, T.quiz.questionOf(qi + 1), 24, 210, { size: 12, weight: 700, color: K.cyan, ls: 1.3, font: F_BODY });
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  rr(ctx, 24, 224, W - 48, 8, 4);
  ctx.fill();
  ctx.fillStyle = K.cyan;
  rr(ctx, 24, 224, ((W - 48) * (qi + 1)) / 3, 8, 4);
  ctx.fill();
  const rg = ctx.createRadialGradient(W / 2, 470, 10, W / 2, 470, 240);
  rg.addColorStop(0, a(K.cyan, 0.4));
  rg.addColorStop(1, a(K.cyan, 0));
  ctx.fillStyle = rg;
  ctx.fillRect(0, 240, W, 460);
  icon.logo(ctx, W / 2, 470, 110);
  button(ctx, 24, 760, W - 48, 54, T.quiz.next);
}

// ---------------------------------------------------------------------------
// Résultat du quiz (« Bravo ! 🎉 », « Temps gagné +15 min »)

export function resultScreen(ctx, W, H, s) {
  const { minutes = 15, synced = 0, pulse = 0 } = s;
  appBg(ctx, W, H);
  statusBar(ctx, '#fff', '19:48');
  txt(ctx, T.kid.unlocked.toUpperCase(), W / 2, 92, { size: 12, weight: 700, color: K.green, ls: 1.6, align: 'center', font: F_BODY });
  const cy = 170;
  ctx.fillStyle = a(K.green, 0.2 + pulse * 0.12);
  ctx.beginPath();
  ctx.arc(W / 2, cy, 48, 0, TAU);
  ctx.fill();
  icon.check(ctx, W / 2 - 26, cy - 26, 52, K.green, 3.2);
  txt(ctx, T.kid.resultTitle, W / 2, 268, disp({ size: 30, weight: 700, align: 'center' }));
  txt(ctx, T.kid.score, W / 2, 298, { size: 15, weight: 600, color: K.inkSoft, align: 'center', font: F_BODY });
  card(ctx, 24, 322, W - 48, 120, 24, { bg: a(K.surface, 0.45), border: a(K.green, 0.35), glow: 10 });
  txt(ctx, T.kid.earned, W / 2, 360, { size: 14, weight: 500, color: K.inkSoft, align: 'center', font: F_BODY });
  shadow(ctx, 16, 0, a(K.green, 0.6 + pulse * 0.3));
  txt(ctx, `+${minutes} min`, W / 2, 414, { size: 44, weight: 700, color: K.green, align: 'center', font: F_NUM });
  noShadow(ctx);
  if (synced > 0) {
    card(ctx, 24, 470, W - 48, 200, 24, { bg: a(K.surface, 0.4), border: a(K.cyan, 0.3) });
    txt(ctx, T.kid.synced, 44, 506, disp({ size: 17, weight: 600 }));
    const icons = [ic.sparkles, ic.hourglass, icon.moon];
    for (let i = 0; i < 3; i++) {
      const al = clamp(synced - i);
      if (al <= 0) continue;
      ctx.save();
      ctx.globalAlpha = al;
      const y = 524 + i * 46;
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      rr(ctx, 40, y, W - 80, 38, 14);
      ctx.fill();
      icons[i](ctx, 52, y + 8, 22, i === 0 ? K.cyan : i === 1 ? K.yellow : '#A78BFA');
      txt(ctx, T.parent.rules[i], 84, y + 25, { size: 14, weight: 600, color: K.ink, font: F_BODY });
      icon.check(ctx, W - 76, y + 7, 24, K.green, 3);
      ctx.restore();
    }
  }
  button(ctx, 24, 760, W - 48, 54, T.kid.back);
}

// ===========================================================================
// APP PARENT — thème clair des captures réelles (dégradé ciel -> pêche)

export const P = {
  sky: '#AED8E6',
  mid: '#D9DCD7',
  peach: '#F6C7A6',
  ink: '#102B3B',
  muted: '#6F818B',
  label: '#8D9CA5',
  cyan: '#39A7C6',
  orange: '#EC6A2C',
  white: '#FFFFFF',
  border: 'rgba(16,43,59,0.08)',
  green: '#2E9E5B',
  greenBg: '#E3F4E9',
  greenBorder: '#9ED3B2',
  peachCard: '#FCE9DF',
  peachBar: '#F6CDB9',
  cyanCard: '#EDF6F9',
  cyanBorder: '#CDE7EF',
};

export function lightBg(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, P.sky);
  g.addColorStop(0.5, P.mid);
  g.addColorStop(1, P.peach);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function lightCard(ctx, x, y, w, h, r = 22, bg = P.white, border = P.border) {
  shadow(ctx, 16, 4, 'rgba(16,43,59,0.06)');
  ctx.fillStyle = bg;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  rr(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, r);
  ctx.stroke();
}

/** Bouton des captures : rayon 22, cyan ou orange plein avec halo, ou contour cyan. */
export function lightButton(ctx, x, y, w, h, label, { variant = 'cyan', press = 0, iconFn = null } = {}) {
  ctx.save();
  if (press) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(1 - press * 0.035, 1 - press * 0.035);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  ctx.font = `600 18px ${F_DISPLAY}`;
  const tw = ctx.measureText(label).width;
  const icW = iconFn ? 30 : 0;
  const tx = x + w / 2 - (tw + icW) / 2 + icW;
  if (variant === 'outline') {
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    rr(ctx, x, y, w, h, 22);
    ctx.fill();
    ctx.strokeStyle = P.cyan;
    ctx.lineWidth = 2.5;
    rr(ctx, x + 1.25, y + 1.25, w - 2.5, h - 2.5, 21);
    ctx.stroke();
    if (iconFn) iconFn(ctx, tx - icW, y + h / 2 - 11, 22, P.cyan);
    txt(ctx, label, tx, y + h / 2 + 6.5, { size: 18, weight: 600, color: P.cyan, font: F_DISPLAY });
  } else {
    const col = variant === 'orange' ? P.orange : P.cyan;
    shadow(ctx, 24 + press * 10, 2, variant === 'orange' ? 'rgba(236,106,44,0.55)' : 'rgba(57,167,198,0.55)');
    ctx.fillStyle = col;
    rr(ctx, x, y, w, h, 22);
    ctx.fill();
    noShadow(ctx);
    if (iconFn) iconFn(ctx, tx - icW, y + h / 2 - 11, 22, '#fff');
    txt(ctx, label, tx, y + h / 2 + 6.5, { size: 18, weight: 600, color: '#fff', font: F_DISPLAY });
  }
  ctx.restore();
}

function lightHeader(ctx, W, title, sub) {
  ctx.fillStyle = '#F7FBFC';
  rr(ctx, 20, 58, 36, 36, 12);
  ctx.fill();
  ic.arrowLeft(ctx, 27, 65, 22, P.ink);
  txt(ctx, title, 68, 86, disp({ size: 23, weight: 700, color: P.ink }));
  if (sub) txt(ctx, sub, W / 2, 118, { size: 13, weight: 500, color: P.muted, align: 'center', font: F_DISPLAY });
}

function capsLabel(ctx, s, x, y) {
  txt(ctx, s, x, y, { size: 11.5, weight: 500, color: P.label, ls: 1.1, font: F_DISPLAY });
}

function chip(ctx, x, y, label, selected) {
  ctx.font = `500 15px ${F_DISPLAY}`;
  const w = ctx.measureText(label).width + 36;
  ctx.fillStyle = selected ? 'rgba(57,167,198,0.12)' : 'rgba(255,255,255,0.75)';
  rr(ctx, x, y, w, 34, 17);
  ctx.fill();
  ctx.strokeStyle = selected ? P.cyan : P.border;
  ctx.lineWidth = selected ? 2 : 1.2;
  rr(ctx, x, y, w, 34, 17);
  ctx.stroke();
  txt(ctx, label, x + w / 2, y + 22.5, { size: 15, weight: 500, color: selected ? P.cyan : P.ink, align: 'center', font: F_DISPLAY });
  return w;
}

// icônes supplémentaires (lucide)
export const icl = {
  image(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    rr(ctx, 3, 4, 16, 16, 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(9, 9.5, 1.6, 0, TAU);
    ctx.moveTo(3, 17);
    ctx.lineTo(9, 12);
    ctx.lineTo(15, 18);
    ctx.moveTo(19, 2);
    ctx.lineTo(19, 8);
    ctx.moveTo(16, 5);
    ctx.lineTo(22, 5);
    ctx.stroke();
    ctx.restore();
  },
  close(ctx, x, y, s, color, w = 2.2) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6, 6);
    ctx.lineTo(18, 18);
    ctx.moveTo(18, 6);
    ctx.lineTo(6, 18);
    ctx.stroke();
    ctx.restore();
  },
  trash(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(4, 6);
    ctx.lineTo(20, 6);
    ctx.moveTo(9, 6);
    ctx.lineTo(9, 3.5);
    ctx.lineTo(15, 3.5);
    ctx.lineTo(15, 6);
    ctx.moveTo(6, 6);
    ctx.lineTo(7, 21);
    ctx.lineTo(17, 21);
    ctx.lineTo(18, 6);
    ctx.moveTo(10, 10);
    ctx.lineTo(10, 17);
    ctx.moveTo(14, 10);
    ctx.lineTo(14, 17);
    ctx.stroke();
    ctx.restore();
  },
  chevron(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(9, 5);
    ctx.lineTo(16, 12);
    ctx.lineTo(9, 19);
    ctx.stroke();
    ctx.restore();
  },
  pencil(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(4, 20);
    ctx.lineTo(5, 15);
    ctx.lineTo(16, 4);
    ctx.lineTo(20, 8);
    ctx.lineTo(9, 19);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  },
  bolt(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(13.5, 2);
    ctx.lineTo(4.5, 13.5);
    ctx.lineTo(11, 13.5);
    ctx.lineTo(10, 22);
    ctx.lineTo(19.5, 10);
    ctx.lineTo(13, 10);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  },
  rotate(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(12, 12, 8, -0.4, Math.PI * 1.6);
    ctx.moveTo(20, 3);
    ctx.lineTo(20, 9);
    ctx.lineTo(14, 9);
    ctx.stroke();
    ctx.restore();
  },
  bars(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6, 20);
    ctx.lineTo(6, 13);
    ctx.moveTo(12, 20);
    ctx.lineTo(12, 6);
    ctx.moveTo(18, 20);
    ctx.lineTo(18, 10);
    ctx.stroke();
    ctx.restore();
  },
};

function tapRipple(ctx, x, y, k) {
  if (k <= 0 || k >= 1) return;
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${0.45 * (1 - k)})`;
  ctx.beginPath();
  ctx.arc(x, y, 14 + k * 26, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, 14 + k * 40, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Page de cahier (« Le cycle de l'eau ») — feuille lignée, marge rouge, encre bleue

export const NOTE_PX = [560, 720];
/** Blocs de texte détectés (x, y, w, h) en px de page. */
export const NOTE_LINES = [];


export function notebookPage(ctx, W, H, s = {}) {
  const { hl = 0 } = s;
  ctx.fillStyle = '#FBF8F0';
  ctx.fillRect(0, 0, W, H);
  const lh = 31;
  ctx.strokeStyle = 'rgba(80,130,205,0.32)';
  ctx.lineWidth = 1.2;
  for (let y = 60; y < H; y += lh) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(214,70,90,0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(52, 0);
  ctx.lineTo(52, H);
  ctx.stroke();
  // ombre douce de bord (papier un peu bombé)
  const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.85);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(60,50,30,0.12)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  // texte manuscrit
  const ink = '#1F3C8C';
  const font = { size: 24, weight: 600, color: ink, font: F_HAND };
  let line = 0;
  const base = (n) => 60 + lh * n - 6;
  const blocks = [];
  T.scan.notebook.forEach((para, i) => {
    const startLine = line + (i === 0 ? 1 : i === 1 ? 1 : 1);
    line = startLine;
    ctx.save();
    ctx.font = `${font.weight} ${font.size}px ${F_HAND}`;
    const words = para.split(' ');
    let cur = '';
    const lines = [];
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > W - 110 && cur) {
        lines.push(cur);
        cur = w;
      } else cur = test;
    }
    lines.push(cur);
    ctx.restore();
    const y0 = base(line) - 26;
    lines.forEach((l, k) => {
      txt(ctx, l, 72, base(line + k), { ...font, size: i === 0 ? 26 : 24 });
    });
    blocks.push([66, y0, W - 120, lines.length * lh + 6]);
    line += lines.length;
  });
  NOTE_LINES.length = 0;
  NOTE_LINES.push(...blocks);
  // surlignage de détection
  if (hl > 0) {
    blocks.forEach(([x, y, w, h], i) => {
      const k = clamp(hl * blocks.length - i);
      if (k <= 0) return;
      ctx.fillStyle = `rgba(57,167,198,${0.12 * k})`;
      rr(ctx, x - 6, y, w * k + 12, h, 8);
      ctx.fill();
    });
  }
}

const notebookScratch = makeCanvas(NOTE_PX[0], NOTE_PX[1], 1.3);
let notebookKey = '';
function noteImage(hl) {
  const key = `${Math.round(hl * 30)}`;
  if (key !== notebookKey) {
    notebookKey = key;
    const g = notebookScratch.ctx;
    g.save();
    g.setTransform(notebookScratch.scale, 0, 0, notebookScratch.scale, 0, 0);
    notebookPage(g, NOTE_PX[0], NOTE_PX[1], { hl });
    g.restore();
  }
  return notebookScratch.canvas;
}

function pageThumb(ctx, cx, cy, w, rot = 0, alpha = 1) {
  const h = (w * NOTE_PX[1]) / NOTE_PX[0];
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  shadow(ctx, 14, 4, 'rgba(0,0,0,0.25)');
  ctx.save();
  rr(ctx, -w / 2, -h / 2, w, h, 10);
  ctx.clip();
  ctx.drawImage(noteImage(0), -w / 2, -h / 2, w, h);
  ctx.restore();
  noShadow(ctx);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 1. « Photographier une leçon »

export function photoScreen(ctx, W, H, s = {}) {
  const { thumb = 0, tapOpen = 0, tapGen = 0, chipSel = 0 } = s;
  lightBg(ctx, W, H);
  statusBar(ctx, '#0f1d26', '09:41');
  lightHeader(ctx, W, T.scan.photoTitle, T.scan.photoSub);
  lightButton(ctx, 20, 140, W - 40, 52, T.scan.openCam, { iconFn: ic.camera, press: tapOpen > 0 && tapOpen < 1 ? 1 - tapOpen : 0 });
  lightButton(ctx, 20, 204, W - 40, 52, T.scan.gallery, { variant: 'outline', iconFn: icl.image });
  capsLabel(ctx, thumb > 0 ? '1 PAGE' : '0 PAGE', 20, 292);
  if (thumb > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(thumb * 1.5);
    const s2 = 0.85 + 0.15 * thumb;
    ctx.translate(20 + 46, 308 + 60);
    ctx.scale(s2, s2);
    ctx.save();
    rr(ctx, -46, -60, 92, 120, 12);
    ctx.clip();
    ctx.drawImage(noteImage(0), -46, -60, 92, 120);
    ctx.restore();
    ctx.fillStyle = '#102B3B';
    ctx.beginPath();
    ctx.arc(46, -56, 11, 0, TAU);
    ctx.fill();
    icl.close(ctx, 38, -64, 16, '#fff', 2.6);
    ctx.restore();
  } else {
    ctx.strokeStyle = 'rgba(16,43,59,0.15)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    rr(ctx, 20, 308, 92, 120, 12);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  capsLabel(ctx, 'MATIÈRE', 20, 462);
  const chips1 = ['Auto', 'Maths', 'Français', 'Sciences'];
  let x = 20;
  chips1.forEach((c, i) => (x += chip(ctx, x, 474, c, chipSel > 0.5 ? i === 3 : i === 0) + 8));
  x = 20;
  ['Anglais', 'Histoire-Géo'].forEach((c) => (x += chip(ctx, x, 514, c, false) + 8));
  txt(ctx, '« Auto » : Kizzo détecte la matière d’après la photo.', 20, 568, { size: 12.5, weight: 400, color: P.muted, font: F_DISPLAY });
  ctx.save();
  ctx.globalAlpha = 0.55 + 0.45 * thumb;
  lightButton(ctx, 20, 590, W - 40, 52, 'Générer le quiz', { variant: 'orange', iconFn: ic.sparkles, press: tapGen > 0 && tapGen < 1 ? 1 - tapGen : 0 });
  ctx.restore();
  txt(ctx, 'Vous relirez chaque question avant qu’elle entre dans les quiz.', W / 2, 664, { size: 12, weight: 400, color: P.muted, align: 'center', font: F_DISPLAY });
  tapRipple(ctx, W / 2 + 20, 166, tapOpen);
  tapRipple(ctx, W / 2 + 20, 616, tapGen);
}

// ---------------------------------------------------------------------------
// 2. Viseur (« Page 1 », coins orange, bande de scan, déclencheur)

export function cameraScreen(ctx, W, H, s = {}) {
  const { scan = 0, shutter = 0, t = 0 } = s;
  ctx.fillStyle = '#121C21';
  ctx.fillRect(0, 0, W, H);
  // fond (table) légèrement éclairé
  const rg = ctx.createRadialGradient(W / 2, H * 0.44, 30, W / 2, H * 0.44, 420);
  rg.addColorStop(0, '#2c363b');
  rg.addColorStop(1, '#121C21');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
  // page
  const pw = 312, ph = (pw * NOTE_PX[1]) / NOTE_PX[0];
  ctx.save();
  ctx.translate(W / 2, 352);
  ctx.rotate(-0.03 + Math.sin(t * 1.4) * 0.004);
  shadow(ctx, 26, 10, 'rgba(0,0,0,0.55)');
  ctx.save();
  rr(ctx, -pw / 2, -ph / 2, pw, ph, 12);
  ctx.clip();
  ctx.drawImage(noteImage(clamp(scan * 1.1 - 0.05)), -pw / 2, -ph / 2, pw, ph);
  // bande de scan orange
  if (scan > 0 && scan < 1) {
    const by = -ph / 2 + ph * scan;
    const lg = ctx.createLinearGradient(0, by - 34, 0, by + 8);
    lg.addColorStop(0, 'rgba(236,106,44,0)');
    lg.addColorStop(0.8, 'rgba(244,150,100,0.45)');
    lg.addColorStop(1, 'rgba(236,106,44,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(-pw / 2, by - 34, pw, 42);
    ctx.fillStyle = 'rgba(255,240,230,0.95)';
    ctx.fillRect(-pw / 2 + 4, by - 1, pw - 8, 2.5);
  }
  ctx.restore();
  noShadow(ctx);
  ctx.restore();
  // coins orange
  ctx.strokeStyle = P.orange;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  const fx = 22, fy = 118, fw = W - 44, fh = 488, L = 30;
  for (const [x, y, dx, dy] of [
    [fx, fy, 1, 1],
    [fx + fw, fy, -1, 1],
    [fx, fy + fh, 1, -1],
    [fx + fw, fy + fh, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * L);
    ctx.lineTo(x, y + dy * 8);
    ctx.quadraticCurveTo(x, y, x + dx * 8, y);
    ctx.lineTo(x + dx * L, y);
    ctx.stroke();
  }
  // barre haute
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  rr(ctx, 20, 62, 38, 38, 11);
  ctx.fill();
  icl.close(ctx, 28, 70, 22, '#fff');
  txt(ctx, T.scan.page1, W / 2, 88, disp({ size: 17, weight: 700, align: 'center' }));
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  rr(ctx, W - 58, 62, 38, 38, 11);
  ctx.fill();
  icl.bolt(ctx, W - 50, 70, 22, '#F4A26F');
  // consigne
  ctx.fillStyle = 'rgba(8,14,17,0.92)';
  rr(ctx, W / 2 - 118, 618, 236, 36, 18);
  ctx.fill();
  icon.check(ctx, W / 2 - 104, 627, 18, '#3DDC84', 2.6);
  txt(ctx, T.scan.frameHint, W / 2 + 10, 641, { size: 13.5, weight: 600, color: '#fff', align: 'center', font: F_DISPLAY });
  // barre basse
  ctx.fillStyle = '#0E171B';
  ctx.fillRect(0, 676, W, H - 676);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  rr(ctx, 34, 728, 50, 50, 14);
  ctx.fill();
  icl.image(ctx, 47, 741, 24, '#fff');
  rr(ctx, W - 84, 728, 50, 50, 14);
  ctx.fill();
  icl.rotate(ctx, W - 71, 741, 24, '#fff');
  shadow(ctx, 18, 0, 'rgba(236,106,44,0.6)');
  ctx.strokeStyle = '#C8521E';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(W / 2, 753, 36, 0, TAU);
  ctx.stroke();
  noShadow(ctx);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(W / 2, 753, 28 - shutter * 5, 0, TAU);
  ctx.fill();
  if (shutter > 0) {
    ctx.fillStyle = `rgba(255,255,255,${shutter * 0.8})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ---------------------------------------------------------------------------
// 3. « Kizzo lit la leçon de Ben » (pourcentage, étapes)

export function readScreen(ctx, W, H, s = {}) {
  const { k = 0, t = 0 } = s;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#24566A');
  g.addColorStop(0.45, '#12262F');
  g.addColorStop(1, '#0B1316');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  statusBar(ctx, '#fff', '09:41');
  txt(ctx, T.scan.readTitle, 20, 196, disp({ size: 25, weight: 700 }));
  wrap(ctx, T.scan.readSub, 20, 222, W - 50, 18, { size: 14, weight: 500, color: 'rgba(230,240,245,0.65)', font: F_BODY });
  // carte
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  rr(ctx, 20, 262, W - 40, 350, 26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(110,190,210,0.28)';
  ctx.lineWidth = 1.5;
  rr(ctx, 20, 262, W - 40, 350, 26);
  ctx.stroke();
  // pages en éventail + ligne de lecture
  pageThumb(ctx, W / 2 - 92, 352, 88, -0.12, 0.75);
  pageThumb(ctx, W / 2 + 92, 352, 88, 0.12, 0.75);
  pageThumb(ctx, W / 2, 346, 92, 0, 1);
  const ly = 290 + ((t * 70) % 120);
  const lg = ctx.createLinearGradient(40, 0, W - 40, 0);
  lg.addColorStop(0, 'rgba(61,180,217,0)');
  lg.addColorStop(0.3, 'rgba(127,211,236,0.9)');
  lg.addColorStop(0.7, 'rgba(236,106,44,0.9)');
  lg.addColorStop(1, 'rgba(236,106,44,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(40, ly, W - 80, 2.5);
  // pourcentage
  const pct = Math.round(k * 100);
  ctx.save();
  ctx.font = `800 58px ${F_DISPLAY}`;
  const pw = ctx.measureText(String(pct)).width;
  ctx.restore();
  txt(ctx, String(pct), W / 2 - 12, 470, disp({ size: 58, weight: 800, align: 'center' }));
  txt(ctx, '%', W / 2 - 12 + pw / 2 + 4, 470, disp({ size: 30, weight: 700, color: '#7FD3EC' }));
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  rr(ctx, 44, 494, W - 88, 7, 3.5);
  ctx.fill();
  const bg2 = ctx.createLinearGradient(44, 0, W - 44, 0);
  bg2.addColorStop(0, '#5CC8E4');
  bg2.addColorStop(1, '#EC6A2C');
  ctx.fillStyle = bg2;
  rr(ctx, 44, 494, (W - 88) * k, 7, 3.5);
  ctx.fill();
  // étapes
  T.scan.steps.forEach((label, i) => {
    const y = 536 + i * 32;
    const done = k > [0.34, 0.72, 0.97][i];
    const active = !done && k > [0, 0.34, 0.72][i];
    if (done) {
      ctx.fillStyle = '#1F5E46';
      ctx.beginPath();
      ctx.arc(54, y, 11, 0, TAU);
      ctx.fill();
      icon.check(ctx, 46, y - 8, 16, '#3DDC84', 2.6);
    } else if (active) {
      ctx.strokeStyle = '#7FD3EC';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(54, y, 10, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = '#7FD3EC';
      ctx.beginPath();
      ctx.arc(54, y, 5, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(54, y, 10, 0, TAU);
      ctx.stroke();
    }
    txt(ctx, label, 76, y + 5.5, { size: 15, weight: 600, color: done || active ? '#F4F8FA' : 'rgba(244,248,250,0.45)', font: F_BODY });
  });
  wrap(ctx, T.scan.review, W / 2, 650, W - 60, 18, { size: 13, weight: 500, color: 'rgba(230,240,245,0.55)', align: 'center', font: F_BODY });
}

// ---------------------------------------------------------------------------
// 4. « Questions générées »

export function questionsScreen(ctx, W, H, s = {}) {
  const { scroll = 0, reveal = 1 } = s;
  lightBg(ctx, W, H);
  ctx.save();
  ctx.translate(0, -scroll);
  txt(ctx, T.scan.genTitle, 20, 84, disp({ size: 24, weight: 700, color: P.ink }));
  txt(ctx, T.scan.genSub, W - 20, 112, { size: 13, weight: 500, color: P.muted, align: 'right', font: F_DISPLAY });
  capsLabel(ctx, T.scan.titleLabel, 20, 146);
  lightCard(ctx, 20, 156, W - 40, 44, 22);
  txt(ctx, T.scan.lessonTitle, 36, 184, disp({ size: 17, weight: 700, color: P.ink }));
  T.quiz.items.slice(0, 2).forEach((q, qi) => {
    const y0 = 222 + qi * 330;
    lightCard(ctx, 20, y0, W - 40, 312, 24, 'rgba(255,255,255,0.93)');
    txt(ctx, T.scan.question(qi + 1), 36, y0 + 30, { size: 12.5, weight: 500, color: P.cyan, ls: 0.6, font: F_DISPLAY });
    icl.trash(ctx, W - 56, y0 + 14, 20, '#E05555');
    wrap(ctx, q.q, 36, y0 + 60, W - 80, 20, disp({ size: 15.5, weight: 700, color: P.ink }));
    q.a.forEach((opt, j) => {
      const k = clamp(reveal * 5 - j - qi * 2);
      if (k <= 0) return;
      const y = y0 + 98 + j * 40;
      const ok = j === q.ok;
      ctx.save();
      ctx.globalAlpha *= k;
      ctx.fillStyle = ok ? '#E4F2EA' : 'rgba(248,250,250,0.9)';
      rr(ctx, 36, y, W - 72, 32, 12);
      ctx.fill();
      ctx.strokeStyle = ok ? '#7CC59C' : 'rgba(16,43,59,0.1)';
      ctx.lineWidth = ok ? 1.8 : 1.2;
      rr(ctx, 36, y, W - 72, 32, 12);
      ctx.stroke();
      txt(ctx, opt, 50, y + 21, { size: 14, weight: 400, color: P.ink, font: F_DISPLAY });
      if (ok) icon.check(ctx, W - 66, y + 6, 20, P.green, 2.6);
      ctx.restore();
    });
    capsLabel(ctx, T.scan.goodAnswer, 36, y0 + 270);
    lightCard(ctx, 36, y0 + 278, W - 72, 26, 12);
    txt(ctx, q.a[q.ok], 48, y0 + 296, disp({ size: 13.5, weight: 700, color: P.ink }));
  });
  ctx.restore();
  statusBar(ctx, '#0f1d26', '09:41');
}

// ---------------------------------------------------------------------------
// 5. « Quiz automatiques » (fréquence)

export function autoQuizScreen(ctx, W, H, s = {}) {
  const { sel = 0, press = 0, sent = 0, tap = 0, wave = 0 } = s;
  lightBg(ctx, W, H);
  statusBar(ctx, '#0f1d26', '09:42');
  lightHeader(ctx, W, T.scan.autoTitle, T.scan.autoSub);
  lightCard(ctx, 20, 146, W - 40, 236, 24);
  // icône
  ctx.fillStyle = P.cyanCard;
  ctx.beginPath();
  ctx.arc(52, 182, 20, 0, TAU);
  ctx.fill();
  ic.sparkles(ctx, 40, 170, 24, P.cyan);
  txt(ctx, T.scan.freqLabel, 82, 188, disp({ size: 17, weight: 600, color: P.ink }));
  // segmenté 10/15/20/30
  const sx = 36, sw = W - 72, sy = 214, sh = 54;
  ctx.fillStyle = '#EEF3F5';
  rr(ctx, sx, sy, sw, sh, 18);
  ctx.fill();
  const cw = sw / 4;
  shadow(ctx, 14, 2, 'rgba(57,167,198,0.5)');
  ctx.fillStyle = P.cyan;
  rr(ctx, sx + 4 + cw * sel, sy + 4, cw - 8, sh - 8, 15);
  ctx.fill();
  noShadow(ctx);
  T.scan.freqOpts.forEach((o, i) => {
    const on = Math.abs(sel - i) < 0.5;
    txt(ctx, o, sx + cw * (i + 0.5), sy + 28, { size: 19, weight: 700, color: on ? '#fff' : P.ink, align: 'center', font: F_DISPLAY });
    txt(ctx, T.scan.min, sx + cw * (i + 0.5), sy + 45, { size: 11, weight: 500, color: on ? 'rgba(255,255,255,0.9)' : P.muted, align: 'center', font: F_DISPLAY });
  });
  txt(ctx, T.scan.perQuiz, 36, 306, disp({ size: 15, weight: 600, color: P.ink }));
  let x = 36;
  T.scan.perOpts.forEach((o, i) => (x += chip(ctx, x, 322, `${o} questions`, i === 0) + 8));
  // résumé
  lightCard(ctx, 20, 398, W - 40, 64, 18, P.cyanCard, P.cyanBorder);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(52, 430, 18, 0, TAU);
  ctx.fill();
  ic.sparkles(ctx, 41, 419, 22, P.cyan);
  txt(ctx, T.parent.autoTitle, 82, 424, disp({ size: 16, weight: 600, color: P.ink }));
  txt(ctx, T.parent.autoSub(T.scan.freqOpts[Math.round(sel)]), 82, 446, { size: 13, weight: 400, color: P.muted, font: F_DISPLAY });
  icl.chevron(ctx, W - 48, 419, 22, P.muted);
  if (sent > 0) {
    ctx.fillStyle = P.greenBg;
    rr(ctx, 20, 486, W - 40, 52, 22);
    ctx.fill();
    ctx.strokeStyle = P.greenBorder;
    ctx.lineWidth = 2;
    rr(ctx, 21, 487, W - 42, 50, 21);
    ctx.stroke();
    icon.check(ctx, W / 2 - 72, 500, 22, P.green, 3);
    txt(ctx, T.scan.sent, W / 2 + 12, 518, disp({ size: 17, weight: 600, color: P.green, align: 'center' }));
  } else {
    lightButton(ctx, 20, 486, W - 40, 52, T.scan.send, { variant: 'orange', iconFn: ic.sparkles, press });
  }
  planCard(ctx, W, 556, sel, wave);
  const cxTap = sx + cw * 1.5;
  tapRipple(ctx, cxTap, sy + sh / 2, tap);
}

// Planning de l'après-midi : un jalon « Quiz » à chaque intervalle choisi
function planCard(ctx, W, y, sel, wave) {
  const opts = T.scan.freqOpts.map(Number);
  const i0 = Math.floor(clamp(sel, 0, opts.length - 1));
  const m = lerp(opts[i0], opts[Math.min(i0 + 1, opts.length - 1)], sel - i0);
  lightCard(ctx, 20, y, W - 40, 186, 24);
  txt(ctx, T.scan.planTitle, 40, y + 34, disp({ size: 16, weight: 600, color: P.ink }));
  txt(ctx, T.scan.planSub, W - 40, y + 34, { size: 12.5, weight: 500, color: P.muted, align: 'right', font: F_DISPLAY });
  const x0 = 52, x1 = W - 52, span = 60, ly = y + 96;
  // bande « écran libre » entre les quiz
  ctx.fillStyle = '#EEF3F5';
  rr(ctx, x0 - 10, ly - 7, x1 - x0 + 20, 14, 7);
  ctx.fill();
  const hm = (v) => `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')}`;
  const n = Math.floor(span / m + 0.01);
  for (let k = 0; k <= n; k++) {
    const x = x0 + ((k * m) / span) * (x1 - x0);
    // à l'envoi, une onde allume les jalons un par un
    const hi = wave > 0 && wave < 1 ? clamp(1 - Math.abs(wave * (n + 1.5) - k - 0.5)) : 0;
    if (hi > 0) {
      ctx.fillStyle = `rgba(57,167,198,${0.25 * hi})`;
      ctx.beginPath();
      ctx.arc(x, ly, 10 + 12 * hi, 0, TAU);
      ctx.fill();
    }
    shadow(ctx, 10, 2, 'rgba(57,167,198,0.45)');
    ctx.fillStyle = P.cyan;
    rr(ctx, x - 21, ly - 37 - 4 * hi, 42, 24, 12);
    ctx.fill();
    noShadow(ctx);
    txt(ctx, T.scan.planQuiz, x, ly - 20 - 4 * hi, { size: 11.5, weight: 700, color: '#fff', align: 'center', font: F_DISPLAY });
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, ly, 9, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = P.cyan;
    ctx.lineWidth = 3;
    ctx.stroke();
    txt(ctx, hm(T.scan.planStart + Math.round(k * m)), x, ly + 30, { size: 12, weight: 700, color: P.ink, align: 'center', font: F_NUM });
  }
  ctx.fillStyle = P.orange;
  ctx.beginPath();
  ctx.arc(46, y + 160, 4, 0, TAU);
  ctx.fill();
  txt(ctx, T.scan.planLegend, 58, y + 164, { size: 12.5, weight: 500, color: P.muted, font: F_DISPLAY });
}

// ---------------------------------------------------------------------------
// 6. Tableau de bord parent (« Bonjour Léa »)

export const PARENT_LAYOUT = {
  child: [20, 146, 350, 212],
  auto: [20, 370, 350, 62],
  photo: [20, 442, 350, 66],
  stats: [20, 524, 350, 112],
};

export function parentBase(ctx, W, H) {
  lightBg(ctx, W, H);
  statusBar(ctx, '#0f1d26', '09:41');
  txt(ctx, T.parent.hello, 20, 100, disp({ size: 31, weight: 700, color: P.ink }));
  txt(ctx, T.parent.date, 20, 128, { size: 15, weight: 400, color: P.muted, font: F_DISPLAY });
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(W - 40, 88, 21, 0, TAU);
  ctx.fill();
  ic.settings(ctx, W - 51, 77, 22, P.ink);
  ctx.fillStyle = 'rgba(16,43,59,0.06)';
  for (const k of ['child', 'auto', 'photo', 'stats']) {
    const [x, y, w, h] = PARENT_LAYOUT[k];
    rr(ctx, x, y, w, h, 22);
    ctx.fill();
  }
  capsLabel(ctx, 'SUIVI', 24, 668);
  lightCard(ctx, 20, 680, W - 40, 150, 22);
  [
    [icl.bars, 'Progrès', 'Résultats aux quiz, par matière'],
    [ic.trending, 'Activité', 'Les applications utilisées'],
  ].forEach(([fn, t1, t2], i) => {
    const y = 680 + i * 74;
    if (i) {
      ctx.strokeStyle = P.border;
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(W - 20, y);
      ctx.stroke();
    }
    ctx.fillStyle = P.cyanCard;
    rr(ctx, 34, y + 16, 40, 40, 12);
    ctx.fill();
    fn(ctx, 42, y + 24, 24, P.cyan);
    txt(ctx, t1, 88, y + 34, disp({ size: 17, weight: 600, color: P.ink }));
    txt(ctx, t2, 88, y + 54, { size: 13, weight: 400, color: P.muted, font: F_DISPLAY });
    icl.chevron(ctx, W - 50, y + 26, 20, P.muted);
  });
}

export function parentChildCard(ctx, W, H) {
  lightCard(ctx, 0, 0, W, H, 24);
  // avatar B
  ctx.strokeStyle = 'rgba(57,167,198,0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(52, 50, 32, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = P.cyan;
  ctx.beginPath();
  ctx.arc(52, 50, 26, 0, TAU);
  ctx.fill();
  txt(ctx, 'B', 52, 59, { size: 24, weight: 500, color: '#fff', align: 'center', font: F_DISPLAY });
  txt(ctx, T.parent.child, 100, 44, disp({ size: 20, weight: 700, color: P.ink }));
  ctx.fillStyle = P.greenBg;
  rr(ctx, 100, 56, 78, 24, 12);
  ctx.fill();
  ctx.strokeStyle = P.greenBorder;
  ctx.lineWidth = 1.2;
  rr(ctx, 100, 56, 78, 24, 12);
  ctx.stroke();
  ctx.fillStyle = P.green;
  ctx.beginPath();
  ctx.arc(112, 68, 3.5, 0, TAU);
  ctx.fill();
  txt(ctx, T.parent.online, 120, 73, { size: 13, weight: 500, color: P.green, font: F_DISPLAY });
  txt(ctx, `· ${T.parent.grade}`, 186, 73, { size: 13, weight: 400, color: P.muted, font: F_DISPLAY });
  ctx.fillStyle = P.cyanCard;
  ctx.beginPath();
  ctx.arc(W - 32, 36, 16, 0, TAU);
  ctx.fill();
  icl.pencil(ctx, W - 41, 27, 18, P.cyan);
  // bloc temps restant (pêche)
  ctx.fillStyle = P.peachCard;
  rr(ctx, 12, 96, W - 24, 104, 18);
  ctx.fill();
  txt(ctx, T.parent.remainingLabel, 26, 124, { size: 13.5, weight: 400, color: P.ink, font: F_DISPLAY });
  txt(ctx, T.parent.remaining, W - 26, 124, disp({ size: 17, weight: 700, color: P.orange, align: 'right' }));
  ctx.fillStyle = P.peachBar;
  rr(ctx, 26, 136, W - 52, 9, 4.5);
  ctx.fill();
  ctx.fillStyle = P.orange;
  rr(ctx, 26, 136, (W - 52) * 0.125, 9, 4.5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  rr(ctx, 26, 156, W - 52, 32, 14);
  ctx.fill();
  icon.check(ctx, 36, 162, 18, P.green, 2.6);
  txt(ctx, T.parent.earnedNote, 60, 177, { size: 13, weight: 500, color: P.green, font: F_DISPLAY });
}

export function parentAutoCard(ctx, W, H, minutes = '15') {
  lightCard(ctx, 0, 0, W, H, 18, P.cyanCard, P.cyanBorder);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(34, H / 2, 19, 0, TAU);
  ctx.fill();
  ic.sparkles(ctx, 23, H / 2 - 11, 22, P.cyan);
  txt(ctx, T.parent.autoTitle, 64, 27, disp({ size: 17, weight: 600, color: P.ink }));
  txt(ctx, T.parent.autoSub(minutes), 64, 47, { size: 13, weight: 400, color: P.muted, font: F_DISPLAY });
  icl.chevron(ctx, W - 34, H / 2 - 11, 22, P.muted);
}

export function parentPhotoCard(ctx, W, H) {
  shadow(ctx, 18, 4, 'rgba(236,106,44,0.4)');
  ctx.fillStyle = P.orange;
  rr(ctx, 0, 0, W, H, 18);
  ctx.fill();
  noShadow(ctx);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.arc(34, H / 2, 19, 0, TAU);
  ctx.fill();
  ic.camera(ctx, 23, H / 2 - 11, 22, '#fff');
  txt(ctx, T.parent.photoTitle, 64, 29, disp({ size: 16.5, weight: 600, color: '#fff' }));
  txt(ctx, T.parent.photoSub, 64, 49, { size: 12.5, weight: 400, color: 'rgba(255,255,255,0.9)', font: F_DISPLAY });
  icl.chevron(ctx, W - 32, H / 2 - 11, 22, '#fff');
}

export function parentStats(ctx, W, H) {
  capsLabel(ctx, T.parent.last30, 4, 12);
  const cols = [P.orange, P.cyan, P.green];
  const cw = (W - 16) / 3;
  T.parent.stats.forEach(([n, l1, l2], i) => {
    const x = i * (cw + 8);
    lightCard(ctx, x, 24, cw, 86, 18);
    txt(ctx, n, x + 16, 58, disp({ size: 24, weight: 700, color: cols[i] }));
    txt(ctx, l1, x + 16, 80, { size: 13, weight: 400, color: P.ink, font: F_DISPLAY });
    if (l2) txt(ctx, l2, x + 16, 97, { size: 13, weight: 400, color: P.muted, font: F_DISPLAY });
  });
}

/** Puces de règles 3D (sources des traînées lumineuses) — style clair des captures. */
export function ruleChip(ctx, W, H, i) {
  const cols = [P.cyan, '#E0962A', '#7C6CD8'];
  const icons = [ic.sparkles, ic.hourglass, icon.moon];
  ctx.fillStyle = '#ffffff';
  rr(ctx, 0, 0, W, H, H / 2);
  ctx.fill();
  ctx.strokeStyle = cols[i];
  ctx.lineWidth = 2;
  rr(ctx, 1, 1, W - 2, H - 2, H / 2 - 1);
  ctx.stroke();
  ctx.fillStyle = 'rgba(57,167,198,0.12)';
  ctx.beginPath();
  ctx.arc(H / 2, H / 2, H / 2 - 6, 0, TAU);
  ctx.fill();
  icons[i](ctx, H / 2 - 10, H / 2 - 10, 20, cols[i]);
  txt(ctx, T.parent.rules[i], H + 2, H / 2 + 5.5, { size: 14.5, weight: 600, color: P.ink, font: F_DISPLAY });
}

// briques réutilisées par les autres films
export { a as rgba, card as darkCard, lightCard, tapRipple };
