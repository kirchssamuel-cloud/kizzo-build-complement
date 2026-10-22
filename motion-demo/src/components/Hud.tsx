import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, DURATION, E, FPS, SANS, SECTIONS, caps, tween} from '../theme';

const NAMES = ['Typographie', 'Géométrie', 'Données', 'Interface', 'Signature'];
const INSET = 56;
const ROLL = 16; // frames for the odometer roll

// Index of the current section as a continuous, eased value (0 → 4).
const sectionIndex = (f: number) => {
  const input: number[] = [];
  const output: number[] = [];
  SECTIONS.slice(1).forEach((s, i) => {
    input.push(s - ROLL / 2, s + ROLL / 2);
    output.push(i, i + 1);
  });
  return interpolate(f, input, output, {easing: E.inOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
};

const Corner: React.FC<{x: 'left' | 'right'; y: 'top' | 'bottom'; p: number}> = ({x, y, p}) => (
  <div style={{position: 'absolute', [x]: INSET, [y]: INSET, width: 22, height: 22}}>
    <div style={{position: 'absolute', [x]: 0, [y]: 0, height: 1, width: 22 * p, background: C.ink35}} />
    <div style={{position: 'absolute', [x]: 0, [y]: 0, width: 1, height: 22 * p, background: C.ink35}} />
  </div>
);

const Roller: React.FC<{items: string[]; idx: number; height: number; style?: React.CSSProperties}> = ({items, idx, height, style}) => (
  <div style={{height, overflow: 'hidden', ...style}}>
    <div style={{transform: `translateY(${-idx * height}px)`}}>
      {items.map((it) => (
        <div key={it} style={{height, lineHeight: `${height}px`}}>
          {it}
        </div>
      ))}
    </div>
  </div>
);

export const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const draw = tween(f, [4, 30], [0, 1], E.out);
  const textIn = tween(f, [10, 34], [0, 1], E.out);
  const out = tween(f, [DURATION - 44, DURATION - 22], [1, 0], E.inOut);
  const idx = sectionIndex(f);
  const progress = (idx + 1) / 5;

  const secs = Math.floor(f / FPS);
  const tc = `00:${String(secs).padStart(2, '0')}:${String(f % FPS).padStart(2, '0')}`;

  const label: React.CSSProperties = {...caps, fontSize: 12, color: C.ink60, position: 'absolute', opacity: textIn};

  return (
    <AbsoluteFill style={{opacity: out, pointerEvents: 'none'}}>
      <Corner x="left" y="top" p={draw} />
      <Corner x="right" y="top" p={draw} />
      <Corner x="left" y="bottom" p={draw} />
      <Corner x="right" y="bottom" p={draw} />

      <div style={{...label, left: INSET + 40, top: INSET + 2}}>Étude de mouvement</div>
      <div style={{...label, right: INSET + 40, top: INSET + 2, display: 'flex', gap: 10, fontFeatureSettings: '"tnum"'}}>
        <Roller items={['01', '02', '03', '04', '05']} idx={idx} height={16} />
        <span style={{lineHeight: '16px', opacity: 0.5}}>/ 05</span>
      </div>

      <Roller
        items={NAMES}
        idx={idx}
        height={16}
        style={{...label, left: INSET + 40, bottom: INSET + 2, color: C.amber}}
      />
      <div style={{...label, right: INSET + 40, bottom: INSET + 2, lineHeight: '16px', fontFeatureSettings: '"tnum"', fontFamily: SANS}}>
        {tc}
      </div>

      {/* Section progress: steps forward with each chapter, eased — never a linear crawl. */}
      <div
        style={{
          position: 'absolute',
          left: INSET + 240,
          right: INSET + 240,
          bottom: INSET + 9,
          height: 1,
          background: C.ink15,
          transform: `scaleX(${draw})`,
        }}
      >
        <div style={{height: 1, width: `${progress * 100}%`, background: C.amber}} />
      </div>
    </AbsoluteFill>
  );
};
