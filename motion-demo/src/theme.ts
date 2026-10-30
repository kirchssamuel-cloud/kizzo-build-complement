import {loadFont} from '@remotion/fonts';
import {Easing, interpolate, staticFile} from 'remotion';

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const DURATION = 840; // 28 s

export const C = {
  bg: '#141210',
  bgDeep: '#0c0b0a',
  bgLift: '#1c1916',
  surface: '#25211d',
  ink: '#f3efe6',
  amber: '#e0a254',
  ink60: 'rgba(243,239,230,0.6)',
  ink35: 'rgba(243,239,230,0.35)',
  ink15: 'rgba(243,239,230,0.15)',
  ink08: 'rgba(243,239,230,0.08)',
};

// Section boundaries (global frames) — shared by scenes and HUD.
export const SECTIONS = [0, 120, 300, 540, 720] as const;

export const SERIF = 'Fraunces';
export const SANS = 'Inter';

loadFont({family: SERIF, url: staticFile('fonts/Fraunces.woff2'), weight: '100 900', style: 'normal'});
loadFont({family: SERIF, url: staticFile('fonts/Fraunces-Italic.woff2'), weight: '100 900', style: 'italic'});
loadFont({family: SANS, url: staticFile('fonts/Inter.woff2'), weight: '100 900', style: 'normal'});

// Custom cubic-bezier curves — nothing in this film moves linearly.
export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-out: fast attack, long settle
  soft: Easing.bezier(0.33, 1, 0.68, 1), // cubic-out
  in: Easing.bezier(0.7, 0, 0.84, 0), // expo-in: for exits
  inOut: Easing.bezier(0.76, 0, 0.24, 1), // quart in-out: camera & morphs
  snap: Easing.bezier(0.87, 0, 0.13, 1), // very sharp in-out for wipes
  back: Easing.bezier(0.34, 1.56, 0.64, 1), // gentle overshoot for pops
};

export const tween = (
  frame: number,
  [a, b]: [number, number],
  [from, to]: [number, number],
  easing: (t: number) => number = E.out,
) =>
  interpolate(frame, [a, b], [from, to], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const serif = (opsz = 144, soft = 50, wonk = 0): React.CSSProperties => ({
  fontFamily: SERIF,
  fontVariationSettings: `"opsz" ${opsz}, "SOFT" ${soft}, "WONK" ${wonk}`,
});

export const caps: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '0.26em',
  textTransform: 'uppercase',
};
