/* ==========================================================================
   KIZZO — Brand film engine
   Deterministic: KZ.renderFrame(t) paints the exact frame at time t (seconds).
   Camera, particles, type and light are pure functions of t, so the browser
   player and the offline MP4 renderer produce the same film.
   ========================================================================== */
(function () {
'use strict';

const W = 1920, H = 1080, CX = W / 2, CY = H / 2, TAU = Math.PI * 2, PI = Math.PI;
const Q = window.KZ_CUES, LOGO = window.KZ_LOGO, STRINGS = window.KZ_STRINGS;
let S = STRINGS.en;

/* ---------- palette (sampled from the supplied logo) ---------- */
const NAVY = [7, 27, 57], DEEP = [2, 7, 17], BLUE = [43, 187, 237], ORANGE = [255, 122, 27],
  WHITE = [255, 255, 255], BLUE_HI = [158, 226, 252], ORANGE_HI = [255, 190, 135],
  ICE = [214, 234, 250], STEEL = [141, 162, 191], WARM = [255, 214, 186], TUBE = [12, 44, 88];

const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a < 0 ? 0 : a > 1 ? 1 : +a.toFixed(4)})`;
const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ---------- maths ---------- */
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const E = {
  inQ: t => t * t, outQ: t => 1 - (1 - t) * (1 - t),
  inC: t => t * t * t, outC: t => 1 - Math.pow(1 - t, 3),
  ioC: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outQuint: t => 1 - Math.pow(1 - t, 5),
  ioQuint: t => t < .5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2,
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inExpo: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  ioExpo: t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  ioS: t => -(Math.cos(PI * t) - 1) / 2,
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outElastic: t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (TAU / 3)) + 1,
};
const pr = (a, b, t, e = E.ioC) => e(inv(a, b, t));
const bell = (x, c, w) => Math.exp(-((x - c) / w) * ((x - c) / w));
const decay = (t, t0, d) => (t < t0 || t > t0 + d) ? 0 : Math.pow(1 - (t - t0) / d, 2);
const frac = x => x - Math.floor(x);

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = n => frac(Math.sin(n * 127.1 + 311.7) * 43758.5453);
function noise(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }

/* ---------- canvases ---------- */
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const view = document.getElementById('kz-canvas'); view.width = W; view.height = H;
const vc = view.getContext('2d');
const scene = mk(W, H), sc = scene.getContext('2d');
const comp = mk(W, H), cc = comp.getContext('2d');
const tmp = mk(W, H), tc = tmp.getContext('2d');
const refl = mk(W, H), rc = refl.getContext('2d');
const b1 = mk(480, 270), b1c = b1.getContext('2d');
const b2 = mk(240, 135), b2c = b2.getContext('2d');

/* ---------- light sprites ---------- */
function glowSprite(col, size = 256) {
  const c = mk(size, size), g = c.getContext('2d'), r = size / 2;
  const gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, rgba(mix(col, WHITE, .45), 1)); gr.addColorStop(.1, rgba(col, .8));
  gr.addColorStop(.3, rgba(col, .26)); gr.addColorStop(.6, rgba(col, .07)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, size, size); return c;
}
function discSprite(size = 128) {
  const c = mk(size, size), g = c.getContext('2d'), r = size / 2;
  const gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, size, size); return c;
}
const SP = { o: glowSprite(ORANGE), oh: glowSprite(ORANGE_HI), b: glowSprite(BLUE), bh: glowSprite(BLUE_HI), w: glowSprite(ICE), disc: discSprite() };
function glow(c, sp, x, y, r, a) {
  if (a <= .003 || r <= .4) return;
  c.globalAlpha = a > 1 ? 1 : a; c.drawImage(sp, x - r, y - r, r * 2, r * 2);
}
function glowE(c, sp, x, y, rx, ry, a) { if (a <= .003) return; c.globalAlpha = a > 1 ? 1 : a; c.drawImage(sp, x - rx, y - ry, rx * 2, ry * 2); }

/* ---------- 3D camera (world y points down, 1 unit = 1px at z = 0) ---------- */
const cam = { px: 0, py: 0, pz: -1000, f: 1000, fw: [0, 0, 1], r: [1, 0, 0], d: [0, 1, 0], cr: 1, sr: 0, ox: 0, oy: 0, mirrorY: null };
function setCam(px, py, pz, tx, ty, tz, f = 1000, roll = 0) {
  cam.px = px; cam.py = py; cam.pz = pz; cam.f = f;
  let fx = tx - px, fy = ty - py, fz = tz - pz; const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
  let rx = fz, rz = -fx; const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
  cam.fw = [fx, fy, fz]; cam.r = [rx, 0, rz]; cam.d = [fy * rz, fz * rx - fx * rz, -fy * rx];
  cam.cr = Math.cos(roll); cam.sr = Math.sin(roll);
}
function camArr(a) { setCam(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7]); }
const frontal = [0, 0, -1000, 0, 0, 0, 1000, 0];
function proj(x, y, z, o) {
  if (cam.mirrorY !== null) y = 2 * cam.mirrorY - y;
  const dx = x - cam.px, dy = y - cam.py, dz = z - cam.pz;
  const cz = dx * cam.fw[0] + dy * cam.fw[1] + dz * cam.fw[2];
  if (cz < 25) return null;
  const s = cam.f / cz;
  let sx = (dx * cam.r[0] + dz * cam.r[2]) * s, sy = (dx * cam.d[0] + dy * cam.d[1] + dz * cam.d[2]) * s;
  if (cam.sr !== 0) { const q = sx * cam.cr - sy * cam.sr; sy = sx * cam.sr + sy * cam.cr; sx = q; }
  o = o || {}; o.x = CX + sx + cam.ox; o.y = CY + sy + cam.oy; o.s = s; o.z = cz; return o;
}

/* ---------- type ---------- */
const mctx = mk(8, 8).getContext('2d');
const LC = new Map();
function lay(str, wt, px, tr = 0) {
  const key = str + '|' + wt + '|' + px + '|' + tr;
  let L = LC.get(key); if (L) return L;
  mctx.font = `${wt} ${px}px Outfit`;
  const chars = [], n = str.length, trk = tr * px;
  for (let i = 0; i < n; i++) chars.push({ ch: str[i], x: mctx.measureText(str.slice(0, i)).width + i * trk, w: mctx.measureText(str[i]).width });
  L = { str, wt, px, tr, chars, width: mctx.measureText(str).width + (n - 1) * trk };
  LC.set(key, L); return L;
}
function fit(str, wt, px, tr, maxW) { const L = lay(str, wt, px, tr); return L.width > maxW ? Math.floor(px * maxW / L.width) : px; }
// letters(): per-letter kinetic type. fn(i, ch, lx) returns {a, dx, dy, sc, rot, blur, col} or null.
function letters(c, L, cx, by, fn, skipLast) {
  c.font = `${L.wt} ${L.px}px Outfit`; c.textBaseline = 'alphabetic'; c.textAlign = 'center';
  const x0 = cx - L.width / 2, n = L.chars.length - (skipLast ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const ch = L.chars[i]; if (ch.ch === ' ') continue;
    const lx = x0 + ch.x + ch.w / 2, st = fn(i, ch, lx);
    if (!st || st.a <= .003) continue;
    const x = lx + (st.dx || 0), y = by + (st.dy || 0);
    c.globalAlpha = st.a > 1 ? 1 : st.a; c.fillStyle = st.col || '#fff';
    const blur = st.blur || 0;
    if (blur > .35) c.filter = `blur(${blur.toFixed(1)}px)`;
    const s = st.sc === undefined ? 1 : st.sc, r = st.rot || 0;
    if (s !== 1 || r !== 0) {
      const cs = Math.cos(r) * s, sn = Math.sin(r) * s, oy = -L.px * .36;
      c.setTransform(cs, sn, -sn, cs, x, y + oy); c.fillText(ch.ch, 0, -oy); c.setTransform(1, 0, 0, 1, 0, 0);
    } else c.fillText(ch.ch, x, y);
    if (blur > .35) c.filter = 'none';
  }
  c.globalAlpha = 1;
}
const lastCharX = (L, cx) => cx - L.width / 2 + L.chars[L.chars.length - 1].x + L.chars[L.chars.length - 1].w / 2;

/* ---------- shapes: the "content" vocabulary of the screen world ---------- */
function heart(c) { c.moveTo(0, 32); c.bezierCurveTo(-58, -4, -36, -50, 0, -22); c.bezierCurveTo(36, -50, 58, -4, 0, 32); c.closePath(); }
function shape(c, type, x, y, px, rot, col, a, fa) {
  if (a <= .004 || px < .9) return;
  const k = px / 100, cr = Math.cos(rot) * k, sr = Math.sin(rot) * k;
  c.setTransform(cr, sr, -sr, cr, x, y);
  c.lineWidth = clamp(px * .022, 1, 3.4) / k;
  c.fillStyle = rgba(col, fa * a); c.strokeStyle = rgba(col, a);
  c.beginPath();
  switch (type) {
    case 0: c.roundRect(-50, -31, 100, 62, 11); c.fill(); c.stroke();
      if (px > 14) { c.fillStyle = rgba(col, a * .55); c.fillRect(-38, 11, 46, 6); c.fillRect(-38, 21, 26, 5); } break;
    case 1: c.roundRect(-62, -18, 124, 36, 18); c.fill(); c.stroke();
      c.beginPath(); c.arc(-43, 0, 8, 0, TAU); c.fillStyle = rgba(WHITE, a); c.fill();
      if (px > 14) { c.fillStyle = rgba(col, a * .6); c.fillRect(-27, -4, 62, 8); } break;
    case 2: c.arc(0, 0, 22, 0, TAU); c.fillStyle = rgba(col, a * .85); c.fill(); break;
    case 3: c.roundRect(-34, -50, 68, 100, 12); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-9, -14); c.lineTo(16, 0); c.lineTo(-9, 14); c.closePath(); c.fillStyle = rgba(WHITE, a * .9); c.fill(); break;
    case 4: heart(c); c.fillStyle = rgba(col, a * .8); c.fill(); break;
    case 5: c.arc(0, 0, 30, 0, TAU); c.stroke(); break;
    case 6: c.roundRect(-50, -50, 100, 100, 20); c.fill(); c.stroke(); break;
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
}

/* ---------- spheres: the child (orange) and the parent (blue) ---------- */
function sphere(c, x, y, r, col, o = {}) {
  const e = o.energy === undefined ? 1 : o.energy, flat = o.flat || 0, isO = col === ORANGE;
  const halo = o.halo === undefined ? 1 : o.halo;
  if (o.sep) { // dark separation so the child reads on a bright field
    const g = c.createRadialGradient(x, y, r, x, y, r * 3.2); g.addColorStop(0, rgba(DEEP, .55 * o.sep)); g.addColorStop(1, rgba(DEEP, 0));
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3.2, 0, TAU); c.fill();
  }
  c.globalCompositeOperation = 'lighter';
  glow(c, isO ? SP.o : SP.b, x, y, r * (6 + 4 * e), .3 * e * halo);
  glow(c, isO ? SP.oh : SP.bh, x, y, r * 2.4, .42 * e * halo);
  if (o.flare) {
    glowE(c, SP.bh, x, y, r * 30 * o.flare, r * .5, .28 * o.flare * e);
    glowE(c, SP.w, x, y, r * 12 * o.flare, r * .22, .45 * o.flare * e);
  }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
  c.setTransform(1, 0, 0, 1, x, y);
  if (o.ang) c.rotate(o.ang);
  if (o.sx) c.scale(o.sx, o.sy);
  c.beginPath(); c.arc(0, 0, r, 0, TAU);
  if (flat >= 1) c.fillStyle = rgb(col);
  else {
    const g = c.createRadialGradient(-r * .38, -r * .42, r * .04, 0, 0, r * 1.02);
    const hi = mix(isO ? ORANGE_HI : BLUE_HI, col, flat);
    const lo = mix(mix(col, DEEP, isO ? .22 : .3), col, flat);
    g.addColorStop(0, rgb(mix(mix(hi, WHITE, .35), col, flat))); g.addColorStop(.5, rgb(col)); g.addColorStop(1, rgb(lo));
    c.fillStyle = g;
  }
  c.fill(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}

/* ---------- atmosphere ---------- */
const AMB = [ // t, colour, alpha, radius — keyed to the cue sheet
  [0, [10, 40, 85], 0, 900], [.25, [10, 40, 85], 0, 900], [.9, [10, 40, 85], .85, 1100], [2.0, [12, 48, 98], 1, 1200],
  [2.35, [8, 30, 64], .7, 1000], [Q.a1.slice - .01, [6, 20, 44], .45, 900], [Q.a1.slice, [6, 20, 44], 0, 900], [Q.a1.snap, [6, 20, 44], 0, 900],
  [Q.b.devices, [10, 34, 72], .85, 1250], [Q.e.lock - .05, [10, 34, 72], .85, 1250], [Q.e.lock + .15, [8, 20, 48], .6, 1100],
  [Q.f.unlock - .05, [8, 20, 48], .6, 1100], [Q.f.unlock + .25, [24, 46, 86], 1, 1350], [Q.g.pullEnd, [12, 38, 82], .9, 1150], [Q.duration, [12, 38, 82], .9, 1150]];
function ambient(t) {
  let i = 0; while (i < AMB.length - 2 && t > AMB[i + 1][0]) i++;
  const A = AMB[i], B = AMB[i + 1], k = inv(A[0], B[0], t);
  return { col: mix(A[1], B[1], k), a: lerp(A[2], B[2], k), r: lerp(A[3], B[3], k) };
}
function radial(c, x, y, r, col, a, mid = .35) {
  if (a <= .003) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(.45, rgba(col, a * mid)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.globalAlpha = 1; c.fillRect(0, 0, W, H);
}
function background(c, t) {
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.filter = 'none';
  c.fillStyle = rgb(DEEP); c.fillRect(0, 0, W, H);
  const k = ambient(t); radial(c, CX, CY, k.r, k.col, k.a);
  const endA = pr(Q.a5.tagline - .5, Q.a5.tagline + .7, t, E.ioS);
  if (endA > 0) { // brand navy end card
    const g = c.createRadialGradient(CX, 410, 0, CX, 410, 1250);
    g.addColorStop(0, rgba([16, 46, 92], endA)); g.addColorStop(.42, rgba(NAVY, endA)); g.addColorStop(1, rgba([3, 11, 26], endA));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
}
function beams(c, x, y, n, len, wid, rot, col, a, seed = 1) {
  if (a <= .003) return;
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const an = rot + i * TAU / n + (hash(i * 7.3 + seed) - .5) * .5, w = wid * (.5 + hash(i * 3.1 + seed)), l = len * (.6 + .4 * hash(i * 5.7 + seed));
    const g = c.createLinearGradient(x, y, x + Math.cos(an) * l, y + Math.sin(an) * l);
    const aa = a * (.4 + .6 * hash(i * 9.9 + seed));
    g.addColorStop(0, rgba(col, aa)); g.addColorStop(.35, rgba(col, aa * .4)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.globalAlpha = 1; c.beginPath(); c.moveTo(x, y);
    c.lineTo(x + Math.cos(an - w) * l, y + Math.sin(an - w) * l); c.lineTo(x + Math.cos(an + w) * l, y + Math.sin(an + w) * l);
    c.closePath(); c.fill();
  }
}
const DUST = (() => { const r = rng(5), a = []; for (let i = 0; i < 240; i++) a.push([(r() - .5) * 4600, (r() - .5) * 2800, -400 + r() * 4200, .8 + r() * 2.2, r()]); return a; })();
function dust(c, t, alpha, focus = 1000) {
  if (alpha <= .01) return;
  c.globalCompositeOperation = 'lighter';
  for (const d of DUST) {
    const x = d[0] + Math.sin(t * .13 + d[4] * 40) * 60, y = ((d[1] - t * 14 + 1400) % 2800 + 2800) % 2800 - 1400, z = d[2];
    const p = proj(x, y, z); if (!p) continue;
    const coc = Math.abs(p.z - focus) * .0038, r = d[3] * p.s * 1.2 + coc;
    glow(c, SP.disc, p.x, p.y, r, alpha * .26 * d[3] / (1 + coc * .6));
  }
}

/* ===================================================================== */
/* ACT 1 — THE HOOK: a point, a world, a countdown, a freeze             */
/* ===================================================================== */
const A1 = Q.a1;
const T1 = (() => {
  const r = rng(101), out = [];
  for (let i = 0; i < 500; i++) {
    const burst = i < 230, u = r(), cu = r();
    const type = u < .34 ? 0 : u < .55 ? 1 : u < .68 ? 2 : u < .82 ? 3 : u < .92 ? 4 : 5;
    const col = cu < .45 ? BLUE : cu < .74 ? ICE : cu < .88 ? ORANGE : BLUE_HI;
    const parts = []; const m = 6 + Math.floor(r() * 7);
    for (let j = 0; j < m; j++) parts.push([r() - .5, r() - .5, r(), r(), r()]);
    out.push({ burst, th: r() * TAU, rho: 170 + Math.pow(r(), .75) * 1800, z0: burst ? 1500 + r() * 5500 : 7000,
      em: burst ? 0 : A1.burst + Math.pow(r(), .85) * (A1.freeze - A1.burst - .05),
      size: 40 + Math.pow(r(), 1.6) * 150, type, col, rot: (r() - .5) * .7, spin: (r() - .5) * 1.4, fa: .1 + r() * .3, parts });
  }
  return out;
})();
function tunnelP(t) { const a = A1.burst, L = A1.freeze - a, x = clamp(t, a, A1.freeze) - a; return 900 * x + 10600 * x * x * x / (3 * L * L); }
function tunnelV(t) { const a = A1.burst, L = A1.freeze - a; if (t < a || t >= A1.freeze) return 0; const x = (t - a) / L; return 900 + 10600 * x * x; }
const spinA = t => .38 * E.inQ(inv(A1.burst, A1.freeze, Math.min(t, A1.freeze)));
function tileState(T, t) {
  const te = Math.min(t, A1.freeze);
  if (!T.burst && te < T.em) return null;
  const z = T.burst ? T.z0 - tunnelP(te) : 7000 - (tunnelP(te) - tunnelP(T.em));
  if (z < -950 || z > 7000) return null;
  const bx = T.burst ? E.outExpo(inv(A1.burst, A1.burst + .8, te)) : 1, th = T.th + spinA(te);
  const x = Math.cos(th) * T.rho * bx, y = Math.sin(th) * T.rho * bx;
  return { x, y, z, rot: T.rot + T.spin * te };
}
function drawTunnel(c, t) {
  if (t < A1.burst || t > A1.shatter + 1.1) return;
  const v = tunnelV(t), ts = A1.shatter;
  c.globalCompositeOperation = 'lighter';
  const list = [];
  for (const T of T1) {
    const st = tileState(T, t); if (!st) continue;
    const p = proj(st.x, st.y, st.z); if (!p) continue;
    let a = inv(7000, 5300, st.z) * inv(140, 650, p.z) * (T.burst ? inv(A1.burst, A1.burst + .12, t) : 1);
    list.push({ T, st, p, a });
  }
  list.sort((A, B) => B.p.z - A.p.z);
  const shapeA = t < ts ? 1 : 1 - inv(ts, ts + .13, t), flashA = 1 + 2.2 * decay(t, ts, .14);
  for (const it of list) {
    const { T, st, p } = it; const a = it.a;
    const px = T.size * p.s;
    if (v > 0) {
      const q = proj(st.x, st.y, st.z + v * .05);
      if (q) { c.strokeStyle = rgba(T.col, a * .4); c.lineWidth = Math.max(1, px * .16); c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(p.x, p.y); c.stroke(); }
    }
    if (shapeA > 0) shape(c, T.type, p.x, p.y, px, st.rot, T.col, Math.min(1, a * shapeA * flashA), T.fa);
  }
  // shatter: every element breaks into light and recedes
  if (t >= ts) {
    const tau = t - ts, life = 1.25;
    if (tau < life) {
      const d = tau - .3 * tau * tau, fade = Math.pow(1 - tau / life, 1.7);
      for (const T of T1) {
        const st = tileState(T, A1.freeze); if (!st) continue;
        const p0 = proj(st.x, st.y, st.z); if (!p0) continue;
        const a0 = inv(7000, 5300, st.z) * inv(140, 650, p0.z); if (a0 < .02) continue;
        const rl = Math.hypot(st.x, st.y) || 1, dx = st.x / rl, dy = st.y / rl;
        c.fillStyle = rgba(T.col, 1);
        for (const q of T.parts) {
          const sp = 220 + q[2] * 780;
          const x = st.x + q[0] * T.size + (dx * sp + (q[3] - .5) * 300) * d;
          const y = st.y + q[1] * T.size + (dy * sp + (q[4] - .5) * 300) * d;
          const p = proj(x, y, st.z + (500 + q[2] * 1700) * d); if (!p) continue;
          const s = Math.max(1.8, (3 + q[4] * 5) * p.s), al = Math.min(1, a0 * fade * (.6 + .4 * q[3]) * 1.8);
          c.globalAlpha = al; c.fillRect(p.x - s / 2, p.y - s / 2, s, s);
          if (q[2] > .72) { glow(c, T.col === ORANGE ? SP.oh : SP.bh, p.x, p.y, s * 4, al * .55); c.fillStyle = rgba(T.col, 1); }
        }
      }
      c.globalAlpha = 1;
    }
  }
}
function drawNumerals(c, t) {
  const items = [['3', A1.n3, A1.n2], ['2', A1.n2, A1.n1], ['1', A1.n1, A1.n0], ['0', A1.n0, A1.freeze]];
  c.globalCompositeOperation = 'lighter'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  for (let k = 0; k < 4; k++) {
    const [ch, t0, t1] = items[k], last = k === 3;
    if (t < t0) continue;
    let z, a = 1, sc = 1;
    if (!last) { const p = (t - t0) / (t1 - t0); if (p > 1.25) continue; z = 6200 - 6900 * Math.pow(p, 2.1); }
    else {
      z = lerp(6200, 0, E.outExpo(inv(t0, t1, t)));
      if (t > A1.freeze) { const q = inv(A1.freeze, A1.freeze + .32, t); a = 1 - E.outQ(q); sc = 1 + .1 * E.outC(q); if (a <= 0) continue; }
    }
    a *= inv(6200, 4700, z);
    const vz = last ? 0 : 6900 * 2.1 * Math.pow(Math.max(.01, (t - t0) / (t1 - t0)), 1.1) / (t1 - t0);
    for (let j = 3; j >= 0; j--) {
      const p = proj(0, 0, z + j * vz * .012); if (!p) continue;
      const px = 560 * p.s * sc; if (px > 5200) continue;
      c.font = `200 ${px.toFixed(1)}px Outfit`;
      c.shadowColor = rgba(BLUE, .9); c.shadowBlur = j === 0 ? Math.min(70, px * .07) : 0;
      c.globalAlpha = clamp(a * (j === 0 ? .92 : .32 * Math.pow(.6, j)));
      c.fillStyle = rgb(ICE); c.fillText(ch, p.x, p.y + px * .357);
    }
    c.shadowBlur = 0;
  }
  c.globalAlpha = 1;
}
function strain(t) {
  let dx = 0, dy = 0, bul = 0, ang = 0;
  for (const [t0, an, d] of [[A1.strain1, .12, 128], [A1.strain2, -2.55, 118]]) {
    if (t < t0) continue;
    let m;
    if (t < t0 + .17) m = E.outC(inv(t0, t0 + .17, t));
    else if (t < t0 + .3) m = 1 + .025 * Math.sin((t - t0) * 95);
    else m = 1 - E.outElastic(inv(t0 + .3, t0 + .85, t));
    dx += Math.cos(an) * d * m; dy += Math.sin(an) * d * m;
    const b = Math.max(0, d * m - 112); if (b > bul) { bul = b; ang = an; }
  }
  return { dx, dy, bul, ang };
}
function drawHook(c, t) {
  // Act 1 main shot (ends under the slice transition)
  const fz = A1.freeze;
  // volumetric beams + birth shockwave
  const bi = inv(A1.burst, 1.0, t) * (t < fz ? 1 : 1 - inv(fz, fz + .9, t));
  beams(c, CX, CY, 14, 1500, .045, spinA(t) + .3, BLUE_HI, .07 * bi, 3);
  if (t > A1.burst && t < A1.burst + .7) {
    const p = inv(A1.burst, A1.burst + .7, t), r = 30 + 1500 * E.outExpo(p);
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(ICE, .7 * Math.pow(1 - p, 2)); c.lineWidth = 1 + 5 * (1 - p);
    c.beginPath(); c.arc(CX, CY, r, 0, TAU); c.stroke();
    for (let i = 0; i < 64; i++) { // radial streaks
      const an = i * TAU / 64 + hash(i) * .1, r0 = 20 + 1100 * E.outExpo(p) * (.55 + .45 * hash(i + 9)), l = 280 * (1 - p) * hash(i + 3);
      c.strokeStyle = rgba(i % 7 === 0 ? ORANGE_HI : BLUE_HI, .6 * (1 - p)); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(CX + Math.cos(an) * r0, CY + Math.sin(an) * r0); c.lineTo(CX + Math.cos(an) * (r0 + l), CY + Math.sin(an) * (r0 + l)); c.stroke();
    }
  }
  drawTunnel(c, t);
  // timer dial around the point
  const st = strain(t), hx = CX + st.dx, hy = CY + st.dy;
  c.globalCompositeOperation = 'lighter';
  const dialA = pr(-.3, .1, t, E.outC) * (1 - inv(fz + .1, fz + .5, t));
  if (dialA > 0) {
    c.strokeStyle = rgba(ICE, .22 * dialA); c.lineWidth = 2;
    const rr = lerp(170, 136, dialA);
    for (let i = 0; i < 60; i++) {
      const an = -PI / 2 + i * TAU / 60, l = i % 5 === 0 ? 10 : 5;
      c.beginPath(); c.moveTo(CX + Math.cos(an) * rr, CY + Math.sin(an) * rr); c.lineTo(CX + Math.cos(an) * (rr + l), CY + Math.sin(an) * (rr + l)); c.stroke();
    }
  }
  if (t < A1.n0 + .02) {
    // three seconds left, ticking away (piecewise so each second empties a third of the ring)
    const e = t < A1.n2 ? inv(A1.n3, A1.n2, t) : t < A1.n1 ? 1 + inv(A1.n2, A1.n1, t) : 2 + inv(A1.n1, A1.n0, t);
    const f = 1 - e / 3, a = 1;
    const a0 = -PI / 2, a1 = a0 + f * TAU;
    c.strokeStyle = rgba(ORANGE, .95 * a); c.lineWidth = 3.5; c.lineCap = 'round';
    c.beginPath(); c.arc(CX, CY, 112, a0, a1); c.stroke();
    c.strokeStyle = rgba(ORANGE, .2 * a); c.lineWidth = 12; c.beginPath(); c.arc(CX, CY, 112, a0, a1); c.stroke();
    glow(c, SP.oh, CX + Math.cos(a1) * 112, CY + Math.sin(a1) * 112, 26, .8 * a);
    c.lineCap = 'butt';
  }
  // the luminous boundary: snaps shut at zero
  if (t >= fz - .03) {
    const p = E.outExpo(inv(fz - .03, fz + .08, t)), R = 150, n = 140;
    const flick = 1 + 1.2 * decay(t, fz, .35) + .9 * (bell(st.bul, 18, 10) * (st.bul > 1 ? 1 : 0));
    c.beginPath();
    for (let i = 0; i <= n * p; i++) {
      const an = -PI / 2 + (i / n) * TAU, dA = Math.atan2(Math.sin(an - st.ang), Math.cos(an - st.ang));
      const r = R + st.bul * .95 * Math.exp(-(dA / .42) * (dA / .42));
      const x = CX + Math.cos(an) * r, y = CY + Math.sin(an) * r;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.strokeStyle = rgba(ICE, .95); c.lineWidth = 3.5 * Math.min(flick, 1.6); c.stroke();
    c.strokeStyle = rgba(BLUE, .28 * flick); c.lineWidth = 16; c.stroke();
    if (p < 1) { const an = -PI / 2 + p * TAU; glow(c, SP.w, CX + Math.cos(an) * R, CY + Math.sin(an) * R, 60, 1); }
    if (t < fz + .4) { const q = inv(fz, fz + .4, t); c.strokeStyle = rgba(ICE, .5 * (1 - q)); c.lineWidth = 2; c.beginPath(); c.arc(CX, CY, R + 400 * E.outExpo(q), 0, TAU); c.stroke(); }
  }
  // the point (the child) — wanting more
  let r = 12;
  for (const nt of [A1.n3, A1.n2, A1.n1, A1.n0]) r *= 1 + .22 * decay(t, nt, .22);
  const dt = 1 / 120, s1 = strain(t - dt), s2 = strain(t + dt);
  const vx = (s2.dx - s1.dx) / (2 * dt), vy = (s2.dy - s1.dy) / (2 * dt), sp = Math.hypot(vx, vy);
  const stretch = 1 + Math.min(.55, sp / 2600);
  const flare = (t < fz ? 1 : lerp(1, .35, inv(fz, fz + .5, t)));
  sphere(c, hx, hy, r, ORANGE, { energy: 1, flare, ang: Math.atan2(vy, vx), sx: stretch, sy: 1 / Math.sqrt(stretch) });
  // the time left, as the child's screen shows it
  const rdA = 1 - pr(A1.slice - .2, A1.slice, t);
  if (rdA > 0) {
    const rd = t < A1.n2 ? '0:03' : t < A1.n1 ? '0:02' : t < A1.n0 ? '0:01' : '0:00', k = 1 + .18 * decay(t, A1.n0, .3);
    POST.push(o => { // post layer: crisp over the particles, untouched by bloom
      o.save(); o.globalCompositeOperation = 'source-over'; o.globalAlpha = rdA;
      o.font = `500 ${(46 * k).toFixed(1)}px Outfit`; o.textAlign = 'center'; o.textBaseline = 'alphabetic';
      o.shadowColor = 'rgba(2,8,20,.9)'; o.shadowBlur = 14;
      o.fillStyle = t >= A1.n0 ? rgb(ORANGE_HI) : '#fff'; o.fillText(rd, CX, CY + 88); o.restore(); });
  }
  drawPlea(c, t);
  // sparks that hit the boundary and fall back
  if (t > A1.strain1 && t < A1.slice + .1) {
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i++) {
      const t0 = (i % 2 ? A1.strain1 : A1.strain2) + .1 + hash(i) * .25; if (t < t0) continue;
      const age = t - t0; if (age > .5) continue;
      const an = (i % 2 ? .12 : -2.55) + (hash(i + 4) - .5) * 1.4, out = Math.min(146, 20 + age * 520), back = Math.max(0, age * 520 - 126) * .6;
      const rr = out - back;
      glow(c, SP.oh, CX + Math.cos(an) * rr, CY + Math.sin(an) * rr, 7, .9 * (1 - age / .5));
    }
  }
  c.globalCompositeOperation = 'source-over';
}

/* --- the hook: the line every parent hears, on the very first frame --- */
function drawPlea(c, t) {
  if (t > A1.slice + .13) return;
  // the big line sits above bloom and vignette (pure white on frame 1); "please…" stays in the scene for the slice
  if (t < A1.slice) POST.push(o => pleaLine(o, t));
  if (t > A1.please) {
    const Lp = lay(S.please, 500, 36, .22);
    letters(c, Lp, CX, CY + 238, i => { const s0 = A1.please + i * .045, p = inv(s0, s0 + .22, t); if (p <= 0) return null;
      return { a: .88 * E.outQ(p), dy: (1 - p) * 8 + Math.sin(t * 30 + i) * 1.2, col: rgb(ICE) }; });
  }
}
function pleaLine(c, t) {
  const px = fit(S.hook, 800, 150, .01, 1640), L = lay(S.hook, 800, px, .01), by = CY - 250;
  const kick = decay(t, A1.n2, .25) + 1.3 * decay(t, A1.n1, .25) + 1.7 * decay(t, A1.n0, .3);
  const sh = t < A1.freeze ? 3 + kick * 8 : 0, brk = t > A1.shatter ? inv(A1.shatter, A1.shatter + .55, t) : 0;
  const sc0 = lerp(1.06, 1, E.outExpo(clamp(t / .22))) * (1 + .04 * kick);
  // a dark bed so the line reads over the rushing world
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1 - brk;
  c.save(); c.translate(CX, by - px * .36); c.scale(1, .26);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 1050); g.addColorStop(0, 'rgba(2,7,17,.78)'); g.addColorStop(.6, 'rgba(2,7,17,.45)'); g.addColorStop(1, 'rgba(2,7,17,0)');
  c.fillStyle = g; c.fillRect(-1100, -1100, 2200, 2200); c.restore(); c.globalAlpha = 1;
  const hot = ch => '5«»“”!'.includes(ch);
  // each tick, the plea gets louder: an orange echo bursts out of the line
  c.globalCompositeOperation = 'lighter';
  for (const tk of [A1.n2, A1.n1, A1.n0]) {
    const q = inv(tk, tk + .38, t); if (q <= 0 || q >= 1) continue;
    const sc = 1 + .32 * E.outC(q);
    letters(c, L, CX, by, (i, ch, lx) => ({ a: .3 * Math.pow(1 - q, 1.5), sc, dx: (lx - CX) * (sc - 1), blur: 4 + 8 * q, col: rgb(ORANGE) }));
  }
  c.globalCompositeOperation = 'source-over';
  const jx = noise(t * 40) * sh, jy = noise(t * 43 + 5) * sh;
  letters(c, L, CX + jx, by + jy, (i, ch, lx) => {
    const col = hot(ch.ch) ? rgb(ORANGE) : '#fff';
    if (brk > 0) { const r = hash(i * 3.7 + 1); // the plea breaks with the world
      return { a: 1 - brk, dx: (lx - CX) * brk * (1 + r), dy: (r - .5) * 520 * brk - 140 * brk, rot: (r - .5) * 3 * brk, sc: 1 - .3 * brk, blur: 10 * brk, col }; }
    return { a: 1, sc: sc0, dx: (lx - CX) * (sc0 - 1), col };
  });
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

/* --- the tension: same battle, every day --- */
function ropeY(u, t, A, pull) {
  return A * (Math.sin(PI * u) * Math.sin(t * 31) + .45 * Math.sin(TAU * u) * Math.sin(t * 47 + 1) + .25 * Math.sin(3 * PI * u) * Math.sin(t * 67 + 2))
    + pull * 3 * noise(u * 22 + t * 70) * Math.sin(PI * u);
}
function drawTension(c, t) {
  const ts = A1.snap, intro = E.outC(inv(A1.slice, A1.slice + .5, t)), pull = E.inQ(inv(A1.tension, ts, t)), after = t - ts;
  c.globalCompositeOperation = 'lighter';
  radial(c, CX - 700, CY + 120, 980, BLUE, .17 * intro * (1 + .6 * pull), .3);
  radial(c, CX + 700, CY + 120, 980, ORANGE, .15 * intro * (1 + .6 * pull), .3);
  const jit = pull * 3.5, R = 84, y0 = CY + 150;
  let xl = CX - 640 - 50 * pull + noise(t * 37) * jit, xr = CX + 640 + 50 * pull + noise(t * 41 + 9) * jit;
  if (after > 0) { const k = E.outExpo(clamp(after / .3)); xl -= 240 * k; xr += 240 * k; }
  // the rope
  const A = 22 * decay(t, A1.every, .8) + 34 * decay(t, A1.battle, 1.1) + 16 * decay(t, A1.battle + .18, .8) + 9 * pull;
  const g = c.createLinearGradient(xl, 0, xr, 0);
  g.addColorStop(0, rgba(BLUE_HI, 1)); g.addColorStop(.5, rgba(WHITE, 1)); g.addColorStop(1, rgba(ORANGE_HI, 1));
  const xa = xl + R, xb = xr - R, n = 96;
  const drawRope = (u0, u1, off) => {
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const u = lerp(u0, u1, i / n), x = lerp(xa, xb, u);
      const y = y0 + ropeY(u, t, A, pull) + (off ? off(u) : 0);
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.strokeStyle = g; c.globalAlpha = intro; c.lineWidth = 2.6; c.stroke();
    c.globalAlpha = .16 * intro * (1 + pull); c.lineWidth = 14; c.stroke(); c.globalAlpha = 1;
  };
  if (after <= 0) drawRope(0, 1);
  else { // snapped: both halves whip back
    const k = E.outExpo(clamp(after / .25)), wig = u => 60 * (1 - k) * Math.sin(u * 40 + after * 80);
    drawRope(0, .5 * (1 - k), wig); drawRope(.5 + .5 * k, 1, wig);
    glow(c, SP.w, CX, y0, 300 * (1 - k * .5), 1.2 * (1 - k));
  }
  glow(c, SP.w, CX, y0, 40 + 120 * pull, (.25 + .6 * pull) * intro * (after > 0 ? 0 : 1));
  // energy flowing along the rope from both sides
  for (let i = 0; i < 70; i++) {
    const left = i < 35, u0 = frac(hash(i) + t * (.5 + .3 * hash(i + 2))) * .5, u = left ? u0 : 1 - u0;
    if (after > 0) break;
    const x = lerp(xa, xb, u), y = y0 + ropeY(u, t, A, pull);
    glow(c, left ? SP.bh : SP.oh, x, y, 6 + 4 * hash(i + 5), .7 * intro * Math.sin(PI * u0 * 2) * (.6 + .4 * pull));
  }
  // halos
  if (after <= 0) { // after the snap the two lights are carried on by drawMorph
    c.lineWidth = 2;
    c.strokeStyle = rgba(BLUE_HI, .45 * intro); c.beginPath(); c.arc(xl, y0, R, 0, TAU); c.stroke();
    c.strokeStyle = rgba(ICE, .75 * intro); c.beginPath(); c.arc(xr, y0, R, 0, TAU); c.stroke();
    sphere(c, xl, y0, 18, BLUE, { energy: .9, flare: .3 });
    sphere(c, xr, y0, 13, ORANGE, { energy: 1, flare: .5 });
  }
  // type
  const scat = after > 0 ? E.outQ(clamp(after / .2)) : 0;
  const px1 = fit(S.every, 600, 46, .34, 1100), L1 = lay(S.every, 600, px1, .34);
  letters(c, L1, CX, CY - 150, (i, ch, lx) => {
    const s = A1.every + i * .024, p = inv(s, s + .35, t); if (p <= 0) return null;
    return { a: E.outQ(p) * (1 - scat), dy: (1 - E.outC(p)) * 20 - scat * 80, blur: (1 - p) * 6 + scat * 8, col: rgb(STEEL.map((v, j) => lerp(v, ICE[j], .5))) };
  });
  const px2 = fit(S.battle, 800, 142, .01, 1500), L2 = lay(S.battle, 800, px2, .01);
  const words = []; { let w = 0; for (const ch of L2.chars) { words.push(w); if (ch.ch === ' ') w++; } }
  const wc = [], x0 = CX - L2.width / 2;
  for (let w = 0; w <= words[words.length - 1]; w++) {
    const idx = words.map((v, i) => v === w && L2.chars[i].ch !== ' ' ? i : -1).filter(i => i >= 0);
    const a = L2.chars[idx[0]], b = L2.chars[idx[idx.length - 1]]; wc.push(x0 + (a.x + b.x + b.w) / 2);
  }
  const by = CY + 20;
  for (const pass of [0, 1]) {
    if (pass === 0) c.globalCompositeOperation = 'lighter'; else c.globalCompositeOperation = 'source-over';
    letters(c, L2, CX, by, (i, ch, lx) => {
      const w = words[i], s = A1.battle + w * .1, p = inv(s, s + .3, t); if (p <= 0) return null;
      const e = E.outExpo(p), sc = lerp(1.32, 1, e);
      const nx = (lx - CX) / 720, col = nx < 0 ? mix(WHITE, BLUE_HI, Math.min(1, -nx) * .8) : mix(WHITE, WARM, Math.min(1, nx) * .85);
      const dx = (lx - wc[w]) * (sc - 1) + (scat ? (lx - CX) * scat * 1.6 * (.6 + hash(i)) : 0);
      const dy = scat ? (hash(i + 3) - .5) * 300 * scat : 0;
      if (pass === 0) return { a: (.2 + .25 * decay(t, s, .5)) * E.outQ(inv(s, s + .12, t)) * (1 - scat), dx, dy, sc, blur: 18, col: rgba(nx < 0 ? BLUE : ORANGE, 1) };
      return { a: E.outQ(inv(s, s + .12, t)) * (1 - scat), dx, dy, sc: sc * (1 + scat * .3), rot: scat * (hash(i + 7) - .5) * 1.5, blur: (1 - e) * 14 + scat * 10, col: rgb(col) };
    });
  }
  c.globalCompositeOperation = 'source-over';
}

/* ===================================================================== */
/* THE SOLUTION — the parent's phone, the child's tablet, one link        */
/*   ① install  ② scan the lesson  ③ a quiz every 20 min                  */
/*   then, on the child's screen: 20 min later, locked until 3/3          */
/* ===================================================================== */
const B = Q.b, A3 = Q.a3, D = Q.d, EC = Q.e, F = Q.f, G = Q.g, A5 = Q.a5;
const PHN = { x: -450, y: 30 }, TBL = { x: 300, y: 30 };       // device centres (world)
const SHEET = { x: -455, y: 70, z: 80, rot: -.04, sc: .88 };     // the lesson page while it is scanned
const TS = .5;                                                   // tablet: screen units (1200 × 800) -> local
const PSX = 274 / 736, PSY = 594 / 1600;                         // phone: screen units (736 × 1600) -> local
const PKT = { gap: .12, dur: .78 };                              // the three questions in flight
const KD = { orange: '#ff7a1b', pink: '#ff4f9a', cyan: '#2fd3ff', yellow: '#ffd23f', green: '#2bd67b', lilac: '#c9bcff' };
const devIn = t => pr(B.devices - .1, B.devices + .45, t, E.outC);
const devOut = t => pr(A5.out, A5.out + .5, t, E.ioC);

/* ---- camera: dolly moves only (looking straight ahead), so the screens stay flat and legible ---- */
const CAMK = [
  [A3.sheet - .1, A3.sheet + .6, [0, 0, -1000], [-70, 25, -1070]],
  [D.push, D.push + .75, [-70, 25, -1070], [-330, 0, -700]],
  [D.save + .05, D.tokenEnd - .05, [-330, 0, -700], [0, 0, -1000]],
  [EC.dive, EC.diveEnd, [0, 0, -1000], [300, 5, -500]],
  [G.pull, G.pullEnd, [300, 5, -500], [0, 0, -1000]],
];
function camV3(t) {
  let p = [0, 0, -1000];
  for (const [t0, t1, a, b] of CAMK) if (t >= t0) p = t >= t1 ? b : a.map((v, i) => lerp(v, b[i], E.ioC(inv(t0, t1, t))));
  // a slow breathing drift, held still while we are inside the child's screen
  const dk = pr(A1.snap, B.devices + 1, t) * (1 - pr(EC.dive, EC.diveEnd, t) * (1 - pr(G.pull, G.pullEnd, t)));
  const dx = 7 * Math.sin(t * .45) * dk, dy = 4 * Math.sin(t * .37 + 1) * dk;
  return [p[0] + dx, p[1] + dy, p[2], p[0] + dx, p[1] + dy, 0, 1000, 0];
}
function phoneState(t) {
  const up = pr(A3.tap - .15, A3.cam + .25, t) * (1 - pr(A3.sheetOut, A3.sheetOut + .5, t)); // lifted above the page to scan it
  const taps = decay(t, A3.tap, .2) + decay(t, D.toggle, .2) + decay(t, D.pick, .2) + decay(t, D.qs, .2) + decay(t, D.save, .2);
  return { x: PHN.x + 25 * up, y: PHN.y - 15 * up, z: -130 * up, rot: -.035 * up + .007 * Math.sin(t * 1.3),
    k: 1 + .03 * decay(t, A3.lock, .25) + .02 * decay(t, A3.shot, .2) + .012 * taps + .025 * decay(t, G.notif, .35) };
}
function tabletState(t) {
  return { x: TBL.x, y: TBL.y, k: 1 + .025 * decay(t, A3.tray, .3) + .03 * decay(t, D.tokenEnd, .3) + .018 * decay(t, EC.lock, .35) + .02 * decay(t, F.unlock, .45) };
}

/* ---- small shared drawing helpers (screen units) ---- */
function roundFill(c, x, y, w, h, r, col) { c.fillStyle = col; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); }
function card(c, x, y, w, h) {
  c.save(); c.shadowColor = 'rgba(30,50,60,.10)'; c.shadowBlur = 24; c.shadowOffsetY = 6; roundFill(c, x, y, w, h, 30, '#fff'); c.restore();
}
function checkMark(c, x, y, k, col, lw) { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); checkPath(c, x, y, k); c.stroke(); c.lineCap = 'butt'; }
// a fingertip: arrives, presses at t0, lifts — with the ripple of the tap
function touch(c, t, t0, x, y, dark, r = 40) {
  const a = pr(t0 - .24, t0 - .08, t) * (1 - pr(t0 + .12, t0 + .32, t)); if (a <= .003 && (t < t0 || t > t0 + .45)) return;
  const ga = c.globalAlpha, q = inv(t0, t0 + .42, t);
  if (q > 0 && q < 1) { c.globalAlpha = ga * (1 - q); c.strokeStyle = dark ? 'rgba(20,30,40,.35)' : 'rgba(255,255,255,.75)'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, r + 90 * E.outC(q), 0, TAU); c.stroke(); }
  if (a > .003) {
    const s = 1 - .14 * decay(t, t0, .22);
    c.globalAlpha = ga * a; c.fillStyle = dark ? 'rgba(20,30,40,.22)' : 'rgba(255,255,255,.38)';
    c.beginPath(); c.arc(x, y, r * s, 0, TAU); c.fill();
    c.strokeStyle = dark ? 'rgba(20,30,40,.4)' : 'rgba(255,255,255,.85)'; c.lineWidth = 3; c.stroke();
  }
  c.globalAlpha = ga;
}
const LPX = { head: new Path2D(LOGO.paths.head), orange: new Path2D(LOGO.paths.orange), body: new Path2D(LOGO.paths.body), word: new Path2D(LOGO.paths.word) };
function miniLogo(c, x, y, h, word = '#fff') {
  const s = h / 810; c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = rgb(BLUE); c.fill(LPX.body); c.fill(LPX.head); c.fillStyle = rgb(ORANGE); c.fill(LPX.orange); c.fillStyle = word; c.fill(LPX.word);
  c.restore();
}
function padlock(c, x, y, s, open, rot, col = KD.orange) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.save(); c.translate(0, -30 * open); c.translate(38, -6); c.rotate(.32 * open); c.translate(-38, 6);
  c.lineWidth = 17; c.strokeStyle = '#efeaff'; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-38, -6); c.lineTo(-38, -46); c.arc(0, -46, 38, PI, 0); c.lineTo(38, -6); c.stroke(); c.restore();
  const g = c.createLinearGradient(0, -20, 0, 84); g.addColorStop(0, '#ffc18a'); g.addColorStop(1, col);
  roundFill(c, -66, -18, 132, 102, 24, g);
  c.fillStyle = 'rgba(70,24,0,.5)'; c.beginPath(); c.arc(0, 22, 13, 0, TAU); c.fill(); c.fillRect(-6, 22, 12, 30);
  c.restore();
}

/* ---- the parent's app: two new screens (rule, notification) next to the real ones ---- */
function ripple(c, t, t0, x, y) { touch(c, t, t0, x, y, true, 38); }
const TEAL = '#2b9fc1', TEAL_RGB = [43, 159, 193], CHIP_RGB = [214, 228, 233], APP_OR = [236, 106, 44];
function chipPill(c, x, y, w, h, label, sel, selRgb = TEAL_RGB) {
  roundFill(c, x, y, w, h, h / 2, rgb(mix(CHIP_RGB, selRgb, sel)));
  txt(c, label, x + w / 2, y + h / 2 + 7.5, '500 21px Outfit', sel > .5 ? '#fff' : '#5d6d75', 'center');
}
function richLine(c, x, y, parts) { // [text, font, colour]…
  for (const [s, f, col] of parts) { txt(c, s, x, y, f, col); c.font = f; x += c.measureText(s).width; }
}
// "Règles des quiz", rebuilt from the real screen: the parent switches the unlock quiz on, picks 20 min and 3 questions
function appRule(c, t) {
  const R = S.app.rule;
  const g = c.createLinearGradient(0, 0, 0, 1600); g.addColorStop(0, '#bfe0ea'); g.addColorStop(.45, '#e9eeec'); g.addColorStop(1, '#f6dccb');
  c.fillStyle = g; c.fillRect(0, 0, 736, 1600);
  statusBar(c, false);
  roundFill(c, 36, 122, 58, 58, 18, 'rgba(255,255,255,.75)');
  c.strokeStyle = AP.ink; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(77, 151); c.lineTo(53, 151); c.moveTo(63, 141); c.lineTo(53, 151); c.lineTo(63, 161); c.stroke(); c.lineCap = 'butt';
  txt(c, R.title, 112, 166, '700 38px Outfit', AP.ink); txt(c, R.sub, 123, 217, '400 22px Outfit', '#5b6c74');
  // 1. the unlock quiz, switched on
  const on = E.ioC(inv(D.toggle, D.toggle + .22, t));
  card(c, 32, 250, 674, 116);
  txt(c, R.unlock, 62, 304, '600 25px Outfit', AP.ink); txt(c, on > .5 ? R.on : R.off, 62, 334, '400 21px Outfit', '#8a979d');
  roundFill(c, 568, 280, 104, 46, 23, rgb(mix([196, 206, 211], TEAL_RGB, on)));
  roundFill(c, lerp(572, 608, on), 284, 60, 38, 19, '#fff');
  // 2. how often
  const pick = E.ioC(inv(D.pick, D.pick + .2, t)), mins = t < D.pick + .1 ? 30 : 20;
  card(c, 32, 394, 674, 338);
  txt(c, R.every, 62, 452, '600 25px Outfit', AP.ink); txt(c, `${mins} min`, 676, 454, '700 31px Outfit', TEAL, 'right');
  for (const [v, x, w] of [[10, 62, 94], [15, 170, 92], [20, 276, 98], [30, 388, 98], [40, 500, 100], [50, 62, 100], [60, 176, 98], [90, 288, 98], [120, 400, 105]])
    chipPill(c, x, v >= 50 ? 547 : 486, w, 48, `${v} min`, v === 30 ? 1 - pick : v === 20 ? pick : 0);
  roundFill(c, 62, 618, 614, 86, 18, '#e8f2f5');
  richLine(c, 80, 652, [[R.info[0], '400 21px Outfit', '#5b6c74'], [R.info[1].replace('{n}', mins), '500 27px Outfit', TEAL], [R.info[2], '400 21px Outfit', '#5b6c74']]);
  txt(c, R.info[3], 80, 684, '400 21px Outfit', '#5b6c74');
  // 3. how many questions
  const qp = E.ioC(inv(D.qs, D.qs + .2, t)), nq = t < D.qs + .1 ? 5 : 3;
  card(c, 32, 762, 674, 244);
  txt(c, R.qs, 62, 818, '600 25px Outfit', AP.ink); txt(c, String(nq), 676, 820, '700 31px Outfit', TEAL, 'right');
  for (let n = 3; n <= 10; n++) {
    const x = 85 + (n - 3) * 59, sel = n === 5 ? 1 - qp : n === 3 ? qp : 0;
    c.fillStyle = rgb(mix(CHIP_RGB, APP_OR, sel)); c.beginPath(); c.arc(x, 877, 24, 0, TAU); c.fill();
    txt(c, String(n), x, 884, '500 21px Outfit', sel > .5 ? '#fff' : '#5d6d75', 'center');
  }
  roundFill(c, 62, 922, 614, 58, 18, '#e8f2f5');
  richLine(c, 80, 960, [[R.passq[0], '400 21px Outfit', '#5b6c74'], [R.passq[1].replace('{n}', nq), '500 27px Outfit', TEAL]]);
  // 4. subjects
  card(c, 32, 1034, 674, 226);
  c.strokeStyle = TEAL; c.lineWidth = 2.5; c.beginPath(); c.moveTo(75, 1074); c.lineTo(75, 1094); c.moveTo(63, 1072); c.lineTo(63, 1092); c.lineTo(75, 1094); c.lineTo(87, 1092); c.lineTo(87, 1072); c.lineTo(75, 1074); c.lineTo(63, 1072); c.stroke();
  txt(c, R.subjects, 100, 1092, '600 25px Outfit', AP.ink);
  let sx = 62, sy = 1116;
  for (const sj of R.subjectList) {
    c.font = '500 23px Outfit'; const w = c.measureText(sj).width + 48; if (sx + w > 680) { sx = 62; sy += 64; }
    roundFill(c, sx, sy, w, 50, 25, TEAL); txt(c, sj, sx + w / 2, sy + 33, '500 23px Outfit', '#fff', 'center'); sx += w + 12;
  }
  // save
  c.save(); c.shadowColor = 'rgba(43,159,193,.45)'; c.shadowBlur = 30; roundFill(c, 30, 1300, 677, 90, 28, decay(t, D.save, .3) > 0 ? '#23879f' : TEAL); c.restore();
  txt(c, R.save, 368, 1355, '500 29px Outfit', '#fff', 'center');
  roundFill(c, 240, 1572, 256, 8, 4, '#111');
  ripple(c, t, D.toggle, 640, 303); ripple(c, t, D.pick, 325, 510); ripple(c, t, D.qs, 85, 877); ripple(c, t, D.save, 368, 1345);
}
function notifBanner(c, t) {
  const p = E.outBack(inv(G.notif, G.notif + .42, t), 1.3), y = lerp(-230, 52, p);
  c.save(); c.translate(0, y); notifCard(c); c.restore();
}
function notifCard(c) {
  c.save();
  c.save(); c.shadowColor = 'rgba(0,0,0,.28)'; c.shadowBlur = 34; c.shadowOffsetY = 10; roundFill(c, 22, 0, 692, 200, 42, 'rgba(252,252,252,.97)'); c.restore();
  roundFill(c, 48, 36, 88, 88, 22, '#0f2340'); miniLogo(c, 92, 80, 68, '#fff');
  txt(c, S.app.notifApp, 160, 64, '600 22px Outfit', '#7b8a91'); txt(c, S.app.notifNow, 686, 64, '400 22px Outfit', '#7b8a91', 'right');
  txt(c, S.app.notifTitle, 160, 108, '700 30px Outfit', AP.ink);
  const body = S.app.notifBody.replace(' ✓', ''); txt(c, body, 160, 150, '400 26px Outfit', '#3c4b52');
  c.font = '400 26px Outfit'; const bw = c.measureText(body).width;
  c.fillStyle = '#e3f4ea'; c.beginPath(); c.arc(160 + bw + 26, 141, 17, 0, TAU); c.fill(); checkMark(c, 160 + bw + 26, 141, 1.15, AP.green, 3.5);
  c.restore();
}
function phoneScreen(c, t, A) {
  const push = pr(A3.cam, A3.cam + .26, t, E.ioC), proc = pr(A3.detected, A3.detected + .18, t);
  const rule = pr(D.screen, D.screen + .3, t, E.ioC), back = pr(D.home, D.home + .3, t, E.ioC);
  const slide = (k, draw) => { c.save(); c.translate(736 * (1 - k), 0); draw(); c.restore(); };
  const under = (k, draw) => { c.save(); c.translate(-220 * k, 0); draw(); if (k > 0) { c.fillStyle = `rgba(0,0,0,${.4 * k})`; c.fillRect(0, 0, 736, 1600); } c.restore(); };
  if (t < A3.cam + .26) { under(push, () => appHome(c, t)); if (push > 0) slide(push, () => appCamera(c, t)); }
  else if (t < A3.detected + .18) { appCamera(c, t); if (proc > 0) { c.globalAlpha = A * proc; appReading(c, t); } }
  else if (t < D.screen + .3) { under(rule, () => appReading(c, t)); if (rule > 0) slide(rule, () => appRule(c, t)); }
  else if (t < D.home + .3) { under(back, () => appRule(c, t)); if (back > 0) slide(back, () => appHome(c, t)); }
  else appHome(c, t);
  c.globalAlpha = A;
  const fl = decay(t, A3.shot, .28); if (fl > 0) { c.globalAlpha = A * fl; c.fillStyle = '#fff'; c.fillRect(0, 0, 736, 1600); c.globalAlpha = A; }
  if (t > G.notif - .05) notifBanner(c, t);
}
function glass(c, x, y, w, h, r) { // a faint reflection across the glass
  const g = c.createLinearGradient(x, y, x + w * .7, y + h); g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(.45, 'rgba(255,255,255,.015)'); g.addColorStop(.46, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
}
function drawPhoneV3(c, t) {
  const din = devIn(t), A = 1 - devOut(t); if (din <= .003 || A <= .003) return;
  const st = phoneState(t), P = proj(st.x, st.y, st.z); if (!P) return;
  const s = P.s * st.k * lerp(.72, 1, din) * lerp(1, .82, devOut(t)), cs = Math.cos(st.rot) * s, sn = Math.sin(st.rot) * s;
  c.setTransform(cs, sn, -sn, cs, P.x, P.y);
  const body = clamp(din * 1.6 - .5);
  c.globalAlpha = A * body;
  const g = c.createLinearGradient(-150, -310, 150, 310); g.addColorStop(0, '#2b3542'); g.addColorStop(1, '#0c1018');
  c.beginPath(); c.roundRect(-150, -310, 300, 620, 46); c.fillStyle = g; c.fill();
  c.globalAlpha = A; c.setLineDash([1900 * din, 4000]);  // the outline draws itself around the parent's light
  c.lineWidth = 3; c.strokeStyle = rgba(BLUE_HI, .9); c.stroke();
  c.lineWidth = 9; c.strokeStyle = rgba(BLUE, .16); c.stroke(); c.setLineDash([]);
  c.globalAlpha = A * body; c.beginPath(); c.roundRect(-137, -297, 274, 594, 34); c.fillStyle = '#04070c'; c.fill();
  const sa = A * pr(B.screens, B.screens + .35, t);
  if (sa > .003) {
    c.save(); c.beginPath(); c.roundRect(-137, -297, 274, 594, 34); c.clip();
    c.translate(-137, -297); c.scale(PSX, PSY); c.globalAlpha = sa;
    phoneScreen(c, t, sa);
    c.restore();
  }
  c.globalAlpha = A * body; glass(c, -137, -297, 274, 594, 34);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}

/* ---- the child's app: colourful, game energy ---- */
function childBg(c, t) {
  const g = c.createLinearGradient(0, 0, 1200, 800); g.addColorStop(0, '#22125c'); g.addColorStop(1, '#5326c4');
  c.fillStyle = g; c.fillRect(0, 0, 1200, 800);
  for (const [x, y, r, col] of [[1040 + 30 * Math.sin(t * .7), 110, 420, 'rgba(255,79,154,.24)'], [140, 780 + 20 * Math.sin(t * .5), 460, 'rgba(47,211,255,.18)']]) {
    const rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(0, 0, 1200, 800);
  }
  c.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 26; i++) { c.beginPath(); c.arc(hash(i) * 1200, hash(i + 40) * 800, 3 + 5 * hash(i + 80), 0, TAU); c.fill(); }
}
function tileIcon(c, k, x, y) {
  c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = 7; c.lineCap = 'round';
  if (k === 0) { c.beginPath(); c.moveTo(x - 16, y - 24); c.lineTo(x + 26, y); c.lineTo(x - 16, y + 24); c.closePath(); c.fill(); }
  else if (k === 1) { c.beginPath(); c.roundRect(x - 44, y - 22, 88, 48, 24); c.fill(); c.fillStyle = '#1aa6d6'; c.fillRect(x - 30, y - 3, 20, 7); c.fillRect(x - 23.5, y - 10, 7, 20); c.beginPath(); c.arc(x + 20, y - 4, 6, 0, TAU); c.arc(x + 30, y + 6, 6, 0, TAU); c.fill(); }
  else { c.font = '800 64px Outfit'; c.textAlign = 'center'; c.fillText('?', x, y + 22); }
  c.lineCap = 'butt';
}
function childHome(c, t) {
  childBg(c, t);
  miniLogo(c, 96, 96, 118, '#fff');
  const hi = E.outBack(inv(B.screens + .1, B.screens + .5, t), 1.6);
  c.save(); c.translate(250, 330); c.scale(hi, hi);
  c.strokeStyle = KD.yellow; c.lineWidth = 9; c.beginPath(); c.arc(0, 0, 112, 0, TAU); c.stroke();
  const ag = c.createLinearGradient(0, -100, 0, 100); ag.addColorStop(0, '#ffab5e'); ag.addColorStop(1, KD.orange);
  c.fillStyle = ag; c.beginPath(); c.arc(0, 0, 98, 0, TAU); c.fill();
  txt(c, 'B', 0, 40, '800 112px Outfit', '#fff', 'center'); c.restore();
  txt(c, S.tab.hello, 410, 318, '800 90px Outfit', '#fff');
  const on = E.outBack(inv(B.linked, B.linked + .35, t), 2);
  if (on > 0) {
    c.font = '600 31px Outfit'; const w = c.measureText(S.tab.active).width + 84;
    c.save(); c.translate(410, 352); c.scale(on, on);
    roundFill(c, 0, 0, w, 64, 32, 'rgba(43,214,123,.2)'); c.strokeStyle = KD.green; c.lineWidth = 3; c.beginPath(); c.roundRect(0, 0, w, 64, 32); c.stroke();
    c.fillStyle = KD.green; c.beginPath(); c.arc(36, 32, 10, 0, TAU); c.fill();
    txt(c, S.tab.active, 60, 43, '600 31px Outfit', '#fff'); c.restore();
  }
  const cols = [[KD.pink, KD.orange], [KD.cyan, '#3a6cf0'], [KD.yellow, KD.orange]];
  for (let i = 0; i < 3; i++) {
    const x = 70 + i * 362, y = 530, press = 1 - .05 * decay(t, D.tapVid, .25) * (i === 0 ? 1 : 0);
    c.save(); c.translate(x + 165, y + 100); c.scale(press, press); c.translate(-165, -100);
    const tg = c.createLinearGradient(0, 0, 330, 200); tg.addColorStop(0, cols[i][0]); tg.addColorStop(1, cols[i][1]);
    roundFill(c, 0, 0, 330, 200, 36, tg);
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(258, 72, 50, 0, TAU); c.fill(); tileIcon(c, i, 258, 72);
    txt(c, S.tab.tiles[i], 30, 168, '800 40px Outfit', '#fff'); c.restore();
  }
  if (t > A3.tray - .05) {
    const p = E.outBack(inv(A3.tray - .05, A3.tray + .3, t), 1.5) * (1 - E.inC(inv(D.token, D.token + .3, t))); // makes room for the timer
    if (p > .003) {
    c.save(); c.translate(925, 145); c.scale(p, p); c.translate(-925, -145);
    roundFill(c, 690, 36, 470, 218, 34, 'rgba(255,255,255,.14)'); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2.5; c.beginPath(); c.roundRect(690, 36, 470, 218, 34); c.stroke();
    txt(c, S.tab.ready, 722, 100, '700 36px Outfit', '#fff'); txt(c, S.tab.lesson, 722, 142, '500 28px Outfit', KD.lilac);
    for (let k = 0; k < 3; k++) {
      const q = E.outBack(inv(A3.send + k * PKT.gap + PKT.dur - .04, A3.send + k * PKT.gap + PKT.dur + .25, t), 2.6); if (q <= 0) continue;
      c.save(); c.translate(760 + k * 84, 200); c.scale(q, q); roundFill(c, -32, -32, 64, 64, 18, KD.orange); txt(c, '?', 0, 18, '800 46px Outfit', '#fff', 'center'); c.restore();
    }
    c.restore();
  }
  }
  touch(c, t, D.tapVid, 290, 620, false);
}

/* ---- the child's videos: an endless feed (generic cartoons) ---- */
const VIDS = [
  { sky: ['#5fcbff', '#c9f1ff'], ground: '#46c25e', hero: 0, col: '#ff7a1b' },
  { sky: ['#140f45', '#3b2a92'], ground: null, hero: 1, col: '#ff4f9a' },
  { sky: ['#ff9468', '#ffd56b'], ground: '#4a3f63', hero: 2, col: '#2fd3ff' },
  { sky: ['#0a78a3', '#18b9cc'], ground: '#0b5a76', hero: 3, col: '#ffd23f' },
  { sky: ['#a868ff', '#ff8fd9'], ground: '#6c38cc', hero: 4, col: '#2bd67b' },
];
function critter(c, x, y, r, col, sq, look) {
  c.save(); c.translate(x, y); c.scale(1 + sq * .3, 1 - sq * .3);
  c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(-r * .3, -r * .35, r * .35, 0, TAU); c.fill();
  for (const ex of [-.34, .34]) { c.fillStyle = '#fff'; c.beginPath(); c.arc(ex * r, -r * .12, r * .26, 0, TAU); c.fill(); c.fillStyle = '#1b1240'; c.beginPath(); c.arc(ex * r + look * r * .08, -r * .1, r * .12, 0, TAU); c.fill(); }
  c.strokeStyle = '#1b1240'; c.lineWidth = r * .08; c.lineCap = 'round'; c.beginPath(); c.arc(0, r * .2, r * .32, .2 * PI, .8 * PI); c.stroke(); c.lineCap = 'butt';
  c.restore();
}
function videoScene(c, idx, vt) {
  const V = VIDS[idx % VIDS.length];
  const g = c.createLinearGradient(0, 0, 0, 800); g.addColorStop(0, V.sky[0]); g.addColorStop(1, V.sky[1]);
  c.fillStyle = g; c.fillRect(0, 0, 1200, 800);
  switch (V.hero) {
    case 0: { // a bouncy friend in the hills
      c.fillStyle = '#fff6b0'; c.beginPath(); c.arc(990, 150, 76, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 3; i++) { const x = ((180 + i * 470 + vt * 50) % 1500) - 150, y = 120 + i * 60; c.beginPath(); c.ellipse(x, y, 90, 34, 0, 0, TAU); c.ellipse(x + 50, y - 20, 60, 34, 0, 0, TAU); c.fill(); }
      c.fillStyle = V.ground; c.beginPath(); c.moveTo(0, 610); c.bezierCurveTo(300, 520, 520, 650, 820, 580); c.bezierCurveTo(1000, 540, 1100, 600, 1200, 570); c.lineTo(1200, 800); c.lineTo(0, 800); c.fill();
      const h = Math.abs(Math.sin(vt * 3.4)), x = 240 + (vt * 160) % 760;
      critter(c, x, 560 - h * 230, 86, V.col, Math.max(0, .22 - h) * 3, 1); break; }
    case 1: { // a rocket among the stars
      c.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { const y = (hash(i + 3) * 900 + vt * 420 * (.5 + hash(i))) % 900 - 50; c.globalAlpha *= 1; c.fillRect(hash(i) * 1200, y, 3, 3 + 18 * hash(i + 9)); }
      c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(220, 170, 60, 0, TAU); c.fill();
      c.save(); c.translate(620 + 160 * Math.sin(vt * 1.2), 430 + 26 * Math.sin(vt * 3.1)); c.rotate(-.55 + .12 * Math.sin(vt * 2));
      const fl = 60 + 30 * Math.abs(Math.sin(vt * 25)); c.fillStyle = '#ffb02e'; c.beginPath(); c.moveTo(-30, 110); c.lineTo(0, 110 + fl); c.lineTo(30, 110); c.fill();
      c.fillStyle = V.col; c.beginPath(); c.moveTo(-70, 110); c.lineTo(-40, 40); c.lineTo(40, 40); c.lineTo(70, 110); c.fill();
      c.fillStyle = '#f2f4ff'; c.beginPath(); c.roundRect(-45, -60, 90, 175, 40); c.fill(); c.beginPath(); c.moveTo(-45, -40); c.quadraticCurveTo(0, -170, 45, -40); c.fill();
      c.fillStyle = '#2fd3ff'; c.beginPath(); c.arc(0, -10, 24, 0, TAU); c.fill(); c.strokeStyle = '#3b2a92'; c.lineWidth = 7; c.stroke(); c.restore(); break; }
    case 2: { // a little car on the road
      c.fillStyle = '#fff1c4'; c.beginPath(); c.arc(860, 470, 150, 0, TAU); c.fill();
      c.fillStyle = V.ground; c.fillRect(0, 590, 1200, 210); c.fillStyle = '#ffe9a8'; for (let i = 0; i < 8; i++) c.fillRect(((i * 220 - vt * 520) % 1760 + 1760) % 1760 - 280, 690, 120, 12);
      const x = 600 + 60 * Math.sin(vt * 1.6), b = 4 * Math.sin(vt * 30);
      c.fillStyle = V.col; c.beginPath(); c.roundRect(x - 190, 470 + b, 380, 110, 40); c.fill(); c.beginPath(); c.roundRect(x - 110, 400 + b, 210, 100, 40); c.fill();
      c.fillStyle = '#e8fbff'; c.beginPath(); c.roundRect(x - 88, 420 + b, 76, 60, 14); c.roundRect(x + 4, 420 + b, 76, 60, 14); c.fill();
      for (const wx of [-110, 110]) { c.save(); c.translate(x + wx, 590); c.rotate(vt * 14); c.fillStyle = '#231a3d'; c.beginPath(); c.arc(0, 0, 50, 0, TAU); c.fill(); c.fillStyle = '#e8e8f0'; c.beginPath(); c.arc(0, 0, 24, 0, TAU); c.fill(); c.fillStyle = '#231a3d'; c.beginPath(); c.arc(12, 0, 6, 0, TAU); c.fill(); c.restore(); }
      break; }
    case 3: { // under the sea
      for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(150 + i * 230, 0); c.lineTo(230 + i * 230, 0); c.lineTo(80 + i * 260, 800); c.lineTo(20 + i * 260, 800); c.fill(); }
      c.fillStyle = V.ground; c.fillRect(0, 700, 1200, 100);
      c.strokeStyle = '#2bd67b'; c.lineWidth = 16; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const x = 90 + i * 210; c.beginPath(); c.moveTo(x, 720); c.quadraticCurveTo(x + 40 * Math.sin(vt * 2 + i), 620, x + 10, 540); c.stroke(); } c.lineCap = 'butt';
      const fx = 1350 - (vt * 260) % 1600, fy = 380 + 50 * Math.sin(vt * 2.2);
      c.fillStyle = V.col; c.beginPath(); c.ellipse(fx, fy, 120, 74, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(fx + 100, fy); c.lineTo(fx + 190, fy - 70 + 10 * Math.sin(vt * 12)); c.lineTo(fx + 190, fy + 70 - 10 * Math.sin(vt * 12)); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(fx - 60, fy - 14, 20, 0, TAU); c.fill(); c.fillStyle = '#122'; c.beginPath(); c.arc(fx - 66, fy - 12, 9, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 4; for (let i = 0; i < 12; i++) { const y = 800 - ((vt * 160 + hash(i) * 800) % 820); c.beginPath(); c.arc(hash(i + 5) * 1200 + 14 * Math.sin(vt * 3 + i), y, 8 + 10 * hash(i + 2), 0, TAU); c.stroke(); }
      break; }
    default: { // a striped ball that will not stop bouncing
      c.fillStyle = V.ground; c.fillRect(0, 660, 1200, 140);
      const h = Math.abs(Math.sin(vt * 3)), x = 600 + 280 * Math.sin(vt * 1.1), y = 560 - h * 300, r = 100;
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, 672, 120 * (1 - h * .5), 18, 0, 0, TAU); c.fill();
      c.save(); c.translate(x, y); c.rotate(vt * 4); c.fillStyle = V.col; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.clip();
      c.fillStyle = '#fff'; c.fillRect(-r, -24, 2 * r, 48); c.fillStyle = KD.yellow; c.fillRect(-24, -r, 48, 2 * r); c.restore();
    }
  }
  // feed chrome: who posted it, actions, progress
  const bg = c.createLinearGradient(0, 600, 0, 800); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = bg; c.fillRect(0, 600, 1200, 200);
  c.fillStyle = '#fff'; c.beginPath(); c.arc(76, 712, 28, 0, TAU); c.fill(); c.fillStyle = V.col; c.beginPath(); c.arc(76, 712, 22, 0, TAU); c.fill();
  roundFill(c, 122, 694, 280, 18, 9, 'rgba(255,255,255,.9)'); roundFill(c, 122, 722, 180, 14, 7, 'rgba(255,255,255,.6)');
  c.fillStyle = 'rgba(255,255,255,.92)';
  c.save(); c.translate(1122, 400); c.scale(.62, .62); c.beginPath(); heart(c); c.fill(); c.restore();
  c.beginPath(); c.arc(1122, 490, 26, 0, TAU); c.fill(); c.beginPath(); c.moveTo(1104, 580); c.lineTo(1142, 560); c.lineTo(1142, 600); c.closePath(); c.fill();
  roundFill(c, 40, 764, 1120, 8, 4, 'rgba(255,255,255,.32)'); const pw = 1120 * frac(vt / 7 + idx * .23); roundFill(c, 40, 764, pw, 8, 4, '#fff');
  c.beginPath(); c.arc(40 + pw, 768, 11, 0, TAU); c.fill();
}
// feed timing: swipes come faster and faster while the 20 minutes run out
const SWIPES = (() => { const a = []; for (let k = 1; k <= 6; k++) a.push(EC.lapse + (EC.zero - EC.lapse) * .82 * Math.pow(k / 6, .62)); return a; })();
function videoAt(t) {
  if (t >= F.resume) return { idx: 7, vt: t - F.resume + 1.5, prev: -1, p: 1 };
  const tt = Math.min(t, EC.zero);
  let i = 0; for (const s of SWIPES) if (tt >= s) i++;
  const t0 = i ? SWIPES[i - 1] : D.vid, tp = i > 1 ? SWIPES[i - 2] : D.vid;
  return { idx: i, vt: tt - t0, prev: i - 1, pvt: tt - tp, p: i ? E.ioC(inv(t0, t0 + .16, tt)) : 1 };
}
const vidCv = mk(1200, 800), vidX = vidCv.getContext('2d');
function drawVideoAt(c, t, blur) {
  const v = videoAt(t);
  const draw = cc => {
    if (v.prev >= 0 && v.p < 1) {
      cc.save(); cc.translate(0, -800 * v.p); videoScene(cc, v.prev, v.pvt); cc.restore();
      cc.save(); cc.translate(0, 800 * (1 - v.p)); videoScene(cc, v.idx, v.vt); cc.restore();
    } else videoScene(cc, v.idx, v.vt);
  };
  if (blur > .3) {
    vidX.setTransform(1, 0, 0, 1, 0, 0); vidX.globalAlpha = 1; vidX.globalCompositeOperation = 'source-over'; draw(vidX);
    c.filter = `blur(${blur.toFixed(1)}px) saturate(${(1 - blur / 40).toFixed(2)})`; c.drawImage(vidCv, 0, 0); c.filter = 'none';
  } else draw(c);
}
function timerSecs(t) {
  t = Math.round(t * 30) / 30; // digits hold for a whole frame so they stay crisp under motion blur
  if (t < EC.lapse) return 1200 - Math.max(0, Math.floor(t - D.tokenEnd));
  if (t < EC.zero) {
    const u = inv(EC.lapse, EC.zero, t);
    if (u < .72) return Math.max(3, Math.round(1199 - 1196 * E.inQ(u / .72)));
    return Math.max(0, 3 - Math.floor((u - .72) / .28 * 3));   // …0:03, 0:02, 0:01 — the hook, answered
  }
  if (t < F.resume) return 0;
  return 1200 - Math.max(0, Math.floor(t - F.resume - .3));
}
function timerBadge(c, t, k) {
  if (k <= .003) return;
  const secs = timerSecs(t), str = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, zero = secs === 0 && t > EC.lapse;
  const lapse = pr(EC.lapse, EC.lapse + .3, t) * (1 - pr(EC.zero + .1, EC.lock + .4, t));
  const sc = k * (1 + .2 * lapse + .25 * decay(t, EC.zero, .35) + .18 * decay(t, F.resume + .15, .4));
  c.save(); c.translate(1040, 72); c.scale(sc, sc);
  roundFill(c, -118, -38, 236, 76, 38, zero ? KD.orange : 'rgba(14,10,36,.78)');
  c.strokeStyle = zero ? '#ffd2ae' : KD.orange; c.lineWidth = 3; c.beginPath(); c.roundRect(-118, -38, 236, 76, 38); c.stroke();
  c.fillStyle = zero ? '#fff' : KD.orange; c.beginPath(); c.arc(-80, 0, 12, 0, TAU); c.fill();
  c.font = '800 40px Outfit'; c.textAlign = 'center'; c.fillStyle = '#fff';
  const ws = [...str].map(ch => ch === ':' ? 13 : 25); let x = 18 - ws.reduce((a, b) => a + b, 0) / 2;
  [...str].forEach((ch, i) => { c.fillText(ch, x + ws[i] / 2, 14); x += ws[i]; });
  c.restore();
}
function lockLayer(c, t) {
  const ga = c.globalAlpha, k = pr(EC.lock, EC.lock + .25, t);
  c.fillStyle = `rgba(16,8,44,${.62 * k})`; c.fillRect(0, 0, 1200, 800);
  // the child tries to swipe past it: everything strains, then snaps back
  const sw = inv(EC.swipe, EC.swipe + .3, t), dy = sw > 0 && sw < 1 ? -40 * Math.sin(PI * sw) : 0;
  const dp = E.outBack(inv(EC.lock, EC.lock + .34, t), 1.8);
  const wob = t > EC.deny ? .26 * Math.sin((t - EC.deny) * 38) * Math.max(0, 1 - (t - EC.deny) / .5) : 0;
  c.save(); c.translate(0, dy);
  const lg = c.createRadialGradient(600, 200, 0, 600, 200, 260); lg.addColorStop(0, `rgba(255,140,60,${.35 * k})`); lg.addColorStop(1, 'rgba(255,140,60,0)');
  c.fillStyle = lg; c.fillRect(300, 0, 600, 460);
  padlock(c, 600, 200 - 460 * (1 - dp), 1.05, 0, wob);
  const ca = E.outC(inv(EC.card, EC.card + .35, t));
  c.globalAlpha = ga * ca;
  txt(c, S.tab.lockTitle, 600, 396 + 24 * (1 - ca), '800 66px Outfit', '#fff', 'center');
  wrapBal(S.tab.lockSub, '500 32px Outfit', 860).forEach((l, i) => txt(c, l, 600, 454 + i * 42 + 24 * (1 - ca), '500 32px Outfit', KD.lilac, 'center'));
  const bp = 1 - .06 * decay(t, EC.go, .25);
  c.save(); c.translate(600, 612 + 24 * (1 - ca)); c.scale(bp, bp); roundFill(c, -190, -46, 380, 92, 46, KD.orange); txt(c, S.tab.lockBtn, 0, 13, '700 36px Outfit', '#fff', 'center'); c.restore();
  c.globalAlpha = ga; c.restore();
  // "screen locked"
  const ta = pr(EC.deny, EC.deny + .15, t) * (1 - pr(EC.go - .15, EC.go, t));
  if (ta > .003) {
    c.font = '700 30px Outfit'; const w = c.measureText(S.tab.denied).width + 100;
    c.globalAlpha = ga * ta; c.save(); c.translate(600, 736); c.scale(lerp(.8, 1, ta), lerp(.8, 1, ta));
    roundFill(c, -w / 2, -32, w, 64, 32, 'rgba(255,79,154,.95)'); padlock(c, -w / 2 + 40, 6, .22, 0, 0, '#fff'); txt(c, S.tab.denied, -w / 2 + 70, 11, '700 30px Outfit', '#fff');
    c.restore(); c.globalAlpha = ga;
  }
  // the swipe that goes nowhere, then the tap on "let's go"
  if (t > EC.swipe - .2 && t < EC.swipe + .5) {
    const a = pr(EC.swipe - .2, EC.swipe - .05, t) * (1 - pr(EC.swipe + .3, EC.swipe + .45, t)), q = E.ioC(inv(EC.swipe, EC.swipe + .3, t)), y = lerp(720, 450, q), L = 270 * q;
    c.globalAlpha = ga * a;
    if (L > 2) { const tg = c.createLinearGradient(0, y, 0, y + L); tg.addColorStop(0, 'rgba(255,255,255,.45)'); tg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = tg; c.beginPath(); c.moveTo(880 - 30, y); c.lineTo(880 + 30, y); c.lineTo(880 + 4, y + L); c.lineTo(880 - 4, y + L); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.42)'; c.beginPath(); c.arc(880, y, 40, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.stroke();
    c.globalAlpha = ga;
  }
  touch(c, t, EC.go, 640, 612, false);
}
function quizLayer(c, t) {
  const ga = c.globalAlpha, inK = E.outC(inv(F.start, F.start + .32, t)), cardA = 1 - pr(F.unlock - .06, F.unlock + .08, t);
  c.save(); c.translate(0, 800 * (1 - inK));
  childBg(c, t);
  c.globalAlpha = ga * cardA;
  // header: the lesson it comes from, and three notches on the padlock
  c.font = '600 30px Outfit'; const lw = c.measureText(S.tab.lesson).width;
  roundFill(c, 44, 38, lw + 110, 66, 33, 'rgba(255,255,255,.14)');
  roundFill(c, 66, 52, 30, 38, 5, '#f4efe4'); c.fillStyle = 'rgba(44,63,140,.6)'; for (let i = 0; i < 3; i++) c.fillRect(71, 62 + i * 8, 20 - (i % 2) * 6, 2.5);
  txt(c, S.tab.lesson, 110, 81, '600 30px Outfit', '#fff');
  padlock(c, 1000, 76, .36, 0, 0);
  for (let k = 0; k < 3; k++) {
    const f = E.outBack(inv(F.tap[k] + .08, F.tap[k] + .3, t), 2.6);
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 3; c.beginPath(); c.arc(1062 + k * 44, 70, 15, 0, TAU); c.stroke();
    if (f > 0) { c.fillStyle = KD.orange; c.beginPath(); c.arc(1062 + k * 44, 70, 15 * f, 0, TAU); c.fill(); }
  }
  for (let i = 0; i < 3; i++) {
    if (i > 0 && t < F.q[i]) continue;
    const tin = i === 0 ? 1 : E.ioC(inv(F.q[i], F.q[i] + .3, t)), tout = i < 2 ? E.ioC(inv(F.q[i + 1], F.q[i + 1] + .3, t)) : 0;
    if (tout >= 1) continue;
    c.save(); c.translate(1200 * (1 - tin) - 1200 * tout, 0); questionCard(c, t, i); c.restore();
  }
  c.globalAlpha = ga; c.restore();
}
function questionCard(c, t, i) {
  const Qd = S.tab.questions[i], hitT = F.tap[i];
  txt(c, `${S.tab.qLabel} ${i + 1}/3`, 600, 184, '600 28px Outfit', KD.lilac, 'center');
  const lines = wrapBal(Qd.q, '800 52px Outfit', 1000);
  lines.forEach((l, j) => txt(c, l, 600, 258 + j * 62 + (lines.length === 1 ? 30 : 0), '800 52px Outfit', '#fff', 'center'));
  const ga = c.globalAlpha;
  for (let j = 0; j < 3; j++) {
    const y = 404 + j * 122, ok = j === Qd.ok, hit = ok ? E.outC(inv(hitT, hitT + .18, t)) : 0, dim = !ok && t > hitT ? lerp(1, .4, inv(hitT, hitT + .2, t)) : 1;
    const press = ok ? 1 - .04 * decay(t, hitT, .2) : 1;
    c.globalAlpha = ga * dim;
    c.save(); c.translate(600, y + 50); c.scale(press, press); c.translate(-600, -(y + 50));
    roundFill(c, 150, y, 900, 100, 28, hit > 0 ? rgba(mix([255, 255, 255], [43, 214, 123], hit), .16 + .84 * hit) : 'rgba(255,255,255,.12)');
    c.strokeStyle = hit > 0 ? KD.green : 'rgba(255,255,255,.28)'; c.lineWidth = 2.5; c.beginPath(); c.roundRect(150, y, 900, 100, 28); c.stroke();
    c.fillStyle = [KD.cyan, KD.yellow, KD.pink][j]; c.beginPath(); c.arc(206, y + 50, 28, 0, TAU); c.fill();
    txt(c, 'ABC'[j], 206, y + 61, '800 30px Outfit', '#1b1240', 'center');
    txt(c, Qd.a[j], 258, y + 62, '600 36px Outfit', '#fff');
    if (hit > 0) { c.fillStyle = '#fff'; c.beginPath(); c.arc(996, y + 50, 26 * hit, 0, TAU); c.fill(); checkMark(c, 996, y + 50, 1.9 * hit, '#18a45a', 6); }
    c.restore();
    if (ok && hit > 0 && hit < 1) { // a burst of sparks off the right answer
      for (let s = 0; s < 14; s++) { const an = s * TAU / 14, r = 60 + 120 * hit; c.fillStyle = [KD.yellow, KD.cyan, KD.pink, '#fff'][s % 4]; c.globalAlpha = ga * (1 - hit); c.fillRect(996 + Math.cos(an) * r - 5, y + 50 + Math.sin(an) * r - 5, 10, 10); }
    }
  }
  c.globalAlpha = ga;
  touch(c, t, hitT, 860 + 30 * i, 404 + Qd.ok * 122 + 50, false);
}
function unlockLayer(c, t) {
  const ga = c.globalAlpha, k = E.outC(inv(F.unlock, F.unlock + .3, t));
  const g = c.createRadialGradient(600, 300, 0, 600, 300, 720); g.addColorStop(0, `rgba(255,170,90,${.5 * k})`); g.addColorStop(1, 'rgba(255,170,90,0)');
  c.fillStyle = g; c.fillRect(0, 0, 1200, 800);
  c.save(); c.translate(600, 280); c.rotate((t - F.unlock) * .5);
  for (let i = 0; i < 14; i++) { c.rotate(TAU / 14); c.fillStyle = `rgba(255,224,160,${.11 * k})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(900, -70); c.lineTo(900, 70); c.closePath(); c.fill(); }
  c.restore();
  for (let i = 0; i < 70; i++) { // confetti
    const tt = t - F.unlock - .1 - hash(i) * .12; if (tt <= 0) continue;
    const vx = (hash(i + 1) - .5) * 1300, vy = -420 - hash(i + 2) * 620, x = 600 + vx * tt, y = 290 + vy * tt + 1000 * tt * tt; if (y > 840) continue;
    c.save(); c.translate(x, y); c.rotate(tt * (6 + 8 * hash(i + 3))); c.globalAlpha = ga * clamp(2.2 - tt * 1.4);
    c.fillStyle = [KD.yellow, KD.cyan, KD.pink, KD.green, '#fff'][i % 5]; c.fillRect(-9, -5, 18, 10); c.restore();
  }
  c.globalAlpha = ga;
  const sp = E.outBack(inv(F.unlock + .04, F.unlock + .32, t), 1.6), op = E.outBack(inv(F.unlock + .14, F.unlock + .46, t), 2.2);
  padlock(c, 600, 292, 1.5 * sp, op, 0, op > .5 ? KD.green : KD.orange);
  const bA = E.outBack(inv(F.bravo, F.bravo + .35, t), 2);
  if (bA > 0) { c.save(); c.translate(600, 548); c.scale(bA, bA); txt(c, S.tab.bravo, 0, 0, '800 88px Outfit', '#fff', 'center'); c.restore(); }
  const sA = E.outC(inv(F.bravo + .12, F.bravo + .45, t)); c.globalAlpha = ga * sA; txt(c, S.tab.score, 600, 608, '600 36px Outfit', '#ffe7c9', 'center'); c.globalAlpha = ga;
  const pA = E.outBack(inv(F.plus, F.plus + .35, t), 2.4);
  if (pA > 0) { c.save(); c.translate(600, 694); c.scale(pA, pA); roundFill(c, -146, -44, 292, 88, 44, KD.orange); txt(c, S.tab.plus, 0, 16, '800 46px Outfit', '#fff', 'center'); c.restore(); }
}
function tabletScreen(c, t) {
  const vStart = E.ioC(inv(D.vid, D.vid + .35, t));
  if (t < D.vid + .35) { c.save(); c.translate(0, -800 * vStart); childHome(c, t); c.restore(); }
  if (t >= D.vid) {
    const blur = t >= EC.lock && t < F.resume + .45 ? 18 * pr(EC.lock, EC.lock + .25, t) * (1 - pr(F.resume, F.resume + .4, t)) : 0;
    c.save(); c.translate(0, 800 * (1 - vStart)); drawVideoAt(c, t, blur); c.restore();
  }
  if (t >= EC.lock && t < F.resume + .45) {
    c.save(); c.translate(0, 800 * E.ioC(inv(F.resume, F.resume + .4, t)));
    if (t < F.start + .32) lockLayer(c, t);
    if (t >= F.start) quizLayer(c, t);
    if (t >= F.unlock) unlockLayer(c, t);
    c.restore();
  }
  // Kizzo's timer sits above every app: it arrives from the parent's phone
  const ba = E.outBack(inv(D.tokenEnd - .02, D.tokenEnd + .25, t), 1.8) * (1 - pr(F.start, F.start + .2, t)) + (t > F.resume ? pr(F.resume + .1, F.resume + .4, t) : 0);
  timerBadge(c, t, Math.min(1.2, ba));
}
function drawTabletV3(c, t) {
  const din = devIn(t), A = 1 - devOut(t); if (din <= .003 || A <= .003) return;
  const st = tabletState(t), P = proj(st.x, st.y, 0); if (!P) return;
  const s = P.s * st.k * lerp(.72, 1, din) * lerp(1, .82, devOut(t));
  c.setTransform(s, 0, 0, s, P.x, P.y);
  const body = clamp(din * 1.6 - .5);
  c.globalAlpha = A * body;
  const g = c.createLinearGradient(-320, -220, 320, 220); g.addColorStop(0, '#2d2a36'); g.addColorStop(1, '#0b0c14');
  c.beginPath(); c.roundRect(-320, -220, 640, 440, 36); c.fillStyle = g; c.fill();
  c.globalAlpha = A; c.setLineDash([2200 * din, 4000]); // the outline draws itself around the child's light
  c.lineWidth = 3; c.strokeStyle = rgba(ORANGE_HI, .9); c.stroke();
  c.lineWidth = 10; c.strokeStyle = rgba(ORANGE, .16); c.stroke(); c.setLineDash([]);
  c.globalAlpha = A * body; c.fillStyle = '#1c1c2a'; c.beginPath(); c.arc(-310, 0, 4, 0, TAU); c.fill();
  c.beginPath(); c.roundRect(-300, -200, 600, 400, 22); c.fillStyle = '#04060b'; c.fill();
  const sa = A * pr(B.screens, B.screens + .35, t);
  if (sa > .003) {
    c.save(); c.beginPath(); c.roundRect(-300, -200, 600, 400, 22); c.clip();
    c.translate(-300, -200); c.scale(TS, TS); c.globalAlpha = sa;
    tabletScreen(c, t);
    c.restore();
  }
  c.globalAlpha = A * body; glass(c, -300, -200, 600, 400, 22);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}

