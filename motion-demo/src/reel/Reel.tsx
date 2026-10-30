import {AbsoluteFill} from 'remotion';
import '../theme';
import {End} from './End';
import {Fluid} from './Fluid';
import {Geo} from './Geo';
import {Ignition} from './Ignition';
import {AMBER, DUR, E, INK, PAPER, seg, useFontsReady, useTime} from './lib';
import {Mask} from './Mask';
import {Particles} from './Particles';
import {Words} from './Words';

const Grain: React.FC<{t: number}> = ({t}) => {
  const seed = Math.floor(t * 24) % 24;
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: 0.075, pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={`rg-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#rg-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Frame: React.FC<{t: number}> = ({t}) => {
  const draw = seg(t, 0.3, 0.9, 0, 1, E.out);
  const out = 1 - seg(t, 15.2, 15.7, 0, 1, E.inOut);
  const tc = `${String(Math.floor(t)).padStart(2, '0')}:${String(Math.floor((t % 1) * 60)).padStart(2, '0')}`;
  const onAmber = t > 4.0 && t < 6.6;
  const c = onAmber ? 'rgba(20,18,16,0.55)' : 'rgba(243,239,230,0.45)';
  const corner = (pos: React.CSSProperties, bx: string, by: string) => (
    <div style={{position: 'absolute', width: 22 * draw, height: 22 * draw, ...pos, [bx]: `1px solid ${c}`, [by]: `1px solid ${c}`}} />
  );
  const label: React.CSSProperties = {position: 'absolute', fontFamily: 'Inter', fontSize: 12, fontWeight: 500, letterSpacing: '0.28em', color: c, opacity: draw};
  return (
    <AbsoluteFill style={{opacity: out, pointerEvents: 'none'}}>
      {corner({left: 56, top: 56}, 'borderLeft', 'borderTop')}
      {corner({right: 56, top: 56}, 'borderRight', 'borderTop')}
      {corner({left: 56, bottom: 56}, 'borderLeft', 'borderBottom')}
      {corner({right: 56, bottom: 56}, 'borderRight', 'borderBottom')}
      <div style={{...label, left: 96, top: 58}}>SHOWREEL</div>
      <div style={{...label, right: 96, top: 58, fontFeatureSettings: '"tnum"'}}>{tc}</div>
      <div style={{...label, left: 96, bottom: 58}}>120 BPM</div>
      <div style={{...label, right: 96, bottom: 58, fontFeatureSettings: '"tnum"'}}>{String(Math.min(32, Math.floor(t / 0.5) + 1)).padStart(2, '0')} / 32</div>
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => {
  const t = useTime();
  const ready = useFontsReady();
  return (
    <AbsoluteFill style={{background: INK}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 75% at 50% 48%, #1d1915 0%, ${INK} 60%, #0b0a09 100%)`}} />
      {ready ? (
        <>
          {t >= 1.95 && t < 4.45 ? <Words t={t} /> : null}
          {t < 2.12 ? <Ignition t={t} /> : null}
          {t >= 3.99 && t < 8.45 ? <Geo t={t} /> : null}
          {t >= 7.95 && t < 10.45 ? <Particles t={t} /> : null}
          {t >= 9.98 && t < 12.06 ? <Fluid t={t} /> : null}
          {t >= 12.0 && t < 14.05 ? <Mask t={t} /> : null}
          {t >= 13.98 ? <End t={t} /> : null}
          <Frame t={t} />
        </>
      ) : null}
      <Grain t={t} />
    </AbsoluteFill>
  );
};

export const REEL_DURATION = DUR;
export const REEL_COLORS = {AMBER, PAPER};
