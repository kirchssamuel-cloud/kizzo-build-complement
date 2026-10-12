// Point d'entrée de la promo 3D « La reconstruction » (9:16).
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
  warm: [0.3, 0.8, 1.6, 2.2, 2.8, 3.4, 4.3, 4.8, 5.3, 6.2, 6.8, 7.6, 8.4, 8.9, 9.4, 10.2, 11.2, 12.4, 13.5],
  preview: 4.4,
});