/* ---- the lesson page, the questions in flight, the 20:00 token ---- */
function drawSheetV3(c, t) {
  const inK = E.outC(inv(A3.sheet, A3.sheet + .5, t)), outK = E.inC(inv(A3.sheetOut, A3.sheetOut + .5, t));
  if (inK <= 0 || outK >= 1) return;
  const P = proj(SHEET.x, SHEET.y + 900 * (1 - inK) + 900 * outK, SHEET.z); if (!P) return;
  const s = P.s * SHEET.sc, rot = SHEET.rot + .15 * (1 - inK) - .1 * outK, cs = Math.cos(rot) * s, sn = Math.sin(rot) * s;
  c.setTransform(cs, sn, -sn, cs, P.x, P.y);
  c.globalAlpha = .5; c.fillStyle = '#000'; c.filter = 'blur(28px)'; c.fillRect(-262, -342, 560, 740); c.filter = 'none';
  drawSheet(c, t, 1, 1, false);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}
function packetPos(k, u) {
  const ps = phoneState(A3.send), a = [ps.x, ps.y - 40, ps.z - 10];
  const b = [TBL.x + 80 + 42 * k, TBL.y - 100, 0];
  const m = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 320 - k * 40, -260];
  const q = 1 - u;
  return [q * q * a[0] + 2 * q * u * m[0] + u * u * b[0], q * q * a[1] + 2 * q * u * m[1] + u * u * b[1], q * q * a[2] + 2 * q * u * m[2] + u * u * b[2]];
}
function drawPackets(c, t) {
  for (let k = 0; k < 3; k++) {
    const t0 = A3.send + k * PKT.gap; if (t < t0 || t > t0 + PKT.dur + .06) continue;
    const u = E.ioC(inv(t0, t0 + PKT.dur, t)), fade = 1 - inv(t0 + PKT.dur - .02, t0 + PKT.dur + .06, t);
    c.globalCompositeOperation = 'lighter';
    for (let j = 9; j >= 1; j--) {
      const uj = E.ioC(inv(t0, t0 + PKT.dur, t - j * .02)); if (uj <= 0) continue;
      const q = packetPos(k, uj), p = proj(q[0], q[1], q[2]); if (p) glow(c, SP.oh, p.x, p.y, (18 - j) * p.s, .55 * (1 - j / 10) * fade);
    }
    const q = packetPos(k, u), P = proj(q[0], q[1], q[2]); if (!P) continue;
    const sz = lerp(26, 16, u) * P.s, rot = (1 - u) * (k - 1) * .8;
    glow(c, SP.o, P.x, P.y, sz * 2.6, .6 * fade);
    c.globalCompositeOperation = 'source-over';
    c.setTransform(Math.cos(rot), Math.sin(rot), -Math.sin(rot), Math.cos(rot), P.x, P.y); c.globalAlpha = fade;
    const g = c.createLinearGradient(-sz, -sz, sz, sz); g.addColorStop(0, rgb(ORANGE_HI)); g.addColorStop(1, rgb(ORANGE));
    c.beginPath(); c.roundRect(-sz, -sz, sz * 2, sz * 2, sz * .4); c.fillStyle = g; c.fill();
    c.fillStyle = '#fff'; c.font = `800 ${(sz * 1.3).toFixed(1)}px Outfit`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('?', 0, sz * .46);
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  }
  c.globalCompositeOperation = 'source-over';
}
const HOVER = t => [-205 + 6 * Math.sin(t * 2.1), -70 + 8 * Math.sin(t * 1.7), -200];
function stickerState(t) {
  const ps = phoneState(t), chip = [ps.x - 16, ps.y - 108, ps.z - 2], hv = HOVER(t);
  if (t < D.token) {
    const k = E.outBack(inv(D.pick + .1, D.pick + .55, t), 1.25), arc = Math.sin(PI * clamp(k)) * 60;
    return { p: [lerp(chip[0], hv[0], k), lerp(chip[1], hv[1], k) - arc, lerp(chip[2], hv[2], k)], w: lerp(36, 250, k), h: lerp(18, 96, k), m: 0, a: clamp(k * 8), u: 0 };
  }
  const u = E.ioC(inv(D.token, D.tokenEnd, t)), h0 = HOVER(D.token), b = [TBL.x + 220, TBL.y - 164, 0], m = [(h0[0] + b[0]) / 2, -330, -330], q = 1 - u;
  const p = [0, 1, 2].map(i => q * q * h0[i] + 2 * q * u * m[i] + u * u * b[i]);
  return { p, w: lerp(250, 118, u), h: lerp(96, 38, u), m: inv(.04, .2, u), a: 1, u };
}
function drawNotifPop(c, t) {
  const k = E.outBack(inv(G.notif + .3, G.notif + .75, t), 1.25), out = 1 - pr(A5.out - .15, A5.out + .25, t);
  if (k <= 0 || out <= 0) return;
  const ps = phoneState(t), from = [ps.x, ps.y - 241, ps.z - 2], to = [-250 + 5 * Math.sin(t * 1.8), -150 + 6 * Math.sin(t * 1.4), -260];
  const p = [0, 1, 2].map(i => lerp(from[i], to[i], k)), P = proj(p[0], p[1], p[2]); if (!P) return;
  c.globalCompositeOperation = 'lighter'; glow(c, SP.b, P.x, P.y, 520 * P.s * clamp(k), .3 * out); c.globalCompositeOperation = 'source-over';
  const sc = P.s * .8 * lerp(PSX / .8, 1, k);
  c.setTransform(sc, 0, 0, sc, P.x, P.y); c.globalAlpha = out * clamp(k * 4); c.translate(-368, -100);
  notifCard(c);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}
