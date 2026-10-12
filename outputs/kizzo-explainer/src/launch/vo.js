// Voix off du film « La demande » (Gemini TTS, voix « Sulafat »), une phrase par scène.
// MP3 embarqués dans le HTML, décodés une fois au démarrage.
import ph1 from './vo/ph1.mp3';
import ph2 from './vo/ph2.mp3';
import ph3 from './vo/ph3.mp3';
import ph4 from './vo/ph4.mp3';
import { E } from './config.js';

const B64 = { ph1, ph2, ph3, ph4 };
/** Instant de départ et durée (s) de chaque phrase. */
export const VO = [
  { id: 'ph1', at: 0.35, dur: 2.4 }, // Il voulait trente minutes de plus.
  { id: 'ph2', at: 4.3, dur: 2.43 }, // Kizzo lui a préparé trois questions sur sa leçon de mardi.
  { id: 'ph3', at: E.click, dur: 1.83 }, // Trois bonnes réponses, trente minutes gagnées.
  { id: 'ph4', at: E.mark - 0.1, dur: 3.0 }, // Kizzo. Le temps d'écran se gagne en apprenant.
];
export const inVoice = (t) => VO.some((v) => t > v.at - 0.12 && t < v.at + v.dur + 0.15);

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
