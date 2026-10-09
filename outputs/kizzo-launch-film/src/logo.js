// Final reveal built from the exact supplied logo: three pixel-aligned layers
// extracted from the source file (blue figure, orange dot, white wordmark).
// Nothing is redrawn — the layers stack back into the original lockup.
import { T, clamp, lerp, E, EASE, prog, rng } from './timeline.js';

export const LOGO = {
  crop: { w: 682, h: 862 },
  // orange disc bounds inside the crop (from logo-meta.json)
  orange: { x0: 287, y0: 169, x1: 418, y1: 293 },
  scale: 0.6,
};
LOGO.w = LOGO.crop.w * LOGO.scale;
LOGO.h = LOGO.crop.h * LOGO.scale;
LOGO.left = 960 - LOGO.w / 2;
LOGO.top = 238;
LOGO.dot = {
  x: LOGO.left + ((LOGO.orange.x0 + LOGO.orange.x1) / 2) * LOGO.scale,
  y: LOGO.top + ((LOGO.orange.y0 + LOGO.orange.y1) / 2) * LOGO.scale,
  r: ((LOGO.orange.x1 - LOGO.orange.x0) / 2) * LOGO.scale,
};

const el = (tag, cls, parent) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  parent.appendChild(e);
  return e;
};

export function buildLogo(stage, src) {
  const wrap = el('div', 'logo-wrap', stage);
  Object.assign(wrap.style, { left: `${LOGO.left}px`, top: `${LOGO.top}px`, width: `${LOGO.w}px`, height: `${LOGO.h}px` });
  const aura = el('div', 'logo-aura', wrap);
  const reflect = el('div', 'logo-reflect', wrap);
  const stack = el('div', 'logo-stack', wrap);
  const img = (cls, url, parent) => {
    const i = el('img', `lg ${cls}`, parent);
    i.src = url;
    i.alt = '';
    i.draggable = false;
    return i;
  };
  const blue = img('lg-blue', src.blue, stack);
  const orange = img('lg-orange', src.orange, stack);
  const word = img('lg-word', src.word, stack);
  const sweep = el('div', 'lg-sweep', stack);
  sweep.style.webkitMaskImage = sweep.style.maskImage = `url(${src.full})`;
  img('', src.full, reflect);
  const url = el('div', 'logo-url', stage);
  url.textContent = 'kizzo.fr';
  stack.setAttribute('role', 'img');
  stack.setAttribute('aria-label', 'Kizzo');
  return { wrap, aura, reflect, stack, blue, orange, word, sweep, url, images: { blue, orange, word } };
}

export function updateLogo(lg, t) {
  const on = t > T.logoSolid - 0.3;
  lg.wrap.style.visibility = on ? 'visible' : 'hidden';
  lg.url.style.visibility = on ? 'visible' : 'hidden';
  if (!on) return;
  const a = prog(t, T.logoSolid - 0.2, 0.45, E.inOutSine);
  const settle = EASE.cine(clamp((t - (T.logoSolid - 0.2)) / 1.4));
  lg.blue.style.opacity = a;
  lg.word.style.opacity = a;
  lg.orange.style.opacity = prog(t, T.orbLand, 0.08);
  lg.stack.style.transform = `scale(${lerp(1.04, 1, settle)})`;
  // the dot lands with a tiny give
  const land = t - T.orbLand;
  const squash = land > 0 ? 1 + 0.06 * Math.exp(-land * 7) * Math.sin(land * 30) : 1;
  lg.orange.style.transform = `scale(${squash})`;
  const sw = prog(t, T.sweep[0], T.sweep[1] - T.sweep[0], E.inOutCubic);
  lg.sweep.style.backgroundPosition = `${lerp(108, -8, sw)}% 0`;
  lg.sweep.style.opacity = Math.sin(Math.PI * sw) * 0.95;
  lg.aura.style.opacity = a * (0.75 + 0.25 * Math.sin(Math.PI * sw));
  lg.reflect.style.opacity = a * 0.11;
  const u = EASE.cine(clamp((t - T.url) / 0.9));
  lg.url.style.opacity = u;
  lg.url.style.transform = `translate3d(-50%, ${(1 - u) * 14}px, 0)`;
  lg.url.style.letterSpacing = `${lerp(0.6, 0.36, u)}em`;
}

// Sample N points from an image's alpha (stage coordinates of the final logo).
export function sampleImage(image, n, seed, transform) {
  const c = document.createElement('canvas');
  c.width = image.naturalWidth;
  c.height = image.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const pool = [];
  for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) if (d[(y * c.width + x) * 4 + 3] > 140) pool.push(x, y);
  const r = rng(seed);
  const out = new Float32Array(n * 2);
  const count = pool.length / 2;
  for (let i = 0; i < n; i++) {
    const j = Math.floor(r() * count);
    const [sx, sy] = transform(pool[j * 2] + r() * 2, pool[j * 2 + 1] + r() * 2);
    out[i * 2] = sx;
    out[i * 2 + 1] = sy;
  }
  return out;
}

export const logoToStage = (x, y) => [LOGO.left + x * LOGO.scale, LOGO.top + y * LOGO.scale];