function drawToken(c, t) {
  if (t < D.pick + .1 || t > D.tokenEnd + .02) return;
  const st = stickerState(t), P = proj(st.p[0], st.p[1], st.p[2]); if (!P || st.a <= 0) return;
  c.globalCompositeOperation = 'lighter';
  if (st.u > 0) for (let j = 10; j >= 1; j--) { const sj = stickerState(t - j * .022); if (sj.u <= 0) continue; const p = proj(sj.p[0], sj.p[1], sj.p[2]); if (p) glow(c, SP.oh, p.x, p.y, (34 - j * 2) * p.s, .5 * (1 - j / 11)); }
  glow(c, st.m > .5 ? SP.o : SP.b, P.x, P.y, 160 * P.s * st.h / 96, .5 * st.a); glow(c, SP.w, P.x, P.y, 220 * P.s, .8 * Math.sin(PI * clamp(st.u / .24)));
  c.globalCompositeOperation = 'source-over';
  const w = st.w * P.s, h = st.h * P.s, col = mix(TEAL_RGB, ORANGE, st.m);
  c.setTransform(1, 0, 0, 1, P.x, P.y); c.globalAlpha = st.a;
  c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 24 * P.s; c.shadowOffsetY = 8 * P.s; roundFill(c, -w / 2, -h / 2, w, h, h / 2, rgb(col)); c.restore();
  c.font = `700 ${(h * .52).toFixed(1)}px Outfit`; c.textAlign = 'center'; c.fillStyle = '#fff';
  if (st.m < 1) { c.globalAlpha = st.a * (1 - st.m); c.fillText('20 min', 0, h * .19); }
  if (st.m > 0) { c.globalAlpha = st.a * st.m; c.font = `800 ${(h * .58).toFixed(1)}px Outfit`; c.fillText('20:00', 0, h * .21); }
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}

