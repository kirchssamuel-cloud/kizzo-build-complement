// Mise en scène du film « Les règles du jeu » (1:1). update(t) est une fonction pure du temps.
// A · les applis décomptent (orbite d'icônes, anneau 15 min, verrou)
// B · « Règles des quiz » : chaque réglage sort de l'écran en objet 3D
// C · carrousel de quiz, une carte par matière
// D · sablier, +15, les applis se libèrent
// E · signature Kizzo
import * as THREE from 'three';
import { S, T } from './config.js';
import { clamp, lerp, seg, ease, springT, pulse, decay, wobble, TAU } from '../util.js';
import { createEnvironment } from '../env.js';
import { createDevice } from '../devices.js';
import { CanvasTex, SCREEN_W, SCREEN_H } from '../ui-canvas.js';
import { makeGlow, makeShockwave, makeGodRays, makeStreak, roundedSlab, roundedPlane } from '../materials.js';
import { createBurst, createProgressRing, createTrail } from '../fx.js';
import { createLogo3D, createPlus15 } from '../logo3d.js';
import * as U from './ui.js';
import { createAppTile, createToggle, createChip, createCoin, createValueCard, createSubjectLabel, createSubjectProp, createHourglass, plastic } from './props.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const _a = V(), _b = V(), _c = V(), _d = V();

/** Point d'une courbe de Bézier quadratique (départ, contrôle, arrivée). */
function bez(out, p0, p1, p2, k) {
  const u = 1 - k;
  return out.set(
    u * u * p0.x + 2 * u * k * p1.x + k * k * p2.x,
    u * u * p0.y + 2 * u * k * p1.y + k * k * p2.y,
    u * u * p0.z + 2 * u * k * p1.z + k * k * p2.z
  );
}
const sp = (t, t0, stiffness = 140, damping = 13) => springT(t - t0, { stiffness, damping });

// emplacements des plans
const KID = V(0, 0, 0);
const PB = V(3.6, 0, 0); // assez proche pour que le panoramique montre le passage d'un plan à l'autre
const FB = PB.clone().add(V(0.55, 0.1, 0.5)); // zone des objets extraits de l'écran parent
const CC = PB.clone().add(V(0.05, -0.32, -0.35)); // centre du carrousel
const HG = KID.clone().add(V(-1.0, -0.02, 0.3)); // sablier
const LOGO_POS = KID.clone().add(V(0, 0.42, 0.2));

