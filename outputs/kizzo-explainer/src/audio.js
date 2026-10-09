// Sound design 100 % synthétisé (Web Audio) et calé sur la timeline.
// La même partition sert à la lecture temps réel et au rendu hors-ligne (export MP4).
import { TL } from './config.js';

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI -> Hz

function makeNoise(ctx, seconds = 2) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let s = 1234567;
  for (let i = 0; i < len; i++) {
    s = (s * 16807) % 2147483647;
    d[i] = (s / 2147483647) * 2 - 1;
  }
  return buf;
}

function makeImpulse(ctx, seconds = 2.8, decay = 2.6) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let s = 99991 + c * 7;
    for (let i = 0; i < len; i++) {
      s = (s * 16807) % 2147483647;
      const n = (s / 2147483647) * 2 - 1;
      d[i] = n * Math.pow(1 - i / len, decay) * (i < 200 ? i / 200 : 1);
    }
  }
  return buf;
}

/**
 * Programme toute la bande-son.
 * @param {BaseAudioContext} ctx
 * @param {AudioNode} out destination
 * @param {number} t0 temps contexte correspondant à `offset`
 * @param {number} offset position (s) dans la vidéo à partir de laquelle jouer
 */
export function scheduleSoundtrack(ctx, out, t0, offset = 0) {
  const nodes = [];
  const noise = makeNoise(ctx, 3);

  // Bus maître : compresseur + réverbe à convolution
  const master = ctx.createGain();
  master.gain.value = 1.3;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 10;
  comp.ratio.value = 3.5;
  comp.attack.value = 0.004;
  comp.release.value = 0.22;
  master.connect(comp).connect(out);
  const verb = ctx.createConvolver();
  verb.buffer = makeImpulse(ctx);
  const verbGain = ctx.createGain();
  verbGain.gain.value = 0.32;
  verb.connect(verbGain).connect(master);
  const dry = ctx.createGain();
  dry.connect(master);
  const send = (node, wet = 0.4) => {
    node.connect(dry);
    const g = ctx.createGain();
    g.gain.value = wet;
    node.connect(g).connect(verb);
  };

  const T = (t) => t0 + (t - offset); // temps vidéo -> temps contexte
  // les nappes déjà commencées reprennent ; les sons ponctuels passés sont ignorés (scrub)
  const live = (t, dur, sustained = false) => (sustained ? t + dur > offset : t >= offset - 0.02);

  // ---------------- instruments

  function pad(t, dur, notes, gain = 0.05, cutoff = 1400, attack = 1.2, release = 1.6, wet = 0.6) {
    if (!live(t, dur + release, true)) return;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    f.Q.value = 0.6;
    f.connect(g);
    send(g, wet);
    const a = Math.max(T(t), ctx.currentTime);
    g.gain.setValueAtTime(0, a);
    g.gain.linearRampToValueAtTime(gain, Math.max(a + 0.01, T(t + attack)));
    g.gain.setValueAtTime(gain, Math.max(a + 0.02, T(t + dur)));
    g.gain.exponentialRampToValueAtTime(0.0001, Math.max(a + 0.03, T(t + dur + release)));
    for (const n of notes) {
      for (const det of [-7, 6]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = NOTE(n);
        o.detune.value = det;
        const og = ctx.createGain();
        og.gain.value = 0.5 / notes.length;
        o.connect(og).connect(f);
        o.start(a);
        o.stop(T(t + dur + release + 0.1));
        nodes.push(o);
      }
    }
    return f;
  }

  function sub(t, f0, f1, dur, gain = 0.5) {
    if (!live(t, dur)) return;
    const o = ctx.createOscillator();
    o.type = 'sine';
    const g = ctx.createGain();
    o.frequency.setValueAtTime(f0, T(t));
    o.frequency.exponentialRampToValueAtTime(f1, T(t + dur));
    g.gain.setValueAtTime(0.0001, T(t));
    g.gain.exponentialRampToValueAtTime(gain, T(t + 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, T(t + dur));
    o.connect(g);
    send(g, 0.15);
    o.start(T(t));
    o.stop(T(t + dur + 0.05));
    nodes.push(o);
  }

  function noiseHit(t, dur, { type = 'bandpass', f0 = 2000, f1 = 2000, q = 1, gain = 0.2, attack = 0.005, wet = 0.4, pan0 = 0, pan1 = 0 } = {}) {
    if (!live(t, dur)) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, T(t));
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), T(t + dur));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, T(t));
    g.gain.exponentialRampToValueAtTime(gain, T(t + attack));
    g.gain.exponentialRampToValueAtTime(0.0001, T(t + dur));
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    src.connect(f).connect(g);
    if (p) {
      p.pan.setValueAtTime(pan0, T(t));
      p.pan.linearRampToValueAtTime(pan1, T(t + dur));
      g.connect(p);
      send(p, wet);
    } else send(g, wet);
    src.start(T(t), (Math.sin(t * 91.7) * 0.5 + 0.5) * 0.5);
    src.stop(T(t + dur + 0.05));
    nodes.push(src);
  }

  function pluck(t, midi, gain = 0.12, decayT = 0.9, wet = 0.45, bright = 1) {
    if (!live(t, decayT)) return;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, T(t));
    g.gain.exponentialRampToValueAtTime(gain, T(t + 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, T(t + decayT));
    send(g, wet);
    const partials = [
      [1, 1, 'sine'],
      [2, 0.35 * bright, 'sine'],
      [3.01, 0.12 * bright, 'triangle'],
      [4.2, 0.05 * bright, 'sine'],
    ];
    for (const [m, a, type] of partials) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = NOTE(midi) * m;
      const og = ctx.createGain();
      og.gain.setValueAtTime(a, T(t));
      og.gain.exponentialRampToValueAtTime(0.0001, T(t + decayT / m));
      o.connect(og).connect(g);
      o.start(T(t));
      o.stop(T(t + decayT + 0.05));
      nodes.push(o);
    }
  }

  function kick(t, gain = 0.55) {
    sub(t, 150, 42, 0.32, gain);
    noiseHit(t, 0.04, { type: 'highpass', f0: 3000, f1: 3000, gain: gain * 0.15, wet: 0.05 });
  }

  function tick(t, gain = 0.25, freq = 1700) {
    if (!live(t, 0.2)) return;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, T(t));
    o.frequency.exponentialRampToValueAtTime(freq * 0.6, T(t + 0.08));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, T(t));
    g.gain.exponentialRampToValueAtTime(gain, T(t + 0.002));
    g.gain.exponentialRampToValueAtTime(0.0001, T(t + 0.12));
    o.connect(g);
    send(g, 0.3);
    o.start(T(t));
    o.stop(T(t + 0.15));
    nodes.push(o);
    noiseHit(t, 0.05, { type: 'bandpass', f0: 5000, f1: 4000, q: 2, gain: gain * 0.5, wet: 0.2 });
  }

  const whoosh = (t, dur = 0.6, gain = 0.16, up = true, pan = [-0.6, 0.6]) =>
    noiseHit(t, dur, { type: 'bandpass', f0: up ? 300 : 3500, f1: up ? 3800 : 260, q: 1.4, gain, attack: dur * 0.6, wet: 0.5, pan0: pan[0], pan1: pan[1] });
  const riser = (t, dur, gain = 0.14) => {
    noiseHit(t, dur, { type: 'bandpass', f0: 250, f1: 6000, q: 2.5, gain, attack: dur * 0.95, wet: 0.6 });
    if (!live(t, dur)) return;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(220, T(t));
    o.frequency.exponentialRampToValueAtTime(880, T(t + dur));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, T(t));
    g.gain.exponentialRampToValueAtTime(gain * 0.4, T(t + dur * 0.95));
    g.gain.exponentialRampToValueAtTime(0.0001, T(t + dur + 0.05));
    o.connect(g);
    send(g, 0.5);
    o.start(T(t));
    o.stop(T(t + dur + 0.1));
    nodes.push(o);
  };
  const impact = (t, gain = 0.7) => {
    sub(t, 120, 30, 1.6, gain);
    noiseHit(t, 1.4, { type: 'lowpass', f0: 6000, f1: 200, q: 0.7, gain: gain * 0.35, wet: 0.7 });
  };
  const sparkle = (t, base = 84, n = 7, step = 0.045, gain = 0.06) => {
    const scale = [0, 4, 7, 11, 12, 16, 19, 23, 24];
    for (let i = 0; i < n; i++) pluck(t + i * step, base + scale[i % scale.length], gain * (1 - i / (n * 1.4)), 0.7, 0.7, 0.5);
  };

  // ---------------- partition (ré majeur, ~120 bpm)

  // Plan A : nappe douce + tic-tac du compte à rebours
  pad(0, 2.4, [50, 57, 64, 66], 0.07, 1400, 0.9, 0.9);
  for (let i = 0; i < 6; i++) pluck(0.1 + i * 0.4, [74, 78, 81, 78, 74, 76][i], 0.075, 0.6, 0.5, 0.6);
  for (let t = 0.1; t < 2.4; t += 0.8) sub(t, 70, 45, 0.4, 0.18);
  TL.ticks.forEach((t, i) => tick(t, 0.22 + i * 0.05, 1500 + i * 120));
  // zéro : thunk + gel (glissando givré descendant)
  sub(TL.zero, 90, 40, 0.5, 0.45);
  noiseHit(TL.zero, 1.2, { type: 'bandpass', f0: 7000, f1: 900, q: 6, gain: 0.12, attack: 0.02, wet: 0.8 });
  for (let i = 0; i < 6; i++) pluck(TL.zero + 0.05 + i * 0.07, 96 - i * 3, 0.035, 0.8, 0.9, 0.3);
  pad(2.6, 1.9, [45, 52, 57, 60], 0.032, 600, 0.6, 0.7, 0.8);
  whoosh(TL.title1[0] - 0.1, 0.7, 0.08);
  // montée vers l'écran + impact lumineux
  riser(TL.push[0] + 0.7, TL.flash - TL.push[0] - 0.7, 0.16);
  impact(TL.flash, 0.65);
  sparkle(TL.flash + 0.02, 86, 8, 0.04, 0.07);

  // Plan B : nappe lumineuse + "pops" des calques
  pad(4.95, 4.2, [43, 50, 54, 59, 62], 0.075, 2400, 0.5, 1.2);
  for (let t = 5.5, i = 0; t < 8.9; t += 0.25, i++) pluck(t, [67, 71, 74, 79][i % 4], 0.03, 0.35, 0.4, 0.5);
  for (let t = 5.5; t < 8.9; t += 1.0) kick(t, 0.22);
  [0, 0.16, 0.32, 0.5, 0.62, 0.74, 0.92].forEach((d, i) => pluck(TL.emerge[0] + d, [79, 83, 86, 88, 90, 91, 95][i], 0.07, 0.5, 0.4, 0.8));
  whoosh(TL.title2[0] - 0.1, 0.6, 0.07);
  tick(TL.cta, 0.25, 2200);
  sub(TL.cta, 300, 120, 0.15, 0.2);
  whoosh(TL.toQuiz[0], 0.8, 0.14, true, [0.6, -0.4]);

  // Plan C : pulsation rythmique + bonnes réponses ascendantes
  const beat = 0.5;
  for (let t = 9.0; t < 16.0; t += beat) kick(t, 0.32);
  for (let t = 9.25; t < 16.0; t += beat) noiseHit(t, 0.06, { type: 'highpass', f0: 7000, f1: 7000, gain: 0.03, wet: 0.1 });
  pad(9.0, 3.3, [40, 47, 52, 55, 59], 0.06, 1800, 0.5, 0.8);
  pad(12.3, 3.6, [45, 52, 57, 61, 64], 0.062, 2100, 0.5, 0.8);
  const arp = [64, 67, 71, 74];
  for (let t = 9.0, i = 0; t < 15.9; t += 0.25, i++) pluck(t, arp[i % 4] + (t > 12.3 ? 5 : 0), 0.025, 0.35, 0.35, 0.5);
  TL.q.forEach((q, i) => {
    whoosh(q.in - 0.08, 0.55, 0.1, true, [i % 2 ? 0.5 : -0.5, 0]);
    tick(q.tap, 0.2, 2400);
    const base = [76, 79, 83][i];
    pluck(q.tap + 0.02, base, 0.14, 1.1, 0.5, 1);
    pluck(q.tap + 0.11, base + 4, 0.12, 1.1, 0.5, 1);
    pluck(q.tap + 0.2, base + 7, 0.1, 1.3, 0.55, 1);
    noiseHit(q.tap + 0.05, 0.6, { type: 'highpass', f0: 6000, f1: 9000, gain: 0.035, wet: 0.8 });
    if (q.out < 30) whoosh(q.out, 0.45, 0.07, false, [0, 0.6]);
  });
  // verrouillage de la réponse finale : clic métallique
  noiseHit(TL.lockIn[1], 0.09, { type: 'bandpass', f0: 3400, f1: 2600, q: 8, gain: 0.3, wet: 0.3 });
  sub(TL.lockIn[1], 220, 90, 0.12, 0.25);
  riser(TL.lockIn[1], TL.ringDone - TL.lockIn[1] + 0.05, 0.12);

  // Plan D : récompense spectaculaire
  impact(TL.burst, 0.8);
  pad(TL.burst, 4.0, [38, 45, 50, 54, 57, 62, 66], 0.06, 3200, 0.05, 1.8, 0.7);
  sparkle(TL.burst + 0.02, 86, 9, 0.035, 0.09);
  sparkle(TL.burst + 0.4, 91, 7, 0.05, 0.05);
  for (let i = 0; i < 18; i++) noiseHit(TL.burst + 0.1 + i * 0.09, 0.05, { type: 'highpass', f0: 8000, f1: 9000, gain: 0.03 * (1 - i / 18), wet: 0.6, pan0: Math.sin(i * 2.1) * 0.8, pan1: Math.sin(i * 2.1) * 0.8 });
  for (let t = TL.burst + 0.5; t < 20.0; t += beat) kick(t, 0.36);
  whoosh(TL.burstText[0] - 0.05, 0.4, 0.09);
  whoosh(TL.toPhone[0], 0.7, 0.12, false, [0, 0]);
  pluck(TL.toPhone[1], 88, 0.12, 1.4, 0.6, 1);
  pluck(TL.toPhone[1] + 0.08, 93, 0.09, 1.4, 0.6, 1);

  // Plan E : parent, calme et précis
  whoosh(TL.parentIn[0], 1.0, 0.13, true, [-0.8, 0.2]);
  pad(20.1, 5.0, [47, 54, 57, 62, 66], 0.075, 1900, 0.8, 1.2);
  for (let t = 20.5; t < 25.0; t += beat) kick(t, 0.24);
  for (let t = 20.75; t < 25.0; t += beat) noiseHit(t, 0.05, { type: 'highpass', f0: 7500, f1: 7500, gain: 0.025, wet: 0.15 });
  for (let t = 20.5, i = 0; t < 25.0; t += 0.25, i++) pluck(t, [66, 69, 73, 76][i % 4] + (t > 22.8 ? -2 : 0), 0.022, 0.4, 0.45, 0.4);
  [0, 0.15, 0.3, 0.45].forEach((d, i) => pluck(TL.parentIn[0] + 0.5 + d, [71, 74, 78, 81][i], 0.05, 0.5, 0.4, 0.5));
  TL.trails.forEach((t, i) => {
    noiseHit(t, TL.trailDur, { type: 'bandpass', f0: 600, f1: 5000, q: 4, gain: 0.06, attack: TL.trailDur * 0.8, wet: 0.5, pan0: -0.6, pan1: 0.6 });
    pluck(t + TL.trailDur, [83, 86, 90][i], 0.1, 1.0, 0.55, 0.9);
  });

  // Plan F : logo
  riser(TL.converge[0], TL.logoLock - TL.converge[0], 0.15);
  pad(25.2, 1.8, [43, 50, 55, 59], 0.06, 1200, 0.6, 0.8);
  impact(TL.logoLock, 0.75);
  pad(TL.logoLock, 2.4, [38, 50, 54, 57, 61, 64], 0.08, 2600, 0.04, 1.6, 0.75);
  sparkle(TL.logoLock + 0.02, 86, 9, 0.04, 0.08);
  noiseHit(TL.sweep[0], 1.2, { type: 'bandpass', f0: 2500, f1: 9000, q: 3, gain: 0.05, attack: 0.6, wet: 0.8, pan0: -0.7, pan1: 0.7 });
  pluck(TL.wordmark, 81, 0.07, 1.6, 0.7, 0.6);
  pluck(TL.tagline, 86, 0.05, 1.8, 0.75, 0.5);

  return {
    master,
    stop() {
      for (const n of nodes) {
        try {
          n.stop();
        } catch (e) {
          /* déjà arrêté */
        }
      }
      try {
        master.disconnect();
      } catch (e) {
        /* déjà déconnecté */
      }
    },
  };
}

/** Rendu hors-ligne de la bande-son complète -> WAV (base64) pour l'export vidéo. */
export async function renderSoundtrackWav(duration = 30, rate = 48000) {
  const ctx = new OfflineAudioContext(2, Math.ceil(duration * rate), rate);
  scheduleSoundtrack(ctx, ctx.destination, 0, 0);
  const buf = await ctx.startRendering();
  const n = buf.length;
  const out = new DataView(new ArrayBuffer(44 + n * 4));
  const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  out.setUint32(4, 36 + n * 4, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, 2, true);
  out.setUint32(24, rate, true);
  out.setUint32(28, rate * 4, true);
  out.setUint16(32, 4, true);
  out.setUint16(34, 16, true);
  w(36, 'data');
  out.setUint32(40, n * 4, true);
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  for (let i = 0; i < n; i++) {
    out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true);
    out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true);
  }
  const bytes = new Uint8Array(out.buffer);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
