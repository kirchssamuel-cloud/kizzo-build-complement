// Interfaces Kizzo dessinées en Canvas 2D, puis utilisées comme textures sur les écrans
// et panneaux 3D. Unités logiques type iPhone (écran 390 × 860), rendues en 2×+.
import * as THREE from 'three';
import { BRAND as B, T } from './config.js';
import { LOGO } from './logo-shape.js';
import { lockedCard } from './ui-kizzo.js';
import { clamp, rng, TAU } from './util.js';

export const SCREEN_W = 390;
export const SCREEN_H = 860;

export const F_DISPLAY = 'Outfit, "Plus Jakarta Sans", system-ui, sans-serif';
export const F_BODY = '"Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", sans-serif';
export const F_NUM = '"Space Grotesk", "Plus Jakarta Sans", system-ui, sans-serif';
export const F_HAND = 'Caveat, "Segoe Print", cursive';

// ---------------------------------------------------------------------------
// Primitives

export function makeCanvas(w, h, scale = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  // canvas logiciel : évite les effacements perdus du canvas accéléré
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  return { canvas, ctx, w, h, scale };
}

export function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function txt(ctx, s, x, y, o = {}) {
  const { size = 16, weight = 600, color = '#fff', align = 'left', base = 'alphabetic', font = F_BODY, ls = 0, alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${ls}px`;
  ctx.fillText(s, x, y);
  ctx.restore();
}
export const disp = (o) => ({ font: F_DISPLAY, ...o });

export function shadow(ctx, blur, y, color = 'rgba(15,23,42,0.18)') {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = y;
}
export function noShadow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

// ---------------------------------------------------------------------------
// Icônes vectorielles (traits arrondis, style Kizzo)

export const icon = {
  lock(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(7, 11);
    ctx.lineTo(7, 7.5);
    ctx.arc(12, 7.5, 5, Math.PI, 0);
    ctx.lineTo(17, 11);
    ctx.stroke();
    rr(ctx, 4, 10.5, 16, 11.5, 3.5);
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(12, 15.5, 1.7, 0, TAU);
    ctx.fill();
    ctx.fillRect(11.2, 15.5, 1.6, 3.2);
    ctx.restore();
  },
  unlock(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(7, 11);
    ctx.lineTo(7, 7.5);
    ctx.arc(12, 7.5, 5, Math.PI, -0.25);
    ctx.stroke();
    rr(ctx, 4, 10.5, 16, 11.5, 3.5);
    ctx.fill();
    ctx.restore();
  },
  check(ctx, x, y, s, color, w = 3) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(5, 12.5);
    ctx.lineTo(10, 17.5);
    ctx.lineTo(19.5, 7);
    ctx.stroke();
    ctx.restore();
  },
  clock(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(12, 13, 8, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, 9);
    ctx.lineTo(12, 13);
    ctx.lineTo(15, 15);
    ctx.moveTo(9.5, 2.8);
    ctx.lineTo(14.5, 2.8);
    ctx.stroke();
    ctx.restore();
  },
  star(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x + s / 2, y + s / 2);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? s * 0.22 : s * 0.5;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.08;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },
  flame(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(12, 2);
    ctx.bezierCurveTo(15, 7, 20, 9, 19, 15);
    ctx.bezierCurveTo(18.5, 19.5, 15, 22, 12, 22);
    ctx.bezierCurveTo(8, 22, 5, 19, 5, 15);
    ctx.bezierCurveTo(5, 11, 8, 10, 9, 6);
    ctx.bezierCurveTo(10.5, 8, 11, 9, 11.5, 10);
    ctx.bezierCurveTo(12.5, 7.5, 12.5, 5, 12, 2);
    ctx.fill();
    ctx.restore();
  },
  moon(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(12, 12, 9, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(17, 8, 8, 0, TAU);
    ctx.fill();
    ctx.restore();
  },
  book(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(12, 6);
    ctx.bezierCurveTo(9, 4, 5, 4, 3, 5);
    ctx.lineTo(3, 19);
    ctx.bezierCurveTo(5, 18, 9, 18, 12, 20);
    ctx.bezierCurveTo(15, 18, 19, 18, 21, 19);
    ctx.lineTo(21, 5);
    ctx.bezierCurveTo(19, 4, 15, 4, 12, 6);
    ctx.lineTo(12, 20);
    ctx.stroke();
    ctx.restore();
  },
  school(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(12, 3);
    ctx.lineTo(23, 9);
    ctx.lineTo(12, 15);
    ctx.lineTo(1, 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6, 12);
    ctx.lineTo(6, 17);
    ctx.bezierCurveTo(9, 20, 15, 20, 18, 17);
    ctx.lineTo(18, 12);
    ctx.stroke();
    ctx.restore();
  },
  atom(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x + s / 2, y + s / 2);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = s * 0.075;
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.46, s * 0.18, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.09, 0, TAU);
    ctx.fill();
    ctx.restore();
  },
  divide(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x + s / 2, y + s / 2);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.34, 0);
    ctx.lineTo(s * 0.34, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -s * 0.27, s * 0.09, 0, TAU);
    ctx.arc(0, s * 0.27, s * 0.09, 0, TAU);
    ctx.fill();
    ctx.restore();
  },
  letters(ctx, x, y, s, color) {
    txt(ctx, 'Aa', x + s / 2, y + s * 0.78, disp({ size: s * 0.78, weight: 800, color, align: 'center' }));
  },
  globe(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x + s / 2, y + s / 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.075;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.18, s * 0.42, 0, 0, TAU);
    ctx.moveTo(-s * 0.42, 0);
    ctx.lineTo(s * 0.42, 0);
    ctx.stroke();
    ctx.restore();
  },
  bolt(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(13.5, 2);
    ctx.lineTo(4.5, 13.5);
    ctx.lineTo(11, 13.5);
    ctx.lineTo(10, 22);
    ctx.lineTo(19.5, 10);
    ctx.lineTo(13, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
  bell(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6, 17);
    ctx.lineTo(6, 11);
    ctx.bezierCurveTo(6, 7, 8.5, 4.5, 12, 4.5);
    ctx.bezierCurveTo(15.5, 4.5, 18, 7, 18, 11);
    ctx.lineTo(18, 17);
    ctx.lineTo(20, 18.5);
    ctx.lineTo(4, 18.5);
    ctx.closePath();
    ctx.moveTo(10, 21);
    ctx.lineTo(14, 21);
    ctx.stroke();
    ctx.restore();
  },
  play(ctx, x, y, s, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.28, y + s * 0.18);
    ctx.lineTo(x + s * 0.84, y + s * 0.5);
    ctx.lineTo(x + s * 0.28, y + s * 0.82);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.1;
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  },
  trophy(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 24, s / 24);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 3);
    ctx.lineTo(18, 3);
    ctx.lineTo(18, 9);
    ctx.bezierCurveTo(18, 13, 15, 15, 12, 15);
    ctx.bezierCurveTo(9, 15, 6, 13, 6, 9);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, 5);
    ctx.lineTo(3, 5);
    ctx.bezierCurveTo(3, 9, 5, 10, 6.5, 10);
    ctx.moveTo(18, 5);
    ctx.lineTo(21, 5);
    ctx.bezierCurveTo(21, 9, 19, 10, 17.5, 10);
    ctx.stroke();
    ctx.fillRect(10.8, 14, 2.4, 4);
    rr(ctx, 7, 18, 10, 3.5, 1.5);
    ctx.fill();
    ctx.restore();
  },
  logo(ctx, x, y, h, colors = {}) {
    // Logo Kizzo vectoriel (issu du tracé du logo officiel)
    const { body = B.cyan, child = B.orange } = colors;
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
  },
};

export function statusBar(ctx, color = '#fff', time = '7:42') {
  txt(ctx, time, 34, 32, { size: 15, weight: 700, color, font: F_BODY });
  // réseau / batterie
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < 4; i++) rr(ctx, 290 + i * 5, 26 - i * 2.4, 3, 6 + i * 2.4, 1), ctx.fill();
  ctx.globalAlpha = 0.45;
  rr(ctx, 320, 19, 25, 12, 3.5);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.globalAlpha = 1;
  rr(ctx, 322, 21, 15, 8, 2);
  ctx.fill();
  ctx.restore();
  // Dynamic Island
  ctx.fillStyle = '#05070c';
  rr(ctx, 140, 12, 110, 32, 16);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Texture canvas avec cache par clé d'état (évite les uploads GPU inutiles)

export class CanvasTex {
  static all = [];
  static ready = false;
  constructor(w, h, scale = 2) {
    Object.assign(this, makeCanvas(w, h, scale));
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.key = null;
    CanvasTex.all.push(this);
  }
  /** Redessine toutes les textures (après le chargement des polices). */
  static redrawAll() {
    CanvasTex.ready = true;
    for (const c of CanvasTex.all) {
      if (!c.fn) continue;
      const k = c.key;
      c.key = null;
      c.draw(k, c.fn);
    }
  }
  draw(key, fn) {
    if (key === this.key) return;
    this.key = key;
    this.fn = fn;
    // rien n'est tracé avant le chargement des polices : un second tracé
    // juste après le premier laisse un texte fantôme sous Chromium
    if (!CanvasTex.ready) return;
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    fn(ctx, this.w, this.h);
    this.texture.needsUpdate = true;
  }
}

// ---------------------------------------------------------------------------
// Plan A — jeu de l'enfant (téléphone) et dessin animé (tablette)

const gameScratch = makeCanvas(SCREEN_W, SCREEN_H, 1.6);

function drawGameScene(ctx, W, H, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#6D5BF5');
  g.addColorStop(0.55, '#C26BEA');
  g.addColorStop(1, '#FF9DBA');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // étoiles / bulles
  const r = rng(7);
  for (let i = 0; i < 26; i++) {
    const x = r() * W, y = (r() * H * 0.7 + t * (8 + r() * 14)) % (H * 0.75);
    ctx.globalAlpha = 0.25 + 0.35 * r();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 1 + r() * 2.4, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // nuages qui défilent
  for (let i = 0; i < 4; i++) {
    const x = ((i * 140 - t * (16 + i * 6)) % (W + 200) + W + 200) % (W + 200) - 100;
    const y = 150 + i * 120;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(x, y, 46, 16, 0, 0, TAU);
    ctx.ellipse(x + 26, y - 10, 30, 18, 0, 0, TAU);
    ctx.fill();
  }
  // plateformes
  const plats = [
    [40, 640, 130],
    [220, 540, 120],
    [70, 430, 110],
    [230, 330, 110],
  ];
  plats.forEach(([x, y, w], i) => {
    const dx = Math.sin(t * 1.4 + i) * 10;
    ctx.fillStyle = '#FFD45B';
    rr(ctx, x + dx, y, w, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#FF9450';
    rr(ctx, x + dx, y + 12, w, 10, 5);
    ctx.fill();
  });
  // bonbons
  for (let i = 0; i < 6; i++) {
    const x = 60 + ((i * 61) % 280), y = 260 + ((i * 97) % 380) + Math.sin(t * 3 + i) * 6;
    ctx.fillStyle = ['#FF6B9A', '#3DB5DA', '#FAB43B'][i % 3];
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 3, 0, TAU);
    ctx.fill();
  }
  // personnage qui saute (parabole)
  const ph = (t * 1.25) % 1;
  const jx = 100 + ((t * 1.25) | 0) % 2 * 160 + ph * 40;
  const jy = 600 - Math.sin(ph * Math.PI) * 150;
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(jx, 650, 22 - Math.sin(ph * Math.PI) * 8, 5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = B.orange;
  ctx.beginPath();
  ctx.arc(jx, jy - 26, 24, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(jx - 8, jy - 30, 6, 0, TAU);
  ctx.arc(jx + 8, jy - 30, 6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = B.navy;
  ctx.beginPath();
  ctx.arc(jx - 7, jy - 29, 3, 0, TAU);
  ctx.arc(jx + 9, jy - 29, 3, 0, TAU);
  ctx.fill();
  // sol
  ctx.fillStyle = '#4ADE80';
  rr(ctx, -20, 690, W + 40, 200, 30);
  ctx.fill();
  ctx.fillStyle = '#22C55E';
  rr(ctx, -20, 712, W + 40, 200, 30);
  ctx.fill();
  // HUD
  ctx.fillStyle = 'rgba(15,23,42,0.28)';
  rr(ctx, 20, 64, 110, 40, 20);
  ctx.fill();
  icon.star(ctx, 30, 72, 24, '#FFD45B');
  txt(ctx, String(1240 + Math.floor(t * 37)), 62, 91, disp({ size: 18, weight: 800 }));
  txt(ctx, T.kid.game, W - 22, 92, disp({ size: 18, weight: 800, align: 'right', alpha: 0.95 }));
}

function drawCountdownPill(ctx, x, y, remain, urgency, scale = 1) {
  // compteur Kizzo superposé au jeu : "Quiz dans 0:03"
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const col = urgency > 0.5 ? '#f97316' : '#3db4d9';
  shadow(ctx, 16 + urgency * 22, 0, urgency > 0.2 ? 'rgba(249,115,22,0.9)' : 'rgba(61,180,217,0.6)');
  ctx.fillStyle = 'rgba(21,42,74,0.92)';
  rr(ctx, -96, -22, 192, 44, 22);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  rr(ctx, -96, -22, 192, 44, 22);
  ctx.stroke();
  icon.clock(ctx, -84, -12, 24, col);
  const s = Math.max(0, Math.ceil(remain - 1e-6));
  txt(ctx, T.kid.nextQuiz, -54, 6, { size: 15, weight: 600, color: 'rgba(250,250,250,0.8)', font: F_BODY });
  txt(ctx, `0:0${s}`, 66, 8, { size: 22, weight: 700, color: '#fff', align: 'center', font: F_NUM });
  ctx.restore();
}

function freezeOverlay(ctx, W, H, f, lockK, t = 0) {
  if (f <= 0) return;
  // voile sombre de l'écran verrouillé (LockedScreen.tsx : BlurView + rgba(10,21,38,0.58))
  ctx.fillStyle = `rgba(10,21,38,${0.58 * f})`;
  ctx.fillRect(0, 0, W, H);
  // givre discret
  ctx.save();
  ctx.globalAlpha = 0.22 * f;
  ctx.strokeStyle = '#cfefff';
  ctx.lineWidth = 0.8;
  const r = rng(3);
  for (let i = 0; i < 16; i++) {
    const x = r() * W, y = r() * H, l = 10 + r() * 24;
    for (let k = 0; k < 3; k++) {
      const an = (k * Math.PI) / 3 + r();
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(an) * l, y - Math.sin(an) * l);
      ctx.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l);
      ctx.stroke();
    }
  }
  ctx.restore();
  if (lockK <= 0) return;
  lockedCard(ctx, W / 2, H * 0.5, lockK, t);
}

/** Écran du téléphone de l'enfant en plan A. */
export function drawKidPhoneA(ctx, W, H, s) {
  const { t, remain, urgency, freeze, lockK, taps } = s;
  // le jeu est dessiné hors-champ puis filtré (gel élégant : désaturation + flou)
  const g = gameScratch.ctx;
  g.save();
  g.setTransform(gameScratch.scale, 0, 0, gameScratch.scale, 0, 0);
  drawGameScene(g, W, H, t);
  g.restore();
  ctx.save();
  if (freeze > 0) ctx.filter = `grayscale(${freeze * 0.85}) blur(${freeze * 7}px) brightness(${1 + freeze * 0.12})`;
  ctx.drawImage(gameScratch.canvas, 0, 0, W, H);
  ctx.restore();
  // retours tactiles
  for (const tp of taps) {
    const k = tp.age / 0.55;
    if (k < 0 || k > 1) continue;
    ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, 10 + k * 34, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - k)})`;
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, 16 * (1 - k * 0.5), 0, TAU);
    ctx.fill();
  }
  drawCountdownPill(ctx, W / 2, 140, remain, urgency, 1 + urgency * 0.12);
  freezeOverlay(ctx, W, H, freeze, lockK * (1 - Math.min(1, (s.reveal || 0) * 2.5)), t);
  statusBar(ctx, '#fff');
  // transition : le cadenas s'efface, la lumière Kizzo envahit l'écran
  const rv = s.reveal || 0;
  if (rv > 0) {
    const cx = W / 2, cy = H * 0.47;
    ctx.save();
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 + rv * 520);
    rg.addColorStop(0, `rgba(255,255,255,${Math.min(1, rv * 1.6)})`);
    rg.addColorStop(0.35, `rgba(127,211,236,${rv * 0.9})`);
    rg.addColorStop(1, 'rgba(61,181,218,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = Math.min(1, rv * 2.2);
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(cx, cy, 58 + rv * 14, 0, TAU);
    ctx.fill();
    icon.logo(ctx, cx + 4, cy, 86 + rv * 20);
    ctx.restore();
  }
}

