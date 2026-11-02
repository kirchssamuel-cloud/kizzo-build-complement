import {useEffect, useState} from 'react';
import {continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {E} from '../theme';

export {E};
export const BPM = 120;
export const BEAT = 60 / BPM; // 0.5 s
export const DUR = 16; // 32 beats
export const W = 1920;
export const H = 1080;
export const CX = W / 2;
export const CY = H / 2;

export const INK = '#141210';
export const PAPER = '#f3efe6';
export const AMBER = '#e0a254';

// Everything is a pure function of time in seconds, so the film renders identically at any frame rate.
export const useTime = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

export const seg = (t: number, a: number, b: number, from: number, to: number, ease: (x: number) => number = E.out) => {
  if (t <= a) return from;
  if (t >= b) return to;
  return from + (to - from) * ease((t - a) / (b - a));
};

// Zoom interpolated in log space so a 1× → 30× push feels constant-speed to the eye.
export const segLog = (t: number, a: number, b: number, from: number, to: number, ease: (x: number) => number = E.inOut) =>
  Math.exp(seg(t, a, b, Math.log(from), Math.log(to), ease));

// Closed-form step response of a damped spring (0 → 1, with overshoot when damping < 1).
export const spring = (t: number, start: number, freq = 2.2, damping = 0.55) => {
  const tau = t - start;
  if (tau <= 0) return 0;
  const w = 2 * Math.PI * freq;
  const z = damping;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau));
};

export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mixHex = (a: string, b: string, p: number, alpha = 1) => {
  const A = hex(a);
  const B = hex(b);
  const q = clamp01(p);
  return `rgba(${A.map((v, i) => Math.round(v + (B[i] - v) * q)).join(',')},${alpha})`;
};

// Fonts must be resolved before any glyph is measured.
export const useFontsReady = () => {
  const [handle] = useState(() => delayRender('reel-fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all([
      document.fonts.load('300 100px Fraunces'),
      document.fonts.load('600 100px Fraunces'),
      document.fonts.load('italic 300 100px Fraunces'),
      document.fonts.load('900 100px Inter'),
      document.fonts.load('500 100px Inter'),
    ]).then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return ready;
};

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, TextMetrics>();
export const measure = (text: string, font: string) => {
  const key = `${font}|${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  ctx!.font = font;
  const m = ctx!.measureText(text);
  cache.set(key, m);
  return m;
};

// Per-letter x offsets (kerning-aware: each offset is the advance of the prefix).
export const letterOffsets = (text: string, font: string) => {
  const chars = [...text];
  return chars.map((_, i) => measure(chars.slice(0, i).join(''), font).width);
};