export function createStory(renderer, scene, camera) {
  const env = createEnvironment(renderer, scene);

  // ===========================================================================
  // A / D — téléphone de l'enfant, icônes d'applis, anneau 15 min
  const texKid = new CanvasTex(SCREEN_W, SCREEN_H, 2.2);
  const kid = createDevice({ screenTexture: texKid.texture, frame: '#D3D9E1', back: '#E9EEF4', brightness: 1.02 });
  scene.add(kid.group);
  const tiles = [0, 1, 2, 3, 4, 5].map((i) => createAppTile(i, 0.3));
  tiles.forEach((tl) => scene.add(tl.group));
  const ring = createProgressRing(0.98);
  scene.add(ring.group);
  const ringWave = makeShockwave('#FFB27A');
  const ringWave2 = makeShockwave('#7FD3EC');
  const kidGlow = makeGlow('#FF8A3D', 0, 2.2);
  scene.add(ringWave, ringWave2, kidGlow);
  const unlockBurst = createBurst({ count: 120, seed: 21, speed: 2.0, life: 1.3, size: 8, colors: ['#FFFFFF', '#4ADE80', '#3DB5DA', '#FAB43B'], up: 0.3 });
  scene.add(unlockBurst.object);

  // ===========================================================================
  // B — téléphone parent « Règles des quiz » + objets extraits
  const texRules = new CanvasTex(SCREEN_W, SCREEN_H, 2.4);
  const parent = createDevice({ screenTexture: texRules.texture, frame: '#C9CED6', back: '#F28A3C', brightness: 1.0 });
  scene.add(parent.group);
  const toggle = createToggle();
  const chips = T.rules.freqOpts.map((m) => createChip(`${m} min`));
  const coins = T.rules.qOpts.map((n) => createCoin(n));
  const freqCard = createValueCard();
  const qCard = createValueCard();
  const props = [0, 1, 2, 3, 4, 5].map((i) => createSubjectProp(i));
  const labels = [0, 1, 2, 3, 4, 5].map((i) => createSubjectLabel(i));
  const tapWave = makeShockwave('#BDEBFA');
  const popBurst = createBurst({ count: 50, seed: 5, speed: 1.1, life: 0.7, size: 6, colors: ['#FFFFFF', '#7FD3EC'] });
  scene.add(toggle.group, freqCard.group, qCard.group, tapWave, popBurst.object);
  chips.forEach((c) => scene.add(c.group));
  coins.forEach((c) => scene.add(c.group));
  props.forEach((p) => scene.add(p.group));
  labels.forEach((l) => scene.add(l.group));
  const saveWave = makeShockwave('#7FD3EC');
  scene.add(saveWave);

  // ===========================================================================
  // C — carrousel de cartes de quiz
  const carousel = new THREE.Group();
  scene.add(carousel);
  const CARD_W = 1.2, CARD_H = (CARD_W * U.QCARD_PX[1]) / U.QCARD_PX[0];
  const RADIUS = 1.18;
  const cards = [0, 1, 2, 3, 4].map((i) => {
    const ct = new CanvasTex(U.QCARD_PX[0], U.QCARD_PX[1], 2.2);
    const g = new THREE.Group();
    const back = new THREE.Mesh(roundedSlab(CARD_W * 0.985, CARD_H * 0.98, 0.04, 0.085, 0.012), plastic('#0E1D33', { roughness: 0.25 }));
    back.position.z = -0.022;
    back.castShadow = true;
    const face = new THREE.Mesh(roundedPlane(CARD_W, CARD_H, 0.09, 12), new THREE.MeshBasicMaterial({ map: ct.texture, transparent: true, toneMapped: false }));
    face.material.color.setScalar(1.05);
    g.add(back, face);
    carousel.add(g);
    return { g, ct, face };
  });
  const okBursts = [0, 1, 2, 3, 4].map((i) => createBurst({ count: 46, seed: 30 + i, speed: 1.1, life: 0.8, size: 6, colors: ['#FFFFFF', '#4ADE80', U.SUBJECT_COL[i]] }));
  okBursts.forEach((b) => scene.add(b.object));
  // barre de progression (5 segments)
  const progMatOff = plastic('#22344F');
  const progs = [0, 1, 2, 3, 4].map((i) => {
    const m = new THREE.Mesh(roundedSlab(0.2, 0.05, 0.04, 0.025, 0.01), plastic(U.SUBJECT_COL[i], { emissive: new THREE.Color(U.SUBJECT_COL[i]), emissiveIntensity: 0 }));
    const off = new THREE.Mesh(roundedSlab(0.2, 0.05, 0.03, 0.025, 0.01), progMatOff);
    scene.add(m, off);
    return { m, off };
  });

  // ===========================================================================
  // D — sablier, +15
  const hourglass = createHourglass();
  scene.add(hourglass.group);
  const plus = createPlus15();
  scene.add(plus.group);
  const plusWave = makeShockwave('#FFB27A');
  const plusFlare = makeGlow('#FFD2A8', 0, 1.6, { core: 1 });
  scene.add(plusWave, plusFlare);
  const sandGlow = makeGlow('#FAB43B', 0, 1.4);
  scene.add(sandGlow);

  // ===========================================================================
  // E — logo
  const logoWorld = new THREE.Group();
  scene.add(logoWorld);
  const logo = createLogo3D();
  logo.group.position.copy(LOGO_POS);
  logo.group.scale.setScalar(1.3);
  logoWorld.add(logo.group);
  const logoRays = makeGodRays('#7FD3EC', '#FFB27A', 26);
  logoRays.position.copy(LOGO_POS).add(V(0, 0, -0.8));
  logoRays.scale.setScalar(7);
  const logoFlare = makeGlow('#E0F7FF', 0, 3.2, { power: 2.2, core: 1 });
  logoFlare.position.copy(LOGO_POS).add(V(0, 0, 0.3));
  const logoStreak = makeStreak('#BDEBFA', 0, 7, 0.18);
  logoStreak.position.copy(LOGO_POS).add(V(0, 0, 0.35));
  const logoWave = makeShockwave('#7FD3EC');
  const logoWave2 = makeShockwave('#FF9D5C');
  logoWave.position.copy(LOGO_POS).add(V(0, 0, -0.1));
  logoWave2.position.copy(LOGO_POS).add(V(0, 0, -0.1));
  const logoBurst = createBurst({ count: 150, seed: 91, speed: 2.4, life: 1.6, size: 8, colors: ['#FFFFFF', '#3DB5DA', '#F97316'], up: 0.1, drag: 2.2, gravity: 0.25 });
  logoBurst.object.position.copy(LOGO_POS);
  const core = makeGlow('#CFF3FF', 0, 1.1, { power: 2.2, core: 1.4 });
  core.position.copy(LOGO_POS).add(V(0, 0, 0.2));
  logoWorld.add(logoRays, logoFlare, logoStreak, logoWave, logoWave2, logoBurst.object, core);
  logo.group.updateMatrixWorld(true);
  const logoParts = [
    { m: logo.body, from: V(-0.1, -0.35, 0.4), mid: V(-0.9, -0.45, 0.7), t0: S.converge[0] + 0.15, t1: S.logoLock - 0.12, spin: V(1.2, -2.2, 0.6), col: '#7FD3EC' },
    { m: logo.head, from: V(-1.0, 0.3, 0.3), mid: V(-1.1, 1.1, 1.4), t0: S.converge[0] + 0.25, t1: S.logoLock - 0.05, spin: V(-1.5, 1.4, 2), col: '#7FD3EC' },
    { m: logo.child, from: V(1.1, 0.6, 0.4), mid: V(1.0, 1.2, 1.5), t0: S.converge[0] + 0.35, t1: S.logoLock, spin: V(0.8, 2.6, -1.2), col: '#FFB27A' },
  ];
  for (const p of logoParts) {
    const home = logo.group.localToWorld(p.m.userData.home.clone());
    p.curve = new THREE.CatmullRomCurve3([p.from, p.mid, home.clone().add(V(0, 0, 0.8)), home], false, 'centripetal');
    p.trail = createTrail(p.curve, { color: p.col, color2: '#FFFFFF', radius: 0.01, tail: 0.32 });
    logoWorld.add(p.trail.mesh);
  }

  // ===========================================================================
  // Helpers de positions

  /** Position monde d'un point de l'écran d'un appareil (px logiques). */
  function screenWorld(dev, px, py, z = 0.01, out = V()) {
    out.copy(dev.screenToLocal(px, py, SCREEN_W, SCREEN_H, z));
    dev.group.updateMatrixWorld(true);
    return dev.group.localToWorld(out);
  }
  /** Orbite des icônes d'applis autour du téléphone de l'enfant. */
  function orbitPos(i, t, out = V(), rad = 1) {
    const th = (i / 6) * TAU + t * 0.55 + 0.4;
    const c = kid.group.position;
    return out.set(c.x + Math.cos(th) * 1.12 * rad, c.y + 0.1 + Math.sin(th) * 0.3 * rad + Math.sin(t * 1.3 + i) * 0.04, c.z + Math.sin(th) * 0.7 * rad);
  }
  // cibles des objets extraits (plan B), relatives à FB
  const CHIP_POS = T.rules.freqOpts.map((_, i) => V(((i % 3) - 1) * 0.5, -0.06 - Math.floor(i / 3) * 0.22, 0));
  const COIN_POS = T.rules.qOpts.map((_, i) => V(((i % 4) - 1.5) * 0.3, -0.1 - Math.floor(i / 4) * 0.3, 0));
  const PROP_POS = [0, 1, 2, 3, 4, 5].map((i) => V(((i % 3) - 1) * 0.52, 0.32 - Math.floor(i / 3) * 0.64, 0));

  // ===========================================================================
  // A — accroche

  function updateA(t) {
    const inA = t < S.whip[1] + 0.2;
    const inD = t > S.reward[0] - 0.1 && t < S.converge[1] + 0.3;
    kid.group.visible = inA || inD;
    // téléphone : léger flottement ; en D il glisse à droite du sablier
    const dk = ease.inOutCubic(seg(t, S.reward[0], S.reward[1]));
    const ek = ease.inCubic(seg(t, S.converge[0], S.converge[1]));
    kid.group.position.set(KID.x + dk * 0.25, KID.y + Math.sin(t * 1.1) * 0.02 - ek * 0.6, KID.z - ek * 0.8);
    kid.group.rotation.set(0.02 + Math.sin(t * 0.7) * 0.02, -0.12 + Math.sin(t * 0.5) * 0.05 - dk * 0.2, 0);
    kid.group.scale.setScalar(1 - ek * 0.6);
    const fullK = decay(t, S.full, 6) * (t > S.full ? 1 : 0);
    kid.displayMat.color.setScalar(1.02 + fullK * 0.5);

    // écran
    const outK = ease.outCubic(seg(t, S.iconsOut[0], S.iconsOut[0] + 0.3));
    const inK = seg(t, S.iconsIn[1] - 0.1, S.iconsIn[1]);
    const used = 15 * ease.inOutSine(seg(t, S.usage[0], S.usage[1]));
    const lock = ease.outCubic(seg(t, S.lock, S.lock + 0.5));
    if (t < S.reward[0]) {
      const key = `a|${used.toFixed(2)}|${(outK * (1 - inK)).toFixed(2)}|${lock.toFixed(2)}`;
      texKid.draw(key, (c, w, h) => U.kidAppsScreen(c, w, h, { used, out: outK * (1 - inK), lock, t }));
    } else if (t < S.unlock) {
      const pz = decay(t, S.plus + 0.7, 3) * (t > S.plus + 0.7 ? 1 : 0);
      const stars = clamp((t - S.reward[0] - 0.3) * 7, 0, 5);
      texKid.draw(`r|${stars.toFixed(2)}|${pz.toFixed(2)}`, (c, w, h) => U.resultScreen(c, w, h, { stars, pulse: pz }));
    } else {
      const un = ease.outCubic(seg(t, S.unlock, S.unlock + 0.4));
      const out2 = ease.outCubic(seg(t, S.unlock + 0.1, S.unlock + 0.4));
      texKid.draw(`u|${un.toFixed(2)}|${out2.toFixed(2)}`, (c, w, h) => U.kidAppsScreen(c, w, h, { used: 0, unlocked: un, out: out2, t }));
    }

    // anneau 15 min
    const rk = ease.outCubic(seg(t, 0.35, 1.1)) * (1 - ease.inCubic(seg(t, S.whip[0], S.whip[0] + 0.35)));
    ring.group.visible = rk > 0.001;
    ring.group.position.set(KID.x, KID.y + 0.0, KID.z - 0.18);
    ring.group.scale.setScalar(lerp(0.85, 1, rk) * (1 + fullK * 0.05));
    ring.fillMat.uniforms.uFill.value = ease.inOutSine(seg(t, S.usage[0], S.usage[1]));
    ring.fillMat.uniforms.uFlash.value = fullK * 0.3;
    ring.fillMat.uniforms.uTime.value = t;
    ring.fillMat.uniforms.uIntensity.value = 3.0 * rk;
    ring.track.material.opacity = rk;
    for (const [w, d, sc] of [
      [ringWave, 0, 5.5],
      [ringWave2, 0.1, 4],
    ]) {
      const wk = seg(t, S.full + d, S.full + d + 1.0);
      w.visible = wk > 0 && wk < 1;
      w.position.set(KID.x, KID.y, KID.z - 0.1);
      w.scale.setScalar(1 + sc * ease.outCubic(wk));
      w.material.uniforms.uK.value = wk;
      w.material.uniforms.uIntensity.value = 1.6;
    }
    kidGlow.position.set(KID.x, KID.y, KID.z - 0.3);
    kidGlow.material.uniforms.uIntensity.value = fullK * 0.45 + rk * 0.12;

    // icônes : sortent de l'écran -> orbite -> rentrent (A) ; ressortent au déblocage (D) ; logo (E)
    tiles.forEach((tl, i) => {
      const g = tl.group;
      const [px, py] = U.KID_GRID[i];
      const home = screenWorld(kid, px, py, 0.02, _a);
      const o = orbitPos(i, t, _b, t > S.reward[0] ? 0.82 : 1);
      const st = S.iconsOut[0] + i * 0.08;
      const kOut = ease.outCubic(seg(t, st, st + 0.8));
      const sti = S.iconsIn[0] + (5 - i) * 0.05;
      const kIn = ease.inCubic(seg(t, sti, sti + 0.45));
      const stu = S.unlock + 0.1 + i * 0.06;
      const kUn = ease.outCubic(seg(t, stu, stu + 0.8));
      const kE = ease.inCubic(seg(t, S.converge[0] + i * 0.04, S.converge[0] + 0.55 + i * 0.04));
      let vis = false;
      if (t >= st && t < sti + 0.45) {
        vis = true;
        if (kIn > 0) bez(g.position, o, _c.copy(o).lerp(home, 0.5).add(_d.set(0, 0.25, 0.5)), home, kIn);
        else bez(g.position, home, _c.copy(home).add(_d.set(0, 0.1, 0.7)), o, kOut);
        const s = kIn > 0 ? lerp(1, 0.25, kIn) : lerp(0.3, 1, kOut);
        g.scale.setScalar(s);
        g.rotation.set(Math.sin(t * 1.7 + i) * 0.2 + (1 - kOut) * TAU, Math.sin(t * 1.2 + i * 2) * 0.35, 0);
      } else if (t >= stu && t < S.converge[0] + 0.6 + i * 0.04) {
        vis = true;
        bez(g.position, home, _c.copy(home).add(_d.set(0, 0.2, 0.8)), o, kUn);
        if (kE > 0) g.position.lerp(_c.copy(LOGO_POS), kE);
        g.scale.setScalar(lerp(0.3, 1, kUn) * (1 - kE));
        g.rotation.set(Math.sin(t * 1.7 + i) * 0.2 + (1 - kUn) * TAU, Math.sin(t * 1.2 + i * 2) * 0.35, 0);
      }
      g.visible = vis;
    });
    unlockBurst.object.position.copy(screenWorld(kid, 195, 330, 0.05, _a));
    unlockBurst.set(t - S.unlock);
  }

  // ===========================================================================
  // B — Règles des quiz

  function rulesState(t) {
    const focusWins = [
      [S.toggle.out - 0.1, S.toggle.back],
      [S.chips.out - 0.1, S.chips.back],
      [S.coins.out - 0.1, S.coins.back],
      [S.subjects.out - 0.1, S.save - 0.05],
      [S.save - 0.05, S.save + 0.45],
    ];
    let focus = -1, focusK = 0;
    focusWins.forEach(([a, b], i) => {
      const k = Math.min(ease.outCubic(seg(t, a, a + 0.3)), 1 - ease.inCubic(seg(t, b - 0.2, b)));
      if (k > focusK) {
        focus = i;
        focusK = k;
      }
    });
    const toggleK = sp(t, S.toggle.flip, 260, 18);
    const freq = sp(t, S.chips.tap, 200, 15);
    const q = S.coins.steps.reduce((acc, st) => acc + sp(t, st, 260, 18), 0);
    const subj = [0, 1, 2, 3, 4, 5].reduce((acc, i) => acc + clamp((t - (S.subjects.out + 0.25 + i * S.subjects.stagger)) * 6), 0);
    const save = pulse(t, S.save + 0.08, 0.14);
    return { toggle: toggleK, freq, q, subj, focus, focusK, save };
  }

  function updateB(t) {
    const vis = t > S.whip[0] && t < S.carousel[1] + 0.2;
    parent.group.visible = vis;
    // le téléphone glisse hors cadre quand le carrousel arrive
    const ex = ease.inOutCubic(seg(t, S.carousel[0] - 0.1, S.carousel[1] - 0.2));
    parent.group.position.set(PB.x - 0.62 - ex * 0.5, PB.y + 0.02 + Math.sin(t * 0.9) * 0.015 - ex * 2.6, PB.z - ex * 0.9);
    parent.group.rotation.set(0.03 - ex * 0.6, 0.34 + Math.sin(t * 0.6) * 0.03 + ex * 0.4, 0.01);
    parent.group.updateMatrixWorld(true);
    const st = rulesState(t);
    const tapK = seg(t, S.chips.tap - 0.02, S.chips.tap + 0.4);
    const qtap = S.coins.steps.map((s) => seg(t, s - 0.02, s + 0.35)).find((k) => k > 0 && k < 1) || 0;
    let tap = null;
    if (tapK > 0 && tapK < 1) tap = [U.FREQ_CHIPS[1][0] + U.FREQ_CHIPS[1][2] / 2, U.FREQ_CHIPS[1][1] + 13, tapK];
    const qi = S.coins.steps.findIndex((s) => t > s - 0.02 && t < s + 0.35);
    if (qi >= 0) tap = [U.Q_DOTS[qi + 1][0], U.Q_DOTS[qi + 1][1], qtap];
    const saveK = seg(t, S.save, S.save + 0.45);
    if (saveK > 0 && saveK < 1) tap = [195, 737, saveK];
    if (vis) {
      const key = `${st.toggle.toFixed(2)}|${st.freq.toFixed(2)}|${st.q.toFixed(2)}|${st.subj.toFixed(2)}|${st.focus}|${st.focusK.toFixed(2)}|${st.save.toFixed(2)}|${tap ? tap.map((v) => v.toFixed(2)).join(',') : ''}`;
      texRules.draw(key, (c, w, h) => U.rulesScreen(c, w, h, { ...st, tap }));
    }

    // --- interrupteur
    {
      const k = ease.outBack(seg(t, S.toggle.out, S.toggle.out + 0.6), 1.2);
      const kb = ease.inCubic(seg(t, S.toggle.back, S.toggle.back + 0.38));
      const g = toggle.group;
      g.visible = t > S.toggle.out && t < S.toggle.back + 0.38;
      const home = screenWorld(parent, 331, 163, 0.03, _a);
      const dst = _b.copy(FB).add(_c.set(-0.02, 0.0, 0.15));
      if (kb > 0) bez(g.position, dst, _c.copy(dst).lerp(home, 0.5).add(_d.set(0, 0.3, 0.3)), home, kb);
      else bez(g.position, home, _c.copy(home).lerp(dst, 0.5).add(_d.set(0, 0.35, 0.6)), dst, clamp(k));
      g.scale.setScalar(lerp(0.15, 0.95, clamp(k)) * (1 - kb * 0.85));
      g.rotation.set(-0.1 + Math.sin(t * 1.3) * 0.05, -0.2 + Math.sin(t * 0.9) * 0.08, 0);
      toggle.update(st.toggle);
    }

    // --- puces de fréquence + valeur
    chips.forEach((c, i) => {
      const s0 = S.chips.out + i * 0.05;
      const k = ease.outBack(seg(t, s0, s0 + 0.55), 1.3);
      const sb = S.chips.back + (8 - i) * 0.03;
      const kb = ease.inCubic(seg(t, sb, sb + 0.4));
      const g = c.group;
      g.visible = t > s0 && t < sb + 0.4;
      if (!g.visible) return;
      const [cx, cy, cw] = U.FREQ_CHIPS[i];
      const home = screenWorld(parent, cx + cw / 2, cy + 13, 0.03, _a);
      const dst = _b.copy(FB).add(CHIP_POS[i]);
      // sélection : 10 min, puis 15 min au toucher
      const selShow = ease.outCubic(seg(t, S.chips.sel, S.chips.sel + 0.3));
      const sel = i === 0 ? selShow * (1 - clamp(st.freq)) : i === 1 ? clamp(st.freq) : 0;
      const lift = i === 1 ? sp(t, S.chips.tap, 200, 12) : 0;
      dst.z += lift * 0.12 + (i === 0 ? selShow * (1 - clamp(st.freq)) * 0.06 : 0);
      if (kb > 0) bez(g.position, dst, _c.copy(dst).lerp(home, 0.5).add(_d.set(0, 0.25, 0.3)), home, kb);
      else bez(g.position, home, _c.copy(home).lerp(dst, 0.5).add(_d.set(0, 0.3, 0.55)), dst, clamp(k));
      g.scale.setScalar(lerp(0.2, 1, clamp(k)) * (1 - kb * 0.8) * (1 + lift * 0.12 - (i === 1 ? decay(t, S.chips.tap, 9) * 0.25 * (t > S.chips.tap ? 1 : 0) : 0)));
      g.rotation.set(Math.sin(t * 1.2 + i) * 0.06 - 0.08, -0.18 + Math.sin(t * 0.9 + i * 0.7) * 0.07, 0);
      c.set(sel);
    });
    {
      const k = ease.outBack(seg(t, S.chips.sel - 0.1, S.chips.sel + 0.4), 1.4);
      const kb = ease.inCubic(seg(t, S.chips.back, S.chips.back + 0.35));
      const g = freqCard.group;
      g.visible = k > 0 && kb < 1;
      g.position.copy(FB).add(_a.set(0, 0.4, 0.1));
      const bump = decay(t, S.chips.tap + 0.05, 7) * (t > S.chips.tap ? 1 : 0);
      g.scale.setScalar(clamp(k) * (1 - kb) * (1 + bump * 0.12));
      g.rotation.set(-0.05, -0.18 + Math.sin(t * 0.8) * 0.05, 0);
      freqCard.set(t < S.chips.tap + 0.05 ? '10' : '15', 'min', U.R.cyan);
    }
    // onde du toucher
    {
      const k = seg(t, S.chips.tap, S.chips.tap + 0.6);
      tapWave.visible = k > 0 && k < 1;
      tapWave.position.copy(chips[1].group.position).add(_a.set(0, 0, 0.05));
      tapWave.scale.setScalar(0.2 + k * 1.2);
      tapWave.material.uniforms.uK.value = k;
      tapWave.material.uniforms.uIntensity.value = 1.8;
    }

    // --- jetons « questions par quiz »
    coins.forEach((c, i) => {
      const s0 = S.coins.out + i * 0.05;
      const k = ease.outBack(seg(t, s0, s0 + 0.55), 1.3);
      const sb = S.coins.back + (7 - i) * 0.03;
      const kb = ease.inCubic(seg(t, sb, sb + 0.4));
      const g = c.group;
      g.visible = t > s0 && t < sb + 0.4;
      if (!g.visible) return;
      const [cx, cy] = U.Q_DOTS[i];
      const home = screenWorld(parent, cx, cy, 0.03, _a);
      const dst = _b.copy(FB).add(COIN_POS[i]);
      const sel = clamp(1 - Math.abs(st.q - i));
      // petit saut au passage du sélecteur
      const hop = i > 0 && i <= S.coins.steps.length ? Math.sin(clamp((t - S.coins.steps[i - 1]) / 0.35) * Math.PI) : 0;
      dst.y += hop * 0.12;
      dst.z += sel * 0.08;
      if (kb > 0) bez(g.position, dst, _c.copy(dst).lerp(home, 0.5).add(_d.set(0, 0.25, 0.3)), home, kb);
      else bez(g.position, home, _c.copy(home).lerp(dst, 0.5).add(_d.set(0, 0.3, 0.55)), dst, clamp(k));
      g.scale.setScalar(lerp(0.2, 1, clamp(k)) * (1 - kb * 0.8) * (1 + sel * 0.12));
      g.rotation.set(-0.08, -0.15 + Math.sin(t * 1.1 + i) * 0.08 + hop * TAU * 0.5, 0);
      c.set(sel);
    });
    {
      const k = ease.outBack(seg(t, S.coins.out + 0.2, S.coins.out + 0.7), 1.4);
      const kb = ease.inCubic(seg(t, S.coins.back, S.coins.back + 0.35));
      const g = qCard.group;
      g.visible = k > 0 && kb < 1;
      g.position.copy(FB).add(_a.set(0, 0.36, 0.1));
      g.scale.setScalar(clamp(k) * (1 - kb));
      g.rotation.set(-0.05, -0.18 + Math.sin(t * 0.8) * 0.05, 0);
      qCard.set(String(T.rules.qOpts[clamp(Math.round(st.q), 0, 7)]), 'questions', U.R.orange);
    }

    // --- matières : les illustrations sortent des pastilles
    props.forEach((p, i) => {
      const s0 = S.subjects.out + i * S.subjects.stagger;
      const k = ease.outBack(seg(t, s0, s0 + 0.6), 1.5);
      const g = p.group, lab = labels[i].group;
      const inB = t > s0 && t < S.carousel[0];
      const [cx, cy, cw] = U.SUBJECT_CHIPS[i];
      const home = screenWorld(parent, cx + cw / 2, cy + 14, 0.03, _a);
      const dst = _b.copy(FB).add(PROP_POS[i]).add(_c.set(0, 0, 0.05));
      lab.visible = inB;
      if (inB) {
        bez(g.position, home, _c.copy(home).lerp(dst, 0.5).add(_d.set(0, 0.4, 0.7)), dst, clamp(k));
        g.position.y += Math.sin(t * 1.6 + i * 1.3) * 0.025;
        g.scale.setScalar(lerp(0.15, 0.78, clamp(k)));
        g.rotation.set(0, -0.25 + Math.sin(t * 0.9 + i) * 0.2, 0);
        lab.position.copy(dst).add(_c.set(0, -0.3, 0.06));
        lab.scale.setScalar(clamp(k));
        lab.rotation.set(-0.05, -0.2, 0);
      }
      p.update(t);
    });
    // enregistrer : onde sur le bouton
    {
      const k = seg(t, S.save + 0.05, S.save + 0.7);
      saveWave.visible = k > 0 && k < 1;
      saveWave.position.copy(screenWorld(parent, 195, 737, 0.04, _a));
      saveWave.quaternion.copy(parent.group.quaternion);
      saveWave.scale.setScalar(0.3 + k * 2.2);
      saveWave.material.uniforms.uK.value = k;
      saveWave.material.uniforms.uIntensity.value = 1.6;
    }
    popBurst.object.position.copy(toggle.group.position);
    popBurst.set(t - S.toggle.flip);
  }

  // ===========================================================================
  // C — carrousel

  function carouselAngle(t) {
    // intro : le carrousel arrive en tournant, puis un cran (72°) par question
    const intro = (1 - ease.outCubic(seg(t, S.carousel[0], S.carousel[1] + 0.1))) * 2.4;
    let steps = 0;
    for (let i = 1; i < 5; i++) steps += sp(t, S.q[i].front - 0.48, 110, 13);
    const out = ease.inCubic(seg(t, S.done, S.done + 0.6)) * 3.0;
    return intro - steps * (TAU / 5) - out;
  }

  function updateC(t) {
    const vis = t > S.carousel[0] - 0.05 && t < S.done + 0.65;
    carousel.visible = vis;
    const inK = ease.outCubic(seg(t, S.carousel[0], S.carousel[1]));
    const outK = ease.inCubic(seg(t, S.done, S.done + 0.6));
    const rho = carouselAngle(t);
    cards.forEach((c, i) => {
      const th = (i * TAU) / 5 + rho;
      const ci = ease.outBack(seg(t, S.carousel[0] + 0.15 + i * 0.08, S.carousel[0] + 0.75 + i * 0.08), 1.3);
      c.g.position.set(CC.x + Math.sin(th) * RADIUS * (1 - outK * 0.6), CC.y + outK * 0.2, CC.z + Math.cos(th) * RADIUS * (1 - outK * 0.6));
      c.g.rotation.set(0, th, 0);
      c.g.scale.setScalar(clamp(ci) * (1 - outK));
      const q = S.q[i];
      const tap = seg(t, q.tap, q.tap + 0.25);
      const ok = ease.outCubic(seg(t, q.tap + 0.18, q.tap + 0.45));
      if (vis) c.ct.draw(`${tap.toFixed(2)}|${ok.toFixed(2)}`, (cx, w, h) => U.quizCard(cx, w, h, i, { tap, ok }));
      // l'ancien plan B fournit les illustrations : elles se posent au-dessus des cartes
      const p = props[i];
      const fromB = _a.copy(FB).add(PROP_POS[i]).add(_b.set(0, 0, 0.05));
      const onCard = _c.set(CC.x + Math.sin(th) * (RADIUS + 0.12), CC.y + CARD_H / 2 + 0.3, CC.z + Math.cos(th) * (RADIUS + 0.12));
      const travel = ease.inOutCubic(seg(t, S.carousel[0] - 0.05 + i * 0.06, S.carousel[1] - 0.1 + i * 0.06));
      if (t >= S.carousel[0]) {
        p.group.visible = outK < 1 && (travel < 1 || Math.cos(th) > -0.2);
        bez(p.group.position, fromB, _d.copy(fromB).lerp(onCard, 0.5).add(_b.set(0, 0.5, 0.4)), onCard, travel);
        p.group.position.y += Math.sin(t * 1.6 + i * 1.3) * 0.025;
        const front = Math.max(0, Math.cos(th));
        p.group.scale.setScalar(lerp(0.78, 0.46 + front * 0.16, travel) * (1 - outK));
        p.group.rotation.set(0, th * 0.4 + Math.sin(t * 0.9 + i) * 0.2, 0);
        // bonne réponse : l'illustration saute
        p.group.position.y += Math.sin(clamp((t - q.tap - 0.2) / 0.45) * Math.PI) * 0.18;
      } else if (t < S.subjects.out) p.group.visible = false;
      else p.group.visible = true;
      // gerbe à la bonne réponse
      const b = okBursts[i];
      b.object.position.set(CC.x, CC.y - 0.05, CC.z + RADIUS + 0.1);
      b.set(t - (q.tap + 0.18));
    });
    // l'étoile « Autres » reste au plan B
    const star = props[5].group;
    if (t >= S.carousel[0]) {
      const k = ease.inBack(seg(t, S.carousel[0], S.carousel[0] + 0.45));
      star.scale.setScalar(0.78 * (1 - k));
      star.visible = k < 1;
    }
    // progression
    progs.forEach(({ m, off }, i) => {
      const k = ease.outBack(seg(t, S.carousel[1] - 0.3 + i * 0.05, S.carousel[1] + 0.2 + i * 0.05));
      const done = ease.outCubic(seg(t, S.q[i].tap + 0.2, S.q[i].tap + 0.5));
      const x = CC.x + (i - 2) * 0.24;
      const y = CC.y - CARD_H / 2 - 0.2;
      const z = CC.z + RADIUS + 0.25;
      off.visible = m.visible = vis && k > 0.01 && outK < 1;
      off.position.set(x, y, z);
      off.scale.setScalar(clamp(k) * (1 - outK));
      m.position.set(x, y, z + 0.015);
      m.scale.set(clamp(k) * done * (1 - outK) + 0.0001, clamp(k) * (1 - outK) + 0.0001, 1);
      m.material.emissiveIntensity = 0.4 + decay(t, S.q[i].tap + 0.2, 4) * 1.5;
    });
  }

  // ===========================================================================
  // D — récompense

  function updateD(t) {
    const vis = t > S.reward[0] && t < S.converge[1] + 0.3;
    hourglass.group.visible = vis;
    const k = ease.outBack(seg(t, S.reward[0] + 0.1, S.reward[1] + 0.2), 1.3);
    const ek = ease.inCubic(seg(t, S.converge[0] + 0.1, S.converge[1] - 0.1));
    hourglass.group.position.copy(HG).add(_a.set(0, Math.sin(t * 1.2) * 0.02, 0)).lerp(_b.copy(LOGO_POS), ek);
    hourglass.group.scale.setScalar(clamp(k) * 1.15 * (1 - ek));
    // retournement : le sable passe en haut, puis s'écoule
    const fk = ease.inOutBack(seg(t, S.flip[0], S.flip[1]));
    const flipped = t >= S.flip[1];
    hourglass.group.rotation.set(0.12, Math.sin(t * 0.6) * 0.3 + 0.3, flipped ? 0 : fk * Math.PI);
    const flow = flipped ? ease.inOutSine(seg(t, S.flip[1], S.converge[0] + 0.4)) : 1;
    hourglass.update(flow, flipped, t);
    sandGlow.position.copy(hourglass.group.position).add(_a.set(0, -0.25, 0.25));
    sandGlow.material.uniforms.uIntensity.value = vis ? 0.25 * clamp(k) * (flipped ? 1 : 0.4) * (1 - ek) : 0;

    // +15 : jaillit du sablier et se plante dans l'écran
    const pk = seg(t, S.plus, S.plus + 0.85);
    plus.group.visible = pk > 0 && pk < 1;
    if (plus.group.visible) {
      const from = _a.copy(HG).add(_b.set(0, 0.55, 0.2));
      const to = screenWorld(kid, 195, 520, 0.06, _c);
      bez(plus.group.position, from, _d.copy(from).lerp(to, 0.5).add(_b.set(0, 0.55, 0.7)), to, ease.inOutCubic(pk));
      const s = Math.sin(pk * Math.PI);
      plus.group.scale.setScalar(0.09 + s * 0.16);
      plus.group.rotation.set(0, (1 - pk) * TAU * 0.5, Math.sin(pk * 6) * 0.1);
    }
    const hit = S.plus + 0.85;
    const wk = seg(t, hit, hit + 0.9);
    plusWave.visible = wk > 0 && wk < 1;
    plusWave.position.copy(screenWorld(kid, 195, 520, 0.08, _a));
    plusWave.quaternion.copy(kid.group.quaternion);
    plusWave.scale.setScalar(0.3 + 2.8 * ease.outCubic(wk));
    plusWave.material.uniforms.uK.value = wk;
    plusWave.material.uniforms.uIntensity.value = 1.8;
    plusFlare.position.copy(plusWave.position);
    plusFlare.material.uniforms.uIntensity.value = decay(t, hit, 5) * (t > hit ? 1.2 : 0) + pk * (1 - pk) * 1.2;
  }

  // ===========================================================================
  // E — logo

  function updateE(t) {
    const vis = t > S.converge[0];
    logoWorld.visible = vis;
    if (!vis) return;
    const g = logo.group;
    g.position.copy(LOGO_POS);
    const lt = t - S.logoLock;
    g.position.y += Math.sin(lt * 0.9) * 0.025 * clamp(lt);
    g.rotation.set(Math.sin(lt * 0.7) * 0.04 * clamp(lt), Math.sin(lt * 0.55) * 0.16 * clamp(lt), 0);
    g.updateMatrixWorld(true);
    for (const p of logoParts) {
      const k = seg(t, p.t0, p.t1);
      const kk = ease.inOutCubic(k);
      p.m.visible = t > p.t0;
      p.curve.getPointAt(kk, _a);
      g.worldToLocal(_a);
      if (k >= 1) _a.copy(p.m.userData.home);
      const settle = decay(t, p.t1, 7) * Math.sin((t - p.t1) * 30) * 0.03 * (t > p.t1 ? 1 : 0);
      p.m.position.copy(_a).add(_b.set(0, 0, settle));
      const spn = 1 - ease.outCubic(k);
      p.m.rotation.set(p.spin.x * spn, p.spin.y * spn, p.spin.z * spn);
      p.m.scale.setScalar(ease.outCubic(seg(k, 0, 0.3)) * lerp(0.5, 1, ease.outCubic(k)) * (1 + decay(t, p.t1, 8) * 0.06));
      p.trail.mesh.visible = t > p.t0 && t < p.t1 + 0.3;
      p.trail.mat.uniforms.uHead.value = kk;
      p.trail.mat.uniforms.uIntensity.value = 3.0 * (1 - ease.outCubic(seg(t, p.t1 - 0.05, p.t1 + 0.25)));
    }
    const lock = S.logoLock;
    const charge = ease.inCubic(seg(t, S.converge[0], lock)) * (1 - ease.outCubic(seg(t, lock, lock + 0.4)));
    core.material.uniforms.uIntensity.value = charge * 1.5;
    core.scale.setScalar(0.5 + charge * 1.3);
    logo.sweep.value = lerp(-2.2, 2.4, ease.inOutCubic(seg(t, S.sweep[0], S.sweep[1])));
    const rk = ease.outCubic(seg(t, lock - 0.1, lock + 0.6));
    logoRays.material.uniforms.uIntensity.value = rk * (0.13 + decay(t, lock, 2) * 0.4);
    logoRays.material.uniforms.uRot.value = t * 0.08;
    logoFlare.material.uniforms.uIntensity.value = decay(t, lock, 4.5) * 1.2;
    logoStreak.material.uniforms.uIntensity.value = decay(t, lock, 3) * 1.0;
    for (const [w, d, sc] of [
      [logoWave, 0, 7],
      [logoWave2, 0.12, 5.5],
    ]) {
      const wk = seg(t, lock + d, lock + d + 1.3);
      w.visible = wk > 0 && wk < 1;
      w.scale.setScalar(0.6 + sc * ease.outCubic(wk));
      w.material.uniforms.uK.value = wk;
      w.material.uniforms.uIntensity.value = 1.5;
    }
    logoBurst.set(t - lock);
    const sw = seg(t, S.sweep[0], S.sweep[1]);
    env.sweep.position.set(LOGO_POS.x + lerp(-2.5, 2.5, ease.inOutCubic(sw)), LOGO_POS.y + 1.0 - sw * 0.6, 1.6);
    env.sweep.intensity = Math.sin(sw * Math.PI) * 9;
  }

  // ===========================================================================
  // Caméra : un cadre par plan, raccords en « whip pan »

  const camOut = { pos: V(), look: V(), fov: 34, focus: 4.4, aperture: 0.45 };
  const camA = (t, o) => {
    const ph = lerp(-0.42, 0.14, ease.inOutSine(seg(t, 0, 4.7)));
    const d = lerp(5.0, 4.55, ease.inOutCubic(seg(t, 0, 4.7))) - pulse(t, S.full + 0.1, 0.25) * 0.12;
    o.pos.set(KID.x + Math.sin(ph) * d, KID.y + 0.4, KID.z + Math.cos(ph) * d);
    o.look.set(KID.x, KID.y + 0.24, KID.z);
  };
  const SECTION_Y = [0.5, 0.25, -0.12, -0.42, -0.62];
  const camB = (t, o) => {
    const st = rulesState(t);
    const sy = st.focus >= 0 ? SECTION_Y[st.focus] : 0.3;
    // la caméra suit doucement la section active
    const follow = lerp(0.3, sy, 0.35);
    o.pos.set(PB.x + 0.45 + Math.sin(t * 0.3) * 0.08, PB.y + 0.45 + follow * 0.4, PB.z + 4.6);
    o.look.set(PB.x + 0.2, PB.y + 0.26 + follow * 0.35, PB.z);
  };
  const camC = (t, o) => {
    const k = ease.inOutCubic(seg(t, S.carousel[0], S.carousel[1]));
    camB(t, _cam);
    o.pos.set(CC.x + Math.sin(t * 0.25) * 0.12, CC.y + 0.75, CC.z + 4.9).lerp(_cam.pos, 1 - k);
    o.look.set(CC.x, CC.y + 0.36, CC.z + 0.7).lerp(_cam.look, 1 - k);
  };
  const camD = (t, o) => {
    o.pos.set(KID.x - 0.32 + Math.sin(t * 0.3) * 0.08, KID.y + 0.6, KID.z + 4.65);
    o.look.set(KID.x - 0.36, KID.y + 0.3, KID.z);
  };
  const camE = (t, o) => {
    const k = ease.inOutCubic(seg(t, S.converge[0], S.logoLock + 0.3));
    camD(t, _cam);
    const push = seg(t, S.logoLock, 32) * 0.25;
    o.pos.set(LOGO_POS.x, LOGO_POS.y + 0.1, LOGO_POS.z + 5.3 - push).lerp(_cam.pos, 1 - k);
    o.look.set(LOGO_POS.x, LOGO_POS.y - 0.42, LOGO_POS.z).lerp(_cam.look, 1 - k);
  };
  const _cam = { pos: V(), look: V() };
  const _cam2 = { pos: V(), look: V() };
  function whip(t, w, fa, fb, o) {
    // raccord rapide : la caméra « file » d'un plan à l'autre
    fa(t, _cam);
    fb(t, _cam2);
    const k = ease.inOutExpo(seg(t, w[0], w[1]));
    o.pos.copy(_cam.pos).lerp(_cam2.pos, k);
    o.look.copy(_cam.look).lerp(_cam2.look, k);
    return k;
  }

  function updateCamera(t) {
    let wk = 0;
    const W2 = [S.done + 0.05, S.reward[0] + 0.55];
    if (t < S.whip[0]) camA(t, camOut);
    else if (t < S.whip[1]) wk = whip(t, S.whip, camA, camB, camOut);
    else if (t < S.carousel[0]) camB(t, camOut);
    else if (t < W2[0]) camC(t, camOut);
    else if (t < W2[1]) wk = whip(t, W2, camC, camD, camOut);
    else if (t < S.converge[0]) camD(t, camOut);
    else camE(t, camOut);
    camOut.focus = camOut.pos.distanceTo(camOut.look) - (t > S.carousel[0] && t < S.done ? -0.2 : 0);
    camOut.aperture = t > S.converge[0] ? 0.4 : 0.48;
    return wk;
  }

  // ===========================================================================
  // Ambiance

  function updateEnv(t) {
    const u = env.bgMat.uniforms;
    u.uTime.value = t;
    const rew = clamp(seg(t, S.plus, S.plus + 0.6) - seg(t, S.converge[0], S.converge[1]));
    const logoK = ease.inOutCubic(seg(t, S.converge[0], S.logoLock + 0.5));
    const warnA = decay(t, S.full, 2) * (t > S.full ? 1 : 0);
    u.uG1Col.value.set('#3DB5DA').multiplyScalar(0.3 + logoK * 0.15);
    u.uG2Col.value.set('#F97316').multiplyScalar(0.12 + rew * 0.2 + warnA * 0.25);
    u.uG3Col.value.set('#7FD3EC').multiplyScalar(logoK * 0.16);
    u.uExposure.value = 1;
    const look = camOut.look;
    env.floor.position.set(look.x, -1.15, look.z);
    env.floorMat.userData.fade.value = 0.8;
    env.shafts.children.forEach((s, i) => {
      s.material.uniforms.uIntensity.value = (0.5 + logoK * 0.5) * [0.14, 0.1, 0.12][i] * (1 + Math.sin(t * 0.7 + i * 2) * 0.12);
    });
    env.shafts.position.copy(look).add(_a.set(0, 0.2, -0.6));
    const du = env.dustMat.uniforms;
    du.uT.value = t;
    du.uCenter.value.copy(look);
    du.uFocus.value = camOut.focus;
    du.uAperture.value = camOut.aperture;
    du.uIntensity.value = 0.9 + logoK * 0.3;
    env.key.target.position.copy(look);
    env.key.position.copy(look).add(_a.set(-3.0, 7.0, 4.2));
    env.key.intensity = 20;
    env.rimC.position.copy(look).add(_a.set(-3.4, 2.2, -2.8));
    env.rimO.position.copy(look).add(_a.set(3.5, 0.8, -2.4));
    env.rimO.intensity = 7 + rew * 10 + warnA * 8;
    env.rimC.intensity = 10 + logoK * 6;
    env.fill.position.copy(look).add(_a.set(3, 2, 6));
  }

  // ===========================================================================

  const _pp = V();
  function project(v) {
    _pp.copy(v).project(camera);
    return { x: (_pp.x * 0.5 + 0.5) * 100, y: (-_pp.y * 0.5 + 0.5) * 100 };
  }

  function update(t) {
    const wk = updateCamera(t);
    camera.position.copy(camOut.pos);
    camera.position.x += wobble(t * 0.8, 1) * 0.01;
    camera.position.y += wobble(t * 0.7, 2) * 0.008;
    camera.up.set(0, 1, 0);
    camera.lookAt(camOut.look);
    camera.rotateZ(wobble(t * 0.5, 3) * 0.004 + Math.sin(wk * Math.PI) * 0.05);
    camera.fov = camOut.fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    updateA(t);
    updateB(t);
    updateC(t);
    updateD(t);
    updateE(t);
    updateEnv(t);

    const whipK = Math.sin(wk * Math.PI);
    const post = {
      time: t,
      focus: camOut.focus,
      aperture: camOut.aperture,
      maxBlur: 22,
      exposure: 1 + whipK * 0.08,
      bloom: 0.5 + decay(t, S.full, 4) * (t > S.full ? 0.08 : 0) + decay(t, S.logoLock, 3) * (t > S.logoLock ? 0.15 : 0),
      bloomRadius: 0.6,
      threshold: 1.3,
      vignette: 0.58,
      grain: 0.035,
      ca: 0.012 + whipK * 0.12,
      zoom: whipK * 0.35 + pulse(t, S.full + 0.05, 0.2) * 0.25,
      flash: whipK * 0.05 + decay(t, S.full, 9) * (t > S.full ? 0.06 : 0) + decay(t, S.logoLock, 8) * (t > S.logoLock ? 0.1 : 0),
      fade: 1 - ease.outCubic(seg(t, 0, 0.8)),
      sat: 1,
      flashCol: '#EAF8FF',
    };

    const anchors = {
      unlock: project(_a.copy(toggle.group.position).add(_b.set(0, -0.24, 0))),
      freq: project(_a.copy(FB).add(_b.set(0, -0.6, 0.1))),
      perQuiz: project(_a.copy(FB).add(_b.set(0, -0.52, 0.1))),
      sig: project(_a.copy(LOGO_POS).add(_b.set(0, -0.95, 0))),
    };
    return { post, anchors };
  }

  function showAll(on) {
    scene.traverse((o) => {
      if (on) o.visible = true;
    });
  }

  return { update, showAll, env };
}
