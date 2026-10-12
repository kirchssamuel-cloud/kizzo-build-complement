// Lecteur 2D (Canvas) : même interface que player.js (écran d'accueil, commandes, son, API
// d'export) pour les films entièrement dessinés en 2D. Toute image est une fonction pure de t ;
// en export, n sous-images sont moyennées (flou de bougé) dans un canvas d'accumulation.
export function bootPlayer2D(film) {
  const { params: PARAMS, duration: DURATION, width: WIDTH, height: HEIGHT, render, scheduleSoundtrack, renderSoundtrackWav } = film;
  const ASPECT = WIDTH / HEIGHT;
  const exportH = parseInt(new URLSearchParams(location.search).get('h') || '', 10) || HEIGHT;

  const $ = (s) => document.querySelector(s);
  const stage = $('#stage');
  const canvas = $('#gl');
  const ui = { start: $('#start'), play: $('#btn-play'), replay: $('#btn-replay'), mute: $('#btn-mute'), full: $('#btn-full'), bar: $('#bar'), fill: $('#bar-fill'), time: $('#time'), controls: $('#controls'), loader: $('#loader') };

  if (PARAMS.exportMode) document.documentElement.classList.add('export');
  document.documentElement.lang = PARAMS.lang;
  const startBtn = $('#btn-start-play');
  if (startBtn) startBtn.lastChild.textContent = ' ' + film.start.cta;
  const startSub = $('.start-sub');
  if (startSub) startSub.textContent = film.start.sub;
  const startMeta = $('.start-meta');
  if (startMeta) startMeta.textContent = `${Math.round(DURATION)} s · ${WIDTH} × ${HEIGHT} · 60 fps`;
  const loader = $('#loader');
  if (loader) loader.textContent = 'Chargement…';

  // ---------------------------------------------------------------------------
  // Rendu : le film dessine en coordonnées natives (WIDTH × HEIGHT), mises à l'échelle du tampon.
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: false });
  let bufW = 0, bufH = 0;
  // canvas de travail à la résolution du tampon ; accumulation pour le flou de bougé
  const work = document.createElement('canvas');
  const wctx = work.getContext('2d', { alpha: false, willReadFrequently: false });
  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    let h = vh, w = h * ASPECT;
    if (w > vw) (w = vw), (h = w / ASPECT);
    if (PARAMS.exportMode) (h = exportH), (w = Math.round(h * ASPECT));
    stage.style.width = w + 'px';
    stage.style.height = h + 'px';
    stage.style.setProperty('--u', w / 100 + 'px');
    let th, tw;
    if (PARAMS.exportMode) (th = exportH), (tw = Math.round(th * ASPECT));
    else {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      th = Math.min(HEIGHT, Math.round(h * dpr));
      tw = Math.round(th * ASPECT);
    }
    if (tw === bufW && th === bufH) return;
    bufW = tw;
    bufH = th;
    canvas.width = work.width = tw;
    canvas.height = work.height = th;
  }
  window.addEventListener('resize', layout);

  function drawFrame(c, t) {
    c.setTransform(bufW / WIDTH, 0, 0, bufH / HEIGHT, 0, 0);
    render(c, t, WIDTH, HEIGHT);
    c.setTransform(1, 0, 0, 1, 0, 0);
  }

  let lastT = -1;
  function renderAt(t) {
    t = Math.min(DURATION, Math.max(0, t));
    const n = PARAMS.exportMode && film.subframes ? film.subframes(t) : 1;
    if (n > 1) {
      const shutter = film.shutter ?? 0.75 / 60;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (let k = 0; k < n; k++) {
        const tk = Math.min(DURATION, Math.max(0, t + (k / (n - 1) - 0.5) * shutter));
        drawFrame(wctx, tk);
        ctx.globalAlpha = 1 / (k + 1);
        ctx.drawImage(work, 0, 0);
      }
      ctx.globalAlpha = 1;
    } else drawFrame(ctx, t);
    lastT = t;
    ui.fill.style.transform = `scaleX(${t / DURATION})`;
    const s = Math.floor(t);
    ui.time.textContent = `00:${String(s).padStart(2, '0')} / 00:${String(Math.round(DURATION)).padStart(2, '0')}`;
  }

  // ---------------------------------------------------------------------------
  // Lecture
  const player = { playing: false, muted: false, offset: PARAMS.start, t0: 0, actx: null, track: null, audioStart: 0 };
  const clockNow = () => (player.actx && !player.muted ? player.offset + (player.actx.currentTime - player.audioStart) : player.offset + (performance.now() - player.t0) / 1000);
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
    const was = player.playing;
    if (was) pause();
    player.offset = Math.max(0, Math.min(DURATION, t));
    renderAt(player.offset);
    if (was) play(player.offset);
  }
  function loop() {
    requestAnimationFrame(loop);
    if (!player.playing) return;
    let t = clockNow();
    if (t >= DURATION) {
      if (PARAMS.loop) return play(0);
      renderAt(DURATION);
      player.playing = false;
      player.offset = DURATION;
      stopAudio();
      stage.classList.remove('playing');
      stage.classList.add('ended');
      return;
    }
    renderAt(t);
  }

  function bindUI() {
    ui.start.addEventListener('click', () => {
      ui.start.hidden = true;
      play(player.offset >= DURATION ? 0 : player.offset);
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
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    });
    const scrub = (e) => {
      const r = ui.bar.getBoundingClientRect();
      seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * DURATION);
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

  async function boot() {
    layout();
    await Promise.all(
      ['500 20px Outfit', '600 20px Outfit', '700 20px Outfit', '800 20px Outfit', '500 20px "Plus Jakarta Sans"', '600 20px "Plus Jakarta Sans"', '700 20px "Plus Jakarta Sans"', '800 20px "Plus Jakarta Sans"', '700 20px "Space Grotesk"'].map((f) => document.fonts.load(f).catch(() => null))
    );
    await document.fonts.ready;
    if (film.preload) await film.preload();
    for (const t of film.warm || []) renderAt(t);
    renderAt(PARAMS.exportMode || PARAMS.start > 0 ? PARAMS.start : film.preview);
    ui.loader.hidden = true;
    stage.classList.add('ready');
    window.KIZZO = {
      duration: DURATION,
      fps: 60,
      width: WIDTH,
      height: HEIGHT,
      renderAt: (t) => (renderAt(t), true),
      renderAudioWav: () => renderSoundtrackWav(DURATION),
      info: () => ({ w: bufW, h: bufH }),
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
    ui.loader.textContent = 'Erreur : ' + e.message;
  });
}
