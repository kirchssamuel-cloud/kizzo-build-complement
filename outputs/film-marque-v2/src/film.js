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
  [Q.a2.start, [8, 26, 56], .7, 1100], [Q.a2.stop - .05, [16, 42, 84], 1, 1250], [Q.a2.stop + .05, [8, 22, 46], .45, 1000], [Q.a2.unravel + .35, [10, 34, 72], .9, 1100],
  [Q.a4.combine, [12, 40, 84], 1, 1150], [Q.a4.earned - .05, [24, 46, 86], 1, 1300], [Q.a4.harmony + 1, [12, 38, 82], .9, 1150], [Q.duration, [12, 38, 82], .9, 1150]];
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
  const endA = pr(20.4, 21.6, t, E.ioS);
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
  radial(c, CX - 700, CY + 120, 980, ORANGE, .15 * intro * (1 + .6 * pull), .3);
  radial(c, CX + 700, CY + 120, 980, BLUE, .17 * intro * (1 + .6 * pull), .3);
  const jit = pull * 3.5, R = 84, y0 = CY + 150;
  let xl = CX - 640 - 50 * pull + noise(t * 37) * jit, xr = CX + 640 + 50 * pull + noise(t * 41 + 9) * jit;
  if (after > 0) { const k = E.outExpo(clamp(after / .3)); xl -= 240 * k; xr += 240 * k; }
  // the rope
  const A = 22 * decay(t, A1.every, .8) + 34 * decay(t, A1.battle, 1.1) + 16 * decay(t, A1.battle + .18, .8) + 9 * pull;
  const g = c.createLinearGradient(xl, 0, xr, 0);
  g.addColorStop(0, rgba(ORANGE_HI, 1)); g.addColorStop(.5, rgba(WHITE, 1)); g.addColorStop(1, rgba(BLUE_HI, 1));
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
    glow(c, left ? SP.oh : SP.bh, x, y, 6 + 4 * hash(i + 5), .7 * intro * Math.sin(PI * u0 * 2) * (.6 + .4 * pull));
  }
  // halos
  c.lineWidth = 2;
  c.strokeStyle = rgba(ICE, .75 * intro); c.beginPath(); c.arc(xl, y0, R, 0, TAU); c.stroke();
  c.strokeStyle = rgba(BLUE_HI, .45 * intro); c.beginPath(); c.arc(xr, y0, R, 0, TAU); c.stroke();
  sphere(c, xl, y0, 13, ORANGE, { energy: 1, flare: .5 });
  sphere(c, xr, y0, 18, BLUE, { energy: .9, flare: .3 });
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
      const nx = (lx - CX) / 720, col = nx < 0 ? mix(WHITE, WARM, Math.min(1, -nx) * .85) : mix(WHITE, BLUE_HI, Math.min(1, nx) * .8);
      const dx = (lx - wc[w]) * (sc - 1) + (scat ? (lx - CX) * scat * 1.6 * (.6 + hash(i)) : 0);
      const dy = scat ? (hash(i + 3) - .5) * 300 * scat : 0;
      if (pass === 0) return { a: (.2 + .25 * decay(t, s, .5)) * E.outQ(inv(s, s + .12, t)) * (1 - scat), dx, dy, sc, blur: 18, col: rgba(nx < 0 ? ORANGE : BLUE, 1) };
      return { a: E.outQ(inv(s, s + .12, t)) * (1 - scat), dx, dy, sc: sc * (1 + scat * .3), rot: scat * (hash(i + 7) - .5) * 1.5, blur: (1 - e) * 14 + scat * 10, col: rgb(col) };
    });
  }
  c.globalCompositeOperation = 'source-over';
}

