import {AbsoluteFill, interpolate, interpolateColors, useCurrentFrame} from 'remotion';
import {KineticLine, Reveal} from '../components/Kinetic';
import {C, E, SANS, caps, serif, tween} from '../theme';

const PW = 400;
const PH = 820;
const PX = 1230; // phone centre
const PY = 540;

const DATA_A = [0.32, 0.4, 0.34, 0.52, 0.46, 0.6, 0.55, 0.72];
const DATA_B = [0.22, 0.3, 0.46, 0.42, 0.62, 0.7, 0.66, 0.9];

const Chart: React.FC<{f: number}> = ({f}) => {
  const w = 300;
  const h = 96;
  const morph = tween(f, [112, 138], [0, 1], E.inOut);
  const pts = DATA_A.map((a, i) => ({x: (i / (DATA_A.length - 1)) * w, y: h - (a + (DATA_B[i] - a) * morph) * h}));
  // Smooth Catmull-Rom → cubic Bézier path
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  const draw = tween(f, [72, 112], [0, 1], E.inOut);
  const last = pts[pts.length - 1];
  const pulse = (f % 30) / 30;
  return (
    <svg width={w} height={h + 8} style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.amber} stopOpacity={0.28} />
          <stop offset="100%" stopColor={C.amber} stopOpacity={0} />
        </linearGradient>
        <clipPath id="reveal">
          <rect x={-10} y={-20} width={(w + 20) * draw} height={h + 40} />
        </clipPath>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={0} x2={w} y1={h * g} y2={h * g} stroke={C.ink08} />
      ))}
      <g clipPath="url(#reveal)">
        <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#area)" />
        <path d={d} fill="none" stroke={C.amber} strokeWidth={2.5} strokeLinecap="round" />
      </g>
      {draw > 0.98 ? (
        <>
          <circle cx={last.x} cy={last.y} r={5 + 14 * E.out(pulse)} fill={C.amber} opacity={0.35 * (1 - pulse)} />
          <circle cx={last.x} cy={last.y} r={5} fill={C.ink} />
        </>
      ) : null}
    </svg>
  );
};

const Toggle: React.FC<{on: number}> = ({on}) => (
  <div style={{width: 40, height: 24, borderRadius: 12, background: interpolateColors(on, [0, 1], ['#3a3530', C.amber]), position: 'relative'}}>
    <div style={{position: 'absolute', top: 3, left: 3 + 16 * on, width: 18, height: 18, borderRadius: 9, background: C.ink}} />
  </div>
);

const Glyph: React.FC<{kind: number}> = ({kind}) => (
  <svg width={16} height={16} viewBox="0 0 16 16">
    {kind === 0 ? <circle cx={8} cy={8} r={6} fill="none" stroke={C.ink} strokeWidth={1.5} /> : null}
    {kind === 1 ? <rect x={2.5} y={2.5} width={11} height={11} rx={3} fill="none" stroke={C.ink} strokeWidth={1.5} /> : null}
    {kind === 2 ? <path d="M8 2 L14 13 L2 13 Z" fill="none" stroke={C.ink} strokeWidth={1.5} strokeLinejoin="round" /> : null}
  </svg>
);

