import {AMBER, CX, CY, E, H, PAPER, W, letterOffsets, measure, seg, segLog, spring, lerp} from './lib';
import {Easing} from 'remotion';

const WORD = 'MOUVEMENT';
const LINE_Y = 650;
const DIVE = Easing.bezier(0.55, 0, 0.8, 0.15);

// Geometry of the hero word, shared with the camera so the dive lands inside the "O".
export const heroLayout = () => {
  const size = Math.min(320, (1640 / measure(WORD, '600 100px Fraunces').width) * 100);
  const font = `600 ${size}px Fraunces`;
  const width = measure(WORD, font).width;
  const offs = letterOffsets(WORD, font);
  const x0 = CX - width / 2;
  const o = measure('O', font);
  const oCx = x0 + offs[1] + o.width / 2;
  const oCy = LINE_Y - (o.actualBoundingBoxAscent - o.actualBoundingBoxDescent) / 2;
  const centers = [...WORD].map((ch, i) => x0 + offs[i] + measure(ch, font).width / 2);
  return {size, centers, oCx, oCy};
};

// 0–2 s — a spark ignites, stretches into an anamorphic streak, the word rises from it, then the camera dives through the O.
export const Ignition: React.FC<{t: number}> = ({t}) => {
  const {size, centers, oCx, oCy} = heroLayout();

  const fp = seg(t, 1.0, 1.55, 0, 1, E.inOut);
  const fx = lerp(CX, oCx, fp);
  const fy = lerp(CY, oCy, fp);
  const zoom = t < 1.45 ? segLog(t, 0, 1.45, 1, 1.1) : segLog(t, 1.45, 2.06, 1.1, 40, DIVE);

  const env = seg(t, 0.04, 0.3, 0, 1, E.out) * (1 - seg(t, 0.55, 1.2, 0, 0.85, E.inOut));
  const core = spring(t, 0.04, 3, 0.42);
  const sx = seg(t, 0.12, 0.6, 0.002, 1, E.out);
  const lineFade = seg(t, 0.6, 1.2, 1, 0.3, E.inOut);
  const sweep = seg(t, 0.85, 1.75, -0.25, 1.25, E.inOut);
  const stop = (o: number) => Math.min(1, Math.max(0, sweep + o));

  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <filter id="ig-glow" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id="ig-bloom" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="46" />
        </filter>
        <linearGradient id="ig-sweep" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={W} y2={-260}>
          <stop offset={0} stopColor={PAPER} />
          <stop offset={stop(-0.09)} stopColor={PAPER} />
          <stop offset={stop(-0.035)} stopColor={AMBER} />
          <stop offset={stop(0)} stopColor="#fff6e2" />
          <stop offset={stop(0.035)} stopColor={AMBER} />
          <stop offset={stop(0.09)} stopColor={PAPER} />
          <stop offset={1} stopColor={PAPER} />
        </linearGradient>
        <clipPath id="ig-mask">
          <rect x={-W} y={-H} width={W * 3} height={LINE_Y + H + 3} />
        </clipPath>
      </defs>

      <g transform={`translate(${CX} ${CY}) scale(${zoom}) translate(${-fx} ${-fy})`}>
        {/* Light: bloom, anamorphic streak, hot core */}
        <circle cx={CX} cy={LINE_Y} r={190} fill={AMBER} opacity={0.55 * env} filter="url(#ig-bloom)" />
        <ellipse cx={CX} cy={LINE_Y} rx={980 * sx} ry={16} fill={AMBER} opacity={0.5 * env} filter="url(#ig-glow)" />
        <ellipse cx={CX} cy={LINE_Y} rx={980 * sx} ry={1.4} fill="#fff3dc" opacity={0.95 * lineFade} />
        <circle cx={CX} cy={LINE_Y} r={7 * core * (1 - seg(t, 0.45, 0.8, 0, 1, E.in))} fill="#fff8ea" />

        <g clipPath={t < 1.35 ? 'url(#ig-mask)' : undefined}>
          {[...WORD].map((ch, i) => {
            const start = 0.48 + Math.abs(i - 4) * 0.05;
            const rise = spring(t, start, 1.9, 0.62);
            const weight = 140 + 460 * seg(t, start, start + 0.75, 0, 1, E.out);
            return (
              <text
                key={i}
                x={centers[i]}
                y={LINE_Y}
                textAnchor="middle"
                fontFamily="Fraunces"
                fontSize={size}
                fontWeight={weight}
                fill="url(#ig-sweep)"
                transform={`translate(0 ${(1 - rise) * size * 1.08})`}
              >
                {ch}
              </text>
            );
          })}
        </g>
      </g>
    </svg>
  );
};
