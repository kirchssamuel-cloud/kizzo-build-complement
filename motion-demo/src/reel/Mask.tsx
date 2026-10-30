import {AMBER, CX, CY, E, H, INK, PAPER, W, lerp, seg, spring} from './lib';
import {DOT_R, endLayout} from './End';

const ROWS = [
  {y: 330, text: 'MATIÈRE · LUMIÈRE · RYTHME · MATIÈRE · LUMIÈRE · RYTHME ·', serif: false, dir: -1},
  {y: 585, text: 'forme  profondeur  mouvement  forme  profondeur  mouvement', serif: true, dir: 1},
  {y: 840, text: 'COMPOSITION · DÉTAIL · TEMPO · COMPOSITION · DÉTAIL · TEMPO ·', serif: false, dir: -1},
];

const Rows: React.FC<{t: number; inside: boolean}> = ({t, inside}) => {
  const travel = seg(t, 12.0, 14.0, 0, 1, E.inOut);
  const exit = seg(t, 13.55, 14.0, 0, 1, E.in);
  return (
    <>
      {ROWS.map((r, i) => (
        <text
          key={i}
          x={CX + r.dir * (-300 + 700 * travel + 2600 * exit) - 1500}
          y={r.y}
          fontFamily={r.serif ? 'Fraunces' : 'Inter'}
          fontStyle={r.serif ? 'italic' : 'normal'}
          fontWeight={r.serif ? 300 : 900}
          fontSize={r.serif ? 230 : 200}
          letterSpacing={r.serif ? '-0.01em' : '-0.03em'}
          fill={inside ? (r.serif ? '#b06f2a' : INK) : 'none'}
          stroke={inside ? undefined : PAPER}
          strokeOpacity={0.13}
          strokeWidth={inside ? 0 : 2}
        >
          {r.text}
        </text>
      ))}
    </>
  );
};

// 12–14 s — the drop opens into a lens: inside it the world is inverted (paper + ink), outside it's outline only.
export const Mask: React.FC<{t: number}> = ({t}) => {
  const {dot} = endLayout();
  const open = spring(t, 12.02, 1.5, 0.62);
  const close = seg(t, 13.55, 14.0, 0, 1, E.inOut);
  const R = lerp(lerp(168, 420, open), DOT_R, close);
  const cx = lerp(lerp(CX, 1200, seg(t, 12.2, 13.4, 0, 1, E.inOut)), dot.x, close);
  const cy = lerp(lerp(CY, 520, seg(t, 12.2, 13.4, 0, 1, E.inOut)), dot.y, close);
  const th = lerp(lerp(R, 9, spring(t, 12.08, 1.8, 0.75)), R, seg(t, 13.6, 13.92, 0, 1, E.inOut));
  const inner = Math.max(0, R - th);

  const waves = [13.0, 13.5].map((tb) => seg(t, tb, tb + 0.65, 0, 1, E.out));

  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <clipPath id="mk-lens">
          <circle cx={cx} cy={cy} r={inner} />
        </clipPath>
        <radialGradient id="mk-vig" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={Math.max(1, inner)}>
          <stop offset="70%" stopColor={INK} stopOpacity={0} />
          <stop offset="100%" stopColor={INK} stopOpacity={0.28} />
        </radialGradient>
      </defs>
      <Rows t={t} inside={false} />
      <g clipPath="url(#mk-lens)">
        <rect width={W} height={H} fill={PAPER} />
        <Rows t={t} inside />
        <rect width={W} height={H} fill="url(#mk-vig)" />
      </g>
      <circle cx={cx} cy={cy} r={R - th / 2} fill="none" stroke={AMBER} strokeWidth={th} />
      {waves.map((p, i) =>
        p > 0 && p < 1 ? (
          <circle key={i} cx={cx} cy={cy} r={R * (1 + 0.9 * p)} fill="none" stroke={AMBER} strokeWidth={3 * (1 - p)} opacity={1 - p} />
        ) : null,
      )}
    </svg>
  );
};