const Screen: React.FC<{f: number}> = ({f}) => {
  const up = (at: number, dist = 24) => {
    const p = tween(f, [at, at + 24], [0, 1], E.out);
    return {opacity: p, transform: `translateY(${(1 - p) * dist}px)`};
  };
  const seg = tween(f, [112, 128], [0, 1], E.inOut);
  const pct = Math.round(interpolate(tween(f, [112, 138], [0, 1], E.inOut), [0, 1], [24, 61]));
  const press = tween(f, [156, 162], [0, 1], E.out) - tween(f, [162, 176], [0, 1], E.back);
  const ripple = tween(f, [158, 186], [0, 1], E.out);
  const label: React.CSSProperties = {fontFamily: SANS, fontSize: 12, color: C.ink60, letterSpacing: '0.04em'};

  return (
    <div style={{position: 'absolute', inset: 0, padding: '0 26px', fontFamily: SANS, color: C.ink}}>
      {/* Status bar */}
      <div style={{position: 'absolute', top: 14, left: '50%', marginLeft: -54, width: 108, height: 30, borderRadius: 15, background: '#0a0908'}} />
      <div style={{...up(52, 8), display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 58, padding: '0 10px'}}>
        <span style={{fontSize: 15, fontWeight: 600, fontFeatureSettings: '"tnum"'}}>9:41</span>
        <span style={{display: 'flex', gap: 6, alignItems: 'center'}}>
          <span style={{display: 'flex', gap: 2, alignItems: 'flex-end'}}>
            {[5, 7, 9, 11].map((h) => (
              <span key={h} style={{width: 3, height: h, borderRadius: 1, background: C.ink}} />
            ))}
          </span>
          <span style={{width: 24, height: 12, borderRadius: 4, border: `1.5px solid ${C.ink60}`, padding: 1.5, boxSizing: 'border-box'}}>
            <span style={{display: 'block', height: '100%', width: '70%', borderRadius: 2, background: C.ink}} />
          </span>
        </span>
      </div>

      {/* Header */}
      <div style={{...up(58), display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14}}>
        <div>
          <div style={label}>Lundi</div>
          <div style={{...serif(72, 100), fontSize: 38, fontWeight: 400, letterSpacing: '-0.02em', marginTop: 2}}>Aperçu</div>
        </div>
        <div style={{width: 42, height: 42, borderRadius: 21, border: `1.5px solid ${C.amber}`, display: 'grid', placeItems: 'center'}}>
          <div style={{width: 30, height: 30, borderRadius: 15, background: '#3a3530'}} />
        </div>
      </div>

      {/* Segmented control */}
      <div style={{...up(64), marginTop: 22, height: 40, borderRadius: 20, background: '#24201c', position: 'relative', display: 'flex'}}>
        <div style={{position: 'absolute', top: 4, left: 4 + seg * 112, width: 108, height: 32, borderRadius: 16, background: C.amber}} />
        {['Jour', 'Semaine', 'Mois'].map((t, i) => {
          const active = i === 0 ? 1 - seg : i === 1 ? seg : 0;
          return (
            <div
              key={t}
              style={{
                position: 'relative',
                flex: 1,
                textAlign: 'center',
                lineHeight: '40px',
                fontSize: 13,
                fontWeight: 600,
                color: interpolateColors(active, [0, 1], [C.ink60, C.bg]),
              }}
            >
              {t}
            </div>
          );
        })}
      </div>

      {/* Chart card */}
      <div style={{...up(70), marginTop: 16, borderRadius: 22, background: C.surface, padding: '18px 18px 16px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={label}>Activité</div>
          <div style={{...label, color: C.amber}}>{seg > 0.5 ? 'Semaine' : 'Jour'}</div>
        </div>
        <div style={{...serif(72, 100), fontSize: 40, fontWeight: 400, margin: '4px 0 12px', fontFeatureSettings: '"tnum"'}}>
          +{pct}
          <span style={{fontFamily: SANS, fontSize: 18, color: C.ink60, marginLeft: 4}}>%</span>
        </div>
        <Chart f={f} />
      </div>

      {/* List */}
      <div style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10}}>
        {[
          {t: 'Revue du design', s: 'Il y a 2 min'},
          {t: 'Export final', s: 'En cours'},
          {t: 'Partage équipe', s: 'Planifié'},
        ].map((row, i) => {
          const p = tween(f, [86 + i * 7, 116 + i * 7], [0, 1], E.out);
          const on = i === 0 ? 1 : i === 1 ? tween(f, [140, 152], [0, 1], E.inOut) : 0;
          return (
            <div
              key={row.t}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                height: 60,
                padding: '0 14px',
                borderRadius: 18,
                background: C.surface,
                opacity: p,
                transform: `translateX(${(1 - p) * 60}px)`,
              }}
            >
              <div style={{width: 34, height: 34, borderRadius: 11, background: C.ink08, display: 'grid', placeItems: 'center'}}>
                <Glyph kind={i} />
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: 14, fontWeight: 500}}>{row.t}</div>
                <div style={{fontSize: 11.5, color: C.ink60, marginTop: 2}}>{row.s}</div>
              </div>
              <Toggle on={on} />
            </div>
          );
        })}
      </div>

      {/* Primary button */}
      <div
        style={{
          ...up(98),
          position: 'absolute',
          left: 26,
          right: 26,
          bottom: 26,
          height: 54,
          borderRadius: 18,
          overflow: 'hidden',
          background: C.amber,
          color: C.bg,
          fontSize: 15,
          fontWeight: 600,
          display: 'grid',
          placeItems: 'center',
          transform: `${up(98).transform} scale(${1 - 0.04 * press})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 420,
            height: 420,
            marginLeft: -210,
            marginTop: -210,
            borderRadius: '50%',
            background: C.ink,
            opacity: 0.35 * (1 - ripple),
            transform: `scale(${ripple})`,
          }}
        />
        <span style={{position: 'relative'}}>Continuer</span>
      </div>
    </div>
  );
};

const Float: React.FC<{z: number; x: number; y: number; w: number; f: number; at: number; from: [number, number]; children: React.ReactNode}> = ({
  z,
  x,
  y,
  w,
  f,
  at,
  from,
  children,
}) => {
  const p = tween(f, [at, at + 30], [0, 1], E.out);
  const bob = Math.sin((f - at) / 22) * 5;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        opacity: p,
        transform: `translate3d(${(1 - p) * from[0]}px, ${(1 - p) * from[1] + bob}px, ${z}px)`,
        borderRadius: 20,
        background: 'rgba(37,33,29,0.94)',
        border: `1px solid ${C.ink08}`,
        boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.35)',
        fontFamily: SANS,
        color: C.ink,
      }}
    >
      {children}
    </div>
  );
};

// 18–24 s — the baseline folds into a device frame; a generic app comes alive inside, floating cards add depth.
export const Interface: React.FC = () => {
  const f = useCurrentFrame();

  // Morph: 1600×2 hairline → 400×820 device, in two choreographed beats (width, then height).
  const w = interpolate(tween(f, [10, 34], [0, 1], E.inOut), [0, 1], [1600, PW]);
  const hp = tween(f, [24, 52], [0, 1], E.inOut);
  const h = interpolate(hp, [0, 1], [2, PH]);
  const cy = interpolate(hp, [0, 1], [720, PY]);
  const cx = interpolate(tween(f, [10, 34], [0, 1], E.inOut), [0, 1], [960, PX]);
  const radius = tween(f, [30, 52], [0, 58], E.inOut);
  const fill = tween(f, [44, 60], [0, 1], E.out);
  const strokeA = interpolate(fill, [0, 1], [0.35, 0.16]);

  const rotY = tween(f, [40, 195], [0, -16], E.inOut);
  const rotX = tween(f, [40, 195], [0, 5], E.inOut);

  const pctCard = Math.round(tween(f, [78, 130], [0, 72], E.out));

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 160, top: 360, width: 620}}>
        <Reveal at={24}>
          <div style={{...caps, color: C.amber, marginBottom: 22}}>Interface</div>
        </Reveal>
        <KineticLine
          style={{...serif(144, 100), fontSize: 92, fontWeight: 300, lineHeight: 1.02, color: C.ink, letterSpacing: '-0.025em'}}
          stagger={1.1}
          dur={24}
          words={[
            {text: 'Des', at: 28},
            {text: 'écrans', at: 32},
          ]}
        />
        <KineticLine
          style={{...serif(144, 100), fontSize: 92, fontWeight: 300, lineHeight: 1.02, color: C.ink, letterSpacing: '-0.025em'}}
          stagger={1.1}
          dur={24}
          words={[
            {text: 'qui', at: 40},
            {text: 'respirent.', at: 45, style: {...serif(144, 100, 1), fontStyle: 'italic', color: C.amber}},
          ]}
        />
        <Reveal at={58} style={{marginTop: 30}}>
          <div style={{fontFamily: SANS, fontSize: 21, lineHeight: 1.5, color: 'rgba(243,239,230,0.66)', width: 470}}>
            États, transitions et micro-interactions — chaque élément a son propre tempo.
          </div>
        </Reveal>
      </div>

      <AbsoluteFill style={{perspective: 2200, perspectiveOrigin: `${PX}px ${PY}px`}}>
        <AbsoluteFill
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: `${PX}px ${PY}px`,
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          {/* Behind the device */}
          <Float z={-140} x={1440} y={150} w={250} f={f} at={84} from={[40, 0]}>
            <div style={{padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.ink60, fontFeatureSettings: '"tnum"'}}>
              <span style={{width: 8, height: 8, borderRadius: 4, background: C.amber}} />
              1920 × 1080 · 30 i/s
            </div>
          </Float>

          {/* Device */}
          <div
            style={{
              position: 'absolute',
              left: cx - w / 2,
              top: cy - h / 2,
              width: w,
              height: h,
              boxSizing: 'border-box',
              border: `1px solid rgba(243,239,230,${strokeA})`,
              borderRadius: radius,
              overflow: 'hidden',
              background: `rgba(24,21,19,${fill})`,
              boxShadow: fill > 0 ? `0 60px 120px rgba(0,0,0,${0.55 * fill}), inset 0 0 0 7px rgba(10,9,8,${fill})` : undefined,
            }}
          >
            {f > 44 ? <Screen f={f} /> : null}
          </div>

          {/* In front of the device */}
          <Float z={160} x={730} y={300} w={280} f={f} at={74} from={[-60, 0]}>
            <div style={{padding: '18px 20px 20px'}}>
              <div style={{...caps, fontSize: 11, color: C.ink60}}>Progression</div>
              <div style={{...serif(72, 100), fontSize: 44, fontWeight: 400, margin: '6px 0 12px', fontFeatureSettings: '"tnum"'}}>
                {pctCard}
                <span style={{fontFamily: SANS, fontSize: 18, color: C.ink60, marginLeft: 4}}>%</span>
              </div>
              <div style={{height: 4, borderRadius: 2, background: C.ink08}}>
                <div style={{height: 4, borderRadius: 2, width: `${pctCard}%`, background: C.amber}} />
              </div>
            </div>
          </Float>

          <Float z={100} x={1330} y={700} w={320} f={f} at={124} from={[0, 50]}>
            <div style={{padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14}}>
              <svg width={36} height={36} viewBox="0 0 36 36">
                <circle cx={18} cy={18} r={18} fill={C.amber} />
                <path
                  d="M11 18.5 L16 23 L25 13.5"
                  fill="none"
                  stroke={C.bg}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={22}
                  strokeDashoffset={22 * (1 - tween(f, [136, 152], [0, 1], E.out))}
                />
              </svg>
              <div>
                <div style={{fontSize: 15, fontWeight: 600}}>Rendu terminé</div>
                <div style={{fontSize: 12.5, color: C.ink60, marginTop: 3, fontFeatureSettings: '"tnum"'}}>840 images · 28 s</div>
              </div>
            </div>
          </Float>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