/* ===================================================================== */
/* ACT 2 — THE PROBLEM: the endless loop                                 */
/* ===================================================================== */
const A2 = Q.a2;
const STR = (() => {
  const r = rng(202), out = [];
  for (let i = 0; i < 400; i++) {
    const u = r(), cu = r();
    const type = u < .36 ? 0 : u < .62 ? 1 : u < .76 ? 3 : u < .86 ? 4 : u < .94 ? 2 : 5;
    out.push({ u0: r() * TAU, on: (r() - .5) * 150, oy: (r() - .5) * 90, size: 32 + Math.pow(r(), 1.5) * 62, ks: .9 + r() * .2,
      type, col: cu < .55 ? ICE : cu < .8 ? BLUE_HI : BLUE, rot: (r() - .5) * .35, fa: .08 + r() * .22,
      gc: i % 20, gr: Math.floor(i / 20), node: i % 3, d: r(), e: r() });
  }
  return out;
})();
const FA = A2.start - .2;
function flowF(t) { const L = A2.stop - FA, x = clamp(t, FA, A2.stop) - FA; return .5 * x + 5.6 * L * Math.pow(x / L, 3.4) / 3.4; }
function flowW(t) { if (t < FA || t >= A2.stop) return 0; return .5 + 5.6 * Math.pow((t - FA) / (A2.stop - FA), 2.4); }
function stutterT(t) {
  if (t < A2.peak) return t;
  const tt = Math.min(t, A2.stop - 1e-4), k = tt - A2.peak, n = Math.floor(k / .11);
  return A2.peak + n * .05 + (k - n * .11);
}
const STOP_TE = stutterT(A2.stop - 1e-4);
const effT = t => t >= A2.stop ? STOP_TE : stutterT(t);
function loopPos(u, o) { const s = Math.sin(u), c = Math.cos(u), d = 1 + s * s; o = o || {}; o.x = 730 * c / d; o.z = 730 * s * c / d * 1.32; o.y = 82 * s; return o; }
function loopFrame(u, on, oy, o) {
  const a = loopPos(u - .002, {}), b = loopPos(u + .002, {}), p = loopPos(u, o || {});
  let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
  p.x += tz * on; p.z += -tx * on; p.y += oy; return p;
}
function camA2(te) {
  const p = E.ioS(inv(A2.start, A2.stop, te)), az = lerp(-.42, .3, p), D = lerp(1240, 1020, p), el = lerp(.7, .56, p);
  return [Math.sin(az) * Math.cos(el) * D, -Math.sin(el) * D + 85, -Math.cos(az) * Math.cos(el) * D, 0, 85, 0, 1000, .05 * Math.sin(te * 1.7)];
}
const uHero = te => PI / 2 + (flowF(te) - flowF(STOP_TE)) * 1.12;
const energyA2 = te => 1 - .7 * inv(A2.start + .2, A2.stop, te);
const RC = [0, -30]; // ring centre (Act 3/4 local origin)
const NODE_A = [-PI / 2, PI / 6, 5 * PI / 6], RING_R = 300, DIAL_R = 330, TUBE_R = 250, ORBIT_R = 400;
function drawStream(c, t) {
  if (t < A2.start - .05 || t > Q.a3.sheet + 1.3) return;
  const te = effT(t), w = t >= A2.stop ? 0 : flowW(te), F = flowF(te);
  const items = [];
  for (const C of STR) {
    const u = C.u0 + F * C.ks;
    const lp = loopFrame(u, C.on, C.oy);
    let x = lp.x, y = lp.y, z = lp.z, e = 0, fly = 0;
    if (t > A2.unravel) {
      // the endless feed gathers into one page: today's lesson
      e = E.ioC(inv(A2.unravel + C.d * .32, A2.unravel + .8 + C.d * .32, t));
      if (e >= 1) continue;
      const sx = SHEET.x + (hash(C.gc * 7.1 + C.gr) - .5) * 470, sy = SHEET.y - 300 + C.gr / 20 * 600 + (hash(C.gc + C.gr * 3.3) - .5) * 30;
      x = lerp(x, sx, e); y = lerp(y, sy, e); z = lerp(z, 0, e) - Math.sin(PI * e) * 320;
    }
    const p = proj(x, y, z); if (!p) continue;
    items.push({ C, p, u, e, fly, x, y, z });
  }
  items.sort((A, B) => B.p.z - A.p.z);
  c.globalCompositeOperation = 'lighter';
  const railA = (1 - inv(A2.unravel, A2.unravel + .4, t)) * (t >= A2.stop ? .45 : 1);
  if (railA > 0) {
    for (const [on, lw, al] of [[-85, 1.5, .3], [85, 1.5, .3], [0, 10, .07], [0, 2, .22]]) {
      c.beginPath(); let first = true;
      for (let i = 0; i <= 240; i++) { const q = loopFrame(i / 240 * TAU, on, 0), pq = proj(q.x, q.y, q.z); if (!pq) { first = true; continue; } first ? c.moveTo(pq.x, pq.y) : c.lineTo(pq.x, pq.y); first = false; }
      c.strokeStyle = rgba(BLUE_HI, al * railA); c.lineWidth = lw; c.stroke();
    }
    // pulses racing around the track: the pace of the loop
    for (let j = 0; j < 6; j++) { const uu = j / 6 * TAU + F * 1.6, q = loopPos(uu), pq = proj(q.x, q.y, q.z); if (pq) glow(c, SP.bh, pq.x, pq.y, 46 * pq.s, .5 * railA); }
  }
  for (const it of items) {
    const { C, p, e, fly } = it;
    let a = (it.e < 1 ? inv(4200, 2600, p.z) : 1) * inv(60, 300, p.z);
    // streaks while the loop runs
    if (w > 0 && e === 0) {
      const q = loopFrame(it.u - w * .045 * C.ks, C.on, C.oy), pq = proj(q.x, q.y, q.z);
      if (pq) { c.strokeStyle = rgba(C.col, a * .32); c.lineWidth = Math.max(1, C.size * p.s * .14); c.beginPath(); c.moveTo(pq.x, pq.y); c.lineTo(p.x, p.y); c.stroke(); }
    }
    shape(c, C.type, p.x, p.y, C.size * p.s * (1 - .65 * e), C.rot * (1 - e), C.col, a * .95 * (1 - e * e * e), C.fa);
    if (e > .6) glow(c, SP.bh, p.x, p.y, 22 * p.s, .45 * (1 - e) * 2.5);
  }
  c.globalCompositeOperation = 'source-over';
}
function drawLoopHero(c, t) {
  if (t < A2.start - .05 || t >= A2.unravel + .9) return null;
  const te = effT(t), F = flowF(te), w = t >= A2.stop ? 0 : flowW(te), e = energyA2(te), u = uHero(te);
  const hp = loopPos(u), P = proj(hp.x, hp.y, hp.z); if (!P) return null;
  c.globalCompositeOperation = 'lighter';
  // the trail
  if (w > 0) {
    let prev = null;
    for (let k = 0; k < 40; k++) {
      const q = loopPos(u - k * .02 * (1 + w * .22)), pq = proj(q.x, q.y, q.z); if (!pq) break;
      if (prev) { c.strokeStyle = rgba(ORANGE, .55 * e * (1 - k / 40)); c.lineWidth = 7 * (1 - k / 40) * pq.s + 1; c.beginPath(); c.moveTo(prev.x, prev.y); c.lineTo(pq.x, pq.y); c.stroke(); }
      prev = pq;
    }
  }
  // energy leaking into the stream
  for (let j = 0; j < 200; j++) {
    const tj = A2.start + .15 + j * .0165; if (te < tj) break;
    const age = te - tj; if (age > 1) continue;
    const uj = uHero(tj) + (F - flowF(tj)) * .95;
    const q = loopFrame(uj, (hash(j) - .5) * age * 260, (hash(j + 1) - .5) * age * 140), pq = proj(q.x, q.y, q.z); if (!pq) continue;
    glow(c, age < .5 ? SP.oh : SP.bh, pq.x, pq.y, 7 * pq.s + 2, .75 * Math.pow(1 - age, 1.5) * (t >= A2.stop ? .6 : 1) * (1 - pr(A2.unravel, A2.unravel + .5, t)));
  }
  const r = 15 * (.55 + .45 * e) * Math.min(1.6, P.s);
  return { x: P.x, y: P.y, r, e };
}
function drawCounter(c, t) {
  if (t < A2.start + .3 || t > A2.unravel + .4) return;
  // digits hold for a whole frame so they stay crisp under motion blur
  const te = effT(Math.round(t * 30) / 30), a = pr(A2.start + .3, A2.start + .8, t) * (1 - inv(A2.unravel, A2.unravel + .35, t)) * (t >= A2.stop ? .55 : 1);
  const m = 12 + 155 * Math.pow(inv(A2.start, A2.stop, te), 2.2), h = Math.floor(m / 60), mm = Math.floor(m % 60), ss = Math.floor(frac(m) * 60);
  const str = `${h}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  const jx = t > A2.peak && t < A2.stop ? noise(t * 90) * 6 : 0;
  c.globalCompositeOperation = 'source-over';
  const L = lay(S.screenTime, 600, 20, .34);
  letters(c, L, CX + jx, CY + 382, () => ({ a: a * .85, col: rgb(STEEL) }));
  c.font = '300 64px Outfit'; c.textAlign = 'center'; c.fillStyle = rgba(WHITE, a); c.globalAlpha = 1;
  const dw = 37, ws = [...str].map(ch => ch === ':' ? dw * .62 : dw); let x = CX + jx - ws.reduce((a, b) => a + b, 0) / 2;
  [...str].forEach((ch, i) => { c.fillText(ch, x + ws[i] / 2, CY + 452); x += ws[i]; });
}
function drawCradle(c, t, hx, hy) {
  // a single deliberate movement: the embrace from the logo
  if (t < A2.arc || t > A3.sheet + .7) return;
  const p = inv(A2.arc, A2.arc + .42, t), e = E.outExpo(p);
  const go = E.inQ(inv(A3.sheet, A3.sheet + .55, t)); hx -= 420 * go; hy += 40 * go;
  const R = lerp(560, 46, e) * (1 + go * 1.5), rot = lerp(-1.6, 0, e), span = lerp(.5, 3.84, E.outC(p)), a0 = 3.49 + rot;
  const fade = 1 - inv(A3.sheet + .1, A3.sheet + .55, t);
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  for (const [lw, al, col] of [[26, .16, BLUE], [9, .9, BLUE], [3, .9, BLUE_HI]]) {
    c.strokeStyle = rgba(col, al * fade); c.lineWidth = lw * lerp(.5, 1, e);
    c.beginPath(); c.arc(hx, hy, R, a0, a0 - span, true); c.stroke();
  }
  const ha = a0 - span; glow(c, SP.bh, hx + Math.cos(ha) * R, hy + Math.sin(ha) * R, 40, .8 * fade * (1 - p * .5));
  c.lineCap = 'butt';
}

/* ===================================================================== */
/* ACT 3 — THE REFRAME: order, three questions, a closed circle          */
/* ACT 4 — THE PAYOFF: the mechanism, +15                                 */
/* ===================================================================== */
const A3 = Q.a3, A4 = Q.a4, A5 = Q.a5;

/* ===================================================================== */
/* ACT 3a — THE SCAN: the parent scans today's lesson with their phone,  */
/* the quiz lands on the child's tablet, the camera dives into it         */
/* ===================================================================== */
const SHEET = { x: -300, y: 12, rot: -.035 };           // the lesson page (560 × 740, local units)
const PHONE = { x: -270, y: 30, z: -90 };              // the parent's phone while scanning
const TAB = { x: 520, y: 20 };                          // the child's tablet (640 × 440)
const TAB_M = { cx: TAB.x, cy: TAB.y + 37.5, sc: .5 };  // the quiz ring, as shown on the tablet
const PKT = { gap: .12, dur: .78 };                     // the three questions in flight
// camera dolly into the tablet; at its end the frame equals the full-screen ring view exactly
const DIVE_CAM = [TAB.x, TAB_M.cy + 15, -500, TAB.x, TAB_M.cy + 15, 0, 1000, 0];
function scanCam(t) { const k = pr(A3.dive, A3.diveEnd, t, E.ioC); return frontal.map((v, i) => lerp(v, DIVE_CAM[i], k)); }
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
function drawSheetWorld(c, t, A) {
  const pa = pr(A3.sheet + .25, A3.sheet + .8, t) * A; if (pa <= .003) return;
  const P = proj(SHEET.x, SHEET.y, 0); if (!P) return;
  const s = P.s * lerp(.94, 1, pr(A3.sheet + .2, A3.sheet + .9, t, E.outC)), cs = Math.cos(SHEET.rot) * s, sn = Math.sin(SHEET.rot) * s;
  c.globalCompositeOperation = 'source-over';
  c.setTransform(cs, sn, -sn, cs, P.x, P.y);
  c.globalAlpha = pa * .55; c.fillStyle = '#000'; c.filter = 'blur(28px)'; c.fillRect(-262, -342, 560, 740); c.filter = 'none';
  drawSheet(c, t, pa, pr(A3.sheet + .3, A3.sheet + .85, t), false);
  c.setTransform(1, 0, 0, 1, 0, 0);
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
  c.fillStyle = '#e3f4ea'; c.strokeStyle = '#9fd8b5'; c.lineWidth = 2; c.beginPath(); c.roundRect(197, 357, 135, 42, 21); c.fill(); c.stroke();
  c.fillStyle = AP.green; c.beginPath(); c.arc(220, 378, 5, 0, TAU); c.fill(); txt(c, A_.online, 234, 386, '500 22px Outfit', AP.green);
  txt(c, '· ' + A_.grade, 345, 386, '400 22px Outfit', AP.grey);
  c.fillStyle = '#e6f3f7'; c.beginPath(); c.arc(641, 329, 28, 0, TAU); c.fill();
  c.fillStyle = '#fdeee6'; c.beginPath(); c.roundRect(62, 431, 612, 284, 24); c.fill();
  txt(c, A_.timeLeft, 84, 489, '400 23px Outfit', '#3c4b52'); c.fillStyle = AP.orange; c.fillRect(622, 474, 28, 4);
  c.fillStyle = '#f7c8b4'; c.beginPath(); c.roundRect(84, 508, 568, 14, 7); c.fill();
  c.fillStyle = '#eef3f6'; c.beginPath(); c.roundRect(84, 594, 568, 98, 22); c.fill();
  c.fillStyle = '#f4fafc'; c.strokeStyle = '#cfe7ef'; c.beginPath(); c.roundRect(62, 736, 612, 104, 22); c.fill(); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(120, 788, 30, 0, TAU); c.fill();
  txt(c, A_.auto, 172, 790, '600 28px Outfit', AP.ink); txt(c, A_.autoSub, 172, 822, '400 21px Outfit', AP.grey);
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
function drawPhone(c, t, A) {
  if (A <= .003 || t < A3.phone - .45) return;
  const k = pr(A3.phone - .4, A3.tap + .05, t, E.outC);
  const x = lerp(-1300, PHONE.x, k), y = lerp(190, PHONE.y, k), rot = lerp(-.3, 0, k) + .01 * Math.sin(t * 1.4) * k;
  const P = proj(x, y, PHONE.z); if (!P) return;
  const s = P.s * (1 + .03 * decay(t, A3.lock, .25) + .02 * decay(t, A3.shot, .2)), cs = Math.cos(rot) * s, sn = Math.sin(rot) * s;
  c.globalCompositeOperation = 'lighter'; glow(c, SP.b, P.x, P.y, 440 * s, .12 * A * (1 + 1.5 * decay(t, A3.shot, .5)));
  c.globalCompositeOperation = 'source-over'; c.setTransform(cs, sn, -sn, cs, P.x, P.y); c.globalAlpha = A;
  const g = c.createLinearGradient(-150, -310, 150, 310); g.addColorStop(0, '#2b3542'); g.addColorStop(1, '#0c1018');
  c.beginPath(); c.roundRect(-150, -310, 300, 620, 46); c.fillStyle = g; c.fill();
  c.lineWidth = 3; c.strokeStyle = rgba(BLUE_HI, .9); c.stroke();
  c.lineWidth = 9; c.strokeStyle = rgba(BLUE, .16); c.stroke();
  c.beginPath(); c.roundRect(-137, -297, 274, 594, 34); c.fillStyle = '#000'; c.fill();
  c.save(); c.clip();
  c.translate(-137, -297); c.scale(274 / 736, 594 / 1600);
  const push = pr(A3.cam, A3.cam + .26, t, E.ioC), proc = pr(A3.detected, A3.detected + .18, t);
  if (push < 1) { c.save(); c.translate(-220 * push, 0); c.globalAlpha = A; appHome(c, t); c.fillStyle = `rgba(0,0,0,${.4 * push})`; c.fillRect(0, 0, 736, 1600); c.restore(); }
  if (push > 0 && proc < 1) { c.save(); c.translate(736 * (1 - push), 0); c.globalAlpha = A; appCamera(c, t); c.restore(); }
  if (proc > 0) { c.globalAlpha = A * proc; appReading(c, t); }
  const fl = decay(t, A3.shot, .28); if (fl > 0) { c.globalAlpha = A * fl; c.fillStyle = '#fff'; c.fillRect(0, 0, 736, 1600); }
  c.restore();
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}
function tabletXform(t) { const P = proj(TAB.x, TAB.y, 0); return P; }
const diveOpen = t => pr(A3.dive + .45, A3.diveEnd, t, E.inQ);   // the screen opens past the bezel
const bezelA = t => 1 - pr(A3.dive + .3, A3.diveEnd - .05, t);
function tabletBack(c, t) {
  const ap = pr(A3.sheet + .15, A3.sheet + .85, t); if (ap <= 0) return;
  const P = tabletXform(t); if (!P) return;
  const s = P.s, bz = bezelA(t), body = clamp(ap * 1.6 - .6);
  c.setTransform(s, 0, 0, s, P.x, P.y);
  c.globalCompositeOperation = 'lighter'; glow(c, SP.o, 0, 0, 560, .11 * ap * bz);
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = body * bz;
  const g = c.createLinearGradient(-320, -220, 320, 220); g.addColorStop(0, '#2a1d1a'); g.addColorStop(1, '#0b0c16');
  c.beginPath(); c.roundRect(-320, -220, 640, 440, 36); c.fillStyle = g; c.fill();
  const ex = 1 + 2.4 * diveOpen(t), bgA = body * (1 - pr(A3.diveEnd - .35, A3.diveEnd, t));
  c.globalAlpha = bgA;
  const sg = c.createRadialGradient(0, -20, 20, 0, 0, 420 * ex); sg.addColorStop(0, '#0f2b57'); sg.addColorStop(1, '#030b1a');
  c.beginPath(); c.roundRect(-300 * ex, -200 * ex, 600 * ex, 400 * ex, 22 * ex); c.fillStyle = sg; c.fill();
  // before the quiz: time's up
  const z = body * (1 - pr(A3.forms - .1, A3.forms + .25, t));
  if (z > 0) { c.globalAlpha = z; c.fillStyle = rgb(STEEL); c.font = '300 40px Outfit'; c.textAlign = 'center'; c.fillText('0:00', 0, 86); }
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}
function tabletClip(c, t) {
  const P = tabletXform(t), s = P.s * (1 + 2.4 * diveOpen(t));
  c.beginPath(); c.roundRect(P.x - 300 * s, P.y - 200 * s, 600 * s, 400 * s, 22 * s); c.clip();
}
function tabletFront(c, t) {
  const ap = pr(A3.sheet + .15, A3.sheet + .85, t); if (ap <= 0) return;
  const P = tabletXform(t); if (!P) return;
  const s = P.s, bz = bezelA(t);
  c.setTransform(s, 0, 0, s, P.x, P.y);
  // the outline draws itself around the child
  c.setLineDash([2200 * ap, 3000]); c.lineDashOffset = 0;
  c.beginPath(); c.roundRect(-320, -220, 640, 440, 36);
  c.globalAlpha = bz; c.strokeStyle = rgba(ORANGE_HI, .95); c.lineWidth = 3; c.stroke();
  c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(ORANGE, .2); c.lineWidth = 10; c.stroke(); c.globalCompositeOperation = 'source-over';
  c.setLineDash([]);
  const body = clamp(ap * 1.6 - .6) * bz;
  c.globalAlpha = body; c.fillStyle = '#1c1c2a'; c.beginPath(); c.arc(-310, 0, 4, 0, TAU); c.fill();
  // quiz header
  const qa = E.outBack(inv(A3.quiz - .1, A3.quiz + .25, t), 1.8) * bz;
  if (qa > 0) {
    c.globalAlpha = clamp(qa); c.save(); c.translate(-236, -168); c.scale(clamp(qa, 0, 1.2), clamp(qa, 0, 1.2));
    c.fillStyle = rgb(ORANGE); c.beginPath(); c.roundRect(-40, -16, 80, 32, 16); c.fill();
    c.fillStyle = '#fff'; c.font = '700 17px Outfit'; c.textAlign = 'center'; c.fillText(S.quiz, 0, 6); c.restore();
  }
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}
function packetPos(k, u) {
  const an = NODE_A[k];
  const a = [PHONE.x, PHONE.y - 30, PHONE.z], b = [TAB_M.cx + Math.cos(an) * RING_R * TAB_M.sc, TAB_M.cy + Math.sin(an) * RING_R * TAB_M.sc, 0];
  const m = [(a[0] + b[0]) / 2 - 60, Math.min(a[1], b[1]) - 380 - k * 50, -320];
  const q = 1 - u;
  return [q * q * a[0] + 2 * q * u * m[0] + u * u * b[0], q * q * a[1] + 2 * q * u * m[1] + u * u * b[1], q * q * a[2] + 2 * q * u * m[2] + u * u * b[2]];
}
function drawPackets(c, t) {
  for (let k = 0; k < 3; k++) {
    const t0 = A3.send + k * PKT.gap; if (t < t0 || t > t0 + PKT.dur + .08) continue;
    const u = E.ioC(inv(t0, t0 + PKT.dur, t)), fade = 1 - inv(t0 + PKT.dur - .02, t0 + PKT.dur + .08, t);
    c.globalCompositeOperation = 'lighter';
    for (let j = 9; j >= 1; j--) {
      const uj = E.ioC(inv(t0, t0 + PKT.dur, t - j * .02)); if (uj <= 0) continue;
      const q = packetPos(k, uj), p = proj(q[0], q[1], q[2]); if (p) glow(c, SP.oh, p.x, p.y, (18 - j) * p.s, .55 * (1 - j / 10) * fade);
    }
    const q = packetPos(k, u), P = proj(q[0], q[1], q[2]); if (!P) continue;
    const sz = lerp(26, 37, u) * P.s, rot = (1 - u) * (k - 1) * .8;
    glow(c, SP.o, P.x, P.y, sz * 2.4, .6 * fade);
    c.globalCompositeOperation = 'source-over';
    c.setTransform(Math.cos(rot), Math.sin(rot), -Math.sin(rot), Math.cos(rot), P.x, P.y); c.globalAlpha = fade;
    const g = c.createLinearGradient(-sz, -sz, sz, sz); g.addColorStop(0, rgb(ORANGE_HI)); g.addColorStop(1, rgb(ORANGE));
    c.beginPath(); c.roundRect(-sz, -sz, sz * 2, sz * 2, sz * .4); c.fillStyle = g; c.fill();
    c.fillStyle = '#fff'; c.font = `800 ${(sz * 1.3).toFixed(1)}px Outfit`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('?', 0, sz * .46);
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  }
  c.globalCompositeOperation = 'source-over';
}
function drawScan(c, t, hero) {
  const outA = 1 - pr(A3.dive - .05, A3.dive + .35, t);
  const dim = pr(A3.send + .05, A3.quiz, t) * .35;
  tabletBack(c, t);
  if (t >= A3.forms) { c.save(); tabletClip(c, t); drawRing(c, t, hero); c.restore(); }
  tabletFront(c, t);
  // the paper and the parent's real app screens sit above the bloom, so the interface keeps its true colours
  const ca = [cam.ox, cam.oy];
  POST.push(o => { camArr(scanCam(t)); cam.ox = ca[0]; cam.oy = ca[1]; drawSheetWorld(o, t, outA * (1 - dim)); drawPhone(o, t, outA * (1 - dim)); drawPackets(o, t); });
}
function drawSteps(c, t) {
  // SCAN · QUIZ · +15 MIN — a progress strip that lights as the mechanism happens
  const t0 = A3.scan - .35, t1 = A4.combine;
  if (t < t0 || t > t1 + .5) return;
  const a = pr(t0, t0 + .4, t) * (1 - pr(t1, t1 + .45, t));
  const lit = [A3.scan, A3.quiz, closeT], px = 30, gapW = 92, by = CY + 452;
  const Ls = S.steps.map(w => lay(w, 700, px, .16)), total = Ls.reduce((s, L) => s + L.width, 0) + gapW * 2;
  let x = CX - total / 2; const spans = [];
  Ls.forEach((L, i) => {
    const on = pr(lit[i], lit[i] + .25, t);
    letters(c, L, x + L.width / 2, by, () => ({ a: a * (.28 + .72 * on), col: on > .5 ? '#fff' : rgb(STEEL) }));
    spans.push([x, x + L.width]);
    if (i < 2) { c.globalAlpha = a * .5; c.fillStyle = rgb(STEEL); c.beginPath(); c.arc(x + L.width + gapW / 2, by - 11, 3.5, 0, TAU); c.fill(); c.globalAlpha = 1; }
    x += L.width + gapW;
  });
  let cur = 0; for (let w = 0; w < 3; w++) if (t >= lit[w]) cur = w;
  const k = pr(lit[cur], lit[cur] + .4, t, E.ioC), prv = spans[Math.max(0, cur - 1)], nx = spans[cur];
  const ua = a * pr(lit[0], lit[0] + .3, t);
  c.fillStyle = rgba(ORANGE, ua); c.beginPath(); c.roundRect(lerp(prv[0], nx[0], k), by + 16, lerp(prv[1] - prv[0], nx[1] - nx[0], k), 5, 2.5); c.fill();
}
function mechAt(t) {
  if (t < A3.diveEnd) return { cx: TAB_M.cx, cy: TAB_M.cy, sc: TAB_M.sc }; // on the child's tablet (the camera dives in)
  const k = pr(A4.harmony, A4.harmony + 1.0, t, E.ioC);
  return { cx: 0, cy: lerp(RC[1], -190, k), sc: lerp(1, .62, k) };
}
function ringCam(t) {
  const ramp = pr(A3.diveEnd, A3.diveEnd + 1, t, E.ioS);
  let yaw = .075 * Math.sin((t - A3.diveEnd) * .62) * ramp, pitch = .03 * ramp;
  const up = pr(A4.expand - .3, A4.expand + 1.2, t, E.ioS), down = pr(A4.expand + 1.2, A4.earned + .1, t, E.ioC), flat = pr(A4.harmony, A4.harmony + .9, t, E.ioC);
  yaw = lerp(lerp(yaw, .17, up), .035, down); pitch = lerp(lerp(pitch, .21, up), .085, down);
  yaw *= 1 - flat; pitch *= 1 - flat;
  const D = 1000;
  return [Math.sin(yaw) * Math.cos(pitch) * D, -Math.sin(pitch) * D, -Math.cos(yaw) * Math.cos(pitch) * D, 0, 0, 0, 1000 * (1 + .035 * decay(t, A4.earned, .9)), 0];
}
// local (mechanism) -> projected
function MP(m, lx, ly, lz = 0) { return proj(m.cx + lx * m.sc, m.cy + ly * m.sc, lz * m.sc); }
function polyRing(c, m, R, a0, a1, n) {
  c.beginPath(); let first = true;
  for (let i = 0; i <= n; i++) {
    const an = lerp(a0, a1, i / n), p = MP(m, Math.cos(an) * R, Math.sin(an) * R); if (!p) continue;
    first ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y); first = false;
  }
}
const qT = A3.q, closeT = A3.close;
function cardFlip(k, t) { return PI * E.outBack(inv(qT[k], qT[k] + .44, t), 1.4); }
function drawQCard(c, m, k, t, lx, ly, rho, phi, sc, alpha, answered) {
  const half = 75 * sc, ex0 = [Math.cos(rho), Math.sin(rho)], ey0 = [-Math.sin(rho), Math.cos(rho)];
  const cphi = Math.cos(phi), sphi = Math.sin(phi);
  const P0 = MP(m, lx, ly, 0); if (!P0) return;
  const Px = MP(m, lx + ex0[0] * half * cphi, ly + ex0[1] * half * cphi, -half * sphi), Py = MP(m, lx + ey0[0] * half, ly + ey0[1] * half, 0);
  if (!Px || !Py) return;
  let ax = (Px.x - P0.x) / 75, ay = (Px.y - P0.y) / 75; const bx = (Py.x - P0.x) / 75, by = (Py.y - P0.y) / 75;
  const back = cphi < 0; if (back) { ax = -ax; ay = -ay; }
  const showBack = answered ? true : back;
  // glow behind
  c.globalCompositeOperation = 'lighter';
  glow(c, showBack ? SP.o : SP.b, P0.x, P0.y, 170 * sc * P0.s * m.sc, (showBack ? .35 : .22) * alpha);
  c.globalCompositeOperation = 'source-over';
  c.setTransform(ax, ay, bx, by, P0.x, P0.y); c.globalAlpha = alpha;
  const g = c.createLinearGradient(-75, -75, 75, 75);
  if (showBack) { g.addColorStop(0, 'rgba(255,150,80,.30)'); g.addColorStop(1, 'rgba(22,22,48,.82)'); }
  else { g.addColorStop(0, 'rgba(60,150,220,.32)'); g.addColorStop(1, 'rgba(6,22,50,.85)'); }
  c.beginPath(); c.roundRect(-75, -75, 150, 150, 30); c.fillStyle = g; c.fill();
  c.lineWidth = 2.4; c.strokeStyle = showBack ? rgba(ORANGE_HI, .95) : rgba(BLUE_HI, .9); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-48, -72); c.lineTo(48, -72); c.stroke();
  if (!showBack) {
    c.fillStyle = '#fff'; c.font = '700 96px Outfit'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('?', 0, 34);
    cycleIcon(c, -48, -46, 13, k, rgba(BLUE_HI, .9));
  } else {
    const cp = answered ? 1 : E.outC(inv(qT[k] + .2, qT[k] + .46, t));
    const pts = [[-31, 3], [-9, 25], [33, -22]], segs = [Math.hypot(22, 22), Math.hypot(42, 47)], tot = segs[0] + segs[1];
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const [lw, col] of [[24, rgba(ORANGE, .25)], [12, rgb(ORANGE)]]) {
      c.strokeStyle = col; c.lineWidth = lw; c.setLineDash([tot * cp, 400]); c.beginPath(); c.moveTo(...pts[0]); c.lineTo(...pts[1]); c.lineTo(...pts[2]); c.stroke();
    }
    c.setLineDash([]); c.lineCap = 'butt';
  }
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}
function tube(c, m, R, w, t, energy, warm) {
  // a glossy, lit torus seen in perspective
  const n = 120, Lx = -.5, Ly = -.86;
  const pts = [];
  for (let i = 0; i <= n; i++) { const an = i / n * TAU; const p = MP(m, Math.cos(an) * R, Math.sin(an) * R); pts.push(p ? [p.x, p.y, p.s, an] : null); }
  const pass = (lwF, colF) => {
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[i + 1]; if (!a || !b) continue;
      const st = colF(a[3]); if (!st) continue;
      c.strokeStyle = st; c.lineWidth = lwF(a[2]); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
  };
  c.lineCap = 'round';
  c.globalCompositeOperation = 'source-over';
  pass(s => w * s * m.sc, () => rgb(TUBE));
  c.globalCompositeOperation = 'lighter';
  pass(s => w * .62 * s * m.sc, an => rgba(mix(BLUE, ORANGE, warm), .32 + .2 * Math.max(0, -(Math.cos(an) * Lx + Math.sin(an) * Ly))));
  // specular streak — offset toward the light
  c.lineCap = 'butt';
  for (let i = 0; i < n; i++) {
    const an = (i + .5) / n * TAU, d = Math.cos(an) * Lx + Math.sin(an) * Ly, off = R + d * w * .26;
    const p = MP(m, Math.cos(an) * off, Math.sin(an) * off), q = MP(m, Math.cos(an + TAU / n) * off, Math.sin(an + TAU / n) * off); if (!p || !q) continue;
    c.strokeStyle = rgba(WHITE, (.25 + .6 * Math.abs(d)) * .75); c.lineWidth = Math.max(1, w * .1 * p.s * m.sc);
    c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
  }
  // energy travelling inside the tube
  if (energy > 0) pass(s => 2.6 * s * m.sc + 1, an => rgba(ORANGE_HI, energy * (.3 + .7 * Math.pow(bell(frac(an / TAU - t * .55), .5, .16), 1) + .5 * bell(frac(an / TAU - t * .55 + .5), .5, .1))));
  c.lineCap = 'butt';
}
function odometer(c, v, x, by, px) {
  // "+" and two rolling digits
  const dw = px * .6, h = px * 1.0;
  const units = v % 10, tens = Math.floor(v / 10);
  const roll = q => E.ioC(clamp((frac(q) - .55) / .45));
  c.font = `800 ${px}px Outfit`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const plusW = px * .52, total = plusW + dw * 2, x0 = x - total / 2;
  c.fillStyle = rgb(ORANGE); c.fillText('+', x0 + plusW / 2, by);
  c.save(); c.beginPath(); c.rect(x0 + plusW - 4, by - px * .86, dw * 2 + 8, px * 1.0); c.clip();
  c.fillStyle = '#fff';
  const tensV = tens + (units > 9 ? roll(units) : 0);
  const digs = [[tensV, x0 + plusW + dw * .5], [Math.floor(units) + roll(units), x0 + plusW + dw * 1.5]];
  for (const [q, dx] of digs) {
    const base = Math.floor(q), f = q - base;
    c.fillText(String(base % 10), dx, by - f * h); c.fillText(String((base + 1) % 10), dx, by + (1 - f) * h);
  }
  c.restore();
}
function heroRing(t, m) {
  // where the child sits in the ring / mechanism, local coords
  if (t < closeT + .1) return [0, -58];
  if (t < A4.expand + .4) { const k = pr(closeT + .1, closeT + .5, t); return [0, lerp(-58, 0, k)]; }
  if (t < A4.tick0) { const k = pr(A4.expand + .4, A4.tick0, t, E.ioC); return [0, lerp(0, -DIAL_R, k)]; }
  const sweep = pr(A4.tick0, A4.tick1, t, E.ioS) * PI / 2;
  if (t < A4.harmony) { const an = -PI / 2 + sweep; return [Math.cos(an) * DIAL_R, Math.sin(an) * DIAL_R]; }
  const Rh = lerp(DIAL_R, ORBIT_R, pr(A4.harmony, A4.harmony + .5, t)), th = -.494 * (t - A4.harmony);
  return [Math.cos(th) * Rh, Math.sin(th) * Rh, th];
}
const LOGO_S = .56, LOGO_X = CX, LOGO_Y = 372;
const L_OR = LOGO.orangeCircle, L_HD = LOGO.headCircle;
const logoPt = (lx, ly) => [LOGO_X + lx * LOGO_S, LOGO_Y + ly * LOGO_S];
function drawRing(c, t, hero) {
  if (t < A3.forms || t > A5.body + .5) return;
  const m = mechAt(t);
  const tf = A3.forms;
  const ringDraw = pr(A3.ring, A3.ring + .6, t, E.ioC);
  const toTube = pr(A4.expand, A4.expand + .55, t, E.ioC);
  const dissolve = pr(A5.converge, A5.converge + .55, t, E.ioC);
  const keep = 1 - dissolve;
  const Rr = lerp(RING_R, TUBE_R, toTube);
  // ---- floor reflection (Act 4) ----
  const reflA = pr(A4.expand, A4.expand + .8, t) * (1 - pr(A4.harmony - .1, A4.harmony + .7, t)) * .2;
  if (reflA > .005) {
    rc.setTransform(1, 0, 0, 1, 0, 0); rc.globalCompositeOperation = 'source-over'; rc.globalAlpha = 1; rc.clearRect(0, 0, W, H);
    cam.mirrorY = 360; mechCore(rc, m, t, Rr, toTube, keep, true); cam.mirrorY = null;
    const fl = proj(0, 360, 0), fy = fl ? fl.y : H;
    rc.globalCompositeOperation = 'destination-in';
    const g = rc.createLinearGradient(0, fy, 0, fy + 420); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    rc.fillStyle = g; rc.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = reflA; c.drawImage(refl, 0, 0); c.globalAlpha = 1;
    // floor line
    const fa = proj(-1600, 360, 0), fb = proj(1600, 360, 0);
    if (fa && fb) { const lg = c.createLinearGradient(fa.x, 0, fb.x, 0); lg.addColorStop(0, 'rgba(158,226,252,0)'); lg.addColorStop(.5, rgba(BLUE_HI, reflA * 1.4)); lg.addColorStop(1, 'rgba(158,226,252,0)');
      c.strokeStyle = lg; c.lineWidth = 1.5; c.beginPath(); c.moveTo(fa.x, fa.y); c.lineTo(fb.x, fb.y); c.stroke(); }
  }
  mechCore(c, m, t, Rr, toTube, keep, false);
  // ---- question cards ----
  if (t < A4.expand + .6) {
    for (let k = 0; k < 3; k++) {
      const an = NODE_A[k];
      let lx = Math.cos(an) * RING_R, ly = Math.sin(an) * RING_R + 6 * Math.sin(t * 1.6 + k * 2);
      const arr = A3.send + k * PKT.gap + PKT.dur, ap = E.outBack(inv(arr - .06, arr + .3, t), 1.6); if (ap <= 0) continue;
      let rho = .03 * Math.sin(t * 1.1 + k), phi = cardFlip(k, t), sc = ap, al = clamp(ap * 1.4);
      let answered = 0;
      if (t > A4.combine) {
        const f = E.ioC(inv(A4.combine + k * .05, A4.lock, t)), ta = -PI / 2 + k * TAU / 3;
        lx = lerp(lx, Math.cos(ta) * 92, f); ly = lerp(ly, Math.sin(ta) * 92, f);
        rho = lerp(rho, ta + PI / 2, f); phi = PI + TAU * E.ioC(f) * (k === 1 ? -1 : 1); sc = lerp(1, .74, f);
        answered = 1;
        if (t > A4.expand) { const x = E.outExpo(inv(A4.expand, A4.expand + .55, t)); rho += x * PI / 3; sc *= 1 + x * .8; al = 1 - x;
          lx = lerp(lx, Math.cos(ta + x * PI / 3) * TUBE_R, x); ly = lerp(ly, Math.sin(ta + x * PI / 3) * TUBE_R, x); }
      }
      drawQCard(c, m, k, t, lx, ly, rho, phi, sc, al, answered);
    }
  }
  // ---- answer beams + ripples ----
  c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) {
    const an = NODE_A[k], nx = Math.cos(an) * RING_R, ny = Math.sin(an) * RING_R;
    const bp = inv(qT[k] - .3, qT[k] - .02, t);
    if (bp > 0 && bp < 1) {
      const e = E.ioC(bp); const h = heroRing(t);
      for (let j = 0; j < 8; j++) { const q = clamp(e - j * .03); const p = MP(m, lerp(h[0], nx, q), lerp(h[1], ny, q)); if (p) glow(c, SP.oh, p.x, p.y, 16 - j, .9 * (1 - j / 8)); }
    }
    const rp = inv(qT[k], qT[k] + .6, t);
    if (rp > 0 && rp < 1) { const p = MP(m, nx, ny); if (p) { c.strokeStyle = rgba(ORANGE_HI, .7 * (1 - rp)); c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, (90 + 120 * E.outC(rp)) * p.s, 0, TAU); c.stroke(); } }
  }
  // ---- the child ----
  const h = heroRing(t, m);
  hero.ring = h;
  if (t >= A3.forms && t < A5.converge) {
    const P = MP(m, h[0], h[1]);
    if (P) { hero.x = P.x; hero.y = P.y; hero.s = P.s * m.sc; }
  }
  // ---- centre readout ----
  if (t > tf + .5 && t < closeT + .5) {
    const P = MP(m, 0, 0); if (P) {
      const a = pr(tf + .55, tf + .95, t) * (1 - pr(closeT, closeT + .35, t));
      const ks = m.sc * P.s; c.setTransform(ks, 0, 0, ks, P.x, P.y);
      const Ll = lay(S.lesson, 600, 19, .32);
      letters(c, Ll, 0, 22, () => ({ a: a * .9, col: rgb(STEEL) }));
      let idx = 0; for (let k = 0; k < 3; k++) if (t >= qT[k]) idx = k + 1;
      const vals = [S.questions, '1 / 3', '2 / 3', '3 / 3'];
      for (let v = 0; v < 4; v++) {
        const tin = v === 0 ? tf + .6 : qT[v - 1] + .16, tout = v === 3 ? 99 : (v === 0 ? qT[0] : qT[v]);
        const pin = E.outC(inv(tin, tin + .3, t)), pout = E.inC(inv(tout, tout + .16, t));
        if (pin <= 0 || pout >= 1) continue;
        const Lv = lay(vals[v], v === 0 ? 700 : 300, v === 0 ? 38 : 52, v === 0 ? .06 : .04);
        letters(c, Lv, 0, 82 + (1 - pin) * 24 - pout * 24, () => ({ a: a * pin * (1 - pout), col: '#fff' }));
      }
      c.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  // ---- +15 MINUTES EARNED ----
  if (t > A4.tick0 - .1 && t < A4.harmony + .45) {
    const P = MP(m, 0, 0); if (P) {
      const a = pr(A4.tick0 - .1, A4.tick0 + .15, t) * (1 - pr(A4.harmony, A4.harmony + .3, t));
      const v = 15 * pr(A4.tick0, A4.tick1, t, E.ioS), pulse = 1 + .12 * decay(t, A4.earned, .5);
      c.globalCompositeOperation = 'lighter'; glow(c, SP.o, P.x, P.y - 40, 220 * pulse, .28 * a * (1 + 2 * decay(t, A4.earned, .6)));
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
      c.setTransform(pulse, 0, 0, pulse, P.x, P.y - 4); odometer(c, v, 0, 46, 150); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      const Le = lay(S.earned, 700, fit(S.earned, 700, 34, .12, 400), .12);
      letters(c, Le, P.x, P.y + 100, (i) => { const s = A4.earned + .12 + i * .022, p = inv(s, s + .4, t); if (p <= 0) return null;
        return { a: E.outQ(p) * a, dy: (1 - E.outC(p)) * 18, blur: (1 - p) * 6, col: rgb(ORANGE) }; });
    }
  }
  // ---- ▶ 15:00 — a new window of time ----
  if (t > A4.harmony + .2 && t < A5.converge + .5) {
    const P = MP(m, 0, 0); if (P) {
      const a = pr(A4.harmony + .25, A4.harmony + .6, t) * keep;
      const secs = 900 - Math.max(0, Math.floor(t - (A4.harmony + .6)));
      const str = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
      c.globalAlpha = a; c.fillStyle = rgb(ORANGE);
      c.beginPath(); c.moveTo(P.x - 66, P.y - 20); c.lineTo(P.x - 42, P.y - 4); c.lineTo(P.x - 66, P.y + 12); c.closePath(); c.fill();
      c.font = '300 52px Outfit'; c.textAlign = 'left'; c.fillStyle = '#fff'; c.fillText(str, P.x - 30, P.y + 14); c.globalAlpha = 1;
    }
  }
  // ---- earned impact ----
  if (t > A4.earned && t < A4.earned + 1) {
    const P = MP(m, 0, 0), q = inv(A4.earned, A4.earned + .9, t);
    if (P) {
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(ORANGE_HI, .55 * Math.pow(1 - q, 2)); c.lineWidth = 3 * (1 - q) + 1;
      c.beginPath(); c.arc(P.x, P.y, (DIAL_R + 700 * E.outExpo(q)) * P.s, 0, TAU); c.stroke();
      for (let i = 0; i < 48; i++) { const an = i * TAU / 48 + hash(i) * .08, r0 = (DIAL_R + 10 + 420 * E.outExpo(q) * (.5 + .5 * hash(i + 2))) * P.s, l = 70 * (1 - q) * P.s;
        c.strokeStyle = rgba(i % 3 ? ORANGE_HI : WHITE, .7 * (1 - q)); c.lineWidth = 2; c.beginPath(); c.moveTo(P.x + Math.cos(an) * r0, P.y + Math.sin(an) * r0); c.lineTo(P.x + Math.cos(an) * (r0 + l), P.y + Math.sin(an) * (r0 + l)); c.stroke(); }
      beams(c, P.x, P.y, 16, 1300, .035, t * .05, ORANGE_HI, .09 * (1 - q), 9);
    }
  }
  c.globalCompositeOperation = 'source-over';
}
function mechCore(c, m, t, Rr, toTube, keep, mirror) {
  const tf = A3.forms, ringDraw = pr(A3.ring, A3.ring + .6, t, E.ioC);
  c.globalCompositeOperation = 'lighter';
  // track ring + progress (Act 3)
  if (toTube < 1 && ringDraw > 0) {
    const a = (1 - toTube);
    c.lineWidth = 2.5; c.strokeStyle = rgba(BLUE_HI, .7 * a); polyRing(c, m, Rr, -PI / 2, -PI / 2 + TAU * ringDraw, 160); c.stroke();
    c.lineWidth = 12; c.strokeStyle = rgba(BLUE, .16 * a); c.stroke();
    if (ringDraw < 1) { const an = -PI / 2 + TAU * ringDraw, p = MP(m, Math.cos(an) * Rr, Math.sin(an) * Rr); if (p && !mirror) glow(c, SP.bh, p.x, p.y, 40, .9); }
    if (!mirror) for (let i = 0; i < 3 && ringDraw >= 1; i++) { // node sockets
      const an = NODE_A[i], p = MP(m, Math.cos(an) * Rr, Math.sin(an) * Rr); if (p) glow(c, SP.bh, p.x, p.y, 40 * p.s * m.sc, .3 * a);
    }
    for (let k = 0; k < 3; k++) {
      const fp = E.ioC(inv(qT[k] + .08, qT[k] + .55, t)); if (fp <= 0) continue;
      const a0 = NODE_A[k], a1 = a0 + fp * TAU / 3;
      const closeF = decay(t, closeT, .6);
      c.lineCap = 'round';
      c.lineWidth = 12; c.strokeStyle = rgba(ORANGE, (.16 + .3 * closeF) * a); polyRing(c, m, Rr, a0, a1, 60); c.stroke();
      c.lineWidth = 4.5; c.strokeStyle = rgba(ORANGE, .95 * a); c.stroke();
      c.lineWidth = 1.6; c.strokeStyle = rgba(WARM, (.8 + closeF) * a); c.stroke();
      c.lineCap = 'butt';
      if (fp < 1 && !mirror) { const p = MP(m, Math.cos(a1) * Rr, Math.sin(a1) * Rr); if (p) glow(c, SP.oh, p.x, p.y, 34, .95); }
    }
    if (t > closeT && t < closeT + .9 && !mirror) { // closure: light races around the completed circle
      const q = inv(closeT, closeT + .9, t);
      for (let j = 0; j < 2; j++) { const an = -PI / 2 + j * PI + E.outC(q) * TAU * 1.5;
        for (let s = 0; s < 10; s++) { const p = MP(m, Math.cos(an - s * .05) * Rr, Math.sin(an - s * .05) * Rr); if (p) glow(c, SP.w, p.x, p.y, 30 - s * 2, (1 - q) * (1 - s / 10)); } }
      const P = MP(m, 0, 0); if (P) { c.strokeStyle = rgba(WHITE, .6 * (1 - q)); c.lineWidth = 3; c.beginPath(); c.arc(P.x, P.y, (Rr + 260 * E.outExpo(q)) * P.s, 0, TAU); c.stroke();
        beams(c, P.x, P.y, 12, 1100, .04, q * .4, ICE, .1 * (1 - q), 4); }
    }
  }
  if (toTube <= 0) { c.globalCompositeOperation = 'source-over'; return; }
  // ---- the mechanism (Act 4) ----
  const k = toTube * keep;
  if (k <= .002) { c.globalCompositeOperation = 'source-over'; return; }
  const dialR = DIAL_R * lerp(.3, 1, E.outExpo(inv(A4.expand + .05, A4.expand + .7, t)));
  const segR = 212 * lerp(.2, 1, E.outExpo(inv(A4.expand + .12, A4.expand + .75, t)));
  const ticks = 15 * pr(A4.tick0, A4.tick1, t, E.ioS);
  c.globalAlpha = 1;
  // quarter wedge: fifteen minutes is a quarter of the clock
  if (ticks > 0) {
    const P = MP(m, 0, 0); if (P) {
      c.beginPath(); c.moveTo(P.x, P.y); polyRingCont(c, m, dialR - 6, -PI / 2, -PI / 2 + ticks / 60 * TAU, 40); c.closePath();
      const g = c.createRadialGradient(P.x, P.y, 0, P.x, P.y, dialR * P.s * m.sc);
      g.addColorStop(0, rgba(ORANGE, 0)); g.addColorStop(1, rgba(ORANGE, .2 * k)); c.fillStyle = g; c.fill();
    }
  }
  // dial ticks
  for (let i = 0; i < 60; i++) {
    const an = -PI / 2 + i * TAU / 60, major = i % 5 === 0, lit = i < ticks + .001 && ticks > 0 ? clamp(ticks - i + 1) : 0;
    const r0 = dialR - (major ? 22 : 11), p = MP(m, Math.cos(an) * r0, Math.sin(an) * r0), q = MP(m, Math.cos(an) * dialR, Math.sin(an) * dialR);
    if (!p || !q) continue;
    c.strokeStyle = lit ? rgba(mix(ORANGE, WARM, .3), k) : rgba(BLUE_HI, (major ? .6 : .32) * k);
    c.lineWidth = (major ? 3.2 : 2) * p.s * m.sc;
    c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
    if (lit && !mirror) glow(c, SP.o, q.x, q.y, 22 * p.s * m.sc, .5 * k * lit);
  }
  // counter-rotating segment ring
  const rot = -t * .16;
  for (let i = 0; i < 24; i++) {
    const a0 = rot + i * TAU / 24, a1 = a0 + TAU / 24 * .72;
    c.lineWidth = 6 * m.sc; c.strokeStyle = rgba(BLUE, .26 * k); polyRing(c, m, segR, a0, a1, 6); c.stroke();
  }
  // outer orbit (harmony)
  const orb = pr(A4.harmony + .1, A4.harmony + .8, t) * keep;
  if (orb > 0) {
    const h = heroRing(t);
    for (let i = 0; i < 160; i++) {
      const an = i / 160 * TAU, p = MP(m, Math.cos(an) * ORBIT_R, Math.sin(an) * ORBIT_R); if (!p) continue;
      const dh = Math.abs(Math.atan2(Math.sin(an - (h[2] || 0)), Math.cos(an - (h[2] || 0))));
      const col = mix(BLUE_HI, ORANGE_HI, Math.pow(1 - dh / PI, 3));
      c.fillStyle = rgba(col, orb * (.25 + .5 * Math.pow(1 - dh / PI, 4))); const s = 2.2 * p.s; c.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
  }
  // sweeping hand
  if (t > A4.tick0 - .05 && t < A4.harmony + .3 && !mirror) {
    const ha = -PI / 2 + ticks / 60 * TAU, P = MP(m, 0, 0), Q = MP(m, Math.cos(ha) * (dialR - 4), Math.sin(ha) * (dialR - 4));
    const a = pr(A4.tick0 - .05, A4.tick0 + .1, t) * (1 - pr(A4.harmony, A4.harmony + .3, t));
    if (P && Q) { c.strokeStyle = rgba(WARM, .55 * a); c.lineWidth = 2; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(Q.x, Q.y); c.stroke(); }
  }
  c.globalCompositeOperation = 'source-over';
  // the glossy torus (the closed circle of Act 3, now a precise mechanism)
  c.globalAlpha = k;
  tube(c, m, TUBE_R, 26, t, 1, .25);
  c.globalAlpha = 1;
  // three beads: the three answered questions, locked into the structure
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const an = -PI / 2 + i * TAU / 3 + PI / 3 - t * .05, p = MP(m, Math.cos(an) * TUBE_R, Math.sin(an) * TUBE_R);
    if (p) { glow(c, SP.o, p.x, p.y, 34 * p.s * m.sc, .7 * k); glow(c, SP.w, p.x, p.y, 9 * p.s * m.sc, .9 * k); }
  }
  c.globalCompositeOperation = 'source-over';
  if (mirror) { const h = heroRing(t); const p = MP(m, h[0], h[1]); if (p) { c.globalCompositeOperation = 'lighter'; glow(c, SP.o, p.x, p.y, 70, .6); c.globalCompositeOperation = 'source-over'; } }
}
function polyRingCont(c, m, R, a0, a1, n) {
  for (let i = 0; i <= n; i++) { const an = lerp(a0, a1, i / n), p = MP(m, Math.cos(an) * R, Math.sin(an) * R); if (p) c.lineTo(p.x, p.y); }
}

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
function drawConvergingPair(c, t, hero) {
  // the parent appears in the harmony orbit, then both settle into the logo
  if (t < A4.harmony) return;
  const m = mechAt(t);
  const h = heroRing(t), thH = h[2] || 0, thP = thH - .44;
  const appear = E.outBack(inv(A4.harmony + .25, A4.harmony + .75, t), 1.3);
  let Pp = MP(m, Math.cos(thP) * ORBIT_R, Math.sin(thP) * ORBIT_R), Ph = MP(m, h[0], h[1]);
  let rH = 13 * (Ph ? Ph.s : 1) * lerp(1, 1.5, pr(A4.harmony, A4.harmony + 1, t)), rP = 25 * appear;
  const trailA = pr(A4.harmony + .3, A4.harmony + 1, t) * (1 - pr(A5.converge, A5.converge + .45, t));
  if (trailA > 0) { // the two travel the same path now: a shared orbit instead of a rope
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const [th0, col, len] of [[thH, ORANGE, 1.1], [thP, BLUE, 1.3]]) {
      for (let i = 0; i < 24; i++) {
        const a0 = th0 + i / 24 * len, a1 = th0 + (i + 1) / 24 * len;
        const p0 = MP(m, Math.cos(a0) * ORBIT_R, Math.sin(a0) * ORBIT_R), p1 = MP(m, Math.cos(a1) * ORBIT_R, Math.sin(a1) * ORBIT_R); if (!p0 || !p1) continue;
        c.strokeStyle = rgba(col, trailA * .8 * Math.pow(1 - i / 24, 1.6)); c.lineWidth = 6 * (1 - i / 24) + 1;
        c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.stroke();
      }
    }
    c.lineCap = 'butt'; c.globalCompositeOperation = 'source-over';
  }
  let flat = 0, halo = 1;
  const cv = pr(A5.converge, A5.converge + .9, t, E.ioC);
  if (cv > 0) {
    // polar interpolation around the mechanism centre toward the exact logo circles
    const cxs = CX + m.cx, cys = CY + m.cy;
    const tgt = (L, th0, r0) => {
      const [lx, ly] = logoPt(L[0], L[1]); let th1 = Math.atan2(ly - cys, lx - cxs); const r1 = Math.hypot(lx - cxs, ly - cys);
      while (th1 > th0 + PI) th1 -= TAU; while (th1 < th0 - PI) th1 += TAU;
      const th = lerp(th0, th1, cv), r = lerp(r0, r1, cv); return [cxs + Math.cos(th) * r, cys + Math.sin(th) * r];
    };
    const R0 = ORBIT_R * m.sc;
    const thH0 = -.494 * (A5.converge - A4.harmony), thP0 = thH0 - .44;
    const hh = tgt(L_OR, thH0 + (-.494) * (t - A5.converge) * (1 - cv), R0), pp = tgt(L_HD, thP0 + (-.494) * (t - A5.converge) * (1 - cv), R0);
    Ph = { x: hh[0], y: hh[1], s: 1 }; Pp = { x: pp[0], y: pp[1], s: 1 };
    rH = lerp(rH, L_OR[2] * LOGO_S, cv); rP = lerp(25, L_HD[2] * LOGO_S, cv); flat = cv; halo = lerp(1, .18, cv);
  }
  const endHalo = 1 - pr(22.0, 23.0, t);
  const land = decay(t, A5.converge + .9, .5);
  if (land > 0 && Ph) { c.globalCompositeOperation = 'lighter'; glow(c, SP.w, (Ph.x + Pp.x) / 2, (Ph.y + Pp.y) / 2, 260, .25 * land); c.globalCompositeOperation = 'source-over'; }
  if (Pp && rP > .5) sphere(c, Pp.x, Pp.y, rP, BLUE, { energy: .85, flat, halo: halo * endHalo });
  if (Ph) sphere(c, Ph.x, Ph.y, rH, ORANGE, { energy: 1, flat, halo: halo * endHalo });
  hero.drawn = true;
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
    const nudge = 4 * Math.sin(Math.max(0, t - 23.2) * 3.2) * pr(23.2, 23.6, t);
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
/* master timeline                                                        */
/* ===================================================================== */
function shakeAt(t) {
  const a = 9 * decay(t, A1.freeze, .3) + 5 * decay(t, A1.battle + .2, .25) + 10 * decay(t, A1.snap, .3) + 8 * pr(A2.peak - .6, A2.stop, t, E.inQ) * (t < A2.stop ? 1 : 0)
    + 4 * decay(t, A4.earned, .35) + 2 * decay(t, A3.lock, .2);
  return [noise(t * 43) * a, noise(t * 47 + 11) * a];
}
const POST = [], POST_END = A2.arc + .45;
function renderScene(t) {
  const c = sc; POST.length = 0;
  background(c, t);
  const [sx, sy] = shakeAt(t);
  const hero = {};
  if (t > A5.converge) beams(c, LOGO_X, LOGO_Y - 60, 12, 1300, .03, t * .025, BLUE_HI, .045 * pr(A5.converge, A5.cta, t), 21);
  // ---- ACT 1 ----
  if (t < A1.slice + .13) {
    camArr(frontal); cam.ox = sx; cam.oy = sy;
    dust(c, t, inv(.3, 1, t) * (1 - inv(2.4, 3.3, t)) * .9, 1400);
    drawHook(c, t);
  }
  if (t >= A1.slice && t < A1.snap + .1) {
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
  // ---- ACT 2: the loop, then the feed gathers into the lesson page ----
  if (t >= A2.start && t < A3.sheet + 1.3) {
    const te = effT(t);
    let ca = camA2(te);
    if (t > A2.unravel) ca = ca.map((v, i) => lerp(v, frontal[i], pr(A2.unravel, A2.unravel + .85, t, E.ioC)));
    camArr(ca); cam.ox = sx; cam.oy = sy;
    dust(c, t, .8 * (1 - pr(A2.unravel, A3.sheet + .6, t)), 1300);
    drawStream(c, t);
    const lh = drawLoopHero(c, t);
    if (lh) { hero.x = lh.x; hero.y = lh.y; hero.r = lh.r; hero.e = lh.e; }
    drawCounter(c, t);
  }
  // ---- ACT 3a: the parent scans the lesson, the quiz lands on the child's tablet ----
  if (t >= A3.sheet && t < A3.diveEnd) {
    camArr(scanCam(t)); cam.ox = sx; cam.oy = sy;
    dust(c, t, .45 * pr(A3.sheet, A3.sheet + .8, t), 1000);
    drawScan(c, t, hero);
  }
  // ---- ACT 3b / 4 / 5: inside the child's screen ----
  if (t >= A3.diveEnd) {
    camArr(ringCam(t)); cam.ox = sx; cam.oy = sy;
    dust(c, t, .55, 1000);
    drawRing(c, t, hero);
  }
  drawSteps(c, t);
  // ---- the child, continuous from first frame to the logo ----
  if (t >= A2.start && t < A5.converge) drawHeroMid(c, t, hero);
  if (t >= A2.arc && t < A3.sheet + .7) { if (t < POST_END) POST.push(o => drawCradle(o, t, hero.cx, hero.cy)); else drawCradle(c, t, hero.cx, hero.cy); }
  if (t >= A5.converge - .1) dustEnd(c, t);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.setTransform(1, 0, 0, 1, 0, 0);
}
function dustEnd(c, t) { camArr(frontal); dust(c, t, .35 * pr(A5.converge, A5.converge + 1, t), 1000); }
function drawHeroMid(c, t, hero) {
  // where the child is, from the loop to the tablet to the ring (the pair takes over at the harmony orbit)
  let x, y, r, e = 1;
  const mid = [CX, CY + 82]; // the frozen child, seen by the frontal camera
  if (t < A3.sheet + .1) {
    if (hero.x === undefined) return;
    x = hero.x; y = hero.y; r = hero.r; e = hero.e;
    if (t > A2.arc) { const k = pr(A2.arc + .1, A3.sheet, t); e = lerp(e, 1, k); r = lerp(r, 12, k); }
  } else if (t < A3.forms) {
    // released from the embrace, the child goes back to their own screen: the tablet
    const base = hero.x !== undefined ? [hero.x, hero.y] : mid;
    const k = pr(A3.sheet + .1, A3.sheet + .85, t, E.ioC);
    const tp = proj(TAB_M.cx, TAB_M.cy - 58 * TAB_M.sc, 0);
    x = lerp(base[0], tp.x, k); y = lerp(base[1], tp.y, k) - Math.sin(PI * k) * 110;
    r = lerp(12, 13 * TAB_M.sc * tp.s, k); e = lerp(1, .8, k);
  } else {
    if (t >= A4.harmony || hero.x === undefined) return; // the pair is drawn by drawConvergingPair
    x = hero.x; y = hero.y; r = 13 * hero.s;
    e = (t < A3.quiz + .3 ? .8 : 1) + .5 * decay(t, closeT, .8) + .3 * decay(t, A4.earned, .8);
  }
  hero.cx = x; hero.cy = y;
  const flare = t > A3.forms ? .25 : 0, sep = t < A2.stop ? pr(A2.start + .5, A2.start + 1.5, t) : 0;
  if (t >= A2.stop && t < POST_END) { const rr = r * 1.15; POST.push(o => sphere(o, x, y, rr, ORANGE, { energy: Math.max(e, .7), flare: .2 })); return; }
  sphere(c, x, y, r, ORANGE, { energy: e, flare, sep });
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
  const st = inv(A2.stop, A2.stop + .1, t) * (1 - inv(A2.arc + .15, A2.arc + .6, t));
  sat -= .62 * st; br -= .36 * st;
  return { sat, br };
}
function whip(t) {
  const s = A1.snap;
  if (t < s || t > s + .3) return 0;
  if (t < s + .1) return 1500 * E.inQ(inv(s, s + .1, t));
  return -1500 * (1 - E.outC(inv(s + .1, s + .3, t)));
}
function flashAt(t) {
  return .24 * decay(t, A1.burst, .22) + .3 * decay(t, A1.freeze, .12) + .14 * decay(t, A1.slice + .12, .15) + .3 * decay(t, A1.snap, .1)
    + .06 * decay(t, A3.detected, .2) + .16 * decay(t, closeT, .22) + .08 * decay(t, A4.lock, .15) + .15 * decay(t, A4.earned, .25);
}
function caAt(t) {
  return 7 * decay(t, A1.freeze, .18) + 9 * decay(t, A1.snap, .25) + (t > A2.peak && t < A2.stop ? 4 + 5 * noise(t * 60) : 0) + 3 * decay(t, closeT, .2) + 2 * decay(t, A4.earned, .2);
}
function composite(t, out) {
  const g = grade(t), wx = whip(t);
  out.setTransform(1, 0, 0, 1, 0, 0); out.globalAlpha = 1; out.globalCompositeOperation = 'source-over'; out.filter = 'none';
  out.fillStyle = rgb(DEEP); out.fillRect(0, 0, W, H);
  const f = (g.sat < .999 || g.br < .999) ? `saturate(${g.sat.toFixed(3)}) brightness(${g.br.toFixed(3)})` : 'none';
  out.filter = f;
  if (wx !== 0) { // whip pan: directional smear
    const n = 9; for (let i = 0; i < n; i++) { out.globalAlpha = 1 / (i + 1); const o = wx + (i - (n - 1) / 2) * Math.abs(wx) * .05; out.drawImage(scene, o, 0); out.drawImage(scene, o - Math.sign(o) * W, 0); }
    out.globalAlpha = 1;
  } else out.drawImage(scene, 0, 0);
  out.filter = 'none';
  // bloom (approximate threshold via contrast)
  b1c.globalCompositeOperation = 'copy'; b1c.filter = 'contrast(1.9) brightness(.95) blur(3px)'; b1c.drawImage(out.canvas, 0, 0, 480, 270); b1c.filter = 'none';
  b2c.globalCompositeOperation = 'copy'; b2c.filter = 'blur(4px)'; b2c.drawImage(b1, 0, 0, 240, 135); b2c.filter = 'none';
  const bk = 1 - .62 * pr(A3.sheet, A3.sheet + .6, t) * (1 - pr(A3.dive, A3.diveEnd, t));
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
  if (t < A4.harmony) return;
  camArr(ringCam(t)); drawConvergingPair(c, t, {});
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
