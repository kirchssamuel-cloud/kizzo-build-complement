// Motion design après l'impact (repère logique 390 × 693, soit 1080 × 1920).
// UNE seule forme, jamais coupée : sa taille, son rayon et sa couleur suivent des ressorts
// (léger dépassement au plus), son contenu change avec un court flou. Un curseur pilote
// chaque changement (clics, glisser), la caméra 2D zoome pour que chaque état remplisse le cadre.
// Gris chaud, composants noir et blanc, un seul accent : l'orange Kizzo.
import { rr, txt, icon, F_BODY, F_DISPLAY, F_NUM } from '../ui-canvas.js';
import { LOGO } from '../logo-shape.js';
import { M, T, C } from './config.js';
import { clamp, lerp, seg, ease, springT, TAU } from '../util.js';

export const FW = 390;
export const FH = (390 * 16) / 9;
/** Point du monde placé au point d'ancrage écran (légèrement sous le centre : place pour les sous-titres). */
const AX = 195, AY = 372;
const CX = 195, CY = 372;

const ORANGE = [249, 115, 22], INK = [18, 20, 23], WHITE = [255, 255, 255];
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const sp = (dt, s = 320, d = 30) => springT(dt, { stiffness: s, damping: d });
const frameT = (t) => Math.round(t * 60) / 60;
const U = T.ui;

/** Suivi par ressorts : chaque changement de cible ajoute sa réponse (superposition). */
function track(keys, t, def) {
  let v = keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t <= k.at) break;
    const [s, d] = k.k || def;
    v += (k.v - keys[i - 1].v) * sp(t - k.at, s, d);
  }
  return v;
}

// ---------------------------------------------------------------------------
// Logo final : la pastille orange devient la tête de l'enfant du logo
const LOGO_H = 150;
const LOGO_C = [195, 300];
const CHILD = { x: LOGO_C[0] + LOGO.child.c[0] * LOGO_H, y: LOGO_C[1] - LOGO.child.c[1] * LOGO_H, r: LOGO.child.r * LOGO_H };

// ---------------------------------------------------------------------------
// États de la forme

const STATES = [
  { at: -1, x: CX, y: CY, w: 0, h: 0, r: 0, fill: ORANGE, content: null },
  { at: M.seed, w: 74, h: 74, r: 22 },
  { at: M.bleed, w: 640, h: 1060, r: 22, content: 'still' },
  { at: M.brand, content: 'brand' },
  { at: M.play, w: 198, h: 66, r: 33, fill: INK, content: 'play' },
  { at: M.loader, w: 66, h: 66, r: 33, content: 'loader' },
  { at: M.lock, w: 300, h: 300, r: 30, fill: WHITE, content: 'lock' },
  { at: M.lockBtn, h: 372 },
  { at: M.tapQuiz + 0.04, w: 324, h: 424, r: 30, content: 'quiz' },
  { at: M.reward, w: 256, h: 112, r: 56, fill: ORANGE, content: 'reward' },
  { at: M.countdown, w: 276, h: 90, r: 45, fill: INK, content: 'countdown' },
  { at: M.settings, w: 328, h: 112, r: 26, fill: WHITE, content: 'settings' },
  { at: M.tabs, h: 198 },
  { at: M.chart, h: 292, content: 'chart' },
  { at: M.slider, h: 180, content: 'slider' },
  { at: M.toast, w: 336, h: 82, r: 41, fill: INK, content: 'toast' },
  { at: M.dot, w: 28, h: 28, r: 14, fill: ORANGE, content: null },
  { at: M.logo, x: CHILD.x, y: CHILD.y, w: CHILD.r * 2, h: CHILD.r * 2, r: CHILD.r, content: 'logo' },
];
// les propriétés non précisées reprennent la valeur précédente
for (let i = 1; i < STATES.length; i++) for (const k of Object.keys(STATES[0])) if (!(k in STATES[i])) STATES[i][k] = STATES[i - 1][k];

const SPR = { x: [300, 31], y: [300, 31], w: [400, 33], h: [300, 30], r: [260, 28] };
const TRACKS = {};
for (const p of ['x', 'y', 'w', 'h', 'r']) TRACKS[p] = STATES.map((s) => ({ at: s.at, v: s[p] }));
const FILL = [0, 1, 2].map((c) => STATES.map((s) => ({ at: s.at, v: s.fill[c] })));
// changements de contenu
const CONTENTS = [];
STATES.forEach((s, i) => {
  if (i === 0) return;
  const prev = CONTENTS.length ? CONTENTS[CONTENTS.length - 1].id : null;
  if (s.content !== prev) CONTENTS.push({ id: s.content, at: s.at });
});

// ---------------------------------------------------------------------------
// Caméra 2D : zoom et cadrage

