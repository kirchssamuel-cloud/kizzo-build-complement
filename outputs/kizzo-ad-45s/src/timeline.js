// Timing, easing and small math helpers. Every visual in the ad is a pure
// function of the master clock `t` (seconds), so playback, scrubbing and
// frame-by-frame export always produce the same image for the same time.

export const DURATION = 45;
export const FPS = 30;

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, k) => a + (b - a) * k;
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

export const E = {
  linear: (x) => x,
  inQuad: (x) => x * x,
  outQuad: (x) => 1 - (1 - x) * (1 - x),
  inCubic: (x) => x * x * x,
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outQuart: (x) => 1 - Math.pow(1 - x, 4),
  inOutQuart: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
  outQuint: (x) => 1 - Math.pow(1 - x, 5),
  inOutQuint: (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2),
  inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inOutExpo: (x) =>
    x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: (x) => {
    const s = 1.70158;
    return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  },
};

// CSS-style cubic-bezier easing (Newton–Raphson with bisection fallback).
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 6; i++) {
      const e = sx(u) - x;
      const d = dx(u);
      if (Math.abs(e) < 1e-6) return sy(u);
      if (Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    let lo = 0, hi = 1;
    u = x;
    for (let i = 0; i < 24; i++) {
      const v = sx(u);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = u; else hi = u;
      u = (lo + hi) / 2;
    }
    return sy(u);
  };
}

// House curves: a long confident deceleration, a quick whip, a soft settle.
export const EASE = {
  cine: bezier(0.16, 1, 0.3, 1),
  whip: bezier(0.7, 0, 0.2, 1),
  settle: bezier(0.22, 1, 0.36, 1),
  accel: bezier(0.55, 0, 0.9, 0.35),
  glide: bezier(0.45, 0, 0.2, 1),
};

// Progress of a window [start, start + dur] with easing.
export const prog = (t, start, dur, ease = E.linear) => ease(clamp((t - start) / dur));

// 0 → 1 → 0 bell across [a, b].
export const bump = (t, a, b) => {
  const x = clamp((t - a) / (b - a));
  return Math.sin(Math.PI * x);
};

// Fast attack, exponential release (for flashes and impacts).
export const hit = (t, at, attack = 0.04, release = 0.5) => {
  if (t < at) return 0;
  if (t < at + attack) return (t - at) / attack;
  return Math.exp(-(t - at - attack) / release);
};

// Same, but fully gone `win` seconds after the cue (no lingering tails).
export const hitw = (t, at, attack, release, win) =>
  hit(t, at, attack, release) * (1 - clamp((t - at - win * 0.6) / (win * 0.4)));

// Under-damped spring step response from 0 → 1 (for snaps and pops).
export function spring(x, freq = 2.4, damp = 0.42) {
  if (x <= 0) return 0;
  const w = 2 * Math.PI * freq;
  const wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * x) * (Math.cos(wd * x) + ((damp * w) / wd) * Math.sin(wd * x));
}

// Keyframe track: keys = [[time, value, easeIntoThisKey?], ...]
// value can be a number or an array of numbers.
export function track(keys) {
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, ease = EASE.glide] = keys[i];
      const [t0, v0] = keys[i - 1];
      if (t <= t1) {
        const k = ease((t - t0) / (t1 - t0));
        if (Array.isArray(v0)) return v0.map((a, j) => lerp(a, v1[j], k));
        return lerp(v0, v1, k);
      }
    }
    return keys[keys.length - 1][1];
  };
}

// Deterministic PRNG so particle layouts are identical on every load.
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth pseudo-noise for organic drift (deterministic in t).
export const wobble = (t, seed = 0) =>
  Math.sin(t * 1.13 + seed * 12.9) * 0.5 + Math.sin(t * 0.61 + seed * 4.7) * 0.35 + Math.sin(t * 2.07 + seed) * 0.15;
