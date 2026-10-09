// Voix off (MP3 embarqués dans le HTML) : décodées une fois au démarrage, puis jouées
// par la partition en temps réel comme en rendu hors-ligne.
import v01 from './vo/v01.mp3';
import v02 from './vo/v02.mp3';
import v03 from './vo/v03.mp3';
import v04 from './vo/v04.mp3';
import v05 from './vo/v05.mp3';
import v06 from './vo/v06.mp3';
import v07 from './vo/v07.mp3';
import v08 from './vo/v08.mp3';
import v09 from './vo/v09.mp3';
import v10 from './vo/v10.mp3';
import v11 from './vo/v11.mp3';

const B64 = { v01, v02, v03, v04, v05, v06, v07, v08, v09, v10, v11 };

/** Durée parlée de chaque phrase (s), pour caler les sous-titres. */
export const VO_DUR = { v01: 2.12, v02: 2.26, v03: 2.22, v04: 2.76, v05: 2.53, v06: 3.57, v07: 3.1, v08: 1.52, v09: 1.24, v10: 2.44, v11: 2.81 };

let buffers = null;

export async function loadVoice() {
  if (buffers) return buffers;
  const ctx = new OfflineAudioContext(1, 1, 48000);
  const out = {};
  for (const [id, b64] of Object.entries(B64)) {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    out[id] = await ctx.decodeAudioData(bin.buffer);
  }
  buffers = out;
  return buffers;
}

export const voiceBuffers = () => buffers;
