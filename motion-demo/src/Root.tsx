import {Composition} from 'remotion';
import {Showreel} from './Showreel';
import {Reel} from './reel/Reel';
import {DURATION, FPS, HEIGHT, WIDTH} from './theme';

export const RemotionRoot: React.FC = () => (
  <>
  <Composition id="Reel" component={Reel} durationInFrames={960} fps={60} width={WIDTH} height={HEIGHT} />
  <Composition id="ReelHFR" component={Reel} durationInFrames={3840} fps={240} width={WIDTH} height={HEIGHT} />
  <Composition
    id="Showreel"
    component={Showreel}
    durationInFrames={DURATION}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
  </>
);
