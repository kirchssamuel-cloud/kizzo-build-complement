// Pub « 23:47 » : l'image est composée en 2D (frames.js) puis passe par la même
// post-production que les films 3D (grain, vignette, aberration, flashs) pour les coupes.
import * as THREE from 'three';
import { CanvasTex } from '../ui-canvas.js';
import { drawFrame, FW, FH } from './frames.js';
import { S, T, K, OUT } from './config.js';
import { clamp, seg, decay, pulse } from '../util.js';

export function createStory(renderer, scene, camera) {
  const frame = new CanvasTex(FW, FH, 1080 / FW);
  frame.texture.generateMipmaps = false;
  frame.texture.minFilter = THREE.LinearFilter;
  const D = 5;
  const vh = 2 * D * Math.tan(THREE.MathUtils.degToRad(35 / 2));
  const plane = new THREE.Mesh(new THREE.PlaneGeometry((vh * 9) / 16, vh), new THREE.MeshBasicMaterial({ map: frame.texture, toneMapped: false }));
  scene.add(plane);

  const cuts = [S.chat[0], S.turn[0], S.kid[0], S.parent[0], S.outro[0]];
  const buzzes = T.lock.notifs.map((n) => Math.max(0.02, n.at));

  function update(t) {
    frame.draw(t.toFixed(4), (c, w, h) => drawFrame(c, w, h, t));
    // vibrations du téléphone, impacts de la bascule, tremblement de la dispute
    let shake = 0;
    for (const b of buzzes) shake += Math.sin((t - b) * 70) * decay(t, b, 9) * (t > b ? 0.018 : 0);
    const angry = clamp((t - 8.4) / 1.6) * (t < S.chat[1] ? 1 : 0);
    shake += Math.sin(t * 47) * angry * 0.008;
    const slam = T.turn.reduce((a, w) => a + decay(t, w.at, 10) * (t > w.at ? 1 : 0), 0);
    // léger travelling avant sur l'écran verrouillé
    const push = t < S.lock[1] ? 1 + seg(t, 0, S.lock[1]) * 0.05 : 1;
    plane.position.set(shake, Math.sin(t * 61) * slam * 0.012, 0);
    plane.scale.setScalar(push + slam * 0.015);
    camera.position.set(0, 0, D);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.fov = 35;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    const cut = cuts.reduce((a, c) => a + decay(t, c, 10) * (t > c ? 1 : 0), 0);
    const post = {
      time: t,
      focus: D,
      aperture: 0,
      maxBlur: 0,
      exposure: 1,
      bloom: 0.25 + decay(t, OUT.logo + 0.3, 3) * (t > OUT.logo ? 0.3 : 0),
      bloomRadius: 0.5,
      threshold: 1.2,
      vignette: t < S.chat[1] ? 0.75 : 0.45,
      grain: 0.03,
      ca: 0.004 + cut * 0.1 + slam * 0.05 + pulse(t, K.result + 0.05, 0.12) * 0.05,
      zoom: cut * 0.45 + slam * 0.2 + pulse(t, K.result + 0.05, 0.1) * 0.2,
      flash: cut * 0.12 + decay(t, S.kid[0], 7) * (t > S.kid[0] ? 0.5 : 0) + decay(t, K.result, 8) * (t > K.result ? 0.15 : 0),
      fade: 0,
      sat: 1,
      flashCol: '#FFFFFF',
    };
    return { post, anchors: {} };
  }

  return { update, showAll() {}, env: null };
}
