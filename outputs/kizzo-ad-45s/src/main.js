// Entry point: assets, layout, playback, preview tools and export hooks.
import { DURATION, FPS, clamp } from './timeline.js';
import { POI } from './cues.js';
import { createStage } from './scene.js';
import { createClips } from './clips.js';
import { drawLesson, inkPoints } from './lesson.js';
import { makeCardCanvas, drawCard, makeRingCanvas, drawClock } from './graphics.js';
import { buildOverlay } from './overlay.js';
import { makeDirector } from './director.js';
import shotDashboard from '../assets/screens/tableau-de-bord.jpg';
import shotPhoto from '../assets/screens/photo-lecon.jpg';
import shotCamera from '../assets/screens/appareil-photo.jpg';
import shotReading from '../assets/screens/lecture.jpg';
import shotQuestions from '../assets/screens/questions.jpg';
import logoBlue from '../assets/logo/logo-blue.png';
import logoOrange from '../assets/logo/logo-orange.png';
import logoWord from '../assets/logo/logo-wordmark.png';

const RENDER_MODE = !!window.__KIZZO_RENDER__;
const stage = document.getElementById('stage');
const viewport = document.getElementById('viewport');

function fit() {
  const cs = getComputedStyle(viewport);
  const w = viewport.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const h = viewport.clientHeight - (RENDER_MODE ? 0 : 0);
  const s = Math.min(w / 1080, h / 1920);
  stage.style.transform = `translate(-50%, -50%) scale(${s})`;
}
new ResizeObserver(fit).observe(viewport);
fit();

const loadImg = (src) =>
  new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

async function boot() {
  await Promise.all([
    document.fonts.load('800 64px Outfit'),
    document.fonts.load('700 34px Outfit'),
    document.fonts.load('500 30px Outfit'),
    document.fonts.load('400 33px Kalam'),
    document.fonts.load('700 44px Kalam'),
  ]).catch(() => {});
  await document.fonts.ready;

  const names = ['tableau-de-bord', 'photo-lecon', 'appareil-photo', 'lecture', 'questions'];
  const imgs = await Promise.all([shotDashboard, shotPhoto, shotCamera, shotReading, shotQuestions].map(loadImg));
  const screens = Object.fromEntries(names.map((n, i) => [n, imgs[i]]));

  const lesson = drawLesson();
  const cardCanvases = [0, 1, 2].map((i) => {
    const c = makeCardCanvas();
    drawCard(c, i, 0);
    return c;
  });
  const assets = {
    screens,
    lesson,
    inkUV: inkPoints(lesson.canvas, 1500),
    cardCanvases,
    answerCanvas: makeCardCanvas(),
    ringCanvas: makeRingCanvas(),
    drawClock,
    poi: POI,
  };
  drawClock(assets.ringCanvas, 0, 0);

  const S = createStage(document.getElementById('gl'), assets, { preserve: RENDER_MODE });
  const clips = createClips({ renderMode: RENDER_MODE });
  const o = buildOverlay(stage, { blue: logoBlue, orange: logoOrange, word: logoWord });

  // film grain (deterministic per frame)
  const grain = document.getElementById('grain');
  const nz = document.createElement('canvas');
  nz.width = nz.height = 256;
  const nctx = nz.getContext('2d');
  const nd = nctx.createImageData(256, 256);
  let seed = 99;
  for (let i = 0; i < nd.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const v = seed >>> 24;
    nd.data[i] = nd.data[i + 1] = nd.data[i + 2] = v;
    nd.data[i + 3] = 255;
  }
  nctx.putImageData(nd, 0, 0);
  grain.style.backgroundImage = `url(${nz.toDataURL()})`;

  const direct = makeDirector(S, clips, o, assets);
  const renderAt = (t, opts) => {
    const f = Math.floor(t * FPS);
    grain.style.backgroundPosition = `${(f * 97) % 256}px ${(f * 61) % 256}px`;
    return direct(clamp(t, 0, DURATION), opts);
  };
  for (const wt of [0.5, 7, 10.5, 15, 17.5, 20.8, 21.9, 24.9, 29, 32.3, 41]) await renderAt(wt);
  await renderAt(0);

  window.__film = {
    duration: DURATION,
    fps: FPS,
    seek: (t) => renderAt(t),
    shots: () => Object.fromEntries(Object.entries(clips.shots).map(([k, s]) => [k, s.ok])),
  };
  document.body.classList.add('ready');
  if (RENDER_MODE) return;
  setupPlayback(renderAt);
}

