// Moteur audio commun : bus maître (compression + réverbe), instruments synthétisés
// (nappes, impacts, risers, plucks, clics) et rendu hors-ligne en WAV pour l'export.

export const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI -> Hz

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
 * Crée le mixeur et les instruments d'une partition.
 * @param {BaseAudioContext} ctx
 * @param {AudioNode} out destination
 * @param {number} t0 temps contexte correspondant à `offset`
 * @param {number} offset position (s) dans la vidéo à partir de laquelle jouer
 */
export function createMixer(ctx, out, t0, offset = 0) {
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

  // remappage optionnel des temps de la partition (ex. insertion d'une scène)
  let map = (t) => t;
  const M = (t) => map(t);
  const T = (t) => t0 + (t - offset); // temps vidéo -> temps contexte
  // les nappes déjà commencées reprennent ; les sons ponctuels passés sont ignorés (scrub)
  const live = (t, dur, sustained = false) => (sustained ? t + dur > offset : t >= offset - 0.02);

  // ---------------- instruments

  function pad(t, dur, notes, gain = 0.05, cutoff = 1400, attack = 1.2, release = 1.6, wet = 0.6) {
    t = M(t);
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
    t = M(t);
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
    t = M(t);
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
    t = M(t);
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
    t = M(t);
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
    t = M(t);
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


  /** Échantillon (voix off) : reprend au bon endroit si la lecture démarre en cours de phrase. */
  function sample(t, buffer, { gain = 1, wet = 0.08 } = {}) {
    t = M(t);
    if (!buffer || !live(t, buffer.duration, true)) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    send(g, wet);
    const skip = Math.max(0, offset - t);
    src.start(Math.max(T(t), ctx.currentTime), skip);
    nodes.push(src);
  }

  return {
    pad,
    sub,
    sample,
    noiseHit,
    pluck,
    kick,
    tick,
    whoosh,
    riser,
    impact,
    sparkle,
    setMap(fn) {
      map = fn || ((t) => t);
    },
    handle: {
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
    },
  };
}

/** Rendu hors-ligne d'une partition complète -> WAV (base64) pour l'export vidéo. */
export async function renderWav(schedule, duration, rate = 48000) {
  const ctx = new OfflineAudioContext(2, Math.ceil(duration * rate), rate);
  schedule(ctx, ctx.destination, 0, 0);
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
