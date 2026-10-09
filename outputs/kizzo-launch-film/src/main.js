// Entry point: assets, layout, playback, controls and export hooks.
import { DURATION, T, prog, clamp } from './timeline.js';
import { BRAND } from './palette.js';
import { surface, SCREEN_PT, PANEL_PT, CARD_PT, setMarkImages } from './ui.js';
import { buildType, stageBox } from './type.js';
import { buildLogo, sampleImage, logoToStage } from './logo.js';
import { createStage, buildLogoParticles } from './scene.js';
import { makeDirector } from './director.js';
import logoBlue from '../assets/logo-blue.png';
import logoOrange from '../assets/logo-orange.png';
import logoWord from '../assets/logo-wordmark.png';
import logoFull from '../assets/logo-full.png';

const RENDER_MODE = !!window.__KIZZO_RENDER__;
const stage = document.getElementById('stage');
const viewport = document.getElementById('viewport');

// ── fit the 1920×1080 stage into the window ───────────────────────────────
function fit() {
  const cs = getComputedStyle(viewport);
  const w = viewport.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const s = Math.min(w / 1920, viewport.clientHeight / 1080);
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
    document.fonts.load('800 100px Outfit'),
    document.fonts.load('700 30px Outfit'),
    document.fonts.load('600 16px Inter'),
    document.fonts.load('500 14px Inter'),
    document.fonts.load('700 11px Inter'),
  ]).catch(() => {});
  await document.fonts.ready;

  const [imBlue, imOrange, imWord] = await Promise.all([loadImg(logoBlue), loadImg(logoOrange), loadImg(logoWord)]);
  setMarkImages(imBlue, imOrange);

  // canvases that become textures
  const surfaces = {
    parent: surface(SCREEN_PT.w, SCREEN_PT.h, 2),
    kid: surface(SCREEN_PT.w, SCREEN_PT.h, 2.4),
    limit: surface(PANEL_PT.limit.w, PANEL_PT.limit.h, 2.2),
    week: surface(PANEL_PT.week.w, PANEL_PT.week.h, 2.2),
    quiz: surface(PANEL_PT.quiz.w, PANEL_PT.quiz.h, 2.2),
    card0: surface(CARD_PT.w + CARD_PT.pad * 2, CARD_PT.h + CARD_PT.pad * 2, 2.2),
    card1: surface(CARD_PT.w + CARD_PT.pad * 2, CARD_PT.h + CARD_PT.pad * 2, 2.2),
    card2: surface(CARD_PT.w + CARD_PT.pad * 2, CARD_PT.h + CARD_PT.pad * 2, 2.2),
  };

  const S = createStage(document.getElementById('gl'), surfaces, { preserve: RENDER_MODE });
  const ty = buildType(stage);
  const lg = buildLogo(stage, { blue: logoBlue, orange: logoOrange, word: logoWord, full: logoFull });

  // ── layout-dependent data (needs fonts + DOM) ───────────────────────────
  const layout = {
    dotScreen: stageBox(ty.s1.dot, stage),
    dotKizzo: stageBox(ty.m1.dot, stage),
  };

  // "MEET KIZZO" glyph pixels → particle sources
  const N_BLUE = 3600, N_WORD = 2800, N = N_BLUE + N_WORD;
  const txt = document.createElement('canvas');
  txt.width = 1920;
  txt.height = 1080;
  const tctx = txt.getContext('2d', { willReadFrequently: true });
  const cs = getComputedStyle(ty.m1.chars[0]);
  tctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  tctx.fillStyle = '#fff';
  const baseline = layout.dotKizzo.y + layout.dotKizzo.h;
  const boxes = ty.m1.chars.map((c) => stageBox(c, stage));
  ty.m1.chars.forEach((c, i) => tctx.fillText(c.textContent, boxes[i].x, baseline));
  const minX = boxes[0].x, maxX = boxes[boxes.length - 1].x + boxes[boxes.length - 1].w;
  const img = tctx.getImageData(0, 0, 1920, 1080).data;
  const pool = [];
  const y0 = Math.max(0, Math.floor(baseline - 200)), y1 = Math.min(1080, Math.ceil(baseline + 40));
  for (let y = y0; y < y1; y += 2) for (let x = Math.floor(minX) - 4; x < maxX + 4; x += 2) if (img[(y * 1920 + x) * 4 + 3] > 140) pool.push(x, y);
  const src = new Float32Array(N * 2);
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < N; i++) {
    const j = Math.floor(rnd() * (pool.length / 2));
    src[i * 2] = pool[j * 2] + rnd() * 2;
    src[i * 2 + 1] = pool[j * 2 + 1] + rnd() * 2;
  }
  const dstBlue = sampleImage(imBlue, N_BLUE, 3, logoToStage);
  const dstWord = sampleImage(imWord, N_WORD, 4, logoToStage);
  // pair sources and targets left→right so the flow reads as one gesture
  const order = (arr, n) => [...Array(n).keys()].sort((a, b) => arr[a * 2] - arr[b * 2]);
  const srcOrder = order(src, N);
  const dstAll = new Float32Array(N * 2);
  dstAll.set(dstBlue, 0);
  dstAll.set(dstWord, N_BLUE * 2);
  const dstOrder = order(dstAll, N);
  const pairedSrc = new Float32Array(N * 2), pairedDst = new Float32Array(N * 2), colors = [], delays = [];
  const cBlue = new S.THREE.Color(BRAND.blue), cWhite = new S.THREE.Color(BRAND.white);
  const span = maxX - minX;
  for (let i = 0; i < N; i++) {
    const a = srcOrder[i], b = dstOrder[i];
    pairedSrc[i * 2] = src[a * 2];
    pairedSrc[i * 2 + 1] = src[a * 2 + 1];
    pairedDst[i * 2] = dstAll[b * 2];
    pairedDst[i * 2 + 1] = dstAll[b * 2 + 1];
    colors.push(b < N_BLUE ? cBlue : cWhite);
    delays.push(((src[a * 2] - minX) / span) * 0.3 + rnd() * 0.05);
  }
  const particles = buildLogoParticles(pairedSrc, pairedDst, colors, delays);
  S.hud.scene.add(particles);
  layout.particles = particles;
  // each glyph fades exactly as its particles leave
  const glyphX = boxes.map((b) => (b.x + b.w / 2 - minX) / span);
  layout.letterHandOff = (i, t) => prog(t, T.dissolve + glyphX[i] * 0.3, 0.12);

  // film grain: one noise tile, re-positioned every frame (deterministic in t)
  const grain = document.getElementById('grain');
  const nz = document.createElement('canvas');
  nz.width = nz.height = 256;
  const nctx = nz.getContext('2d');
  const nd = nctx.createImageData(256, 256);
  for (let i = 0; i < nd.data.length; i += 4) {
    const v = (rnd() * 255) | 0;
    nd.data[i] = nd.data[i + 1] = nd.data[i + 2] = v;
    nd.data[i + 3] = 255;
  }
  nctx.putImageData(nd, 0, 0);
  grain.style.backgroundImage = `url(${nz.toDataURL()})`;

  const direct = makeDirector(S, surfaces, ty, lg, layout);
  const renderAt = (t) => {
    const f = Math.floor(t * 60);
    grain.style.backgroundPosition = `${(f * 97) % 256}px ${(f * 61) % 256}px`;
    direct(t);
  };
  renderAt(0);
  // warm up every shader and texture so playback never hitches
  for (const wt of [1.0, 2.4, 4.6, 6.8, 7.6, 10.2, 12.8, 14.2]) renderAt(wt);
  renderAt(0);

  window.__film = {
    duration: DURATION,
    seek: (t) => renderAt(clamp(t, 0, DURATION)),
    lowerQuality: () => S.composer.setPixelRatio(0.75),
  };
  document.body.classList.add('ready');
  if (RENDER_MODE) return;
  setupPlayback(renderAt);
}

