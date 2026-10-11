// Mise en scène de la promo 3D « La reconstruction ». update(t) est une fonction pure du temps.
// 0 – 1 s   : on est dans l'écran écrasé ; l'orange revient sous le verre, les éclats lévitent.
// 1 s       : les éclats se recollent d'un coup → PAS BESOIN / D'EN ARRIVER / LÀ. en typo 3D.
// 2,5 – 6 s : app enfant : le jeu, « C'est l'heure d'un quiz ! » sort de l'écran, la question et
//             les réponses sortent en 3D, +15 en relief.
// 6 s       : le téléphone tourne sur lui-même → app parent : puces de fréquence, interrupteur,
//             courbe de progression, notification.
// 10 – 12 s : dernière mesure, la plus forte : un mot par temps, le fond change à chaque temps.
// 12 s      : logo en relief, nom, bouton.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createDevice } from '../devices.js';
import { CanvasTex, SCREEN_W, SCREEN_H, txt, F_DISPLAY } from '../ui-canvas.js';
import { shadowPlane } from '../materials.js';
import { createLogo3D, createPlus15 } from '../logo3d.js';
import { lockedCard, resultScreen } from '../ui-kizzo.js';
import { rulesScreen } from '../regles/ui.js';
import { drawNightGame } from '../crash/game.js';
import { fracture, shardGeometry, glassMaterial } from './shards.js';
import * as U from './ui.js';
import { E, T, COL, BEAT } from './config.js';
import { clamp, lerp, seg, ease, springT, decay, wobble, TAU } from '../util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sp = (dt, s = 300, d = 30) => clamp(springT(dt, { stiffness: s, damping: d }), 0, 1.06);
const IP = [195, 400];

/** Fonds pleins successifs (révélés par un cercle qui part du téléphone). */
const BG = [
  [-1, COL.black],
  [E.snap, COL.navy],
  [E.game, COL.orange],
  [E.plus15, COL.navy],
  [E.result, COL.orange],
  [E.spin + 0.22, COL.light],
  [E.s1, COL.orange],
  [E.s2, COL.navy],
  [E.s3, COL.light],
  [E.s4, COL.orange],
  [E.logo, COL.navy],
];

/** Typo cinétique : plan texturé (texte ajusté à la largeur). */
function typePlane(lines, { width = 2.6, size = 260, color = '#fff', lh = 0.9 } = {}) {
  const cw = 1800;
  const ch = Math.ceil(lines.length * size * lh + size * 0.5);
  const tex = new CanvasTex(cw, ch, 1);
  tex.texture.generateMipmaps = true;
  tex.draw('t', (c, W, H) => {
    let y = (H - lines.length * size * lh) / 2 + size * 0.78;
    for (const l of lines) {
      const s = typeof l === 'string' ? { s: l } : l;
      c.font = `800 ${size}px ${F_DISPLAY}`;
      const w = c.measureText(s.s).width;
      // chaque ligne remplit la largeur (justifié), sans dépasser la hauteur de ligne
      const fit = Math.min(size, (size * (W - 30)) / Math.max(1, w));
      txt(c, s.s, W / 2, y, { size: fit, weight: 800, color: s.color || color, align: 'center', font: F_DISPLAY, ls: -fit * 0.04 });
      y += size * lh;
    }
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex.texture, transparent: true, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, (width * ch) / cw), mat);
  mesh.renderOrder = 2;
  return { mesh, mat, tex };
}

/** Carte d'interface en 3D : plan texturé + ombre douce. */
function cardPlane(w, h, px, drawFn, { shadow = 0.45 } = {}) {
  const tex = new CanvasTex(px[0], px[1], 2.4);
  const mat = new THREE.MeshBasicMaterial({ map: tex.texture, transparent: true, toneMapped: false, depthWrite: false });
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.renderOrder = 3;
  const sh = shadowPlane(w * 0.9, h * 0.9, shadow);
  sh.position.set(0.03, -0.05, -0.06);
  sh.renderOrder = 1;
  group.add(sh, mesh);
  tex.draw('init', drawFn);
  return { group, mesh, mat, tex, sh, draw: (key, fn = drawFn) => tex.draw(key, fn) };
}

