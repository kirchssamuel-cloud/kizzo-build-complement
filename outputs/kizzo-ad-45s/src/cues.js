// Cue sheet for the 45 s ad (seconds). One place to retime everything.
export const T = {
  // 1 · hook
  t1: [0.35, 5.1],
  cut12: 3.1,
  ramp: [5.2, 6.3],
  // 2 · discovery
  strokes: 5.45,
  reveal3: 5.95,
  t2: [6.85, 8.85],
  blur3: 8.6,
  logo: [8.95, 10.35],
  phoneIn: [9.55, 10.75],
  screenOn: 10.3,
  // 3 · photo of the lesson
  tapCreate: 11.75,
  wipeB: 11.95,
  t3: [12.25, 18.1],
  tapCamera: 13.25,
  wipeC: 13.42,
  table: [13.35, 14.75],
  underline: 14.55,
  scan: [14.75, 16.7],
  lift: [16.25, 19.4],
  // 4 · the lesson becomes a quiz
  wipeD: 18.85,
  t4: [19.25, 21.45],
  wipeE: 20.3,
  cards: 21.35,
  toC4: 22.55,
  tapC4: 24.85,
  t4b: [25.25, 26.85],
  // 5 · the right rhythm
  toPhone5: 26.85,
  t5: [27.75, 31.25],
  ring: [27.55, 31.85],
  toC5: 31.75,
  // 6 · family benefit
  t6: [33.75, 38.3],
  // 7 · signature
  outro: 38.65,
  logoEnd: 39.55,
  tagline: 40.55,
  cta: 41.25,
};

// Character shots (generated 3D animation). `map` turns the master clock
// into the clip's own time; `hold` keeps the last frame after the clip ends.
export const SHOTS = {
  c1: {
    label: 'C1 · Ben réclame la tablette',
    job: '5040defb-d789-4e9a-a377-d894e0b316b2',
    from: 0,
    to: 3.25,
    map: (t) => t + 0.6,
  },
  c2: {
    label: 'C2 · Ben boude, Léa soupire',
    job: 'd7d65e85-35c9-47e0-8085-2b63ca5eaf60',
    from: 3.0,
    to: 7.2,
    // real time until the comic beat, then a soft slow-motion ramp
    map: (t) => {
      const a = 3.1, r0 = 5.2, r1 = 6.3;
      if (t < r0) return 0.35 + (t - a);
      const u = Math.min(t, r1) - r0;
      const slow = u - (u * u) / (2 * (r1 - r0)) * 0.7;
      return 0.35 + (r0 - a) + slow + Math.max(0, t - r1) * 0.3;
    },
  },
  c3: {
    label: 'C3 · Léa découvre Kizzo',
    job: '98428371-1b9c-422d-a441-3cf13f239a19',
    from: 5.9,
    to: 13.6,
    map: (t) => Math.min(4.9, (t - 5.95) * 0.9),
  },
  c4: {
    label: 'C4 · Ben révise sur la tablette',
    job: '946922e5-acc3-49aa-b0d2-5acef723e9dd',
    from: 22.4,
    to: 27.8,
    // his finger meets the tablet at 3.15 s in the clip: lands on T.tapC4
    map: (t) => Math.min(4.95, Math.max(0, t - 22.55 + 0.85)),
  },
  c5: {
    label: 'C5 · Ben montre son quiz à Léa',
    job: '4d220371-ee95-4063-87f1-7924a29b4837',
    from: 31.7,
    to: 40.2,
    map: (t) => Math.min(5.95, Math.max(0, t - 32.0)),
  },
};

// Points of interest inside the character shots, in stage pixels (1080×1920).
// Tune once the clips are in: they anchor graphics to the action.
export const POI = {
  tablet: [905, 585],    // c2: Léa's tablet, where the strokes are born
  family: [540, 1060],   // c5: centre of the orbiting ribbons (checked on the clip)
};