// ── playback + controls ───────────────────────────────────────────────────
function setupPlayback(renderAt) {
  const ui = document.getElementById('controls');
  const btnPlay = document.getElementById('btn-play');
  const btnReplay = document.getElementById('btn-replay');
  const scrub = document.getElementById('scrub');
  const time = document.getElementById('time');
  const fill = document.getElementById('scrub-fill');

  let t = 0, playing = false, last = 0, raf = 0, hideTimer = 0;
  const loop = new URLSearchParams(location.search).has('loop');
  const fmt = (x) => `00:${x.toFixed(2).padStart(5, '0')}`;

  const paint = () => {
    renderAt(t);
    const k = t / DURATION;
    scrub.value = String(Math.round(k * 1500));
    fill.style.transform = `scaleX(${k})`;
    time.textContent = `${fmt(t)} / ${fmt(DURATION)}`;
    document.body.classList.toggle('ended', t >= DURATION && !playing);
  };
  // If the GPU can't hold ~45 fps, render the post chain at 75% and upscale.
  const samples = [];
  let degraded = false;
  const frame = (now) => {
    if (!playing) return;
    const dt = Math.min(0.25, (now - last) / 1000); // keep wall-clock sync, but no jump after a hidden tab
    last = now;
    if (!degraded && t > 0.5 && samples.length < 90) {
      samples.push(dt);
      if (samples.length === 90) {
        const med = [...samples].sort((a, b) => a - b)[45];
        if (med > 1 / 45) {
          degraded = true;
          window.__film.lowerQuality();
        }
      }
    }
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
    btnPlay.setAttribute('aria-label', p ? 'Pause' : 'Play');
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

  btnPlay.addEventListener('click', () => setPlaying(!playing));
  btnReplay.addEventListener('click', () => {
    t = 0;
    setPlaying(true);
  });
  scrub.addEventListener('input', () => {
    t = (Number(scrub.value) / 1500) * DURATION;
    if (playing) setPlaying(false);
    paint();
  });
  document.getElementById('viewport').addEventListener('click', (e) => {
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
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      t = clamp(t + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 1 / 60 : 0.5), 0, DURATION);
      setPlaying(false);
    }
  });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    t = DURATION;
    setPlaying(false);
  } else {
    // a beat of black before the first light
    setTimeout(() => setPlaying(true), 250);
  }
}

boot().catch((err) => {
  console.error(err);
  const e = document.getElementById('error');
  if (e) {
    e.hidden = false;
    e.textContent = 'This film needs WebGL 2. Try a recent Chrome, Edge, Safari or Firefox.';
  }
});