/* ---- the link between them (it replaces the rope) ---- */
function linkPts(t) {
  const ps = phoneState(t), a = [ps.x + 158, ps.y - 70, ps.z], b = [TBL.x - 326, TBL.y - 70, 0], m = [(a[0] + b[0]) / 2, a[1] - 150, -60];
  const out = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40, q = 1 - u; const P = proj(q * q * a[0] + 2 * q * u * m[0] + u * u * b[0], q * q * a[1] + 2 * q * u * m[1] + u * u * b[1], q * q * a[2] + 2 * q * u * m[2] + u * u * b[2]); out.push(P); }
  return out;
}
const linkA = t => pr(B.link - .05, B.link + .1, t) * (1 - pr(D.push - .1, D.push + .4, t));
function drawLink(c, t) {
  const A = linkA(t); if (A <= .003) return;
  const pts = linkPts(t), head = E.ioC(inv(B.link, B.linked, t)), n = Math.round(head * 40);
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  // a steady, quiet connection
  if (head >= 1) {
    c.setLineDash([2, 16]); c.lineDashOffset = -t * 60;
    c.beginPath(); pts.forEach((p, i) => p && (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.strokeStyle = rgba(ICE, .55 * A); c.lineWidth = 4; c.stroke(); c.setLineDash([]);
  }
  // the first connection: a light runs from the parent to the child
  const tr = 1 - pr(B.linked, B.linked + .5, t);
  if (tr > 0 && n > 0) {
    for (let i = 1; i <= n; i++) { const p = pts[i - 1], q = pts[i]; if (!p || !q) continue; const u = i / 40;
      c.strokeStyle = rgba(mix(BLUE_HI, ORANGE_HI, u), .9 * tr * A); c.lineWidth = 3; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
      c.strokeStyle = rgba(mix(BLUE, ORANGE, u), .18 * tr * A); c.lineWidth = 14; c.stroke(); }
    const h = pts[n]; if (h && head < 1) glow(c, SP.w, h.x, h.y, 46, .9 * A);
  }
  if (t > B.linked && t < B.linked + .6) { const q = inv(B.linked, B.linked + .6, t), P = proj(TBL.x, TBL.y, 0);
    if (P) { c.strokeStyle = rgba(ORANGE_HI, .6 * (1 - q)); c.lineWidth = 3; c.beginPath(); c.roundRect(P.x - (330 + 90 * q) * P.s, P.y - (230 + 90 * q) * P.s, (660 + 180 * q) * P.s, (460 + 180 * q) * P.s, 46 * P.s); c.stroke(); } }
  c.lineCap = 'butt'; c.globalCompositeOperation = 'source-over';
}
function drawLinkBadge(c, t) {
  const A = linkA(t) * E.outBack(inv(B.linked, B.linked + .3, t), 2.2); if (A <= .003) return;
  const P = linkPts(t)[20]; if (!P) return;
  c.setTransform(1, 0, 0, 1, P.x, P.y); c.globalAlpha = Math.min(1, A);
  c.fillStyle = '#2f9a5d'; c.beginPath(); c.arc(0, 0, 21 * P.s * A, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.stroke();
  checkMark(c, 0, 0, 1.2 * P.s * A, '#fff', 3.2);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}
function deviceGlows(c, t) {
  const A = devIn(t) * (1 - devOut(t)); if (A <= .003) return;
  c.globalCompositeOperation = 'lighter';
  const ps = phoneState(t), P = proj(ps.x, ps.y, ps.z), T = proj(TBL.x, TBL.y, 0);
  if (P) glow(c, SP.b, P.x, P.y, 520 * P.s, .13 * A * (1 + 1.2 * decay(t, A3.shot, .5) + .8 * decay(t, D.save, .5) + .9 * decay(t, G.notif, .6)));
  const lockDim = 1 - .45 * pr(EC.lock, EC.lock + .3, t) * (1 - pr(F.unlock, F.unlock + .3, t));
  if (T) {
    glow(c, SP.o, T.x, T.y, 720 * T.s, .12 * A * lockDim * (1 + 1.6 * decay(t, F.unlock, .9) + .8 * decay(t, A3.tray, .5) + .8 * decay(t, D.tokenEnd, .5)));
    if (t > F.unlock && t < F.unlock + 1.2) beams(c, T.x, T.y - 40 * T.s, 18, 1500, .03, t * .1, ORANGE_HI, .1 * (1 - inv(F.unlock, F.unlock + 1.2, t)) * A, 13);
  }
  c.globalCompositeOperation = 'source-over';
}
function drawMorph(c, t) {
  // the two lights of the battle become the two devices
  if (t < A1.snap || t > B.devices + .5) return;
  const k = E.ioC(inv(A1.snap + .02, B.devices + .05, t)), fade = 1 - pr(B.devices + .05, B.devices + .45, t);
  for (const [x0, x1, col, r] of [[-690, PHN.x, BLUE, 18], [690, TBL.x, ORANGE, 13]]) {
    const P = proj(lerp(x0, x1, k), lerp(150, 30, k) - Math.sin(PI * k) * 110, 0); if (!P) continue;
    sphere(c, P.x, P.y, r * (1 + .5 * k), col, { energy: fade, halo: fade, alpha: fade, flare: .4 * fade });
  }
}
function label(c, x, y, s, col, a) {
  if (a <= .003) return; const P = proj(x, y, 0); if (!P) return;
  const L = lay(s, 600, 24, .3);
  letters(c, L, P.x + 12, P.y, () => ({ a: a * .95, col: rgb(ICE) }));
  c.globalAlpha = a; c.fillStyle = rgb(col); c.beginPath(); c.arc(P.x + 12 - L.width / 2 - 20, P.y - 8, 6, 0, TAU); c.fill(); c.globalAlpha = 1;
}
function drawLabels(c, t) {
  label(c, PHN.x, PHN.y + 362, S.you, BLUE, pr(B.labels, B.labels + .4, t) * (1 - pr(A3.sheet - .2, A3.sheet + .1, t)));
  label(c, TBL.x, TBL.y + 362, S.kid, ORANGE, pr(B.labels + .1, B.labels + .5, t) * (1 - pr(D.push - .1, D.push + .3, t)));
}
/* ---- one caption at a time, at the top: the steps, then the child's side ---- */
function caption(c, t, s, n, t0, t1) {
  const px = fit(s, 800, 50, .04, 1380), L = lay(s, 800, px, .04), by = 112;
  const out = E.inQ(inv(t1, t1 + .28, t)), a0 = pr(t0, t0 + .25, t);
  const nw = n ? 66 : 0, gap = n ? 24 : 0, total = nw + gap + L.width, x0 = CX - total / 2;
  c.save(); c.globalAlpha = a0 * (1 - out); c.translate(CX, by - px * .35); c.scale(1, .22);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 900); g.addColorStop(0, 'rgba(2,7,17,.7)'); g.addColorStop(.6, 'rgba(2,7,17,.4)'); g.addColorStop(1, 'rgba(2,7,17,0)');
  c.fillStyle = g; c.fillRect(-950, -950, 1900, 1900); c.restore();
  if (n) {
    const p = E.outBack(inv(t0, t0 + .35, t), 2.2), cy = by - px * .36 - out * 16;
    c.globalAlpha = 1 - out; c.fillStyle = rgb(ORANGE); c.beginPath(); c.arc(x0 + 33, cy, 33 * p, 0, TAU); c.fill();
    c.font = `800 ${(38 * p).toFixed(1)}px Outfit`; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(String(n), x0 + 33, cy + 13 * p); c.globalAlpha = 1;
  }
  letters(c, L, x0 + nw + gap + L.width / 2, by - out * 16, (i, ch) => {
    const s0 = t0 + .06 + i * .012, p = inv(s0, s0 + .3, t); if (p <= 0) return null;
    return { a: E.outQ(p) * (1 - out), dy: (1 - E.outC(p)) * 18, blur: (1 - p) * 5, col: /[0-9]/.test(ch.ch) ? rgb(ORANGE) : '#fff' };
  });
}
function drawCaptions(c, t) {
  const C = [[B.step, A3.sheet - .2, S.steps[0], 1], [A3.sheet - .05, D.step - .2, S.steps[1], 2], [D.step - .05, D.tokenEnd - .05, S.steps[2], 3],
    [EC.lapse + .05, EC.zero + .1, S.later, 0], [EC.capLock, F.q[1] + .2, S.noAnswer, 0], [G.cap, A5.out + .05, S.follow, 0]];
  for (const [t0, t1, s, n] of C) if (t >= t0 && t <= t1 + .3) caption(c, t, s, n, t0, t1);
}
function drawStage(c, t) {
  drawMorph(c, t);
  deviceGlows(c, t);
  drawLink(c, t);
  // the paper, the screens and the type sit above the bloom, so the interfaces keep their true colours
  const ca = [cam.ox, cam.oy], cv = camV3(t);
  POST.push(o => {
    camArr(cv); cam.ox = ca[0]; cam.oy = ca[1];
    drawSheetV3(o, t); drawTabletV3(o, t); drawPhoneV3(o, t);
    drawLinkBadge(o, t); drawPackets(o, t); drawToken(o, t); drawNotifPop(o, t); drawLabels(o, t);
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
    drawCaptions(o, t);
  });
}


/* ---- the lesson page and the parent's real app screens ---- */
const INK = '#2c3f8c';
// the three questions come from the lesson: evaporation (sun), condensation (cloud), precipitation (rain)
function cycleIcon(c, x, y, r, k, col) {
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2; c.lineCap = 'round';
  if (k === 0) { c.beginPath(); c.arc(x, y, r * .45, 0, TAU); c.fill(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; c.beginPath(); c.moveTo(x + Math.cos(a) * r * .68, y + Math.sin(a) * r * .68); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.stroke(); } }
  else if (k === 1) { c.beginPath(); c.arc(x - r * .35, y + r * .1, r * .42, PI * .5, PI * 1.5); c.arc(x + r * .05, y - r * .2, r * .52, PI * 1.05, PI * 1.95); c.arc(x + r * .45, y + r * .12, r * .4, PI * 1.5, PI * .5); c.closePath(); c.fill(); }
  else { c.beginPath(); c.moveTo(x, y - r); c.bezierCurveTo(x + r * .2, y - r * .5, x + r * .72, y, x + r * .72, y + r * .32); c.arc(x, y + r * .32, r * .72, 0, PI); c.bezierCurveTo(x - r * .72, y, x - r * .2, y - r * .5, x, y - r); c.fill(); }
  c.lineCap = 'butt';
}
// word-wrap, cached per language and size
const WRAP = new Map();
function wrapBal(text, font, maxW) {
  const n = wrapLines(text, font, maxW).length; let w = maxW;
  while (w > 200 && wrapLines(text, font, w - 20).length === n) w -= 20;
  return wrapLines(text, font, w);
}
function wrapLines(text, font, maxW) {
  const key = text + '|' + font + '|' + maxW; let r = WRAP.get(key); if (r) return r;
  mctx.font = font; r = []; let line = '';
  for (const w of text.split(' ')) { const tryL = line ? line + ' ' + w : w; if (mctx.measureText(tryL).width > maxW && line) { r.push(line); line = w; } else line = tryL; }
  if (line) r.push(line); WRAP.set(key, r); return r;
}
const scanY = (t, h) => lerp(-h, h, E.ioS(inv(A3.scan, A3.shot - .03, t)));
function drawSheet(c, t, A, ca, inPhone) {
  // the lesson as the child wrote it: lined notebook paper, blue ink — centred on 0,0, the caller sets the transform
  if (A <= .003) return;
  const w = 280, h = 370;
  c.globalAlpha = A;
  const g = c.createLinearGradient(-w, -h, w, h); g.addColorStop(0, '#f8f3e8'); g.addColorStop(.6, '#efe8da'); g.addColorStop(1, '#e2d9c8');
  c.beginPath(); c.roundRect(-w, -h, 2 * w, 2 * h, 16); c.fillStyle = g; c.fill();
  c.save(); c.clip();
  c.globalAlpha = A * ca;
  const step = 29.5, y0 = -h + 58;
  for (let y = y0; y < h - 6; y += step) { c.fillStyle = 'rgba(120,160,215,.55)'; c.fillRect(-w, y + 7, 2 * w, 1.3); }
  c.fillStyle = 'rgba(226,120,120,.7)'; c.fillRect(-w + 50, -h, 1.8, 2 * h);
  c.fillStyle = INK; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  let y = y0;
  for (const para of S.page) {
    if (para === '') { y += step * .55; continue; }
    const title = para[0] === '#', txt = title ? para.slice(1) : para, font = title ? '27px KzHand' : '19.5px KzHand';
    c.font = font;
    for (const ln of wrapLines(txt, font, 2 * w - 92)) { c.fillText(ln, -w + 66, y); y += step; }
  }
  // the orange scan glow, as in the app's camera
  const sp = inv(A3.scan, A3.shot - .03, t);
  if (sp > 0 && sp < 1) {
    const yy = scanY(t, h), gg = c.createLinearGradient(0, yy - 46, 0, yy + 46);
    gg.addColorStop(0, 'rgba(240,120,60,0)'); gg.addColorStop(.5, inPhone ? 'rgba(240,120,60,.45)' : 'rgba(240,120,60,.2)'); gg.addColorStop(1, 'rgba(240,120,60,0)');
    c.globalAlpha = A; c.fillStyle = gg; c.fillRect(-w, yy - 46, 2 * w, 92);
    c.fillStyle = inPhone ? 'rgba(255,236,220,.95)' : 'rgba(255,200,160,.55)'; c.fillRect(-w + 8, yy - 1.5, 2 * w - 16, 3);
  }
  // paper shading
  c.globalAlpha = A;
  const sh = c.createRadialGradient(0, 0, 200, 0, 0, 520); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(70,55,30,.16)');
  c.fillStyle = sh; c.fillRect(-w, -h, 2 * w, 2 * h);
  c.restore(); c.globalAlpha = 1;
}
/* ---- the parent's app, rebuilt from the real Kizzo screens (drawn in 736 × 1600 screenshot units) ---- */
const AP = { ink: '#10242e', grey: '#5b6c74', blue: '#3aa6c4', orange: '#ef6a2c', green: '#2f9a5d' };
function txt(c, s, x, y, font, col, align = 'left') { c.font = font; c.fillStyle = col; c.textAlign = align; c.fillText(s, x, y); }
function statusBar(c, dark) {
  const col = dark ? '#fff' : '#111';
  txt(c, '9:41', 128, 70, '600 30px Outfit', col, 'center');
  c.fillStyle = '#000'; c.beginPath(); c.roundRect(254, 26, 228, 68, 34); c.fill();
  c.fillStyle = col; for (let i = 0; i < 4; i++) c.fillRect(528 + i * 10, 66 - i * 6, 7, 8 + i * 6);
  c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.roundRect(622, 48, 46, 24, 7); c.stroke(); c.fillRect(626, 52, 34, 16);
  c.beginPath(); c.arc(594, 70, 14, -PI * .78, -PI * .22); c.stroke(); c.beginPath(); c.arc(594, 70, 4, 0, TAU); c.fill();
}
function appHome(c, t) {
  const g = c.createLinearGradient(0, 0, 0, 1600); g.addColorStop(0, '#a9d7e6'); g.addColorStop(.5, '#dcdcd6'); g.addColorStop(1, '#f5c7aa');
  c.fillStyle = g; c.fillRect(0, 0, 736, 1600);
  statusBar(c, false);
  const A_ = S.app;
  txt(c, A_.hello, 40, 192, '700 54px Outfit', AP.ink); txt(c, A_.date, 40, 238, '400 26px Outfit', AP.grey);
  c.fillStyle = '#fff'; c.beginPath(); c.arc(665, 171, 32, 0, TAU); c.fill();
  c.beginPath(); c.roundRect(40, 276, 656, 736, 30); c.fill();
  c.strokeStyle = '#cfe8f1'; c.lineWidth = 5; c.beginPath(); c.arc(118, 353, 50, 0, TAU); c.stroke();
  c.fillStyle = AP.blue; c.beginPath(); c.arc(118, 353, 40, 0, TAU); c.fill(); txt(c, 'B', 118, 366, '500 36px Outfit', '#fff', 'center');
  txt(c, 'Ben', 197, 342, '700 32px Outfit', AP.ink);
  const live = t >= B.linked, st = live ? A_.online : A_.connecting; c.font = '500 22px Outfit'; const pw = c.measureText(st).width + 52;
  c.fillStyle = live ? '#e3f4ea' : '#eceff1'; c.strokeStyle = live ? '#9fd8b5' : '#cfd6da'; c.lineWidth = 2; c.beginPath(); c.roundRect(197, 357, pw, 42, 21); c.fill(); c.stroke();
  c.fillStyle = live ? AP.green : `rgba(91,108,116,${.4 + .4 * Math.sin(t * 9)})`; c.beginPath(); c.arc(220, 378, 5, 0, TAU); c.fill(); txt(c, st, 234, 386, '500 22px Outfit', live ? AP.green : AP.grey);
  txt(c, '· ' + A_.grade, 197 + pw + 12, 386, '400 22px Outfit', AP.grey);
  c.fillStyle = '#e6f3f7'; c.beginPath(); c.arc(641, 329, 28, 0, TAU); c.fill();
  c.fillStyle = '#fdeee6'; c.beginPath(); c.roundRect(62, 431, 612, 284, 24); c.fill();
  txt(c, A_.timeLeft, 84, 489, '400 23px Outfit', '#3c4b52'); c.fillStyle = AP.orange; c.fillRect(622, 474, 28, 4);
  c.fillStyle = '#f7c8b4'; c.beginPath(); c.roundRect(84, 508, 568, 14, 7); c.fill();
  c.fillStyle = '#eef3f6'; c.beginPath(); c.roundRect(84, 594, 568, 98, 22); c.fill();
  c.fillStyle = '#f4fafc'; c.strokeStyle = '#cfe7ef'; c.beginPath(); c.roundRect(62, 736, 612, 104, 22); c.fill(); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(120, 788, 30, 0, TAU); c.fill();
  txt(c, A_.auto, 172, 790, '600 28px Outfit', AP.ink); txt(c, t > D.home ? A_.autoSub20 : A_.autoSub, 172, 822, '400 21px Outfit', t > D.home ? AP.orange : AP.grey);
  // the action that starts it all
  const tap = decay(t, A3.tap, .35);
  c.fillStyle = tap > 0 ? '#d95a20' : AP.orange; c.beginPath(); c.roundRect(62, 855, 612, 136, 24); c.fill();
  c.save(); c.clip();
  if (t > A3.tap - .02) { const q = inv(A3.tap - .02, A3.tap + .4, t); c.fillStyle = `rgba(255,255,255,${.35 * (1 - q)})`; c.beginPath(); c.arc(420, 922, 40 + 420 * E.outC(q), 0, TAU); c.fill(); }
  c.restore();
  c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(117, 922, 32, 0, TAU); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.roundRect(101, 910, 32, 24, 5); c.stroke(); c.beginPath(); c.arc(117, 922, 7, 0, TAU); c.stroke();
  txt(c, A_.cta, 170, 908, '600 28px Outfit', '#fff');
  const sub = wrapLines(A_.ctaSub, '400 22px Outfit', 430); sub.forEach((l, i) => txt(c, l, 170, 942 + i * 27, '400 22px Outfit', 'rgba(255,255,255,.92)'));
  c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(626, 910); c.lineTo(638, 922); c.lineTo(626, 934); c.stroke();
  txt(c, A_.last30, 45, 1078, '600 22px Outfit', '#6b7c84');
  [['0', AP.orange], ['0%', AP.blue], ['0', AP.green]].forEach(([v, col], i) => {
    const x = 40 + i * 225; c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x, 1094, 206, 152, 24); c.fill();
    txt(c, v, x + 23, 1150, '700 40px Outfit', col); txt(c, A_.tiles[i], x + 23, 1192, '400 23px Outfit', AP.grey);
  });
  c.fillStyle = '#fff'; c.beginPath(); c.roundRect(40, 1328, 656, 210, 24); c.fill();
  c.fillStyle = '#111'; c.beginPath(); c.roundRect(240, 1572, 256, 8, 4); c.fill();
  touch(c, t, A3.tap, 420, 922, true);
}
function appCamera(c, t) {
  c.fillStyle = '#10171b'; c.fillRect(0, 0, 736, 1600); c.fillStyle = '#0b1114'; c.fillRect(0, 1275, 736, 325);
  statusBar(c, true);
  c.fillStyle = '#262f34'; c.beginPath(); c.roundRect(41, 121, 72, 72, 16); c.fill(); c.beginPath(); c.roundRect(622, 121, 72, 72, 16); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(66, 146); c.lineTo(88, 168); c.moveTo(88, 146); c.lineTo(66, 168); c.stroke();
  c.strokeStyle = '#f08a5a'; c.beginPath(); c.moveTo(662, 139); c.lineTo(648, 160); c.lineTo(664, 160); c.lineTo(652, 177); c.stroke();
  txt(c, S.app.page1, 368, 170, '700 30px Outfit', '#fff', 'center');
  // the page, live in the viewfinder
  c.save(); c.translate(368, 712); c.rotate(-.012); c.scale(1.13, 1.13); drawSheet(c, t, 1, 1, true); c.restore();
  // orange corners lock onto the page
  const lk = E.outBack(inv(A3.lock - .05, A3.lock + .25, t), 2.2), bs = lerp(1.12, 1, clamp(lk));
  c.strokeStyle = AP.orange; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const bx = 368 + sx * 325 * bs, by = 710 + sy * 488 * bs;
    c.beginPath(); c.moveTo(bx, by - sy * 60); c.lineTo(bx, by - sy * 14); c.quadraticCurveTo(bx, by, bx - sx * 14, by); c.lineTo(bx - sx * 60, by); c.stroke();
  }
  c.lineCap = 'butt';
  c.fillStyle = 'rgba(11,16,19,.92)'; c.beginPath(); c.roundRect(146, 1193, 444, 66, 33); c.fill();
  c.strokeStyle = '#3fbf86'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); checkPath(c, 189, 1226, 1.4); c.stroke(); c.lineCap = 'butt';
  c.font = '600 25px Outfit'; const hw = Math.min(330, c.measureText(S.app.hint).width); txt(c, S.app.hint, 218, 1235, '600 25px Outfit', '#fff'); void hw;
  c.fillStyle = '#242c31'; c.beginPath(); c.roundRect(67, 1367, 98, 98, 22); c.fill(); c.beginPath(); c.roundRect(571, 1367, 98, 98, 22); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.roundRect(98, 1400, 36, 30, 6); c.stroke(); c.beginPath(); c.arc(620, 1416, 15, -PI * .3, PI * 1.5); c.stroke();
  const press = 1 - .14 * decay(t, A3.shot, .3);
  c.fillStyle = '#d4652d'; c.beginPath(); c.arc(368, 1416, 72, 0, TAU); c.fill();
  c.fillStyle = '#0b1114'; c.beginPath(); c.arc(368, 1416, 63, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(368, 1416, 56 * press, 0, TAU); c.fill();
  c.beginPath(); c.roundRect(240, 1572, 256, 8, 4); c.fill();
}
function appReading(c, t) {
  const g = c.createLinearGradient(0, 0, 0, 1600); g.addColorStop(0, '#255866'); g.addColorStop(.42, '#13303a'); g.addColorStop(1, '#0a1418');
  c.fillStyle = g; c.fillRect(0, 0, 736, 1600);
  statusBar(c, true);
  txt(c, S.app.reading, 40, 378, '700 38px Outfit', '#fff'); txt(c, S.app.readingSub, 40, 424, '400 23px Outfit', '#9db3ba');
  c.fillStyle = 'rgba(255,255,255,.03)'; c.strokeStyle = 'rgba(95,170,190,.38)'; c.lineWidth = 2; c.beginPath(); c.roundRect(40, 498, 656, 664, 36); c.fill(); c.stroke();
  const p = pr(A3.detected + .05, A3.send - .02, t, E.ioS);
  for (const [x, r, a] of [[236, -.16, .75], [500, .16, .75], [368, 0, 1]]) { c.save(); c.translate(x, 664); c.rotate(r); c.scale(.32, .32); drawSheet(c, t, a, 1, false); c.restore(); }
  const sy = 600 + 100 * Math.sin(t * 6), lg = c.createLinearGradient(90, 0, 646, 0);
  lg.addColorStop(0, 'rgba(92,198,230,0)'); lg.addColorStop(.2, '#5cc6e6'); lg.addColorStop(.8, '#ee6b2d'); lg.addColorStop(1, 'rgba(238,107,45,0)');
  c.fillStyle = lg; c.fillRect(90, sy, 556, 4);
  const pct = String(Math.round(p * 100)); c.font = '800 96px Outfit'; const pw = c.measureText(pct).width;
  txt(c, pct, 368 - 22 - pw / 2 + pw / 2, 892, '800 96px Outfit', '#fff', 'center'); txt(c, '%', 368 - 22 + pw / 2 + 4, 892, '700 56px Outfit', '#45bde3');
  c.fillStyle = '#2a383e'; c.beginPath(); c.roundRect(78, 920, 580, 12, 6); c.fill();
  const bg = c.createLinearGradient(78, 0, 658, 0); bg.addColorStop(0, '#45bde3'); bg.addColorStop(1, '#ee6b2d');
  c.fillStyle = bg; c.beginPath(); c.roundRect(78, 920, Math.max(12, 580 * p), 12, 6); c.fill();
  S.app.steps.forEach((s, i) => {
    const y = 984 + i * 60, done = p >= [.3, .68, .99][i], active = !done && p >= [0, .3, .68][i];
    if (done) { c.fillStyle = '#1e6a48'; c.beginPath(); c.arc(97, y, 20, 0, TAU); c.fill(); c.strokeStyle = '#5ad49c'; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); checkPath(c, 97, y, 1.2); c.stroke(); c.lineCap = 'butt'; }
    else { c.strokeStyle = active ? '#5cc6e6' : '#4b5b61'; c.lineWidth = 3; c.beginPath(); c.arc(97, y, 19, 0, TAU); c.stroke(); if (active) { c.fillStyle = '#5cc6e6'; c.beginPath(); c.arc(97, y, 9, 0, TAU); c.fill(); } }
    txt(c, s, 136, y + 9, '500 26px Outfit', done || active ? '#fff' : '#6f8187');
  });
  c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.roundRect(240, 1572, 256, 8, 4); c.fill();
}
function checkPath(c, x, y, k) { c.moveTo(x - 7 * k, y); c.lineTo(x - 2 * k, y + 5 * k); c.lineTo(x + 8 * k, y - 6 * k); }

