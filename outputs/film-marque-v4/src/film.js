/* ==========================================================================
   KIZZO — Brand film engine (v4: 9:16, product-film design)
   Deterministic: KZ.renderFrame(t) paints the exact frame at time t (seconds).
   Camera, particles, type and light are pure functions of t, so the browser
   player and the offline MP4 renderer produce the same film.
   ========================================================================== */
(function () {
'use strict';

const W = 1080, H = 1920, CX = W / 2, CY = H / 2, TAU = Math.PI * 2, PI = Math.PI;
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
const b1 = mk(270, 480), b1c = b1.getContext('2d');
const b2 = mk(135, 240), b2c = b2.getContext('2d');

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
function lay(str, wt, px, tr = 0, fam = 'Outfit') {
  const key = str + '|' + wt + '|' + px + '|' + tr + '|' + fam;
  let L = LC.get(key); if (L) return L;
  mctx.font = `${wt} ${px}px ${fam}`;
  const chars = [], n = str.length, trk = tr * px;
  for (let i = 0; i < n; i++) chars.push({ ch: str[i], x: mctx.measureText(str.slice(0, i)).width + i * trk, w: mctx.measureText(str[i]).width });
  L = { str, wt, px, tr, fam, chars, width: mctx.measureText(str).width + (n - 1) * trk };
  LC.set(key, L); return L;
}
function fit(str, wt, px, tr, maxW, fam) { const L = lay(str, wt, px, tr, fam); return L.width > maxW ? Math.floor(px * maxW / L.width) : px; }
// letters(): per-letter kinetic type. fn(i, ch, lx) returns {a, dx, dy, sc, rot, blur, col} or null.
function letters(c, L, cx, by, fn, skipLast) {
  c.font = `${L.wt} ${L.px}px ${L.fam}`; c.textBaseline = 'alphabetic'; c.textAlign = 'center';
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


function radial(c, x, y, r, col, a, mid = .35) {
  if (a <= .003) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(.45, rgba(col, a * mid)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.globalAlpha = 1; c.fillRect(0, 0, W, H);
}

/* ===================================================================== */
/* DESIGN — black stage, one accent, Inter Display, real-looking devices  */
/* ===================================================================== */
const HD = 'InterD', TX = 'Inter';
const UI = { fg: '#f5f5f7', sub: '#86868b', dim: '#6e6e73', or: '#ff7a1b', green: '#30d158', red: '#ff453a' };
const HO = Q.h, B = Q.b, A3 = Q.a3, D = Q.d, EC = Q.e, F = Q.f, G = Q.g, A5 = Q.a5;
const PHN = { x: -265, y: 250 }, TBL = { x: 185, y: 250 };             // device centres (world)
const PH = { w: 320, h: 668, r: 54, sw: 296, sh: 644, sr: 44 };       // the parent's phone (local units)
const TB = { w: 480, h: 640, r: 34, sw: 452, sh: 612, sr: 20 };       // the child's tablet, portrait
const PSX = PH.sw / 736, PSY = PH.sh / 1600;                           // phone screen units (736 × 1600) -> local
const TS = .5, SW = 904, SH = 1224;                                    // tablet screen units -> local
const SHEET = { x: -215, y: 300, z: 80, rot: -.05, sc: .74 };
const PKT = { gap: .12, dur: .78 };
const KD = { orange: UI.or, green: UI.green };
const devIn = t => pr(B.devices - .1, B.devices + .45, t, E.outC);   // the phone arrives; the tablet is there from frame 1
const devOut = t => pr(A5.out, A5.out + .5, t, E.ioC);

/* ---------- atmosphere: black, with a soft pool of light behind the devices ---------- */
const AMB = [
  [0, [18, 22, 34], .8, 1500], [HO.slam - .02, [18, 22, 34], .8, 1500], [HO.slam + .1, [38, 18, 16], .7, 1300], [HO.pull, [16, 18, 28], .7, 1300],
  [HO.pullEnd, [18, 22, 34], .9, 1500], [EC.lock - .05, [18, 22, 34], .9, 1500], [EC.lock + .15, [30, 16, 16], .7, 1300],
  [F.unlock - .05, [30, 16, 16], .7, 1300], [F.unlock + .25, [40, 28, 16], .9, 1500], [G.pullEnd, [18, 22, 34], .9, 1500], [Q.duration, [14, 18, 30], .9, 1500]];
function ambient(t) {
  let i = 0; while (i < AMB.length - 2 && t > AMB[i + 1][0]) i++;
  const A = AMB[i], B_ = AMB[i + 1], k = inv(A[0], B_[0], t);
  return { col: mix(A[1], B_[1], k), a: lerp(A[2], B_[2], k), r: lerp(A[3], B_[3], k) };
}
function background(c, t) {
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.filter = 'none';
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const k = ambient(t); radial(c, CX, CY + 250, k.r, k.col, k.a, .3);
}

/* ---------- camera: dolly moves only, so the screens stay flat and legible ---------- */
const WIDE = [0, 83, -880], SCANC = [-130, 200, -820], RULEC = [-192, 103, -667], DIVE = [TBL.x, TBL.y - 118, -480];
const FULLC = t => [TBL.x, TBL.y - 118, lerp(-505, -480, E.outQ(inv(0, HO.slam, t)))];
const CAMK = [
  [HO.pull, HO.pullEnd, FULLC(HO.pull), WIDE],
  [A3.sheet - .1, A3.sheet + .6, WIDE, SCANC],
  [D.push, D.push + .75, SCANC, RULEC],
  [D.save + .05, D.tokenEnd - .05, RULEC, WIDE],
  [EC.dive, EC.diveEnd, WIDE, DIVE],
  [G.pull, G.pullEnd, DIVE, WIDE],
];
function camV4(t) {
  let p = FULLC(t);
  for (const [t0, t1, a, b] of CAMK) if (t >= t0) p = t >= t1 ? b : a.map((v, i) => lerp(v, b[i], E.ioC(inv(t0, t1, t))));
  const dk = pr(HO.pull, HO.pullEnd + 1, t) * (1 - pr(EC.dive, EC.diveEnd, t) * (1 - pr(G.pull, G.pullEnd, t)));
  const dx = 4 * Math.sin(t * .4) * dk, dy = 3 * Math.sin(t * .33 + 1) * dk;
  return [p[0] + dx, p[1] + dy, p[2], p[0] + dx, p[1] + dy, 0, 1000, 0];
}
function phoneState(t) {
  const up = pr(A3.tap - .15, A3.cam + .25, t) * (1 - pr(A3.sheetOut, A3.sheetOut + .5, t)); // lifted above the page to scan it
  const enter = 1 - E.outC(inv(B.devices - .3, B.devices + .45, t));
  const taps = decay(t, A3.tap, .2) + decay(t, D.toggle, .2) + decay(t, D.pick, .2) + decay(t, D.qs, .2) + decay(t, D.save, .2);
  return { x: PHN.x + 45 * up - 700 * enter, y: PHN.y + 40 * up, z: -130 * up, rot: -.04 * up,
    k: 1 + .02 * decay(t, A3.lock, .25) + .015 * decay(t, A3.shot, .2) + .008 * taps + .015 * decay(t, G.notif, .35) };
}
function tabletState(t) {
  return { x: TBL.x, y: TBL.y, k: 1 + .015 * decay(t, A3.tray, .3) + .02 * decay(t, D.tokenEnd, .3) + .012 * decay(t, EC.lock, .35) + .015 * decay(t, F.unlock, .45) };
}

/* ---------- shared helpers (screen units) ---------- */
function roundFill(c, x, y, w, h, r, col) { c.fillStyle = col; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); }
function card(c, x, y, w, h) {
  c.save(); c.shadowColor = 'rgba(30,50,60,.10)'; c.shadowBlur = 24; c.shadowOffsetY = 6; roundFill(c, x, y, w, h, 30, '#fff'); c.restore();
}
function checkMark(c, x, y, k, col, lw) { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); checkPath(c, x, y, k); c.stroke(); c.lineCap = 'butt'; }
// a fingertip: arrives, presses at t0, lifts — with the ripple of the tap
function touch(c, t, t0, x, y, dark, r = 40) {
  const a = pr(t0 - .24, t0 - .08, t) * (1 - pr(t0 + .12, t0 + .32, t)); if (a <= .003 && (t < t0 || t > t0 + .45)) return;
  const ga = c.globalAlpha, q = inv(t0, t0 + .42, t);
  if (q > 0 && q < 1) { c.globalAlpha = ga * (1 - q); c.strokeStyle = dark ? 'rgba(20,30,40,.35)' : 'rgba(255,255,255,.6)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r + 80 * E.outC(q), 0, TAU); c.stroke(); }
  if (a > .003) {
    const s = 1 - .14 * decay(t, t0, .22);
    c.globalAlpha = ga * a; c.fillStyle = dark ? 'rgba(20,30,40,.2)' : 'rgba(255,255,255,.3)';
    c.beginPath(); c.arc(x, y, r * s, 0, TAU); c.fill();
    c.strokeStyle = dark ? 'rgba(20,30,40,.35)' : 'rgba(255,255,255,.7)'; c.lineWidth = 2.5; c.stroke();
  }
  c.globalAlpha = ga;
}
const LPX = { head: new Path2D(LOGO.paths.head), orange: new Path2D(LOGO.paths.orange), body: new Path2D(LOGO.paths.body), word: new Path2D(LOGO.paths.word) };
function miniLogo(c, x, y, h, word = '#fff') {
  const s = h / 810; c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = rgb(BLUE); c.fill(LPX.body); c.fill(LPX.head); c.fillStyle = rgb(ORANGE); c.fill(LPX.orange); c.fillStyle = word; c.fill(LPX.word);
  c.restore();
}
function glass(c, x, y, w, h, r) { // a faint sheen across the glass
  const g = c.createLinearGradient(x, y, x + w * .8, y + h); g.addColorStop(0, 'rgba(255,255,255,.06)'); g.addColorStop(.42, 'rgba(255,255,255,.012)'); g.addColorStop(.43, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
}
// SF-symbol-like padlock: a solid body, a round shackle
function padlock(c, x, y, s, open, rot, body = UI.fg, hole = '#1c1c1e') {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.save(); c.translate(0, -26 * open); c.translate(34, -4); c.rotate(.3 * open); c.translate(-34, 4);
  c.lineWidth = 15; c.strokeStyle = body; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-34, -4); c.lineTo(-34, -38); c.arc(0, -38, 34, PI, 0); c.lineTo(34, -4); c.stroke(); c.restore();
  roundFill(c, -58, -12, 116, 92, 20, body);
  c.fillStyle = hole; c.beginPath(); c.arc(0, 26, 11, 0, TAU); c.fill(); c.beginPath(); c.roundRect(-4.5, 26, 9, 24, 4); c.fill();
  c.restore();
}

/* ---------- the parent's phone ---------- */
function ripple(c, t, t0, x, y) { touch(c, t, t0, x, y, true, 38); }
function drawPhoneV4(c, t) {
  const din = devIn(t), A = (1 - devOut(t)) * clamp(din * 1.5); if (A <= .003) return;
  const st = phoneState(t), P = proj(st.x, st.y, st.z); if (!P) return;
  const s = P.s * st.k * lerp(1, .86, devOut(t)), cs = Math.cos(st.rot) * s, sn = Math.sin(st.rot) * s;
  c.setTransform(cs, sn, -sn, cs, P.x, P.y); c.globalAlpha = A;
  // titanium band, buttons, black glass
  const g = c.createLinearGradient(-PH.w / 2, 0, PH.w / 2, 0);
  g.addColorStop(0, '#9a9aa0'); g.addColorStop(.035, '#4a4a4f'); g.addColorStop(.5, '#2a2a2e'); g.addColorStop(.965, '#4a4a4f'); g.addColorStop(1, '#9a9aa0');
  c.fillStyle = '#56565b'; c.fillRect(-PH.w / 2 - 3, -190, 4, 58); c.fillRect(-PH.w / 2 - 3, -112, 4, 58); c.fillRect(PH.w / 2 - 1, -150, 4, 92);
  c.beginPath(); c.roundRect(-PH.w / 2, -PH.h / 2, PH.w, PH.h, PH.r); c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.2; c.stroke();
  c.beginPath(); c.roundRect(-PH.w / 2 + 5, -PH.h / 2 + 5, PH.w - 10, PH.h - 10, PH.r - 5); c.fillStyle = '#000'; c.fill();
  c.save(); c.beginPath(); c.roundRect(-PH.sw / 2, -PH.sh / 2, PH.sw, PH.sh, PH.sr); c.clip();
  c.translate(-PH.sw / 2, -PH.sh / 2); c.scale(PSX, PSY); c.globalAlpha = A;
  phoneScreen(c, t, A);
  c.restore();
  c.globalAlpha = A; glass(c, -PH.sw / 2, -PH.sh / 2, PH.sw, PH.sh, PH.sr);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
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

/* ---------- the child's tablet: a calm, grown-up interface ---------- */
function kidBg(c) {
  const g = c.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#16161c'); g.addColorStop(1, '#0b0b0e');
  c.fillStyle = g; c.fillRect(0, 0, SW, SH);
  const r = c.createRadialGradient(SW * .85, 60, 0, SW * .85, 60, 620); r.addColorStop(0, 'rgba(255,122,27,.16)'); r.addColorStop(1, 'rgba(255,122,27,0)');
  c.fillStyle = r; c.fillRect(0, 0, SW, SH);
}
function kidStatus(c, col = UI.fg) {
  txt(c, '9:41', 56, 54, `600 26px ${TX}`, col);
  c.strokeStyle = col; c.lineWidth = 2.5; c.beginPath(); c.roundRect(804, 34, 46, 22, 6); c.stroke(); c.fillStyle = col; c.fillRect(808, 38, 34, 14); c.fillRect(852, 41, 3, 8);
  for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(772, 58, 8 + i * 7, -PI * .75, -PI * .25); c.lineWidth = 3; c.stroke(); }
}
function videoThumb(c, idx, x, y, w, h, t) {
  c.save(); c.beginPath(); c.roundRect(x, y, w, h, 26); c.clip();
  c.translate(x, y); c.scale(w / SW, h / (SW * h / w)); videoScene(c, idx, 2 + idx, true); c.restore();
  c.save(); c.beginPath(); c.roundRect(x, y, w, h, 26); c.clip();
  const g = c.createLinearGradient(0, y + h * .5, 0, y + h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = g; c.fillRect(x, y, w, h); c.restore();
  c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.moveTo(x + 30, y + h - 52); c.lineTo(x + 52, y + h - 38); c.lineTo(x + 30, y + h - 24); c.closePath(); c.fill();
  roundFill(c, x + 66, y + h - 46, 110 + 30 * hash(idx), 14, 7, 'rgba(255,255,255,.75)');
}
function childHome(c, t) {
  kidBg(c); kidStatus(c);
  miniLogo(c, 108, 156, 96);
  const hi = pr(HO.rewindEnd - .05, HO.rewindEnd + .45, t, E.outC);
  txt(c, S.tab.hello, 56, 300 + 16 * (1 - hi), `700 72px ${HD}`, UI.fg); txt(c, S.tab.date, 58, 348, `400 30px ${TX}`, UI.sub);
  const on = E.outBack(inv(B.linked, B.linked + .35, t), 1.6);
  if (on > 0) {
    c.font = `500 28px ${TX}`; const w = c.measureText(S.tab.active).width + 74;
    c.save(); c.translate(56, 380); c.scale(on, on); roundFill(c, 0, 0, w, 54, 27, 'rgba(48,209,88,.14)');
    c.fillStyle = UI.green; c.beginPath(); c.arc(30, 27, 8, 0, TAU); c.fill(); txt(c, S.tab.active, 50, 37, `500 28px ${TX}`, UI.green); c.restore();
  }
  // three questions, ready (they come from the lesson the parent just scanned)
  const tp = E.outC(inv(A3.tray - .05, A3.tray + .35, t)) * (1 - E.inC(inv(D.token, D.token + .3, t)));
  if (tp > .003) {
    const ga = c.globalAlpha; c.globalAlpha = ga * tp;
    c.save(); c.translate(0, 20 * (1 - tp));
    roundFill(c, 40, 470, 824, 150, 30, 'rgba(255,255,255,.07)');
    roundFill(c, 72, 502, 86, 86, 22, UI.or); txt(c, '?', 115, 562, `700 54px ${HD}`, '#fff', 'center');
    txt(c, S.tab.ready, 186, 538, `600 36px ${HD}`, UI.fg); txt(c, S.tab.lesson, 186, 580, `400 28px ${TX}`, UI.sub);
    for (let k = 0; k < 3; k++) {
      const q = E.outBack(inv(A3.send + k * PKT.gap + PKT.dur - .04, A3.send + k * PKT.gap + PKT.dur + .25, t), 2); if (q <= 0) continue;
      c.save(); c.translate(664 + k * 64, 545); c.scale(q, q); roundFill(c, -24, -24, 48, 48, 14, 'rgba(255,122,27,.2)'); txt(c, '?', 0, 12, `700 30px ${HD}`, UI.or, 'center'); c.restore();
    }
    c.restore(); c.globalAlpha = ga;
  }
  txt(c, S.tab.watch, 56, 698, `600 32px ${HD}`, UI.fg);
  const tiles = [[40, 728, 0], [464, 728, 2], [40, 968, 3], [464, 968, 4]];
  for (const [x, y, idx] of tiles) {
    const press = idx === 0 ? 1 - .04 * decay(t, D.tapVid, .25) : 1;
    c.save(); c.translate(x + 200, y + 110); c.scale(press, press); c.translate(-(x + 200), -(y + 110)); videoThumb(c, idx, x, y, 400, 220, t); c.restore();
  }
  touch(c, t, D.tapVid, 240, 838, false);
}

/* ---------- the feed: cinematic clips, not cartoons ---------- */
function heart(c) { c.moveTo(0, 32); c.bezierCurveTo(-58, -4, -36, -50, 0, -22); c.bezierCurveTo(36, -50, 58, -4, 0, 32); c.closePath(); }
function videoScene(c, idx, vt, still) {
  const k = ((idx % 5) + 5) % 5;
  if (k === 0) { // aurora over the mountains
    let g = c.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#03101a'); g.addColorStop(.6, '#0b2a33'); g.addColorStop(1, '#06141a');
    c.fillStyle = g; c.fillRect(0, 0, SW, SH);
    c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 60; i++) { const s = 1 + 2 * hash(i + 3); c.fillRect(hash(i) * SW, hash(i + 9) * 600, s, s); }
    c.globalCompositeOperation = 'lighter';
    for (let j = 0; j < 3; j++) {
      c.beginPath(); for (let x = -40; x <= SW + 40; x += 24) { const y = 360 + j * 70 + 70 * Math.sin(x * .007 + vt * .5 + j * 1.7) + 30 * Math.sin(x * .019 - vt * .8); x < -30 ? c.moveTo(x, y) : c.lineTo(x, y); }
      for (const [lw, a] of [[120, .1], [50, .18], [12, .35]]) { c.strokeStyle = j === 1 ? `rgba(120,255,200,${a})` : `rgba(60,220,170,${a})`; c.lineWidth = lw; c.stroke(); }
    }
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#0a1418'; c.beginPath(); c.moveTo(0, 860); c.lineTo(180, 720); c.lineTo(330, 820); c.lineTo(520, 640); c.lineTo(720, 830); c.lineTo(SW, 740); c.lineTo(SW, SH); c.lineTo(0, SH); c.fill();
    c.fillStyle = '#05090b'; c.beginPath(); c.moveTo(0, 980); c.lineTo(260, 880); c.lineTo(470, 990); c.lineTo(700, 900); c.lineTo(SW, 1000); c.lineTo(SW, SH); c.lineTo(0, SH); c.fill();
  } else if (k === 1) { // the ocean at dusk
    let g = c.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, '#1d2550'); g.addColorStop(.7, '#c65f6a'); g.addColorStop(1, '#f5a06a');
    c.fillStyle = g; c.fillRect(0, 0, SW, 640);
    const r = c.createRadialGradient(452, 610, 0, 452, 610, 340); r.addColorStop(0, 'rgba(255,225,170,1)'); r.addColorStop(.25, 'rgba(255,190,130,.6)'); r.addColorStop(1, 'rgba(255,160,110,0)');
    c.fillStyle = r; c.fillRect(0, 200, SW, 440);
    g = c.createLinearGradient(0, 640, 0, SH); g.addColorStop(0, '#2c2f5c'); g.addColorStop(1, '#0a0f24'); c.fillStyle = g; c.fillRect(0, 640, SW, SH - 640);
    for (let i = 0; i < 26; i++) { const y = 650 + Math.pow(i / 26, 1.6) * 580, w = 60 + 300 * (1 - i / 26);
      c.fillStyle = `rgba(255,200,150,${.5 * (1 - i / 26)})`; c.fillRect(452 - w / 2 + 30 * Math.sin(vt * 1.4 + i), y, w, 2 + i * .2); }
  } else if (k === 2) { // city lights
    let g = c.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#0b0b1e'); g.addColorStop(1, '#2a1446'); c.fillStyle = g; c.fillRect(0, 0, SW, SH);
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 34; i++) { const x = (hash(i) * SW + vt * 18 * (hash(i + 4) - .5) * 4 + SW) % SW, y = hash(i + 7) * 900, r = 30 + 70 * hash(i + 2);
      const col = [[255, 140, 60], [255, 80, 150], [90, 150, 255]][i % 3], rg = c.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, rgba(col, .45)); rg.addColorStop(.7, rgba(col, .18)); rg.addColorStop(1, rgba(col, 0)); c.fillStyle = rg; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 9; i++) { const x = i * 104 - 20, h = 260 + 320 * hash(i + 11); c.fillStyle = '#07060f'; c.fillRect(x, SH - h, 96, h);
      c.fillStyle = 'rgba(255,200,120,.55)'; for (let j = 0; j < 14; j++) if (hash(i * 31 + j) > .55) c.fillRect(x + 12 + (j % 4) * 20, SH - h + 24 + Math.floor(j / 4) * 40, 8, 14); }
  } else if (k === 3) { // dunes
    let g = c.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, '#f2a65a'); g.addColorStop(1, '#e46f7a'); c.fillStyle = g; c.fillRect(0, 0, SW, SH);
    c.fillStyle = 'rgba(255,236,200,.95)'; c.beginPath(); c.arc(620, 420, 80, 0, TAU); c.fill();
    const dune = (y0, amp, col, sp) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, SH);
      for (let x = 0; x <= SW; x += 16) c.lineTo(x, y0 + amp * Math.sin(x * .006 + sp * vt * .2 + y0)); c.lineTo(SW, SH); c.fill(); };
    dune(640, 60, '#d27a52', 1); dune(780, 80, '#b5583e', 1.5); dune(940, 70, '#8a3f30', 2); dune(1080, 50, '#5c2a24', 2.5);
  } else { // a slow, glowing abstract
    c.fillStyle = '#100a20'; c.fillRect(0, 0, SW, SH); c.globalCompositeOperation = 'lighter';
    for (const [x0, y0, r, col, ph] of [[250, 300, 520, [255, 122, 27], 0], [700, 520, 560, [255, 60, 140], 1.3], [360, 900, 600, [70, 120, 255], 2.6], [760, 1050, 420, [150, 70, 255], 4]]) {
      const x = x0 + 120 * Math.sin(vt * .5 + ph), y = y0 + 100 * Math.cos(vt * .4 + ph), rg = c.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, rgba(col, .75)); rg.addColorStop(1, rgba(col, 0)); c.fillStyle = rg; c.fillRect(0, 0, SW, SH); }
    c.globalCompositeOperation = 'source-over';
  }
  if (still) return;
  // minimal player chrome
  const bg = c.createLinearGradient(0, SH - 360, 0, SH); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = bg; c.fillRect(0, SH - 360, SW, 360);
  c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(84, SH - 150, 30, 0, TAU); c.fill();
  roundFill(c, 132, SH - 168, 230, 18, 9, 'rgba(255,255,255,.9)'); roundFill(c, 56, SH - 100, 520, 14, 7, 'rgba(255,255,255,.55)');
  c.strokeStyle = 'rgba(255,255,255,.92)'; c.lineWidth = 4;
  c.save(); c.translate(836, SH - 470); c.scale(.5, .5); c.beginPath(); heart(c); c.stroke(); c.restore();
  c.beginPath(); c.arc(836, SH - 370, 24, .3, TAU - .3); c.stroke();
  c.beginPath(); c.moveTo(814, SH - 250); c.lineTo(860, SH - 272); c.lineTo(846, SH - 226); c.closePath(); c.stroke();
  roundFill(c, 40, SH - 44, SW - 80, 5, 2.5, 'rgba(255,255,255,.3)'); roundFill(c, 40, SH - 44, (SW - 80) * frac(vt / 8 + idx * .23), 5, 2.5, '#fff');
}
const SWIPES = (() => { const a = []; for (let k = 1; k <= 6; k++) a.push(EC.lapse + (EC.zero - EC.lapse) * .82 * Math.pow(k / 6, .62)); return a; })();
function videoAt(t) {
  if (t >= F.resume) return { idx: 1, vt: t - F.resume + 1.5, prev: -1, p: 1 };
  const tt = Math.min(t, EC.zero);
  let i = 0; for (const s of SWIPES) if (tt >= s) i++;
  const t0 = i ? SWIPES[i - 1] : D.vid, tp = i > 1 ? SWIPES[i - 2] : D.vid;
  return { idx: i, vt: tt - t0, prev: i - 1, pvt: tt - tp, p: i ? E.ioC(inv(t0, t0 + .16, tt)) : 1 };
}
const vidCv = mk(SW, SH), vidX = vidCv.getContext('2d');
function drawVideoAt(c, t, blur) { drawFeed(c, videoAt(t), blur); }
function drawFeed(c, v, blur) {
  const draw = cc => {
    if (v.prev >= 0 && v.p < 1) {
      cc.save(); cc.translate(0, -SH * v.p); videoScene(cc, v.prev, v.pvt); cc.restore();
      cc.save(); cc.translate(0, SH * (1 - v.p)); videoScene(cc, v.idx, v.vt); cc.restore();
    } else videoScene(cc, v.idx, v.vt);
  };
  if (blur > .3) {
    vidX.setTransform(1, 0, 0, 1, 0, 0); vidX.globalAlpha = 1; vidX.globalCompositeOperation = 'source-over'; draw(vidX);
    c.filter = `blur(${blur.toFixed(1)}px) saturate(${(1 - blur / 50).toFixed(2)})`; c.drawImage(vidCv, 0, 0); c.filter = 'none';
  } else draw(c);
}
function timerSecs(t) {
  t = Math.round(t * 30) / 30; // digits hold for a whole frame so they stay crisp under motion blur
  if (t < EC.lapse) return 1200 - Math.max(0, Math.floor(t - D.tokenEnd));
  if (t < EC.zero) {
    const u = inv(EC.lapse, EC.zero, t);
    if (u < .72) return Math.max(3, Math.round(1199 - 1196 * E.inQ(u / .72)));
    return Math.max(0, 3 - Math.floor((u - .72) / .28 * 3));
  }
  if (t < F.resume) return 0;
  return 1200 - Math.max(0, Math.floor(t - F.resume - .3));
}
// Kizzo's timer: a small capsule above every app, with a ring that empties
function timerBadge(c, t, k) {
  if (k <= .003) return;
  const secs = timerSecs(t), str = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, zero = secs === 0 && t > EC.lapse;
  const lapse = pr(EC.lapse, EC.lapse + .3, t) * (1 - pr(EC.zero + .1, EC.lock + .4, t));
  const sc = k * (1 + .18 * lapse + .2 * decay(t, EC.zero, .35) + .15 * decay(t, F.resume + .15, .4));
  c.save(); c.translate(752, 64); c.scale(sc, sc);
  roundFill(c, -104, -32, 208, 64, 32, zero ? UI.red : 'rgba(0,0,0,.72)');
  c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 5; c.beginPath(); c.arc(-68, 0, 15, 0, TAU); c.stroke();
  c.strokeStyle = zero ? '#fff' : UI.or; c.lineCap = 'round'; c.beginPath(); c.arc(-68, 0, 15, -PI / 2, -PI / 2 + TAU * secs / 1200 + 1e-3); c.stroke(); c.lineCap = 'butt';
  c.font = `600 32px ${TX}`; c.textAlign = 'center'; c.fillStyle = '#fff';
  const ws = [...str].map(ch => ch === ':' ? 11 : 20); let x = 24 - ws.reduce((a, b) => a + b, 0) / 2;
  [...str].forEach((ch, i) => { c.fillText(ch, x + ws[i] / 2, 11); x += ws[i]; });
  c.restore();
}
// the lock, in the style of a system screen: blurred content, one symbol, one sentence, one button
function lockLayer(c, t, L) {
  const ga = c.globalAlpha, k = pr(L.lock, L.lock + .25, t);
  c.fillStyle = `rgba(8,8,12,${.55 * k})`; c.fillRect(0, 0, SW, SH);
  const sw = inv(L.swipe, L.swipe + .3, t), dy = sw > 0 && sw < 1 ? -36 * Math.sin(PI * sw) : 0;
  const dp = E.outBack(inv(L.lock, L.lock + (L.slam ? .3 : .38), t), L.slam ? 1.15 : 1.4);
  const wob = t > L.deny ? .2 * Math.sin((t - L.deny) * 38) * Math.max(0, 1 - (t - L.deny) / .5) : 0;
  c.save(); c.translate(0, dy);
  c.globalAlpha = ga * clamp(dp * 3);
  if (L.slam) padlock(c, 452, 420, lerp(3.6, 1.15, dp), 0, wob); else padlock(c, 452, 420 - 60 * (1 - dp), 1.15, 0, wob);
  const ca = E.outC(inv(L.card, L.card + .4, t));
  c.globalAlpha = ga * ca;
  txt(c, S.tab.lockTitle, 452, 618 + 20 * (1 - ca), `700 62px ${HD}`, UI.fg, 'center');
  wrapBal(S.tab.lockSub, `400 31px ${TX}`, 700).forEach((l, i) => txt(c, l, 452, 680 + i * 42 + 20 * (1 - ca), `400 31px ${TX}`, '#a1a1a6', 'center'));
  const bp = 1 - .05 * decay(t, L.go, .25);
  c.save(); c.translate(452, 880 + 20 * (1 - ca)); c.scale(bp, bp); roundFill(c, -210, -46, 420, 92, 46, UI.or); txt(c, S.tab.lockBtn, 0, 12, `600 34px ${TX}`, '#fff', 'center'); c.restore();
  c.globalAlpha = ga; c.restore();
  const ta = pr(L.deny, L.deny + .15, t) * (1 - pr(L.go - .15, L.go, t));
  if (ta > .003) {
    c.font = `600 28px ${TX}`; const w = c.measureText(S.tab.denied).width + 92;
    c.globalAlpha = ga * ta; c.save(); c.translate(452, 1080); c.scale(lerp(.85, 1, ta), lerp(.85, 1, ta));
    roundFill(c, -w / 2, -30, w, 60, 30, 'rgba(255,69,58,.92)'); padlock(c, -w / 2 + 36, 4, .2, 0, 0, '#fff', 'rgba(255,69,58,1)'); txt(c, S.tab.denied, -w / 2 + 62, 10, `600 28px ${TX}`, '#fff');
    c.restore(); c.globalAlpha = ga;
  }
  if (t > L.swipe - .2 && t < L.swipe + .5) {
    const a = pr(L.swipe - .2, L.swipe - .05, t) * (1 - pr(L.swipe + .3, L.swipe + .45, t)), q = E.ioC(inv(L.swipe, L.swipe + .3, t)), y = lerp(1100, 800, q), len = 280 * q;
    c.globalAlpha = ga * a;
    if (len > 2) { const tg = c.createLinearGradient(0, y, 0, y + len); tg.addColorStop(0, 'rgba(255,255,255,.35)'); tg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = tg; c.beginPath(); c.moveTo(740 - 26, y); c.lineTo(740 + 26, y); c.lineTo(740 + 4, y + len); c.lineTo(740 - 4, y + len); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.32)'; c.beginPath(); c.arc(740, y, 36, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2.5; c.stroke();
    c.globalAlpha = ga;
  }
  if (L.go < 90) touch(c, t, L.go, 520, 880, false);
}
function quizLayer(c, t) {
  const ga = c.globalAlpha, inK = E.outC(inv(F.start, F.start + .32, t)), cardA = 1 - pr(F.unlock - .06, F.unlock + .1, t);
  c.save(); c.translate(0, SH * (1 - inK));
  kidBg(c); kidStatus(c);
  c.globalAlpha = ga * cardA;
  // progress, in three segments
  const segW = (SW - 80 - 24) / 3;
  for (let k = 0; k < 3; k++) {
    const f = E.ioC(inv(F.tap[k] + .05, F.tap[k] + .35, t));
    roundFill(c, 40 + k * (segW + 12), 100, segW, 8, 4, 'rgba(255,255,255,.14)');
    if (f > 0) roundFill(c, 40 + k * (segW + 12), 100, segW * f, 8, 4, UI.or);
  }
  c.font = `500 28px ${TX}`; const lw = c.measureText(S.tab.lesson).width;
  roundFill(c, 40, 150, lw + 92, 60, 30, 'rgba(255,255,255,.08)');
  roundFill(c, 62, 164, 26, 32, 4, '#efe9dc'); c.fillStyle = 'rgba(44,63,140,.6)'; for (let i = 0; i < 3; i++) c.fillRect(66, 172 + i * 7, 17 - (i % 2) * 5, 2);
  txt(c, S.tab.lesson, 104, 190, `500 28px ${TX}`, UI.fg);
  padlock(c, 840, 180, .3, 0, 0);
  for (let i = 0; i < 3; i++) {
    if (i > 0 && t < F.q[i]) continue;
    const tin = i === 0 ? 1 : E.ioC(inv(F.q[i], F.q[i] + .3, t)), tout = i < 2 ? E.ioC(inv(F.q[i + 1], F.q[i + 1] + .3, t)) : 0;
    if (tout >= 1) continue;
    c.save(); c.translate(SW * (1 - tin) - SW * tout, 0); questionCard(c, t, i); c.restore();
  }
  c.globalAlpha = ga; c.restore();
}
function questionCard(c, t, i) {
  const Qd = S.tab.questions[i], hitT = F.tap[i];
  txt(c, S.tab.qOf.replace('{i}', i + 1), 56, 320, `500 28px ${TX}`, UI.sub);
  wrapBal(Qd.q, `700 58px ${HD}`, 790).forEach((l, j) => txt(c, l, 56, 400 + j * 68, `700 58px ${HD}`, UI.fg));
  const ga = c.globalAlpha;
  for (let j = 0; j < 3; j++) {
    const y = 640 + j * 138, ok = j === Qd.ok, hit = ok ? E.outC(inv(hitT, hitT + .2, t)) : 0, dim = !ok && t > hitT ? lerp(1, .4, inv(hitT, hitT + .2, t)) : 1;
    c.globalAlpha = ga * dim;
    roundFill(c, 40, y, SW - 80, 118, 26, hit > 0 ? rgba(mix([28, 28, 30], [22, 70, 38], hit), 1) : '#1c1c1e');
    if (hit > 0) { c.strokeStyle = rgba([48, 209, 88], hit); c.lineWidth = 2.5; c.beginPath(); c.roundRect(40, y, SW - 80, 118, 26); c.stroke(); }
    txt(c, Qd.a[j], 80, y + 71, `500 36px ${TX}`, UI.fg);
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 3; c.beginPath(); c.arc(SW - 98, y + 59, 20, 0, TAU); c.stroke();
    if (hit > 0) { c.fillStyle = UI.green; c.beginPath(); c.arc(SW - 98, y + 59, 22 * hit, 0, TAU); c.fill(); checkMark(c, SW - 98, y + 59, 1.6 * hit, '#fff', 4.5); }
  }
  c.globalAlpha = ga;
  touch(c, t, hitT, SW - 230, 640 + Qd.ok * 138 + 59, false);
}
// unlocked: one circle, one check, one sentence
function unlockLayer(c, t) {
  const ga = c.globalAlpha, k = E.outC(inv(F.unlock, F.unlock + .3, t));
  const rg = c.createRadialGradient(452, 470, 0, 452, 470, 620); rg.addColorStop(0, `rgba(255,122,27,${.22 * k})`); rg.addColorStop(1, 'rgba(255,122,27,0)');
  c.fillStyle = rg; c.fillRect(0, 0, SW, SH);
  const ring = E.ioC(inv(F.unlock, F.unlock + .45, t)), fill = E.outBack(inv(F.unlock + .3, F.unlock + .55, t), 1.6), ck = E.outC(inv(F.unlock + .42, F.unlock + .68, t));
  c.strokeStyle = UI.or; c.lineWidth = 10; c.lineCap = 'round';
  if (ring > 0) { c.beginPath(); c.arc(452, 470, 120, -PI / 2, -PI / 2 + TAU * ring); c.stroke(); }
  if (fill > 0) { c.fillStyle = UI.or; c.beginPath(); c.arc(452, 470, 120 * Math.min(1.05, fill), 0, TAU); c.fill(); }
  if (ck > 0) { c.strokeStyle = '#fff'; c.lineWidth = 16; c.lineJoin = 'round'; c.setLineDash([210 * ck, 400]); c.beginPath(); c.moveTo(398, 474); c.lineTo(438, 514); c.lineTo(512, 430); c.stroke(); c.setLineDash([]); }
  c.lineCap = 'butt';
  const bA = E.outC(inv(F.bravo, F.bravo + .4, t));
  c.globalAlpha = ga * bA; txt(c, S.tab.unlocked, 452, 700 + 18 * (1 - bA), `700 62px ${HD}`, UI.fg, 'center');
  txt(c, S.tab.score, 452, 760 + 18 * (1 - bA), `400 31px ${TX}`, '#a1a1a6', 'center');
  const pA = E.outC(inv(F.plus, F.plus + .35, t));
  c.globalAlpha = ga * pA; c.save(); c.translate(452, 870 + 14 * (1 - pA)); roundFill(c, -110, -38, 220, 76, 38, 'rgba(255,122,27,.16)'); txt(c, S.tab.plus, 0, 12, `600 34px ${TX}`, UI.or, 'center'); c.restore();
  c.globalAlpha = ga;
}
/* ---- the opening: the feed, the lock, then a rewind to "how does it work?" ---- */
const HV = [2, 3, 4, 0, 1];
const HK = { lock: HO.slam, card: HO.card, swipe: 99, deny: 99, go: 99, slam: true };
function hookFeed(t) {
  const tt = Math.min(t, HO.slam);
  let i = 0; for (let k = 1; k < HO.swipes.length; k++) if (tt >= HO.swipes[k]) i = k;
  const t0 = HO.swipes[i];
  return { idx: HV[i], vt: tt - t0 + 1, prev: i ? HV[i - 1] : -1, pvt: tt - HO.swipes[Math.max(0, i - 1)] + 1, p: i ? E.ioC(inv(t0, t0 + .12, tt)) : 1 };
}
function hookScreen(c, t) {
  drawFeed(c, hookFeed(t), 22 * pr(HO.slam, HO.slam + .18, t));
  if (t >= HO.slam) lockLayer(c, t, HK);
}
function rewindGlyph(c, a) {
  c.fillStyle = `rgba(255,255,255,${.9 * a})`;
  for (const dx of [-44, 32]) { c.beginPath(); c.moveTo(452 + dx + 38, 560); c.lineTo(452 + dx - 28, 612); c.lineTo(452 + dx + 38, 664); c.closePath(); c.fill(); }
}
function tabletScreen(c, t) {
  if (t < HO.rewindEnd) {
    const rp = E.ioC(inv(HO.rewind, HO.rewindEnd, t)), off = SH * 3 * rp;
    c.save(); c.translate(0, off); hookScreen(c, Math.min(t, HO.rewind)); c.restore();
    if (rp > 0) {
      c.save(); c.translate(0, off - SH); videoScene(c, HV[3], 1.2); c.restore();
      c.save(); c.translate(0, off - 2 * SH); videoScene(c, HV[1], .6); c.restore();
      c.save(); c.translate(0, off - 3 * SH); childHome(c, t); c.restore();
      const ga = c.globalAlpha, g = Math.sin(PI * rp); c.fillStyle = `rgba(0,0,0,${.35 * g})`; c.fillRect(0, 0, SW, SH);
      rewindGlyph(c, g); c.globalAlpha = ga;
    }
    return;
  }
  const vStart = E.ioC(inv(D.vid, D.vid + .35, t));
  if (t < D.vid + .35) { c.save(); c.translate(0, -SH * vStart); childHome(c, t); c.restore(); }
  if (t >= D.vid) {
    const blur = t >= EC.lock && t < F.resume + .45 ? 22 * pr(EC.lock, EC.lock + .25, t) * (1 - pr(F.resume, F.resume + .4, t)) : 0;
    c.save(); c.translate(0, SH * (1 - vStart)); drawVideoAt(c, t, blur); c.restore();
  }
  if (t >= EC.lock && t < F.resume + .45) {
    c.save(); c.translate(0, SH * E.ioC(inv(F.resume, F.resume + .4, t)));
    if (t < F.start + .32) lockLayer(c, t, EC);
    if (t >= F.start) quizLayer(c, t);
    if (t >= F.unlock) unlockLayer(c, t);
    c.restore();
  }
  const ba = E.outBack(inv(D.tokenEnd - .02, D.tokenEnd + .25, t), 1.6) * (1 - pr(F.start, F.start + .2, t)) + (t > F.resume ? pr(F.resume + .1, F.resume + .4, t) : 0);
  timerBadge(c, t, Math.min(1.15, ba));
}
function drawTabletV4(c, t) {
  const A = 1 - devOut(t); if (A <= .003) return;
  const st = tabletState(t), P = proj(st.x, st.y, 0); if (!P) return;
  const s = P.s * st.k * lerp(1, .86, devOut(t));
  c.setTransform(s, 0, 0, s, P.x, P.y); c.globalAlpha = A;
  // space-grey aluminium, slim black bezel
  const g = c.createLinearGradient(-TB.w / 2, -TB.h / 2, TB.w / 2, TB.h / 2); g.addColorStop(0, '#5a5a60'); g.addColorStop(.08, '#2e2e33'); g.addColorStop(.92, '#1f1f23'); g.addColorStop(1, '#4a4a50');
  c.beginPath(); c.roundRect(-TB.w / 2, -TB.h / 2, TB.w, TB.h, TB.r); c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1.2; c.stroke();
  c.beginPath(); c.roundRect(-TB.w / 2 + 4, -TB.h / 2 + 4, TB.w - 8, TB.h - 8, TB.r - 4); c.fillStyle = '#000'; c.fill();
  c.save(); c.beginPath(); c.roundRect(-TB.sw / 2, -TB.sh / 2, TB.sw, TB.sh, TB.sr); c.clip();
  c.translate(-TB.sw / 2, -TB.sh / 2); c.scale(TS, TS); c.globalAlpha = A;
  tabletScreen(c, t);
  c.restore();
  c.globalAlpha = A; glass(c, -TB.sw / 2, -TB.sh / 2, TB.sw, TB.sh, TB.sr);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}

