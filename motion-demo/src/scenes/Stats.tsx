import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {KineticLine, Reveal} from '../components/Kinetic';
import {C, E, SANS, caps, serif, tween} from '../theme';

const LEFT = 160;
const COL = 1600 / 3;
const RULE_Y = 719;
const EXIT = 206;

// Fixed-width digits with "ghost" leading zeros: the counter never jitters as it climbs.
const Counter: React.FC<{value: number; digits: number; suffix: string}> = ({value, digits, suffix}) => {
  const s = String(Math.round(value)).padStart(digits, '0');
  const firstSig = s.search(/[1-9]/);
  return (
    <div style={{display: 'flex', alignItems: 'baseline'}}>
      {[...s].map((d, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: '0.6em',
            textAlign: 'center',
            color: C.ink,
            opacity: firstSig === -1 || i < firstSig ? 0.14 : 1,
          }}
        >
          {d}
        </span>
      ))}
      <span style={{fontFamily: SANS, fontSize: 30, fontWeight: 500, color: C.amber, marginLeft: 14, letterSpacing: '0.02em'}}>{suffix}</span>
    </div>
  );
};

const Ticks: React.FC<{value: number}> = ({value}) => (
  <div style={{display: 'flex', alignItems: 'flex-end', gap: 9, height: 44}}>
    {Array.from({length: 30}, (_, k) => {
      const lit = Math.min(1, Math.max(0, value - k));
      return (
        <div
          key={k}
          style={{
            width: 4,
            height: 18 + 26 * lit,
            borderRadius: 2,
            background: interpolateColors(lit, [0, 1], [C.ink15, C.amber]),
          }}
        />
      );
    })}
  </div>
);

const Bars: React.FC<{f: number; at: number}> = ({f, at}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
    {[480, 720, 1080].map((res, i) => {
      const p = tween(f, [at + i * 7, at + i * 7 + 40], [0, 1], E.out);
      return (
        <div key={res} style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <div style={{fontFamily: SANS, fontSize: 12, color: C.ink60, width: 40, fontFeatureSettings: '"tnum"', letterSpacing: '0.06em'}}>{res}</div>
          <div style={{width: 330, height: 4, borderRadius: 2, background: C.ink08}}>
            <div style={{height: 4, borderRadius: 2, width: 330 * (res / 1080) * p, background: res === 1080 ? C.amber : 'rgba(243,239,230,0.55)'}} />
          </div>
        </div>
      );
    })}
  </div>
);

const Ring: React.FC<{value: number}> = ({value}) => {
  const r = 30;
  const c = 2 * Math.PI * r;
  const a = ((value / 100) * 360 - 90) * (Math.PI / 180);
  return (
    <svg width={76} height={76} viewBox="-38 -38 76 76">
      <circle r={r} fill="none" stroke={C.ink08} strokeWidth={4} />
      <circle
        r={r}
        fill="none"
        stroke={C.amber}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform="rotate(-90)"
      />
      {value > 1 ? <circle cx={r * Math.cos(a)} cy={r * Math.sin(a)} r={5} fill={C.ink} /> : null}
    </svg>
  );
};

// 10–18 s — three true facts about this very film, each with its own micro-animation.
export const Stats: React.FC = () => {
  const f = useCurrentFrame();

  const cols = [
    {target: 30, digits: 2, suffix: 'i/s', label: 'images par seconde'},
    {target: 1080, digits: 4, suffix: 'p', label: 'lignes de définition'},
    {target: 100, digits: 3, suffix: '%', label: 'de l’animation écrite en code'},
  ];

  return (
    <AbsoluteFill>
      {/* Baseline inherited from the previous scene's hairline */}
      <div style={{position: 'absolute', left: LEFT, top: RULE_Y, width: 1600, height: 2, background: C.ink35}} />

      <div style={{position: 'absolute', left: LEFT, top: 170}}>
        <Reveal at={6} exitAt={EXIT}>
          <div style={{...caps, color: C.amber, marginBottom: 20}}>Données</div>
        </Reveal>
        <KineticLine
          style={{...serif(96, 100), fontSize: 72, fontWeight: 300, color: C.ink, letterSpacing: '-0.02em'}}
          stagger={0.9}
          dur={22}
          blur={6}
          exitAt={EXIT}
          exitStagger={0.3}
          words={[
            {text: 'Mesuré,', at: 10},
            {text: 'image', at: 20, style: {fontStyle: 'italic'}},
            {text: 'par', at: 25, style: {fontStyle: 'italic'}},
            {text: 'image.', at: 29, style: {fontStyle: 'italic'}},
          ]}
        />
      </div>

      {cols.map((col, i) => {
        const s = 34 + i * 16;
        const x = LEFT + i * COL;
        const pad = i === 0 ? 0 : 44;
        const value = tween(f, [s + 4, s + 74], [0, col.target], E.out);
        const divider = tween(f, [16 + i * 6, 56 + i * 6], [0, 1], E.inOut) * tween(f, [EXIT, EXIT + 22], [1, 0], E.in);
        const vizOut = tween(f, [EXIT + i * 4, EXIT + i * 4 + 16], [1, 0], E.in);
        const vizIn = tween(f, [s + 18, s + 38], [0, 1], E.out);
        return (
          <div key={i}>
            {i > 0 ? (
              <div
                style={{
                  position: 'absolute',
                  left: x,
                  top: 400,
                  width: 1,
                  height: 490 * divider,
                  background: C.ink15,
                }}
              />
            ) : null}
            <div style={{position: 'absolute', left: x + pad, bottom: 1080 - RULE_Y + 26}}>
              <Reveal at={s} exitAt={EXIT + i * 5} dur={28}>
                <div style={{...serif(144, 0), fontSize: 164, fontWeight: 300, lineHeight: 0.86, letterSpacing: '-0.02em'}}>
                  <Counter value={value} digits={col.digits} suffix={col.suffix} />
                </div>
              </Reveal>
            </div>
            <div style={{position: 'absolute', left: x + pad, top: RULE_Y + 32}}>
              <Reveal at={s + 16} exitAt={EXIT + i * 5}>
                <div style={{fontFamily: SANS, fontSize: 22, color: 'rgba(243,239,230,0.78)', letterSpacing: '-0.005em'}}>{col.label}</div>
              </Reveal>
              <div style={{marginTop: 30, opacity: vizIn * vizOut, transform: `translateY(${(1 - vizIn) * 16 - (1 - vizOut) * 16}px)`}}>
                {i === 0 ? <Ticks value={value} /> : null}
                {i === 1 ? <Bars f={f} at={s + 12} /> : null}
                {i === 2 ? (
                  <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
                    <Ring value={value} />
                    <div style={{fontFamily: SANS, fontSize: 14, lineHeight: 1.45, color: C.ink60, width: 270}}>
                      Aucune image dessinée à la main.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