const LOGO_S = .56, LOGO_X = CX, LOGO_Y = 372;
const L_OR = LOGO.orangeCircle, L_HD = LOGO.headCircle;
const logoPt = (lx, ly) => [LOGO_X + lx * LOGO_S, LOGO_Y + ly * LOGO_S];

/* ===================================================================== */
/* ACT 5 — THE BRAND                                                      */
/* ===================================================================== */
const LP = { body: new Path2D(LOGO.paths.body), word: new Path2D(LOGO.paths.word) };
const WB = LOGO.wordBox; // [x0, y0, x1, y1] in logo units
function logoSetT(c, extra = 1) { c.setTransform(LOGO_S * extra, 0, 0, LOGO_S * extra, LOGO_X, LOGO_Y); }
function drawLogo(c, t) {
  if (t < A5.body) return;
  const bp = inv(A5.body, A5.body + .62, t), be = E.ioC(bp);
  const oc = [L_OR[0], L_OR[1]];
  // body: the embrace closes around the child
  c.save(); logoSetT(c);
  const a0 = 3.78, a1 = lerp(a0, -.75, be);
  c.beginPath(); c.moveTo(oc[0], oc[1]); c.arc(oc[0], oc[1], 1200, a0, a1, true); c.closePath(); c.clip();
  c.fillStyle = rgb(BLUE); c.fill(LP.body);
  c.restore();
  if (bp > 0 && bp < 1) { // light on the leading edge
    c.save(); logoSetT(c); c.clip(LP.body);
    c.globalCompositeOperation = 'lighter';
    const ex = oc[0] + Math.cos(a1) * 600, ey = oc[1] + Math.sin(a1) * 600;
    c.strokeStyle = rgba(WHITE, .85 * Math.sin(PI * bp)); c.lineWidth = 22; c.beginPath(); c.moveTo(oc[0], oc[1]); c.lineTo(ex, ey); c.stroke();
    c.strokeStyle = rgba(BLUE_HI, .5 * Math.sin(PI * bp)); c.lineWidth = 70; c.stroke();
    c.restore();
  }
  // wordmark: a light sweep writes "kizzo"
  const wp = inv(A5.word, A5.word + .6, t);
  if (wp > 0) {
    const x = lerp(WB[0] - 60, WB[2] + 60, E.ioC(wp));
    c.save(); logoSetT(c);
    const g = c.createLinearGradient(x - 70, 0, x + 10, 0); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = wp >= 1 ? '#fff' : g; c.fill(LP.word);
    if (wp < 1) { c.clip(LP.word); c.globalCompositeOperation = 'lighter'; const g2 = c.createLinearGradient(x - 50, 0, x + 10, 0);
      g2.addColorStop(0, rgba(BLUE_HI, 0)); g2.addColorStop(.8, rgba(BLUE_HI, .9)); g2.addColorStop(1, rgba(BLUE_HI, 0)); c.fillStyle = g2; c.fillRect(x - 50, WB[1] - 20, 60, WB[3] - WB[1] + 40); }
    c.restore();
  }
  // final glint across the whole mark
  const gp = inv(A5.glint, A5.glint + .75, t);
  if (gp > 0 && gp < 1) {
    c.save(); logoSetT(c);
    const all = new Path2D(); all.addPath(LP.body); all.addPath(LP.word);
    all.moveTo(L_OR[0] + L_OR[2], L_OR[1]); all.arc(L_OR[0], L_OR[1], L_OR[2], 0, TAU); all.moveTo(L_HD[0] + L_HD[2], L_HD[1]); all.arc(L_HD[0], L_HD[1], L_HD[2], 0, TAU);
    c.clip(all); c.globalCompositeOperation = 'lighter';
    const x = lerp(-700, 700, E.ioS(gp)); c.translate(x, 0); c.rotate(.35);
    const g = c.createLinearGradient(-90, 0, 90, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.42)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(-90, -900, 180, 1800);
    c.restore();
  }
}

