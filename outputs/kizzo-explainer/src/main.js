// Point d'entrée : rendu, lecteur (play/pause/scrub/son), qualité adaptative, API d'export.
import * as THREE from 'three';
import { PARAMS, DURATION, WIDTH, HEIGHT, T } from './config.js';
import { createStory } from './story.js';
import { createPipeline } from './post.js';
import { createTitles } from './titles.js';
import { scheduleSoundtrack, renderSoundtrackWav } from './audio.js';
import { fxShared } from './materials.js';
import { CanvasTex } from './ui-canvas.js';

const $ = (s) => document.querySelector(s);
const stage = $('#stage');
const canvas = $('#gl');
const ui = {
  start: $('#start'),
  play: $('#btn-play'),
  replay: $('#btn-replay'),
  mute: $('#btn-mute'),
  full: $('#btn-full'),
  bar: $('#bar'),
  fill: $('#bar-fill'),
  time: $('#time'),
  controls: $('#controls'),
  loader: $('#loader'),
};

if (PARAMS.exportMode) document.documentElement.classList.add('export');
document.documentElement.lang = PARAMS.lang;
// textes de l'écran d'accueil selon la langue
const startBtn = document.querySelector('#btn-start-play');
if (startBtn) startBtn.lastChild.textContent = ' ' + T.start.cta;
const startSub = document.querySelector('.start-sub');
if (startSub) startSub.textContent = T.start.sub;
const startMeta = document.querySelector('.start-meta');
if (startMeta) startMeta.textContent = `${Math.round(DURATION)} s · 1080 × 1920 · 60 fps`;

// ---------------------------------------------------------------------------
// Rendu

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: false,
  stencil: false,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: PARAMS.exportMode,
});
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.setClearColor('#05080F', 1);

const quality = PARAMS.quality === 'auto' ? 'high' : PARAMS.quality;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, WIDTH / HEIGHT, 0.05, 120);
const story = createStory(renderer, scene, camera);
const pipeline = createPipeline(renderer, scene, camera, { quality });
const titles = createTitles($('#titles'));

// ---------------------------------------------------------------------------
// Taille & qualité adaptative (vise 60 fps)

let scale = quality === 'low' ? 0.6 : quality === 'medium' ? 0.8 : 1;
let bufW = 0, bufH = 0;
function layout() {
  const vw = window.innerWidth, vh = window.innerHeight;
  let h = vh, w = (h * 9) / 16;
  if (w > vw) {
    w = vw;
    h = (w * 16) / 9;
  }
  if (PARAMS.exportMode) {
    h = PARAMS.exportH;
    w = Math.round((h * 9) / 16);
  }
  stage.style.width = w + 'px';
  stage.style.height = h + 'px';
  stage.style.setProperty('--u', w / 100 + 'px');
  resizeBuffer(w, h);
}
function resizeBuffer(cssW, cssH) {
  let tw, th;
  if (PARAMS.exportMode) {
    th = PARAMS.exportH;
    tw = Math.round((th * 9) / 16);
  } else {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    th = Math.min(HEIGHT, Math.round(cssH * dpr * scale));
    tw = Math.round((th * 9) / 16);
  }
  if (tw === bufW && th === bufH) return;
  bufW = tw;
  bufH = th;
  renderer.setSize(tw, th, false);
  pipeline.setSize(tw, th);
  fxShared.uRes.value.set(tw, th);
  const px = th / 1920;
  scene.traverse((o) => {
    const u = o.material?.uniforms;
    if (u?.uPx) u.uPx.value = px * 1.6;
  });
}
window.addEventListener('resize', layout);

// ---------------------------------------------------------------------------
// Rendu d'une image à l'instant t (pur, déterministe)