const CAM_KEYS = [
  [-1, 1, CX, CY],
  [M.play - 0.06, 1.55, CX, CY],
  [M.lock - 0.06, 1.06, CX, CY],
  [M.tapQuiz - 0.02, 0.97, CX, CY],
  [M.reward - 0.04, 1.36, CX, CY],
  [M.settings - 0.04, 1.08, CX, CY],
  [M.tabs - 0.04, 1.05, CX, CY],
  [M.chart - 0.04, 1.03, CX, CY],
  [M.slider - 0.04, 1.1, CX, CY],
  [M.toast - 0.04, 1.02, CX, CY],
  [M.dot - 0.04, 1.7, CX, CY],
  [M.logo - 0.02, 1.0, 195, 412],
];
const CAM = [1, 2, 3].map((j) => CAM_KEYS.map((k) => ({ at: k[0], v: k[j] })));
export function camera2D(t) {
  return { zoom: track(CAM[0], t, [210, 27]), cx: track(CAM[1], t, [210, 27]), cy: track(CAM[2], t, [210, 27]) };
}

// ---------------------------------------------------------------------------
// Mises en page (partagées entre le contenu et les cibles du curseur)

const LOCK_BTN = { w: 240, h: 54, dy: -48 }; // depuis le bas de la carte
const OPT = { w: 136, h: 64, gx: 74, rows: [-152, -76] }; // rangées depuis le bas
const optPos = (i) => ({ x: (i % 2 ? 1 : -1) * OPT.gx, y: OPT.rows[i < 2 ? 0 : 1] });
const TOG = { x: 164 - 22 - 26, w: 52, h: 32 };
const TABS = { w: 288, h: 46, dy: -42 };
const CHART = { x0: -128, x1: 128, y0: 104, y1: -6, vals: [42, 55, 51, 68, 74, 83, 92] };
const chartPt = (i) => ({ x: lerp(CHART.x0, CHART.x1, i / 6), y: lerp(CHART.y0, CHART.y1, (CHART.vals[i] - 35) / 60) });
const SLIDER = { x0: -128, x1: 128, y: 36 };
const stopX = (i) => lerp(SLIDER.x0, SLIDER.x1, i / (U.sliderStops.length - 1));
const CTA = { y: 548, w: 254, h: 60 };

// ---------------------------------------------------------------------------
// Curseur (positions monde ; taille constante à l'écran)

const CUR_KEYS = [
  [-1, 430, 820],
  [M.play + 0.06, 238, 380],
  [M.loader + 0.12, 270, 446],
  [M.lockBtn + 0.06, 238, CY + 186 + LOCK_BTN.dy + 6],
  [M.options + 0.14, CX + OPT.gx + 6, CY + 212 + OPT.rows[0] + 8],
  [M.reward + 0.12, 316, 470],
  [M.settings + 0.05, CX + TOG.x + 4, CY + 4],
  [M.tabs + 0.14, CX + 4, CY + 99 + TABS.dy + 5],
  [M.chart + 0.3, CX + chartPt(6).x - 40, CY + chartPt(6).y + 50],
  [M.tooltip - 0.12, CX + chartPt(6).x + 2, CY + chartPt(6).y + 4],
  [M.slider + 0.1, CX + stopX(1) + 2, CY + SLIDER.y + 4],
  [M.drag + 0.02, CX + stopX(2) + 14, CY + SLIDER.y + 4, [110, 21]],
  [M.toast + 0.1, 330, 476],
  [M.cta + 0.06, CX + 44, CTA.y + 6],
];
const CUR = [1, 2].map((j) => CUR_KEYS.map((k) => ({ at: k[0], v: k[j], k: k[3] })));
const cursorAt = (t) => ({ x: track(CUR[0], t, [190, 27]), y: track(CUR[1], t, [190, 27]) });
const CLICKS = [M.tapPlay, M.tapQuiz, M.tapAnswer, M.tapToggle, M.tapTab, M.drag, M.tapCta];
/** Enfoncement 0..1 autour d'un clic. */
const press = (t, at, hold = 0) => (t < at - 0.07 ? 0 : t < at ? ease.outQuad(seg(t, at - 0.07, at)) : t < at + hold ? 1 : 1 - ease.outCubic(seg(t, at + hold, at + hold + 0.2)));

// ---------------------------------------------------------------------------
// Contenus (dessinés centrés sur la forme ; box = taille courante)

const top = (box) => -box.h / 2;
const bot = (box) => box.h / 2;
const appear = (t, at, s = 300, d = 28) => clamp(sp(t - at, s, d), 0, 1.2);

