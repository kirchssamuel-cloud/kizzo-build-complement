import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {KineticLine} from '../components/Kinetic';
import {C, E, serif, tween} from '../theme';

// 0–4 s — the hook builds letter by letter; its final full stop swells into an amber wipe.
export const Opening: React.FC = () => {
  const f = useCurrentFrame();

  const drift = tween(f, [0, 110], [0.965, 1.0], E.inOut);
  const dotPop = tween(f, [66, 82], [0, 1], E.back);
  const dotGrow = tween(f, [96, 122], [1, 210], E.in);
  const ruleIn = tween(f, [54, 84], [0, 1], E.inOut);
  const ruleOut = tween(f, [88, 104], [0, 1], E.in);

  const line: React.CSSProperties = {
    ...serif(144, 50),
    fontSize: 150,
    lineHeight: 1.04,
    letterSpacing: '-0.025em',
    fontWeight: 300,
    color: C.ink,
    textAlign: 'center',
  };
  const accent: React.CSSProperties = {
    ...serif(144, 100, 1),
    fontStyle: 'italic',
    fontWeight: 400,
    color: C.amber,
  };

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{transform: `scale(${drift})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <KineticLine
          style={line}
          exitAt={86}
          words={[
            {text: 'Écrit', at: 4},
            {text: 'en', at: 13},
            {text: 'code,', at: 19},
          ]}
        />
        <KineticLine
          style={line}
          exitAt={90}
          stagger={1.8}
          words={[
            {text: 'pensé', at: 30},
            {text: 'en', at: 39},
            {text: 'mouvement', at: 45, style: accent},
          ]}
          after={
            <span
              style={{
                display: 'inline-block',
                width: '0.15em',
                height: '0.15em',
                marginLeft: '0.05em',
                borderRadius: '50%',
                background: C.amber,
                transform: `scale(${dotPop * dotGrow})`,
              }}
            />
          }
        />
        <div
          style={{
            marginTop: 46,
            height: 1,
            width: 220,
            background: C.ink35,
            transform: `scaleX(${ruleIn * (1 - ruleOut)})`,
            transformOrigin: ruleOut > 0 ? '100% 50%' : '0% 50%',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
