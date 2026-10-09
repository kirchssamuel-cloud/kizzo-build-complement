// La mise en scène : construction de tous les plans + update(t) pur (aucun état
// accumulé). Plans : A enfant & compte à rebours · B app Kizzo · C quiz · D récompense
// · E parent & traînées lumineuses · F logo.
import * as THREE from 'three';
import { TL, T, BRAND } from './config.js';
import { clamp, lerp, seg, ease, springT, pulse, decay, wobble, rng, TAU } from './util.js';
import { createEnvironment } from './env.js';
import { createDevice } from './devices.js';
import { createKid } from './kid.js';
import * as UI from './ui-canvas.js';
import { makeGlow, makeShockwave, makeGodRays, makeStreak, roundedSlab, shadowPlane } from './materials.js';
import { createBurst, createConfetti, createProgressRing, createTrail, createHoloCone } from './fx.js';
import { createLogo3D, createPlus15 } from './logo3d.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const _a = V(), _b = V(), _c = V();
const _q = new THREE.Quaternion();
const GREEN = new THREE.Color('#22C55E');
const GREY = new THREE.Color('#9EADC2');

export function createStory(renderer, scene, camera) {
  const env = createEnvironment(renderer, scene);
  const { CanvasTex, SCREEN_W, SCREEN_H } = UI;

  // ===========================================================================
  // PLAN A — l'enfant, le téléphone, la tablette, le compte à rebours
  const worldA = new THREE.Group();
  scene.add(worldA);
  const kid = createKid();
  worldA.add(kid.group);
  const texPhoneA = new CanvasTex(SCREEN_W, SCREEN_H, 1.6);
  const phoneA = createDevice({ screenTexture: texPhoneA.texture, frame: '#D3D9E1', back: '#E9EEF4', brightness: 1.05 });
  phoneA.group.scale.setScalar(0.8);
  worldA.add(phoneA.group);
  const texTabA = new CanvasTex(UI.TABLET_DIM[0], UI.TABLET_DIM[1], 1.5);
  const tabletA = createDevice({ w: 2.06, h: 1.44, d: 0.06, r: 0.1, bezel: 0.065, camera: 'tablet', screenTexture: texTabA.texture, frame: '#B7BFCA', back: '#CBD2DB', brightness: 1.0 });
  tabletA.group.scale.setScalar(1.15);
  worldA.add(tabletA.group);
  const waveA = makeShockwave('#FFB27A');
  const waveA2 = makeShockwave('#7FD3EC');
  const glowA = makeGlow('#FF7A2E', 0, 1.4);
  const revealGlow = makeGlow('#CDEFFF', 0, 2.2, { power: 1.6, core: 1 });
  worldA.add(waveA, waveA2, glowA, revealGlow);
  const TAPS = [
    [0.22, 120, 560],
    [0.58, 262, 470],
    [0.95, 150, 380],
    [1.33, 280, 610],
    [1.72, 112, 500],
    [2.1, 240, 420],
  ];
  const phoneAS = V(), phoneAN = V(), headPos = V(), eye = V();
  const TABLET_POS = V(), TABLET_LOOK = V();

  // ===========================================================================
  // ESPACE KIZZO — téléphone enfant héros (plans B à E)
  const texKidBase = new CanvasTex(SCREEN_W, SCREEN_H, 2.4);
  texKidBase.draw('base', (c, w, h) => UI.drawKidAppBase(c, w, h));
  const texQuizPhone = new CanvasTex(SCREEN_W, SCREEN_H, 2);
  const texUnlocked = new CanvasTex(SCREEN_W, SCREEN_H, 2.0);
  const child = createDevice({ screenTexture: texKidBase.texture, frame: '#D3D9E1', back: '#E9EEF4', brightness: 1.0 });
  scene.add(child.group);
  const kpx = child.dims.sw / SCREEN_W; // monde par pixel logique

  function makeLayer(dev, px, py, pw, ph, draw, scale = 2.6) {
    const ct = new CanvasTex(pw, ph, scale);
    ct.draw('init', draw);
    const k = dev.dims.sw / SCREEN_W;
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ map: ct.texture, transparent: true, alphaToCoverage: true, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(pw * k, ph * k), mat);
    const sh = shadowPlane(pw * k, ph * k, 0);
    const home = dev.screenToLocal(px + pw / 2, py + ph / 2, SCREEN_W, SCREEN_H, 0.0015);
    sh.position.copy(home);
    sh.position.z = dev.dims.front + 0.0025;
    g.add(mesh);
    g.position.copy(home);
    dev.group.add(g, sh);
    return { g, mesh, mat, sh, home, ct, w: pw * k, h: ph * k };
  }

  const kidLayers = [
    makeLayer(child, 0, 64, 390, 96, (c, w, h) => UI.drawKidHeader(c, w, h)),
    makeLayer(child, 20, 186, 350, 196, (c, w, h) => UI.drawKidLockCard(c, w, h)),
    makeLayer(child, 20, 398, 350, 150, (c, w, h) => UI.drawKidQuestCard(c, w, h)),
    makeLayer(child, 18, 566, 114, 52, (c, w, h) => UI.drawKidChip(c, w, h, 0)),
    makeLayer(child, 138, 566, 114, 52, (c, w, h) => UI.drawKidChip(c, w, h, 1)),
    makeLayer(child, 258, 566, 114, 52, (c, w, h) => UI.drawKidChip(c, w, h, 2)),
    makeLayer(child, 45, 690, 300, 80, (c, w, h) => UI.drawKidCTA(c, w, h, 0)),
  ];
  const LIFT = [0.06, 0.12, 0.18, 0.24, 0.26, 0.24, 0.3];
  const ctaLayer = kidLayers[6];
  const ctaTap = makeShockwave('#FFFFFF');
  ctaTap.material.uniforms.uIntensity.value = 1.2;
  ctaLayer.g.add(ctaTap);
  ctaTap.position.z = 0.01;

  // Icônes holographiques en orbite
  const holo = new THREE.Group();
  scene.add(holo);
  const holoCols = ['#F97316', '#3DB5DA', '#A78BFA', '#34D399', '#FAB43B', '#7FD3EC'];
  const holoIcons = holoCols.map((col, i) => {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.115, 0.03, 48),
      new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.18, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.78, emissive: new THREE.Color(col), emissiveIntensity: 0.35 })
    );
    disc.rotation.x = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.008, 12, 64), new THREE.MeshPhysicalMaterial({ color: '#E2E8F0', metalness: 1, roughness: 0.2 }));
    const ct = new CanvasTex(64, 64, 4);
    ct.draw('i', (c, w, h) => UI.drawHoloIcon(c, w, h, i));
    const ic = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshBasicMaterial({ map: ct.texture, transparent: true, toneMapped: false, depthWrite: false }));
    ic.material.color.setScalar(1.6);
    ic.position.z = 0.02;
    const glow = makeGlow(col, 0.7, 0.55);
    glow.position.z = -0.05;
    g.add(disc, rim, ic, glow);
    holo.add(g);
    return { g, disc, glow };
  });
  // anneau holographique sous le téléphone
  const holoRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.006, 12, 128),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#7FD3EC').multiplyScalar(1.5), toneMapped: false })
  );
  holoRing.rotation.x = Math.PI / 2;
  const holoRing2 = holoRing.clone();
  holoRing2.scale.setScalar(1.35);
  holoRing2.material = holoRing.material.clone();
  holoRing2.material.color.set('#F97316').multiplyScalar(0.9);
  const holoRingGlow = makeGlow('#3DB5DA', 0.5, 2.0);
  holo.add(holoRing, holoRing2, holoRingGlow);

  // ===========================================================================
  // PLAN C — quiz
  const quiz = new THREE.Group();
  scene.add(quiz);
  const ring = createProgressRing(1.08);
  quiz.add(ring.group);
  const cone = createHoloCone();
  child.group.add(cone.mesh);
  cone.mesh.rotation.x = Math.PI / 2;
  cone.mesh.position.z = child.dims.front + 0.01;

  const cardMat = () =>
    new THREE.MeshPhysicalMaterial({ color: '#EEF2F7', roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.18, sheen: 0.3, sheenColor: new THREE.Color('#E0F2FE') });
  const CARD = [1.52, 0.98];
  const cardGeo = roundedSlab(CARD[0], CARD[1], 0.06, 0.09, 0.02);
  const tileGeo = roundedSlab(0.72, 0.236, 0.05, 0.118, 0.018);
  const TILE_POS = [
    [-0.385, -0.1],
    [0.385, -0.1],
    [-0.385, -0.39],
    [0.385, -0.39],
  ];
  const CARD_HOME = V(0, 0.64, 0);
  const cards = T.quiz.map((q, i) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(cardGeo, cardMat());
    body.castShadow = true;
    const ct = new CanvasTex(UI.CARD_PX[0], UI.CARD_PX[1], 3);
    ct.draw('q', (c, w, h) => UI.drawQuizCard(c, w, h, i));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(CARD[0], CARD[1]), new THREE.MeshBasicMaterial({ map: ct.texture, transparent: true, toneMapped: false, depthWrite: false }));
    face.position.z = 0.032;
    const edgeGlow = makeGlow(['#F97316', '#3DB5DA', '#A78BFA'][i], 0, 2.4, { power: 3 });
    edgeGlow.position.z = -0.12;
    g.add(body, face, edgeGlow);
    quiz.add(g);
    const tiles = q.a.map((label, j) => {
      const tg = new THREE.Group();
      const mat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08, emissive: new THREE.Color('#22C55E'), emissiveIntensity: 0 });
      const tb = new THREE.Mesh(tileGeo, mat);
      tb.castShadow = true;
      const mk = (state) => {
        const t2 = new CanvasTex(UI.TILE_PX[0], UI.TILE_PX[1], 3);
        t2.draw('l', (c, w, h) => UI.drawTile(c, w, h, label, state));
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.236), new THREE.MeshBasicMaterial({ map: t2.texture, transparent: true, toneMapped: false, depthWrite: false }));
        m.position.z = 0.027;
        return m;
      };
      const ln = mk(0), lw = mk(1);
      lw.material.opacity = 0;
      tg.add(tb, ln, lw);
      g.parent.add(tg);
      return { g: tg, mat, ln, lw, ok: j === q.ok };
    });
    return { g, body, face, ct, tiles, edgeGlow };
  });
  // badge de validation
  const badgeTex = new CanvasTex(64, 64, 4);
  badgeTex.draw('b', (c, w, h) => UI.drawCheckBadge(c, w, h));
  const badges = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.062, 40), new THREE.MeshBasicMaterial({ map: badgeTex.texture, transparent: true, toneMapped: false }));
    m.material.color.setScalar(1.15);
    quiz.add(m);
    return m;
  });
  // planète (Q2)
  const planetTex = new CanvasTex(256, 128, 2);
  planetTex.draw('p', (c, w, h) => UI.drawPlanet(c, w, h));
  const planet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 48, 32), new THREE.MeshStandardMaterial({ map: planetTex.texture, roughness: 0.85, metalness: 0 }));
  planet.castShadow = true;
  cards[1].g.add(planet);
  const planetGlow = makeGlow('#FF7A3D', 0.6, 0.6);
  cards[1].g.add(planetGlow);
  // doigt (toucher) + ondulations
  const finger = makeGlow('#FFFFFF', 0, 0.22, { power: 1.4, core: 1.5 });
  const tapWave = makeShockwave('#FFFFFF');
  quiz.add(finger, tapWave);
  // gerbes
  const quizBursts = [0, 1, 2].map((i) => createBurst({ count: 80, seed: 30 + i, speed: 1.9, size: 7, colors: ['#FFFFFF', '#4ADE80', '#3DB5DA', '#F97316'] }));
  const lockBurst = createBurst({ count: 70, seed: 41, speed: 1.6, size: 7, colors: ['#FFFFFF', '#4ADE80', '#FAB43B'] });
  [...quizBursts, lockBurst].forEach((b) => quiz.add(b.object));
  const lockGlow = makeGlow('#B9F5CF', 0, 1.2, { core: 1 });
  quiz.add(lockGlow);
  const ringWave = makeShockwave('#FFD7B5');
  quiz.add(ringWave);

  // ===========================================================================
  // PLAN D — récompense
  const reward = new THREE.Group();
  scene.add(reward);
  const plus = createPlus15();
  reward.add(plus.group);
  const rays = makeGodRays('#FFB27A', '#7FD3EC', 22);
  reward.add(rays);
  const confetti = createConfetti(170, 9);
  scene.add(confetti.object);
  const bigBurst = createBurst({ count: 150, seed: 77, speed: 3.4, life: 1.5, size: 7, colors: ['#FFFFFF', '#F97316', '#FAB43B', '#3DB5DA'], up: 0.2, drag: 2.0, gravity: 0.9 });
  bigBurst.mat.uniforms.uIntensity.value = 0.8;
  reward.add(bigBurst.object);
  const flare = makeGlow('#FFD2A8', 0, 1.6, { power: 2.8, core: 0.8 });
  const streak = makeStreak('#FFC59A', 0, 7, 0.22);
  const rewardWave = makeShockwave('#FF9D5C');
  const rewardWave2 = makeShockwave('#7FD3EC');
  reward.add(flare, streak, rewardWave, rewardWave2);
  const plusLight = new THREE.PointLight('#FF8A3D', 0, 5, 1.5);
  reward.add(plusLight);
  const mergeBurst = createBurst({ count: 90, seed: 13, speed: 1.5, size: 7, colors: ['#FFFFFF', '#F97316', '#FAB43B'] });
  scene.add(mergeBurst.object);

  // ===========================================================================
  // PLAN E — parent
  const texParentBase = new CanvasTex(SCREEN_W, SCREEN_H, 2.4);
  texParentBase.draw('base', (c, w, h) => UI.drawParentBase(c, w, h));
  const parent = createDevice({ screenTexture: texParentBase.texture, frame: '#3A4458', back: '#1C2539', brightness: 1.0 });
  scene.add(parent.group);
  const pLayers = [
    makeLayer(parent, 20, 140, 350, 150, (c, w, h) => UI.drawParentLimit(c, w, h, 1)),
    makeLayer(parent, 20, 304, 350, 178, (c, w, h) => UI.drawParentSchedule(c, w, h, 1)),
    makeLayer(parent, 20, 496, 350, 170, (c, w, h) => UI.drawParentUsage(c, w, h)),
    makeLayer(parent, 20, 680, 350, 92, (c, w, h) => UI.drawParentLearning(c, w, h)),
  ];
  const P_LIFT = [0.16, 0.26, 0.2, 0.12];
  // barres 3D de la carte "cette semaine"
  const usage = pLayers[2];
  const BARS = [0.55, 0.82, 0.64, 0.92, 0.5, 0.72, 0.42];
  const barMatC = new THREE.MeshPhysicalMaterial({ color: '#3DB5DA', roughness: 0.25, clearcoat: 1, emissive: new THREE.Color('#3DB5DA'), emissiveIntensity: 0.25 });
  const barMatO = new THREE.MeshPhysicalMaterial({ color: '#F97316', roughness: 0.25, clearcoat: 1, emissive: new THREE.Color('#F97316'), emissiveIntensity: 0.6 });
  const barGeo = new THREE.BoxGeometry(1, 1, 1);
  barGeo.translate(0, 0.5, 0);
  const bars = BARS.map((h, i) => {
    const m = new THREE.Mesh(barGeo, i === 6 ? barMatO : barMatC);
    const lx = (20 + 44 + i * 44 - 195) * kpx;
    const by = (581 - 640) * kpx;
    m.position.set(lx, by, 0.012);
    m.userData.h = h * 82 * kpx;
    m.castShadow = true;
    usage.g.add(m);
    return m;
  });
  // puces de règles (sources des traînées)
  const CHIP = [214, 44];
  const chips = [0, 1, 2].map((i) => {
    const ct = new CanvasTex(CHIP[0], CHIP[1], 3);
    ct.draw('c', (c, w, h) => UI.drawRuleChip(c, w, h, i));
    const k = kpx;
    const g = new THREE.Group();
    const body = new THREE.Mesh(roundedSlab(CHIP[0] * k, CHIP[1] * k, 0.025, (CHIP[1] * k) / 2, 0.01), new THREE.MeshPhysicalMaterial({ color: '#141E33', roughness: 0.3, clearcoat: 1, metalness: 0.2 }));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(CHIP[0] * k, CHIP[1] * k), new THREE.MeshBasicMaterial({ map: ct.texture, transparent: true, toneMapped: false, depthWrite: false }));
    face.position.z = 0.014;
    face.material.color.setScalar(1.1);
    const glow = makeGlow([BRAND.cyan, '#A78BFA', BRAND.orange][i], 0, 0.6);
    g.add(body, face, glow);
    parent.group.add(g);
    return { g, glow, w: CHIP[0] * k };
  });
  const CHIP_HOME = [V(0.5, 0.46, 0.5), V(0.56, 0.24, 0.6), V(0.5, 0.02, 0.7)];
  const trailsGroup = new THREE.Group();
  scene.add(trailsGroup);
  let trails = [];
  const trailHeads = [0, 1, 2].map((i) => makeGlow(['#7FD3EC', '#C4B5FD', '#FFB27A'][i], 0, 0.32, { core: 1.4 }));
  trailHeads.forEach((h) => trailsGroup.add(h));
  const arriveBursts = [0, 1, 2].map((i) => createBurst({ count: 40, seed: 60 + i, speed: 1.0, size: 6, life: 0.8, colors: ['#FFFFFF', ['#3DB5DA', '#A78BFA', '#F97316'][i]] }));
  arriveBursts.forEach((b) => trailsGroup.add(b.object));
  const childGlow = makeGlow('#7FD3EC', 0, 1.6);
  scene.add(childGlow);

  // ===========================================================================
  // PLAN F — logo
  const logoWorld = new THREE.Group();
  scene.add(logoWorld);
  const logo = createLogo3D();
  const LOGO_POS = V(0, 0.52, 0);
  const LOGO_SCALE = 1.45;
  logo.group.position.copy(LOGO_POS);
  logo.group.scale.setScalar(LOGO_SCALE);
  logoWorld.add(logo.group);
  const logoRays = makeGodRays('#7FD3EC', '#FFB27A', 26);
  logoRays.position.set(0, 0.52, -0.8);
  logoRays.scale.setScalar(7.5);
  const logoFlare = makeGlow('#E0F7FF', 0, 3.5, { power: 2.2, core: 1 });
  logoFlare.position.set(0, 0.52, 0.3);
  const logoStreak = makeStreak('#BDEBFA', 0, 8, 0.2);
  logoStreak.position.set(0, 0.52, 0.35);
  const logoWave = makeShockwave('#7FD3EC');
  const logoWave2 = makeShockwave('#FF9D5C');
  logoWave.position.set(0, 0.52, -0.1);
  logoWave2.position.set(0, 0.52, -0.1);
  const logoBurst = createBurst({ count: 160, seed: 91, speed: 2.6, life: 1.6, size: 8, colors: ['#FFFFFF', '#3DB5DA', '#F97316'], up: 0.1, drag: 2.2, gravity: 0.25 });
  logoBurst.object.position.copy(LOGO_POS);
  const logoUnderGlow = makeGlow('#3DB5DA', 0, 4, { power: 2.5 });
  logoUnderGlow.position.set(0, -0.8, -0.2);
  logoWorld.add(logoRays, logoFlare, logoStreak, logoWave, logoWave2, logoBurst.object, logoUnderGlow);
  // trajectoires d'assemblage (courbes en monde) + traînées
  const parts = [
    { m: logo.body, from: V(-0.95, -1.45, 1.5), mid: V(-0.7, -0.4, 2.0), t0: 25.35, t1: 26.5, spin: V(1.2, -2.2, 0.6), col: '#7FD3EC' },
    { m: logo.head, from: V(-0.85, 2.05, 0.9), mid: V(-0.6, 1.4, 1.7), t0: 25.5, t1: 26.72, spin: V(-1.5, 1.4, 2), col: '#7FD3EC' },
    { m: logo.child, from: V(1.0, 1.45, 1.1), mid: V(0.75, 1.2, 1.9), t0: 25.62, t1: TL.logoLock, spin: V(0.8, 2.6, -1.2), col: '#FFB27A' },
  ];
  // noyau d'énergie qui se charge au centre pendant l'assemblage
  const core = makeGlow('#CFF3FF', 0, 1.2, { power: 2.2, core: 1.4 });
  core.position.set(0, 0.52, 0.2);
  const coreRing = makeShockwave('#7FD3EC');
  coreRing.position.set(0, 0.52, -0.05);
  logo.group.updateMatrixWorld(true);
  for (const p of parts) {
    const home = logo.group.localToWorld(p.m.userData.home.clone());
    p.homeW = home;
    p.curve = new THREE.CatmullRomCurve3([p.from, p.mid, home.clone().add(V(0, 0, 0.9)), home], false, 'centripetal');
    p.trail = createTrail(p.curve, { color: p.col, color2: '#FFFFFF', radius: 0.01, tail: 0.32 });
    logoWorld.add(p.trail.mesh);
  }

  // ===========================================================================
  // Helpers de mise à jour

  const lift = (t, t0, stiffness = 120, damping = 14) => springT(t - t0, { stiffness, damping });

  function warpA(t) {
    // temps "gelé" : ralentit jusqu'à quasi-arrêt après le zéro
    if (t <= TL.zero) return t;
    const a = TL.zero;
    const n = 24;
    let acc = 0;
    const dt = (Math.min(t, 6) - a) / n;
    for (let i = 0; i < n; i++) {
      const x = a + (i + 0.5) * dt;
      acc += (1 - 0.92 * ease.outCubic(seg(x, a, a + 0.6))) * dt;
    }
    return a + acc;
  }

  // ---------------------------------------------------------------------------
  function updateA(t, out) {
    const vis = t < TL.flash;
    worldA.visible = vis;
    if (!vis) return;
    kid.group.position.y = Math.sin(t * 1.1) * 0.03;
    const sad = ease.inOutCubic(seg(t, 2.55, 3.6));
    let tapK = 0;
    for (const [tt] of TAPS) tapK = Math.max(tapK, pulse(t, tt + 0.03, 0.09));
    kid.update(t, sad, tapK);
    kid.group.updateMatrixWorld(true);
    kid.phoneAnchor.getWorldPosition(_a);
    kid.head.getWorldPosition(headPos);
    eye.copy(headPos).add(_b.set(0, -0.1, 0.45));
    phoneA.group.position.copy(_a);
    // l'écran est légèrement tourné vers la caméra (la tête ne masque jamais l'écran)
    phoneA.group.lookAt(_b.copy(eye).add(_c.set(2.0, 0.0, -0.4)));
    phoneA.group.updateMatrixWorld(true);
    // les mains tiennent le téléphone par les bords, derrière l'écran
    const hw = phoneA.dims.w / 2, hh = phoneA.dims.h / 2;
    kid.setHands(
      _a.set(-hw + 0.02, -hh * 0.42 + tapK * 0.01, -0.1).applyMatrix4(phoneA.group.matrixWorld),
      _b.set(hw - 0.02, -hh * 0.5 + tapK * 0.02, -0.1).applyMatrix4(phoneA.group.matrixWorld)
    );
    phoneAS.set(0, 0, phoneA.dims.front).applyMatrix4(phoneA.group.matrixWorld);
    phoneAN.set(0, 0, 1).applyQuaternion(phoneA.group.quaternion);

    tabletA.group.position.copy(TABLET_POS).add(_b.set(0, Math.sin(t * 0.9) * 0.05, 0));
    tabletA.group.lookAt(TABLET_LOOK);
    tabletA.group.rotateZ(-0.06 + Math.sin(t * 0.5) * 0.02);

    const passed = TL.ticks.filter((x) => t >= x).length;
    const remain = 3 - passed;
    const tickPulse = Math.max(...TL.ticks.map((x) => decay(t, x, 7)));
    const urgency = clamp(seg(t, 0.4, TL.zero) * 0.85 + tickPulse * 0.3);
    const freeze = ease.outCubic(seg(t, TL.zero, TL.zero + 0.75));
    const lockK = ease.outBack(seg(t, 2.72, 3.12), 2.2);
    const reveal = ease.inQuad(seg(t, 4.2, TL.flash));
    const gt = warpA(t);
    const taps = TAPS.map(([tt, x, y]) => ({ age: t - tt, x, y }));
    const sA = { t: gt, remain, urgency, freeze, lockK, taps, reveal };
    // écrans du plan A rafraîchis à 30 Hz (fluide à l'œil, deux fois moins d'uploads GPU)
    const frameKey = String(Math.floor(t * 30));
    texPhoneA.draw(frameKey, (c, w, h) => UI.drawKidPhoneA(c, w, h, sA));
    texTabA.draw(frameKey, (c, w, h) => UI.drawTabletA(c, w, h, sA));

    // onde au zéro
    const wk = seg(t, TL.zero, TL.zero + 1.1);
    for (const [w, d, s] of [
      [waveA, 0, 9],
      [waveA2, 0.12, 7],
    ]) {
      const k = seg(t, TL.zero + d, TL.zero + d + 1.1);
      w.visible = k > 0 && k < 1;
      w.position.copy(phoneAS).addScaledVector(phoneAN, 0.02);
      w.quaternion.copy(phoneA.group.quaternion);
      w.scale.setScalar(0.3 + s * ease.outCubic(k));
      w.material.uniforms.uK.value = k;
      w.material.uniforms.uIntensity.value = 1.1;
    }
    void wk;
    glowA.position.copy(phoneAS).addScaledVector(phoneAN, 0.05);
    glowA.material.uniforms.uIntensity.value = (tickPulse * 0.35 + urgency * 0.06) * (1 - freeze) + decay(t, TL.zero, 6) * 0.45;
    revealGlow.position.copy(phoneAS).addScaledVector(phoneAN, 0.03);
    revealGlow.material.uniforms.uIntensity.value = reveal * reveal * 5;
    revealGlow.scale.setScalar(0.6 + reveal * 2.5);

    // caméra
    // plan large de profil -> arc jusqu'à l'axe de l'écran -> travelling avant dans l'écran
    const k1 = ease.inOutSine(seg(t, 0, 3.0));
    const dirA = V(0.86, 0.33, -0.39).lerp(phoneAN, k1).normalize();
    const distA = lerp(8.6, 3.4, ease.inOutCubic(k1));
    const tgtA = V(-0.2, 1.55, 1.3).lerp(phoneAS, k1);
    const p1 = tgtA.clone().addScaledVector(dirA, distA);
    const l1 = tgtA.clone();
    const k2 = ease.inQuart(seg(t, 2.55, TL.flash));
    const p2 = phoneAS.clone().addScaledVector(phoneAN, 0.62);
    out.pos.copy(p1).lerp(p2, k2);
    out.look.copy(l1).lerp(phoneAS, k2);
    out.fov = lerp(lerp(37, 33, k1), 24, k2);
    out.roll = Math.sin(t * 0.5) * 0.012 - k2 * 0.06;
    out.focus = out.pos.distanceTo(phoneAS);
    out.aperture = lerp(0.75, 0.35, k2);
    out.zoom = ease.inCubic(seg(t, 4.5, TL.flash)) * 0.7;
    out.ca = 0.012 + ease.inCubic(seg(t, 4.4, TL.flash)) * 0.2;
    out.flash = ease.inExpo(seg(t, 4.62, TL.flash)) * 0.88;
    out.sat = 1 - freeze * 0.35 + reveal * 0.35;
    out.shake = 0;
  }

  // ---------------------------------------------------------------------------
  // Téléphone enfant : trajectoire unique de B à F (continuité de l'objet héros)
  function childTransform(t, pos, rot) {
    // B : flotte face caméra
    pos.set(0, 0.06 + Math.sin(t * 1.2) * 0.025, 0);
    rot.set(Math.sin(t * 0.8) * 0.03, -0.18 * ease.inOutSine(seg(t, 4.95, 6.6)) + Math.sin(t * 0.6) * 0.04, Math.sin(t * 0.7) * 0.015);
    // B -> C : le téléphone se couche et devient un projecteur
    const kc = ease.inOutCubic(seg(t, TL.toQuiz[0], TL.toQuiz[1]));
    if (kc > 0) {
      pos.lerp(_a.set(0, -1.36, 0.3), kc);
      rot.x = lerp(rot.x, -1.22, kc);
      rot.y = lerp(rot.y, 0, kc);
      rot.z = lerp(rot.z, 0, kc);
    }
    // D : il tombe hors champ pendant l'explosion, puis revient déverrouillé
    const kd = ease.inCubic(seg(t, 15.98, 16.5));
    if (kd > 0) pos.y -= kd * 2.4;
    const kr = ease.outCubic(seg(t, TL.toPhone[0], TL.toPhone[1] + 0.25));
    if (t >= TL.toPhone[0]) {
      pos.set(0, lerp(-3.4, 0.02, kr) + Math.sin(t * 1.2) * 0.02 * kr, lerp(0.6, 0, kr));
      rot.set(lerp(-0.9, 0.0, kr) + Math.sin(t * 0.8) * 0.02, lerp(0.5, 0, kr) + Math.sin(t * 0.6) * 0.03, 0);
    }
    // E : recule en haut à droite pour laisser entrer le téléphone parent
    const ke = ease.inOutCubic(seg(t, TL.parentIn[0], TL.parentIn[1]));
    if (ke > 0) {
      pos.lerp(_a.set(0.66, 0.62, -1.95), ke);
      rot.x = lerp(rot.x, 0.02, ke);
      rot.y = lerp(rot.y, -0.4, ke);
    }
    // F : s'éloigne dans l'obscurité
    const kf = ease.inCubic(seg(t, TL.converge[0], TL.converge[1]));
    if (kf > 0) {
      pos.lerp(_a.set(2.6, 1.9, -4.5), kf);
      rot.y -= kf * 0.6;
    }
  }

  const drift = (t) => _c.set(Math.sin(t * 0.45) * 0.02, Math.sin(t * 0.7) * 0.025, 0);

  function updateChild(t) {
    const vis = t >= TL.flash && t < TL.converge[1] + 0.1;
    child.group.visible = vis;
    holo.visible = vis && t < TL.toQuiz[1] + 0.2;
    if (!vis) return;
    const rot = new THREE.Euler();
    childTransform(t, child.group.position, rot);
    if (t > TL.parentIn[1]) child.group.position.add(drift(t));
    child.group.rotation.copy(rot);

    // écran
    if (t < 8.72) child.setScreen(texKidBase.texture);
    else if (t < TL.toPhone[0]) {
      child.setScreen(texQuizPhone.texture);
      const done = TL.q.filter((q) => t > q.tap + 0.1).length;
      const qi = TL.q.filter((q) => t > q.in).length - 1;
      texQuizPhone.draw(`${done}-${qi}`, (c, w, h) => UI.drawQuizPhone(c, w, h, { done, q: Math.max(0, qi) }));
    } else {
      child.setScreen(texUnlocked.texture);
      const ring = ease.outCubic(seg(t, TL.toPhone[1] - 0.1, TL.toPhone[1] + 0.7));
      const minutes = Math.round(15 * ring);
      const synced = TL.trails.reduce((s, tt) => s + ease.outCubic(seg(t, tt + TL.trailDur, tt + TL.trailDur + 0.35)), 0);
      const pz = decay(t, TL.toPhone[1], 3) + TL.trails.reduce((s, tt) => s + decay(t, tt + TL.trailDur, 5) * 0.6, 0);
      const key = `${minutes}|${(Math.round(ring * 40) / 40).toFixed(3)}|${(Math.round(synced * 20) / 20).toFixed(2)}|${(Math.round(Math.min(1, pz) * 16) / 16).toFixed(3)}`;
      texUnlocked.draw(key, (c, w, h) => UI.drawKidUnlocked(c, w, h, { minutes, ring, synced, pulse: Math.min(1, pz) }));
    }
    const dim = 1 - ease.inCubic(seg(t, TL.converge[0], TL.converge[1])) * 0.85;
    child.displayMat.color.setScalar(dim * (1 + decay(t, TL.flash, 2.5) * 0.4));

    // calques qui émergent (B)
    const exit = ease.inCubic(seg(t, TL.toQuiz[0], TL.toQuiz[0] + 0.7));
    kidLayers.forEach((L, i) => {
      const st = TL.emerge[0] + i * 0.13;
      const k = lift(t, st, 110, 13);
      const z = LIFT[i] * k;
      L.g.position.copy(L.home);
      L.g.position.z += z;
      const bob = Math.sin(t * 1.4 + i * 0.8) * 0.012 * k;
      L.g.position.y += bob;
      L.g.rotation.set(Math.sin(t * 0.9 + i) * 0.04 * k, Math.sin(t * 0.7 + i * 1.3) * 0.05 * k, 0);
      L.g.scale.setScalar(1 + 0.03 * k);
      // sortie : les calques s'envolent vers la caméra
      if (exit > 0) {
        const dir = i % 2 ? 1 : -1;
        L.g.position.x += dir * exit * (0.6 + i * 0.12);
        L.g.position.z += exit * (1.2 + i * 0.25);
        L.g.position.y += (i - 3) * exit * 0.15;
        L.g.rotation.y += dir * exit * 0.8;
      }
      L.mat.opacity = 1 - exit;
      L.g.visible = t < TL.toQuiz[0] + 0.72;
      L.sh.visible = L.g.visible;
      L.sh.material.opacity = 0.55 * Math.min(1, k) * (1 - exit);
      L.sh.position.x = L.home.x + 0.01 * k;
      L.sh.position.y = L.home.y - 0.035 * k;
      L.sh.scale.setScalar(1 + z * 0.6);
    });
    // bouton pressé
    const press = pulse(t, TL.cta + 0.06, 0.12);
    ctaLayer.g.position.z -= press * 0.08;
    ctaLayer.ct.draw(press > 0.5 ? 'p' : 'n', (c, w, h) => UI.drawKidCTA(c, w, h, press > 0.5 ? 1 : 0));
    const ck = seg(t, TL.cta, TL.cta + 0.6);
    ctaTap.visible = ck > 0 && ck < 1;
    ctaTap.scale.setScalar(0.2 + ck * 1.6);
    ctaTap.material.uniforms.uK.value = ck;

    // icônes holo en orbite
    if (holo.visible) {
      child.group.updateMatrixWorld(true);
      const center = _b.set(0, 0.06, 0);
      holoIcons.forEach((h, i) => {
        const st = 5.55 + i * 0.1;
        const k = lift(t, st, 90, 11);
        const a = (i / holoIcons.length) * TAU + t * 0.38;
        const rx = 0.98 + (i % 2) * 0.12, rz = 0.62;
        h.g.position.set(center.x + Math.cos(a) * rx * k, center.y + (i - 2.5) * 0.24 + Math.sin(t * 0.9 + i) * 0.05, center.z + Math.sin(a) * rz * k);
        const ex = exit;
        h.g.position.multiplyScalar(1 + ex * 1.8);
        h.g.scale.setScalar(Math.max(0.0001, k * (1 - ex)));
        h.g.lookAt(camera.position);
        h.glow.material.uniforms.uIntensity.value = 0.6 + Math.sin(t * 3 + i) * 0.2;
      });
      const rk = lift(t, 5.4, 80, 10) * (1 - exit);
      holoRing.position.set(0, -0.98, 0);
      holoRing2.position.set(0, -0.98, 0);
      holoRing.scale.setScalar(Math.max(0.0001, rk * (1 + Math.sin(t * 2) * 0.03)));
      holoRing2.scale.setScalar(Math.max(0.0001, rk * 1.35 * (1 + Math.sin(t * 2 + 1) * 0.03)));
      holoRing2.rotation.z = t * 0.5;
      holoRingGlow.position.set(0, -0.98, 0);
      holoRingGlow.material.uniforms.uIntensity.value = 0.45 * rk;
    }

    // cône holographique (C)
    const ck2 = ease.outCubic(seg(t, 8.9, 9.5)) * (1 - ease.inCubic(seg(t, 15.95, 16.3)));
    cone.mesh.visible = ck2 > 0.001;
    cone.mat.uniforms.uIntensity.value = ck2 * 0.9;
    cone.mat.uniforms.uT.value = t;
  }

  // ---------------------------------------------------------------------------
  function tileHome(j) {
    return V(TILE_POS[j][0], TILE_POS[j][1], 0.05);
  }

  function updateQuiz(t) {
    const vis = t > 8.85 && t < 17.3;
    quiz.visible = vis;
    if (!vis) return;
    // anneau de progression (halo derrière les cartes)
    const rk = ease.outCubic(seg(t, 9.0, 9.8));
    const toFront = ease.inOutCubic(seg(t, 15.98, 16.6));
    const shrink = ease.inCubic(seg(t, TL.toPhone[0] + 0.05, TL.toPhone[0] + 0.6));
    ring.group.position.set(0, lerp(0.3, 0.44, toFront), lerp(-0.78, -0.25, toFront));
    ring.group.scale.setScalar(Math.max(0.0001, (0.85 + 0.15 * rk) * lerp(1, 1.12, toFront) * (1 - shrink)));
    ring.group.visible = rk > 0.001 && shrink < 0.999;
    ring.group.rotation.set(Math.sin(t * 0.4) * 0.05, Math.sin(t * 0.3) * 0.08, 0);
    let fill = 0;
    TL.q.forEach((q, i) => {
      const a = i < 2 ? q.tap + 0.15 : TL.lockIn[1] + 0.05;
      const b = i < 2 ? q.tap + 0.6 : TL.ringDone;
      fill += ease.inOutCubic(seg(t, a, b)) / 3;
    });
    ring.fillMat.uniforms.uFill.value = fill;
    ring.fillMat.uniforms.uTime.value = t;
    ring.fillMat.uniforms.uFlash.value = decay(t, TL.ringDone, 4) * 0.3 + (t > TL.ringDone ? 0.15 + Math.sin(t * 6) * 0.05 : 0);
    ring.fillMat.uniforms.uIntensity.value = 2.6 * rk;
    const rw = seg(t, TL.ringDone, TL.ringDone + 0.9);
    ringWave.visible = rw > 0 && rw < 1;
    ringWave.position.copy(ring.group.position);
    ringWave.scale.setScalar(2.2 + rw * 5);
    ringWave.material.uniforms.uK.value = rw;
    ringWave.material.uniforms.uIntensity.value = 1.6;

    const scatter = ease.inCubic(seg(t, TL.ringDone + 0.02, TL.ringDone + 0.42));

    cards.forEach((c, i) => {
      const q = TL.q[i];
      const vis2 = t > q.in - 0.05 && t < (i < 2 ? q.out + 0.5 : TL.burst + 0.6);
      c.g.visible = vis2;
      c.tiles.forEach((tl) => (tl.g.visible = vis2));
      if (!vis2) return;
      // entrée depuis le projecteur
      const kp = ease.outCubic(seg(t, q.in, q.in + 0.6));
      const ks = springT(t - q.in, { stiffness: 150, damping: 13 });
      const from = V(0, -1.05, 0.35);
      c.g.position.lerpVectors(from, CARD_HOME, kp);
      c.g.position.y += Math.sin(t * 1.3 + i) * 0.015;
      c.g.scale.setScalar(Math.max(0.0001, lerp(0.25, 1, ks)));
      c.g.rotation.set(lerp(-1.15, 0, ks) + Math.sin(t * 0.8) * 0.02, Math.sin(t * 0.6 + i) * 0.05, 0);
      c.edgeGlow.material.uniforms.uIntensity.value = (decay(t, q.in + 0.15, 4) * 0.5 + 0.08) * kp;
      // sortie (Q1, Q2)
      if (i < 2) {
        const ko = ease.inCubic(seg(t, q.out, q.out + 0.48));
        c.g.position.x += ko * 2.8;
        c.g.position.z -= ko * 0.6;
        c.g.rotation.y += ko * 1.3;
        c.g.rotation.z -= ko * 0.2;
      } else if (scatter > 0) {
        c.g.position.add(_a.set(0.2, 2.8, -1.2).multiplyScalar(scatter));
        c.g.rotation.x -= scatter * 1.4;
        c.g.rotation.z += scatter * 0.5;
        c.g.scale.multiplyScalar(1 - scatter * 0.5);
      }
      c.g.updateMatrix();
      // carte 3 : l'emplacement devient vert une fois la réponse verrouillée
      if (i === 2) {
        const locked = t >= TL.lockIn[1];
        c.ct.draw(locked ? 'L' : 'q', (cx, w, h) => {
          UI.drawQuizCard(cx, w, h, 2);
          if (locked) {
            cx.save();
            cx.fillStyle = 'rgba(34,197,94,0.12)';
            cx.strokeStyle = '#22C55E';
            cx.lineWidth = 3;
            UI.rr(cx, 26, 162, 190, 56, 18);
            cx.fill();
            cx.stroke();
            cx.restore();
          }
        });
      }
      // planète
      if (i === 1) {
        const pk = springT(t - (q.in + 0.35), { stiffness: 130, damping: 10 });
        planet.position.set(0.5, 0.1, 0.03 + 0.2 * pk);
        planet.scale.setScalar(Math.max(0.0001, pk));
        planet.rotation.set(0.35, t * 0.9, 0.1);
        planetGlow.position.copy(planet.position).add(_a.set(0, 0, -0.12));
        planetGlow.material.uniforms.uIntensity.value = 0.5 * pk;
      }
      // tuiles
      c.tiles.forEach((tl, j) => {
        const st = q.in + 0.22 + j * 0.07;
        const k = springT(t - st, { stiffness: 160, damping: 14 });
        const home = tileHome(j).add(_a.set(0, 0, 0));
        const p = tl.g.position;
        p.lerpVectors(_b.set(home.x * 0.4, home.y + 0.25, -0.35), home, Math.min(1, k * 1.05));
        tl.g.scale.setScalar(Math.max(0.0001, lerp(0.4, 1, k)));
        tl.g.rotation.set(lerp(0.8, 0, k), 0, 0);
        const sel = tl.ok ? ease.outBack(seg(t, q.tap, q.tap + 0.32), 2.4) : 0;
        const dimK = tl.ok ? 0 : ease.outCubic(seg(t, q.tap + 0.05, q.tap + 0.35));
        p.z += sel * 0.1 - dimK * 0.08;
        tl.g.scale.multiplyScalar(1 + sel * 0.07 - dimK * 0.06);
        const green = clamp(sel);
        tl.mat.color.set('#EEF2F7').lerp(GREEN, green).lerp(GREY, dimK * 0.6);
        tl.mat.emissiveIntensity = green * (0.35 + decay(t, q.tap, 4) * 1.2);
        tl.lw.material.opacity = green;
        tl.ln.material.opacity = 1 - green;
        // anticipation : léger survol avant le tap
        if (tl.ok) p.z += pulse(t, q.tap - 0.22, 0.2) * 0.03;
        // sortie
        if (i < 2) {
          const ko = ease.inCubic(seg(t, q.out, q.out + 0.48));
          if (tl.ok) {
            p.x += ko * 2.8;
            p.z -= ko * 0.6;
          } else {
            const kf = ease.inCubic(seg(t, q.tap + 0.45, q.tap + 0.95));
            p.y -= kf * 1.6;
            tl.g.scale.multiplyScalar(Math.max(0.0001, 1 - kf));
          }
        } else {
          if (tl.ok) {
            // verrouillage dans l'emplacement de la carte
            const kl = ease.inOutCubic(seg(t, TL.lockIn[0], TL.lockIn[1]));
            const slot = _b.set(-0.276, -0.27, 0.06).applyMatrix4(c.g.matrix);
            const snap = 1 + Math.sin(seg(t, TL.lockIn[1], TL.lockIn[1] + 0.35) * Math.PI * 2) * decay(t, TL.lockIn[1], 6) * 0.06;
            p.lerp(slot, kl);
            tl.g.scale.multiplyScalar(lerp(1, 1.0, kl) * snap);
            tl.g.rotation.x += Math.sin(kl * Math.PI) * 0.3;
            if (scatter > 0) {
              p.add(_a.set(0.2, 2.8, -1.2).multiplyScalar(scatter));
              tl.g.scale.multiplyScalar(1 - scatter * 0.5);
            }
          } else {
            const kf = ease.inCubic(seg(t, q.tap + 0.4, q.tap + 0.9));
            p.y -= kf * 1.6;
            tl.g.scale.multiplyScalar(Math.max(0.0001, 1 - kf));
          }
        }
      });
      c.g.updateMatrix();
    });

    // badges
    badges.forEach((b, i) => {
      const q = TL.q[i];
      const tl = cards[i].tiles.find((x) => x.ok);
      const k = springT(t - (q.tap + 0.12), { stiffness: 220, damping: 12 });
      const out = i < 2 ? ease.inCubic(seg(t, q.out, q.out + 0.3)) : ease.inCubic(seg(t, TL.lockIn[0], TL.lockIn[0] + 0.2));
      b.visible = t > q.tap + 0.1 && out < 1 && tl.g.visible;
      b.position.copy(tl.g.position).add(_a.set(0.33, 0.1, 0.05));
      b.scale.setScalar(Math.max(0.0001, k * (1 - out)));
    });

    // doigt + onde de toucher
    let fv = 0;
    TL.q.forEach((q, i) => {
      const tl = cards[i].tiles.find((x) => x.ok);
      const k = seg(t, q.tap - 0.55, q.tap);
      if (t > q.tap - 0.55 && t < q.tap + 0.3) {
        const target = tl.g.position;
        const from = _a.set(target.x + 0.9, target.y - 0.9, target.z + 0.5);
        finger.position.lerpVectors(from, _b.copy(target).add(_c.set(0.05, -0.02, 0.08)), ease.outCubic(k));
        fv = (t < q.tap ? ease.outCubic(k) : 1 - seg(t, q.tap, q.tap + 0.3)) * (1 + pulse(t, q.tap, 0.06) * 2);
      }
      const w = seg(t, q.tap, q.tap + 0.55);
      if (w > 0 && w < 1) {
        tapWave.position.copy(tl.g.position).add(_a.set(0, 0, 0.06));
        tapWave.scale.setScalar(0.15 + w * 1.1);
        tapWave.material.uniforms.uK.value = w;
      }
    });
    finger.visible = fv > 0.001;
    finger.material.uniforms.uIntensity.value = fv * 1.6;
    tapWave.visible = TL.q.some((q) => t > q.tap && t < q.tap + 0.55);

    // gerbes
    quizBursts.forEach((b, i) => {
      const j = cards[i].tiles.findIndex((x) => x.ok);
      b.object.position.copy(tileHome(j)).add(_a.set(0, 0, 0.12));
      b.set(t - (TL.q[i].tap + 0.04));
    });
    const lt = cards[2].tiles.find((x) => x.ok);
    lockBurst.object.position.copy(lt.g.position);
    lockBurst.set(t - TL.lockIn[1]);
    lockGlow.position.copy(lt.g.position).add(_a.set(0, 0, 0.1));
    lockGlow.material.uniforms.uIntensity.value = decay(t, TL.lockIn[1], 5) * 1.3;
    lockGlow.visible = t > TL.lockIn[1];
  }

  // ---------------------------------------------------------------------------
  const REW = V(0, 0.44, 0.22);
  function updateReward(t) {
    const vis = t > TL.ringDone - 0.1 && t < TL.toPhone[1] + 0.3;
    reward.visible = vis;
    const cAge = t - TL.burst;
    confetti.set(cAge, _a.set(0, 0.44, 0.1));
    mergeBurst.set(t - TL.toPhone[1]);
    mergeBurst.object.position.set(0, 0.1, 0.12);
    if (!vis) return;
    // "+15"
    const k = seg(t, TL.burst, TL.burst + 0.75);
    const kz = ease.outExpo(k);
    const ksc = springT(t - TL.burst, { stiffness: 120, damping: 9 });
    const km = ease.inCubic(seg(t, TL.toPhone[0] + 0.05, TL.toPhone[1] - 0.15));
    const g = plus.group;
    g.visible = t > TL.burst && km < 0.999;
    g.position.set(REW.x, REW.y + Math.sin(t * 1.5) * 0.03 * kz, lerp(-4.5, REW.z, kz));
    g.position.lerp(_a.set(0, 0.12, 0.12), km);
    const s = 0.62 * Math.max(0.0001, ksc) * (1 - km * 0.88);
    g.scale.setScalar(s);
    g.rotation.set(Math.sin(t * 1.1) * 0.06 * kz, lerp(-1.4, 0, ease.outCubic(seg(t, TL.burst, TL.burst + 0.9))) + Math.sin((t - TL.burst) * 1.2) * 0.2 * kz, Math.sin(t * 0.9) * 0.03);
    plus.face.emissiveIntensity = 0.18 + decay(t, TL.burst + 0.2, 3) * 0.6;
    plusLight.position.set(0, 0.44, 0.9);
    plusLight.intensity = (1.0 + decay(t, TL.burst + 0.3, 2) * 2.5) * seg(t, TL.burst + 0.2, TL.burst + 0.5) * (1 - km);
    // rayons + éclat
    const rk = ease.outCubic(seg(t, TL.burst + 0.2, TL.burst + 0.7)) * (1 - ease.inCubic(seg(t, TL.toPhone[0], TL.toPhone[0] + 0.6)));
    rays.position.set(0, 0.44, -0.9);
    rays.scale.setScalar(7.5);
    rays.material.uniforms.uIntensity.value = rk * (0.32 + decay(t, TL.burst + 0.2, 2.2) * 0.3);
    rays.material.uniforms.uRot.value = t * 0.12;
    flare.position.set(0, 0.44, 0.5);
    flare.material.uniforms.uIntensity.value = decay(t, TL.burst + 0.25, 4) * 0.7 * (t > TL.burst + 0.25 ? 1 : 0) + decay(t, TL.ringDone, 8) * 0.35;
    streak.position.set(0, 0.44, 0.55);
    streak.material.uniforms.uIntensity.value = decay(t, TL.burst, 3) * 1.2 + decay(t, TL.ringDone, 6) * 0.6;
    for (const [w, d, sc] of [
      [rewardWave, 0, 9],
      [rewardWave2, 0.1, 7],
    ]) {
      const wk = seg(t, TL.burst + 0.06 + d, TL.burst + d + 1.3);
      w.visible = wk > 0 && wk < 1;
      w.material.uniforms.uIntensity.value = 0.9;
      w.position.set(0, 0.44, -0.1);
      w.scale.setScalar(0.5 + sc * ease.outCubic(wk));
      w.material.uniforms.uK.value = wk;
    }
    bigBurst.object.position.set(0, 0.44, 0.1);
    bigBurst.set(cAge);
  }

  // ---------------------------------------------------------------------------
  function parentTransform(t, pos, rot) {
    const k = ease.outCubic(seg(t, TL.parentIn[0] + 0.1, TL.parentIn[1] + 0.25));
    pos.set(lerp(-3.0, -0.4, k), lerp(-1.0, -0.34, k), lerp(1.3, 0.48, k));
    rot.set(lerp(0.2, -0.04, k), lerp(1.3, 0.3, k), lerp(-0.15, 0, k));
    const kf = ease.inCubic(seg(t, TL.converge[0], TL.converge[1]));
    if (kf > 0) {
      pos.lerp(_a.set(-2.8, -2.2, -1.5), kf);
      rot.y += kf * 0.7;
    }
  }

  function buildTrails() {
    // courbes calculées sur la pose stable (t = 22) du parent et de l'enfant
    const pp = V(), pr = new THREE.Euler(), cp = V(), cr = new THREE.Euler();
    parentTransform(22, pp, pr);
    childTransform(22, cp, cr);
    const pm = new THREE.Matrix4().compose(pp, _q.setFromEuler(pr), V(1, 1, 1));
    const cm = new THREE.Matrix4().compose(cp, new THREE.Quaternion().setFromEuler(cr), V(1, 1, 1));
    trails = chips.map((ch, i) => {
      const start = CHIP_HOME[i].clone().add(V(ch.w / 2 + 0.01, 0, 0).applyEuler(new THREE.Euler(0, -0.32, 0))).applyMatrix4(pm);
      const end = child.screenToLocal(80, 635 + i * 42, SCREEN_W, SCREEN_H, 0.01).applyMatrix4(cm);
      const m1 = start.clone().lerp(end, 0.33).add(V(0.35 + i * 0.12, 0.5 - i * 0.12, 0.6));
      const m2 = start.clone().lerp(end, 0.7).add(V(0.25, 0.35 + i * 0.05, 0.35));
      const curve = new THREE.CatmullRomCurve3([start, m1, m2, end], false, 'centripetal');
      const tr = createTrail(curve, { color: [BRAND.cyan, '#A78BFA', BRAND.orange][i], color2: '#FFFFFF', radius: 0.0105, tail: 0.42 });
      trailsGroup.add(tr.mesh);
      return { ...tr, end };
    });
  }
  buildTrails();

  // Tablette : en arrière-plan, en haut à gauche du cadre "par-dessus l'épaule" (t = 2.5)
  {
    const cam = { pos: V(), look: V() };
    updateA(2.5, { pos: cam.pos, look: cam.look });
    const f = V().subVectors(phoneAS, cam.pos).normalize();
    const r = V().crossVectors(f, V(0, 1, 0)).normalize();
    const u = V().crossVectors(r, f);
    TABLET_POS.copy(cam.pos).addScaledVector(f, 7.2).addScaledVector(u, 1.75).addScaledVector(r, -0.55);
    TABLET_LOOK.copy(cam.pos).addScaledVector(u, 0.6);
  }

  function updateParent(t) {
    const vis = t > TL.parentIn[0] && t < TL.converge[1] + 0.1;
    parent.group.visible = vis;
    trailsGroup.visible = vis;
    childGlow.visible = vis;
    if (!vis) return;
    const rot = new THREE.Euler();
    parentTransform(t, parent.group.position, rot);
    if (t > TL.parentIn[1]) parent.group.position.add(drift(t));
    parent.group.rotation.copy(rot);
    const dim = 1 - ease.inCubic(seg(t, TL.converge[0], TL.converge[1])) * 0.85;
    parent.displayMat.color.setScalar(dim);
    pLayers.forEach((L, i) => {
      const k = lift(t, 21.0 + i * 0.14, 110, 13);
      L.g.position.copy(L.home);
      L.g.position.z += P_LIFT[i] * k;
      L.g.position.y += Math.sin(t * 1.3 + i) * 0.008 * k;
      L.g.rotation.set(Math.sin(t * 0.8 + i) * 0.03 * k, Math.sin(t * 0.6 + i * 1.7) * 0.04 * k, 0);
      L.sh.material.opacity = 0.6 * Math.min(1, k);
      L.sh.position.x = L.home.x + 0.012 * k;
      L.sh.position.y = L.home.y - 0.04 * k;
      L.sh.scale.setScalar(1 + P_LIFT[i] * k * 0.6);
      L.mat.opacity = 1;
    });
    bars.forEach((b, i) => {
      const k = ease.outBack(seg(t, 21.35 + i * 0.06, 21.85 + i * 0.06), 1.6);
      b.scale.set(0.03, Math.max(0.0001, b.userData.h * k), 0.024 + 0.01 * k);
    });
    chips.forEach((c, i) => {
      const k = springT(t - (21.55 + i * 0.16), { stiffness: 110, damping: 12 });
      const from = parent.screenToLocal(195, 720, SCREEN_W, SCREEN_H, 0.02);
      c.g.position.lerpVectors(from, CHIP_HOME[i], Math.min(1.08, k));
      c.g.scale.setScalar(Math.max(0.0001, lerp(0.3, 1, Math.min(1, k))));
      c.g.rotation.set(Math.sin(t + i) * 0.03, -0.32 + Math.sin(t * 0.7 + i) * 0.04, 0);
      c.glow.position.set(c.w / 2, 0, 0.02);
      const tt = TL.trails[i];
      c.glow.material.uniforms.uIntensity.value = pulse(t, tt + 0.05, 0.18) * 2 + 0.1 * k;
    });
    // traînées de lumière
    const fade = 1 - ease.inCubic(seg(t, TL.converge[0], TL.converge[0] + 0.7));
    trailsGroup.position.copy(t > TL.parentIn[1] ? drift(t) : _a.set(0, 0, 0));
    trails.forEach((tr, i) => {
      const t0 = TL.trails[i];
      const h = ease.inOutCubic(seg(t, t0, t0 + TL.trailDur));
      tr.mesh.visible = t > t0;
      tr.mat.uniforms.uHead.value = t < t0 ? -1 : h * 1.001;
      tr.mat.uniforms.uPersist.value = ease.outCubic(seg(t, t0 + TL.trailDur * 0.6, t0 + TL.trailDur + 0.6)) * 0.6;
      tr.mat.uniforms.uFlow.value = t * 1.4;
      tr.mat.uniforms.uIntensity.value = 3.0 * fade;
      const head = trailHeads[i];
      head.visible = t > t0 && h < 1;
      tr.curve.getPointAt(clamp(h), head.position);
      head.material.uniforms.uIntensity.value = 2.2 * (1 - pulse(h, 1, 0.05));
      arriveBursts[i].object.position.copy(tr.end);
      arriveBursts[i].set(t - (t0 + TL.trailDur));
    });
    child.group.updateMatrixWorld(true);
    childGlow.position.copy(child.screenToLocal(195, 640, SCREEN_W, SCREEN_H, 0.05)).applyMatrix4(child.group.matrixWorld);
    childGlow.material.uniforms.uIntensity.value = TL.trails.reduce((s, tt) => s + decay(t, tt + TL.trailDur, 4), 0) * 1.4 * fade;
  }

  // ---------------------------------------------------------------------------
  function updateLogo(t) {
    const vis = t > 25.2;
    logoWorld.visible = vis;
    if (!vis) return;
    const g = logo.group;
    g.position.copy(LOGO_POS);
    g.position.y += Math.sin((t - 27) * 0.9) * 0.025 * clamp(t - 27);
    g.rotation.set(Math.sin((t - 27) * 0.7) * 0.04 * clamp(t - 27), Math.sin((t - 27) * 0.55) * 0.16 * clamp(t - 27), 0);
    g.updateMatrixWorld(true);
    for (const p of parts) {
      const k = seg(t, p.t0, p.t1);
      const kk = ease.inOutCubic(k);
      p.m.visible = t > p.t0;
      // position le long de la courbe (monde -> local)
      p.curve.getPointAt(kk, _a);
      g.worldToLocal(_a);
      if (k >= 1) _a.copy(p.m.userData.home);
      // rebond de verrouillage
      const settle = decay(t, p.t1, 7) * Math.sin((t - p.t1) * 30) * 0.03 * (t > p.t1 ? 1 : 0);
      p.m.position.copy(_a).add(_b.set(0, 0, settle));
      const sp = 1 - ease.outCubic(k);
      p.m.rotation.set(p.spin.x * sp, p.spin.y * sp, p.spin.z * sp);
      const sc = ease.outCubic(seg(k, 0, 0.3)) * lerp(0.5, 1, ease.outCubic(k)) * (1 + decay(t, p.t1, 8) * 0.06);
      p.m.scale.setScalar(sc);
      const tr = p.trail;
      tr.mesh.visible = t > p.t0 && t < p.t1 + 0.3;
      tr.mat.uniforms.uHead.value = kk;
      tr.mat.uniforms.uPersist.value = 0;
      tr.mat.uniforms.uIntensity.value = 3.0 * (1 - ease.outCubic(seg(t, p.t1 - 0.05, p.t1 + 0.25)));
    }
    const lock = TL.logoLock;
    if (!core.parent) logoWorld.add(core, coreRing);
    const charge = ease.inCubic(seg(t, 25.25, lock)) * (1 - ease.outCubic(seg(t, lock, lock + 0.4)));
    core.material.uniforms.uIntensity.value = charge * 1.6 + Math.sin(t * 22) * 0.06 * charge;
    core.scale.setScalar(0.5 + charge * 1.4);
    // anneaux d'aspiration (se contractent vers le centre)
    const cr = (t - 25.3) % 0.55;
    const ck = 1 - cr / 0.55;
    coreRing.visible = t > 25.3 && t < lock - 0.05;
    coreRing.scale.setScalar(0.4 + ck * 3.2);
    coreRing.material.uniforms.uK.value = 1 - ck;
    coreRing.material.uniforms.uIntensity.value = 0.9 * charge;
    logo.sweep.value = lerp(-2.2, 2.4, ease.inOutCubic(seg(t, TL.sweep[0], TL.sweep[1])));
    const rk = ease.outCubic(seg(t, lock - 0.1, lock + 0.6));
    logoRays.material.uniforms.uIntensity.value = rk * (0.14 + decay(t, lock, 2) * 0.4);
    logoRays.material.uniforms.uRot.value = t * 0.08;
    logoFlare.material.uniforms.uIntensity.value = decay(t, lock, 4.5) * 1.3;
    logoStreak.material.uniforms.uIntensity.value = decay(t, lock, 3) * 1.1;
    for (const [w, d, sc] of [
      [logoWave, 0, 8],
      [logoWave2, 0.12, 6],
    ]) {
      const wk = seg(t, lock + d, lock + d + 1.3);
      w.visible = wk > 0 && wk < 1;
      w.scale.setScalar(0.6 + sc * ease.outCubic(wk));
      w.material.uniforms.uK.value = wk;
      w.material.uniforms.uIntensity.value = 1.5;
    }
    logoBurst.set(t - lock);
    logoUnderGlow.material.uniforms.uIntensity.value = rk * 0.5;
    // balayage lumineux physique
    const sw = seg(t, TL.sweep[0], TL.sweep[1]);
    env.sweep.position.set(lerp(-2.5, 2.5, ease.inOutCubic(sw)), 1.4 - sw * 0.6, 1.6);
    env.sweep.intensity = Math.sin(sw * Math.PI) * 9;
  }

  // ---------------------------------------------------------------------------
  // Caméras par plan, fondues entre elles

  const cams = {
    pos: V(),
    look: V(),
  };
  function camKizzo(t, out) {
    // B
    const kb = ease.outExpo(seg(t, TL.flash, 6.25));
    const kb2 = ease.inOutSine(seg(t, 6.0, 8.6));
    const B0 = V(0, 0.08, child.dims.front + 0.78), B1 = V(1.15, 0.5, 3.9), B2 = V(0.72, 0.3, 4.35);
    const pB = B0.clone().lerp(B1, kb).lerp(B2, kb2);
    const lB = V(0, 0.07, 0).lerp(V(0.04, 0.1, 0), kb);
    let fov = lerp(24, 35, kb);
    let pos = pB, look = lB;
    let focus = pos.distanceTo(V(0, 0.08, child.dims.front + 0.12 * kb));
    let aperture = lerp(0.3, 0.5, kb);
    // C
    const kc = ease.inOutCubic(seg(t, TL.toQuiz[0], TL.toQuiz[1] + 0.15));
    if (kc > 0) {
      const pC = V(Math.sin(t * 0.33) * 0.32, 0.52 + Math.sin(t * 0.23) * 0.06, 5.75 - seg(t, 9.0, 16.0) * 0.35);
      const lC = V(0, 0.3, 0);
      pos = pos.clone().lerp(pC, kc);
      look = look.clone().lerp(lC, kc);
      fov = lerp(fov, 36, kc);
      focus = lerp(focus, pC.distanceTo(V(0, 0.4, 0.05)), kc);
      aperture = lerp(aperture, 0.55, kc);
    }
    // D
    const kd = ease.inOutCubic(seg(t, TL.ringDone - 0.15, TL.burst + 0.35));
    if (kd > 0) {
      const a = 0.34 * ease.inOutSine(seg(t, TL.burst, TL.toPhone[0] + 0.3));
      const R = 5.1;
      const pD = V(REW.x + Math.sin(a) * R, 0.6 + seg(t, TL.burst, 18.2) * 0.1, REW.z + Math.cos(a) * R);
      const lD = REW.clone().add(V(0, -0.05, 0));
      // impulsion caméra au moment de l'explosion
      const imp = decay(t, TL.ringDone, 4) * Math.min(1, (t - TL.ringDone) * 20);
      pD.z -= imp * 0.6;
      pos = pos.clone().lerp(pD, kd);
      look = look.clone().lerp(lD, kd);
      fov = lerp(fov, 35 - imp * 3, kd);
      focus = lerp(focus, pD.distanceTo(REW), kd);
      aperture = lerp(aperture, 0.55, kd);
      out.roll += Math.sin((t - TL.ringDone) * 18) * decay(t, TL.ringDone, 3.5) * 0.05 * (t > TL.ringDone ? 1 : 0);
    }
    const kd2 = ease.inOutCubic(seg(t, TL.toPhone[0], TL.toPhone[1] + 0.5));
    if (kd2 > 0) {
      const pD2 = V(0.42 + Math.sin(t * 0.4) * 0.05, 0.28, 4.5);
      const lD2 = V(0, 0.08, 0);
      pos = pos.clone().lerp(pD2, kd2);
      look = look.clone().lerp(lD2, kd2);
      fov = lerp(fov, 34, kd2);
      focus = lerp(focus, pD2.distanceTo(V(0, 0.05, 0.05)), kd2);
    }
    // E
    const ke = ease.inOutCubic(seg(t, TL.parentIn[0], TL.parentIn[1] + 0.2));
    if (ke > 0) {
      const ka = ease.inOutSine(seg(t, TL.parentIn[1], TL.converge[0] + 0.3));
      const pE = V(lerp(-0.35, 0.62, ka), lerp(0.3, 0.62, ka), lerp(5.55, 5.25, ka));
      const lE = V(lerp(-0.12, 0.02, ka), lerp(0.06, 0.18, ka), -0.65);
      pos = pos.clone().lerp(pE, ke);
      look = look.clone().lerp(lE, ke);
      fov = lerp(fov, 36, ke);
      // mise au point : parent, puis bascule sur l'enfant à l'arrivée des traînées
      const parentD = pE.distanceTo(V(-0.3, -0.2, 0.7));
      const childD = pE.distanceTo(V(0.66, 0.62, -1.95));
      const rack = ease.inOutCubic(seg(t, 22.85, 23.45)) * (1 - ease.inOutCubic(seg(t, 24.2, 24.8)));
      focus = lerp(focus, lerp(parentD, childD, rack), ke);
      aperture = lerp(aperture, 0.6, ke);
    }
    // F
    const kf = ease.inOutCubic(seg(t, TL.converge[0] - 0.1, 25.95));
    if (kf > 0) {
      const kp = ease.outCubic(seg(t, 25.9, 30));
      const pF = V(Math.sin(t * 0.3) * 0.12 + kp * 0.12, lerp(0.62, 0.56, kp), lerp(6.4, 4.85, kp));
      const lF = V(0, 0.46, 0);
      pos = pos.clone().lerp(pF, kf);
      look = look.clone().lerp(lF, kf);
      fov = lerp(fov, 34, kf);
      focus = lerp(focus, pF.distanceTo(LOGO_POS), kf);
      aperture = lerp(aperture, 0.5, kf);
    }
    out.pos.copy(pos);
    out.look.copy(look);
    out.fov = fov;
    out.focus = focus;
    out.aperture = aperture;
  }

  // ---------------------------------------------------------------------------
  // Ambiance : lumières, fond, sol, faisceaux, poussière par plan

  function updateEnv(t, cam) {
    const inA = t < TL.flash;
    const u = env.bgMat.uniforms;
    u.uTime.value = t;
    // glows du fond : cyan/orange, plus chauds pendant la récompense, centrés pour le logo
    const rew = clamp(window4ish(t, TL.ringDone, TL.burst + 0.3, TL.toPhone[1], 20.2));
    const logoK = ease.inOutCubic(seg(t, 25.4, 27.2));
    u.uG1Col.value.set('#3DB5DA').multiplyScalar(0.3 + logoK * 0.15);
    u.uG2Col.value.set('#F97316').multiplyScalar(0.12 + rew * 0.22);
    u.uG3Col.value.set('#7FD3EC').multiplyScalar(logoK * 0.16 + rew * 0.1);
    u.uExposure.value = inA ? 1 - ease.outCubic(seg(t, TL.zero, TL.zero + 0.8)) * 0.25 : 1;

    // sol
    env.floor.position.y = inA ? -1.0 : t < 25 ? -2.4 : -1.35;
    env.floorMat.userData.fade.value = inA ? 1 : t < 25 ? 0.6 : 0.85 * ease.inOutCubic(seg(t, 25.3, 26.6));

    // faisceaux
    const shaftK = inA ? 1 - ease.outCubic(seg(t, TL.zero, TL.zero + 0.9)) * 0.6 : 0.55 + logoK * 0.5;
    env.shafts.children.forEach((s, i) => {
      s.material.uniforms.uIntensity.value = shaftK * [0.16, 0.11, 0.13][i] * (1 + Math.sin(t * 0.7 + i * 2) * 0.12);
    });
    env.shafts.position.copy(cam.look).add(_a.set(0, 0.2, -0.6));

    // poussière : suit la zone d'action, ralentit au gel
    const du = env.dustMat.uniforms;
    du.uT.value = inA ? warpA(t) : t;
    du.uCenter.value.copy(cam.look);
    du.uFocus.value = cam.focus;
    du.uAperture.value = cam.aperture;
    du.uIntensity.value = (inA ? 0.9 : 1.0) * (1 + logoK * 0.3);

    // lumières
    env.key.target.position.copy(cam.look);
    env.key.position.copy(cam.look).add(_a.set(-3.2, 7.2, 4.0));
    env.key.intensity = inA ? 20 - ease.outCubic(seg(t, TL.zero, TL.zero + 1)) * 6 : 20;
    env.rimC.position.copy(cam.look).add(_a.set(-3.4, 2.2, -2.8));
    env.rimO.position.copy(cam.look).add(_a.set(3.5, 0.8, -2.4));
    env.rimO.intensity = 7 + rew * 12;
    env.rimC.intensity = 10 + logoK * 6;
    env.fill.position.copy(cam.look).add(_a.set(3, 2, 6));
  }
  const window4ish = (t, a, b, c, d) => (t <= a || t >= d ? 0 : t < b ? ease.outCubic(seg(t, a, b)) : t <= c ? 1 : 1 - ease.inOutCubic(seg(t, c, d)));

  // ---------------------------------------------------------------------------
  const camOut = { pos: V(), look: V(), fov: 35, roll: 0, focus: 5, aperture: 0.5, zoom: 0, ca: 0.02, flash: 0, sat: 1, shake: 0 };

  function update(t) {
    camOut.roll = 0;
    camOut.zoom = 0;
    camOut.ca = 0.012;
    camOut.flash = 0;
    camOut.sat = 1;
    updateA(t, camOut);
    if (t >= TL.flash) camKizzo(t, camOut);

    // caméra "à l'épaule" très subtile
    const hp = camOut.pos;
    hp.x += wobble(t * 0.8, 1) * 0.01;
    hp.y += wobble(t * 0.7, 2) * 0.008;
    camera.position.copy(hp);
    camera.up.set(0, 1, 0);
    camera.lookAt(camOut.look);
    camera.rotateZ(camOut.roll + wobble(t * 0.5, 3) * 0.004);
    camera.fov = camOut.fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    updateChild(t);
    updateQuiz(t);
    updateReward(t);
    updateParent(t);
    updateLogo(t);
    updateEnv(t, camOut);

    // étalonnage / événements
    const post = {
      time: t,
      focus: camOut.focus,
      aperture: camOut.aperture,
      maxBlur: 22,
      exposure: 1.0,
      bloom: 0.5,
      bloomRadius: 0.6,
      threshold: 1.3,
      vignette: 0.6,
      grain: 0.035,
      ca: camOut.ca,
      zoom: camOut.zoom,
      flash: 0,
      fade: 1 - ease.outCubic(seg(t, 0, 0.9)),
      sat: camOut.sat,
      flashCol: '#EAF8FF',
    };
    // flash de transition A -> B
    post.flash = t < TL.flash ? camOut.flash : decay(t, TL.flash, 5.5) * 0.95;
    post.zoom = t < TL.flash ? camOut.zoom : decay(t, TL.flash, 4) * 0.8;
    post.ca += t >= TL.flash ? decay(t, TL.flash, 4) * 0.15 : 0;
    post.exposure = 1 + (t >= TL.flash ? decay(t, TL.flash, 3) * 0.25 : 0);
    // anneau complet + explosion
    post.bloom += decay(t, TL.ringDone, 4) * 0.12 + decay(t, TL.burst, 3) * 0.15 + decay(t, TL.logoLock, 3) * 0.15;
    post.flash += decay(t, TL.ringDone, 9) * 0.08 * (t > TL.ringDone ? 1 : 0) + decay(t, TL.burst, 8) * 0.1 * (t > TL.burst ? 1 : 0);
    post.flash += decay(t, TL.logoLock, 8) * 0.1 * (t > TL.logoLock ? 1 : 0);
    if (t > TL.ringDone && t < TL.burst + 1) {
      post.zoom += decay(t, TL.burst, 7) * 0.15;
      post.ca += decay(t, TL.burst, 5) * 0.08;
    }
    post.zoom += pulse(t, TL.toQuiz[0] + 0.45, 0.25) * 0.25 + pulse(t, TL.parentIn[0] + 0.4, 0.3) * 0.2;
    post.vignette = t > 25.5 ? lerp(0.6, 0.72, seg(t, 25.5, 27)) : 0.6;

    // ancres des titres 3D -> écran
    const anchors = {
      burst: project(_a.set(0, -0.2, 0.22)),
      sig: project(_a.set(0, -0.5, 0)),
    };
    return { post, anchors };
  }

  const _pp = V();
  function project(v) {
    _pp.copy(v).project(camera);
    return { x: (_pp.x * 0.5 + 0.5) * 100, y: (-_pp.y * 0.5 + 0.5) * 100 };
  }

  /** Rend visibles tous les objets (précompilation des shaders). */
  function showAll(on) {
    const list = [worldA, child.group, holo, quiz, reward, parent.group, trailsGroup, logoWorld, confetti.object, mergeBurst.object];
    list.forEach((o) => o.traverse((c) => (c.visible = on ? true : c.visible)));
  }

  return { update, showAll, env };
}
