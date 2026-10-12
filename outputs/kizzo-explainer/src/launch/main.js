// Point d'entrée du film « La demande » (9:16, 2D).
import { PARAMS, DURATION, WIDTH, HEIGHT, T } from './config.js';
import { render, subframes } from './film.js';
import { scheduleSoundtrack, renderSoundtrackWav } from './audio.js';
import { bootPlayer2D } from '../player2d.js';
import { loadVoice } from './vo.js';

bootPlayer2D({
  params: PARAMS,
  duration: DURATION,
  width: WIDTH,
  height: HEIGHT,
  start: T.start,
  render,
  subframes,
  shutter: 0.75 / 60,
  scheduleSoundtrack,
  renderSoundtrackWav,
  preload: loadVoice,
  warm: [0.5, 3, 4.5, 6, 7.5, 9, 10.5, 12, 13.5],
  preview: 6.2,
});
