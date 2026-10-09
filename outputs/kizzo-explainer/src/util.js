// Helpers de timeline : tout est fonction pure du temps t (secondes), ce qui rend
// la vidéo scrubbable, déterministe et exportable image par image.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
/** Progression normalisée (0..1) de t dans la fenêtre [a, b]. */
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (k) => k * k * (3 - 2 * k);
export const smoother = (k) => k * k * k * (k * (k * 6 - 15) + 10);

export const ease = {
  inQuad: (k) => k * k,
  outQuad: (k) => 1 - (1 - k) * (1 - k),
  inOutQuad: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
  inCubic: (k) => k * k * k,
  outCubic: (k) => 1 - Math.pow(1 - k, 3),
  inOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  inQuart: (k) => k * k * k * k,
  outQuart: (k) => 1 - Math.pow(1 - k, 4),
  inOutQuart: (k) => (k < 0.5 ? 8 * k * k * k * k : 1 - Math.pow(-2 * k + 2, 4) / 2),
  outQuint: (k) => 1 - Math.pow(1 - k, 5),
  inOutQuint: (k) => (k < 0.5 ? 16 * k ** 5 : 1 - Math.pow(-2 * k + 2, 5) / 2),
  inExpo: (k) => (k <= 0 ? 0 : Math.pow(2, 10 * k - 10)),
  outExpo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  inOutExpo: (k) =>
    k <= 0 ? 0 : k >= 1 ? 1 : k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2,
  outBack: (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2),
  inBack: (k, s = 1.70158) => (s + 1) * k * k * k - s * k * k,
  inOutSine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
  outSine: (k) => Math.sin((k * Math.PI) / 2),
  inSine: (k) => 1 - Math.cos((k * Math.PI) / 2),
};

/** Ressort amorti analytique paramétré en secondes : 0 -> 1 avec léger dépassement. */
export function springT(dt, { stiffness = 170, damping = 16 } = {}) {
  if (dt <= 0) return 0;
  const w0 = Math.sqrt(stiffness);
  const zeta = damping / (2 * w0);
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * dt) * (Math.cos(wd * dt) + ((zeta * w0) / wd) * Math.sin(wd * dt));
  }
  return 1 - Math.exp(-w0 * dt) * (1 + w0 * dt);
}

/** Fenêtre in/out : 0 avant a, monte jusqu'à b, tient, redescend entre c et d. */
export function window4(t, a, b, c, d, fin = smooth, fout = smooth) {
  if (t <= a || t >= d) return 0;
  if (t < b) return fin(seg(t, a, b));
  if (t <= c) return 1;
  return 1 - fout(seg(t, c, d));
}

/** Impulsion douce (cloche) centrée sur c de demi-largeur w. */
export const pulse = (t, c, w) => {
  const x = (t - c) / w;
  return Math.exp(-x * x * 4);
};

/** Décroissance exponentielle après un évènement. */
export const decay = (t, t0, rate = 6) => (t < t0 ? 0 : Math.exp(-(t - t0) * rate));

/** PRNG déterministe (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bruit 1D lisse et déterministe (somme de sinus incommensurables). */
export const wobble = (t, seed = 0) =>
  Math.sin(t * 0.61 + seed * 1.7) * 0.5 + Math.sin(t * 1.37 + seed * 3.1) * 0.3 + Math.sin(t * 2.71 + seed * 5.3) * 0.2;

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