const CONTENT = {
  still(ctx) {
    txt(ctx, T.still[0], 0, -14, { size: 50, weight: 800, color: '#fff', align: 'center', font: F_DISPLAY, ls: -1.5 });
    txt(ctx, T.still[1], 0, 42, { size: 50, weight: 800, color: '#fff', align: 'center', font: F_DISPLAY, ls: -1.5 });
  },
  brand(ctx, box, t) {
    const k = clamp(sp(t - M.brand - 0.02, 340, 30), 0, 1.05);
    ctx.save();
    ctx.translate(0, -44);
    ctx.scale(k, k);
    ctx.scale(130, -130);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    LOGO.body.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(LOGO.head.c[0], LOGO.head.c[1], LOGO.head.r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.arc(LOGO.child.c[0], LOGO.child.c[1], LOGO.child.r, 0, TAU);
    ctx.fill();
    ctx.restore();
    const kw = clamp(sp(t - M.brand - 0.1, 340, 30), 0, 1.05);
    txt(ctx, 'kizzo', 0, 96 + (1 - kw) * 20, { size: 72, weight: 800, color: '#fff', align: 'center', font: F_DISPLAY, ls: -2, alpha: clamp(kw * 1.5) });
  },
  play(ctx, box, t) {
    icon.play(ctx, -48, -11, 22, '#fff');
    txt(ctx, U.play, 10, 8, { size: 22, weight: 800, color: '#fff', align: 'center', font: F_DISPLAY });
  },
  loader(ctx, box, t) {
    const a0 = (t - M.loader) * 9;
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = C.orange;
    ctx.beginPath();
    ctx.arc(0, 0, 15, a0, a0 + 1.2 + Math.sin((t - M.loader) * 7) * 0.6);
    ctx.stroke();
  },
  lock(ctx, box, t) {
    const y0 = top(box);
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(0, y0 + 62, 32, 0, TAU);
    ctx.fill();
    icon.lock(ctx, -15, y0 + 46, 30, '#fff');
    txt(ctx, U.lockTitle[0], 0, y0 + 136, { size: 30, weight: 800, color: C.ink, align: 'center', font: F_DISPLAY, ls: -0.8 });
    txt(ctx, U.lockTitle[1], 0, y0 + 170, { size: 30, weight: 800, color: C.ink, align: 'center', font: F_DISPLAY, ls: -0.8 });
    txt(ctx, U.lockSub, 0, y0 + 204, { size: 14.5, weight: 600, color: C.ink2, align: 'center' });
    // bouton « Faire un quiz »
    const k = appear(t, M.lockBtn + 0.04);
    if (k > 0.001) {
      const pr = press(t, M.tapQuiz);
      const s = (0.7 + 0.3 * k) * (1 - 0.05 * pr);
      ctx.save();
      ctx.translate(0, bot(box) + LOCK_BTN.dy);
      ctx.scale(s, s);
      ctx.globalAlpha *= clamp(k * 1.4);
      ctx.fillStyle = C.ink;
      rr(ctx, -LOCK_BTN.w / 2, -LOCK_BTN.h / 2, LOCK_BTN.w, LOCK_BTN.h, LOCK_BTN.h / 2);
      ctx.fill();
      txt(ctx, U.lockBtn, 0, 6.5, { size: 18, weight: 800, color: '#fff', align: 'center', font: F_DISPLAY });
      ctx.restore();
    }
  },
  quiz(ctx, box, t) {
    const y0 = top(box);
    // en-tête
    ctx.fillStyle = 'rgba(249,115,22,0.12)';
    rr(ctx, -box.w / 2 + 24, y0 + 24, 74, 28, 14);
    ctx.fill();
    txt(ctx, U.subject, -box.w / 2 + 61, y0 + 43, { size: 12.5, weight: 800, color: C.orange, align: 'center', ls: 1.2 });
    txt(ctx, U.of, box.w / 2 - 24, y0 + 43, { size: 13, weight: 700, color: C.ink2, align: 'right' });
    txt(ctx, U.q[0], 0, y0 + 104, { size: 19, weight: 700, color: C.ink2, align: 'center' });
    txt(ctx, U.q[1], 0, y0 + 166, { size: 58, weight: 700, color: C.ink, align: 'center', font: F_NUM, ls: -1.5 });
    // réponses
    const ok = U.ok;
    const sel = clamp(sp(t - M.tapAnswer, 420, 36));
    U.options.forEach((o, i) => {
      const k = appear(t, M.options + i * 0.06, 360, 30);
      if (k <= 0.001) return;
      const p = optPos(i);
      const isOk = i === ok;
      const pr = isOk ? press(t, M.tapAnswer) : 0;
      ctx.save();
      ctx.translate(p.x, bot(box) + p.y);
      const s = (0.6 + 0.4 * k) * (1 - 0.06 * pr) * (isOk ? 1 + 0.05 * Math.max(0, Math.sin(clamp((t - M.tapAnswer) / 0.25) * Math.PI)) : 1);
      ctx.scale(s, s);
      ctx.globalAlpha *= clamp(k * 1.5) * (isOk ? 1 : 1 - 0.6 * sel);
      ctx.fillStyle = isOk ? rgb([lerp(255, 249, sel), lerp(255, 115, sel), lerp(255, 22, sel)]) : '#fff';
      rr(ctx, -OPT.w / 2, -OPT.h / 2, OPT.w, OPT.h, 18);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isOk ? rgb([lerp(217, 249, sel), lerp(212, 115, sel), lerp(204, 22, sel)]) : C.line;
      ctx.stroke();
      const col = isOk && sel > 0.5 ? '#fff' : C.ink;
      txt(ctx, o, isOk ? -12 * sel : 0, 10, { size: 28, weight: 700, color: col, align: 'center', font: F_NUM });
      if (isOk && sel > 0.05) {
        ctx.globalAlpha *= clamp(sel * 2);
        icon.check(ctx, 18, -11, 22 * clamp(sel * 1.2), '#fff', 3.2);
      }
      ctx.restore();
    });
  },
  reward(ctx, box, t) {
    // valeurs affichées calées sur l'image (pas de chiffres fantômes dans le flou de bougé)
    const k = clamp(seg(frameT(t), M.reward + 0.04, M.reward + 0.34));
    const mins = Math.round(ease.outCubic(k) * 15);
    txt(ctx, `+${String(mins).padStart(2, '0')}:00`, 0, 10, { size: 46, weight: 700, color: '#fff', align: 'center', font: F_NUM, ls: -1 });
    txt(ctx, U.rewardSub, 0, 36, { size: 13, weight: 700, color: 'rgba(255,255,255,0.86)', align: 'center' });
  },
  countdown(ctx, box, t) {
    const lt = t - M.countdown;
    const x0 = -box.w / 2 + 46;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.arc(x0, 0, 22, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = C.orange;
    ctx.beginPath();
    ctx.arc(x0, 0, 22, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - lt * 0.02));
    ctx.stroke();
    icon.play(ctx, x0 - 9, -9, 18, '#fff');
    const secs = 900 - Math.floor(Math.max(0, frameT(t) - M.countdown - 0.18) * 4);
    const mm = Math.floor(secs / 60), ss = secs % 60;
    txt(ctx, U.timer, x0 + 40, -10, { size: 12, weight: 700, color: 'rgba(255,255,255,0.6)' });
    txt(ctx, `${mm}:${String(ss).padStart(2, '0')}`, x0 + 39, 24, { size: 34, weight: 700, color: '#fff', font: F_NUM, ls: -0.5 });
  },
  settings(ctx, box, t) {
    const y = top(box) + 56;
    const x0 = -box.w / 2 + 22;
    ctx.fillStyle = C.ink;
    rr(ctx, x0, y - 22, 44, 44, 14);
    ctx.fill();
    icon.bolt(ctx, x0 + 10, y - 12, 24, C.orange);
    txt(ctx, U.setting, x0 + 58, y - 3, { size: 16.5, weight: 800, color: C.ink, font: F_DISPLAY });
    txt(ctx, U.settingSub, x0 + 58, y + 17, { size: 12.5, weight: 600, color: C.ink2 });
    // interrupteur
    const on = clamp(sp(t - M.tapToggle, 520, 40), 0, 1.02);
    const pr = press(t, M.tapToggle);
    ctx.save();
    ctx.translate(TOG.x, y);
    ctx.fillStyle = rgb([lerp(217, 249, on), lerp(212, 115, on), lerp(204, 22, on)]);
    rr(ctx, -TOG.w / 2, -TOG.h / 2, TOG.w, TOG.h, TOG.h / 2);
    ctx.fill();
    const kw = 26 + 6 * pr;
    const kx = lerp(-TOG.w / 2 + 3, TOG.w / 2 - 3 - kw, on);
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#fff';
    rr(ctx, kx, -13, kw, 26, 13);
    ctx.fill();
    ctx.restore();
    // onglets (matières)
    const k = appear(t, M.tabs + 0.04, 340, 30);
    if (k <= 0.001) return;
    ctx.save();
    ctx.translate(0, bot(box) + TABS.dy);
    ctx.globalAlpha *= clamp(k * 1.5);
    ctx.translate(0, (1 - k) * 14);
    ctx.fillStyle = '#F1EEE9';
    rr(ctx, -TABS.w / 2, -TABS.h / 2, TABS.w, TABS.h, TABS.h / 2);
    ctx.fill();
    const segW = (TABS.w - 8) / 3;
    const cx = (i) => -TABS.w / 2 + 4 + segW * i + segW / 2;
    // indicateur « liquide » : bord avant rapide, bord arrière lent
    const lead = sp(t - M.tapTab, 480, 36), trail = sp(t - M.tapTab - 0.03, 210, 27);
    const l = lerp(cx(0), cx(1), trail) - segW / 2, r = lerp(cx(0), cx(1), lead) + segW / 2;
    const pr2 = press(t, M.tapTab);
    ctx.fillStyle = C.ink;
    rr(ctx, l, -TABS.h / 2 + 4 + pr2 * 1.5, r - l, TABS.h - 8 - pr2 * 3, (TABS.h - 8) / 2);
    ctx.fill();
    U.tabs.forEach((s, i) => {
      const act = i === 0 ? 1 - clamp(lead) : i === 1 ? clamp(lead) : 0;
      const g = Math.round(lerp(92, 255, act));
      txt(ctx, s, cx(i), 5, { size: 14, weight: 700, color: `rgb(${g},${lerp(95, 255, act) | 0},${lerp(102, 255, act) | 0})`, align: 'center' });
    });
    ctx.restore();
  },
  chart(ctx, box, t) {
    const y0 = top(box);
    txt(ctx, U.chartTitle, -box.w / 2 + 24, y0 + 42, { size: 17, weight: 800, color: C.ink, font: F_DISPLAY });
    txt(ctx, U.chartSub, -box.w / 2 + 24, y0 + 63, { size: 12.5, weight: 600, color: C.ink2 });
    ctx.strokeStyle = '#EEEAE4';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const y = lerp(CHART.y0, CHART.y1 - 10, i / 2);
      ctx.beginPath();
      ctx.moveTo(CHART.x0 - 6, y);
      ctx.lineTo(CHART.x1 + 6, y);
      ctx.stroke();
    }
    'LMMJVSD'.split('').forEach((d, i) => txt(ctx, d, chartPt(i).x, CHART.y0 + 26, { size: 11, weight: 700, color: C.ink2, align: 'center' }));
    // la courbe se trace
    const draw = ease.inOutCubic(seg(t, M.chart + 0.08, M.dots + 0.42)) * 6;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= Math.ceil(draw); i++) {
      const p = chartPt(Math.min(i, 6));
      if (i > draw) {
        const a = chartPt(i - 1), f = draw - (i - 1);
        ctx.lineTo(lerp(a.x, p.x, f), lerp(a.y, p.y, f));
      } else if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    // points
    for (let i = 0; i < 7; i++) {
      const at = M.chart + 0.08 + (i / 6) * (M.dots + 0.34 - M.chart - 0.08);
      const k = appear(t, Math.max(at, M.dots - 0.05 + i * 0.03), 420, 30);
      if (k <= 0.001) continue;
      const p = chartPt(i);
      const hot = i === 6 ? clamp(sp(t - M.tooltip, 380, 30), 0, 1.05) : 0;
      ctx.fillStyle = hot > 0.5 ? C.orange : '#fff';
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (4.5 + 3 * hot) * k, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    // info-bulle
    const k = clamp(sp(t - M.tooltip, 380, 30), 0, 1.05);
    if (k > 0.001) {
      const p = chartPt(6);
      ctx.save();
      ctx.translate(p.x, p.y - 16);
      ctx.scale(k, k);
      ctx.globalAlpha *= clamp(k * 1.6);
      const w = 150, h = 36;
      ctx.fillStyle = C.ink;
      rr(ctx, -w + 22, -h - 8, w, h, 18);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, -9);
      ctx.lineTo(6, -9);
      ctx.lineTo(0, -1);
      ctx.fill();
      txt(ctx, U.tooltip, -w / 2 + 22, -20, { size: 14, weight: 800, color: '#fff', align: 'center' });
      ctx.restore();
    }
  },
  slider(ctx, box, t) {
    const y0 = top(box);
    txt(ctx, U.sliderLabel, -box.w / 2 + 24, y0 + 44, { size: 15, weight: 700, color: C.ink2 });
    // valeur : suit le bouton (crans), petit rebond à chaque changement
    const kx = knobX(t);
    const idx = nearestStop(knobX(frameT(t)));
    const changed = t > M.drag ? stopChange(t) : -9;
    const bump = 1 + 0.12 * Math.max(0, Math.sin(clamp((t - changed) / 0.22) * Math.PI));
    ctx.save();
    ctx.translate(box.w / 2 - 62, y0 + 39);
    ctx.scale(bump, bump);
    ctx.fillStyle = C.ink;
    rr(ctx, -40, -17, 80, 34, 17);
    ctx.fill();
    txt(ctx, `${U.sliderStops[idx]} min`, 0, 6.5, { size: 17, weight: 700, color: '#fff', align: 'center', font: F_NUM });
    ctx.restore();
    // rail
    const y = SLIDER.y;
    ctx.fillStyle = '#E7E2DA';
    rr(ctx, SLIDER.x0, y - 3, SLIDER.x1 - SLIDER.x0, 6, 3);
    ctx.fill();
    ctx.fillStyle = C.orange;
    rr(ctx, SLIDER.x0, y - 3, kx - SLIDER.x0, 6, 3);
    ctx.fill();
    U.sliderStops.forEach((s, i) => {
      const x = stopX(i);
      ctx.fillStyle = x <= kx ? '#fff' : '#CFC9C0';
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, TAU);
      ctx.fill();
      txt(ctx, String(s), x, y + 30, { size: 11.5, weight: 700, color: i === idx ? C.ink : C.ink2, align: 'center', font: F_NUM });
    });
    const held = t > M.drag - 0.05 && t < M.release + 0.1 ? press(t, M.drag, M.release - M.drag) : 0;
    ctx.save();
    ctx.translate(kx, y);
    ctx.scale(1 + 0.18 * held, 1 + 0.18 * held);
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, TAU);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  },
  toast(ctx, box, t) {
    const x0 = -box.w / 2 + 41;
    const k = appear(t, M.toast + 0.08, 380, 30);
    ctx.save();
    ctx.translate(x0, 0);
    ctx.scale(k, k);
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, TAU);
    ctx.fill();
    txt(ctx, 'B', 0, 8, { size: 22, weight: 800, color: '#fff', align: 'center', font: F_DISPLAY });
    ctx.restore();
    txt(ctx, U.toast, x0 + 38, -3, { size: 16.5, weight: 800, color: '#fff', font: F_DISPLAY });
    txt(ctx, U.toastSub, x0 + 38, 17, { size: 12, weight: 600, color: 'rgba(255,255,255,0.62)' });
    const kc = appear(t, M.toast + 0.18, 420, 30);
    if (kc > 0.01) icon.check(ctx, box.w / 2 - 44, -12, 24 * Math.min(1, kc), C.orange, 3.4);
  },
};

