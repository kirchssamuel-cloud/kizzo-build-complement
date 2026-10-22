import {useCurrentFrame} from 'remotion';
import {E, tween} from '../theme';

export type Word = {text: string; at: number; style?: React.CSSProperties};

type LineProps = {
  words: Word[];
  stagger?: number; // frames between letters
  dur?: number; // per-letter duration
  exitAt?: number; // frame at which letters leave (upwards)
  exitStagger?: number;
  blur?: number;
  style?: React.CSSProperties;
  after?: React.ReactNode; // rendered after the last word, outside the masks
};

// Letters rise through a per-word mask, de-blurring as they settle; exit upwards through the same mask.
export const KineticLine: React.FC<LineProps> = ({
  words,
  stagger = 1.6,
  dur = 26,
  exitAt,
  exitStagger = 0.7,
  blur = 10,
  style,
  after,
}) => {
  const f = useCurrentFrame();
  let idx = 0;
  return (
    <div style={{whiteSpace: 'nowrap', ...style}}>
      {words.map((w, wi) => (
        <span key={wi}>
          <span
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              verticalAlign: 'top',
              padding: '0.1em 0.12em 0.2em',
              margin: '-0.1em -0.12em -0.2em',
              ...w.style,
            }}
          >
            {[...w.text].map((ch, ci) => {
              const i = idx++;
              const d = w.at + ci * stagger;
              const p = tween(f, [d, d + dur], [0, 1], E.out);
              const q = exitAt === undefined ? 0 : tween(f, [exitAt + i * exitStagger, exitAt + i * exitStagger + 18], [0, 1], E.in);
              const y = (1 - p) * 135 - q * 135;
              return (
                <span
                  key={ci}
                  style={{
                    display: 'inline-block',
                    transform: `translateY(${y}%) rotate(${(1 - p) * 6}deg)`,
                    transformOrigin: '0% 100%',
                    filter: p < 0.999 || q > 0 ? `blur(${(1 - p) * blur + q * blur * 0.6}px)` : undefined,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </span>
          {wi < words.length - 1 ? ' ' : null}
        </span>
      ))}
      {after}
    </div>
  );
};

// Block-level mask reveal (slide up through a clip), used for UI copy and labels.
export const Reveal: React.FC<{
  at: number;
  exitAt?: number;
  dur?: number;
  distance?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({at, exitAt, dur = 24, distance = 105, style, children}) => {
  const f = useCurrentFrame();
  const p = tween(f, [at, at + dur], [0, 1], E.out);
  const q = exitAt === undefined ? 0 : tween(f, [exitAt, exitAt + 16], [0, 1], E.in);
  return (
    <div style={{overflow: 'hidden', paddingBottom: '0.12em', marginBottom: '-0.12em', ...style}}>
      <div style={{transform: `translateY(${(1 - p) * distance - q * distance}%)`}}>{children}</div>
    </div>
  );
};
