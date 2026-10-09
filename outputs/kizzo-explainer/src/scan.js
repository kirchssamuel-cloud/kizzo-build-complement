// Scène du scan : le parent photographie la leçon dans le cahier, l'IA en tire
// 3 questions, le parent choisit la fréquence des quiz (10/15/20/30 min) et envoie.
import * as THREE from 'three';
import { T, SC, SCAN0, SCAN1 } from './config.js';
import { clamp, lerp, seg, ease, springT, pulse, decay } from './util.js';
import { createDevice } from './devices.js';
import { CanvasTex, SCREEN_W, SCREEN_H, rr, txt, disp } from './ui-canvas.js';
import { notebookPage, NOTE_PX, NOTE_LINES, K, P, photoScreen, cameraScreen, readScreen, questionsScreen, autoQuizScreen, wrap } from './ui-kizzo.js';
import { icon } from './ui-canvas.js';
import { makeGlow, makeShockwave, fxMaterial, setFX, roundedSlab } from './materials.js';
import { createBurst, createTrail } from './fx.js';
import { F_BODY, F_NUM } from './ui-canvas.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const _a = V(), _b = V();

export function createScan() {
  const O = V(60, 0, 0); // monde isolé du reste du film
  const root = new THREE.Group();
  root.position.copy(O);

  // ---------------------------------------------------------------- cahier
  const PW = 1.6, PH = (PW * NOTE_PX[1]) / NOTE_PX[0];
  const pageTex = new CanvasTex(NOTE_PX[0], NOTE_PX[1], 2);
  const note = new THREE.Group();
  note.position.set(0, -1.0, 0);
  note.rotation.set(-1.05, 0.08, -0.05);
  root.add(note);
  const paperMat = new THREE.MeshPhysicalMaterial({ color: '#f3efe4', roughness: 0.92 });
  const block = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, 0.05), paperMat);
  block.position.z = -0.025;
  block.castShadow = true;
  block.receiveShadow = true;
  const cover = new THREE.Mesh(roundedSlab(PW + 0.08, PH + 0.08, 0.035, 0.04, 0.012), new THREE.MeshPhysicalMaterial({ color: '#F97316', roughness: 0.55, clearcoat: 0.4 }));
  cover.position.z = -0.07;
  cover.castShadow = true;
  const page = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: pageTex.texture, roughness: 0.9 }));
  page.position.z = 0.0015;
  page.receiveShadow = true;
  note.add(block, cover, page);
  const ringMat = new THREE.MeshPhysicalMaterial({ color: '#d7dde5', metalness: 1, roughness: 0.25 });
  for (let i = 0; i < 15; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.011, 8, 24), ringMat);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(-PW / 2 + 0.01, PH / 2 - 0.1 - i * ((PH - 0.2) / 14), -0.02);
    ring.castShadow = true;
    note.add(ring);
  }
  // laser de scan sur la page
  const laser = new THREE.Mesh(new THREE.PlaneGeometry(PW * 1.04, 0.05), glowLineMaterial('#FFE6D6', 4));
  const laserTrail = new THREE.Mesh(new THREE.PlaneGeometry(PW * 1.04, 0.32), glowLineMaterial('#EC6A2C', 1.3, true));
  laser.position.z = laserTrail.position.z = 0.006;
  setFX(laser);
  setFX(laserTrail);
  note.add(laserTrail, laser);
  const pageFlash = makeGlow('#E6F8FF', 0, 3.2, { power: 1.6 });
  pageFlash.position.z = 0.1;
  note.add(pageFlash);

  // ---------------------------------------------------------------- téléphone parent
  const scrTex = new CanvasTex(SCREEN_W, SCREEN_H, 2.2);
  const phone = createDevice({ screenTexture: scrTex.texture, frame: '#C9CED6', back: '#F28A3C', brightness: 1.0 });
  root.add(phone.group);
  const camLight = makeGlow('#ffffff', 0, 0.5, { core: 1.5 });
  phone.group.add(camLight);
  camLight.position.set(-0.17, 0.5, -0.06);
  // faisceau du capteur vers la page (pyramide lumineuse)
  const beam = new THREE.Mesh(new THREE.BufferGeometry(), beamMaterial());
  beam.frustumCulled = false;
  setFX(beam);
  root.add(beam);

  // ---------------------------------------------------------------- bandes de texte détectées -> questions
  let strips = [];
  function buildStrips() {
    // construit après le chargement des polices : les blocs de texte réels sont alors connus
    if (strips.length || !NOTE_LINES.length) return;
    strips = NOTE_LINES.map(([x, y, w, h]) => {
      const tex = pageTex.texture.clone();
      tex.repeat.set((w + 16) / NOTE_PX[0], h / NOTE_PX[1]);
      tex.offset.set((x - 8) / NOTE_PX[0], 1 - (y + h) / NOTE_PX[1]);
      const ww = ((w + 16) / NOTE_PX[0]) * PW, hh = (h / NOTE_PX[1]) * PH;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }));
      m.userData.local = V(((x - 8 + (w + 16) / 2) / NOTE_PX[0]) * PW - PW / 2, PH / 2 - ((y + h / 2) / NOTE_PX[1]) * PH, 0.01);
      const glow = makeGlow('#3db4d9', 0, Math.max(ww, hh) * 1.2, { power: 2.5 });
      m.add(glow);
      m.userData.glow = glow;
      root.add(m);
      return m;
    });
  }

  const miniTex = [0, 1, 2].map((i) => {
    const ct = new CanvasTex(300, 170, 2.5);
    ct.draw('m', (c, w, h) => miniQuiz(c, w, h, i));
    return ct;
  });
  const miniGeo = roundedSlab(0.86, 0.49, 0.03, 0.07, 0.01);
  const minis = miniTex.map((ct, i) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(miniGeo, new THREE.MeshPhysicalMaterial({ color: '#F4F8FA', roughness: 0.35, clearcoat: 1 }));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.49), new THREE.MeshBasicMaterial({ map: ct.texture, transparent: true, toneMapped: false, depthWrite: false }));
    face.position.z = 0.017;
    const glow = makeGlow('#7FD3EC', 0.4, 1.3, { power: 3 });
    glow.position.z = -0.05;
    g.add(body, face, glow);
    g.userData.glow = glow;
    root.add(g);
    return g;
  });
  const miniBursts = [0, 1, 2].map((i) => createBurst({ count: 40, seed: 200 + i, speed: 1.0, size: 6, life: 0.8, colors: ['#ffffff', '#3db4d9', '#f97316'] }));
  miniBursts.forEach((b) => root.add(b.object));

  // ---------------------------------------------------------------- sélecteur de fréquence 3D
  const selTex = new CanvasTex(520, 120, 2.5);
  selTex.draw('s', (c, w, h) => selectorFace(c, w, h));
  const sel = new THREE.Group();
  const selBody = new THREE.Mesh(roundedSlab(1.56, 0.36, 0.05, 0.12, 0.015), new THREE.MeshPhysicalMaterial({ color: '#DCE6EB', roughness: 0.45, clearcoat: 0.6, envMapIntensity: 0.6 }));
  const selFace = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 0.36), new THREE.MeshBasicMaterial({ map: selTex.texture, transparent: true, toneMapped: false, depthWrite: false }));
  selFace.position.z = 0.027;
  const knobTex = new CanvasTex(120, 90, 3);
  const knob = new THREE.Group();
  const knobBody = new THREE.Mesh(roundedSlab(0.34, 0.27, 0.06, 0.09, 0.02), new THREE.MeshPhysicalMaterial({ color: '#39A7C6', roughness: 0.25, clearcoat: 1, emissive: new THREE.Color('#39A7C6'), emissiveIntensity: 0.2 }));
  const knobFace = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.27), new THREE.MeshBasicMaterial({ map: knobTex.texture, transparent: true, toneMapped: false, depthWrite: false }));
  knobFace.position.z = 0.032;
  const knobGlow = makeGlow('#2cbfed', 0.35, 0.7, { power: 2.4 });
  knobGlow.position.z = -0.03;
  knob.add(knobBody, knobFace, knobGlow);
  knob.position.z = 0.05;
  const selLabelTex = new CanvasTex(520, 70, 2.5);
  selLabelTex.draw('l', (c, w, h) => txt(c, T.scan.freqLabel, w / 2, 46, disp({ size: 34, weight: 700, align: 'center' })));
  const selLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 0.21), new THREE.MeshBasicMaterial({ map: selLabelTex.texture, transparent: true, toneMapped: false, depthWrite: false }));
  selLabel.position.set(0, 0.34, 0.02);
  const selWave = makeShockwave('#ffffff');
  selWave.material.uniforms.uIntensity.value = 1.2;
  selWave.position.z = 0.09;
  void selLabel;
  sel.add(selBody, selFace, knob, selWave);
  root.add(sel);
  const sendBurst = createBurst({ count: 90, seed: 300, speed: 1.8, size: 7, colors: ['#ffffff', '#3db4d9', '#1ed760'] });
  root.add(sendBurst.object);
  const sendTrails = [0, 1, 2].map((i) => {
    const curve = new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.3, 0.3, 0.6), V(0, 0.2, 1.4), V(0, 0, 2.4)]);
    const tr = createTrail(curve, { color: ['#3db4d9', '#7fd3ec', '#f97316'][i], color2: '#ffffff', radius: 0.012, tail: 0.5 });
    root.add(tr.mesh);
    return tr;
  });

  // ---------------------------------------------------------------- mise à jour
  const phonePos = V(0.0, -0.13, 0.5);
  const phoneRot = new THREE.Euler(-1.02, 0.1, -0.06);
  const camOff = V();

  function update(T0, out) {
    const vis = T0 >= SCAN0 && T0 < SCAN1;
    root.visible = vis;
    if (!vis) return null;
    const t = T0;
    // téléphone qui "respire" au-dessus du cahier
    phone.group.position.copy(phonePos).add(_a.set(Math.sin(t * 1.1) * 0.01, Math.sin(t * 1.4) * 0.015, 0));
    phone.group.rotation.copy(phoneRot);
    phone.group.rotation.z += Math.sin(t * 0.8) * 0.01;
    root.updateMatrixWorld(true);

    // ------------------------------------------------ caméra
    const pIn = ease.outExpo(seg(t, SCAN0, SCAN0 + 1.1));
    const screenW = phone.group.localToWorld(_a.set(0, 0, phone.dims.front)).clone();
    const nW = V(0, 0, 1).applyQuaternion(phone.group.getWorldQuaternion(new THREE.Quaternion()));
    const p0 = screenW.clone().addScaledVector(nW, 0.75);
    const pA = O.clone().add(V(0.85, 2.85, 3.7));
    const pB = O.clone().add(V(0.35, 2.3, 4.3));
    const pC = O.clone().add(V(-0.1, 1.55, 4.1));
    const lA = O.clone().add(V(0.05, -0.35, 0.3));
    const lC = O.clone().add(V(0.0, 0.35, 0.9));
    const kB = ease.inOutSine(seg(t, 6.0, 9.0));
    const kC = ease.inOutCubic(seg(t, 9.6, 10.6));
    const kPush = ease.inCubic(seg(t, SC.send + 0.2, SCAN1));
    let pos = p0.clone().lerp(pA, pIn).lerp(pB, kB).lerp(pC, kC);
    let look = screenW.clone().lerp(lA, pIn).lerp(lC, kC);
    pos.lerp(O.clone().add(V(0, 1.1, 2.4)), kPush * 0.85);
    pos.x += Math.sin(t * 0.5) * 0.08;
    out.pos.copy(pos);
    out.look.copy(look);
    out.fov = lerp(30, 36, pIn) - kPush * 6;
    out.roll = Math.sin(t * 0.4) * 0.01 + kPush * 0.03;
    const focusTarget = t < SC.freq[0] ? screenW : O.clone().add(V(0.0, 0.6, 0.8));
    out.focus = out.pos.distanceTo(focusTarget);
    out.aperture = 0.5;


    // états
    const kScan = seg(t, SC.scan[0], SC.scan[1]);
    const shutter = pulse(t, SC.shutter, 0.08);
    const kAn = seg(t, SC.analyze[0], SC.analyze[1]);
    const selPos = springT(t - SC.freqTap, { stiffness: 220, damping: 15 });
    const press = pulse(t, SC.send, 0.08);
    const sent = t > SC.send + 0.14 ? 1 : 0;
    const tapOpen = seg(t, SC.openTap, SC.openTap + 0.4);
    const tapGen = seg(t, SC.genTap, SC.genTap + 0.4);
    const screens = [
      [SCAN0, (c, w, h) => photoScreen(c, w, h, { thumb: 0, tapOpen })],
      [SC.photo[1], (c, w, h) => cameraScreen(c, w, h, { scan: kScan, shutter, t })],
      [SC.photo2[0], (c, w, h) => photoScreen(c, w, h, { thumb: ease.outCubic(seg(t, SC.photo2[0], SC.photo2[0] + 0.25)), chipSel: seg(t, SC.photo2[0] + 0.1, SC.photo2[0] + 0.15), tapGen })],
      [SC.analyze[0], (c, w, h) => readScreen(c, w, h, { k: ease.inOutSine(kAn), t })],
      [SC.review[0], (c, w, h) => questionsScreen(c, w, h, { scroll: ease.inOutCubic(seg(t, SC.review[0] + 0.35, SC.review[1])) * 230, reveal: seg(t, SC.review[0], SC.review[0] + 0.5) })],
      [SC.freq[0], (c, w, h) => autoQuizScreen(c, w, h, { sel: selPos, press, sent, tap: seg(t, SC.freqTap - 0.02, SC.freqTap + 0.45), wave: seg(t, SC.send + 0.14, SC.send + 0.9) })],
    ];
    let si = 0;
    for (let i = 0; i < screens.length; i++) if (t >= screens[i][0]) si = i;
    const xf = si > 0 ? seg(t, screens[si][0], screens[si][0] + 0.16) : 1;
    scrTex.draw(`${si}|${(t * 30) | 0}`, (c, w, h) => {
      if (xf < 1) {
        screens[si - 1][1](c, w, h);
        c.save();
        c.globalAlpha = xf;
        screens[si][1](c, w, h);
        c.restore();
      } else screens[si][1](c, w, h);
    });
    pageTex.draw(`${Math.round(clamp(kScan * 1.15 - 0.1) * 40)}`, (c, w, h) => notebookPage(c, w, h, { hl: clamp(kScan * 1.15 - 0.1) }));
    phone.displayMat.color.setScalar(1 + shutter * 0.6);

    // laser sur la page
    laser.visible = laserTrail.visible = kScan > 0 && kScan < 1;
    const ly = PH / 2 - 0.08 - (PH - 0.16) * ease.inOutSine(kScan);
    laser.position.y = ly;
    laserTrail.position.y = ly + 0.16;
    pageFlash.material.uniforms.uIntensity.value = shutter * 2.2;
    camLight.material.uniforms.uIntensity.value = 0.4 * (kScan > 0 && kScan < 1 ? 1 : 0) + shutter * 3;
    // faisceau (pyramide capteur -> page)
    const bk = clamp(seg(t, SC.scan[0] - 0.3, SC.scan[0]) * (1 - seg(t, SC.shutter, SC.shutter + 0.4)));
    beam.visible = bk > 0.001;
    if (beam.visible) {
      updateBeam(beam, phone.group.localToWorld(_a.set(-0.17, 0.5, -0.06)).sub(O), note, PW, PH, O);
      beam.material.uniforms.uIntensity.value = bk * 0.55;
      beam.material.uniforms.uT.value = t;
    }

    // bandes de texte qui s'envolent vers les questions
    const cardHome = (i) => V((i - 1) * 0.56, 1.05 + (i === 1 ? 0.12 : 0), 0.55 + (i === 1 ? 0.05 : 0));
    buildStrips();
    strips.forEach((m, i) => {
      const st = SC.analyze[0] + 0.05 + i * 0.08;
      const k = seg(t, st, st + 0.8);
      m.visible = k > 0 && k < 1;
      if (!m.visible) return;
      const kk = ease.inOutCubic(k);
      const start = note.localToWorld(_b.copy(m.userData.local)).sub(O);
      const end = cardHome(i % 3);
      const mid = start.clone().lerp(end, 0.5).add(V(0, 0.45, 0.15));
      const p = start.clone().multiplyScalar((1 - kk) * (1 - kk)).addScaledVector(mid, 2 * kk * (1 - kk)).addScaledVector(end, kk * kk);
      m.position.copy(p);
      m.quaternion.copy(note.quaternion).slerp(cameraFacing(out.pos, p.clone().add(O)), ease.outCubic(k));
      m.scale.setScalar(lerp(0.9, 0.25, ease.inCubic(k)));
      m.material.opacity = 0.7 * Math.min(1, k * 6) * (1 - ease.inCubic(seg(k, 0.7, 1)));
      m.userData.glow.material.uniforms.uIntensity.value = 0.2 + Math.sin(k * Math.PI) * 0.4;
    });
    // mini-cartes de questions
    const screenLocal = phone.group.localToWorld(_b.set(0, 0, phone.dims.front + 0.02)).sub(O).clone();
    minis.forEach((g, i) => {
      const st = SC.analyze[0] + 0.72 + i * 0.12;
      const ks = springT(t - st, { stiffness: 150, damping: 11 });
      // les questions rejoignent l'écran « Questions générées »
      const kin = ease.inCubic(seg(t, SC.review[0] - 0.1 + i * 0.06, SC.review[0] + 0.32 + i * 0.06));
      g.visible = t > st && kin < 0.999;
      const home = cardHome(i);
      g.scale.setScalar(Math.max(0.0001, 0.62 * ks * (1 - kin * 0.85)));
      g.position.copy(home).add(V(Math.sin(t * 1.3 + i) * 0.015, Math.sin(t * 1.7 + i * 2) * 0.02, 0));
      g.position.lerp(screenLocal, kin);
      g.quaternion.copy(cameraFacing(out.pos, g.position.clone().add(O)));
      g.rotateZ((i - 1) * -0.14 * (1 - kin));
      g.userData.glow.material.uniforms.uIntensity.value = 0.18 + decay(t, st, 3) * 0.8;
      miniBursts[i].object.position.copy(home);
      miniBursts[i].set(t - st);
    });
    // sélecteur de fréquence
    const ksel = springT(t - SC.freq[0], { stiffness: 140, damping: 13 });
    const out2 = ease.inCubic(seg(t, SC.send + 0.05, SC.send + 0.5));
    sel.visible = t > SC.freq[0] && out2 < 1;
    sel.position.set(0.0, 0.66, 1.0);
    sel.quaternion.copy(cameraFacing(out.pos, sel.position.clone().add(O)));
    sel.scale.setScalar(Math.max(0.0001, 0.5 * ksel * (1 - out2)));
    const cw = 1.56 / 4;
    knob.position.x = -1.56 / 2 + cw * (0.5 + selPos);
    knob.scale.setScalar(1 + pulse(t, SC.freqTap, 0.1) * 0.12);
    knobTex.draw(selPos > 0.5 ? '15' : '10', (c, w, h) => drawKnob(c, w, h, selPos > 0.5 ? T.scan.freqOpts[1] : T.scan.freqOpts[0]));
    const wv = seg(t, SC.freqTap - 0.02, SC.freqTap + 0.5);
    selWave.visible = wv > 0 && wv < 1;
    selWave.position.x = knob.position.x;
    selWave.scale.setScalar(0.2 + wv * 1.2);
    selWave.material.uniforms.uK.value = wv;
    // envoi
    sendBurst.object.position.copy(screenLocal);
    sendBurst.set(t - SC.send);
    sendTrails.forEach((tr, i) => {
      const st = SC.send + 0.1 + i * 0.06;
      const k = seg(t, st, SC1(i));
      tr.mesh.visible = k > 0 && k < 1;
      if (!tr.mesh.visible) return;
      tr.mesh.position.copy(screenLocal).add(V((i - 1) * 0.25, 0.1, 0));
      tr.mesh.lookAt(out.pos);
      tr.mat.uniforms.uHead.value = ease.inCubic(k);
      tr.mat.uniforms.uIntensity.value = 2.6;
    });

    return {
      flashIn: decay(t, SCAN0, 5.5) * 0.95,
      flashOut: ease.inExpo(seg(t, SCAN1 - 0.45, SCAN1)) * 0.9,
      zoom: decay(t, SCAN0, 4) * 0.8 + ease.inCubic(seg(t, SCAN1 - 0.6, SCAN1)) * 0.8,
      shutter,
    };
  }

  function SC1(i) {
    return SCAN1 - 0.12 + i * 0.03;
  }

  return { root, update, phone };
}