const TAB_W = 640, TAB_H = 435;
export const TABLET_DIM = [TAB_W, TAB_H];
const tabScratch = makeCanvas(TAB_W, TAB_H, 1.5);

function drawCartoon(ctx, W, H, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0B1E4A');
  g.addColorStop(1, '#2A3F8F');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const r = rng(11);
  for (let i = 0; i < 70; i++) {
    const x = r() * W, y = r() * H * 0.8;
    ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i));
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.globalAlpha = 1;
  // planète à anneaux
  ctx.save();
  ctx.translate(470, 140);
  ctx.fillStyle = B.orange;
  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.arc(-14, -16, 24, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = B.amber;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(0, 0, 96, 22, -0.3, 0, TAU);
  ctx.stroke();
  ctx.restore();
  // fusée
  const rx = 120 + Math.sin(t * 0.9) * 40 + t * 18, ry = 230 + Math.cos(t * 1.3) * 20;
  ctx.save();
  ctx.translate(rx, ry);
  ctx.rotate(0.5 + Math.sin(t) * 0.08);
  ctx.fillStyle = '#fff';
  rr(ctx, -16, -46, 32, 80, 16);
  ctx.fill();
  ctx.fillStyle = B.cyan;
  ctx.beginPath();
  ctx.arc(0, -16, 9, 0, TAU);
  ctx.fill();
  ctx.fillStyle = B.orange;
  ctx.beginPath();
  ctx.moveTo(-10, 34);
  ctx.lineTo(0, 62 + Math.sin(t * 30) * 6);
  ctx.lineTo(10, 34);
  ctx.fill();
  ctx.restore();
  // lune / sol
  ctx.fillStyle = '#7C8DB5';
  ctx.beginPath();
  ctx.ellipse(W / 2, H + 120, W * 0.8, 200, 0, 0, TAU);
  ctx.fill();
  // barre de lecture
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, H - 54, W, 54);
  icon.play(ctx, 18, H - 42, 30, '#fff');
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  rr(ctx, 64, H - 30, W - 150, 6, 3);
  ctx.fill();
  ctx.fillStyle = B.orange;
  rr(ctx, 64, H - 30, (W - 150) * (0.62 + t * 0.004), 6, 3);
  ctx.fill();
  txt(ctx, T.kid.video, 24, 40, disp({ size: 20, weight: 700 }));
}

