import {AMBER, CX, CY, E, H, PAPER, W, measure, seg} from './lib';

type Word = {text: string; family: string; weight: number; italic?: boolean; fill?: string; stroke?: string; track?: number};

const WORDS: Word[] = [
  {text: 'RYTHME', family: 'Inter', weight: 900, fill: PAPER, track: -0.03},
  {text: 'forme', family: 'Fraunces', weight: 400, italic: true, fill: AMBER},
  {text: 'LUMIÈRE', family: 'Inter', weight: 900, stroke: PAPER, track: -0.02},
  {text: 'matière', family: 'Fraunces', weight: 300, italic: true, fill: PAPER},
];
const T0 = 2.0;
const STRIPS = 7;

const layout = (w: Word) => {
  const font = (s: number) => `${w.italic ? 'italic ' : ''}${w.weight} ${s}px ${w.family}`;
  const m = measure(w.text, font(100));
  const width = m.width + (w.track ?? 0) * 100 * w.text.length;
  const size = Math.min(440, (1480 / width) * 100);
  const mm = measure(w.text, font(size));
  const baseline = CY + (mm.actualBoundingBoxAscent - mm.actualBoundingBoxDescent) / 2;
  return {size, baseline};
};

// 2–4 s — one word per beat; each hand-off slices the frame into strips that shear past each other.
export const Words: React.FC<{t: number}> = ({t}) => {
  const rot = seg(t, 2.0, 4.0, -2.5, 1.5, E.inOut);
  const zoom = seg(t, 2.0, 4.0, 1.0, 1.08, E.inOut);
  const glowX = seg(t, 2.0, 4.0, 400, 1500, E.inOut);

  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id="wd-leak" gradientUnits="userSpaceOnUse" cx={glowX} cy={CY + 120} r={900}>
          <stop offset={0} stopColor={AMBER} stopOpacity={0.16} />
          <stop offset={1} stopColor={AMBER} stopOpacity={0} />
        </radialGradient>
        {Array.from({length: STRIPS}, (_, k) => (
          <clipPath key={k} id={`wd-strip-${k}`}>
            <rect x={-W} y={(k * H) / STRIPS - 1} width={W * 3} height={H / STRIPS + 2} />
          </clipPath>
        ))}
      </defs>
      <rect width={W} height={H} fill="url(#wd-leak)" />
      <g transform={`translate(${CX} ${CY}) rotate(${rot}) scale(${zoom}) translate(${-CX} ${-CY})`}>
        {WORDS.map((w, i) => {
          const tin = T0 + i * 0.5;
          const tout = tin + 0.5;
          if (t < tin - 0.05 || t > tout + 0.4) return null;
          const {size, baseline} = layout(w);
          return Array.from({length: STRIPS}, (_, k) => {
            const dir = k % 2 === 0 ? 1 : -1;
            const pin = seg(t, tin + 0.05 + k * 0.016, tin + 0.27 + k * 0.016, 0, 1, E.out);
            const pout = i === WORDS.length - 1 ? 0 : seg(t, tout - 0.04 + k * 0.012, tout + 0.08 + k * 0.012, 0, 1, E.in);
            const x = dir * W * (1 - pin) - dir * W * pout;
            const skew = dir * (-14 * (1 - pin) + 14 * pout);
            if (pin <= 0 || pout >= 1) return null;
            return (
              <g key={`${i}-${k}`} clipPath={`url(#wd-strip-${k})`}>
                <text
                  x={CX}
                  y={baseline}
                  textAnchor="middle"
                  fontFamily={w.family}
                  fontWeight={w.weight}
                  fontStyle={w.italic ? 'italic' : 'normal'}
                  fontSize={size}
                  letterSpacing={`${w.track ?? 0}em`}
                  fill={w.fill ?? 'none'}
                  stroke={w.stroke}
                  strokeWidth={w.stroke ? 3 : 0}
                  transform={`translate(${x + CX} ${baseline}) skewX(${skew}) translate(${-CX} ${-baseline})`}
                >
                  {w.text}
                </text>
              </g>
            );
          });
        })}
      </g>
    </svg>
  );
};
