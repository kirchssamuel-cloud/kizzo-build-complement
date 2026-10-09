// Interfaces Kizzo dessinées en Canvas 2D, puis utilisées comme textures sur les écrans
// et panneaux 3D. Unités logiques type iPhone (écran 390 × 860), rendues en 2×+.
import * as THREE from 'three';
import { BRAND as B, T } from './config.js';
import { LOGO } from './logo-shape.js';
import { clamp, rng, TAU } from './util.js';

export const SCREEN_W = 390;
export const SCREEN_H = 860;

const F_DISPLAY = 'Outfit, "Plus Jakarta Sans", system-ui, sans-serif';
const F_BODY = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

// ---------------------------------------------------------------------------
// Primitives

export function makeCanvas(w, h, scale = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
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
const disp = (o) => ({ font: F_DISPLAY, ...o });

function shadow(ctx, blur, y, color = 'rgba(15,23,42,0.18)') {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = y;
}
function noShadow(ctx) {
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

function statusBar(ctx, color = '#fff', time = '7:42') {
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
  constructor(w, h, scale = 2) {
    Object.assign(this, makeCanvas(w, h, scale));
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.key = null;
  }
  draw(key, fn) {
    if (key === this.key) return;
    this.key = key;
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
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const col = urgency > 0.5 ? B.red : B.orange;
  shadow(ctx, 18 + urgency * 22, 0, urgency > 0.2 ? 'rgba(249,115,22,0.9)' : 'rgba(15,23,42,0.3)');
  ctx.fillStyle = 'rgba(15,23,42,0.86)';
  rr(ctx, -62, -22, 124, 44, 22);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  rr(ctx, -62, -22, 124, 44, 22);
  ctx.stroke();
  icon.clock(ctx, -50, -12, 24, col);
  const s = Math.max(0, Math.ceil(remain - 1e-6));
  txt(ctx, `0:0${s}`, 14, 9, { size: 23, weight: 700, color: '#fff', align: 'center', font: F_BODY });
  ctx.restore();
}

function freezeOverlay(ctx, W, H, f, lockK, title = T.kid.locked) {
  if (f <= 0) return;
  // voile givré
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, `rgba(226,240,250,${0.42 * f})`);
  g.addColorStop(1, `rgba(186,214,236,${0.36 * f})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // cristaux fins
  ctx.save();
  ctx.globalAlpha = 0.35 * f;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 0.8;
  const r = rng(3);
  for (let i = 0; i < 18; i++) {
    const x = r() * W, y = r() * H, l = 10 + r() * 26;
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI) / 3 + r();
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
  }
  ctx.restore();
  if (lockK <= 0) return;
  // carte "temps écoulé"
  const cx = W / 2, cy = H * 0.47;
  const s = 0.7 + 0.3 * lockK;
  ctx.save();
  ctx.globalAlpha = clamp(lockK * 1.4);
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  shadow(ctx, 40, 14, 'rgba(15,23,42,0.35)');
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  rr(ctx, -130, -120, 260, 240, 28);
  ctx.fill();
  noShadow(ctx);
  ctx.fillStyle = B.navy;
  ctx.beginPath();
  ctx.arc(0, -40, 42, 0, TAU);
  ctx.fill();
  icon.lock(ctx, -20, -62, 40, '#fff');
  txt(ctx, title, 0, 40, disp({ size: 28, weight: 800, color: B.navy, align: 'center' }));
  icon.logo(ctx, -64, 80, 22);
  txt(ctx, T.kid.paused, 6, 86, { size: 13, weight: 600, color: '#64748B', align: 'center' });
  ctx.restore();
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
  freezeOverlay(ctx, W, H, freeze, lockK * (1 - Math.min(1, (s.reveal || 0) * 2.5)));
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
    ctx.save();
    ctx.translate(W / 2, H / 2 - 30);
    ctx.scale(1.25, 1.25);
    ctx.translate(-W / 2, -H / 2);
    freezeOverlay(ctx, W, H, freeze, lockK);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Plan B — application Kizzo enfant (calques)

export function drawKidAppBase(ctx, W, H, ghost = 1) {
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, '#47C3E6');
  g.addColorStop(0.55, '#2A9FD6');
  g.addColorStop(1, '#1B6FB8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // formes de fond ludiques
  ctx.save();
  ctx.globalAlpha = 0.9;
  const rg = ctx.createRadialGradient(W * 0.95, H * 0.88, 10, W * 0.95, H * 0.88, 260);
  rg.addColorStop(0, 'rgba(249,115,22,0.85)');
  rg.addColorStop(1, 'rgba(249,115,22,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
  const rg2 = ctx.createRadialGradient(W * 0.05, H * 0.12, 10, W * 0.05, H * 0.12, 220);
  rg2.addColorStop(0, 'rgba(255,255,255,0.35)');
  rg2.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rg2;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const r = rng(21);
  for (let i = 0; i < 16; i++) {
    ctx.globalAlpha = 0.18 + r() * 0.25;
    icon.star(ctx, r() * W, 120 + r() * (H - 160), 6 + r() * 10, '#fff');
  }
  ctx.globalAlpha = 1;
  // emplacements des calques (ombres "ghost" quand ils se soulèvent)
  ctx.fillStyle = `rgba(10,40,80,${0.16 * ghost})`;
  rr(ctx, 20, 186, 350, 196, 20);
  ctx.fill();
  rr(ctx, 20, 398, 350, 150, 20);
  ctx.fill();
  rr(ctx, 45, 690, 300, 72, 36);
  ctx.fill();
  // barre d'onglets
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  rr(ctx, 24, 784, 342, 58, 29);
  ctx.fill();
  const tabs = [icon.star, icon.trophy, icon.book, icon.bolt];
  tabs.forEach((fn, i) => fn(ctx, 62 + i * 84, 801, 24, i === 0 ? '#fff' : 'rgba(255,255,255,0.55)'));
  statusBar(ctx, '#fff', '7:43');
}

export function drawKidHeader(ctx, W, H) {
  // avatar = tête orange du logo
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(46, H / 2, 27, 0, TAU);
  ctx.fill();
  ctx.fillStyle = B.orange;
  ctx.beginPath();
  ctx.arc(46, H / 2, 23, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(39, H / 2 - 3, 3.4, 0, TAU);
  ctx.arc(53, H / 2 - 3, 3.4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(46, H / 2 + 3, 8, 0.3, Math.PI - 0.3);
  ctx.stroke();
  txt(ctx, T.kid.hi, 86, H / 2 - 2, disp({ size: 27, weight: 800 }));
  icon.flame(ctx, 86, H / 2 + 8, 15, B.amber);
  txt(ctx, T.kid.level, 104, H / 2 + 20, { size: 13, weight: 600, color: 'rgba(255,255,255,0.85)' });
  // pièces
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  rr(ctx, W - 92, H / 2 - 18, 76, 36, 18);
  ctx.fill();
  icon.star(ctx, W - 84, H / 2 - 11, 22, '#FFD45B');
  txt(ctx, '240', W - 56, H / 2 + 6, disp({ size: 17, weight: 800 }));
}

export function drawKidLockCard(ctx, W, H) {
  ctx.fillStyle = '#fff';
  rr(ctx, 0, 0, W, H, 20);
  ctx.fill();
  txt(ctx, T.kid.timeLeft.toUpperCase(), 24, 38, { size: 12, weight: 700, color: '#64748B', ls: 1.2 });
  txt(ctx, T.kid.zero, 24, 84, disp({ size: 36, weight: 800, color: B.navy }));
  // pastille
  ctx.fillStyle = 'rgba(249,115,22,0.12)';
  rr(ctx, 24, 104, 118, 30, 15);
  ctx.fill();
  icon.lock(ctx, 34, 110, 18, B.orange);
  txt(ctx, T.kid.locked, 58, 124, { size: 13, weight: 700, color: B.orange });
  // jauge vide
  ctx.fillStyle = '#E2E8F0';
  rr(ctx, 24, 154, W - 48, 12, 6);
  ctx.fill();
  ctx.fillStyle = B.red;
  rr(ctx, 24, 154, 12, 12, 6);
  ctx.fill();
  // cadenas 3D-ish à droite
  const cx = W - 70, cy = 72;
  const rg = ctx.createRadialGradient(cx - 10, cy - 12, 6, cx, cy, 50);
  rg.addColorStop(0, '#26344F');
  rg.addColorStop(1, B.navy);
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(cx, cy, 44, 0, TAU);
  ctx.fill();
  icon.lock(ctx, cx - 21, cy - 23, 42, '#fff');
}

export function drawKidQuestCard(ctx, W, H, done = 0) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#152A4A');
  g.addColorStop(1, B.navy);
  ctx.fillStyle = g;
  rr(ctx, 0, 0, W, H, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(249,115,22,0.6)';
  ctx.lineWidth = 2;
  rr(ctx, 1, 1, W - 2, H - 2, 19);
  ctx.stroke();
  txt(ctx, T.kid.quest, 24, 52, disp({ size: 27, weight: 800 }));
  txt(ctx, T.kid.questSub, 24, 80, { size: 14, weight: 500, color: 'rgba(255,255,255,0.7)' });
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(36 + i * 30, 112, 10, 0, TAU);
    if (i < done) {
      ctx.fillStyle = B.orange;
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }
  // médaille +15
  const cx = W - 62, cy = H / 2;
  const rg = ctx.createRadialGradient(cx - 10, cy - 12, 4, cx, cy, 46);
  rg.addColorStop(0, B.orangeLight);
  rg.addColorStop(1, B.orange);
  shadow(ctx, 24, 0, 'rgba(249,115,22,0.7)');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, TAU);
  ctx.fill();
  noShadow(ctx);
  txt(ctx, '+15', cx, cy + 4, disp({ size: 25, weight: 800, align: 'center' }));
  txt(ctx, 'MIN', cx, cy + 22, { size: 11, weight: 800, align: 'center', ls: 1.5 });
}

const CHIP_ICONS = [icon.divide, icon.atom, icon.letters];
export function drawKidChip(ctx, W, H, i) {
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  rr(ctx, 0, 0, W, H, H / 2);
  ctx.fill();
  const col = [B.orange, B.cyan, '#8B5CF6'][i];
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(H / 2, H / 2, H / 2 - 6, 0, TAU);
  ctx.fill();
  CHIP_ICONS[i](ctx, H / 2 - 11, H / 2 - 11, 22, '#fff');
  txt(ctx, T.kid.chips[i], H + 2, H / 2 + 6, disp({ size: 16, weight: 700, color: B.navy }));
}

export function drawKidCTA(ctx, W, H, press = 0) {
  // bouton "jeu vidéo" avec tranche
  ctx.fillStyle = '#C2410C';
  rr(ctx, 0, 8, W, H - 8, (H - 8) / 2);
  ctx.fill();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, B.orangeLight);
  g.addColorStop(1, B.orange);
  ctx.fillStyle = g;
  rr(ctx, 0, press * 6, W, H - 8, (H - 8) / 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  rr(ctx, 18, 6 + press * 6, W - 36, 14, 7);
  ctx.fill();
  icon.play(ctx, W / 2 - 92, (H - 8) / 2 - 13 + press * 6, 26, '#fff');
  txt(ctx, T.kid.start, W / 2 + 14, (H - 8) / 2 + 9 + press * 6, disp({ size: 24, weight: 800, align: 'center' }));
}

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

// ---------------------------------------------------------------------------
// Plan C — quiz

export const CARD_PX = [380, 245];

export function drawQuizCard(ctx, W, H, i) {
  const q = T.quiz[i];
  // tag + progression
  const tagCol = [B.orange, B.cyan, '#8B5CF6'][i];
  ctx.save();
  ctx.font = `800 12px ${F_BODY}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '1.2px';
  const tagW = ctx.measureText(q.tag.toUpperCase()).width + 24;
  ctx.restore();
  ctx.fillStyle = tagCol;
  rr(ctx, 22, 20, tagW, 28, 14);
  ctx.fill();
  txt(ctx, q.tag.toUpperCase(), 34, 39, { size: 12, weight: 800, ls: 1.2 });
  txt(ctx, `${T.question} ${i + 1} ${T.of} 3`, W - 22, 39, { size: 13, weight: 600, color: '#64748B', align: 'right' });
  for (let k = 0; k < 3; k++) {
    ctx.fillStyle = k <= i ? tagCol : '#E2E8F0';
    rr(ctx, 22 + k * ((W - 44) / 3 + 2), 60, (W - 44) / 3 - 4, 6, 3);
    ctx.fill();
  }
  if (i === 0) {
    txt(ctx, '7 × 8 = ?', W / 2, 170, disp({ size: 74, weight: 800, color: B.navy, align: 'center', ls: -1 }));
  } else if (i === 1) {
    wrapText(ctx, q.q, 26, 128, W - 150, 34, disp({ size: 31, weight: 800, color: B.navy }));
  } else {
    const parts = q.q.split('…');
    txt(ctx, parts[0], 26, 140, disp({ size: 38, weight: 800, color: B.navy }));
    // emplacement de la réponse (le bon mot vient s'y verrouiller)
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = 'rgba(15,23,42,0.28)';
    ctx.lineWidth = 2.5;
    rr(ctx, 26, 162, 190, 56, 18);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function wrapText(ctx, s, x, y, maxW, lh, o) {
  ctx.save();
  ctx.font = `${o.weight} ${o.size}px ${o.font}`;
  const words = s.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      txt(ctx, line, x, yy, o);
      line = w;
      yy += lh;
    } else line = test;
  }
  txt(ctx, line, x, yy, o);
  ctx.restore();
}

export const TILE_PX = [176, 58];
export function drawTile(ctx, W, H, label, state) {
  // state: 0 neutre, 1 sélection (vert), 2 atténué
  const ok = state === 1;
  txt(ctx, label, W / 2, H / 2 + 9, disp({ size: label.length > 6 ? 23 : 26, weight: 800, color: ok ? '#fff' : B.navy, align: 'center' }));
}

export function drawCheckBadge(ctx, W, H) {
  ctx.fillStyle = B.green;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W / 2 - 2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();
  icon.check(ctx, W * 0.18, H * 0.18, W * 0.64, '#fff', 3.6);
}

/** Écran du téléphone couché qui "projette" le quiz. */
export function drawQuizPhone(ctx, W, H, s) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0E2A47');
  g.addColorStop(1, '#0B1222');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H * 0.42, 260);
  rg.addColorStop(0, 'rgba(61,181,218,0.55)');
  rg.addColorStop(1, 'rgba(61,181,218,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
  icon.logo(ctx, W / 2, H * 0.42, 120);
  txt(ctx, `${T.question} ${Math.min(3, s.q + 1)} ${T.of} 3`, W / 2, H * 0.62, disp({ size: 26, weight: 700, align: 'center' }));
  for (let k = 0; k < 3; k++) {
    ctx.fillStyle = k < s.done ? B.orange : 'rgba(255,255,255,0.18)';
    rr(ctx, W / 2 - 90 + k * 62, H * 0.66, 56, 8, 4);
    ctx.fill();
  }
  statusBar(ctx, '#fff', '7:44');
}

// ---------------------------------------------------------------------------
// Plan D — écran déverrouillé ; Plan E — règles synchronisées

export function drawKidUnlocked(ctx, W, H, s) {
  const { minutes, ring, synced, pulse: pz } = s;
  const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
  g.addColorStop(0, '#47C3E6');
  g.addColorStop(0.6, '#2A9FD6');
  g.addColorStop(1, '#1B6FB8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(W / 2, 300, 10, W / 2, 300, 260);
  rg.addColorStop(0, `rgba(255,255,255,${0.35 + pz * 0.3})`);
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
  // anneau de temps
  const cx = W / 2, cy = 290, R = 112;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.stroke();
  shadow(ctx, 20, 0, 'rgba(249,115,22,0.9)');
  ctx.strokeStyle = B.orange;
  ctx.beginPath();
  ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(ring, 0.0001, 1));
  ctx.stroke();
  noShadow(ctx);
  txt(ctx, `${minutes}:00`, cx, cy + 18, disp({ size: 58, weight: 800, align: 'center' }));
  txt(ctx, 'MIN', cx, cy + 46, { size: 13, weight: 800, align: 'center', ls: 2, color: 'rgba(255,255,255,0.8)' });
  // badge
  ctx.fillStyle = '#fff';
  rr(ctx, cx - 92, 440, 184, 46, 23);
  ctx.fill();
  icon.unlock(ctx, cx - 76, 451, 24, B.green);
  txt(ctx, T.kid.unlocked, cx + 14, 471, disp({ size: 21, weight: 800, color: B.navy, align: 'center' }));
  txt(ctx, T.kid.enjoy, cx, 520, { size: 15, weight: 600, align: 'center', color: 'rgba(255,255,255,0.9)' });
  // règles synchronisées (plan E)
  if (synced > 0) {
    const icons = [icon.clock, icon.moon, icon.bolt];
    ctx.fillStyle = 'rgba(15,23,42,0.35)';
    rr(ctx, 24, 566, W - 48, 186, 20);
    ctx.fill();
    txt(ctx, T.kid.synced, 44, 600, disp({ size: 17, weight: 700 }));
    for (let i = 0; i < 3; i++) {
      const a = clamp(synced - i);
      if (a <= 0) continue;
      ctx.save();
      ctx.globalAlpha = a;
      const y = 618 + i * 42;
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      rr(ctx, 40, y, W - 80, 34, 17);
      ctx.fill();
      icons[i](ctx, 50, y + 6, 22, i === 2 ? B.amber : '#fff');
      txt(ctx, T.parent.rules[i], 82, y + 23, { size: 14, weight: 600 });
      icon.check(ctx, W - 74, y + 5, 24, '#4ADE80', 3);
      ctx.restore();
    }
  }
  statusBar(ctx, '#fff', '7:45');
}

// ---------------------------------------------------------------------------
// Plan E — tableau de bord parent (sombre, data-driven, calme)

const P = { bg: '#0B1222', card: '#141E33', line: 'rgba(255,255,255,0.07)', mute: '#8A9AB5' };

export function drawParentBase(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0F1A30');
  g.addColorStop(1, P.bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(W, 0, 10, W, 0, 360);
  rg.addColorStop(0, 'rgba(61,181,218,0.22)');
  rg.addColorStop(1, 'rgba(61,181,218,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
  statusBar(ctx, '#fff', '19:42');
  // en-tête
  txt(ctx, T.parent.hello, 24, 88, { size: 14, weight: 500, color: P.mute });
  txt(ctx, T.parent.child, 24, 118, disp({ size: 26, weight: 700 }));
  ctx.fillStyle = P.card;
  ctx.beginPath();
  ctx.arc(W - 46, 100, 22, 0, TAU);
  ctx.fill();
  icon.bell(ctx, W - 57, 89, 22, '#fff');
  ctx.fillStyle = B.orange;
  ctx.beginPath();
  ctx.arc(W - 33, 86, 5, 0, TAU);
  ctx.fill();
  icon.logo(ctx, W - 108, 101, 34);
  // emplacements des cartes
  ctx.fillStyle = P.card;
  rr(ctx, 20, 140, 350, 150, 20);
  ctx.fill();
  rr(ctx, 20, 304, 350, 178, 20);
  ctx.fill();
  rr(ctx, 20, 496, 350, 170, 20);
  ctx.fill();
  rr(ctx, 20, 680, 350, 92, 20);
  ctx.fill();
  // statut de synchro
  ctx.fillStyle = '#4ADE80';
  ctx.beginPath();
  ctx.arc(34, 800, 4.5, 0, TAU);
  ctx.fill();
  txt(ctx, T.parent.online, 46, 805, { size: 12.5, weight: 600, color: P.mute });
}

function cardFrame(ctx, W, H) {
  ctx.fillStyle = P.card;
  rr(ctx, 0, 0, W, H, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1.5;
  rr(ctx, 0.75, 0.75, W - 1.5, H - 1.5, 19.5);
  ctx.stroke();
}

export function drawParentLimit(ctx, W, H, k = 1) {
  cardFrame(ctx, W, H);
  txt(ctx, T.parent.limit.toUpperCase(), 22, 36, { size: 11.5, weight: 700, color: P.mute, ls: 1.2 });
  txt(ctx, '2h', 22, 86, disp({ size: 44, weight: 700 }));
  txt(ctx, T.parent.used, 22, 116, { size: 14, weight: 500, color: P.mute });
  // jauge
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  rr(ctx, 22, 128, 190, 8, 4);
  ctx.fill();
  const lg = ctx.createLinearGradient(22, 0, 212, 0);
  lg.addColorStop(0, B.cyan);
  lg.addColorStop(1, B.orange);
  ctx.fillStyle = lg;
  rr(ctx, 22, 128, 190 * 0.875 * k, 8, 4);
  ctx.fill();
  // anneau
  const cx = W - 74, cy = H / 2, R = 46;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = B.cyan;
  ctx.beginPath();
  ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * 0.875 * k);
  ctx.stroke();
  txt(ctx, '1h45', cx, cy + 7, disp({ size: 21, weight: 700, align: 'center' }));
}

export function drawParentSchedule(ctx, W, H, k = 1) {
  cardFrame(ctx, W, H);
  txt(ctx, T.parent.schedule.toUpperCase(), 22, 36, { size: 11.5, weight: 700, color: P.mute, ls: 1.2 });
  const rows = [
    [icon.school, T.parent.school, '8:30 – 16:30', B.cyan],
    [icon.book, T.parent.homework, '17:00 – 18:00', '#A78BFA'],
    [icon.moon, T.parent.bedtime, '20:30', B.orange],
  ];
  rows.forEach(([fn, label, time, col], i) => {
    const y = 56 + i * 40;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    rr(ctx, 16, y, W - 32, 34, 12);
    ctx.fill();
    fn(ctx, 26, y + 6, 22, col);
    txt(ctx, label, 58, y + 22, { size: 14, weight: 600 });
    txt(ctx, time, W - 92, y + 22, { size: 13, weight: 500, color: P.mute, align: 'right' });
    // interrupteur
    const on = clamp(k * 3 - i);
    ctx.fillStyle = on > 0.5 ? col : 'rgba(255,255,255,0.15)';
    rr(ctx, W - 74, y + 7, 44, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(W - 64 + 24 * on, y + 17, 7.5, 0, TAU);
    ctx.fill();
  });
}

export function drawParentUsage(ctx, W, H) {
  cardFrame(ctx, W, H);
  txt(ctx, T.parent.usage.toUpperCase(), 22, 36, { size: 11.5, weight: 700, color: P.mute, ls: 1.2 });
  txt(ctx, '−18%', W - 22, 36, { size: 13, weight: 700, color: '#4ADE80', align: 'right' });
  // repères (les barres sont en 3D au-dessus)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(22, 60 + i * 30);
    ctx.lineTo(W - 22, 60 + i * 30);
    ctx.stroke();
  }
  T.parent.days.forEach((d, i) => {
    txt(ctx, d, 44 + i * 44, H - 16, { size: 12, weight: 600, color: i === 6 ? B.orange : P.mute, align: 'center' });
  });
}

export function drawParentLearning(ctx, W, H) {
  cardFrame(ctx, W, H);
  ctx.fillStyle = 'rgba(249,115,22,0.14)';
  ctx.beginPath();
  ctx.arc(48, H / 2, 26, 0, TAU);
  ctx.fill();
  icon.book(ctx, 36, H / 2 - 12, 24, B.orange);
  txt(ctx, T.parent.learning.toUpperCase(), 88, 36, { size: 11.5, weight: 700, color: P.mute, ls: 1.2 });
  txt(ctx, T.parent.quizzes, 88, 66, disp({ size: 22, weight: 700 }));
  txt(ctx, T.parent.earned, W - 22, 66, { size: 14, weight: 700, color: B.orange, align: 'right' });
}

export function drawRuleChip(ctx, W, H, i) {
  const icons = [icon.clock, icon.moon, icon.bolt];
  const cols = [B.cyan, '#A78BFA', B.orange];
  ctx.fillStyle = 'rgba(20,30,51,0.96)';
  rr(ctx, 0, 0, W, H, H / 2);
  ctx.fill();
  ctx.strokeStyle = cols[i];
  ctx.lineWidth = 2;
  rr(ctx, 1, 1, W - 2, H - 2, H / 2 - 1);
  ctx.stroke();
  ctx.fillStyle = cols[i];
  ctx.beginPath();
  ctx.arc(H / 2, H / 2, H / 2 - 7, 0, TAU);
  ctx.fill();
  icons[i](ctx, H / 2 - 10, H / 2 - 10, 20, '#fff');
  txt(ctx, T.parent.rules[i], H + 2, H / 2 + 5.5, { size: 15, weight: 600 });
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

/** Texture équirectangulaire de planète rouge (Q2). */
export function drawPlanet(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#B4441B');
  g.addColorStop(0.5, '#E2672E');
  g.addColorStop(1, '#A13A16');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const r = rng(5);
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(${120 + r() * 80},${40 + r() * 30},${20},${0.25 + r() * 0.3})`;
    const y = r() * H;
    ctx.fillRect(0, y, W, 2 + r() * 10);
  }
  for (let i = 0; i < 40; i++) {
    const x = r() * W, y = r() * H, rad = 2 + r() * 9;
    ctx.fillStyle = 'rgba(90,25,10,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, rad * 1.6, rad, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,190,140,0.18)';
    ctx.beginPath();
    ctx.ellipse(x - 1, y - 1, rad * 1.1, rad * 0.6, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,240,230,0.85)';
  ctx.fillRect(0, 0, W, 6);
  ctx.fillRect(0, H - 5, W, 5);
}
