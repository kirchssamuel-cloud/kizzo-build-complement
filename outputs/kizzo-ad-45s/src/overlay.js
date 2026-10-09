// DOM layer: French on-screen copy on frosted plates, the logo moments and
// the closing card with the call to action. Text stays real text (sharp at
// any size, exact accents and French spacing).
import { T } from './cues.js';
import { clamp, lerp, E, EASE, spring, prog } from './timeline.js';

const NNBSP = ' '; // espace fine insécable avant « ? »

// [text, accent word, accent colour (o = orange, c = cyan)] per line.
export const COPY = {
  t1: { lines: [['Encore une dispute', 'dispute', 'o'], [`pour la tablette${NNBSP}?`]], top: 300 },
  t2: { lines: [['Et si le temps d’écran'], ['aidait aussi'], [`à apprendre${NNBSP}?`, 'apprendre', 'c']], top: 300, stagger: 0.55 },
  t3: { lines: [['Une photo de la leçon.', 'photo', 'o']], top: 300 },
  t4: { lines: [['La leçon devient'], ['un quiz.', 'quiz', 'c']], top: 300 },
  t4b: { lines: [['Réviser, régulièrement.']], top: 250, small: true },
  t5: { lines: [['Un rythme adapté', 'rythme', 'c'], ['à votre famille.']], top: 300 },
  t6: { lines: [['Moins de conflits.'], ['Plus de sens.', 'sens', 'o']], top: 240, stagger: 0.7 },
};

const el = (tag, cls, parent, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
};

function buildPlate(layer, key, spec) {
  const plate = el('div', `plate${spec.small ? ' small' : ''}`, layer);
  plate.style.top = `${spec.top}px`;
  const lines = spec.lines.map(([text, accent, tone]) => {
    const line = el('div', 'pl-line', plate);
    const words = text.split(' ').map((w, wi, arr) => {
      const span = el('span', 'w', line, w);
      if (accent && w.replace(/[.,? ]/g, '').startsWith(accent)) span.classList.add(tone === 'c' ? 'acc-cyan' : 'acc-orange');
      if (wi < arr.length - 1) line.appendChild(document.createTextNode(' '));
      return span;
    });
    return { line, words };
  });
  return { plate, lines, spec, key };
}

export function buildOverlay(stage, logo) {
  const layer = el('div', 'overlay', stage);
  const plates = {};
  for (const [k, spec] of Object.entries(COPY)) plates[k] = buildPlate(layer, k, spec);

  // logo moment in the discovery sequence (exact logo on its navy ground)
  const flyCard = el('div', 'logo-card fly', layer);
  const flyStack = el('div', 'logo-stack', flyCard);
  for (const src of [logo.blue, logo.orange, logo.word]) {
    const i = el('img', 'lg', flyStack);
    i.src = src;
    i.alt = '';
  }
  // orange dot that settles into the closing arc (the child in the logo)
  const dot = el('div', 'outro-dot', layer);
  // closing card
  const end = el('div', 'endcard', layer);
  const endCard = el('div', 'logo-card end', end);
  const endStack = el('div', 'logo-stack', endCard);
  const endImgs = [logo.blue, logo.orange, logo.word].map((src) => {
    const i = el('img', 'lg', endStack);
    i.src = src;
    i.alt = '';
    return i;
  });
  endStack.setAttribute('role', 'img');
  endStack.setAttribute('aria-label', 'Kizzo');
  const tagline = el('div', 'tagline', end);
  const tl1 = el('div', 'tl', tagline, 'Le temps d’écran');
  const tl2 = el('div', 'tl', tagline, 'qui fait grandir.');
  const cta = el('div', 'cta', end);
  el('span', 'cta-label', cta, 'Découvrez Kizzo');
  const shine = el('span', 'cta-shine', cta);
  return { layer, plates, flyCard, dot, end, endCard, endImgs, tl1, tl2, cta, shine };
}

const set = (e, transform, opacity, filter) => {
  e.style.transform = transform;
  e.style.opacity = opacity;
  if (filter !== undefined) e.style.filter = filter;
};

