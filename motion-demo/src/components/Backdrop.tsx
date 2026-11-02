import {AbsoluteFill} from 'remotion';
import {C} from '../theme';

// Warm anthracite with a soft off-centre vignette: depth without a "gradient look".
export const Backdrop: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <AbsoluteFill
    style={{
      backgroundColor: C.bg,
      backgroundImage: `radial-gradient(ellipse 75% 70% at 50% 46%, #1b1815 0%, ${C.bg} 58%, ${C.bgDeep} 100%)`,
      ...style,
    }}
  />
);
