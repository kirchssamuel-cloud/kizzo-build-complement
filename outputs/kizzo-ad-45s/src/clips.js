// Character shots. Playback streams assets/clips/<id>.mp4 through a
// VideoTexture; frame-accurate export reads the 30 fps JPEG frames extracted
// by tools/fetch_clips.mjs. A shot that is not on disk yet shows a labelled
// slate, never a stand-in picture.
import * as THREE from 'three';
import { SHOTS } from './cues.js';
import { drawSlate } from './graphics.js';

const fmt = (s) => `0:${String(Math.floor(s)).padStart(2, '0')}`;

export function createClips({ renderMode }) {
  const shots = {};
  for (const [id, s] of Object.entries(SHOTS)) {
    const slateTex = new THREE.CanvasTexture(drawSlate(s.label, `${fmt(s.from)} – ${fmt(s.to)}`));
    slateTex.colorSpace = THREE.SRGBColorSpace;
    const shot = { id, ...s, slate: slateTex, ok: null, tex: slateTex };
    if (renderMode) {
      shot.frames = new Map();
      shot.imgTex = new THREE.Texture();
      shot.imgTex.colorSpace = THREE.SRGBColorSpace;
      shot.imgTex.generateMipmaps = false;
      shot.imgTex.minFilter = THREE.LinearFilter;
      shot.lastFrame = -1;
    } else {
      const v = document.createElement('video');
      v.muted = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.crossOrigin = 'anonymous';
      v.src = `assets/clips/${id}.mp4`;
      v.addEventListener('loadeddata', () => {
        shot.ok = true;
        shot.tex = shot.videoTex;
      });
      v.addEventListener('error', () => (shot.ok = false));
      shot.video = v;
      shot.videoTex = new THREE.VideoTexture(v);
      shot.videoTex.colorSpace = THREE.SRGBColorSpace;
    }
    shots[id] = shot;
  }

  const loadFrame = (shot, f) =>
    new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = `assets/clips/${shot.id}/${String(f + 1).padStart(4, '0')}.jpg`;
    });

  return {
    shots,
    // Render mode: make sure the right frame of every active shot is decoded.
    async prepare(t, active) {
      if (!renderMode) return;
      await Promise.all(
        active.map(async (id) => {
          const s = shots[id];
          if (s.ok === false) return;
          const f = Math.max(0, Math.round(s.map(t) * 30));
          if (f === s.lastFrame) return;
          let img = await loadFrame(s, f);
          if (!img && f > 0) img = await loadFrame(s, f - 1); // past the end: hold
          if (!img && s.ok === null) {
            const first = await loadFrame(s, 0);
            if (!first) {
              s.ok = false;
              return;
            }
          }
          if (img) {
            s.ok = true;
            s.imgTex.image = img;
            s.imgTex.needsUpdate = true;
            s.tex = s.imgTex;
            s.lastFrame = f;
          }
        })
      );
    },
    // Playback: keep each active <video> close to the clock.
    sync(t, active, playing) {
      if (renderMode) return;
      for (const s of Object.values(shots)) {
        const v = s.video;
        if (!v || s.ok === false) continue;
        if (!active.includes(s.id)) {
          if (!v.paused) v.pause();
          continue;
        }
        const want = Math.max(0, Math.min(s.map(t), (v.duration || 99) - 0.04));
        const rate = Math.abs(s.map(t + 0.1) - s.map(t)) / 0.1;
        if (playing && rate > 0.05) {
          v.playbackRate = Math.max(0.25, Math.min(2, rate));
          if (Math.abs(v.currentTime - want) > 0.2) v.currentTime = want;
          if (v.paused) v.play().catch(() => {});
        } else {
          if (!v.paused) v.pause();
          if (Math.abs(v.currentTime - want) > 0.03) v.currentTime = want;
        }
      }
    },
    texture: (id) => shots[id].tex,
  };
}