function endCard(c, t) {
  // tagline
  if (t > A5.tagline) {
    const px = fit(S.tagline, 700, 56, .05, 1400), L = lay(S.tagline, 700, px, .05), by = 728;
    letters(c, L, CX, by, (i) => { const s = A5.tagline + i * .022, p = inv(s, s + .5, t); if (p <= 0) return null;
      return { a: E.outQ(p), dy: (1 - E.outC(p)) * 26, blur: (1 - p) * 8, col: '#fff' }; }, true);
    const s = A5.tagline + (L.chars.length - 1) * .022 + .1, p = E.outBack(inv(s, s + .35, t), 2.2);
    if (p > 0) { const x = lastCharX(L, CX), y = by - px * .105; c.fillStyle = rgb(ORANGE); c.beginPath(); c.arc(x, y, px * .1 * p, 0, TAU); c.fill(); }
  }
  // call to action
  if (t > A5.cta) {
    const p = inv(A5.cta, A5.cta + .5, t), e = E.outBack(p, 1.4), a = E.outQ(clamp(p * 1.6));
    const px = 32, L = lay(S.cta, 700, px, .1), bw = L.width + 92 + 38, bh = 88, x0 = CX - bw / 2, y0 = 786;
    c.globalCompositeOperation = 'lighter'; glow(c, SP.o, CX, y0 + bh / 2, 260, .16 * a); c.globalCompositeOperation = 'source-over';
    c.setTransform(lerp(.92, 1, e), 0, 0, lerp(.92, 1, e), CX, y0 + bh / 2); c.globalAlpha = a;
    c.beginPath(); c.roundRect(-bw / 2, -bh / 2, bw, bh, 20); c.fillStyle = rgb(ORANGE); c.fill();
    const tx = -bw / 2 + 44 + L.width / 2;
    c.setTransform(1, 0, 0, 1, 0, 0);
    const sc2 = lerp(.92, 1, e);
    c.save(); c.translate(CX, y0 + bh / 2); c.scale(sc2, sc2);
    letters(c, L, tx, 11.5, () => ({ a, col: '#fff' }));
    const ax = tx + L.width / 2 + 22; c.globalAlpha = a; c.strokeStyle = '#fff'; c.lineWidth = 3.4; c.lineCap = 'round'; c.lineJoin = 'round';
    const nudge = 4 * Math.sin(Math.max(0, t - A5.cta - .6) * 3.2) * pr(A5.cta + .6, A5.cta + 1, t);
    c.beginPath(); c.moveTo(ax + nudge, 0); c.lineTo(ax + 22 + nudge, 0); c.moveTo(ax + 13 + nudge, -9); c.lineTo(ax + 22 + nudge, 0); c.lineTo(ax + 13 + nudge, 9); c.stroke();
    // light sweep across the button
    const sp = inv(A5.cta + .45, A5.cta + 1.05, t);
    if (sp > 0 && sp < 1) { c.beginPath(); c.roundRect(-bw / 2, -bh / 2, bw, bh, 20); c.clip(); c.globalCompositeOperation = 'lighter';
      const x = lerp(-bw / 2 - 80, bw / 2 + 80, E.ioS(sp)), g = c.createLinearGradient(x - 60, 0, x + 60, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-bw, -bh, bw * 2, bh * 2); }
    c.restore(); c.globalAlpha = 1; c.lineCap = 'butt';
    const ua = pr(A5.url, A5.url + .5, t);
    const Lu = lay(S.url, 500, 26, .08); letters(c, Lu, CX, y0 + bh + 54, () => ({ a: ua * .9, col: rgb(STEEL) }));
  }
}