export function createStory(renderer, scene, camera) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;
  pmrem.dispose();
  renderer.shadowMap.enabled = false;

  // ---------------------------------------------------------------- fond plein (sphère, cercle qui s'ouvre)
  const bgU = {
    uFrom: { value: new THREE.Color(COL.black) },
    uTo: { value: new THREE.Color(COL.black) },
    uR: { value: 0 },
    uC: { value: new THREE.Vector2(0.5, 0.5) },
    uRes: { value: new THREE.Vector2(1080, 1920) },
  };
  const bg = new THREE.Mesh(
    new THREE.SphereGeometry(60, 32, 16),
    new THREE.ShaderMaterial({
      uniforms: bgU,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: /* glsl */ `void main() { vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uFrom, uTo; uniform float uR; uniform vec2 uC, uRes;
        void main() {
          vec2 uv = gl_FragCoord.xy / uRes;
          vec2 d = (uv - uC) * vec2(uRes.x / uRes.y, 1.0);
          float k = smoothstep(uR, uR - 0.004, length(d));
          gl_FragColor = vec4(mix(uFrom, uTo, k), 1.0);
          #include <colorspace_fragment>
        }
      `,
    })
  );
  bg.renderOrder = -10;
  bg.frustumCulled = false;
  scene.add(bg);

  // ---------------------------------------------------------------- lumières studio
  const hemi = new THREE.HemisphereLight('#ffffff', '#202838', 0.6);
  const key = new THREE.DirectionalLight('#FFF4EA', 2.2);
  key.position.set(-2.5, 3.5, 4);
  const rim = new THREE.DirectionalLight('#BFE4FF', 2.4);
  rim.position.set(3, 1.5, -3);
  const rim2 = new THREE.DirectionalLight('#FFC59A', 1.6);
  rim2.position.set(-3, -1, -2.5);
  scene.add(hemi, key, rim, rim2);

  // ---------------------------------------------------------------- téléphone
  const rig = new THREE.Group();
  scene.add(rig);
  const screen = new CanvasTex(SCREEN_W, SCREEN_H, 2.4);
  const phone = createDevice({ screenTexture: screen.texture, frame: '#C9CED6', back: '#E4E8EE', brightness: 1.0 });
  rig.add(phone.group);
  const D = phone.dims;
  const toLocal = (px, py) => V((px / SCREEN_W - 0.5) * D.sw, (0.5 - py / SCREEN_H) * D.sh, 0);
  // reflets du verre plus discrets (fonds pleins)
  phone.glareMat.uniforms.uIntensity.value = 0.55;

  // éclats du verre
  const gMat = glassMaterial();
  const shards = fracture(SCREEN_W, SCREEN_H, IP[0], IP[1]).map((c) => {
    const { geometry, center } = shardGeometry(c, toLocal);
    const mesh = new THREE.Mesh(geometry, gMat);
    mesh.renderOrder = 4;
    mesh.position.set(center.x, center.y, D.front + 0.006);
    phone.group.add(mesh);
    const dl = Math.hypot(c.cx - IP[0], c.cy - IP[1]) || 1;
    return {
      mesh,
      home: mesh.position.clone(),
      dir: V((c.cx - IP[0]) / dl, -(c.cy - IP[1]) / dl, 0),
      near: 1 - Math.min(1, c.dist / 700),
      axis: V(c.rnd[0] - 0.5, c.rnd[1] - 0.5, (c.rnd[2] - 0.5) * 0.3).normalize(),
      rnd: c.rnd,
    };
  });

  // ---------------------------------------------------------------- typo cinétique
  const W = (lines, o) => {
    const p = typePlane(lines, o);
    scene.add(p.mesh);
    return p;
  };
  // le cadre 9:16 est étroit : ~1,3 unité de large à la profondeur de la typo
  const wPas = W([T.w[0]], { width: 1.3, color: '#fff', size: 420 });
  const wArr = W([T.w[1]], { width: 1.3, color: '#fff', size: 420 });
  const wLa = W([T.w[2]], { width: 1.05, size: 300, color: '#fff' });
  const wPlay = W(T.play, { width: 1.15, color: '#fff', size: 330 });
  const wLearn = W(T.learn, { width: 1.2, color: COL.navy, size: 330 });
  const wPlus = W([T.plus], { width: 1.1, color: '#fff', size: 360 });
  const wYou1 = W([T.you[0]], { width: 1.25, color: COL.navy, size: 420 });
  const wYou2 = W([T.you[1], T.you[2]], { width: 1.2, color: COL.orange, size: 330 });
  const w92 = W([T.chart.value], { width: 1.0, color: COL.orange, size: 520 });
  const sig = [
    W([T.sig[0]], { width: 1.4, color: '#fff', size: 520 }),
    W([T.sig[1]], { width: 1.4, color: COL.orange, size: 520 }),
    W([T.sig[2]], { width: 1.4, color: COL.navy, size: 520 }),
    W([T.sig[3]], { width: 1.45, color: '#fff', size: 520 }),
  ];

  // ---------------------------------------------------------------- cartes qui sortent de l'écran
  const lock = cardPlane(0.66 * (400 / 330), 0.66 * (470 / 330), [400, 470], (c) => lockedCard(c, 200, 235, 1, 1.2), { shadow: 0.55 });
  const qCard = cardPlane(0.82, 0.82 * (U.Q_PX[1] / U.Q_PX[0]), U.Q_PX, (c, w, h) => U.questionCard(c, w, h));
  const tiles = T.quiz.options.map((o) => cardPlane(0.36, 0.36 * (U.TILE_PX[1] / U.TILE_PX[0]), U.TILE_PX, (c, w, h) => U.answerTile(c, w, h, o, 0), { shadow: 0.4 }));
  const chips = T.chips.map((o) => cardPlane(0.42, 0.42 * (U.CHIP_PX[1] / U.CHIP_PX[0]), U.CHIP_PX, (c, w, h) => U.chip(c, w, h, o, 0), { shadow: 0.3 }));
  const toggle = cardPlane(0.9, 0.9 * (U.TOGGLE_PX[1] / U.TOGGLE_PX[0]), U.TOGGLE_PX, (c, w, h) => U.toggleCard(c, w, h, 0), { shadow: 0.35 });
  const notif = cardPlane(0.95, 0.95 * (U.NOTIF_PX[1] / U.NOTIF_PX[0]), U.NOTIF_PX, (c, w, h) => U.notifCard(c, w, h), { shadow: 0.35 });
  const cards = [lock, qCard, ...tiles, ...chips, toggle, notif];
  cards.forEach((c) => scene.add(c.group));

  // +15 en relief, logo en relief
  const plus = createPlus15();
  scene.add(plus.group);
  const logo = createLogo3D();
  scene.add(logo.group);

  // courbe de progression 3D (tube orange qui se dessine hors de l'écran)
  const chartPts = [
    [-0.46, -0.28],
    [-0.3, -0.12],
    [-0.15, -0.18],
    [0.0, 0.02],
    [0.15, 0.08],
    [0.3, 0.24],
    [0.46, 0.4],
  ].map(([x, y], i) => V(x, y, 0.42 + Math.sin(i * 1.3) * 0.05));
  const chartCurve = new THREE.CatmullRomCurve3(chartPts);
  const tubeGeo = new THREE.TubeGeometry(chartCurve, 140, 0.018, 12, false);
  const tubeMat = new THREE.MeshPhysicalMaterial({ color: COL.orange, roughness: 0.25, clearcoat: 1, emissive: new THREE.Color(COL.orange), emissiveIntensity: 0.25 });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  scene.add(tube);
  const dots = chartPts.map(() => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 24, 16), new THREE.MeshPhysicalMaterial({ color: '#fff', roughness: 0.2, clearcoat: 1 }));
    scene.add(m);
    return m;
  });
  const tubeIdx = tubeGeo.index.count;

  // ---------------------------------------------------------------- écran du téléphone
  function drawScreen(t) {
    if (t < E.snap + 0.04) {
      const glow = ease.inOutSine(seg(t, E.glow - 0.1, E.snap - 0.04));
      screen.draw('lcd' + t.toFixed(3), (c, w, h) => U.crackedLCD(c, w, h, t, glow, IP[0], IP[1]));
    } else if (t < E.game) {
      // écran orange nu pendant la phrase, le logo apparaît quand les mots s'envolent
      const k = t < E.splash ? 0 : sp(t - E.splash - 0.05, 260, 26);
      screen.draw('sp' + k.toFixed(3), (c, w, h) => U.splash(c, w, h, k));
    } else if (t < E.quiz) {
      const gt = Math.round(t * 30) / 30;
      const dim = clamp(seg(t, E.lock - 0.05, E.lock + 0.15)) * 0.7;
      screen.draw('g' + gt + ':' + dim.toFixed(2), (c, w, h) => {
        drawNightGame(c, w, h, gt + 2);
        if (dim > 0) {
          c.fillStyle = `rgba(10,21,38,${dim})`;
          c.fillRect(0, 0, w, h);
        }
      });
    } else if (t < E.plus15) {
      screen.draw('quiz', (c, w, h) => U.kidQuizBg(c, w, h));
    } else if (t < E.spin + 0.25) {
      screen.draw('res', (c, w, h) => resultScreen(c, w, h, { minutes: 15, pulse: 0.5 }));
    } else if (t < E.s1) {
      const f = ease.inOutCubic(seg(t, E.pick, E.pick + 0.25));
      screen.draw('rules' + f.toFixed(2), (c, w, h) => rulesScreen(c, w, h, { toggle: 1, freq: f, q: 2, subj: 6 }));
    } else {
      screen.draw('sp-end', (c, w, h) => U.splash(c, w, h, 1));
    }
  }

  // ---------------------------------------------------------------- caméra (plans qui s'enchaînent)
  const camPose = (t) => {
    // A : dans l'écran cassé → recul pendant que les éclats lèvent
    if (t < E.snap) {
      const k = ease.inOutSine(seg(t, 0, E.snap));
      return { pos: V(lerp(0, 0.45, k), lerp(0, 0.18, k), lerp(2.62, 3.15, k)), tgt: V(0, 0, 0.05), fov: 30 };
    }
    // B : orbite autour du téléphone, la typo défile en profondeur
    if (t < E.game) {
      const k = ease.inOutSine(seg(t, E.snap, E.game));
      const a = lerp(-0.42, 0.38, k), r = lerp(4.5, 4.1, k) + 0.5 * decay(t, E.snap, 7);
      return { pos: V(Math.sin(a) * r, lerp(0.3, 0.12, k), Math.cos(a) * r), tgt: V(0, 0, 0), fov: 30 };
    }
    // C : app enfant, face au téléphone, coups de zoom sur les temps forts
    if (t < E.spin) {
      const k = seg(t, E.game, E.spin);
      const a = lerp(0.22, -0.18, ease.inOutSine(k));
      const punch = 0.22 * (decay(t, E.lock, 9) + decay(t, E.quiz, 9) + decay(t, E.plus15, 7));
      const r = 4.25 - punch;
      return { pos: V(Math.sin(a) * r, 0.18, Math.cos(a) * r), tgt: V(0, 0.02, 0.25), fov: 30 };
    }
    // D : app parent, légère plongée
    if (t < E.s1) {
      const k = ease.inOutSine(seg(t, E.spin, E.s1));
      const a = lerp(-0.3, 0.26, k), r = 4.3 - 0.18 * (decay(t, E.pick, 9) + decay(t, E.chart, 8));
      return { pos: V(Math.sin(a) * r, lerp(0.55, 0.35, k), Math.cos(a) * r), tgt: V(0, 0.05, 0.2), fov: 30 };
    }
    // E : la signature, travelling avant
    if (t < E.logo) {
      const k = seg(t, E.s1, E.logo);
      const r = lerp(4.6, 3.9, ease.outCubic(k)) - 0.25 * [E.s1, E.s2, E.s3, E.s4].reduce((s, x) => s + decay(t, x, 10), 0);
      return { pos: V(lerp(0.25, -0.2, k), 0.15, r), tgt: V(0, 0.3, 0), fov: 30 };
    }
    // F : titre de fin
    const k = ease.outCubic(seg(t, E.logo, E.logo + 1.5));
    return { pos: V(0, lerp(0.35, 0.2, k), lerp(4.6, 4.1, k)), tgt: V(0, 0.32, 0), fov: 30 };
  };
  // raccords doux entre plans (pas de saut de caméra)
  const BOUNDS = [E.snap, E.game, E.spin, E.s1, E.logo];
  function camAt(t) {
    let p = camPose(t);
    for (const bnd of BOUNDS) {
      const w = seg(t, bnd, bnd + 0.32);
      if (w > 0 && w < 1) {
        const prev = camPose(bnd - 1e-3);
        const k = ease.outCubic(w);
        p = { pos: prev.pos.clone().lerp(p.pos, k), tgt: prev.tgt.clone().lerp(p.tgt, k), fov: lerp(prev.fov, p.fov, k) };
      }
    }
    return p;
  }

  // ---------------------------------------------------------------- utilitaires d'animation
  const pop = (t, at, s = 360, d = 30) => sp(t - at, s, d);
  const leave = (t, at, dur = 0.25) => ease.inCubic(seg(t, at, at + dur));
  const screenPoint = (px, py, z = 0) => phone.group.localToWorld(toLocal(px, py).add(V(0, 0, D.front + z)));
  /** Place une carte : de l'écran (k = 0) vers sa position (k = 1). */
  function fly(card, from, to, k, scaleFrom = 0.9, rotY = 0) {
    card.group.visible = k > 0.001;
    if (!card.group.visible) return;
    card.group.position.copy(from).lerp(to, k);
    card.group.scale.setScalar(lerp(scaleFrom, 1, Math.min(1, k)));
    card.group.quaternion.copy(rig.quaternion);
    card.group.rotateY(rotY * (1 - Math.min(1, k)));
  }

  const anchors = {};
  let shotState = { focus: 4 };

  function update(t) {
    // ---- téléphone : flotte doucement ; tour sur lui-même au passage côté parent
    const spinK = ease.inOutCubic(seg(t, E.spin, E.spin + 0.5));
    let ry = 0.08 * wobble(t * 0.8, 1);
    let rx = 0.05 * wobble(t * 0.7, 2);
    let py = 0.03 * wobble(t * 0.9, 3);
    let px = 0;
    if (t >= E.snap && t < E.game) ry += lerp(0.25, -0.2, ease.inOutSine(seg(t, E.snap, E.game)));
    ry += spinK * TAU;
    // dernière mesure : le téléphone descend et pivote d'un cran par temps
    if (t >= E.s1 - 0.3) {
      const k = ease.inOutCubic(seg(t, E.s1 - 0.3, E.s1));
      py += lerp(0, -0.62, k);
      const steps = [E.s1, E.s2, E.s3, E.s4].reduce((s, x) => s + sp(t - x, 380, 30), 0);
      ry += steps * 0.35 - 0.5;
    }
    // fin : le téléphone part, le logo arrive
    const out = ease.inCubic(seg(t, E.logo - 0.12, E.logo + 0.35));
    py -= out * 3.2;
    rx += out * 1.2;
    rig.position.set(px, py, -out * 1.5);
    rig.rotation.set(rx, ry, 0);
    rig.visible = out < 1;
    rig.updateMatrixWorld(true);

    drawScreen(t);

    // ---- éclats : lévitent sous la lumière orange, puis se recollent sur le temps fort
    const glow = seg(t, E.glow, E.snap);
    gMat.uniforms.uGlow.value = glow;
    const shardsOn = t < E.snap + 0.05;
    for (const s of shards) {
      s.mesh.visible = shardsOn;
      if (!shardsOn) continue;
      const lift = ease.outCubic(seg(t, E.glow + s.rnd[3] * 0.12, E.snap - 0.1));
      const back = ease.inCubic(seg(t, E.snap - 0.1, E.snap));
      const amt = lift * (1 - back);
      const h = (0.06 + 0.32 * s.rnd[0]) * (0.4 + 0.6 * s.near);
      s.mesh.position.copy(s.home).addScaledVector(s.dir, amt * (0.03 + 0.08 * s.rnd[1])).add(V(0, 0, amt * h));
      s.mesh.quaternion.setFromAxisAngle(s.axis, amt * (0.4 + 0.9 * s.rnd[2]));
    }
    gMat.uniforms.uAlpha.value = 1 - seg(t, E.snap, E.snap + 0.05);

    // ---- typo cinétique
    const show = (p, on, pos, k, { rot = 0, sFrom = 1.5 } = {}) => {
      p.mesh.visible = on && k > 0.001;
      if (!p.mesh.visible) return;
      p.mesh.position.copy(pos);
      p.mesh.scale.setScalar(lerp(sFrom, 1, Math.min(1, k)));
      p.mat.opacity = clamp(k * 1.8);
      p.mesh.rotation.set(0, rot, 0);
    };
    // PAS BESOIN / D'EN ARRIVER / LÀ. ; s'envolent au passage de l'écran d'accueil
    const fl = ease.inCubic(seg(t, E.splash, E.splash + 0.35));
    show(wPas, t < E.splash + 0.4, V(0, 0.99 + fl * 1.6, -0.6), pop(t, E.snap, 520, 34));
    show(wArr, t < E.splash + 0.4, V(0, -0.99 - fl * 1.6, -0.6), pop(t, E.w2, 520, 34));
    show(wLa, t < E.splash + 0.4, V(0.05, -0.05, 0.55 + fl * 4), pop(t, E.w3, 520, 34), { sFrom: 1.8 });
    // IL VEUT JOUER ? / IL RÉPOND D'ABORD.
    show(wPlay, t >= E.game && t < E.quiz + 0.2, V(0, 1.1 + leave(t, E.quiz) * 1.5, -0.6), pop(t, E.game, 480, 32));
    show(wLearn, t >= E.lock && t < E.plus15 + 0.2, V(0, -1.12 - leave(t, E.plus15) * 1.5, -0.6), pop(t, E.lock + BEAT / 2, 480, 32));
    show(wPlus, t >= E.plus15 && t < E.spin, V(0, -0.82, 0.55), pop(t, E.plus15 + 0.1, 420, 30));
    // ET C'EST TOI / QUI FIXES LES RÈGLES. ; 92 %
    show(wYou1, t >= E.you1 && t < E.chart, V(0, 1.0 + leave(t, E.chart - 0.25) * 1.5, -0.6), pop(t, E.you1, 480, 32));
    show(wYou2, t >= E.you2 && t < E.s1, V(0, -1.14 - leave(t, E.s1 - 0.25) * 1.5, -0.6), pop(t, E.you2, 480, 32));
    show(w92, t >= E.chart && t < E.s1, V(0, 1.0 + leave(t, E.s1 - 0.25) * 1.5, -0.6), pop(t, E.chart + 0.1, 420, 30));
    // signature : un mot par temps, derrière le téléphone qui descend
    [E.s1, E.s2, E.s3, E.s4].forEach((at, i) => {
      const nx = [E.s2, E.s3, E.s4, E.logo][i];
      show(sig[i], t >= at && t < nx, V(0, 0.66, -0.5), pop(t, at, 600, 36), { sFrom: 1.6 });
    });

    // ---- cartes : verrouillage, question, réponses
    const sc = (px, py, z) => screenPoint(px, py, z);
    const lockK = t < E.quiz + 0.3 ? pop(t, E.lock, 300, 28) : 0;
    fly(lock, sc(195, 430, 0.01), V(0, 0.05, 0.55), lockK);
    if (lock.group.visible) {
      const pr = clamp(decay(t, E.tapLock, 9) * (t >= E.tapLock ? 1 : 0));
      const gone = leave(t, E.quiz - 0.05, 0.3);
      lock.group.scale.multiplyScalar(1 - 0.04 * pr);
      lock.group.position.add(V(-gone * 1.6, gone * 1.4, gone * 0.6));
      lock.group.rotateZ(gone * 0.6);
      lock.mat.opacity = 1 - gone;
      lock.sh.material.opacity = 0.55 * (1 - gone);
    }
    const qOut = leave(t, E.plus15 - 0.05, 0.3);
    fly(qCard, sc(195, 330, 0.01), V(0, 0.5 + qOut * 1.5, 0.6), t < E.plus15 + 0.3 ? pop(t, E.quiz, 320, 28) : 0);
    qCard.mat.opacity = 1 - qOut;
    const TP = [V(-0.2, -0.04, 0.62), V(0.2, -0.04, 0.68), V(-0.2, -0.27, 0.58), V(0.2, -0.27, 0.64)];
    tiles.forEach((tl, i) => {
      const k = t < E.plus15 + 0.3 ? pop(t, E.quiz + 0.12 + i * 0.06, 360, 28) : 0;
      fly(tl, sc(195, 560, 0.01), TP[i], k, 0.6, 0.6);
      if (!tl.group.visible) return;
      const ok = i === T.quiz.ok;
      if (ok) {
        const sel = t >= E.tapAnswer;
        tl.draw(sel ? 'ok' : 'idle', (c, w, h) => U.answerTile(c, w, h, T.quiz.options[i], sel ? 1 : 0));
        const bump = sel ? 1 + 0.1 * Math.max(0, Math.sin(clamp((t - E.tapAnswer) / 0.25) * Math.PI)) : 1;
        tl.group.scale.multiplyScalar(bump * (1 - 0.06 * clamp(decay(t, E.tapAnswer, 12) * (t >= E.tapAnswer ? 1 : 0))));
        tl.group.position.add(V(0, qOut * 1.5, 0));
        tl.mat.opacity = 1 - qOut;
      } else {
        // les mauvaises réponses tombent
        const f = Math.max(0, t - E.tapAnswer - 0.12);
        tl.group.position.add(V(0, -3.2 * f * f, 0));
        tl.group.rotateZ((i - 1.5) * f * 1.4);
        tl.mat.opacity = 1 - clamp(f * 2.5);
      }
      tl.sh.material.opacity = 0.4 * tl.mat.opacity;
    });

    // ---- +15 en relief
    const pk = t >= E.plus15 && t < E.spin ? pop(t, E.plus15, 300, 24) : 0;
    const pback = leave(t, E.result + 0.1, 0.35);
    plus.group.visible = pk > 0.001 && pback < 1;
    if (plus.group.visible) {
      plus.group.position.copy(sc(195, 430, 0)).lerp(V(-0.12, 0.12, 0.95), pk * (1 - pback));
      plus.group.scale.setScalar(0.3 * Math.min(1.05, pk) * (1 - pback * 0.9));
      plus.group.rotation.set(0.1 * wobble(t, 4), (1 - Math.min(1, pk)) * 2.5 + 0.25 * Math.sin(t * 1.8), 0);
    }

    // ---- côté parent : puces de fréquence, interrupteur, courbe, notification
    const CP = [V(-0.23, -0.12, 0.6), V(0.23, -0.12, 0.72), V(-0.23, -0.34, 0.56), V(0.23, -0.34, 0.64)];
    chips.forEach((ch, i) => {
      const k = t >= E.chips && t < E.chart ? pop(t, E.chips + i * 0.06, 360, 30) : 0;
      fly(ch, sc(60 + i * 90, 300, 0.01), CP[i], k, 0.5, 0.4);
      if (!ch.group.visible) return;
      const sel = i === 1 && t >= E.pick;
      ch.draw(sel ? 'on' : 'off', (c, w, h) => U.chip(c, w, h, T.chips[i], sel ? 1 : 0));
      const away = leave(t, E.toggle - 0.1, 0.3);
      if (i === 1) {
        const s = sel ? 1 + 0.25 * sp(t - E.pick, 380, 26) : 1;
        ch.group.scale.multiplyScalar(s);
        ch.group.position.add(V(-0.23 * away * 0, (sel ? 0.2 * Math.min(1, sp(t - E.pick, 380, 26)) : 0) + away * 1.8, 0));
      } else ch.group.position.add(V(0, -away * 1.6, -0.3 * clamp((t - E.pick) * 4)));
      ch.mat.opacity = 1 - away;
      ch.sh.material.opacity = 0.3 * (1 - away);
    });
    const tk = t >= E.toggle && t < E.notif + 0.2 ? pop(t, E.toggle, 320, 28) : 0;
    fly(toggle, sc(195, 240, 0.01), V(0, 0.3, 0.68), tk);
    if (toggle.group.visible) {
      const on = clamp(sp(t - E.toggle - 0.25, 520, 38));
      toggle.draw('t' + on.toFixed(2), (c, w, h) => U.toggleCard(c, w, h, on));
      const away = leave(t, E.notif, 0.25);
      toggle.group.position.add(V(0, -away * 1.5, 0));
      toggle.mat.opacity = 1 - away;
    }
    const ck = t >= E.chart && t < E.s1 ? ease.inOutCubic(seg(t, E.chart + 0.05, E.chart + 0.55)) : 0;
    const cAway = leave(t, E.s1 - 0.2, 0.25);
    tube.visible = ck > 0.001 && cAway < 1;
    if (tube.visible) {
      tube.position.set(0, 0.15 + cAway * 1.5, 0);
      tube.geometry.setDrawRange(0, Math.floor((tubeIdx * ck) / 6) * 6);
      tube.quaternion.copy(rig.quaternion);
    }
    dots.forEach((d, i) => {
      const k = t >= E.chart && t < E.s1 ? pop(t, E.chart + 0.05 + (i / 6) * 0.5, 420, 26) : 0;
      d.visible = k > 0.001 && cAway < 1;
      if (!d.visible) return;
      d.position.copy(chartPts[i]).applyQuaternion(rig.quaternion).add(V(0, 0.15 + cAway * 1.5, 0));
      d.scale.setScalar(Math.min(1.05, k) * (i === 6 ? 1.5 : 1));
    });
    const nk = t >= E.notif && t < E.s1 + 0.2 ? pop(t, E.notif, 320, 28) : 0;
    fly(notif, V(0, 1.7, 0.8), V(0, 0.55, 0.8), nk, 1);
    if (notif.group.visible) {
      const away = leave(t, E.s1 - 0.2, 0.25);
      notif.group.position.add(V(0, away * 1.2, 0));
      notif.mat.opacity = 1 - away;
    }

    // ---- logo en relief (fin)
    const lk = pop(t, E.logo + 0.05, 220, 22);
    logo.group.visible = lk > 0.001;
    if (logo.group.visible) {
      logo.group.position.set(0, 0.7, 0);
      logo.group.scale.setScalar(0.8 * Math.min(1.04, lk));
      logo.group.rotation.set(0.08 * Math.sin(t * 1.1), (1 - Math.min(1, lk)) * -2.2 + 0.12 * Math.sin(t * 0.9), 0);
      logo.sweep.value = lerp(-2.2, 2.4, ease.inOutCubic(seg(t, E.logo + 0.6, E.logo + 1.6)));
    }

    // ---- caméra
    const cp = camAt(t);
    camera.position.copy(cp.pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(cp.tgt);
    // dernière mesure : léger roulis alterné à chaque temps
    if (t >= E.s1 && t < E.logo) {
      const n = [E.s1, E.s2, E.s3, E.s4].filter((x) => t >= x).length;
      camera.rotateZ((n % 2 ? 1 : -1) * 0.035 * (1 - decay(t, [E.s1, E.s2, E.s3, E.s4][n - 1], 8)));
    }
    camera.fov = cp.fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    shotState.focus = camera.position.distanceTo(rig.position);

    // ---- fond : cercle qui s'ouvre depuis le téléphone
    let i = 0;
    while (i + 1 < BG.length && t >= BG[i + 1][0]) i++;
    const [at, col] = BG[i];
    const prevCol = i > 0 ? BG[i - 1][1] : col;
    const ph = (t >= E.logo ? V(0, 0.7, 0) : rig.position.clone()).project(camera);
    bgU.uC.value.set((ph.x + 1) / 2, (ph.y + 1) / 2);
    bgU.uRes.value.set(renderer.domElement.width, renderer.domElement.height);
    bgU.uFrom.value.set(prevCol);
    bgU.uTo.value.set(col);
    bgU.uR.value = at < 0 ? 3 : ease.outCubic(seg(t, at, at + 0.28)) * 1.6;
    // la lumière d'ambiance prend un peu la couleur du fond
    hemi.color.set(col).lerp(new THREE.Color('#ffffff'), 0.6);

    // ---- étalonnage
    const hits = [E.snap, E.game, E.lock, E.quiz, E.plus15, E.spin, E.pick, E.chart, E.s1, E.s2, E.s3, E.s4, E.logo];
    const hit = hits.reduce((s, x) => s + (t >= x ? decay(t, x, 12) : 0), 0);
    const post = {
      time: t,
      focus: shotState.focus,
      aperture: t < E.snap ? 0.35 : 0.14,
      maxBlur: 16,
      exposure: 1.05,
      bloom: 0.16 + decay(t, E.snap, 6) * (t >= E.snap ? 0.5 : 0),
      bloomRadius: 0.5,
      threshold: 0.9,
      vignette: t < E.snap ? 0.6 : 0.32,
      grain: 0.025,
      ca: 0.003 + hit * 0.05,
      zoom: hit * 0.28 + (t >= E.spin && t < E.spin + 0.5 ? Math.sin(seg(t, E.spin, E.spin + 0.5) * Math.PI) * 0.5 : 0),
      zoomCenter: new THREE.Vector2(0.5, 0.5),
      flash: t >= E.snap ? decay(t, E.snap, 16) * 0.75 : 0,
      flashCol: '#FFFFFF',
      fade: 0,
      sat: 1.04,
    };
    return { post, anchors };
  }

  /** Flou de bougé (export) : sous-images sur les mouvements rapides. */
  function subframes(t) {
    const near = (a, b) => t >= a && t < b;
    if (near(E.spin - 0.02, E.spin + 0.5)) return 6;
    if (near(E.snap - 0.14, E.snap + 0.12) || near(E.splash, E.splash + 0.4) || near(E.logo - 0.15, E.logo + 0.4)) return 4;
    if ([E.lock, E.quiz, E.plus15, E.s1, E.s2, E.s3, E.s4, E.chips, E.notif].some((x) => near(x - 0.02, x + 0.22))) return 3;
    return 1;
  }

  return {
    update,
    subframes,
    showAll(on) {
      for (const s of shards) s.mesh.visible = on;
      cards.forEach((c) => (c.group.visible = on));
      plus.group.visible = logo.group.visible = tube.visible = on;
    },
    env: null,
  };
}
