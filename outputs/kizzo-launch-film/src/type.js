// Kinetic typography (DOM, so it stays razor sharp). Every full stop is the
// orange dot from the logo — the same dot that opens and closes the film.
import { T, clamp, lerp, E, EASE, spring, prog } from './timeline.js';
import { CARD_BEAT } from './ui.js';

const el = (tag, cls, parent, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
};

function line(parent, text, cls = '', dot = true) {
  const ln = el('div', `line ${cls}`, parent);
  const inner = el('span', 'inner', ln);
  const chars = [];
  for (const ch of text) {
    if (ch === ' ') chars.push(el('span', 'sp', inner));
    else chars.push(el('span', 'ch', inner, ch));
  }
  const d = dot ? el('span', 'dot', inner) : null;
  return { ln, inner, chars: chars.filter((c) => c.className === 'ch'), all: chars, dot: d };
}

const BLUE = [43, 187, 237];
const ORANGE = [255, 122, 27];
const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const mixc = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));

export function buildType(stage) {
  const layer = el('div', 'type-layer', stage);

  const screen = el('div', 'phrase ph-screen', layer);
  const s1 = line(screen, 'SCREEN TIME');
  const s2 = line(screen, 'REIMAGINED', 'blue');

  const parent = el('div', 'phrase ph-parent', layer);
  const pEyebrow = el('div', 'eyebrow', parent);
  el('span', 'pip', pEyebrow);
  el('span', '', pEyebrow, 'For parents');
  const p1 = line(parent, 'Set the limit');
  const p2 = line(parent, 'See the learning', 'soft');

  const learn = el('div', 'phrase ph-learn', layer);
  const lEyebrow = el('div', 'eyebrow', learn);
  el('span', 'pip', lEyebrow);
  el('span', '', lEyebrow, 'For kids');
  const words = ['LEARN', 'ANSWER', 'UNLOCK'].map((w) => line(learn, w));

  const meet = el('div', 'phrase ph-meet', layer);
  const m1 = line(meet, 'MEET KIZZO');

  return { layer, screen, s1, s2, parent, pEyebrow, p1, p2, learn, lEyebrow, words, meet, m1 };
}

// Stage-space centre of an element (layout coordinates, ignores transforms).
export function stageBox(e, stage) {
  let x = 0, y = 0, n = e;
  while (n && n !== stage) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent;
  }
  return { x, y, w: e.offsetWidth, h: e.offsetHeight, cx: x + e.offsetWidth / 2, cy: y + e.offsetHeight / 2 };
}

const set = (e, transform, opacity, filter) => {
  e.style.transform = transform;
  e.style.opacity = opacity;
  if (filter !== undefined) e.style.filter = filter;
};

function rise(chars, t, start, stagger, dur, ease = EASE.cine) {
  chars.forEach((c, i) => {
    const k = ease(clamp((t - start - i * stagger) / dur));
    set(c, `translate3d(0, ${(1 - k) * 112}%, 0) rotate(${(1 - k) * 7}deg)`, k > 0 ? 1 : 0);
  });
}

function popDot(d, t, at, scaleTo = 1) {
  const k = spring(t - at, 2.6, 0.38);
  set(d, `scale(${k * scaleTo})`, t >= at ? 1 : 0);
}