function setupPlayback(renderAt) {
  const ui = document.getElementById('controls');
  const btnPlay = document.getElementById('btn-play');
  const btnReplay = document.getElementById('btn-replay');
  const btnGuides = document.getElementById('btn-guides');
  const scrub = document.getElementById('scrub');
  const time = document.getElementById('time');
  const fill = document.getElementById('scrub-fill');

  let t = 0, playing = false, last = 0, raf = 0, hideTimer = 0;
  const loop = new URLSearchParams(location.search).has('loop');
  const fmt = (x) => `00:${String(Math.floor(x)).padStart(2, '0')}`;

  const paint = () => {
    renderAt(t, { playing });
    const k = t / DURATION;
    scrub.value = String(Math.round(k * 4500));
    fill.style.transform = `scaleX(${k})`;
    time.textContent = `${fmt(t)} / ${fmt(DURATION)}`;
    document.body.classList.toggle('ended', t >= DURATION && !playing);
  };
  const frame = (now) => {
    if (!playing) return;
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    t += dt;
    if (t >= DURATION) {
      if (loop) t = 0;
      else {
        t = DURATION;
        setPlaying(false);
      }
    }
    paint();
    if (playing) raf = requestAnimationFrame(frame);
  };
  const setPlaying = (p) => {
    playing = p;
    document.body.classList.toggle('playing', p);
    btnPlay.setAttribute('aria-label', p ? 'Pause' : 'Lecture');
    btnPlay.dataset.state = p ? 'pause' : 'play';
    cancelAnimationFrame(raf);
    if (p) {
      if (t >= DURATION) t = 0;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    paint();
    poke();
  };
  const poke = () => {
    ui.classList.add('show');
    clearTimeout(hideTimer);
    if (playing) hideTimer = setTimeout(() => ui.classList.remove('show'), 1800);
  };
  const seek = (x) => {
    t = clamp(x, 0, DURATION);
    paint();
  };

  btnPlay.addEventListener('click', () => setPlaying(!playing));
  btnReplay.addEventListener('click', () => {
    t = 0;
    setPlaying(true);
  });
  btnGuides.addEventListener('click', () => {
    const on = document.body.classList.toggle('guides');
    btnGuides.setAttribute('aria-pressed', String(on));
  });
  ui.querySelectorAll('.chapters button').forEach((b) =>
    b.addEventListener('click', () => {
      seek(Number(b.dataset.t));
      if (!playing) setPlaying(true);
    })
  );
  scrub.addEventListener('input', () => {
    if (playing) setPlaying(false);
    seek((Number(scrub.value) / 4500) * DURATION);
  });
  viewport.addEventListener('click', (e) => {
    if (e.target.closest('#controls')) return;
    setPlaying(!playing);
  });
  window.addEventListener('pointermove', poke, { passive: true });
  window.addEventListener('keydown', (e) => {
    if (e.target === scrub && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
    if (e.code === 'Space' || e.key === 'k') {
      e.preventDefault();
      setPlaying(!playing);
    } else if (e.key === 'r' || e.key === 'Home') {
      t = 0;
      setPlaying(true);
    } else if (e.key === 'g') {
      btnGuides.click();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      if (playing) setPlaying(false);
      seek(t + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 1 / FPS : 0.5));
    }
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    t = DURATION;
    setPlaying(false);
  } else setTimeout(() => setPlaying(true), 250);
}

boot().catch((err) => {
  console.error(err);
});
