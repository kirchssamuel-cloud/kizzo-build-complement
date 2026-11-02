import {useLayoutEffect, useRef} from 'react';
import {AMBER, CX, CY, E, H, PAPER, W, hash, lerp, seg} from './lib';
import {blockHeight, project, tiles} from './Geo';
import {NB, RING, blob, blobAngle, toScreen} from './Fluid';

const N = 2600;
const P = Array.from({length: N}, (_, i) => {
  const r = [1, 2, 3, 4, 5, 6].map((k) => hash(i * 7.31 + k * 101.7));
  const tile = tiles[i % tiles.length];
  return {r, tile, u: (r[0] - 0.5) * 150, v: (r[1] - 0.5) * 150, spawn: 7.97 + 0.14 * r[2]};
});

const emit = (p: (typeof P)[number]) => {
  const e = project(p.spawn, p.tile.x + p.u, p.tile.y + p.v, blockHeight(p.spawn, p.tile.k, p.tile.c));
  return {r0: Math.hypot(e.x - CX, e.y - CY), a0: Math.atan2(e.y - CY, e.x - CX)};
};
const emitters = new Map<number, {r0: number; a0: number}>();

// Stateless particle position: explode → spiral → converge on a ring → condense into the metaballs.
const pos = (i: number, t: number) => {
  const p = P[i];
  let e = emitters.get(i);
  if (!e) {
    e = emit(p);
    emitters.set(i, e);
  }
  const tau = Math.max(0, t - p.spawn);
  const [r1, r2, r3, r4, r5, r6] = p.r;
  const a = e.a0 + (1.1 + 0.7 * r4) * tau + 1.2 * (1 - Math.exp(-2 * tau));
  const rOut = e.r0 + (110 + 300 * r5) * (1 - Math.exp(-2.4 * tau)) + 40 * Math.sin(3 * a + 2 * tau + 6 * r6);
  const conv = seg(t, 9.0 + 0.3 * r6, 9.85 + 0.1 * r6, 0, 1, E.inOut);
  const rr = lerp(rOut, RING + 10 * (r1 - 0.5), conv);
  const lift = -140 * (1 - Math.exp(-3 * tau)) * (1 - conv);
  let x = CX + rr * Math.cos(a);
  let y = CY + rr * Math.sin(a) + lift;
  const q = seg(t, 10.0, 10.28 + 0.06 * r3, 0, 1, E.in);
  if (q > 0) {
    let best = 0;
    let bestD = Infinity;
    for (let j = 0; j < NB; j++) {
      const d = Math.abs(Math.atan2(Math.sin(a - blobAngle(t, j)), Math.cos(a - blobAngle(t, j))));
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    const b = blob(t, best);
    const s = toScreen(t, b.x, b.y);
    x = lerp(x, s.x, q);
    y = lerp(y, s.y, q);
  }
  return {x, y, q, r2};
};

// 8–10.3 s — the blocks shatter into a few thousand streaking particles.
export const Particles: React.FC<{t: number}> = ({t}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current!.getContext('2d')!;
    c.clearRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round';
    const ringGlow = seg(t, 9.55, 9.95, 0, 1, E.inOut) * (1 - seg(t, 10.0, 10.3, 0, 1, E.in));
    if (ringGlow > 0) {
      c.strokeStyle = `rgba(224,162,84,${0.22 * ringGlow})`;
      c.lineWidth = 26;
      c.shadowColor = AMBER;
      c.shadowBlur = 50;
      c.beginPath();
      c.arc(CX, CY, RING, 0, Math.PI * 2);
      c.stroke();
      c.shadowBlur = 0;
    }
    for (let i = 0; i < N; i++) {
      const p = P[i];
      if (t < p.spawn) continue;
      const a = pos(i, t);
      const b = pos(i, Math.max(p.spawn, t - 0.035));
      const size = (0.7 + 2.3 * a.r2 * a.r2) * (1 - a.q);
      if (size < 0.05) continue;
      c.strokeStyle = p.r[3] < 0.32 ? 'rgba(224,162,84,0.9)' : 'rgba(243,239,230,0.78)';
      c.lineWidth = size;
      c.beginPath();
      c.moveTo(b.x, b.y);
      c.lineTo(a.x + 0.01, a.y);
      c.stroke();
    }
  }, [t]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

export const PARTICLE_COLORS = [AMBER, PAPER];
