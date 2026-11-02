import {AMBER, CX, CY, E, H, PAPER, W, lerp, measure, seg} from './lib';

export const NB = 7;
export const RING = 250;
const NS = 9;

export const fluidCam = (t: number) => ({zoom: seg(t, 10.0, 12.0, 1.0, 1.12, E.inOut), rot: seg(t, 10.0, 12.0, 0, 5, E.inOut)});
const merge = (t: number) => seg(t, 11.3, 11.95, 0, 1, E.inOut);

export const toScreen = (t: number, x: number, y: number) => {
  const {zoom, rot} = fluidCam(t);
  const a = (rot * Math.PI) / 180;
  return {x: CX + zoom * (x * Math.cos(a) - y * Math.sin(a)), y: CY + zoom * (x * Math.sin(a) + y * Math.cos(a))};
};

export const blobAngle = (t: number, j: number) => (j * 2 * Math.PI) / NB + 1.4 * (t - 10);
export const blob = (t: number, j: number) => {
  const beta = blobAngle(t, j);
  const rho = (RING + 80 * Math.sin(2.3 * (t - 10) + j * 1.9) * seg(t, 10.15, 10.6, 0, 1, E.inOut)) * (1 - merge(t));
  const r = lerp((64 + 16 * Math.sin(3.1 * t + j * 2.3)) * seg(t, 10.0, 10.4, 0, 1, E.out), 150, merge(t));
  return {x: rho * Math.cos(beta), y: rho * Math.sin(beta), r};
};
const satellite = (t: number, i: number) => {
  const g = (i * 2 * Math.PI) / NS + 2.1 * (t - 10) + 0.4;
  const rho = (RING + 125 * Math.sin(1.8 * (t - 10) + i * 1.3)) * (1 - merge(t));
  const r = (19 + 9 * Math.sin(2.7 * t + i)) * seg(t, 10.2, 10.6, 0, 1, E.out) * (1 - merge(t));
  return {x: rho * Math.cos(g), y: rho * Math.sin(g), r};
};

// 10–12 s — the particle ring condenses into liquid metaballs that orbit, split and finally merge into one drop.
export const Fluid: React.FC<{t: number}> = ({t}) => {
  const {zoom, rot} = fluidCam(t);
  const word = 'fluide';
  const font = (s: number) => `italic 300 ${s}px Fraunces`;
  const size = (1700 / measure(word, font(100)).width) * 100;
  const mm = measure(word, font(size));
  const baseline = CY + (mm.actualBoundingBoxAscent - mm.actualBoundingBoxDescent) / 2;
  const wipeIn = seg(t, 10.05, 10.7, 0, 1, E.out);
  const wipeOut = seg(t, 11.6, 12.0, 0, 1, E.in);
  const disp = seg(t, 10.0, 12.0, 25, 85, E.inOut);
  const freq = 0.0055 + 0.0015 * Math.sin(t * 2.2);

  const blobs = Array.from({length: NB}, (_, j) => blob(t, j));
  const sats = Array.from({length: NS}, (_, i) => satellite(t, i));
  const all = [...blobs, ...sats].filter((b) => b.r > 0.5);

  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id="fl-goo" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 32 -14" />
        </filter>
        <filter id="fl-goo-hi" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -12" />
        </filter>
        <filter id="fl-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="44" />
        </filter>
        <filter id="fl-warp" x="-10%" y="-30%" width="120%" height="160%">
          <feTurbulence type="turbulence" baseFrequency={`${freq} ${freq * 1.6}`} numOctaves={2} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={disp} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <radialGradient id="fl-shade" cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#ffe6bd" />
          <stop offset="34%" stopColor="#eaa95a" />
          <stop offset="78%" stopColor="#c27a32" />
          <stop offset="100%" stopColor="#7d4a1c" />
        </radialGradient>
        <clipPath id="fl-wipe">
          <rect x={-200 + wipeOut * 2400} y={0} width={Math.max(0, 2400 * (wipeIn - wipeOut))} height={H} />
        </clipPath>
      </defs>

      <g clipPath="url(#fl-wipe)" filter="url(#fl-warp)">
        <text x={CX} y={baseline} textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontWeight={300} fontSize={size} fill="none" stroke={PAPER} strokeOpacity={0.2} strokeWidth={2}>
          {word}
        </text>
      </g>

      <g transform={`translate(${CX} ${CY}) rotate(${rot}) scale(${zoom})`}>
        <g filter="url(#fl-glow)" opacity={0.4}>
          {all.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={AMBER} />
          ))}
        </g>
        <g filter="url(#fl-goo)">
          {all.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="url(#fl-shade)" />
          ))}
        </g>
        <g filter="url(#fl-goo-hi)" opacity={0.85}>
          {all.map((b, i) => (
            <circle key={i} cx={b.x - b.r * 0.3} cy={b.y - b.r * 0.34} r={b.r * 0.3} fill="#fff4e0" />
          ))}
        </g>
      </g>
    </svg>
  );
};
