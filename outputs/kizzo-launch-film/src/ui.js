// Canvas-drawn product UI: the parent dashboard, the kid app, the floating
// parent panels and the quiz cards. Layout is authored in iPhone points
// (430 × 932 screen) and rasterised at 2× so it stays sharp in close-ups.
import { BRAND, TONE, rgba } from './palette.js';
import { clamp, lerp, E, EASE, spring, bump } from './timeline.js';

export const SCREEN_PT = { w: 430, h: 932 };
const DISPLAY = 'Outfit, "Avenir Next", system-ui, sans-serif';
const BODY = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

export function surface(w, h, scale = 2) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const ctx = c.getContext('2d');
  return { c, ctx, w, h, scale };
}

function begin(s) {
  const { ctx, scale } = s;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, s.w, s.h);
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'alphabetic';
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function txt(ctx, str, x, y, o = {}) {
  const { w = 500, size = 14, fam = BODY, color = BRAND.white, align = 'left', ls = 0, alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${w} ${size}px ${fam}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${ls}px`;
  ctx.fillText(str, x, y);
  ctx.restore();
}

function wrap(ctx, str, maxW, font) {
  ctx.font = font;
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

const fmtHM = (min) => {
  const m = Math.max(0, Math.round(min));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}`;
};

// ── Icons (simple geometric glyphs, drawn rather than emoji) ──────────────
function iconLock(ctx, cx, cy, s, open = 0, color = BRAND.white) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = s * 0.16;
  ctx.lineCap = 'round';
  // shackle lifts and swings open
  ctx.save();
  ctx.translate(cx + s * 0.28, cy - s * 0.05);
  ctx.rotate(-open * 0.5);
  ctx.translate(-(cx + s * 0.28), -(cy - s * 0.05) - open * s * 0.18);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.28, cy - s * 0.05);
  ctx.lineTo(cx - s * 0.28, cy - s * 0.3);
  ctx.arc(cx, cy - s * 0.3, s * 0.28, Math.PI, 0);
  ctx.lineTo(cx + s * 0.28, cy - s * 0.05);
  ctx.stroke();
  ctx.restore();
  rr(ctx, cx - s * 0.42, cy - s * 0.08, s * 0.84, s * 0.62, s * 0.14);
  ctx.fill();
  ctx.restore();
}

function iconCheck(ctx, cx, cy, s, color, k = 1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.16;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pts = [
    [cx - s * 0.32, cy + s * 0.02],
    [cx - s * 0.08, cy + s * 0.26],
    [cx + s * 0.36, cy - s * 0.24],
  ];
  const l1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
  const l2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
  const d = k * (l1 + l2);
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  if (d <= l1) ctx.lineTo(lerp(pts[0][0], pts[1][0], d / l1), lerp(pts[0][1], pts[1][1], d / l1));
  else {
    ctx.lineTo(...pts[1]);
    const q = (d - l1) / l2;
    ctx.lineTo(lerp(pts[1][0], pts[2][0], q), lerp(pts[1][1], pts[2][1], q));
  }
  ctx.stroke();
  ctx.restore();
}

function iconStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.48 : r;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.restore();
}

function statusBar(ctx, color = BRAND.white) {
  txt(ctx, '9:41', 44, 34, { w: 600, size: 16, color, fam: BODY });
  ctx.save();
  ctx.fillStyle = color;
  // signal
  for (let i = 0; i < 4; i++) rr(ctx, 318 + i * 6, 30 - (i + 1) * 3, 4, (i + 1) * 3, 1), ctx.fill();
  // wifi
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(354, 31, 3 + i * 3.6, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();
  }
  // battery
  ctx.globalAlpha = 0.45;
  rr(ctx, 370, 19, 25, 13, 4);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.globalAlpha = 1;
  rr(ctx, 372, 21, 18, 9, 2.5);
  ctx.fill();
  ctx.restore();
  // Dynamic Island
  ctx.save();
  ctx.fillStyle = '#000';
  rr(ctx, 215 - 62, 11, 124, 36, 18);
  ctx.fill();
  ctx.restore();
}

function homeIndicator(ctx, color) {
  ctx.save();
  ctx.fillStyle = color;
  rr(ctx, 215 - 67, 916, 134, 5, 2.5);
  ctx.fill();
  ctx.restore();
}

