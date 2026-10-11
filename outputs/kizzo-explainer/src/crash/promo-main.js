// Variante « promo seule » du Crash test : le motion design Kizzo à partir du temps fort
// (écran écrasé qui se rallume et explose, « Pas besoin d'en arriver là. », logo, démo,
// signature en typo cinétique, « Télécharger Kizzo »),
// pour être collé derrière une accroche filmée. Même mise en scène, temps décalé de START.
import { PARAMS, DURATION, WIDTH, HEIGHT, START } from './config.js';
import { createStory } from './story.js';
import { createTitles } from './titles.js';
import { scheduleSoundtrack } from './audio.js';
import { renderWav } from '../audio-core.js';
import { bootPlayer } from '../player.js';

const shift = (story) => ({ ...story, update: (t) => story.update(t + START) });
const schedule = (ctx, out, t0, offset = 0) => scheduleSoundtrack(ctx, out, t0, offset + START);

bootPlayer({
  params: PARAMS,
  duration: DURATION - START,
  width: WIDTH,
  height: HEIGHT,
  start: { cta: 'Lancer avec le son', sub: 'Kizzo · motion design 9:16' },
  createStory: (renderer, scene, camera) => shift(createStory(renderer, scene, camera)),
  createTitles: (root) => {
    const titles = createTitles(root);
    return { update: (t, anchors) => titles.update(t + START, anchors) };
  },
  scheduleSoundtrack: schedule,
  renderSoundtrackWav: (duration) => renderWav(schedule, duration),
  warm: [0.3, 0.8, 1.2, 1.7, 2.3, 3.0, 5.0, 8.0, 12.0, 14.0],
  preview: 1.75,
});
