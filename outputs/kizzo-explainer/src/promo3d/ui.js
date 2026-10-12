// Visuels 2D de la promo 3D : écran cassé, écran d'accueil Kizzo, cartes qui sortent de l'écran
// (question, réponses, puces de fréquence, interrupteur, notification) et typo cinétique.
// Les écrans réels des apps (jeu, verrouillage, résultat, réglages parent) viennent des
// modules existants ; ici seulement ce qui est propre à ce film.
import { rr, txt, icon, F_DISPLAY, F_BODY, F_NUM } from '../ui-canvas.js';
import { LOGO } from '../logo-shape.js';
import { COL, T } from './config.js';
import { clamp, rng, TAU, lerp } from '../util.js';

/** Logo Kizzo plat (corps/tête + rond de l'enfant). */
export function logoFlat(ctx, x, y, h, body = COL.cyan, child = COL.orange) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(h, -h);
  ctx.fillStyle = body;
  ctx.beginPath();
  LOGO.body.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(LOGO.head.c[0], LOGO.head.c[1], LOGO.head.r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = child;
  ctx.beginPath();
  ctx.arc(LOGO.child.c[0], LOGO.child.c[1], LOGO.child.r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Dalle de l'écran sous le verre : éteinte, pixels morts, puis l'orange revient depuis l'impact. */
export function crackedLCD(ctx, W, H, t, glow, ix, iy) {
  ctx.fillStyle = COL.black;
  ctx.fillRect(0, 0, W, H);
  // lignes de pixels morts (écran écrasé)
  const flick = Math.sin(t * 83) * Math.sin(t * 31 + 1) > -0.2 ? 1 : 0.4;
  ctx.globalAlpha = 0.5 * flick * (1 - glow);
  [
    [212, '#3DB5DA', 2.5],
    [219, '#F472B6', 1.5],
    [640, '#FACC15', 2],
  ].forEach(([y, c, h]) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, y, W, h);
  });
  ctx.fillStyle = '#fff';
  ctx.fillRect(272, 0, 2, H);
  ctx.globalAlpha = 1;
  if (glow > 0) {
    const r = 40 + glow * 900;
    const g = ctx.createRadialGradient(ix, iy, 0, ix, iy, r);
    g.addColorStop(0, `rgba(255,170,90,${Math.min(1, glow * 1.6)})`);
    g.addColorStop(0.45, `rgba(249,115,22,${Math.min(1, glow * 1.4)})`);
    g.addColorStop(1, 'rgba(249,115,22,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

/** Écran d'accueil Kizzo (orange, logo blanc). */
export function splash(ctx, W, H, k = 1) {
  ctx.fillStyle = COL.orange;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = clamp(k);
  const s = 0.85 + 0.15 * k;
  ctx.translate(W / 2, H / 2 - 30);
  ctx.scale(s, s);
  logoFlat(ctx, 0, 0, 150, '#FFFFFF', COL.navy);
  txt(ctx, 'kizzo', 0, 150, { size: 64, weight: 800, color: '#fff', align: 'center', font: F_DISPLAY, ls: -2 });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Cartes qui sortent de l'écran (thème sombre de l'app enfant, thème clair de l'app parent)

const navyCard = (ctx, W, H, border = 'rgba(61,181,218,0.6)') => {
  ctx.fillStyle = '#152A4A';
  rr(ctx, 6, 6, W - 12, H - 12, 30);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  rr(ctx, 6, 6, W - 12, H - 12, 30);
  ctx.stroke();
};

export const Q_PX = [360, 220];
export function questionCard(ctx, W, H) {
  navyCard(ctx, W, H);
  ctx.fillStyle = COL.orange;
  rr(ctx, 26, 26, 92, 32, 16);
  ctx.fill();
  txt(ctx, T.quiz.subject, 72, 48, { size: 14, weight: 800, color: '#fff', align: 'center', font: F_BODY, ls: 1.4 });
  txt(ctx, T.quiz.of, W - 28, 48, { size: 14, weight: 600, color: 'rgba(250,250,250,0.6)', align: 'right', font: F_BODY });
  txt(ctx, T.quiz.q[0], W / 2, 110, { size: 24, weight: 700, color: 'rgba(250,250,250,0.85)', align: 'center', font: F_DISPLAY });
  txt(ctx, T.quiz.q[1], W / 2, 180, { size: 64, weight: 700, color: '#fff', align: 'center', font: F_NUM, ls: -2 });
}

export const TILE_PX = [170, 96];
/** Tuile réponse ; state : 0 neutre, 1 bonne réponse choisie. */
export function answerTile(ctx, W, H, label, state = 0) {
  ctx.fillStyle = state ? COL.orange : '#1E3A5F';
  rr(ctx, 5, 5, W - 10, H - 10, 26);
  ctx.fill();
  ctx.strokeStyle = state ? '#FFB27A' : 'rgba(61,181,218,0.55)';
  ctx.lineWidth = 3;
  rr(ctx, 5, 5, W - 10, H - 10, 26);
  ctx.stroke();
  txt(ctx, label, state ? W / 2 - 16 : W / 2, H / 2 + 17, { size: 48, weight: 700, color: '#fff', align: 'center', font: F_NUM });
  if (state) icon.check(ctx, W / 2 + 22, H / 2 - 16, 32, '#fff', 3.6);
}

export const CHIP_PX = [190, 84];
export function chip(ctx, W, H, label, sel = 0) {
  ctx.fillStyle = sel ? COL.orange : '#FFFFFF';
  rr(ctx, 5, 5, W - 10, H - 10, (H - 10) / 2);
  ctx.fill();
  if (!sel) {
    ctx.strokeStyle = '#E2DDD4';
    ctx.lineWidth = 3;
    rr(ctx, 5, 5, W - 10, H - 10, (H - 10) / 2);
    ctx.stroke();
  }
  txt(ctx, label, W / 2, H / 2 + 12, { size: 34, weight: 700, color: sel ? '#fff' : COL.navy, align: 'center', font: F_NUM });
}

export const TOGGLE_PX = [380, 120];
export function toggleCard(ctx, W, H, on = 0) {
  ctx.fillStyle = '#FFFFFF';
  rr(ctx, 5, 5, W - 10, H - 10, 30);
  ctx.fill();
  ctx.fillStyle = COL.navy;
  rr(ctx, 26, 30, 60, 60, 18);
  ctx.fill();
  icon.bolt(ctx, 40, 44, 32, COL.orange);
  txt(ctx, T.toggle.title, 102, 60, { size: 19, weight: 800, color: COL.navy, font: F_DISPLAY });
  txt(ctx, T.toggle.sub, 102, 84, { size: 13, weight: 600, color: '#5C6370', font: F_BODY });
  const tx = W - 104, ty = 42, tw = 76, th = 40;
  const c = [Math.round(lerp(220, 249, on)), Math.round(lerp(215, 115, on)), Math.round(lerp(206, 22, on))];
  ctx.fillStyle = `rgb(${c.join(',')})`;
  rr(ctx, tx, ty, tw, th, th / 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(tx + lerp(20, tw - 20, on), ty + th / 2, 16, 0, TAU);
  ctx.fill();
}

export const NOTIF_PX = [380, 112];
export function notifCard(ctx, W, H) {
  ctx.fillStyle = 'rgba(255,255,255,0.97)';
  rr(ctx, 5, 5, W - 10, H - 10, 30);
  ctx.fill();
  ctx.fillStyle = COL.orange;
  rr(ctx, 24, 26, 60, 60, 16);
  ctx.fill();
  logoFlat(ctx, 54, 56, 44, '#FFFFFF', COL.navy);
  txt(ctx, T.notif.app, 100, 44, { size: 13, weight: 800, color: '#7A7F88', font: F_BODY, ls: 1.2 });
  txt(ctx, 'maintenant', W - 26, 44, { size: 13, weight: 600, color: '#9AA0A8', align: 'right', font: F_BODY });
  txt(ctx, T.notif.title, 100, 72, { size: 21, weight: 800, color: COL.navy, font: F_DISPLAY });
  txt(ctx, T.notif.body, 100, 94, { size: 15, weight: 600, color: '#5C6370', font: F_BODY });
}

/**
 * Typo cinétique : lignes en capitales, une couleur par ligne possible.
 * @param {{s: string, color?: string}[]} lines
 */
export function typeBlock(ctx, W, H, lines, { size = 150, color = '#fff', lh = 0.95, align = 'center' } = {}) {
  const x = align === 'center' ? W / 2 : 20;
  const total = lines.length * size * lh;
  let y = (H - total) / 2 + size * 0.8;
  for (const l of lines) {
    txt(ctx, l.s, x, y, { size, weight: 800, color: l.color || color, align, font: F_DISPLAY, ls: -size * 0.045 });
    y += size * lh;
  }
}

/** Fond d'écran « quiz » de l'app enfant (navy, en-tête). */
export function kidQuizBg(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#152A4A');
  g.addColorStop(1, '#0A1526');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  txt(ctx, 'Quiz du jour', 24, 150, { size: 30, weight: 700, color: '#fff', font: F_DISPLAY });
  txt(ctx, 'QUESTION 1 SUR 3', 24, 196, { size: 13, weight: 700, color: '#3DB4D9', font: F_BODY, ls: 1.3 });
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  rr(ctx, 24, 210, W - 48, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#3DB4D9';
  rr(ctx, 24, 210, (W - 48) / 3, 8, 4);
  ctx.fill();
  const r = rng(4);
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.1})`;
    ctx.beginPath();
    ctx.arc(r() * W, 260 + r() * (H - 300), 1 + r() * 2, 0, TAU);
    ctx.fill();
  }
}
