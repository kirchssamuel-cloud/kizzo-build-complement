// The director: maps the master clock to every camera move, object, shader
// uniform, UI state and typographic beat. Pure function of t.
import { T, clamp, lerp, E, EASE, prog, bump, hit, hitw, spring, track, wobble } from './timeline.js';
import { BRAND } from './palette.js';
import {
  drawParentScreen,
  drawKidScreen,
  drawLimitPanel,
  drawWeekPanel,
  drawQuizPanel,
  drawQuizCard,
  CARD_BEAT,
} from './ui.js';
import { updateType } from './type.js';
import { updateLogo, LOGO } from './logo.js';
import { PHONE, screenPtToLocal, W, H } from './scene.js';

export function makeDirector(S, surfaces, ty, lg, layout) {
  const THREE = S.THREE;
  const v3 = new THREE.Vector3();
  const v3b = new THREE.Vector3();
  const look = new THREE.Vector3();

  // ── camera ───────────────────────────────────────────────────────────────
  const camPos = track([
    [0, [0.38, 0.22, 11.8]],
    [T.rush[0], [-0.12, 0.02, 9.3], E.inOutSine],
    [T.rush[1], [0.45, 0.32, 7.5], EASE.whip],
    [4.45, [1.1, 0.4, 7.05], EASE.cine],
    [T.toKid[0], [-0.7, 0.2, 6.7], E.inOutSine],
    [T.toKid[1], [0.08, 0.14, 6.4], EASE.whip],
    [T.reward, [0.22, 0.08, 6.05], E.inOutSine],
    [T.reward + 0.8, [0.5, 0.24, 4.7], EASE.cine],
    [T.exit[0], [0.52, 0.26, 4.5], E.inOutSine],
    [T.exit[1], [0.3, 0.16, 5.9], EASE.whip],
    [15, [0.05, 0.05, 5.2], E.inOutSine],
  ]);
  const camLook = track([
    [0, [0, 0, 0]],
    [T.rush[0], [0, 0, 0]],
    [T.rush[1], [0, 0.04, 0], EASE.whip],
    [T.toKid[0], [0, 0.03, 0]],
    [T.toKid[1], [0.2, 0.0, 0], EASE.whip],
    [T.reward, [0.22, 0.0, 0]],
    [T.reward + 0.8, [0.6, 0.24, 0], EASE.cine],
    [T.exit[0], [0.62, 0.24, 0]],
    [T.exit[1], [0.4, 0.15, -2], EASE.whip],
    [15, [0.05, 0.05, -2], E.inOutSine],
  ]);

  // ── phone ────────────────────────────────────────────────────────────────
  const phonePos = track([
    [T.phoneIn[0], [0.1, -0.6, -11]],
    [T.phoneIn[1], [0, 0, 0], EASE.cine],
    [T.toKid[0], [0, 0.03, 0], E.inOutSine],
    [T.toKid[1], [1.05, 0, 0], EASE.whip],
    [T.exit[0], [1.05, 0.02, 0]],
    [T.exit[1], [2.6, 1.3, -17], EASE.accel],
  ]);
  const phoneRot = track([
    [T.phoneIn[0], [0.6, -1.35, 0.32]],
    [T.phoneIn[1], [0.07, -0.27, 0.0], EASE.cine],
    [T.toKid[0], [0.05, 0.15, 0], E.inOutSine],
    [T.toKid[0] + 0.34, [0.0, -0.66, -0.035], EASE.whip],
    [T.toKid[1] + 0.25, [0.04, -0.3, 0], EASE.settle],
    [T.reward, [0.03, -0.25, 0], E.inOutSine],
    [T.reward + 0.6, [0.0, -0.12, 0], EASE.cine],
    [T.exit[0], [0.0, -0.1, 0]],
    [T.exit[1], [0.75, -1.7, 0.5], EASE.accel],
  ]);

  // ── parent panels ────────────────────────────────────────────────────────
  const PANEL_POS = [
    [-1.8, 0.5, 0.5],
    [1.84, 0.68, -0.4],
    [1.55, -0.66, 0.72],
  ];
  const PANEL_ROT = [
    [0.02, 0.36, 0.02],
    [0.0, -0.34, -0.02],
    [-0.04, -0.3, 0.02],
  ];
  const panelDraw = [drawLimitPanel, drawWeekPanel, drawQuizPanel];
  const panelKeys = ['limit', 'week', 'quiz'];

  // ── data stories ─────────────────────────────────────────────────────────
  const limitAt = (t) => lerp(180, 120, EASE.glide(clamp((t - T.slider[0]) / (T.slider[1] - T.slider[0]))));
  const usedAt = (t) => {
    if (t < T.screenOn + 0.1) return 0;
    if (t < 4.75) return 84 * EASE.cine(clamp((t - T.screenOn - 0.1) / (4.75 - T.screenOn - 0.1)));
    return lerp(84, 120, E.inOutSine(clamp((t - 4.75) / (T.notify - 4.75))));
  };
  const solvedAt = (t) => T.cards.reduce((s, c) => s + EASE.cine(clamp((t - c - CARD_BEAT.snap) / 0.35)), 0);

  const ringLocal = screenPtToLocal(215, 280);
  const slotLocal = screenPtToLocal(215, 628);
  const cardRest = new THREE.Vector3(0.24, -0.3, PHONE.front + 0.42);

  const glowNavy = new THREE.Color(BRAND.navy);
  const glowBlue = new THREE.Color('#0F4F86');
  const tint = new THREE.Color();

  const bgBeams = track([
    [0, 0], [0.45, 0], [1.5, 1.0, E.inOutSine], [3.0, 0.75], [3.6, 0.55], [T.toKid[0], 0.6],
    [T.toKid[1], 0.9], [T.exit[0], 0.9], [T.exit[1] + 0.1, 0.15], [T.dissolve, 0.25], [T.logoSolid + 0.2, 1.0, E.inOutSine], [15, 1.0],
  ]);
  const bgBeamPos = track([
    [0, [0.5, 1.32]], [3.4, [0.5, 1.32]], [4.2, [0.32, 1.28]], [T.toKid[0], [0.36, 1.28]], [T.toKid[1], [0.68, 1.3]],
    [T.exit[1], [0.6, 1.3]], [T.dissolve, [0.5, 1.36]], [15, [0.5, 1.36]],
  ]);
  const bgGlow = track([
    [0, 0], [0.4, 0], [1.2, 0.55], [3.0, 0.5], [3.6, 0.7], [T.toKid[0], 0.7], [T.toKid[1], 0.55], [T.exit[0], 0.6],
    [T.exit[1] + 0.1, 0.15], [T.dissolve, 0.3], [T.logoSolid + 0.3, 1.0, E.inOutSine], [15, 1.05],
  ]);
  const bgGlowPos = track([
    [0, [0.5, 0.5]], [3.5, [0.5, 0.5]], [T.toKid[0], [0.5, 0.5]], [T.toKid[1], [0.66, 0.5]], [T.exit[0], [0.6, 0.52]],
    [T.exit[1], [0.5, 0.5]], [T.dissolve, [0.5, 0.56]], [15, [0.5, 0.56]],
  ]);

  // screen-space projection helper
  const toScreen = (vec) => {
    v3b.copy(vec).project(S.camera);
    return [(v3b.x * 0.5 + 0.5) * W, (1 - (v3b.y * 0.5 + 0.5)) * H];
  };

  // Redraw + re-upload a UI canvas only when its state actually changed.
  const lastState = {};
  const paint = (name, draw, state) => {
    const key = JSON.stringify(state);
    if (lastState[name] === key) return;
    lastState[name] = key;
    draw(surfaces[name], state);
    S.tex[name].needsUpdate = true;
  };
  const drawCard = (s, st) => drawQuizCard(s, st.i, st.u);

  return function renderAt(t) {
    // ── camera
    const cp = camPos(t), cl = camLook(t);
    S.camera.position.set(cp[0] + wobble(t * 0.6, 1) * 0.04, cp[1] + wobble(t * 0.5, 2) * 0.03, cp[2]);
    look.set(cl[0], cl[1], cl[2]);
    S.camera.lookAt(look);
    S.camera.fov = 30 + 9 * bump(t, T.rush[0] + 0.05, T.rush[1] + 0.12);
    S.camera.updateProjectionMatrix();

    // ── background
    const bu = S.bgMat.uniforms;
    bu.uTime.value = t;
    bu.uFade.value = prog(t, 0.22, 1.2, E.inOutSine);
    bu.uBeams.value = bgBeams(t);
    const bp = bgBeamPos(t);
    bu.uBeamPos.value.set(bp[0], bp[1]);
    bu.uGlow.value = bgGlow(t);
    const gp = bgGlowPos(t);
    bu.uGlowPos.value.set(gp[0], gp[1]);
    const kidTint = prog(t, T.toKid[0], 0.6) * (1 - prog(t, T.exit[0], 0.5));
    tint.copy(glowNavy).lerp(glowBlue, kidTint);
    bu.uGlowTint.value.copy(tint);

    S.dust.material.uniforms.uTime.value = t;
    S.dust.material.uniforms.uOpacity.value = prog(t, 0.45, 1.6, E.inOutSine) * 0.9;
    S.dust.material.uniforms.uWarp.value = prog(t, T.rush[0], T.rush[1] - T.rush[0], EASE.accel) * 5 + prog(t, T.exit[0], 0.6, EASE.accel) * 3;
    S.floor.material.uniforms.uOpacity.value =
      prog(t, 0.9, 1.0) * 0.45 * (1 - prog(t, T.toKid[0], 0.5) * 0.75) * (1 - prog(t, T.exit[0], 0.4));

    // ── opening geometry
    const showOpen = t < T.rush[1] + 0.06;
    S.opening.visible = showOpen;
    if (showOpen) {
      const rush = prog(t, T.rush[0], T.rush[1] - T.rush[0], EASE.accel);
      S.opening.position.z = rush * 17;
      S.opening.rotation.z = rush * 0.35;
      const dimForText = lerp(1, 0.34, prog(t, T.screenLine - 0.1, 0.7));
      S.rings.forEach((m, i) => {
        const u = m.material.uniforms;
        const st = T.rings + i * 0.085;
        u.uEnd.value = EASE.cine(prog(t, st, 1.15));
        u.uHead.value = 1 - prog(t, st + 0.85, 0.4);
        u.uOpacity.value = dimForText * (1 + rush * 1.5) * (1 - prog(t, T.rush[0] + 0.24, 0.2));
        const b = m.userData.baseRot;
        const dir = i % 2 ? 1 : -1;
        m.rotation.set(b[0] + wobble(t * 0.4, i) * 0.06, b[1] + t * 0.05 * dir, b[2] + t * 0.16 * dir);
      });
      const sp = spring(t - 0.82, 1.4, 0.55);
      S.sphere.scale.setScalar(Math.max(0.0001, sp));
      S.sphere.material.uniforms.uOpacity.value = dimForText * (1 - prog(t, T.rush[0] + 0.2, 0.2));
      S.sphere.position.y = 1.25 + wobble(t * 0.5, 3) * 0.06;
      S.capsules.forEach((m, i) => {
        const k = EASE.cine(prog(t, T.capsules + i * 0.13, 1.25));
        const ang = m.rotation.z;
        const ax = -Math.sin(ang), ay = Math.cos(ang);
        const off = (1 - k) * 7.5 * (i % 2 ? 1 : -1) + Math.sin(t * 0.55 + i * 2) * 0.12;
        m.position.set(m.userData.rest.x + ax * off, m.userData.rest.y + ay * off, m.userData.rest.z);
        m.material.uniforms.uOpacity.value = k * dimForText * (1 - prog(t, T.rush[0] + 0.2, 0.2));
      });
    }

    // ── phone
    const showPhone = t >= T.phoneIn[0] && t <= T.exit[1];
    const P = S.phone;
    P.group.visible = showPhone;
    if (showPhone) {
      const pp = phonePos(t), pr = phoneRot(t);
      P.group.position.set(pp[0], pp[1] + Math.sin(t * 1.35) * 0.022, pp[2]);
      P.group.rotation.set(pr[0] + Math.sin(t * 0.9) * 0.012, pr[1] + Math.sin(t * 0.7) * 0.015, pr[2]);
      const rewardPop = 1 + 0.035 * hit(t, T.reward, 0.05, 0.35);
      P.group.scale.setScalar(rewardPop);
      P.group.updateMatrixWorld();

      const su = P.screenMat.uniforms;
      su.uTime.value = t;
      su.uPower.value = prog(t, T.screenOn, 0.65);
      const mixK = prog(t, T.toKid[0] + 0.1, 0.5, E.inOutCubic);
      su.uMix.value = mixK;
      su.uDim.value = 1 - prog(t, T.exit[0] + 0.15, 0.4, E.inQuad);
      // device light in the haze
      const hm = P.halo.material.uniforms;
      hm.uColor.value.set(mixK > 0.5 ? BRAND.blue : '#2A76B8');
      hm.uOpacity.value = su.uPower.value * (0.45 + 0.4 * mixK) * su.uDim.value + 0.3 * hit(t, T.reward, 0.04, 0.6);

      // rim lights travel across the frame for moving reflections
      const a = t * 0.6;
      S.lights.rimBlue.position.set(-4 * Math.cos(a * 0.5), 2 + Math.sin(a) * 1.5, -2.5 + Math.sin(a * 0.7) * 2);
      S.lights.rimOrange.position.set(4 * Math.cos(a * 0.4), -1.5 + Math.cos(a) * 1.2, -2.5 + Math.cos(a * 0.6) * 2);
      S.lights.key.intensity = 0.4 + 1.6 * bump(t, T.phoneIn[0] + 0.3, T.phoneIn[1] + 0.4);

      // parent screen
      if (mixK < 1) {
        paint('parent', drawParentScreen, {
          power: 1,
          used: usedAt(t),
          limit: limitAt(t),
          quizOn: prog(t, T.toggle, 0.22, E.inOutCubic),
          notify: prog(t, T.notify, 0.55),
          reveal: prog(t, T.screenOn + 0.05, 0.9),
        });
      }
      // kid screen
      if (mixK > 0) {
        const rewardT = t >= T.reward ? t - T.reward : 0;
        paint('kid', drawKidScreen, {
          solved: solvedAt(t),
          reward: prog(t, T.reward, 0.3),
          rewardT: Math.min(rewardT, 1.6),
          deck: prog(t, T.toKid[1] - 0.2, 0.3) * (1 - prog(t, T.reward, 0.2)),
        });
      }

      // quiz cards
      S.cards.forEach((m, i) => {
        const u = t - T.cards[i];
        const vis = u > -0.02 && u < 1.15;
        m.visible = vis;
        if (!vis) return;
        const inK = EASE.cine(clamp(u / 0.4));
        const outK = EASE.accel(clamp((u - 0.8) / 0.32));
        m.position.copy(slotLocal).lerp(cardRest, inK);
        m.position.x += outK * 1.7;
        m.position.y += outK * 0.6;
        m.position.z += outK * 0.5;
        m.rotation.set(lerp(-0.35, -0.03, inK) - outK * 0.1, lerp(0, 0.14, inK) + outK * 0.55, lerp(0.03, 0, inK) - outK * 0.38);
        const snap = Math.sin(Math.PI * clamp((u - CARD_BEAT.snap) / 0.22));
        m.scale.setScalar(lerp(0.84, 1.1, inK) * (1 + 0.04 * snap));
        m.material.opacity = clamp(inK * 2.5) * (1 - outK);
        paint(`card${i}`, drawCard, { i, u: Math.min(u, 0.8) });
      });
    }

    // ── light trails around the arriving phone
    const showTrails = t > T.phoneIn[0] && t < T.phoneIn[1] + 0.9;
    S.trails.forEach((m, i) => {
      m.visible = showTrails;
      if (!showTrails) return;
      const st = T.phoneIn[0] + 0.08 + i * 0.09;
      const head = EASE.cine(prog(t, st, 1.25)) * 1.35;
      const u = m.material.uniforms;
      u.uEnd.value = head;
      u.uStart.value = head - 0.55;
      u.uOpacity.value = prog(t, st, 0.1) * (1 - prog(t, st + 0.95, 0.5));
      m.position.copy(P.group.position);
    });

    // ── floating parent panels
    S.panels.forEach((m, i) => {
      const rv = prog(t, T.panels[i], 0.85);
      const out = prog(t, T.toKid[0] - 0.06 + i * 0.05, 0.36, EASE.accel);
      const op = clamp(rv * 3) * (1 - out);
      m.visible = op > 0.002;
      if (!m.visible) return;
      const k = EASE.cine(rv);
      const p = PANEL_POS[i], r = PANEL_ROT[i];
      v3.set(p[0], p[1] - (1 - k) * 0.35 + Math.sin(t * 1.1 + i * 2.1) * 0.03, p[2] - (1 - k) * 0.7);
      v3.lerp(P.group.position, out * 0.85);
      m.position.copy(v3);
      m.rotation.set(r[0] - (1 - k) * 0.45, r[1], r[2]);
      m.scale.setScalar(lerp(1, 0.25, out));
      m.material.opacity = op;
      if (i === 0) paint('limit', panelDraw[0], { reveal: rv, limit: limitAt(t), knob: bump(t, T.slider[0] - 0.1, T.slider[1] + 0.1) });
      if (i === 1) paint('week', panelDraw[1], { reveal: rv, bars: prog(t, T.panels[1] + 0.2, 1.1) });
      if (i === 2) paint('quiz', panelDraw[2], { reveal: rv, on: prog(t, T.toggle, 0.22, E.inOutCubic) });
    });

    // ── kid progress halo, shockwave and reward burst
    const haloOn = prog(t, T.toKid[1] - 0.15, 0.5) * (1 - prog(t, T.exit[0], 0.3));
    S.halo.visible = haloOn > 0.002;
    if (S.halo.visible) {
      const u = S.halo.material.uniforms;
      v3.copy(P.group.position);
      S.halo.position.set(v3.x, v3.y + 0.05, v3.z - 0.4);
      const solved = solvedAt(t);
      u.uEnd.value = clamp(solved / 3);
      u.uStart.value = 0;
      u.uTrack.value = 0.9;
      u.uOpacity.value = haloOn;
      const snaps = T.cards.reduce((s, c) => s + hit(t, c + CARD_BEAT.snap, 0.03, 0.25), 0);
      u.uIntensity.value = 2.2 + 1.5 * snaps + 2.6 * hit(t, T.reward, 0.03, 0.4);
      S.halo.scale.setScalar((1 + 0.025 * snaps + 0.06 * hit(t, T.reward, 0.03, 0.3)) * lerp(0.85, 1, EASE.cine(haloOn)));
      S.halo.rotation.z = 0;
    }
    const sk = prog(t, T.reward, 1.0, E.outCubic);
    S.shock.visible = t >= T.reward && sk < 1;
    if (S.shock.visible) {
      S.shock.position.copy(S.halo.position);
      S.shock.scale.setScalar(1 + sk * 2.2);
      S.shock.material.uniforms.uOpacity.value = (1 - sk) * 0.9;
    }
    const bt = t - T.reward;
    S.burst.visible = bt > 0 && bt < 2.4;
    if (S.burst.visible) {
      S.burst.material.uniforms.uT.value = bt;
      S.burst.material.uniforms.uOrigin.value.copy(ringLocal).applyMatrix4(P.group.matrixWorld);
    }

    // ── HUD: the orange orb, flares, flashes, particles
    const hud = S.hud;
    const ou = hud.orb.material.uniforms;
    let orbOn = 0, ox = 960, oy = 540, orr = 0, glow = 1;
    if (t >= T.ignite && t < T.orbToDot[1] + 0.12) {
      const grow = spring(t - T.ignite, 1.6, 0.55);
      orr = 9.5 * grow + Math.sin(t * 5) * 0.4 * prog(t, 0.7, 0.3);
      glow = 1.1 + 2.6 * hit(t, T.ignite, 0.05, 0.5);
      orbOn = 1;
      const k = EASE.glide(prog(t, T.orbToDot[0], T.orbToDot[1] - T.orbToDot[0]));
      if (k > 0) {
        const d = layout.dotScreen;
        const mx = lerp(960, d.cx, 0.5), my = Math.min(540, d.cy) - 160;
        const q = 1 - k;
        ox = q * q * 960 + 2 * q * k * mx + k * k * d.cx;
        oy = q * q * 540 + 2 * q * k * my + k * k * d.cy;
        orr = lerp(orr, d.w / 2, k);
        glow = lerp(glow, 0.9, k);
      }
      orbOn = 1 - prog(t, T.orbToDot[1], 0.1);
    }
    if (t >= T.dissolve && t < T.orbLand + 0.12) {
      const d = layout.dotKizzo;
      const k = EASE.glide(prog(t, T.dissolve + 0.08, T.orbLand - T.dissolve - 0.08));
      const mx = lerp(d.cx, LOGO.dot.x, 0.55), my = Math.min(d.cy, LOGO.dot.y) - 240;
      const q = 1 - k;
      ox = q * q * d.cx + 2 * q * k * mx + k * k * LOGO.dot.x;
      oy = q * q * d.cy + 2 * q * k * my + k * k * LOGO.dot.y;
      orr = lerp(d.w / 2, LOGO.dot.r, E.inOutSine(k));
      glow = 1 + 1.4 * Math.sin(Math.PI * k);
      orbOn = 1 - prog(t, T.orbLand, 0.08);
    }
    hud.orb.visible = orbOn > 0.001 && orr > 0.2;
    if (hud.orb.visible) {
      const size = Math.max(orr, 0.5) / 0.1;
      hud.orb.scale.set(size, size, 1);
      hud.orb.position.set(ox, H - oy, 0);
      ou.uCore.value = 0.1;
      ou.uGlow.value = glow;
      ou.uOpacity.value = orbOn;
    }

    // anamorphic flares
    const fu = hud.flare.material.uniforms;
    const fIgnite = hitw(t, T.ignite, 0.05, 0.5, 1.4) * 1.1;
    const fRush = hitw(t, T.rush[1] - 0.12, 0.05, 0.22, 0.6) * 1.1;
    const fReward = hitw(t, T.reward, 0.03, 0.3, 0.9) * 0.8;
    const fSweep = bump(t, T.sweep[0] + 0.15, T.sweep[1] - 0.05) * 0.55;
    const f = Math.max(fIgnite, fRush, fReward, fSweep);
    hud.flare.visible = f > 0.003;
    if (hud.flare.visible) {
      let fx = 960, fy = 540, w = 0.45;
      if (f === fReward) {
        const [sx, sy] = toScreen(v3.copy(ringLocal).applyMatrix4(P.group.matrixWorld));
        fx = sx; fy = sy; w = 0.5;
      } else if (f === fSweep) {
        fy = LOGO.top + LOGO.h * 0.42;
        fx = lerp(LOGO.left - 200, LOGO.left + LOGO.w + 200, prog(t, T.sweep[0], T.sweep[1] - T.sweep[0], E.inOutCubic));
        w = 0.35;
      } else if (f === fIgnite) w = lerp(0.05, 0.5, E.outCubic(prog(t, T.ignite, 0.5)));
      hud.flare.position.set(fx, H - fy, 0);
      fu.uOpacity.value = f;
      fu.uWidth.value = w;
      fu.uColor.value.set(f === fReward ? '#FFD2AE' : '#A8E4FF');
    }

    // full-frame flashes
    const fl = hud.flash.material.uniforms;
    // linear-light values: small numbers already read as bright veils after sRGB encoding
    const flashK = hitw(t, T.rush[1] - 0.12, 0.025, 0.045, 0.16) * 0.32 + hitw(t, T.reward, 0.02, 0.06, 0.25) * 0.06;
    hud.flash.visible = flashK > 0.002;
    fl.uOpacity.value = flashK;

    // pulse rings: orb lands as a full stop, orb lands in the logo
    const pu = hud.pulse.material.uniforms;
    const p1 = prog(t, T.orbToDot[1], 0.6, E.outCubic);
    const p2 = prog(t, T.orbLand, 0.8, E.outCubic);
    if (t >= T.orbLand) {
      hud.pulse.visible = p2 < 1;
      hud.pulse.position.set(LOGO.dot.x, H - LOGO.dot.y, 0);
      hud.pulse.scale.set(700, 700, 1);
      pu.uR.value = (LOGO.dot.r + p2 * 190) / 700;
      pu.uW.value = 0.006 + p2 * 0.01;
      pu.uOpacity.value = (1 - p2) * 1.2;
    } else if (t >= T.orbToDot[1]) {
      const d = layout.dotScreen;
      hud.pulse.visible = p1 < 1;
      hud.pulse.position.set(d.cx, H - d.cy, 0);
      hud.pulse.scale.set(400, 400, 1);
      pu.uR.value = (d.w / 2 + p1 * 70) / 400;
      pu.uW.value = 0.006;
      pu.uOpacity.value = (1 - p1) * 0.9;
    } else hud.pulse.visible = false;

    // text → logo particles
    if (layout.particles) {
      const lp = layout.particles;
      const pt = t - T.dissolve;
      lp.visible = pt > 0 && t < T.logoSolid + 0.5;
      lp.material.uniforms.uT.value = pt;
      lp.material.uniforms.uOpacity.value = 1 - prog(t, T.logoSolid - 0.05, 0.45, E.inOutSine);
    }

    S.film.uniforms.uTime.value = t;
    S.bloom.strength = 0.8 + 0.2 * hit(t, T.reward, 0.04, 0.5) + 0.3 * hit(t, T.rush[1] - 0.12, 0.04, 0.3);

    // ── DOM layers
    updateType(ty, t, layout);
    updateLogo(lg, t);

    S.composer.render();
  };
}
