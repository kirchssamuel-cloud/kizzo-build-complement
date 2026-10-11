// Mise en scène du « Crash test ». update(t) est une fonction pure du temps.
// 0 – 11,6 s : chambre dans le noir, un téléphone posé sur le bureau, un crayon tombe au ralenti
//   (cinq plans de plus en plus serrés : reflet de la pointe dans le verre, sous-pixels de l'écran).
// 11,6 s : l'image se fige à une image de l'impact — il ne se passera rien (c'est un appât).
// 12,5 s : l'image figée est aspirée vers le centre, la forme orange du motion design en sort ;
//   le motion design 2D (motion.js) est composé par-dessus, sans flou de profondeur.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createDevice } from '../devices.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { CanvasTex, SCREEN_W, SCREEN_H } from '../ui-canvas.js';
import { drawNightGame } from './game.js';
import { fxShared, LAYER_FX } from '../materials.js';
import { createPencil } from './pencil.js';
import { drawMotion, FW, FH } from './motion.js';
import { PARAMS, SHOT, FALL, DROP, FREEZE, M, START } from './config.js';
import { lerp, seg, ease, decay, wobble } from '../util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const L_MIRROR = 2;
const IP = [195, 400]; // point visé sur l'écran (px logiques)

/** Hauteur de la pointe au-dessus du verre. */
function fallHeight(t) {
  for (let i = 0; i < FALL.length - 1; i++) {
    const [t0, h0] = FALL[i], [t1, h1] = FALL[i + 1];
    if (t <= t1) return lerp(h0, h1, (t - t0) / (t1 - t0));
  }
  return 0;
}
/** Temps du jeu à l'écran : presque figé par le ralenti. */
const gameTime = (t) => 2.05 + 0.07 * Math.min(t, 2) + 0.01 * Math.max(0, t - 2);

