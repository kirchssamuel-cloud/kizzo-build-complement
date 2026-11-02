import {AbsoluteFill, Sequence} from 'remotion';
import {Backdrop} from './components/Backdrop';
import {Grain} from './components/Grain';
import {Hud} from './components/Hud';
import {Closing} from './scenes/Closing';
import {Geometry} from './scenes/Geometry';
import {Interface} from './scenes/Interface';
import {Opening} from './scenes/Opening';
import {Stats} from './scenes/Stats';

// Scenes overlap by a few frames so every hand-off (dot → iris, hairline → baseline → device, bands) is seamless.
export const Showreel: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#141210'}}>
    <Backdrop />
    <Sequence from={0} durationInFrames={160} name="01 Typographie">
      <Opening />
    </Sequence>
    <Sequence from={110} durationInFrames={200} name="02 Géométrie">
      <Geometry />
    </Sequence>
    <Sequence from={300} durationInFrames={250} name="03 Données">
      <Stats />
    </Sequence>
    <Sequence from={540} durationInFrames={210} name="04 Interface">
      <Interface />
    </Sequence>
    <Sequence from={720} durationInFrames={120} name="05 Signature">
      <Closing />
    </Sequence>
    <Hud />
    <Grain />
  </AbsoluteFill>
);
