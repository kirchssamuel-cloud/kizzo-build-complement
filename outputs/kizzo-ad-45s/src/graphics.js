// Illustrative motion-design graphics drawn on canvas. These are NOT app
// screens: they reuse the wording of the real generated questions
// (assets/screens/questions.jpg) on floating cards that read as graphics.
import { BRAND, APP, rgba } from './palette.js';
import { clamp, lerp, E, spring } from './timeline.js';

const DISPLAY = 'Outfit, "Avenir Next", system-ui, sans-serif';

export const QUESTIONS = [
  {
    label: 'QUESTION 1',
    q: 'Qu’est-ce qui transforme l’eau des océans en vapeur d’eau ?',
    a: ['La chaleur de l’air', 'La chaleur du Soleil', 'La chaleur du sol'],
    ok: 1,
  },
  {
    label: 'QUESTION 2',
    q: 'Que forme la vapeur d’eau en se refroidissant en altitude ?',
    a: ['Des nuages', 'Des rivières', 'De la grêle'],
    ok: 0,
  },
  { label: 'QUESTION 3', q: '', a: [], ok: -1 },
];

function wrap(ctx, str, maxW) {
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

// Card layout in card pixels (drawn at 2×).
export const CARD = { w: 760, h: 560, pad: 48, pillH: 78, pillGap: 16 };

function cardBase(ctx, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(12, 41, 55, 0.18)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 22;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(40, 30, w - 80, h - 80, 44);
  ctx.fill();
  ctx.restore();
}

// returns pill rects (card px) so the HUD can circle the right answer
export function drawCard(canvas, qi, sel = 0) {
  const s = 2;
  const ctx = canvas.getContext('2d');
  const { w, h } = CARD;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.clearRect(0, 0, w, h);
  cardBase(ctx, w, h);
  const Q = QUESTIONS[qi];
  const x0 = 40 + CARD.pad, x1 = w - 40 - CARD.pad;
  ctx.fillStyle = APP.teal;
  ctx.font = `600 22px ${DISPLAY}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
  ctx.fillText(Q.label, x0, 30 + 62);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  const pills = [];
  if (!Q.q) {
    // back card: abstract lines only
    ctx.fillStyle = rgba(APP.ink, 0.08);
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.roundRect(x0, 120 + i * 46, (x1 - x0) * (i ? 0.62 : 0.9), 26, 13);
      ctx.fill();
    }
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#F5F3EE';
      ctx.beginPath();
      ctx.roundRect(x0, 230 + i * (CARD.pillH + CARD.pillGap) * 0.8, x1 - x0, CARD.pillH * 0.7, 20);
      ctx.fill();
    }
    return pills;
  }
  ctx.fillStyle = APP.ink;
  ctx.font = `700 34px ${DISPLAY}`;
  const lines = wrap(ctx, Q.q, x1 - x0);
  lines.forEach((l, i) => ctx.fillText(l, x0, 30 + 110 + i * 42));
  let y = 30 + 110 + lines.length * 42 + 6;
  Q.a.forEach((ans, i) => {
    const ok = i === Q.ok;
    const k = ok ? sel : 0;
    const dim = !ok && sel > 0 ? lerp(1, 0.45, clamp(sel * 1.5)) : 1;
    ctx.save();
    ctx.globalAlpha = dim;
    ctx.fillStyle = ok && k > 0 ? `rgba(227, 242, 237, ${0.35 + 0.65 * k})` : '#F7F5F0';
    ctx.beginPath();
    ctx.roundRect(x0, y, x1 - x0, CARD.pillH, 22);
    ctx.fill();
    ctx.strokeStyle = ok && k > 0 ? rgba('#3BA57A', 0.4 + 0.5 * k) : 'rgba(12,41,55,0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = APP.ink;
    ctx.font = `500 30px ${DISPLAY}`;
    ctx.fillText(ans, x0 + 26, y + CARD.pillH / 2 + 10);
    if (ok && k > 0) {
      const p = clamp((k - 0.2) / 0.6);
      const cx = x1 - 40, cy = y + CARD.pillH / 2;
      ctx.strokeStyle = '#2E9E70';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const a = [cx - 15, cy + 1], b = [cx - 4, cy + 12], c = [cx + 17, cy - 12];
      const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
      const d = p * (l1 + l2);
      ctx.beginPath();
      ctx.moveTo(...a);
      if (d <= l1) ctx.lineTo(lerp(a[0], b[0], d / l1), lerp(a[1], b[1], d / l1));
      else {
        ctx.lineTo(...b);
        const q = (d - l1) / l2;
        ctx.lineTo(lerp(b[0], c[0], q), lerp(b[1], c[1], q));
      }
      ctx.stroke();
    }
    ctx.restore();
    pills.push({ x: x0, y, w: x1 - x0, h: CARD.pillH });
    y += CARD.pillH + CARD.pillGap;
  });
  return pills;
}

export function makeCardCanvas() {
  const c = document.createElement('canvas');
  c.width = CARD.w * 2;
  c.height = CARD.h * 2;
  return c;
}

// Clock dial behind the phone when the parent sets the quiz rhythm:
// ticks, a cyan hand of light that advances, soft pulses at each quiz.
export function makeRingCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = 980;
  return c;
}

export function drawClock(c, k, t) {
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 980, 980);
  const cx = 490, cy = 490, r = 452;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2 - Math.PI / 2;
    const major = i % 4 === 0;
    const r0 = r - (major ? 30 : 16), r1 = r - 8;
    ctx.strokeStyle = major ? rgba(APP.ink, 0.45) : rgba(APP.ink, 0.18);
    ctx.lineWidth = major ? 5 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }
  // progress arc
  if (k > 0) {
    const a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * k;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.shadowColor = rgba(BRAND.cyan, 0.7);
    ctx.shadowBlur = 22;
    const g = ctx.createConicGradient(a0, cx, cy);
    g.addColorStop(0, rgba(BRAND.cyan, 0.15));
    g.addColorStop(Math.max(0.01, k), BRAND.cyan);
    ctx.strokeStyle = g;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1);
    ctx.stroke();
    // head
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = rgba(BRAND.cyan, 0.9);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // a soft orange pulse at each quarter the hand has passed ("un quiz")
    for (let i = 1; i <= 4; i++) {
      const at = i / 4;
      if (k < at) continue;
      const age = (k - at) * 4;
      const a = a0 + Math.PI * 2 * at;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      ctx.fillStyle = BRAND.orange;
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fill();
      if (age < 1) {
        ctx.strokeStyle = rgba(BRAND.orange, 0.6 * (1 - age));
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(px, py, 14 + age * 40, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

// Slate shown in place of a character shot that is not on disk yet.
export function drawSlate(label, range) {
  const c = document.createElement('canvas');
  c.width = 540;
  c.height = 960;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 960);
  g.addColorStop(0, '#CFE6EC');
  g.addColorStop(1, '#F3D3C0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 540, 960);
  ctx.strokeStyle = 'rgba(12,41,55,0.25)';
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 480, 900);
  ctx.setLineDash([]);
  ctx.fillStyle = APP.ink;
  ctx.textAlign = 'center';
  ctx.font = `700 30px ${DISPLAY}`;
  ctx.fillText('PLAN PERSONNAGES 3D', 270, 560);
  ctx.font = `600 26px ${DISPLAY}`;
  ctx.fillText(label, 270, 606);
  ctx.font = `500 22px ${DISPLAY}`;
  ctx.fillStyle = rgba(APP.ink, 0.6);
  ctx.fillText(range, 270, 644);
  ctx.fillText('généré (Higgsfield) · à intégrer', 270, 676);
  return c;
}