export function createStory(renderer, scene, camera) {
  renderer.shadowMap.autoUpdate = false;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.3;
  pmrem.dispose();
  const world = new THREE.Group();
  scene.add(world);

  // ---------------------------------------------------------------- bureau (noyer sombre)
  const deskMat = new THREE.MeshStandardMaterial({ color: '#1E1712', roughness: 0.46, metalness: 0, envMapIntensity: 0.35 });
  deskMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vDesk;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDesk = position.xy;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vDesk;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float wv = vDesk.y * 9.0 + sin(vDesk.x * 1.3 + sin(vDesk.y * 2.1)) * 1.8;
        float g = 0.5 + 0.5 * sin(wv * 6.0) * sin(wv * 1.7 + 1.3);
        diffuseColor.rgb *= 0.78 + 0.32 * g;`
      );
  };
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), deskMat);
  desk.rotation.x = -Math.PI / 2;
  desk.receiveShadow = true;
  world.add(desk);

  // ---------------------------------------------------------------- téléphone (jeu à l'écran)
  // 3 px par point : la grille de la texture coïncide avec les pixels physiques (1170 px de large)
  const screen = new CanvasTex(SCREEN_W, SCREEN_H, 3);
  const phone = createDevice({ screenTexture: screen.texture, frame: '#4A4F58', back: '#23272F', brightness: 1.0 });
  phone.group.rotation.x = -Math.PI / 2;
  world.add(phone.group);
  const D = phone.dims;
  desk.position.y = -D.d / 2;
  phone.group.updateMatrixWorld(true);
  const IPW = phone.group.localToWorld(phone.screenToLocal(IP[0], IP[1], SCREEN_W, SCREEN_H));
  const GLASS_Y = IPW.y;

  // reflet du crayon dans le verre (rendu séparé, mélangé dans l'écran) + sous-pixels en macro
  const reflRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
  const dispU = {
    tRefl: { value: reflRT.texture },
    uScrRes: fxShared.uRes,
    uReflK: { value: 0.42 },
    uDim: { value: 1 },
    uSub: { value: 1 },
    uPix: { value: new THREE.Vector2(SCREEN_W * 3, SCREEN_H * 3) },
  };
  phone.displayMat.userData.dispU = dispU;
  phone.glareMat.uniforms.uIntensity.value = 0.25;
  phone.displayMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, dispU);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vScrWP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvScrWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D tRefl; uniform vec2 uScrRes, uPix; uniform float uReflK, uDim, uSub;\nvarying vec3 vScrWP;')
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        {
          vec2 pp = vMapUv * uPix;
          vec2 fw = fwidth(pp);
          float mag = smoothstep(0.55, 0.2, max(fw.x, fw.y)) * uSub;
          vec2 f = fract(pp);
          float sx = f.x * 3.0;
          float cell = floor(sx), fx = fract(sx);
          vec3 mask = vec3(cell < 0.5 ? 1.0 : 0.0, (cell > 0.5 && cell < 1.5) ? 1.0 : 0.0, cell > 1.5 ? 1.0 : 0.0);
          float shp = smoothstep(0.0, 0.2, fx) * smoothstep(1.0, 0.8, fx) * smoothstep(0.0, 0.12, f.y) * smoothstep(1.0, 0.88, f.y);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * mask * shp * 2.7, mag);
        }
        diffuseColor.rgb *= uDim;
        {
          vec4 rf = texture2D(tRefl, gl_FragCoord.xy / uScrRes);
          // Fresnel : le reflet domine en lumière rasante
          float cosv = abs(normalize(cameraPosition - vScrWP).y);
          float fr = 0.04 + 0.96 * pow(1.0 - cosv, 5.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, rf.rgb, clamp(rf.a, 0.0, 1.0) * clamp(fr * 1.6 + 0.12, 0.0, 0.9) * uReflK);
        }`
      );
  };

  // ---------------------------------------------------------------- crayon + son reflet
  const pencil = createPencil();
  world.add(pencil.group);
  const mirror = pencil.clone();
  mirror.matrixAutoUpdate = false;
  mirror.traverse((o) => {
    o.layers.set(L_MIRROR);
    o.castShadow = false;
  });
  world.add(mirror);
  const reflMat = new THREE.Matrix4().makeTranslation(0, 2 * GLASS_Y, 0).multiply(new THREE.Matrix4().makeScale(1, -1, 1));

  // ---------------------------------------------------------------- lumières : nuit, lueur de l'écran
  const hemi = new THREE.HemisphereLight('#90A4CF', '#060606', 0.1);
  const key = new THREE.SpotLight('#FFE3C8', 8, 9, 0.36, 0.75, 1.3);
  key.position.copy(IPW).add(V(-1.3, 3.1, -1.5));
  key.target.position.copy(IPW);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.01;
  key.shadow.radius = 5;
  key.shadow.blurSamples = 10;
  key.shadow.camera.near = 1.5;
  key.shadow.camera.far = 7;
  const rim = new THREE.SpotLight('#A9C6FF', 14, 8, 0.5, 0.85, 1.3);
  rim.position.copy(IPW).add(V(1.9, 1.2, -2.0));
  rim.target.position.copy(IPW).add(V(0, 0.3, 0));
  // l'écran éclaire comme une source étendue (lumière surfacique), pas comme un point
  RectAreaLightUniformsLib.init();
  const glow = new THREE.RectAreaLight('#C3CFFF', 2.0, D.sw, D.sh);
  glow.position.copy(phone.group.localToWorld(V(0, 0, D.front + 0.003)));
  glow.lookAt(glow.position.clone().add(V(0, 1, 0)));
  glow.rotateZ(Math.PI / 2);
  const fill = new THREE.DirectionalLight('#6F8CC8', 0.18);
  fill.position.set(2, 1, 4);
  for (const l of [hemi, key, rim, glow, fill]) {
    l.layers.enable(L_MIRROR);
    world.add(l);
  }
  world.add(key.target, rim.target);

  // ---------------------------------------------------------------- calque 2D (motion design)
  const frame = new CanvasTex(FW, FH, 1080 / FW);
  frame.texture.generateMipmaps = false;
  frame.texture.minFilter = THREE.LinearFilter;
  const planeMat = new THREE.MeshBasicMaterial({ map: frame.texture, transparent: true, toneMapped: false, depthTest: false, depthWrite: false });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), planeMat);
  plane.layers.set(LAYER_FX);
  plane.frustumCulled = false;
  plane.position.z = -0.1;
  camera.add(plane);
  scene.add(camera);
  // flou de bougé : sous-images moyennées (export) ; obturateur à 180°
  const SUB = PARAMS.exportMode ? 6 : 1;
  const SHUTTER = 0.5 / 60;
  let scratch = null;

  // ---------------------------------------------------------------- caméra
  const tip = V();
  const camPos = V(), camLook = V();
  let shotState = { ap: 0, maxBlur: 0 };
  function shot(t, h) {
    const P = IPW;
    let pos, look, fov, ap, maxBlur = 26;
    if (t < SHOT.side[0]) {
      const k = ease.inOutSine(seg(t, 0, SHOT.side[0]));
      pos = V(lerp(0.74, 0.64, k), lerp(1.02, 0.86, k), lerp(1.5, 1.32, k));
      look = V(0.0, lerp(0.5, 0.22, k), -0.12);
      fov = 36;
      ap = 0.16;
    } else if (t < SHOT.macro[0]) {
      const k = seg(t, SHOT.side[0], SHOT.side[1]);
      pos = V(lerp(0.3, 0.22, k), 0.042, lerp(0.92, 0.8, k));
      look = V(0, lerp(-0.01, -0.02, k), 0);
      fov = 34;
      ap = 0.42;
    } else if (t < SHOT.orbit[0]) {
      const k = seg(t, SHOT.macro[0], SHOT.macro[1]);
      pos = V(lerp(0.14, 0.1, k), 0.013, lerp(0.34, 0.28, k));
      look = V(0, -0.006, 0);
      fov = 30;
      ap = 1.0;
    } else if (t < SHOT.extreme[0]) {
      const k = ease.inOutSine(seg(t, SHOT.orbit[0], SHOT.orbit[1]));
      const az = lerp(0.6, 1.2, k), el = lerp(0.46, 0.38, k), dist = lerp(0.52, 0.42, k);
      pos = V(Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist);
      look = V(0, 0.016, 0);
      fov = 28;
      ap = 0.75;
    } else {
      const k = seg(t, SHOT.extreme[0], FREEZE);
      pos = V(lerp(-0.062, -0.05, k), 0.0105, lerp(0.17, 0.146, k));
      look = V(0, 0.0035 + h * 0.3, 0);
      fov = 22;
      ap = 1.4;
    }
    pos.add(P);
    look.add(P);
    // caméra portée très légère (prise de vue réelle)
    const d = pos.distanceTo(look);
    const amp = 0.0035 * d;
    pos.x += wobble(t * 1.3, 1) * amp;
    pos.y += wobble(t * 1.1, 2) * amp;
    look.x += wobble(t * 0.9, 3) * amp * 0.6;
    return { pos, look, fov, ap, maxBlur };
  }


  let imprinted = false;
  const anchors = { tip: null };

  function update(t) {
    if (!imprinted && CanvasTex.ready) {
      pencil.drawImprint();
      imprinted = true;
    }
    // après le gel, tout le monde 3D reste figé sur l'image « 1 image avant l'impact »
    const tf = Math.min(t, FREEZE);
    const h = fallHeight(tf);
    // variante promo seule : pas de crayon, on part du noir
    const in3D = START === 0 && t < M.seed + 0.05;
    world.visible = in3D;

    if (in3D) {
      // l'ombre portée du crayon ne se voit que dans le plan large
      key.castShadow = tf < SHOT.side[0];
      // ---- crayon (pivot sur la pointe), léger dévers, et son reflet
      tip.set(IPW.x, GLASS_Y + h, IPW.z);
      pencil.group.position.copy(tip);
      pencil.group.rotation.set(-0.05, 0.4, 0.075);
      pencil.group.updateMatrix();
      mirror.matrix.multiplyMatrices(reflMat, pencil.group.matrix);
      mirror.matrixWorldNeedsUpdate = true;

      // ---- écran : le jeu est quasi figé par le ralenti, on ne retrace que s'il change vraiment
      const gt = Math.round(gameTime(tf) * 240) / 240;
      screen.draw('g' + gt, (c, W, H) => drawNightGame(c, W, H, gt));

      // ---- caméra ; au gel, petit coup de zoom (arrêt sur image)
      const s = shot(tf, h);
      const punch = t >= FREEZE ? 1 - 0.06 * ease.outCubic(seg(t, FREEZE, FREEZE + 0.12)) : 1;
      camPos.copy(s.pos);
      camLook.copy(s.look);
      camera.position.copy(camPos);
      camera.up.set(0, 1, 0);
      camera.lookAt(camLook);
      // aspiration finale : la caméra plonge vers le centre de l'image figée
      const dive = ease.inCubic(seg(t, DROP - 0.08, M.seed + 0.02));
      camera.fov = s.fov * punch * (1 - 0.75 * dive);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      shotState = s;

      // ---- reflet : le crayon miroir seul, vu par la caméra courante
      const prevTarget = renderer.getRenderTarget();
      const w = Math.max(4, Math.round(fxShared.uRes.value.x / 2)), hh = Math.max(4, Math.round(fxShared.uRes.value.y / 2));
      if (reflRT.width !== w || reflRT.height !== hh) reflRT.setSize(w, hh);
      camera.layers.set(L_MIRROR);
      renderer.setRenderTarget(reflRT);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setClearColor('#05080F', 1);
      renderer.setRenderTarget(prevTarget);
      camera.layers.set(0);
      const p = tip.clone().project(camera);
      anchors.tip = { x: (p.x + 1) / 2, y: (1 - p.y) / 2 };
    }

    // ---- calque 2D
    const show2D = t >= DROP || START > 0;
    plane.visible = show2D;
    if (show2D) {
      const vh = 2 * 0.1 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      plane.scale.set(vh * camera.aspect, vh, 1);
      frame.draw(t.toFixed(4), (c, W, H) => {
        if (SUB === 1) return drawMotion(c, W, H, t);
        if (!scratch || scratch.width !== c.canvas.width) {
          scratch = document.createElement('canvas');
          scratch.width = c.canvas.width;
          scratch.height = c.canvas.height;
          scratch.g = scratch.getContext('2d', { willReadFrequently: true });
        }
        const m = c.getTransform();
        for (let i = 0; i < SUB; i++) {
          const ti = t + (i / (SUB - 1) - 0.5) * SHUTTER;
          scratch.g.setTransform(1, 0, 0, 1, 0, 0);
          scratch.g.clearRect(0, 0, scratch.width, scratch.height);
          scratch.g.setTransform(m);
          drawMotion(scratch.g, W, H, ti);
          c.save();
          c.setTransform(1, 0, 0, 1, 0, 0);
          c.globalAlpha = 1 / (i + 1);
          c.drawImage(scratch, 0, 0);
          c.restore();
        }
      });
    }

    // ---- étalonnage
    // aspiration : l'image figée part vers le centre (flou radial), la forme orange en sort
    const suck = ease.inCubic(seg(t, DROP - 0.08, M.seed + 0.02)) * (t < M.seed + 0.1 ? 1 : 0);
    const frz = t >= FREEZE ? 1 : 0;
    let post;
    if (in3D && t < M.seed) {
      post = {
        time: t,
        focus: camPos.distanceTo(tip),
        aperture: shotState.ap,
        maxBlur: shotState.maxBlur,
        exposure: 1.12 - 0.08 * frz,
        bloom: 0.22,
        bloomRadius: 0.55,
        threshold: 0.95,
        vignette: 0.62 + 0.12 * frz,
        grain: 0.045,
        ca: 0.006 + decay(t, FREEZE, 12) * frz * 0.08 + suck * 0.25,
        zoom: decay(t, FREEZE, 12) * frz * 0.25 + suck * 2.2,
        zoomCenter: new THREE.Vector2(0.5, 0.463),
        flash: decay(t, FREEZE, 18) * frz * 0.35,
        flashCol: '#FFFFFF',
        fade: 0,
        sat: 1.05 - 0.3 * frz,
      };
    } else {
      // motion design : image propre, pas de tone mapping (blancs et gris exacts)
      const hit = (a) => (t >= a ? decay(t, a, 14) : 0);
      const big =
        hit(M.bleed) * (START > 0 ? 0.5 : 1) + hit(M.brand) * 0.6 + hit(M.play) * 0.6 + hit(M.lock) * 0.4 + hit(M.reward) * 0.5 +
        hit(M.k1) * 0.35 + hit(M.k2) * 0.35 + hit(M.k3) * 0.45 + hit(M.logo) * 0.5 + (START > 0 ? hit(DROP) * 1.3 : 0);
      const dark = t < M.bleed + 0.25;
      post = {
        time: t,
        focus: 1,
        aperture: 0,
        maxBlur: 0,
        exposure: 1,
        bloom: 0,
        bloomRadius: 0.4,
        threshold: 2,
        vignette: dark ? 0.4 : 0.06,
        grain: 0.014,
        ca: 0.0015 + big * 0.06,
        zoom: big * 0.22,
        zoomCenter: new THREE.Vector2(0.5, 0.463),
        flash: 0,
        fade: 0,
        sat: 1,
        tonemap: dark ? 1 : 0,
      };
    }
    return { post, anchors };
  }

  return {
    update,
    showAll(on) {
      plane.visible = on;
    },
    env: null,
  };
}

