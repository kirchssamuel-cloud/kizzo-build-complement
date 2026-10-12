// Point d'entrée du film « Crash test » (9:16) : accroche 3D au ralenti + motion design 2D.
import { PARAMS, DURATION, WIDTH, HEIGHT, T } from './config.js';
import { createStory } from './story.js';
import { createTitles } from './titles.js';
import { scheduleSoundtrack, renderSoundtrackWav } from './audio.js';
import { bootPlayer } from '../player.js';

bootPlayer({
  params: PARAMS,
  duration: DURATION,
  width: WIDTH,
  height: HEIGHT,
  start: T.start,
  createStory,
  createTitles,
  scheduleSoundtrack,
  renderSoundtrackWav,
  warm: [0.5, 3.0, 6.0, 9.5, 11.5, 12.6, 13.1, 13.4, 14.2, 16.0, 17.2, 19.6, 21.0, 22.6, 25.2],
  preview: 6.2,
});
