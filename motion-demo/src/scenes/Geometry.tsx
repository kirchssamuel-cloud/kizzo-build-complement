import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {KineticLine, Reveal} from '../components/Kinetic';
import {C, E, SANS, caps, serif, tween} from '../theme';

const CX = 960;
const CY = 540;
const R = 300;

// Parallax: every layer follows the same eased camera, scaled by its depth.
const useCamera = (f: number) => tween(f, [0, 200], [0, 1], E.inOut);
const Layer: React.FC<{depth: number; cam: number; children: React.ReactNode}> = ({depth, cam, children}) => (
  <AbsoluteFill
    style={{
      transform: `translate(${(70 - 140 * cam) * depth}px, ${(36 - 72 * cam) * depth}px) scale(${1 + 0.07 * (1 - cam) * depth})`,
    }}
  >
    {children}
  </AbsoluteFill>
);

const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return {x: CX + r * Math.cos(a), y: CY + r * Math.sin(a)};
};

// 4–10 s — iris opens from the amber wipe onto a composition of circles, lines and a dot field.
export const Geometry: React.FC = () => {
  const f = useCurrentFrame();
  const cam = useCamera(f);

  const iris = tween(f, [12, 42], [0, 1150], E.inOut);
  const collapse = tween(f, [164, 192], [1, 0], E.in); // everything folds back into the centre
  const exitFade = tween(f, [170, 190], [1, 0], E.inOut);

  // Dot field — revealed radially, then a travelling wave modulates size and brightness.
  const dots: React.ReactNode[] = [];
  for (let gx = 0; gx <= 24; gx++) {
    for (let gy = 0; gy <= 13; gy++) {
      const x = gx * 80;
      const y = 20 + gy * 80;
      const d = Math.hypot(x - CX, y - CY);
      const appear = tween(f, [14 + d / 38, 40 + d / 38], [0, 1], E.out);
      const wave = 0.5 + 0.5 * Math.sin(d / 95 - f / 7);
      const r = (1.1 + 2.4 * wave * wave) * appear * collapse;
      dots.push(<circle key={`${gx}-${gy}`} cx={x} cy={y} r={r} fill={C.ink} opacity={0.1 + 0.32 * wave} />);
    }
  }

  const ringDraw = tween(f, [20, 64], [0, 1], E.inOut);
  const circ = 2 * Math.PI * R;
  const rr = R * collapse;
  const dashIn = tween(f, [28, 60], [0, 1], E.out);
  const planetIn = tween(f, [36, 56], [0, 1], E.back);
  const planetAng = tween(f, [30, 176], [-160, 25], E.inOut);
  const moonAng = tween(f, [30, 176], [210, -35], E.inOut);
  const planet = polar(rr, planetAng);
  const moon = polar(360 * collapse, moonAng);

  const arcDraw = tween(f, [30, 80], [0, 1], E.inOut);
  const slashes = [0, 1, 2].map((i) => tween(f, [44 + i * 5, 74 + i * 5], [0, 1], E.out));

  // Crosshair: the horizontal hairline survives the exit and becomes the baseline of the next scene.
  const hLen = tween(f, [16, 52], [0, 1920], E.inOut);
  const vLen = tween(f, [22, 58], [0, 1080], E.inOut) * collapse;
  const toRule = tween(f, [168, 196], [0, 1], E.inOut);
  const hWidth = hLen + (1600 - 1920) * toRule;
  const hY = 539 + (719 - 539) * toRule;
  const hAlpha = 0.2 + 0.15 * toRule;

  return (
    <AbsoluteFill style={{clipPath: f < 44 ? `circle(${iris}px at 50% 50%)` : undefined}}>
      <Backdrop />

      <Layer depth={0.35} cam={cam}>
        <svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible'}}>
          {dots}
        </svg>
      </Layer>

      <div style={{position: 'absolute', left: 960 - hWidth / 2, top: hY, width: hWidth, height: 2, background: `rgba(243,239,230,${hAlpha})`}} />
      <div style={{position: 'absolute', top: 540 - vLen / 2, left: 959.5, height: vLen, width: 1, background: 'rgba(243,239,230,0.16)'}} />

      <Layer depth={0.7} cam={cam}>
        <svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible', opacity: exitFade}}>
          <circle
            cx={CX}
            cy={CY}
            r={rr}
            fill="none"
            stroke={C.ink}
            strokeWidth={1.5}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - ringDraw)}
            transform={`rotate(-90 ${CX} ${CY})`}
          />
          <circle
            cx={CX}
            cy={CY}
            r={360 * collapse}
            fill="none"
            stroke={C.ink}
            strokeOpacity={0.28 * dashIn}
            strokeWidth={1}
            strokeDasharray="2 9"
            transform={`rotate(${tween(f, [0, 200], [0, 50], E.inOut)} ${CX} ${CY})`}
          />
          <circle
            cx={CX}
            cy={CY}
            r={(200 + 30 * dashIn) * collapse}
            fill="none"
            stroke={C.amber}
            strokeOpacity={0.75 * dashIn}
            strokeWidth={2}
            strokeDasharray="70 22"
            transform={`rotate(${tween(f, [0, 200], [20, -90], E.inOut)} ${CX} ${CY})`}
          />
          <circle cx={moon.x} cy={moon.y} r={9 * planetIn} fill={C.ink} />
        </svg>
      </Layer>

      <Layer depth={1.05} cam={cam}>
        <svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible', opacity: exitFade}}>
          <circle cx={planet.x} cy={planet.y} r={62 * planetIn * collapse} fill={C.amber} />
          <circle cx={planet.x} cy={planet.y} r={92 * planetIn * collapse} fill="none" stroke={C.amber} strokeOpacity={0.35} />
        </svg>
      </Layer>

      <Layer depth={1.6} cam={cam}>
        <svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible', opacity: exitFade}}>
          <path
            d="M 0 560 A 520 520 0 0 1 520 1080"
            fill="none"
            stroke={C.amber}
            strokeWidth={1.5}
            strokeDasharray={820}
            strokeDashoffset={820 * (1 - arcDraw)}
            transform="translate(-60 0)"
          />
          {slashes.map((p, i) => (
            <line
              key={i}
              x1={1540 + i * 36}
              y1={440}
              x2={1540 + i * 36 + 150 * p}
              y2={440 - 150 * p}
              stroke={i === 1 ? C.amber : C.ink}
              strokeOpacity={i === 1 ? 1 : 0.5}
              strokeWidth={1.5}
            />
          ))}
        </svg>
      </Layer>

      <div style={{position: 'absolute', left: 160, bottom: 170}}>
        <Reveal at={46} exitAt={160}>
          <div style={{...caps, color: C.amber, marginBottom: 18}}>Composition</div>
        </Reveal>
        <KineticLine
          style={{...serif(96, 100), fontSize: 64, fontWeight: 300, color: C.ink, letterSpacing: '-0.015em'}}
          stagger={1}
          dur={22}
          blur={6}
          exitAt={160}
          exitStagger={0.35}
          words={[
            {text: 'Forme,', at: 50},
            {text: 'rythme,', at: 58},
            {text: 'profondeur.', at: 67, style: {fontStyle: 'italic'}},
          ]}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          right: 160,
          top: 150,
          textAlign: 'right',
          fontFamily: SANS,
          fontSize: 13,
          letterSpacing: '0.14em',
          color: C.ink60,
          fontFeatureSettings: '"tnum"',
          opacity: tween(f, [50, 70], [0, 1], E.out) * exitFade,
        }}
      >
        <div>X {String(Math.round(planet.x)).padStart(4, '0')} · Y {String(Math.round(planet.y)).padStart(4, '0')}</div>
        <div style={{opacity: 0.6, marginTop: 6}}>θ {Math.round(((planetAng % 360) + 360) % 360)}°</div>
      </div>
    </AbsoluteFill>
  );
};