let lastT = -1;
function renderAt(t) {
  t = Math.min(DURATION, Math.max(0, t));
  const { post, anchors } = story.update(t);
  // en export, grain plus fin : la vidéo compressée reste nette sans artefacts
  if (PARAMS.exportMode) post.grain *= 0.55;
  pipeline.render(post);
  titles.update(t, anchors);
  lastT = t;
  ui.fill.style.transform = `scaleX(${t / DURATION})`;
  const s = Math.floor(t);
  ui.time.textContent = `00:${String(s).padStart(2, '0')} / 00:${String(Math.round(DURATION)).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Lecteur

const player = {
  playing: false,
  muted: false,
  offset: PARAMS.start,
  t0: 0,
  actx: null,
  track: null,
  audioStart: 0,
};

function clockNow() {
  if (player.actx && !player.muted) return player.offset + (player.actx.currentTime - player.audioStart);
  return player.offset + (performance.now() - player.t0) / 1000;
}

function startAudio(from) {
  stopAudio();
  if (player.muted) return;
  if (!player.actx) player.actx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
  const a = player.actx;
  if (a.state === 'suspended') a.resume();
  player.audioStart = a.currentTime + 0.06;
  player.track = scheduleSoundtrack(a, a.destination, player.audioStart, from);
}
function stopAudio() {
  if (player.track) player.track.stop();
  player.track = null;
}

function play(from = player.offset) {
  if (from >= DURATION - 0.01) from = 0;
  player.offset = from;
  player.t0 = performance.now();
  player.playing = true;
  startAudio(from);
  stage.classList.add('playing');
  stage.classList.remove('ended');
}
function pause() {
  if (!player.playing) return;
  player.offset = clockNow();
  player.playing = false;
  stopAudio();
  stage.classList.remove('playing');
}
function seek(t) {
  const wasPlaying = player.playing;
  if (wasPlaying) pause();
  player.offset = Math.max(0, Math.min(DURATION, t));
  renderAt(player.offset);
  if (wasPlaying) play(player.offset);
}

let frames = 0, acc = 0, lastNow = performance.now(), cool = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = now - lastNow;
  lastNow = now;
  if (!player.playing) return;
  let t = clockNow();
  if (t >= DURATION) {
    if (PARAMS.loop) {
      play(0);
      t = 0;
    } else {
      renderAt(DURATION);
      player.playing = false;
      player.offset = DURATION;
      stopAudio();
      stage.classList.remove('playing');
      stage.classList.add('ended');
      return;
    }
  }
  renderAt(t);
  // qualité adaptative (hystérésis)
  if (PARAMS.quality === 'auto' && dt < 250) {
    acc += dt;
    frames++;
    cool -= dt;
    if (frames >= 40) {
      const avg = acc / frames;
      if (avg > 19.5 && scale > 0.5 && cool <= 0) {
        scale = Math.max(0.5, scale * 0.85);
        resizeBuffer(parseFloat(stage.style.width), parseFloat(stage.style.height));
        cool = 1500;
      } else if (avg < 13 && scale < 1 && cool <= 0) {
        scale = Math.min(1, scale * 1.1);
        resizeBuffer(parseFloat(stage.style.width), parseFloat(stage.style.height));
        cool = 3000;
      }
      frames = 0;
      acc = 0;
    }
  }
}

// ---------------------------------------------------------------------------
// Contrôles

function bindUI() {
  ui.start.addEventListener('click', () => {
    ui.start.hidden = true;
    play(player.offset >= DURATION ? 0 : player.offset);
  });
  ui.bar.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') e.stopPropagation();
    if (e.key === 'ArrowRight') seek((player.playing ? clockNow() : player.offset) + 1);
    if (e.key === 'ArrowLeft') seek((player.playing ? clockNow() : player.offset) - 1);
  });
  ui.play.addEventListener('click', () => (player.playing ? pause() : play(player.offset)));
  ui.replay.addEventListener('click', () => {
    ui.start.hidden = true;
    play(0);
  });
  ui.mute.addEventListener('click', () => {
    const t = player.playing ? clockNow() : player.offset;
    player.muted = !player.muted;
    stage.classList.toggle('muted', player.muted);
    if (player.playing) {
      player.offset = t;
      player.t0 = performance.now();
      startAudio(t);
    }
  });
  ui.full.addEventListener('click', () => {
    const el = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.().catch(() => {});
  });
  const scrub = (e) => {
    const r = ui.bar.getBoundingClientRect();
    const k = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    seek(k * DURATION);
  };
  let dragging = false;
  ui.bar.addEventListener('pointerdown', (e) => {
    dragging = true;
    ui.bar.setPointerCapture(e.pointerId);
    ui.start.hidden = true;
    scrub(e);
  });
  ui.bar.addEventListener('pointermove', (e) => dragging && scrub(e));
  ui.bar.addEventListener('pointerup', () => (dragging = false));
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      ui.start.hidden = true;
      player.playing ? pause() : play(player.offset);
    } else if (e.key === 'r' || e.key === 'R') {
      ui.start.hidden = true;
      play(0);
    } else if (e.key === 'm' || e.key === 'M') ui.mute.click();
    else if (e.key === 'ArrowRight') seek((player.playing ? clockNow() : player.offset) + 1);
    else if (e.key === 'ArrowLeft') seek((player.playing ? clockNow() : player.offset) - 1);
  });
  let idle;
  stage.addEventListener('pointermove', () => {
    stage.classList.add('show-ui');
    clearTimeout(idle);
    idle = setTimeout(() => stage.classList.remove('show-ui'), 1800);
  });
}

// ---------------------------------------------------------------------------
// Démarrage : polices, précompilation des shaders, préchauffage des textures

async function boot() {
  layout();
  await Promise.all(
    ['500 20px Outfit', '600 20px Outfit', '700 20px Outfit', '800 20px Outfit', '500 20px "Plus Jakarta Sans"', '600 20px "Plus Jakarta Sans"', '700 20px "Plus Jakarta Sans"', '800 20px "Plus Jakarta Sans"', '700 20px "Space Grotesk"', '600 20px Caveat', '700 20px Caveat'].map((f) =>
      document.fonts.load(f).catch(() => null)
    )
  );
  await document.fonts.ready;
  CanvasTex.redrawAll();
  // les textures UI sont dessinées après le chargement des polices
  const warm = [0.4, 3.3, 5.6, 7.0, 7.6, 8.2, 9.3, 10.6, 12.3, 14.1, 17.0, 19.2, 21.7, 23.1, 25.4, 29.1, 30.7, 32.8, 35.0];
  story.update(0);
  story.showAll(true);
  renderer.compile(scene, camera);
  for (const t of warm) renderAt(t);
  // image d'aperçu derrière l'écran d'accueil (la lecture repart bien de PARAMS.start)
  renderAt(PARAMS.exportMode || PARAMS.start > 0 ? PARAMS.start : 7.4);
  ui.loader.hidden = true;
  stage.classList.add('ready');

  window.KIZZO = {
    duration: DURATION,
    fps: 60,
    renderAt: (t) => {
      renderAt(t);
      return true;
    },
    renderAudioWav: () => renderSoundtrackWav(DURATION),
    info: () => ({ w: bufW, h: bufH, renderer: renderer.info.render, programs: renderer.info.programs?.length }),
  };
  document.documentElement.dataset.ready = '1';

  if (PARAMS.exportMode) return;
  bindUI();
  if (PARAMS.start > 0) ui.start.hidden = false;
  if (PARAMS.autoplay) {
    ui.start.hidden = true;
    player.muted = true;
    stage.classList.add('muted');
    play(PARAMS.start);
  }
  requestAnimationFrame(loop);
}

boot().catch((e) => {
  console.error(e);
  ui.loader.textContent = 'WebGL indisponible : ' + e.message;
});
