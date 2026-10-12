// Point d'entrée de la pub 9:16 « 23:47 » : images 2D plein cadre + habillage + voix off.
import { PARAMS, DURATION, WIDTH, HEIGHT, T } from './config.js';
import { createStory } from './story.js';
import { createTitles } from './titles.js';
import { scheduleSoundtrack, renderSoundtrackWav } from './audio.js';
import { loadVoice } from './vo.js';
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
  preload: loadVoice,
  warm: [0.3, 6.0, 11.0, 14.0, 15.0, 16.0, 17.6, 19.0, 20.0, 21.0, 24.0],
  preview: 1.2,
});
