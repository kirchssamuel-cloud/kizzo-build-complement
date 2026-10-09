// Point d'entrée du film explicatif (9:16) : branche la mise en scène sur le lecteur commun.
import { PARAMS, DURATION, WIDTH, HEIGHT, T } from './config.js';
import { createStory } from './story.js';
import { createTitles } from './titles.js';
import { scheduleSoundtrack, renderSoundtrackWav } from './audio.js';
import { bootPlayer } from './player.js';

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
  warm: [0.4, 3.3, 5.6, 7.0, 7.6, 8.2, 9.3, 10.6, 12.3, 14.1, 17.0, 19.2, 21.7, 23.1, 25.4, 29.1, 30.7, 32.8, 35.0],
  preview: 7.4,
});