function ring(ctx, cx, cy, r, width, p, color, trackColor, glow = 0) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = trackColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  if (p > 0.001) {
    if (glow > 0) {
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
    }
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p, 0, 1));
    ctx.stroke();
  }
  ctx.restore();
}

function toggle(ctx, x, y, on, accent = BRAND.orange) {
  ctx.save();
  const w = 50, h = 30;
  ctx.fillStyle = on > 0.5 ? accent : rgba(BRAND.white, 0.16);
  ctx.globalAlpha = 1;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (on > 0 && on < 1) {
    ctx.globalAlpha = on;
    ctx.fillStyle = accent;
    rr(ctx, x, y, w, h, h / 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  const kx = lerp(x + 15, x + w - 15, on);
  ctx.fillStyle = BRAND.white;
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(kx, y + h / 2, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function glass(ctx, x, y, w, h, r, fill = 0.62) {
  ctx.save();
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, rgba(TONE.navyLift, fill));
  g.addColorStop(1, rgba(BRAND.navy, fill + 0.08));
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
  const b = ctx.createLinearGradient(x, y, x, y + h);
  b.addColorStop(0, rgba(BRAND.white, 0.2));
  b.addColorStop(0.5, rgba(BRAND.white, 0.05));
  b.addColorStop(1, rgba(BRAND.blue, 0.12));
  ctx.strokeStyle = b;
  ctx.lineWidth = 1;
  rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
  ctx.stroke();
  ctx.restore();
}

// Kizzo app icon: the exact logo mark (blue + orange layers) on navy.
let markImgs = null;
export function setMarkImages(blue, orange, crop) {
  markImgs = { blue, orange, crop };
}
function appIcon(ctx, x, y, s) {
  ctx.save();
  ctx.fillStyle = BRAND.navy;
  rr(ctx, x, y, s, s, s * 0.24);
  ctx.fill();
  if (markImgs) {
    // mark occupies the top part of the lockup crop (x 144..535, y 24..592)
    const sx = 130, sy = 14, sw = 420, sh = 590;
    const k = (s * 0.74) / sh;
    const dw = sw * k, dh = sh * k;
    ctx.drawImage(markImgs.blue, sx, sy, sw, sh, x + (s - dw) / 2, y + (s - dh) / 2, dw, dh);
    ctx.drawImage(markImgs.orange, sx, sy, sw, sh, x + (s - dw) / 2, y + (s - dh) / 2, dw, dh);
  }
  ctx.restore();
}

// ── Parent dashboard ──────────────────────────────────────────────────────
// st: { power, used (min), limit (min), quizOn (0..1), notify (0..1), reveal }
export function drawParentScreen(s, st) {
  begin(s);
  const { ctx } = s;
  const bg = ctx.createLinearGradient(0, 0, 0, 932);
  bg.addColorStop(0, '#04122A');
  bg.addColorStop(0.55, TONE.abyss);
  bg.addColorStop(1, '#020915');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 430, 932);
  const glow = ctx.createRadialGradient(215, 250, 10, 215, 250, 330);
  glow.addColorStop(0, rgba(BRAND.blue, 0.16));
  glow.addColorStop(1, rgba(BRAND.blue, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 430, 600);

  const rv = (i) => E.outCubic(clamp(st.reveal * 1.6 - i * 0.18));
  const lift = (i) => (1 - rv(i)) * 18;

  statusBar(ctx);

  // header
  ctx.save();
  ctx.globalAlpha = rv(0);
  ctx.translate(0, lift(0));
  txt(ctx, 'Good evening', 24, 84, { size: 14, color: TONE.mute, w: 500 });
  txt(ctx, 'Léo’s day', 24, 118, { size: 30, fam: DISPLAY, w: 700 });
  ctx.fillStyle = BRAND.orange;
  ctx.beginPath();
  ctx.arc(384, 100, 22, 0, Math.PI * 2);
  ctx.fill();
  txt(ctx, 'L', 384, 108, { size: 21, fam: DISPLAY, w: 700, align: 'center' });
  ctx.restore();

  // usage ring card
  const full = st.used >= st.limit - 0.5;
  ctx.save();
  ctx.globalAlpha = rv(1);
  ctx.translate(0, lift(1));
  glass(ctx, 16, 140, 398, 272, 24, 0.5);
  txt(ctx, 'SCREEN TIME TODAY', 36, 172, { size: 11, w: 700, color: TONE.mute, ls: 1.6 });
  const p = clamp(st.used / st.limit);
  const ringCol = full ? BRAND.orange : BRAND.blue;
  ring(ctx, 215, 280, 86, 14, p * rv(1), ringCol, rgba(BRAND.white, 0.08), 18);
  txt(ctx, fmtHM(st.used), 215, 286, { size: 40, fam: DISPLAY, w: 700, align: 'center' });
  txt(ctx, `of ${fmtHM(st.limit)} today`, 215, 312, { size: 13, color: TONE.mute, align: 'center' });
  ctx.restore();

  // stat tiles
  ctx.save();
  ctx.globalAlpha = rv(2);
  ctx.translate(0, lift(2));
  glass(ctx, 16, 428, 193, 98, 20, 0.5);
  glass(ctx, 221, 428, 193, 98, 20, 0.5);
  txt(ctx, 'LEARNING', 34, 456, { size: 11, w: 700, color: TONE.mute, ls: 1.4 });
  txt(ctx, '+45 min', 34, 490, { size: 26, fam: DISPLAY, w: 700, color: BRAND.orange });
  txt(ctx, 'earned this week', 34, 511, { size: 12, color: TONE.mute });
  txt(ctx, 'QUIZZES', 239, 456, { size: 11, w: 700, color: TONE.mute, ls: 1.4 });
  txt(ctx, '18', 239, 490, { size: 26, fam: DISPLAY, w: 700 });
  txt(ctx, 'correct answers', 239, 511, { size: 12, color: TONE.mute });
  ctx.restore();

  // app limits
  ctx.save();
  ctx.globalAlpha = rv(3);
  ctx.translate(0, lift(3));
  txt(ctx, 'App limits', 24, 566, { size: 16, w: 600 });
  txt(ctx, 'Edit', 406, 566, { size: 14, w: 600, color: BRAND.blue, align: 'right' });
  const apps = [
    ['Videos', BRAND.blue, 32, 45],
    ['Games', BRAND.orange, 40, 45],
    ['Reading', BRAND.white, 12, 60],
  ];
  apps.forEach(([name, col, u, lim], i) => {
    const y = 590 + i * 58;
    ctx.save();
    ctx.fillStyle = rgba(col, 0.16);
    rr(ctx, 24, y, 40, 40, 12);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    const cx = 44, cy = y + 20;
    if (i === 0) {
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 7);
      ctx.lineTo(cx + 8, cy);
      ctx.lineTo(cx - 5, cy + 7);
      ctx.closePath();
      ctx.fill();
    } else if (i === 1) {
      rr(ctx, cx - 10, cy - 6, 20, 12, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 4, cy, 1.8, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy);
      ctx.lineTo(cx - 2, cy);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx, cy + 8);
      ctx.moveTo(cx - 9, cy - 7);
      ctx.quadraticCurveTo(cx - 4, cy - 8, cx, cy - 6);
      ctx.quadraticCurveTo(cx + 4, cy - 8, cx + 9, cy - 7);
      ctx.lineTo(cx + 9, cy + 7);
      ctx.quadraticCurveTo(cx + 4, cy + 6, cx, cy + 8);
      ctx.quadraticCurveTo(cx - 4, cy + 6, cx - 9, cy + 7);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
    txt(ctx, name, 78, y + 16, { size: 15, w: 600 });
    ctx.save();
    ctx.fillStyle = rgba(BRAND.white, 0.08);
    rr(ctx, 78, y + 26, 220, 6, 3);
    ctx.fill();
    ctx.fillStyle = col;
    const fillW = 220 * (u / lim) * E.outCubic(clamp(st.reveal * 1.6 - 0.8));
    if (fillW > 1) {
      rr(ctx, 78, y + 26, fillW, 6, 3);
      ctx.fill();
    }
    ctx.restore();
    txt(ctx, `${u} / ${lim} min`, 406, y + 32, { size: 13, color: TONE.mute, align: 'right' });
  });
  ctx.restore();

  // quiz unlock row
  ctx.save();
  ctx.globalAlpha = rv(4);
  ctx.translate(0, lift(4));
  glass(ctx, 16, 772, 398, 70, 20, 0.5);
  txt(ctx, 'Unlock with quizzes', 34, 801, { size: 15, w: 600 });
  txt(ctx, '3 correct answers = +15 min', 34, 822, { size: 12, color: TONE.mute });
  toggle(ctx, 346, 792, st.quizOn);
  ctx.restore();

  // tab bar
  ctx.save();
  ctx.globalAlpha = rv(5);
  ctx.strokeStyle = rgba(BRAND.white, 0.06);
  ctx.beginPath();
  ctx.moveTo(0, 862);
  ctx.lineTo(430, 862);
  ctx.stroke();
  const tabs = [56, 162, 268, 374];
  tabs.forEach((x, i) => {
    ctx.fillStyle = i === 0 ? BRAND.blue : rgba(BRAND.white, 0.32);
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 2;
    if (i === 0) {
      rr(ctx, x - 10, 878, 20, 18, 5);
      ctx.fill();
    } else if (i === 1) {
      for (let b = 0; b < 3; b++) rr(ctx, x - 9 + b * 7, 896 - (b + 1) * 5, 4, (b + 1) * 5, 1.5), ctx.fill();
    } else if (i === 2) {
      ctx.beginPath();
      ctx.arc(x, 887, 9, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, 883, 5, 0, Math.PI * 2);
      ctx.fill();
      rr(ctx, x - 9, 891, 18, 7, 3.5);
      ctx.fill();
    }
  });
  ctx.restore();
  homeIndicator(ctx, rgba(BRAND.white, 0.55));

  // notification banner
  if (st.notify > 0) {
    const k = EASE.cine(clamp(st.notify));
    const y = lerp(-90, 54, k);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = 'rgba(19, 44, 82, 0.97)';
    rr(ctx, 12, y, 406, 78, 24);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = rgba(BRAND.white, 0.12);
    rr(ctx, 12.5, y + 0.5, 405, 77, 24);
    ctx.stroke();
    ctx.restore();
    appIcon(ctx, 26, y + 17, 44);
    txt(ctx, 'KIZZO', 82, y + 30, { size: 11, w: 700, color: TONE.mute, ls: 1.2 });
    txt(ctx, 'now', 400, y + 30, { size: 12, color: TONE.mute, align: 'right' });
    txt(ctx, 'Léo reached today’s limit', 82, y + 50, { size: 15, w: 600 });
    txt(ctx, 'Quiz unlock is available', 82, y + 68, { size: 13, color: '#B9C7DB' });
  }

  // power-on sweep
  if (st.power < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - E.outCubic(st.power);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 430, 932);
    ctx.restore();
  }
}

// ── Parent floating panels ────────────────────────────────────────────────
export const PANEL_PT = {
  limit: { w: 300, h: 168 },
  week: { w: 300, h: 196 },
  quiz: { w: 300, h: 112 },
};

function panelScan(ctx, w, h, k) {
  // a light line that scans down the panel as it materialises
  if (k <= 0 || k >= 1) return;
  const y = lerp(-10, h + 10, k);
  ctx.save();
  const g = ctx.createLinearGradient(0, y - 30, 0, y + 2);
  g.addColorStop(0, rgba(BRAND.blue, 0));
  g.addColorStop(1, rgba(BRAND.blue, 0.55));
  ctx.fillStyle = g;
  rr(ctx, 0, 0, w, h, 20);
  ctx.clip();
  ctx.fillRect(0, y - 30, w, 32);
  ctx.fillStyle = rgba(BRAND.white, 0.9);
  ctx.fillRect(0, y, w, 1.2);
  ctx.restore();
}

// st: { reveal 0..1, limit (min), knob 0..1 }
export function drawLimitPanel(s, st) {
  begin(s);
  const { ctx } = s;
  const { w, h } = PANEL_PT.limit;
  const c = E.outCubic(clamp(st.reveal * 1.4 - 0.3));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, lerp(0, h, E.outCubic(clamp(st.reveal * 1.5))));
  ctx.clip();
  glass(ctx, 0.5, 0.5, w - 1, h - 1, 20, 0.78);
  ctx.globalAlpha = c;
  txt(ctx, 'DAILY LIMIT', 22, 34, { size: 11, w: 700, color: TONE.mute, ls: 1.6 });
  txt(ctx, 'Weekdays', w - 22, 34, { size: 12, color: TONE.mute, align: 'right' });
  txt(ctx, fmtHM(st.limit), 22, 88, { size: 44, fam: DISPLAY, w: 700 });
  // slider track 0h..4h
  const x0 = 22, x1 = w - 22, y = 124;
  ctx.fillStyle = rgba(BRAND.white, 0.1);
  rr(ctx, x0, y - 3, x1 - x0, 6, 3);
  ctx.fill();
  const kx = lerp(x0, x1, st.limit / 240);
  const g = ctx.createLinearGradient(x0, 0, kx, 0);
  g.addColorStop(0, rgba(BRAND.blue, 0.5));
  g.addColorStop(1, BRAND.blue);
  ctx.fillStyle = g;
  rr(ctx, x0, y - 3, Math.max(6, kx - x0), 6, 3);
  ctx.fill();
  for (let i = 0; i <= 4; i++) {
    const tx = lerp(x0, x1, i / 4);
    txt(ctx, `${i}h`, tx, 152, { size: 11, color: TONE.mute, align: 'center' });
  }
  ctx.save();
  ctx.shadowColor = rgba(BRAND.orange, 0.8);
  ctx.shadowBlur = 14 + st.knob * 10;
  ctx.fillStyle = BRAND.white;
  ctx.beginPath();
  ctx.arc(kx, y, 11 + st.knob * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = BRAND.orange;
  ctx.beginPath();
  ctx.arc(kx, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  panelScan(ctx, w, h, st.reveal * 1.5);
}

// st: { reveal, bars 0..1 }
const WEEK = [1.7, 2.0, 1.4, 1.9, 2.0, 1.2, 0.9];
export function drawWeekPanel(s, st) {
  begin(s);
  const { ctx } = s;
  const { w, h } = PANEL_PT.week;
  const c = E.outCubic(clamp(st.reveal * 1.4 - 0.3));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, lerp(0, h, E.outCubic(clamp(st.reveal * 1.5))));
  ctx.clip();
  glass(ctx, 0.5, 0.5, w - 1, h - 1, 20, 0.78);
  ctx.globalAlpha = c;
  txt(ctx, 'THIS WEEK', 22, 34, { size: 11, w: 700, color: TONE.mute, ls: 1.6 });
  txt(ctx, 'avg 1h 34 / day', w - 22, 34, { size: 12, color: TONE.mute, align: 'right' });
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const base = 160, top = 58, maxH = base - top;
  const bw = 22, gap = (w - 44 - bw * 7) / 6;
  // 2h limit guide
  const ly = base - (2 / 2.2) * maxH;
  ctx.save();
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = rgba(BRAND.orange, 0.55);
  ctx.beginPath();
  ctx.moveTo(22, ly);
  ctx.lineTo(w - 22, ly);
  ctx.stroke();
  ctx.restore();
  WEEK.forEach((v, i) => {
    const k = E.outBack(clamp(st.bars * 1.9 - i * 0.13));
    const bh = Math.max(0, (v / 2.2) * maxH * k);
    const x = 22 + i * (bw + gap);
    const today = i === 3;
    ctx.save();
    if (today) {
      ctx.shadowColor = rgba(BRAND.orange, 0.7);
      ctx.shadowBlur = 16;
    }
    const g = ctx.createLinearGradient(0, base - bh, 0, base);
    g.addColorStop(0, today ? BRAND.orange : BRAND.blue);
    g.addColorStop(1, today ? rgba(BRAND.orange, 0.55) : rgba(BRAND.blue, 0.28));
    ctx.fillStyle = g;
    if (bh > 1) {
      rr(ctx, x, base - bh, bw, bh, 7);
      ctx.fill();
    }
    ctx.restore();
    txt(ctx, days[i], x + bw / 2, base + 22, { size: 11, w: 600, color: today ? BRAND.white : TONE.mute, align: 'center' });
  });
  ctx.restore();
  panelScan(ctx, w, h, st.reveal * 1.5);
}

// st: { reveal, on 0..1 }
export function drawQuizPanel(s, st) {
  begin(s);
  const { ctx } = s;
  const { w, h } = PANEL_PT.quiz;
  const c = E.outCubic(clamp(st.reveal * 1.4 - 0.3));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, lerp(0, h, E.outCubic(clamp(st.reveal * 1.5))));
  ctx.clip();
  glass(ctx, 0.5, 0.5, w - 1, h - 1, 20, 0.78);
  if (st.on > 0) {
    ctx.save();
    ctx.globalAlpha = st.on * 0.5;
    const g = ctx.createRadialGradient(w - 50, h / 2, 4, w - 50, h / 2, 120);
    g.addColorStop(0, rgba(BRAND.orange, 0.35));
    g.addColorStop(1, rgba(BRAND.orange, 0));
    ctx.fillStyle = g;
    rr(ctx, 0, 0, w, h, 20);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = c;
  txt(ctx, 'QUIZ UNLOCK', 22, 34, { size: 11, w: 700, color: st.on > 0.5 ? BRAND.orange : TONE.mute, ls: 1.6 });
  txt(ctx, 'Unlock with quizzes', 22, 66, { size: 17, w: 600 });
  txt(ctx, '3 correct answers = +15 min', 22, 88, { size: 12.5, color: TONE.mute });
  toggle(ctx, w - 72, 41, st.on);
  ctx.restore();
  panelScan(ctx, w, h, st.reveal * 1.5);
}

// ── Kid app ───────────────────────────────────────────────────────────────
// st: { solved (0..3, fractional while animating), reward 0..1+, rewardT (s since reward), deck 0..1 }
export function drawKidScreen(s, st) {
  begin(s);
  const { ctx } = s;
  const bg = ctx.createLinearGradient(0, 0, 0, 932);
  bg.addColorStop(0, '#3CC6F2');
  bg.addColorStop(0.5, BRAND.blue);
  bg.addColorStop(1, TONE.blueDeep);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 430, 932);
  // playful brand circles
  ctx.save();
  ctx.fillStyle = rgba(BRAND.white, 0.08);
  ctx.beginPath();
  ctx.arc(388, 200, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(30, 720, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(BRAND.orange, 0.9);
  ctx.beginPath();
  ctx.arc(60, 420, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(BRAND.white, 0.5);
  ctx.beginPath();
  ctx.arc(384, 460, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const R = clamp(st.reward);
  // reward flash wash
  if (st.rewardT > 0) {
    const f = Math.exp(-st.rewardT / 0.35);
    const g = ctx.createRadialGradient(215, 280, 0, 215, 280, 520);
    g.addColorStop(0, rgba(BRAND.white, 0.75 * f));
    g.addColorStop(1, rgba(BRAND.white, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 430, 932);
  }

  statusBar(ctx);

  // header
  ctx.fillStyle = BRAND.orange;
  ctx.beginPath();
  ctx.arc(46, 96, 22, 0, Math.PI * 2);
  ctx.fill();
  txt(ctx, 'L', 46, 104, { size: 21, fam: DISPLAY, w: 700, align: 'center' });
  txt(ctx, 'Hi Léo!', 80, 104, { size: 24, fam: DISPLAY, w: 700 });
  ctx.save();
  ctx.fillStyle = rgba(BRAND.white, 0.22);
  rr(ctx, 306, 78, 104, 36, 18);
  ctx.fill();
  ctx.restore();
  iconStar(ctx, 330, 96, 10, BRAND.orange);
  const stars = 240 + Math.round(clamp(st.solved, 0, 3) * 10) + (R > 0 ? Math.round(20 * R) : 0);
  txt(ctx, String(stars), 348, 102, { size: 17, fam: DISPLAY, w: 700 });

  // lock pill
  const pillW = 214;
  ctx.save();
  ctx.fillStyle = R > 0.5 ? BRAND.white : rgba(BRAND.navy, 0.28);
  rr(ctx, 215 - pillW / 2, 136, pillW, 34, 17);
  ctx.fill();
  ctx.restore();
  iconLock(ctx, 215 - pillW / 2 + 22, 154, 16, E.outBack(R), R > 0.5 ? BRAND.orange : BRAND.white);
  txt(ctx, R > 0.5 ? 'Screen time unlocked' : 'Screen time locked', 215 + 10, 159, {
    size: 13.5,
    w: 700,
    color: R > 0.5 ? BRAND.navy : BRAND.white,
    align: 'center',
  });

  // progress ring (same position as the parent usage ring: the match cut)
  const p = clamp(st.solved / 3);
  ring(ctx, 215, 280, 86, 16, p, BRAND.orange, rgba(BRAND.white, 0.24), 22);
  // ring segment ticks
  ctx.save();
  ctx.strokeStyle = TONE.blueDeep;
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(215 + Math.cos(a) * 77, 280 + Math.sin(a) * 77);
    ctx.lineTo(215 + Math.cos(a) * 95, 280 + Math.sin(a) * 95);
    ctx.stroke();
  }
  ctx.restore();
  if (R < 0.5) {
    const a = 1 - clamp(R * 4);
    txt(ctx, `${Math.min(3, Math.floor(st.solved + 0.001))}/3`, 215, 292, { size: 46, fam: DISPLAY, w: 800, align: 'center', alpha: a });
    txt(ctx, 'QUESTIONS', 215, 316, { size: 11, w: 700, align: 'center', ls: 1.8, alpha: 0.85 * a });
  } else {
    const k = spring(st.rewardT - 0.05, 2.2, 0.45);
    ctx.save();
    ctx.translate(215, 284);
    ctx.scale(k, k);
    txt(ctx, `+${Math.round(15 * clamp(st.rewardT / 0.5))}`, 0, 10, { size: 60, fam: DISPLAY, w: 800, align: 'center' });
    txt(ctx, 'MIN', 0, 36, { size: 13, w: 800, align: 'center', ls: 2.4 });
    ctx.restore();
  }

  // copy under the ring
  if (R < 0.5) {
    txt(ctx, 'Answer 3 questions', 215, 414, { size: 23, fam: DISPLAY, w: 700, align: 'center' });
    txt(ctx, 'to unlock 15 more minutes', 215, 440, { size: 14, w: 500, align: 'center', alpha: 0.88 });
  } else {
    const k = E.outCubic(clamp((st.rewardT - 0.15) / 0.4));
    txt(ctx, 'Well done, Léo!', 215, 414 + (1 - k) * 12, { size: 23, fam: DISPLAY, w: 700, align: 'center', alpha: k });
    txt(ctx, '15 minutes added to today', 215, 440 + (1 - k) * 12, { size: 14, w: 500, align: 'center', alpha: 0.88 * k });
  }

  // card deck slot (3D quiz cards rise out of here)
  const deck = clamp(st.deck);
  if (deck > 0) {
    const left = Math.max(0, 3 - Math.floor(st.solved + 0.001));
    ctx.save();
    for (let i = Math.min(2, left - 1); i >= 0; i--) {
      ctx.globalAlpha = deck * (i === 0 ? 0.34 : 0.2);
      ctx.fillStyle = BRAND.white;
      rr(ctx, 44 + i * 14, 478 + i * 16, 342 - i * 28, 300, 24);
      ctx.fill();
    }
    ctx.restore();
  }
  if (R > 0) {
    const k = E.outBack(clamp((st.rewardT - 0.25) / 0.45));
    ctx.save();
    ctx.globalAlpha = clamp(k);
    ctx.translate(215, 690);
    ctx.scale(lerp(0.85, 1, clamp(k)), lerp(0.85, 1, clamp(k)));
    ctx.shadowColor = rgba(BRAND.orange, 0.6);
    ctx.shadowBlur = 24;
    ctx.fillStyle = BRAND.orange;
    rr(ctx, -150, -32, 300, 64, 32);
    ctx.fill();
    ctx.restore();
    txt(ctx, 'Start playing', 215, 697 + (1 - clamp(k)) * 6, { size: 19, fam: DISPLAY, w: 700, align: 'center', alpha: clamp(k) });
  }
  homeIndicator(ctx, rgba(BRAND.white, 0.75));
}

// ── Quiz card ─────────────────────────────────────────────────────────────
export const CARD_PT = { w: 340, h: 300, pad: 40 };
export const QUIZ = [
  { subject: 'SCIENCE', q: 'What do plants need to make their food?', a: ['Sunlight', 'Sand', 'Plastic'], correct: 0 },
  { subject: 'MATHS', q: '7 × 8 = ?', a: ['54', '56', '64'], correct: 1 },
  { subject: 'GEOGRAPHY', q: 'What is the capital of Italy?', a: ['Milan', 'Venice', 'Rome'], correct: 2 },
];

// u = seconds since the card started. Interaction beats inside a card.
export const CARD_BEAT = { tap: 0.4, snap: 0.52 };

export function drawQuizCard(s, idx, u) {
  begin(s);
  const { ctx } = s;
  const { w, h, pad } = CARD_PT;
  const q = QUIZ[idx];
  ctx.save();
  ctx.shadowColor = 'rgba(3, 18, 44, 0.42)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = BRAND.white;
  rr(ctx, pad, pad, w, h, 24);
  ctx.fill();
  ctx.restore();

  const x = pad + 22, y = pad;
  const chipW = (ctx.font = `700 11px ${BODY}`, ctx.measureText(q.subject).width + 26 + q.subject.length * 1.4);
  ctx.save();
  ctx.fillStyle = TONE.orangeMist;
  rr(ctx, x, y + 22, chipW, 26, 13);
  ctx.fill();
  ctx.restore();
  txt(ctx, q.subject, x + 13, y + 39.5, { size: 11, w: 700, color: BRAND.orange, ls: 1.4 });
  txt(ctx, `${idx + 1}/3`, pad + w - 22, y + 40, { size: 13, w: 600, color: TONE.mute, align: 'right' });

  const qFont = `700 23px ${DISPLAY}`;
  const lines = wrap(ctx, q.q, w - 44, qFont);
  const qy = lines.length > 1 ? y + 86 : y + 96;
  lines.forEach((l, i) => txt(ctx, l, x, qy + i * 28, { size: 23, fam: DISPLAY, w: 700, color: BRAND.navy }));

  const tapK = clamp((u - CARD_BEAT.tap) / 0.12);
  const snapK = u - CARD_BEAT.snap;
  q.a.forEach((ans, i) => {
    const cy = y + 150 + i * 48;
    const isC = i === q.correct;
    const chosen = isC && tapK > 0;
    const dim = !isC && snapK > 0 ? lerp(1, 0.4, clamp(snapK / 0.15)) : 1;
    let sc = 1;
    if (isC) {
      sc -= 0.04 * bump(u, CARD_BEAT.tap - 0.02, CARD_BEAT.snap);
      if (snapK > 0) sc += 0.035 * Math.sin(Math.PI * clamp(snapK / 0.22));
    }
    ctx.save();
    ctx.globalAlpha = dim;
    ctx.translate(x + (w - 44) / 2, cy + 20);
    ctx.scale(sc, sc);
    ctx.translate(-(x + (w - 44) / 2), -(cy + 20));
    ctx.fillStyle = TONE.blueMist;
    rr(ctx, x, cy, w - 44, 40, 20);
    ctx.fill();
    if (chosen) {
      ctx.save();
      ctx.globalAlpha = dim * tapK;
      ctx.shadowColor = rgba(BRAND.blue, 0.55);
      ctx.shadowBlur = 16 * tapK;
      ctx.fillStyle = BRAND.blue;
      rr(ctx, x, cy, w - 44, 40, 20);
      ctx.fill();
      ctx.restore();
    }
    const fg = chosen && tapK > 0.5 ? BRAND.white : BRAND.navy;
    ctx.fillStyle = chosen && tapK > 0.5 ? rgba(BRAND.white, 0.25) : BRAND.white;
    ctx.beginPath();
    ctx.arc(x + 20, cy + 20, 13, 0, Math.PI * 2);
    ctx.fill();
    txt(ctx, 'ABC'[i], x + 20, cy + 24.5, { size: 12, w: 700, color: fg, align: 'center' });
    txt(ctx, ans, x + 42, cy + 25.5, { size: 16, w: 600, color: fg });
    if (isC && snapK > 0) {
      const pk = spring(snapK, 3, 0.4);
      ctx.save();
      ctx.translate(x + w - 44 - 20, cy + 20);
      ctx.scale(pk, pk);
      ctx.fillStyle = BRAND.white;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      iconCheck(ctx, x + w - 44 - 20, cy + 20, 16, BRAND.blue, clamp(snapK / 0.18));
    }
    // tap ripple
    if (chosen && u > CARD_BEAT.tap && u < CARD_BEAT.tap + 0.45) {
      const r = (u - CARD_BEAT.tap) / 0.45;
      ctx.save();
      ctx.strokeStyle = rgba(BRAND.white, 0.8 * (1 - r));
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + 150, cy + 20, 8 + r * 46, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  });
}
