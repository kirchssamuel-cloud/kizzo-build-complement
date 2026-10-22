import {AMBER, CX, E, H, PAPER, W, letterOffsets, measure, seg, spring} from './lib';

const SIZE = 150;
const L1 = 'Chaque image';
const L2 = 'compte';
const B1 = 500;
const B2 = 670;
const F1 = `300 ${SIZE}px Fraunces`;
const F2 = `italic 400 ${SIZE}px Fraunces`;
export const DOT_R = 11;

export const endLayout = () => {
  const w1 = measure(L1, F1).width;
  const w2 = measure(L2, F2).width;
  const dotGap = SIZE * 0.05;
  const total2 = w2 + dotGap + DOT_R * 2;
  const x1 = CX - w1 / 2;
  const x2 = CX - total2 / 2;
  return {x1, x2, o1: letterOffsets(L1, F1), o2: letterOffsets(L2, F2), dot: {x: x2 + w2 + dotGap + DOT_R, y: B2 - DOT_R}};
};

// 14–16 s — the mask collapses into a full stop; the title rises around it.
export const End: React.FC<{t: number}> = ({t}) => {
  const {x1, x2, o1, o2, dot} = endLayout();
  const zoom = seg(t, 14.0, 16.0, 1.0, 1.035, E.out);
  const pop = 1 + 0.35 * (spring(t, 14.62, 3, 0.35) - spring(t, 14.7, 3, 0.5));
  const halo = seg(t, 14.62, 15.3, 0, 1, E.out);
  const rule = seg(t, 14.7, 15.2, 0, 1, E.inOut);
  const cap = seg(t, 14.78, 15.2, 0, 1, E.out);

  const letters = (text: string, x0: number, offs: number[], base: number, italic: boolean, t0: number) =>
    [...text].map((ch, i) => {
      const s = spring(t, t0 + i * 0.03, 1.9, 0.62);
      const wgt = (italic ? 260 : 160) + 140 * seg(t, t0 + i * 0.03, t0 + i * 0.03 + 0.6, 0, 1, E.out);
      return (
        <text
          key={i}
          x={x0 + offs[i]}
          y={base}
          fontFamily="Fraunces"
          fontStyle={italic ? 'italic' : 'normal'}
          fontWeight={italic ? 400 : wgt}
          fontSize={SIZE}
          fill={italic ? AMBER : PAPER}
          transform={`translate(0 ${(1 - s) * SIZE * 1.35})`}
        >
          {ch}
        </text>
      );
    });

  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <clipPath id="end-m1">
          <rect x={0} y={0} width={W} height={B1 + SIZE * 0.3} />
        </clipPath>
        <clipPath id="end-m2">
          <rect x={0} y={B1 + SIZE * 0.3} width={W} height={B2 - B1} />
        </clipPath>
        <radialGradient id="end-halo">
          <stop offset="0%" stopColor={AMBER} stopOpacity={0.55} />
          <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={`translate(${CX} 540) scale(${zoom}) translate(${-CX} -540)`}>
        <g clipPath="url(#end-m1)">{letters(L1, x1, o1, B1, false, 14.0)}</g>
        <g clipPath="url(#end-m2)">{letters(L2, x2, o2, B2, true, 14.18)}</g>
        {halo > 0 && halo < 1 ? <circle cx={dot.x} cy={dot.y} r={DOT_R + 120 * halo} fill="url(#end-halo)" opacity={1 - halo} /> : null}
        <circle cx={dot.x} cy={dot.y} r={DOT_R * pop} fill={AMBER} />
        <rect x={CX - 110 * rule} y={760} width={220 * rule} height={1} fill={PAPER} opacity={0.35} />
        <g clipPath="url(#end-cap)">
          <text
            x={CX}
            y={812}
            textAnchor="middle"
            fontFamily="Inter"
            fontWeight={500}
            fontSize={14}
            letterSpacing="0.34em"
            fill={PAPER}
            opacity={0.62}
            transform={`translate(0 ${(1 - cap) * 22})`}
          >
            MOTION DESIGN — SHOWREEL
          </text>
        </g>
        <clipPath id="end-cap">
          <rect x={0} y={790} width={W} height={30} />
        </clipPath>
      </g>
    </svg>
  );
};
