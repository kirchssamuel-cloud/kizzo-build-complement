import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {KineticLine, Reveal} from '../components/Kinetic';
import {C, E, caps, serif, tween} from '../theme';

const BANDS = 6;
const COVERED = 27; // every band is closed by this frame

// 24–28 s — staggered bands wipe the interface away; the film signs off on typography and fades clean.
export const Closing: React.FC = () => {
  const f = useCurrentFrame();

  const drift = tween(f, [28, 120], [0.97, 1.0], E.inOut);
  const dotPop = tween(f, [70, 86], [0, 1], E.back);
  const rule = tween(f, [64, 92], [0, 1], E.inOut);
  const fadeOut = tween(f, [96, 114], [1, 0], E.inOut);

  const line: React.CSSProperties = {
    ...serif(144, 50),
    fontSize: 150,
    lineHeight: 1.04,
    letterSpacing: '-0.025em',
    fontWeight: 300,
    color: C.ink,
    textAlign: 'center',
  };

  return (
    <AbsoluteFill>
      {f >= COVERED ? (
        <AbsoluteFill>
          <Backdrop />
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: fadeOut}}>
            <div style={{transform: `scale(${drift})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <KineticLine style={line} words={[{text: 'Chaque', at: 30}, {text: 'image', at: 40}]} />
              <KineticLine
                style={line}
                stagger={2}
                words={[{text: 'compte', at: 50, style: {...serif(144, 100, 1), fontStyle: 'italic', fontWeight: 400, color: C.amber}}]}
                after={
                  <span
                    style={{
                      display: 'inline-block',
                      width: '0.15em',
                      height: '0.15em',
                      marginLeft: '0.05em',
                      borderRadius: '50%',
                      background: C.amber,
                      transform: `scale(${dotPop})`,
                    }}
                  />
                }
              />
              <div style={{marginTop: 46, height: 1, width: 220, background: C.ink35, transform: `scaleX(${rule})`}} />
              <Reveal at={74} style={{marginTop: 30}}>
                <div style={{...caps, color: C.ink60}}>Motion design · Typographie · Interface</div>
              </Reveal>
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}

      {/* Band wipe: closes left → right, then opens to the right, each band a beat behind the previous */}
      {Array.from({length: BANDS}, (_, k) => {
        const close = tween(f, [k * 2, k * 2 + 16], [0, 1], E.snap);
        const open = tween(f, [COVERED + 1 + k * 2, COVERED + 17 + k * 2], [0, 1], E.snap);
        const left = open > 0 ? open * 1920 : 0;
        const width = open > 0 ? 1920 * (1 - open) : 1920 * close;
        if (width <= 0.5) return null;
        return (
          <div key={k} style={{position: 'absolute', top: k * 180, left, width, height: 181, background: '#1d1a17'}}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 3,
                background: C.amber,
                [open > 0 ? 'left' : 'right']: 0,
                opacity: open > 0 ? 1 - open : 1 - close * 0.4,
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