export function updateType(ty, t, ctx) {
  // ── SCREEN TIME. REIMAGINED. ────────────────────────────────────────────
  const showScreen = t > T.screenLine - 0.1 && t < T.rush[1] + 0.05;
  ty.screen.style.visibility = showScreen ? 'visible' : 'hidden';
  if (showScreen) {
    rise(ty.s1.chars, t, T.screenLine, 0.034, 0.8);
    // the travelling orb becomes this full stop
    const landed = t >= T.orbToDot[1];
    set(ty.s1.dot, `scale(${landed ? 1 : 0})`, landed ? 1 : 0);
    ty.s2.chars.forEach((c, i) => {
      const k = EASE.cine(clamp((t - T.reimagined - i * 0.042) / 0.62));
      const blur = (1 - k) * 16;
      set(
        c,
        `translate3d(${(1 - k) * -26}px, 0, 0) scale(${lerp(1.28, 1, k)})`,
        clamp(k * 1.8),
        blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : 'none'
      );
      c.style.color = rgb(mixc([255, 255, 255], BLUE, clamp(k * 1.25 - 0.1)));
    });
    popDot(ty.s2.dot, t, T.reimagined + 0.58);
    // slow push during the hold, then the rush through camera
    const hold = prog(t, T.reimagined + 0.5, 1.0, E.inOutSine) * 0.03;
    const r = prog(t, T.rush[0], T.rush[1] - T.rush[0], EASE.accel);
    const sc = 1 + hold + r * 1.9;
    ty.screen.style.transform = `scale(${sc})`;
    ty.screen.style.opacity = 1 - prog(t, T.rush[0] + 0.12, 0.3, E.inQuad);
    ty.screen.style.filter = r > 0.01 ? `blur(${(r * 22).toFixed(2)}px)` : 'none';
    ty.screen.style.letterSpacing = `${r * 0.12}em`;
  }

  // ── For parents ──────────────────────────────────────────────────────────
  const pIn = 4.32, pOut = 6.34;
  const showParent = t > pIn - 0.05 && t < pOut + 0.4;
  ty.parent.style.visibility = showParent ? 'visible' : 'hidden';
  if (showParent) {
    const ek = EASE.cine(clamp((t - pIn) / 0.7));
    set(ty.pEyebrow, `translate3d(${(1 - ek) * -18}px,0,0)`, ek);
    rise(ty.p1.chars, t, pIn + 0.12, 0.018, 0.7);
    popDot(ty.p1.dot, t, pIn + 0.5);
    rise(ty.p2.chars, t, pIn + 0.3, 0.016, 0.7);
    popDot(ty.p2.dot, t, pIn + 0.72);
    const out = prog(t, pOut, 0.32, EASE.accel);
    ty.parent.style.opacity = 1 - out;
    ty.parent.style.transform = `translate3d(0, ${-out * 26}px, 0)`;
    ty.parent.style.filter = out > 0.01 ? `blur(${out * 10}px)` : 'none';
  }

  // ── LEARN. ANSWER. UNLOCK. ───────────────────────────────────────────────
  const lOut = T.exit[0] - 0.1;
  const showLearn = t > T.cards[0] - 0.25 && t < lOut + 0.6;
  ty.learn.style.visibility = showLearn ? 'visible' : 'hidden';
  if (showLearn) {
    const ek = EASE.cine(clamp((t - (T.cards[0] - 0.2)) / 0.7));
    set(ty.lEyebrow, `translate3d(${(1 - ek) * -18}px,0,0)`, ek);
    const rewardK = prog(t, T.reward, 0.5, EASE.cine);
    ty.words.forEach((w, i) => {
      const start = T.cards[i] + 0.02;
      rise(w.chars, t, start, 0.03, 0.62);
      popDot(w.dot, t, T.cards[i] + CARD_BEAT.snap, 1);
      // the active word leads; earlier words step back until the reward
      const next = T.cards[i + 1];
      let a = 1;
      if (next !== undefined) a = lerp(1, 0.3, prog(t, next, 0.3, E.outCubic));
      a = lerp(a, 1, rewardK);
      w.inner.style.opacity = a;
      if (i === 2) {
        const glow = rewardK;
        w.inner.style.color = rgb(mixc([255, 255, 255], ORANGE, glow));
        w.inner.style.textShadow = glow > 0 ? `0 0 ${40 * glow}px rgba(255,122,27,${0.55 * glow})` : 'none';
      }
    });
    const out = prog(t, lOut, 0.45, EASE.accel);
    ty.learn.style.opacity = 1 - out;
    ty.learn.style.transform = `translate3d(${-out * 40}px, 0, 0)`;
    ty.learn.style.filter = out > 0.01 ? `blur(${out * 14}px)` : 'none';
  }

  // ── MEET KIZZO. ──────────────────────────────────────────────────────────
  const showMeet = t > T.meet - 0.05 && t < T.dissolve + 0.6;
  ty.meet.style.visibility = showMeet ? 'visible' : 'hidden';
  if (showMeet) {
    const n = ty.m1.chars.length;
    ty.m1.chars.forEach((c, i) => {
      const isK = i >= 4;
      const j = isK ? i - 4 : i;
      const start = T.meet + (isK ? 0.2 + j * 0.05 : j * 0.05);
      const k = EASE.cine(clamp((t - start) / 0.7));
      const spread = isK ? (j - 2) * 34 * (1 - k) : 0;
      const blur = (1 - k) * 12;
      // dissolve: each glyph hands over to its particles as the wave passes
      const dk = ctx.letterHandOff ? ctx.letterHandOff(i, t) : 0;
      set(
        c,
        `translate3d(${spread}px, ${isK ? 0 : (1 - k) * 24}px, 0)`,
        clamp(k * 1.6) * (1 - dk),
        blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : 'none'
      );
    });
    const dotAt = T.meet + 0.62;
    const k = spring(t - dotAt, 2.6, 0.38);
    const gone = t >= T.dissolve;
    set(ty.m1.dot, `scale(${k})`, t >= dotAt && !gone ? 1 : 0);
  }
}