// ---------------------------------------------------------------------------

function cameraFacing(camPos, objPos) {
  const m = new THREE.Matrix4().lookAt(camPos, objPos, V(0, 1, 0));
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

function glowLineMaterial(color, intensity, soft = false) {
  return fxMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uIntensity: { value: intensity } },
    vertex: /* glsl */ `
      varying vec2 vUv; varying float vViewZ;
      void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vViewZ = mv.z; gl_Position = projectionMatrix * mv; }
    `,
    fragment: soft
      ? /* glsl */ `
      uniform vec3 uColor; uniform float uIntensity; varying vec2 vUv; varying float vViewZ;
      void main() {
        float a = pow(vUv.y, 2.0) * smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
        gl_FragColor = vec4(uColor * a * uIntensity * fxDepthFade(vViewZ, 0.05), 1.0);
      }`
      : /* glsl */ `
      uniform vec3 uColor; uniform float uIntensity; varying vec2 vUv; varying float vViewZ;
      void main() {
        float a = exp(-pow((vUv.y - 0.5) * 6.0, 2.0)) * smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x);
        gl_FragColor = vec4(uColor * a * uIntensity * fxDepthFade(vViewZ, 0.05), 1.0);
      }`,
    side: THREE.DoubleSide,
  });
}

function beamMaterial() {
  return fxMaterial({
    uniforms: { uIntensity: { value: 0 }, uT: { value: 0 }, uColor: { value: new THREE.Color('#5fc6e6') } },
    vertex: /* glsl */ `
      varying vec2 vUv; varying float vViewZ;
      void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vViewZ = mv.z; gl_Position = projectionMatrix * mv; }
    `,
    fragment: /* glsl */ `
      uniform float uIntensity, uT; uniform vec3 uColor; varying vec2 vUv; varying float vViewZ;
      void main() {
        float edge = smoothstep(0.82, 1.0, abs(vUv.x * 2.0 - 1.0)) * 0.9 + 0.12;
        float along = mix(0.35, 1.0, vUv.y);
        float lines = 0.8 + 0.2 * smoothstep(0.45, 0.5, fract(vUv.y * 18.0 - uT * 1.5));
        gl_FragColor = vec4(uColor * edge * along * lines * uIntensity * fxDepthFade(vViewZ, 0.2), 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}

/** Pyramide ouverte : sommet (capteur) -> 4 coins de la page. */
function updateBeam(mesh, apexLocal, note, PW, PH, O) {
  const corners = [
    [-PW / 2, PH / 2],
    [PW / 2, PH / 2],
    [PW / 2, -PH / 2],
    [-PW / 2, -PH / 2],
  ].map(([x, y]) => note.localToWorld(V(x * 0.96, y * 0.96, 0.004)).sub(O));
  const s = 0.04;
  const apex = [V(-s, s, 0), V(s, s, 0), V(s, -s, 0), V(-s, -s, 0)].map((d) => d.add(apexLocal));
  const pos = [];
  const uv = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const q = [corners[i], corners[j], apex[j], apex[i]];
    const u = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    for (const k of [0, 1, 2, 0, 2, 3]) {
      pos.push(q[k].x, q[k].y, q[k].z);
      uv.push(u[k][0], u[k][1]);
    }
  }
  mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  mesh.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  mesh.geometry.attributes.position.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Faces dessinées

function miniQuiz(ctx, W, H, i) {
  // carte « Questions générées » (capture réelle) : fond blanc, QUESTION n cyan, bonne réponse verte
  const q = T.quiz.items[i];
  ctx.fillStyle = '#FFFFFF';
  rr(ctx, 0, 0, W, H, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(16,43,59,0.08)';
  ctx.lineWidth = 2;
  rr(ctx, 1, 1, W - 2, H - 2, 21);
  ctx.stroke();
  txt(ctx, T.scan.question(i + 1), 18, 30, { size: 13, weight: 500, color: P.cyan, ls: 0.6, font: F_BODY });
  wrap(ctx, q.q, 18, 58, W - 36, 21, disp({ size: 16.5, weight: 700, color: P.ink }));
  ctx.fillStyle = '#E4F2EA';
  rr(ctx, 18, H - 50, W - 36, 34, 12);
  ctx.fill();
  ctx.strokeStyle = '#7CC59C';
  ctx.lineWidth = 1.8;
  rr(ctx, 18, H - 50, W - 36, 34, 12);
  ctx.stroke();
  txt(ctx, q.a[q.ok], 32, H - 28, { size: 14.5, weight: 600, color: P.ink, font: F_BODY });
  icon.check(ctx, W - 46, H - 44, 22, P.green, 2.8);
}

function selectorFace(ctx, W, H) {
  ctx.fillStyle = 'rgba(30,41,59,0.0)';
  ctx.fillRect(0, 0, W, H);
  const cw = W / 4;
  T.scan.freqOpts.forEach((o, i) => {
    txt(ctx, o, cw * (i + 0.5), H / 2 + 8, { size: 40, weight: 700, color: '#102B3B', align: 'center', font: F_NUM });
    txt(ctx, T.scan.min, cw * (i + 0.5), H / 2 + 36, { size: 16, weight: 600, color: '#6F818B', align: 'center', font: F_BODY });
  });
}

function drawKnob(ctx, W, H, v) {
  txt(ctx, v, W / 2, H / 2 + 6, { size: 38, weight: 700, color: '#ffffff', align: 'center', font: F_NUM });
  txt(ctx, T.scan.min, W / 2, H / 2 + 30, { size: 14, weight: 700, color: 'rgba(255,255,255,0.9)', align: 'center', font: F_BODY });
}