// glisser du curseur sur le curseur de réglage
function knobX(t) {
  const start = stopX(1);
  if (t < M.drag) return start;
  const cx = cursorAt(t).x - CX;
  const dragX = clamp(cx - 2, SLIDER.x0, SLIDER.x1);
  if (t < M.release) return lerp(start, dragX, clamp(seg(t, M.drag, M.drag + 0.04)));
  const rel = clamp(cursorAt(M.release).x - CX - 2, SLIDER.x0, SLIDER.x1);
  return lerp(rel, stopX(nearestStop(rel)), sp(t - M.release, 420, 34));
}
const nearestStop = (x) => {
  let best = 0;
  U.sliderStops.forEach((s, i) => Math.abs(stopX(i) - x) < Math.abs(stopX(best) - x) && (best = i));
  return best;
};
/** Instant du dernier changement de cran (pour le rebond de la valeur). */
function stopChange(t) {
  let last = -9, prev = nearestStop(knobX(M.drag));
  for (let tt = M.drag; tt <= t; tt += 1 / 120) {
    const n = nearestStop(knobX(tt));
    if (n !== prev) (last = tt), (prev = n);
  }
  return last;
}
/** Crans franchis pendant le glisser (pour les tics sonores). */
export function sliderDetents() {
  const out = [];
  let prev = nearestStop(knobX(M.drag));
  for (let tt = M.drag; tt <= M.release + 0.3; tt += 1 / 240) {
    const n = nearestStop(knobX(tt));
    if (n !== prev) out.push(tt), (prev = n);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Logo, nom, signature, bouton final (hors de la forme)

function drawEnd(ctx, t) {
  const k = clamp(sp(t - M.logo - 0.02, 300, 30), 0, 1.05);
  if (k > 0.001) {
    // le corps et la tête du parent sortent de la pastille (la tête de l'enfant)
    ctx.save();
    ctx.translate(CHILD.x, CHILD.y);
    ctx.scale(k, k);
    ctx.translate(-CHILD.x, -CHILD.y);
    ctx.globalAlpha *= clamp(k * 1.4);
    ctx.translate(LOGO_C[0], LOGO_C[1]);
    ctx.scale(LOGO_H, -LOGO_H);
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    LOGO.body.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(LOGO.head.c[0], LOGO.head.c[1], LOGO.head.r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  // nom : lettres qui montent une à une
  const word = 'kizzo';
  ctx.save();
  ctx.font = `800 76px ${F_DISPLAY}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '-2px';
  const total = ctx.measureText(word).width;
  let x = 195 - total / 2;
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const w = ctx.measureText(ch).width + (i < word.length - 1 ? -2 : 0);
    const kk = clamp(sp(t - M.word - i * 0.045, 340, 30), 0, 1.05);
    if (kk > 0.001) {
      ctx.save();
      ctx.globalAlpha *= clamp(kk * 1.5);
      ctx.translate(x + w / 2, 446 + (1 - kk) * 30);
      txt(ctx, ch, 0, 0, { size: 76, weight: 800, color: C.ink, align: 'center', font: F_DISPLAY, ls: -2 });
      ctx.restore();
    }
    x += w;
  }
  ctx.restore();
  // signature mot à mot
  const words = U.tagline.split(' ');
  ctx.save();
  ctx.font = `600 16px ${F_BODY}`;
  const sw = ctx.measureText(' ').width;
  const widths = words.map((w) => ctx.measureText(w).width);
  let tx = 195 - (widths.reduce((a, b) => a + b, 0) + sw * (words.length - 1)) / 2;
  words.forEach((w, i) => {
    const kk = ease.outCubic(seg(t, M.tagline + i * 0.05, M.tagline + 0.35 + i * 0.05));
    if (kk > 0.001) txt(ctx, w, tx, 482 + (1 - kk) * 10, { size: 16, weight: 600, color: i === words.length - 1 ? C.orange : C.ink2, alpha: kk });
    tx += widths[i] + sw;
  });
  ctx.restore();
  // bouton « Télécharger Kizzo »
  const kc = clamp(sp(t - M.cta, 320, 29), 0, 1.05);
  if (kc > 0.001) {
    const pr = press(t, M.tapCta);
    const s = (0.6 + 0.4 * kc) * (1 - 0.05 * pr);
    ctx.save();
    ctx.translate(195, CTA.y);
    ctx.scale(s, s);
    ctx.globalAlpha *= clamp(kc * 1.5);
    ctx.shadowColor = 'rgba(18,20,23,0.22)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = C.ink;
    rr(ctx, -CTA.w / 2, -CTA.h / 2, CTA.w, CTA.h, CTA.h / 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    // icône de téléchargement
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const ix = -CTA.w / 2 + 34;
    ctx.beginPath();
    ctx.moveTo(ix, -10);
    ctx.lineTo(ix, 5);
    ctx.moveTo(ix - 7, -2);
    ctx.lineTo(ix, 5);
    ctx.lineTo(ix + 7, -2);
    ctx.moveTo(ix - 9, 11);
    ctx.lineTo(ix + 9, 11);
    ctx.stroke();
    txt(ctx, U.cta, 14, 6.5, { size: 18.5, weight: 800, color: '#fff', align: 'center', font: F_DISPLAY });
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Composition

let layer = null;
function getLayer(canvas) {
  if (!layer || layer.canvas.width !== canvas.width || layer.canvas.height !== canvas.height) {
    const c = document.createElement('canvas');
    c.width = canvas.width;
    c.height = canvas.height;
    layer = { canvas: c, ctx: c.getContext('2d', { willReadFrequently: true }) };
  }
  return layer;
}

function shapeAt(t) {
  const s = {};
  for (const p of ['x', 'y', 'w', 'h', 'r']) s[p] = track(TRACKS[p], t, SPR[p]);
  s.fill = FILL.map((f) => clamp(track(f, t, [420, 40]), 0, 255));
  s.w = Math.max(0, s.w);
  s.h = Math.max(0, s.h);
  // le bouton « Jouer » s'enfonce sous le clic
  const pr = press(t, M.tapPlay);
  s.w *= 1 - 0.05 * pr;
  s.h *= 1 - 0.05 * pr;
  s.r = Math.min(s.r, s.w / 2, s.h / 2);
  return s;
}

/** Bruit de fond : grille de points discrète qui rend les mouvements de caméra lisibles. */
function drawGrid(ctx, cam, W, H) {
  const step = 26;
  const z = cam.zoom;
  ctx.fillStyle = '#D6D0C6';
  const wx0 = cam.cx - AX / z, wy0 = cam.cy - AY / z;
  const wx1 = cam.cx + (W - AX) / z, wy1 = cam.cy + (H - AY) / z;
  const r = 1.05 * Math.min(1.4, z);
  for (let gx = Math.floor(wx0 / step) * step; gx <= wx1; gx += step) {
    for (let gy = Math.floor(wy0 / step) * step; gy <= wy1; gy += step) {
      const sx = (gx - cam.cx) * z + AX, sy = (gy - cam.cy) * z + AY;
      ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
  }
}

function drawCursor(ctx, x, y, s, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha *= alpha;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 18.5);
  ctx.lineTo(4.6, 14.4);
  ctx.lineTo(7.7, 21.2);
  ctx.lineTo(10.9, 19.8);
  ctx.lineTo(7.8, 13.2);
  ctx.lineTo(13.6, 13.2);
  ctx.closePath();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.restore();
}

/**
 * Image du motion design à l'instant t.
 * @param {CanvasRenderingContext2D} ctx contexte déjà à l'échelle (unités logiques)
 */
export function drawMotion(ctx, W, H, t) {
  const S = ctx.getTransform().a; // px réels par unité logique
  // fond : nuit (au-dessus de la 3D qui s'éteint) puis gris chaud, révélé par la forme
  if (t < M.bleed + 0.25) {
    const a = clamp(seg(t, M.seed - 0.12, M.seed + 0.04));
    if (a > 0) {
      ctx.fillStyle = `rgba(5,8,15,${a})`;
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
  }
  const cam = camera2D(t);
  if (t >= M.bleed + 0.25) drawGrid(ctx, cam, W, H);

  const base = ctx.getTransform();
  ctx.save();
  ctx.translate(AX, AY);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.cx, -cam.cy);

  const s = shapeAt(t);
  if (s.w > 0.5 && s.h > 0.5) {
    const x = s.x - s.w / 2, y = s.y - s.h / 2;
    // ombre portée douce (pas de halo)
    const light = s.fill[0] > 200 && s.fill[1] > 200;
    ctx.save();
    if (t > M.play - 0.2 && s.w < 600) {
      ctx.shadowColor = light ? 'rgba(60,48,30,0.16)' : 'rgba(18,20,23,0.24)';
      ctx.shadowBlur = 34 * S * cam.zoom;
      ctx.shadowOffsetY = 14 * S * cam.zoom;
    }
    ctx.fillStyle = rgb(s.fill);
    rr(ctx, x, y, s.w, s.h, s.r);
    ctx.fill();
    ctx.restore();

    // contenus : l'ancien s'efface en se floutant, le nouveau se précise
    ctx.save();
    rr(ctx, x, y, s.w, s.h, s.r);
    ctx.clip();
    for (let i = 0; i < CONTENTS.length; i++) {
      const c = CONTENTS[i];
      if (!c.id || c.id === 'logo' || t < c.at) continue;
      const next = CONTENTS[i + 1];
      const out = next && t >= next.at ? seg(t, next.at, next.at + 0.1) : 0;
      if (out >= 1) continue;
      const inn = ease.outCubic(seg(t, c.at + 0.05, c.at + 0.25));
      const alpha = inn * (1 - out);
      const blur = (1 - inn) * 7 + out * 6;
      const sc = 1 + (1 - inn) * 0.04 - out * 0.03;
      if (alpha <= 0.002) continue;
      const draw = (g) => {
        g.save();
        g.translate(s.x, s.y);
        g.scale(sc, sc);
        CONTENT[c.id](g, s, t);
        g.restore();
      };
      if (blur < 0.35) {
        ctx.save();
        ctx.globalAlpha *= alpha;
        draw(ctx);
        ctx.restore();
      } else {
        // calque flouté limité à la forme
        const L = getLayer(ctx.canvas);
        const m = ctx.getTransform();
        const bx = Math.max(0, Math.floor(m.a * x + m.e - 20)), by = Math.max(0, Math.floor(m.d * y + m.f - 20));
        const bw = Math.min(L.canvas.width - bx, Math.ceil(m.a * s.w + 40)), bh = Math.min(L.canvas.height - by, Math.ceil(m.d * s.h + 40));
        if (bw <= 0 || bh <= 0) continue;
        L.ctx.setTransform(1, 0, 0, 1, 0, 0);
        L.ctx.clearRect(bx, by, bw, bh);
        L.ctx.setTransform(m);
        draw(L.ctx);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = alpha;
        ctx.filter = `blur(${(blur * m.a * 0.5).toFixed(1)}px)`;
        ctx.drawImage(L.canvas, bx, by, bw, bh, bx, by, bw, bh);
        ctx.restore();
      }
    }
    ctx.restore();
  }
  if (t >= M.logo - 0.05) drawEnd(ctx, t);

  // ondes de clic (fines, discrètes)
  for (const at of CLICKS) {
    const k = seg(t, at, at + 0.4);
    if (k <= 0 || k >= 1) continue;
    const p = cursorAt(at);
    ctx.strokeStyle = `rgba(18,20,23,${(0.32 * (1 - k)).toFixed(3)})`;
    ctx.lineWidth = 1.6 / cam.zoom;
    ctx.beginPath();
    ctx.arc(p.x, p.y, (6 + 22 * ease.outCubic(k)) / cam.zoom, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();

  // curseur (taille constante à l'écran)
  if (t > M.play - 0.1) {
    const p = cursorAt(t);
    const sx = (p.x - cam.cx) * cam.zoom + AX, sy = (p.y - cam.cy) * cam.zoom + AY;
    let pr = 0;
    for (const at of CLICKS) pr = Math.max(pr, press(t, at, at === M.drag ? M.release - M.drag : 0));
    const fade = 1 - seg(t, M.tapCta + 0.5, M.tapCta + 0.9);
    ctx.setTransform(base);
    drawCursor(ctx, sx, sy, 1.25 * (1 - 0.14 * pr), fade);
  }
  ctx.setTransform(base);
}

/** Évènements visuels (pour la bande-son). */
export const EVENTS = { CLICKS, contents: CONTENTS };