export function drawTabletA(ctx, W, H, s) {
  const { t, remain, urgency, freeze, lockK } = s;
  const g = tabScratch.ctx;
  g.save();
  g.setTransform(tabScratch.scale, 0, 0, tabScratch.scale, 0, 0);
  drawCartoon(g, W, H, t);
  g.restore();
  ctx.save();
  if (freeze > 0) ctx.filter = `grayscale(${freeze * 0.85}) blur(${freeze * 6}px) brightness(${1 + freeze * 0.1})`;
  ctx.drawImage(tabScratch.canvas, 0, 0, W, H);
  ctx.restore();
  drawCountdownPill(ctx, W - 86, 38, remain, urgency, 0.85);
  if (freeze > 0) {
    freezeOverlay(ctx, W, H, freeze, 0);
    ctx.save();
    ctx.globalAlpha = clamp(lockK);
    ctx.fillStyle = '#3db4d9';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2 - 20, 34 * (0.7 + 0.3 * lockK), 0, TAU);
    ctx.fill();
    icon.lock(ctx, W / 2 - 17, H / 2 - 38, 34, '#0a1526');
    txt(ctx, T.kid.lockTitle, W / 2, H / 2 + 46, disp({ size: 24, weight: 700, align: 'center' }));
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Icônes holographiques et halos

/** Icône holographique flottante (disque) */
export function drawHoloIcon(ctx, W, H, i) {
  const fns = [icon.divide, icon.atom, icon.letters, icon.globe, icon.star, icon.book];
  const cols = [B.orange, B.cyan, '#A78BFA', '#34D399', '#FFD45B', '#7FD3EC'];
  const cx = W / 2, cy = H / 2;
  const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W / 2);
  rg.addColorStop(0, 'rgba(255,255,255,0.0)');
  rg.addColorStop(0.7, 'rgba(255,255,255,0.0)');
  rg.addColorStop(1, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
  fns[i % fns.length](ctx, cx - W * 0.28, cy - H * 0.28, W * 0.56, cols[i % cols.length] === '#FFD45B' ? '#FFE28A' : '#fff');
}

/** Petit sprite lumineux (halo radial) */
export function makeGlowTexture(size = 128, inner = 'rgba(255,255,255,1)', soft = 0.35) {
  const c = makeCanvas(size, size, 1);
  const rg = c.ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  rg.addColorStop(0, inner);
  rg.addColorStop(soft, inner.replace(/[\d.]+\)$/, '0.35)'));
  rg.addColorStop(1, inner.replace(/[\d.]+\)$/, '0)'));
  c.ctx.fillStyle = rg;
  c.ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