/* ---------- the lesson page, the questions in flight, the 20-minute rule, the notification ---------- */
function drawSheetV4(c, t) {
  const inK = E.outC(inv(A3.sheet, A3.sheet + .5, t)), outK = E.inC(inv(A3.sheetOut, A3.sheetOut + .5, t));
  if (inK <= 0 || outK >= 1) return;
  const P = proj(SHEET.x, SHEET.y + 1100 * (1 - inK) + 1100 * outK, SHEET.z); if (!P) return;
  const s = P.s * SHEET.sc, rot = SHEET.rot + .12 * (1 - inK) - .08 * outK, cs = Math.cos(rot) * s, sn = Math.sin(rot) * s;
  c.setTransform(cs, sn, -sn, cs, P.x, P.y);
  c.globalAlpha = .55; c.fillStyle = '#000'; c.filter = 'blur(30px)'; c.fillRect(-262, -342, 560, 740); c.filter = 'none';
  drawSheet(c, t, 1, 1, false);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}
function packetPos(k, u) {
  const ps = phoneState(A3.send), a = [ps.x, ps.y - 40, ps.z - 10];
  const b = [TBL.x + 106 + 32 * k, TBL.y - 33, 0];
  const m = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 300 - k * 30, -260], q = 1 - u;
  return [0, 1, 2].map(i => q * q * a[i] + 2 * q * u * m[i] + u * u * b[i]);
}
function drawPackets(c, t) {
  for (let k = 0; k < 3; k++) {
    const t0 = A3.send + k * PKT.gap; if (t < t0 || t > t0 + PKT.dur + .06) continue;
    const u = E.ioC(inv(t0, t0 + PKT.dur, t)), fade = 1 - inv(t0 + PKT.dur - .02, t0 + PKT.dur + .06, t);
    c.globalCompositeOperation = 'lighter';
    for (let j = 8; j >= 1; j--) { const uj = E.ioC(inv(t0, t0 + PKT.dur, t - j * .02)); if (uj <= 0) continue;
      const q = packetPos(k, uj), p = proj(q[0], q[1], q[2]); if (p) glow(c, SP.oh, p.x, p.y, (14 - j) * p.s, .4 * (1 - j / 9) * fade); }
    const q = packetPos(k, u), P = proj(q[0], q[1], q[2]); if (!P) continue;
    const sz = lerp(24, 12, u) * P.s;
    c.globalCompositeOperation = 'source-over'; c.setTransform(1, 0, 0, 1, P.x, P.y); c.globalAlpha = fade;
    roundFill(c, -sz, -sz, sz * 2, sz * 2, sz * .45, rgb(ORANGE));
    c.fillStyle = '#fff'; c.font = `700 ${(sz * 1.25).toFixed(1)}px ${HD}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('?', 0, sz * .44);
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  }
  c.globalCompositeOperation = 'source-over';
}
const HOVER = t => [-40 + 4 * Math.sin(t * 2.1), 120 + 6 * Math.sin(t * 1.7), -200];
function stickerState(t) {
  const ps = phoneState(t), chip = [ps.x + (325 - 368) * PSX, ps.y + (510 - 800) * PSY, ps.z - 2], hv = HOVER(t);
  if (t < D.token) {
    const k = E.outBack(inv(D.pick + .1, D.pick + .55, t), 1.2), arc = Math.sin(PI * clamp(k)) * 50;
    return { p: [lerp(chip[0], hv[0], k), lerp(chip[1], hv[1], k) - arc, lerp(chip[2], hv[2], k)], w: lerp(38, 190, k), h: lerp(19, 74, k), m: 0, a: clamp(k * 8), u: 0 };
  }
  const u = E.ioC(inv(D.token, D.tokenEnd, t)), h0 = HOVER(D.token), b = [TBL.x + 150, TBL.y - 274, 0], m = [(h0[0] + b[0]) / 2, -420, -330], q = 1 - u;
  return { p: [0, 1, 2].map(i => q * q * h0[i] + 2 * q * u * m[i] + u * u * b[i]), w: lerp(190, 104, u), h: lerp(74, 32, u), m: inv(.04, .2, u), a: 1, u };
}
function drawToken(c, t) {
  // the parent's choice leaves the phone and becomes the child's timer
  if (t < D.pick + .1 || t > D.tokenEnd + .02) return;
  const st = stickerState(t), P = proj(st.p[0], st.p[1], st.p[2]); if (!P || st.a <= 0) return;
  c.globalCompositeOperation = 'lighter';
  glow(c, st.m > .5 ? SP.o : SP.b, P.x, P.y, 130 * P.s * st.h / 74, .35 * st.a);
  c.globalCompositeOperation = 'source-over';
  const w = st.w * P.s, h = st.h * P.s;
  c.setTransform(1, 0, 0, 1, P.x, P.y); c.globalAlpha = st.a;
  c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 30 * P.s; c.shadowOffsetY = 10 * P.s;
  roundFill(c, -w / 2, -h / 2, w, h, h / 2, rgb(mix(TEAL_RGB, [0, 0, 0], st.m * .28))); c.restore();
  if (st.m > 0) { c.globalAlpha = st.a * st.m; roundFill(c, -w / 2, -h / 2, w, h, h / 2, 'rgba(10,10,12,.95)'); c.strokeStyle = UI.or; c.lineWidth = 2; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, h / 2); c.stroke(); }
  c.textAlign = 'center'; c.fillStyle = '#fff';
  if (st.m < 1) { c.globalAlpha = st.a * (1 - st.m); c.font = `600 ${(h * .5).toFixed(1)}px ${TX}`; c.fillText('20 min', 0, h * .18); }
  if (st.m > 0) { c.globalAlpha = st.a * st.m; c.font = `600 ${(h * .54).toFixed(1)}px ${TX}`; c.fillText('20:00', 0, h * .19); }
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}
function drawNotifPop(c, t) {
  const k = E.outBack(inv(G.notif + .3, G.notif + .75, t), 1.2), out = 1 - pr(A5.out - .15, A5.out + .25, t);
  if (k <= 0 || out <= 0) return;
  const ps = phoneState(t), from = [ps.x, ps.y + (152 - 800) * PSY, ps.z - 2], to = [-40 + 4 * Math.sin(t * 1.8), -40 + 5 * Math.sin(t * 1.4), -250];
  const p = [0, 1, 2].map(i => lerp(from[i], to[i], k)), P = proj(p[0], p[1], p[2]); if (!P) return;
  const sc = P.s * .8 * lerp(PSX / .8, 1, k);
  c.setTransform(sc, 0, 0, sc, P.x, P.y); c.globalAlpha = out * clamp(k * 4); c.translate(-368, -100);
  notifCard(c);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
}
/* ---- the connection: a thin line of light from the parent's phone to the child's tablet ---- */
function linkPts(t) {
  const ps = phoneState(t), a = [ps.x, ps.y - 350, ps.z], b = [TBL.x, TBL.y - 336, 0], m = [(a[0] + b[0]) / 2, -240, -40];
  const out = []; for (let i = 0; i <= 40; i++) { const u = i / 40, q = 1 - u; out.push(proj(...[0, 1, 2].map(j => q * q * a[j] + 2 * q * u * m[j] + u * u * b[j]))); }
  return out;
}
const linkA = t => pr(B.link - .05, B.link + .1, t) * (1 - pr(A3.sheet - .2, A3.sheet + .2, t));
function drawLink(c, t) {
  const A = linkA(t); if (A <= .003) return;
  const pts = linkPts(t), head = E.ioC(inv(B.link, B.linked, t)), n = Math.round(head * 40);
  c.lineCap = 'round';
  if (n > 0) { c.beginPath(); for (let i = 0; i <= n; i++) { const p = pts[i]; if (p) i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); } c.strokeStyle = `rgba(245,245,247,${.55 * A})`; c.lineWidth = 2; c.stroke(); }
  if (head < 1 && pts[n]) { c.globalCompositeOperation = 'lighter'; glow(c, SP.w, pts[n].x, pts[n].y, 30, .9 * A); c.globalCompositeOperation = 'source-over'; }
  if (head >= 1) for (let j = 0; j < 3; j++) { const u = frac(t * .6 + j / 3), p = pts[Math.round(u * 40)]; if (p) { c.fillStyle = `rgba(255,255,255,${.8 * A * Math.sin(PI * u)})`; c.beginPath(); c.arc(p.x, p.y, 3.5, 0, TAU); c.fill(); } }
  const bA = A * E.outBack(inv(B.linked, B.linked + .3, t), 2), P = pts[20];
  if (bA > .003 && P) { c.globalAlpha = Math.min(1, bA); c.fillStyle = UI.green; c.beginPath(); c.arc(P.x, P.y, 18 * Math.min(1.1, bA), 0, TAU); c.fill(); checkMark(c, P.x, P.y, 1.05 * bA, '#fff', 3); c.globalAlpha = 1; }
  c.lineCap = 'butt';
}
function deviceGlows(c, t) {
  const A = 1 - devOut(t), Ap = A * devIn(t); if (A <= .003) return;
  c.globalCompositeOperation = 'lighter';
  const ps = phoneState(t), P = proj(ps.x, ps.y, ps.z), T = proj(TBL.x, TBL.y, 0);
  if (P && Ap > .003) glow(c, SP.b, P.x, P.y, 520 * P.s, .07 * Ap * (1 + .8 * decay(t, A3.shot, .5) + .6 * decay(t, G.notif, .6)));
  if (T) glow(c, SP.o, T.x, T.y, 700 * T.s, .06 * A * (1 + 1.2 * decay(t, F.unlock, .9) + .6 * decay(t, HO.slam, .5)));
  c.globalCompositeOperation = 'source-over';
}
function drawLabels(c, t) {
  const lab = (x, s, a) => { if (a <= .003) return; const P = proj(x, 640, 0); if (!P) return; c.globalAlpha = a; txt(c, s, P.x, P.y, `500 30px ${TX}`, UI.sub, 'center'); c.globalAlpha = 1; };
  lab(PHN.x, S.hl.you, pr(B.labels, B.labels + .4, t) * (1 - pr(A3.sheet - .2, A3.sheet + .1, t)));
  lab(TBL.x, S.hl.kid, pr(B.labels + .1, B.labels + .5, t) * (1 - pr(A3.sheet - .2, A3.sheet + .1, t)));
}

/* ---------- headlines, the way a product film speaks: one idea, two tones ---------- */
function headLines(c, t, t0, t1, lines, o = {}) {
  if (t < t0 || t > t1 + .4) return;
  const out = E.inQ(inv(t1, t1 + .3, t)), size = o.size || 92, lh = size * 1.1, top = o.top || 300;
  let y = top;
  if (o.eyebrow) { const a = pr(t0, t0 + .35, t) * (1 - out); c.globalAlpha = a; txt(c, o.eyebrow, CX, y - size * .95, `600 34px ${TX}`, UI.or, 'center'); c.globalAlpha = 1; }
  lines.forEach((ln, i) => {
    const [s, tone] = Array.isArray(ln) ? ln : [ln, i === 0 ? 'w' : 'g'];
    const px = fit(s, 700, size, -.02, 960, HD), L = lay(s, 700, px, -.02, HD), s0 = t0 + .06 + i * .09, p = E.outC(inv(s0, s0 + .5, t));
    if (p > 0) letters(c, L, CX, y + (1 - p) * 26 - out * 14, () => ({ a: p * (1 - out), col: tone === 'w' ? UI.fg : tone === 'o' ? UI.or : UI.sub }));
    y += lh;
  });
}
function drawHeadlines(c, t) {
  const h = S.hl;
  // the opening: a list that keeps growing, the newest line in white
  if (t < HO.slam + .4) {
    const out = E.inQ(inv(HO.slam, HO.slam + .2, t));
    h.hook.forEach((s, i) => {
      const t0 = HO.w[i]; if (t < t0) return;
      const p = i === 0 ? 1 : E.outBack(inv(t0, t0 + .16, t), 1.4), newest = i === 2 || t < HO.w[i + 1];
      const px = fit(s, 700, 132, -.025, 960, HD), L = lay(s, 700, px, -.025, HD);
      letters(c, L, CX, 230 + i * 142 - out * 30 * (i + 1), () => ({ a: clamp(p * 3) * (1 - out), sc: lerp(1.25, 1, clamp(p)), col: newest ? UI.fg : UI.dim }));
    });
  }
  headLines(c, t, HO.slam + .12, HO.pull - .05, [h.locked], { size: 110, top: 330 });
  headLines(c, t, HO.pull + .05, B.step - .15, h.question, { size: 96, top: 250 });
  headLines(c, t, B.step, A3.sheet - .15, h.s1.slice(1), { eyebrow: h.s1[0], top: 390 });
  headLines(c, t, A3.sheet - .05, D.push - .1, h.s2.slice(1), { eyebrow: h.s2[0], top: 390 });
  headLines(c, t, D.push, D.tokenEnd - .05, h.s3.slice(1), { eyebrow: h.s3[0], top: 390 });
  headLines(c, t, EC.diveEnd - .3, EC.zero, h.later, { top: 260 });
  headLines(c, t, EC.lock + .2, F.q[1] + .4, h.noAnswer, { top: 260 });
  headLines(c, t, F.q[1] + .55, F.resume + .1, h.right, { top: 260 });
  headLines(c, t, G.cap, A5.out + .05, h.follow, { top: 390 });
}
function drawStage(c, t) {
  deviceGlows(c, t);
  const ca = [cam.ox, cam.oy], cv = camV4(t);
  // the paper, the screens and the type sit above the bloom, so the interfaces keep their true colours
  POST.push(o => {
    camArr(cv); cam.ox = ca[0]; cam.oy = ca[1];
    drawLink(o, t); drawSheetV4(o, t); drawTabletV4(o, t); drawPhoneV4(o, t);
    drawPackets(o, t); drawToken(o, t); drawNotifPop(o, t); drawLabels(o, t);
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
    drawHeadlines(o, t);
  });
}


/* ---- the parent's app: the rule screen and the notification ---- */
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
function checkPath(c, x, y, k) { c.moveTo(x - 7 * k, y); c.lineTo(x - 2 * k, y + 5 * k); c.lineTo(x + 8 * k, y - 6 * k); }

const LOGO_S = .6, LOGO_X = CX, LOGO_Y = 830;
const L_OR = LOGO.orangeCircle, L_HD = LOGO.headCircle;
const logoPt = (lx, ly) => [LOGO_X + lx * LOGO_S, LOGO_Y + ly * LOGO_S];

/* ===================================================================== */
/* THE BRAND                                                              */
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
  // tagline, call to action, address — sentence case, generous space
  const ta = E.outC(inv(A5.tagline, A5.tagline + .6, t));
  if (ta > 0) {
    const px = fit(S.hl.tagline, 700, 74, -.02, 940, HD), L = lay(S.hl.tagline, 700, px, -.02, HD);
    letters(c, L, CX, 1225 + 24 * (1 - ta), () => ({ a: ta, col: UI.fg }));
  }
  const p = E.outC(inv(A5.cta, A5.cta + .5, t));
  if (p > 0) {
    c.font = `600 36px ${TX}`; const w = c.measureText(S.hl.cta).width + 150, y0 = 1320;
    c.globalAlpha = p; c.save(); c.translate(CX, y0 + 48 + 16 * (1 - p));
    roundFill(c, -w / 2, -48, w, 96, 48, UI.or);
    txt(c, S.hl.cta, -22, 13, `600 36px ${TX}`, '#fff', 'center');
    const ax = w / 2 - 62 + 4 * Math.sin(Math.max(0, t - A5.cta - .6) * 3.2) * pr(A5.cta + .6, A5.cta + 1, t);
    c.strokeStyle = '#fff'; c.lineWidth = 3.4; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(ax, 0); c.lineTo(ax + 22, 0); c.moveTo(ax + 13, -9); c.lineTo(ax + 22, 0); c.lineTo(ax + 13, 9); c.stroke(); c.lineCap = 'butt';
    const sp = inv(A5.cta + .45, A5.cta + 1.05, t);
    if (sp > 0 && sp < 1) { c.beginPath(); c.roundRect(-w / 2, -48, w, 96, 48); c.clip(); c.globalCompositeOperation = 'lighter';
      const x = lerp(-w / 2 - 80, w / 2 + 80, E.ioS(sp)), g = c.createLinearGradient(x - 60, 0, x + 60, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-w, -96, w * 2, 192); }
    c.restore(); c.globalAlpha = 1;
    const ua = pr(A5.url, A5.url + .5, t); c.globalAlpha = ua; txt(c, S.url, CX, y0 + 176, `500 32px ${TX}`, UI.sub, 'center'); c.globalAlpha = 1;
  }
}
/* the two lights leave the devices and become the logo: the parent (blue) holds the child (orange) */
function drawPairV4(c, t) {
  if (t < A5.out) return;
  camArr(camV4(t));
  const ph = proj(PHN.x, PHN.y, 0), tb = proj(TBL.x, TBL.y, 0); if (!ph || !tb) return;
  const em = pr(A5.out + .05, A5.out + .45, t, E.outC), cv = pr(A5.converge, A5.converge + .9, t, E.ioC);
  const hov = pr(A5.out + .3, A5.converge, t, E.ioS), arc = Math.sin(PI * cv) * 80;
  const [lpx, lpy] = logoPt(L_HD[0], L_HD[1]), [lcx, lcy] = logoPt(L_OR[0], L_OR[1]);
  const p0 = [lerp(ph.x, CX - 170, hov), lerp(ph.y, CY + 20, hov)], c0 = [lerp(tb.x, CX + 170, hov), lerp(tb.y, CY + 20, hov)];
  const P = [lerp(p0[0], lpx, cv), lerp(p0[1], lpy, cv) - arc], C = [lerp(c0[0], lcx, cv), lerp(c0[1], lcy, cv) - arc];
  const rP = lerp(22, L_HD[2] * LOGO_S, cv) * em, rC = lerp(16, L_OR[2] * LOGO_S, cv) * em;
  const halo = lerp(.6, .1, cv) * (1 - pr(A5.body, A5.body + 1, t));
  if (rP > .5) sphere(c, P[0], P[1], rP, BLUE, { energy: .7, flat: Math.max(cv, .5), halo });
  if (rC > .5) sphere(c, C[0], C[1], rC, ORANGE, { energy: .8, flat: Math.max(cv, .5), halo });
}

/* ===================================================================== */
/* master timeline                                                        */
/* ===================================================================== */
function shakeAt(t) {
  const a = 12 * decay(t, HO.slam, .35) + 2 * decay(t, EC.lock, .3) + 1.5 * decay(t, F.unlock, .35);
  return [noise(t * 43) * a, noise(t * 47 + 11) * a];
}
const POST = [];
function renderScene(t) {
  const c = sc; POST.length = 0;
  background(c, t);
  const [sx, sy] = shakeAt(t);
  camArr(camV4(t)); cam.ox = sx; cam.oy = sy;
  drawStage(c, t);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.setTransform(1, 0, 0, 1, 0, 0);
}


/* ---------- post: bloom, grade, transitions, grain ---------- */
const VIG = (() => { const c = mk(W, H), g = c.getContext('2d'); g.setTransform(1, 0, 0, H / W, 0, 0); // stretched to the tall frame
  const gr = g.createRadialGradient(CX, CX, W * .3, CX, CX, W * .75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.4)');
  g.fillStyle = gr; g.fillRect(0, 0, W, W); return c; })();
const GRAIN = (() => { const out = [], r = rng(9);
  for (let k = 0; k < 3; k++) { const c = mk(540, 960), g = c.getContext('2d'), d = g.createImageData(540, 960);
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + ((r() + r() + r()) - 1.5) * 70; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); out.push(c); } return out; })();
function grade(t) {
  return { sat: 1, br: 1 };
}
function flashAt(t) {
  return .14 * decay(t, HO.slam, .14) + .04 * decay(t, A3.shot, .2) + .05 * decay(t, EC.lock, .15) + .06 * decay(t, F.unlock, .25);
}
function caAt(t) {
  return 5 * decay(t, HO.slam, .22);
}
function composite(t, out) {
  const g = grade(t);
  out.setTransform(1, 0, 0, 1, 0, 0); out.globalAlpha = 1; out.globalCompositeOperation = 'source-over'; out.filter = 'none';
  out.fillStyle = '#000'; out.fillRect(0, 0, W, H);
  const f = (g.sat < .999 || g.br < .999) ? `saturate(${g.sat.toFixed(3)}) brightness(${g.br.toFixed(3)})` : 'none';
  out.filter = f;
  out.drawImage(scene, 0, 0);
  out.filter = 'none';
  // bloom (approximate threshold via contrast)
  b1c.globalCompositeOperation = 'copy'; b1c.filter = 'contrast(1.9) brightness(.95) blur(3px)'; b1c.drawImage(out.canvas, 0, 0, 270, 480); b1c.filter = 'none';
  b2c.globalCompositeOperation = 'copy'; b2c.filter = 'blur(4px)'; b2c.drawImage(b1, 0, 0, 135, 240); b2c.filter = 'none';
  const bk = .45;
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
  if (fl > .003) { out.globalCompositeOperation = 'lighter'; out.globalAlpha = Math.min(1, fl); out.fillStyle = 'rgb(255,255,255)'; out.fillRect(0, 0, W, H); }
  out.globalCompositeOperation = 'source-over'; out.globalAlpha = 1; out.drawImage(VIG, 0, 0);
  for (const f of POST) f(out);
  out.globalAlpha = 1; out.globalCompositeOperation = 'source-over'; out.setTransform(1, 0, 0, 1, 0, 0);
  brandLayer(out, t);
}
function brandLayer(c, t) {
  // the parent, the child, the logo and the end card sit above the bloom, so the mark keeps its exact colours
  if (t < A5.out) return;
  drawPairV4(c, t);
  if (t >= A5.tagline) { camArr(frontal); endCard(c, t); }
  if (t >= A5.body) drawLogo(c, t);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.setTransform(1, 0, 0, 1, 0, 0);
}
function finish(t) {
  vc.setTransform(1, 0, 0, 1, 0, 0);
  vc.globalCompositeOperation = 'overlay'; vc.globalAlpha = .035;
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
  for (const [fam, ws] of Object.entries(window.KZ_INTER || {})) for (const [w, url] of Object.entries(ws)) ps.push(new FontFace(fam, `url(${url})`, { weight: w }).load().then(f => document.fonts.add(f)));
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