/* ===================================================================== */
/* the brand: the two lights leave the devices and become the logo       */
/* ===================================================================== */
function drawPairV3(c, t) {
  if (t < A5.out) return;
  camArr(camV3(t));
  const ph = proj(PHN.x, PHN.y, 0), tb = proj(TBL.x, TBL.y, 0); if (!ph || !tb) return;
  const em = pr(A5.out + .05, A5.out + .45, t, E.outC), cv = pr(A5.converge, A5.converge + .9, t, E.ioC);
  const hov = pr(A5.out + .3, A5.converge, t, E.ioS), arc = Math.sin(PI * cv) * 90;
  const [lpx, lpy] = logoPt(L_HD[0], L_HD[1]), [lcx, lcy] = logoPt(L_OR[0], L_OR[1]);
  const p0 = [lerp(ph.x, CX - 260, hov), lerp(ph.y, CY + 10, hov)], c0 = [lerp(tb.x, CX + 260, hov), lerp(tb.y, CY + 10, hov)];
  const P = [lerp(p0[0], lpx, cv), lerp(p0[1], lpy, cv) - arc], C = [lerp(c0[0], lcx, cv), lerp(c0[1], lcy, cv) - arc];
  const rP = lerp(24, L_HD[2] * LOGO_S, cv) * em, rC = lerp(17, L_OR[2] * LOGO_S, cv) * em;
  const halo = lerp(1, .18, cv) * (1 - pr(A5.body, A5.body + 1, t));
  const land = decay(t, A5.converge + .9, .5);
  if (land > 0) { c.globalCompositeOperation = 'lighter'; glow(c, SP.w, (P[0] + C[0]) / 2, (P[1] + C[1]) / 2, 260, .25 * land); c.globalCompositeOperation = 'source-over'; }
  if (rP > .5) sphere(c, P[0], P[1], rP, BLUE, { energy: .85, flat: cv, halo });
  if (rC > .5) sphere(c, C[0], C[1], rC, ORANGE, { energy: 1, flat: cv, halo });
}