function playPlate(p, t, a, b) {
  const on = t > a - 0.05 && t < b + 0.5;
  p.plate.style.visibility = on ? 'visible' : 'hidden';
  if (!on) return;
  const inK = EASE.cine(clamp((t - a) / 0.55));
  const outK = EASE.accel(clamp((t - b) / 0.4));
  set(p.plate, `translate3d(-50%, ${(1 - inK) * 26 - outK * 30}px, 0) scale(${lerp(0.94, 1, inK)})`, inK * (1 - outK), outK > 0.01 ? `blur(${(outK * 8).toFixed(1)}px)` : 'none');
  const stagger = p.spec.stagger ?? 0.42;
  p.lines.forEach((ln, li) => {
    ln.words.forEach((w, wi) => {
      const st = a + 0.1 + li * stagger + wi * 0.075;
      const k = EASE.cine(clamp((t - st) / 0.5));
      set(w, `translate3d(0, ${(1 - k) * 0.42}em, 0)`, clamp(k * 1.4), k < 0.98 ? `blur(${((1 - k) * 6).toFixed(1)}px)` : 'none');
    });
  });
}

// ctx: { phoneScreen: {x,y,s} } projected phone screen centre for the fly-in
export function updateOverlay(o, t, ctx) {
  playPlate(o.plates.t1, t, T.t1[0], T.t1[1]);
  playPlate(o.plates.t2, t, T.t2[0], T.t2[1]);
  playPlate(o.plates.t3, t, T.t3[0], T.t3[1]);
  playPlate(o.plates.t4, t, T.t4[0], T.t4[1]);
  playPlate(o.plates.t4b, t, T.t4b[0], T.t4b[1]);
  playPlate(o.plates.t5, t, T.t5[0], T.t5[1]);
  playPlate(o.plates.t6, t, T.t6[0], T.t6[1]);

  // logo card: pops in, then dives into the phone, which lights up
  const [l0, l1] = T.logo;
  const fly = t > l0 - 0.05 && t < l1 + 0.1;
  o.flyCard.style.visibility = fly ? 'visible' : 'hidden';
  if (fly) {
    const pop = spring(t - l0, 2.0, 0.55);
    const dive = EASE.whip(clamp((t - (l1 - 0.6)) / 0.6));
    const sx = ctx.phoneScreen ? ctx.phoneScreen.x : 540, sy = ctx.phoneScreen ? ctx.phoneScreen.y : 1100;
    const x = lerp(540, sx, dive), y = lerp(900, sy, dive);
    const s = pop * lerp(1, 0.32, dive);
    o.flyCard.style.left = `${x}px`;
    o.flyCard.style.top = `${y}px`;
    set(o.flyCard, `translate(-50%, -50%) scale(${s})`, clamp(pop * 2) * (1 - clamp((dive - 0.7) / 0.3)));
  }

  // closing card
  const endOn = t > T.logoEnd - 0.1;
  o.end.style.visibility = endOn ? 'visible' : 'hidden';
  if (endOn) {
    const k = spring(t - T.logoEnd, 1.8, 0.62);
    set(o.endCard, `scale(${lerp(0.82, 1, k)})`, clamp((t - T.logoEnd) / 0.25));
    const a = EASE.cine(clamp((t - T.tagline) / 0.6));
    const b = EASE.cine(clamp((t - T.tagline - 0.18) / 0.6));
    set(o.tl1, `translate3d(0, ${(1 - a) * 22}px, 0)`, a);
    set(o.tl2, `translate3d(0, ${(1 - b) * 22}px, 0)`, b);
    const c = spring(t - T.cta, 2.2, 0.5);
    const breathe = t > T.cta + 1 ? 1 + 0.015 * Math.sin((t - T.cta - 1) * 3.2) : 1;
    set(o.cta, `scale(${lerp(0.7, 1, c) * breathe})`, clamp((t - T.cta) / 0.2));
    const sh = clamp((t - T.cta - 0.9) / 0.7);
    o.shine.style.transform = `translateX(${lerp(-140, 680, E.inOutCubic(sh))}px) skewX(-18deg)`;
    o.shine.style.opacity = sh > 0 && sh < 1 ? 1 : 0;
  }
}
