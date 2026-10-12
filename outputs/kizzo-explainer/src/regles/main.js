// Point d'entrée du film « Les règles du jeu » (1:1) : branche la mise en scène sur le lecteur commun.
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
  warm: [0.5, 2.5, 4.9, 6.5, 8.6, 11.0, 13.4, 15.2, 17.0, 20.0, 23.7, 24.6, 25.4, 26.6, 28.4, 29.6, 31.0],
  preview: 13.6,
});