/* ===================================================================== */
/* master timeline                                                        */
/* ===================================================================== */
function shakeAt(t) {
  const a = 9 * decay(t, A1.freeze, .3) + 5 * decay(t, A1.battle + .2, .25) + 10 * decay(t, A1.snap, .3)
    + 3 * decay(t, EC.lock, .3) + 2 * decay(t, A3.lock, .2) + 2.5 * decay(t, F.unlock, .35);
  return [noise(t * 43) * a, noise(t * 47 + 11) * a];
}
const POST = [];
function renderScene(t) {
  const c = sc; POST.length = 0;
  background(c, t);
  const [sx, sy] = shakeAt(t);
  if (t > A5.converge) beams(c, LOGO_X, LOGO_Y - 60, 12, 1300, .03, t * .025, BLUE_HI, .045 * pr(A5.converge, A5.cta, t), 21);
  // ---- the hook ----
  if (t < A1.slice + .13) {
    camArr(frontal); cam.ox = sx; cam.oy = sy;
    dust(c, t, inv(.3, 1, t) * (1 - inv(2.4, 3.3, t)) * .9, 1400);
    drawHook(c, t);
  }
  // ---- the battle ----
  if (t >= A1.slice && t < A1.snap + .4) {
    camArr(frontal); cam.ox = sx; cam.oy = sy;
    const cut = t < A1.slice + .13;
    if (cut) { // a blade of light slices the frame and reveals the tension
      const p = E.inQ(inv(A1.slice, A1.slice + .13, t)), an = 1.05, nx = Math.cos(an), ny = Math.sin(an), d = lerp(1250, -1250, p);
      c.save(); c.beginPath();
      const px = CX + nx * d, py = CY + ny * d, tx = -ny, ty = nx;
      c.moveTo(px + tx * 3000, py + ty * 3000); c.lineTo(px - tx * 3000, py - ty * 3000); c.lineTo(px - tx * 3000 + nx * 4000, py - ty * 3000 + ny * 4000); c.lineTo(px + tx * 3000 + nx * 4000, py + ty * 3000 + ny * 4000); c.closePath();
      c.fillStyle = rgb(DEEP); c.fill(); c.clip();
      drawTension(c, t); c.restore();
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (const [lw, a] of [[60, .18], [14, .5], [3, 1]]) { c.strokeStyle = rgba(ICE, a); c.lineWidth = lw; c.beginPath(); c.moveTo(px + tx * 3000, py + ty * 3000); c.lineTo(px - tx * 3000, py - ty * 3000); c.stroke(); }
      c.lineCap = 'butt'; c.globalCompositeOperation = 'source-over';
    } else drawTension(c, t);
  }
  // ---- the solution: phone, tablet, lesson, rule, lock, quiz ----
  if (t >= A1.snap) {
    camArr(camV3(t)); cam.ox = sx; cam.oy = sy;
    dust(c, t, .5 * pr(A1.snap, A1.snap + 1, t) * (1 - pr(A5.out, A5.converge, t)), 1000);
    drawStage(c, t);
  }
  if (t >= A5.converge - .1) { camArr(frontal); dust(c, t, .35 * pr(A5.converge, A5.converge + 1, t), 1000); }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.setTransform(1, 0, 0, 1, 0, 0);
}

/* ---------- post: bloom, grade, transitions, grain ---------- */
const VIG = (() => { const c = mk(W, H), g = c.getContext('2d'); g.setTransform(1, 0, 0, H / W, 0, 0);
  const gr = g.createRadialGradient(CX, CX, W * .22, CX, CX, W * .62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.62)');
  g.fillStyle = gr; g.fillRect(0, 0, W, W); return c; })();
const GRAIN = (() => { const out = [], r = rng(9);
  for (let k = 0; k < 3; k++) { const c = mk(960, 540), g = c.getContext('2d'), d = g.createImageData(960, 540);
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + ((r() + r() + r()) - 1.5) * 70; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); out.push(c); } return out; })();
function grade(t) {
  let sat = 1, br = 1;
  const fr = inv(A1.freeze, A1.freeze + .02, t) * (1 - inv(A1.shatter - .05, A1.shatter + .2, t));
  sat -= .5 * fr;
  return { sat, br };
}
function flashAt(t) {
  return .24 * decay(t, A1.burst, .22) + .3 * decay(t, A1.freeze, .12) + .14 * decay(t, A1.slice + .12, .15) + .3 * decay(t, A1.snap, .1)
    + .05 * decay(t, B.linked, .2) + .05 * decay(t, A3.shot, .2) + .1 * decay(t, EC.lock, .15) + .14 * decay(t, F.unlock, .25);
}
function caAt(t) {
  return 7 * decay(t, A1.freeze, .18) + 9 * decay(t, A1.snap, .25) + 4 * decay(t, EC.lock, .2) + 3 * decay(t, F.unlock, .2);
}
function composite(t, out) {
  const g = grade(t);
  out.setTransform(1, 0, 0, 1, 0, 0); out.globalAlpha = 1; out.globalCompositeOperation = 'source-over'; out.filter = 'none';
  out.fillStyle = rgb(DEEP); out.fillRect(0, 0, W, H);
  const f = (g.sat < .999 || g.br < .999) ? `saturate(${g.sat.toFixed(3)}) brightness(${g.br.toFixed(3)})` : 'none';
  out.filter = f;
  out.drawImage(scene, 0, 0);
  out.filter = 'none';
  // bloom (approximate threshold via contrast)
  b1c.globalCompositeOperation = 'copy'; b1c.filter = 'contrast(1.9) brightness(.95) blur(3px)'; b1c.drawImage(out.canvas, 0, 0, 480, 270); b1c.filter = 'none';
  b2c.globalCompositeOperation = 'copy'; b2c.filter = 'blur(4px)'; b2c.drawImage(b1, 0, 0, 240, 135); b2c.filter = 'none';
  const bk = 1 - .3 * pr(A1.snap, B.devices, t);
  out.globalCompositeOperation = 'lighter'; out.globalAlpha = .38 * bk; out.drawImage(b1, 0, 0, W, H); out.globalAlpha = .45 * bk; out.drawImage(b2, 0, 0, W, H);
  // chromatic aberration on impacts
  const ca = caAt(t);
  if (ca > .3) {
    tc.globalCompositeOperation = 'copy'; tc.globalAlpha = 1; tc.drawImage(out.canvas, 0, 0);
    tc.globalCompositeOperation = 'multiply'; tc.fillStyle = '#ff0000'; tc.fillRect(0, 0, W, H);
    out.globalCompositeOperation = 'multiply'; out.globalAlpha = 1; out.fillStyle = '#00ffff'; out.fillRect(0, 0, W, H);
    out.globalCompositeOperation = 'lighter'; const k = 1 + ca / 900; out.drawImage(tmp, CX - CX * k, CY - CY * k, W * k, H * k);
  }
  // flash
  const fl = flashAt(t);
  if (fl > .003) { out.globalCompositeOperation = 'lighter'; out.globalAlpha = Math.min(1, fl); out.fillStyle = 'rgb(170,215,245)'; out.fillRect(0, 0, W, H); }
  out.globalCompositeOperation = 'source-over'; out.globalAlpha = 1; out.drawImage(VIG, 0, 0);
  for (const f of POST) f(out);
  out.globalAlpha = 1; out.globalCompositeOperation = 'source-over'; out.setTransform(1, 0, 0, 1, 0, 0);
  brandLayer(out, t);
}
function brandLayer(c, t) {
  // the parent, the child, the logo and the end card sit above the bloom, so the mark keeps its exact colours
  if (t < A5.out) return;
  drawPairV3(c, t);
  if (t >= A5.tagline) { camArr(frontal); endCard(c, t); }
  if (t >= A5.body) drawLogo(c, t);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.setTransform(1, 0, 0, 1, 0, 0);
}
function finish(t) {
  vc.setTransform(1, 0, 0, 1, 0, 0);
  vc.globalCompositeOperation = 'overlay'; vc.globalAlpha = .075;
  const k = Math.floor(t * 24) % 3; vc.drawImage(GRAIN[k], 0, 0, W, H);
  vc.globalCompositeOperation = 'source-over'; vc.globalAlpha = 1;
}
function renderFrame(t, opt = {}) {
  t = clamp(t, 0, Q.duration);
  const n = opt.subframes || 1, shutter = opt.shutter || (1 / 60);
  if (n <= 1) {
    renderScene(t); composite(t, cc);
    vc.globalCompositeOperation = 'copy'; vc.globalAlpha = 1; vc.drawImage(comp, 0, 0);
  } else {
    for (let i = 0; i < n; i++) {
      const ti = clamp(t - shutter / 2 + shutter * (i + .5) / n, 0, Q.duration);
      renderScene(ti); composite(ti, cc);
      vc.globalCompositeOperation = i === 0 ? 'copy' : 'source-over'; vc.globalAlpha = 1 / (i + 1); vc.drawImage(comp, 0, 0);
    }
    vc.globalAlpha = 1;
  }
  finish(t);
}

/* ---------- public API ---------- */
async function loadFonts() {
  const ps = [];
  for (const [w, url] of Object.entries(window.KZ_FONTS)) { const ff = new FontFace('Outfit', `url(${url})`, { weight: w }); ps.push(ff.load().then(f => document.fonts.add(f))); }
  if (window.KZ_HAND) ps.push(new FontFace('KzHand', `url(${window.KZ_HAND})`).load().then(f => document.fonts.add(f))); // a pupil's handwriting (Patrick Hand, OFL)
  await Promise.all(ps);
}
window.KZ = {
  W, H, duration: Q.duration, cues: Q,
  ready: loadFonts(),
  renderFrame,
  setLang(l) { if (STRINGS[l]) { S = STRINGS[l]; LC.clear(); } },
};
})();