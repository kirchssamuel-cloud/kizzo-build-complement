// The director: maps the master clock to every shot, camera move, screen,
// graphic and line of copy. Pure function of t.
import { clamp, lerp, E, EASE, prog, bump, hit, spring, track, wobble } from './timeline.js';
import { T, SHOTS, POI } from './cues.js';
import { BRAND, APP, rgba } from './palette.js';
import { W, H, PHONE, SHEET, ribbon } from './scene.js';
import { PAGE } from './lesson.js';
import { drawCard, CARD, QUESTIONS } from './graphics.js';
import { updateOverlay } from './overlay.js';

// Where things are on the real screenshots (top-down uv).
const UI = {
  createQuizBtn: [0.5, 0.576],   // tableau de bord → « Créer un quiz avec une photo »
  openCameraBtn: [0.5, 0.197],   // photo-lecon → « Ouvrir l'appareil photo »
  question1: [0.5, 0.43],        // questions → question 1
  autoQuizCard: [0.5, 0.492],    // tableau de bord → « Quiz automatiques »
};

export function makeDirector(S, clips, o, assets) {
  const THREE = S.THREE;
  const v = new THREE.Vector3(), v2 = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  const look = new THREE.Vector3();
  const q = new THREE.Quaternion(), qo = new THREE.Quaternion(), e = new THREE.Euler();
  const toScreen = (p) => {
    v2.copy(p).project(S.camera);
    return [(v2.x * 0.5 + 0.5) * W, (1 - (v2.y * 0.5 + 0.5)) * H];
  };

  // ── camera (world) ───────────────────────────────────────────────────────
  const HERO = { pos: [0, 0.19, 5.4], look: [0, 0.19, 0] };
  const DESK = { pos: [0, 1.21, 2.1], look: [0, -2.6, -0.1] };
  const camPos = track([
    [0, HERO.pos],
    [T.table[0], [0, 0.19, 5.1], E.inOutSine],
    [T.table[1], DESK.pos, EASE.glide],
    [16.4, [0, 0.95, 1.75], E.inOutSine],
    [18.55, [0, 1.35, 2.3], E.inOutSine],
    [19.65, HERO.pos, EASE.glide],
    [22.0, [0, 0.19, 4.9], E.inOutSine],
    [26.6, [0, 0.19, 4.9]],
    [26.9, HERO.pos],
    [31.75, [0, 0.19, 5.0], E.inOutSine],
    [45, [0, 0.19, 5.0]],
  ]);
  const camLook = track([
    [0, HERO.look],
    [T.table[0], HERO.look],
    [T.table[1], DESK.look, EASE.glide],
    [16.4, [0, -2.6, -0.2], E.inOutSine],
    [18.55, [0, -1.9, -0.2], E.inOutSine],
    [19.65, HERO.look, EASE.glide],
    [45, HERO.look],
  ]);

  // ── phone, framed like a camera operator would: [distance, screen x, screen y]
  // (screen coords in -1..1, y up) + attitude [pitch, yaw, roll] relative to the lens
  const phoneRel = track([
    [T.phoneIn[0], [5.6, 0.0, -1.7]],
    [T.phoneIn[1], [5.4, 0, -0.104], EASE.cine],
    [T.table[0], [5.1, 0, -0.104], E.inOutSine],
    [T.table[1], [3.3, 0.52, 1.0], EASE.glide],
    [16.4, [3.3, 0.6, 1.14], E.inOutSine],
    [18.55, [3.4, 0.22, 0.6], E.inOutSine],
    [19.65, [5.4, 0, -0.104], EASE.glide],
    [22.0, [4.9, 0, -0.104], E.inOutSine],
    [T.toC4 - 0.35, [4.9, 0, -0.104]],
    [T.toC4 + 0.15, [6.0, 0, -2.2], EASE.accel],
    [26.85, [5.6, 0, -1.8]],
    [27.75, [5.4, 0, -0.104], EASE.cine],
    [31.75, [5.0, 0, -0.104], E.inOutSine],
    [32.9, [6.4, -0.06, -0.08], EASE.accel],
  ]);
  const phoneAtt = track([
    [T.phoneIn[0], [0.75, -0.5, 0.18]],
    [T.phoneIn[1], [0.03, -0.12, 0.0], EASE.cine],
    [T.table[0], [0.02, 0.05, 0.0], E.inOutSine],
    [T.table[1], [0.55, -0.25, -0.18], EASE.glide],
    [18.55, [0.25, -0.12, -0.06], E.inOutSine],
    [19.65, [0.02, 0.08, 0.0], EASE.glide],
    [22.0, [0.0, -0.04, 0.0], E.inOutSine],
    [26.85, [0.6, 0.4, -0.12]],
    [27.75, [0.02, -0.06, 0.0], EASE.cine],
    [31.75, [0.0, 0.04, 0.0], E.inOutSine],
    [32.9, [0.1, 0.3, 0.05], EASE.accel],
  ]);
  const phoneOn = (t) => (t > T.phoneIn[0] && t < T.toC4 - 0.1) || (t > T.toPhone5 - 0.05 && t < 33.0);

  // ── screen content
  const screenAt = (t) => {
    // returns [A, B, wipe, mode, center]
    if (t < T.wipeB) return ['tableau-de-bord', null, 0, 0, UI.createQuizBtn];
    if (t < T.wipeB + 0.45) return ['tableau-de-bord', 'photo-lecon', E.inOutCubic(prog(t, T.wipeB, 0.45)), 0, UI.createQuizBtn];
    if (t < T.wipeC) return ['photo-lecon', null, 0, 0, UI.openCameraBtn];
    if (t < T.wipeC + 0.45) return ['photo-lecon', 'appareil-photo', E.inOutCubic(prog(t, T.wipeC, 0.45)), 0, UI.openCameraBtn];
    if (t < T.wipeD) return ['appareil-photo', null, 0, 0, UI.openCameraBtn];
    if (t < T.wipeD + 0.4) return ['appareil-photo', 'lecture', E.inOutCubic(prog(t, T.wipeD, 0.4)), 1, UI.openCameraBtn];
    if (t < T.wipeE) return ['lecture', null, 0, 1, UI.openCameraBtn];
    if (t < T.wipeE + 0.45) return ['lecture', 'questions', E.inOutCubic(prog(t, T.wipeE, 0.45)), 1, UI.openCameraBtn];
    if (t < T.toPhone5 - 0.1) return ['questions', null, 0, 1, UI.openCameraBtn];
    return ['tableau-de-bord', null, 0, 0, UI.autoQuizCard];
  };
  const cropAt = (t) => {
    if (t > 20.55 && t < T.toC4 + 0.4) {
      const k = EASE.glide(prog(t, 20.6, 1.1));
      return [lerp(1, 1.42, k), 0.5, lerp(0.5, UI.question1[1], k)];
    }
    if (t > T.toPhone5) {
      const k = EASE.glide(prog(t, 28.0, 1.1)) * (1 - EASE.glide(prog(t, 31.3, 0.5)));
      return [lerp(1, 1.7, k), 0.5, lerp(0.5, UI.autoQuizCard[1], k)];
    }
    return [1, 0.5, 0.5];
  };

  // ── HUD pieces built from layout
  // over Ben's tablet, so his face stays clear (the card stands for what he sees)
  const ans = { cx: 540, cy: 1200 };
  const pills = drawCard(assets.answerCanvas, 0, 0);
  const pill = pills[QUESTIONS[0].ok];
  const ox = ans.cx - CARD.w / 2, oy = ans.cy - CARD.h / 2;
  const pr = { x: ox + pill.x - 10, y: oy + pill.y - 10, w: pill.w + 20, h: pill.h + 20 };
  const rr = [];
  const r = 34;
  // rounded-rect path around the right answer (clockwise from top-left)
  const corners = [
    [pr.x + r, pr.y], [pr.x + pr.w - r, pr.y], [pr.x + pr.w, pr.y + r], [pr.x + pr.w, pr.y + pr.h - r],
    [pr.x + pr.w - r, pr.y + pr.h], [pr.x + r, pr.y + pr.h], [pr.x, pr.y + pr.h - r], [pr.x, pr.y + r],
  ];
  rr.push(...corners);
  const answerRing = ribbon(rr, { width: 7, a: '#8FDDF7', b: BRAND.cyan, closed: true });
  answerRing.visible = false;
  S.hud.add(answerRing);
  const sparkOrigin = [pr.x + pr.w - 60, pr.y + pr.h / 2];

  // lesson overlay (cyan underlines + orange scan pulse)
  const lines = assets.lesson.lines;
  const keyLines = lines.filter((l) => l.key || l.title);
  const drawScan = (t) => {
    const c = S.desk.overlayCanvas;
    const g = c.getContext('2d');
    g.setTransform(0.5, 0, 0, 0.5, 0, 0);
    g.clearRect(0, 0, PAGE.w, PAGE.h);
    keyLines.forEach((l, i) => {
      const k = EASE.cine(clamp((t - T.underline - i * 0.14) / 0.5));
      if (k <= 0) return;
      g.strokeStyle = rgba(BRAND.cyan, 0.9);
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(l.x - 4, l.y + l.h + 6);
      g.lineTo(l.x - 4 + (l.w + 8) * k, l.y + l.h + 6);
      g.stroke();
      g.fillStyle = rgba(BRAND.cyan, 0.1 * k);
      g.fillRect(l.x - 6, l.y - 2, (l.w + 12) * k, l.h + 8);
    });
    const s = prog(t, T.scan[0], T.scan[1] - T.scan[0], E.inOutSine);
    if (s > 0 && s < 1) {
      const y = lerp(60, PAGE.h - 40, s);
      const gr = g.createLinearGradient(0, y - 90, 0, y + 8);
      gr.addColorStop(0, rgba(BRAND.orange, 0));
      gr.addColorStop(1, rgba(BRAND.orange, 0.28));
      g.fillStyle = gr;
      g.fillRect(0, y - 90, PAGE.w, 98);
      g.fillStyle = rgba(BRAND.orange, 0.95);
      g.fillRect(0, y, PAGE.w, 5);
    }
  };

  let lastScanKey = '', lastAnswerKey = '';
  const clockCanvas = assets.ringCanvas;
  let lastClockKey = '';

  return async function renderAt(t, { playing = false } = {}) {
    // ── shots on the backdrop
    const u = S.backdrop.material.uniforms;
    let A = null, B = null, mix = 0, mode = 0, blur = 0, pastel = 0, zA = 1, zB = 1, motion = 0;
    if (t < T.cut12 + 0.12) {
      A = 'c1';
      zA = lerp(1.06, 1.0, EASE.glide(prog(t, 0, 3.3)));
      if (t > T.cut12 - 0.1) {
        B = 'c2';
        mix = E.inOutSine(prog(t, T.cut12 - 0.1, 0.22));
        motion = bump(t, T.cut12 - 0.12, T.cut12 + 0.14) * 140;
      }
    } else if (t < T.reveal3) {
      A = 'c2';
      zA = lerp(1.0, 1.035, prog(t, T.cut12, 3));
    } else if (t < T.reveal3 + 0.9) {
      A = 'c2';
      zA = 1.035;
      B = 'c3';
      mode = 1;
      mix = 1;
      u.uC.value.set(POI.tablet[0], POI.tablet[1]);
      u.uR.value = EASE.cine(prog(t, T.reveal3, 0.85)) * 2300;
      u.uSoft.value = 70;
    } else if (t < T.toC4 - 0.6) {
      A = 'c3';
      zA = lerp(1.0, 1.06, prog(t, T.reveal3, 7));
      blur = 26 * E.inOutSine(prog(t, T.blur3, 1.0));
      pastel = 0.4 * prog(t, T.blur3, 1.0) + 0.6 * prog(t, 18.6, 1.0);
    } else if (t < T.toC4 - 0.15) {
      A = 'c3';
      blur = 26;
      pastel = 1;
    } else if (t < T.toPhone5) {
      A = 'c4';
    } else if (t < T.toC5) {
      A = 'c4';
      blur = 26 * E.inOutSine(prog(t, T.toPhone5, 0.7));
      pastel = 0.82 * prog(t, T.toPhone5, 0.7);
    } else if (t < 33.05) {
      A = 'c4';
      blur = 26;
      pastel = 0.82;
      B = 'c5';
      mode = 2;
      mix = 1;
    } else if (t < T.outro) {
      A = 'c5';
    } else {
      A = 'c5';
      blur = 28 * E.inOutSine(prog(t, T.outro, 0.9));
      pastel = prog(t, T.outro + 0.2, 0.8, E.inOutSine);
    }
    const active = [A, B].filter(Boolean);
    await clips.prepare(t, active);
    clips.sync(t, active, playing);
    u.uA.value = A ? clips.texture(A) : null;
    u.uB.value = B ? clips.texture(B) : null;
    u.uZA.value.set(A ? zA : 0, 0, 0);
    u.uZB.value.set(B ? zB : 0, 0, 0);
    u.uMix.value = mix;
    u.uMode.value = mode;
    u.uBlur.value = blur;
    u.uMotion.value.set(motion, 0);
    u.uPastel.value = pastel;
    u.uTime.value = t;

    // ── camera
    const cp = camPos(t), cl = camLook(t);
    S.camera.position.set(cp[0] + wobble(t * 0.5, 1) * 0.01, cp[1] + wobble(t * 0.4, 2) * 0.008, cp[2]);
    look.set(cl[0], cl[1], cl[2]);
    S.camera.lookAt(look);
    S.camera.updateMatrixWorld();

    // ── phone (camera-relative placement, always facing the lens + attitude)
    const P = S.phone;
    const pOn = phoneOn(t);
    P.group.visible = pOn;
    let screenPx = null;
    if (pOn) {
      const rel = phoneRel(t), att = phoneAtt(t);
      S.camera.getWorldDirection(fwd);
      right.setFromMatrixColumn(S.camera.matrixWorld, 0);
      up.setFromMatrixColumn(S.camera.matrixWorld, 1);
      const ty = Math.tan((S.camera.fov * Math.PI) / 360), tx = ty * S.camera.aspect;
      P.group.position.copy(S.camera.position).addScaledVector(fwd, rel[0]).addScaledVector(right, rel[1] * rel[0] * tx).addScaledVector(up, rel[2] * rel[0] * ty);
      P.group.position.y += Math.sin(t * 1.3) * 0.015;
      q.copy(S.camera.quaternion);
      e.set(att[0] + Math.sin(t * 0.8) * 0.01, att[1] + Math.sin(t * 0.6) * 0.012, att[2]);
      qo.setFromEuler(e);
      P.group.quaternion.copy(q).multiply(qo);
      P.group.updateMatrixWorld(true);
      const su = P.screenMat.uniforms;
      const [sa, sb, wipe, wmode, wc] = screenAt(t);
      su.uA.value = S.screens[sa];
      su.uB.value = sb ? S.screens[sb] : S.screens[sa];
      su.uWipe.value = wipe;
      su.uWipeMode.value = wmode;
      su.uWipeC.value.set(wc[0], wc[1]);
      const cr = cropAt(t);
      su.uCrop.value.set(cr[0], cr[1], cr[2]);
      su.uPower.value = t < T.toPhone5 ? E.outCubic(prog(t, T.screenOn, 0.45)) : 1;
      let tap = -1, tc = UI.createQuizBtn;
      if (t > T.tapCreate && t < T.tapCreate + 0.6) tap = t - T.tapCreate;
      else if (t > T.tapCamera && t < T.tapCamera + 0.6) {
        tap = t - T.tapCamera;
        tc = UI.openCameraBtn;
      }
      su.uTapT.value = tap;
      su.uTapC.value.set(tc[0], tc[1]);
      const deskShot = t > T.table[0] && t < 19.6;
      P.dropShadow.visible = !deskShot;
      P.dropShadow.material.uniforms.uOpacity.value = 0.22;
      P.screen.getWorldPosition(v);
      screenPx = toScreen(v);
    }

    // ── desk + lesson page
    const deskOn = t > T.table[0] - 0.05 && t < 19.7;
    S.desk.group.visible = deskOn;
    S.sun.castShadow = deskOn;
    if (deskOn) {
      const fade = prog(t, T.table[0], 0.5) * (1 - prog(t, 18.95, 0.6));
      for (const m of [S.desk.table, S.desk.sheet, S.desk.overlay]) {
        m.material.transparent = true;
        m.material.opacity = fade;
      }
      const key = [prog(t, T.underline, 1.8).toFixed(3), prog(t, T.scan[0], T.scan[1] - T.scan[0]).toFixed(3)].join();
      if (key !== lastScanKey) {
        lastScanKey = key;
        drawScan(t);
        S.desk.overlayTex.needsUpdate = true;
      }
    }

    // ── ink lifting off the page into the phone
    const it = t - T.lift[0];
    S.ink.visible = it > 0 && it < 3.4;
    if (S.ink.visible) {
      S.ink.material.uniforms.uT.value = it;
      P.screen.getWorldPosition(v);
      S.ink.material.uniforms.uTarget.value.copy(v);
    }

    // ── illustrative quiz cards emerging from the phone
    const ct = t - T.cards;
    const cardsOn = ct > 0 && t < T.toC4 + 0.25;
    S.cards.forEach((m) => (m.visible = cardsOn));
    if (cardsOn) {
      S.camera.getWorldDirection(fwd);
      right.setFromMatrixColumn(S.camera.matrixWorld, 0);
      up.setFromMatrixColumn(S.camera.matrixWorld, 1);
      P.screen.getWorldPosition(v);
      const spec = [
        // [dx, dy, dist, roll, yaw]
        [0.0, -0.08, 3.7, 0.0, 0.0],
        [0.36, 0.5, 4.3, -0.12, -0.25],
        [-0.4, 0.42, 4.6, 0.1, 0.25],
      ];
      S.cards.forEach((m, i) => {
        const k = EASE.cine(clamp((ct - i * 0.12) / 0.7));
        const [dx, dy, dist, roll, yaw] = spec[i];
        const tgt = v2.copy(S.camera.position).addScaledVector(fwd, dist).addScaledVector(right, dx).addScaledVector(up, dy);
        m.position.copy(v).lerp(tgt, k);
        m.quaternion.copy(S.camera.quaternion);
        e.set(0, yaw * k, roll * k);
        qo.setFromEuler(e);
        m.quaternion.multiply(qo);
        m.scale.setScalar(lerp(0.25, 1, k));
        if (i === 0) {
          // zoom-through: the front card flies into the lens and covers the cut
          const z = EASE.accel(prog(t, T.toC4 - 0.6, 0.5));
          m.position.addScaledVector(fwd, -z * 2.85);
        }
        if (i > 0) {
          const fly = EASE.accel(prog(t, T.toC4 - 0.5, 0.5));
          m.position.addScaledVector(right, dx * fly * 3).addScaledVector(up, dy * fly * 2);
        }
        m.material.opacity = clamp(k * 2) * (i === 0 ? 1 - prog(t, T.toC4 - 0.05, 0.3, E.inOutSine) : 1 - prog(t, T.toC4 - 0.45, 0.3));
      });
    }
    if (mode === 2 && t > T.toC5 - 0.1) {
      // a small revision card leaves the clock ring and opens onto the family
      const k = EASE.glide(prog(t, T.toC5, 1.15));
      const cx = lerp(820, 540, k), cy = lerp(700, 960, k);
      const hw = lerp(70, 560, k), hh = lerp(54, 980, k);
      u.uRect.value.set(cx, cy, hw, hh);
      u.uRectR.value = lerp(26, 0, k);
      u.uMix.value = prog(t, T.toC5, 0.08);
    }

    // ── clock ring behind the phone
    const ringOn = t > T.ring[0] && t < T.ring[1] + 0.6;
    S.ringMesh.visible = ringOn && pOn;
    if (S.ringMesh.visible) {
      const k = prog(t, T.ring[0] + 0.3, T.ring[1] - T.ring[0] - 0.6, E.inOutSine);
      const a = prog(t, T.ring[0], 0.5) * (1 - prog(t, T.ring[1], 0.5));
      const key = `${k.toFixed(3)}|${a.toFixed(2)}|${Math.floor(t * 15)}`;
      if (key !== lastClockKey) {
        lastClockKey = key;
        assets.drawClock(clockCanvas, k, t);
        S.ringTex.needsUpdate = true;
      }
      S.ringMesh.material.opacity = a;
      S.ringMesh.scale.setScalar(lerp(0.9, 1, EASE.cine(prog(t, T.ring[0], 0.8))));
    }

    // ── HUD: ribbons, answer card, sparks
    const R = S.R;
    // discovery strokes
    // they live on C2 only and are gone once the circle has opened onto C3
    const sOut = 1 - prog(t, T.reveal3 - 0.05, 0.2);
    for (const [rb, d] of [[R.cyanIn, 0], [R.orangeIn, 0.12]]) {
      const k = prog(t, T.strokes + d, 0.8, EASE.cine);
      rb.visible = k > 0 && sOut > 0;
      rb.material.uniforms.uHead.value = k * 1.0;
      rb.material.uniforms.uLen.value = 0.55;
      rb.material.uniforms.uOpacity.value = sOut;
    }
    // family orbits
    const oOn = prog(t, T.t6[0] - 0.6, 0.8) * (1 - prog(t, T.outro + 0.1, 0.5));
    for (const [rb, sp, ph] of [[R.orbitCyan, 0.16, 0], [R.orbitOrange, -0.13, 0.5]]) {
      rb.visible = oOn > 0.001;
      const h = (((t - 33) * sp + ph) % 1 + 1) % 1;
      rb.material.uniforms.uHead.value = h;
      rb.material.uniforms.uLen.value = 0.42;
      rb.material.uniforms.uOpacity.value = oOn * 0.85;
    }
    // protective arc in the outro
    const ak = prog(t, T.outro + 0.1, 0.9, EASE.cine);
    R.arc.visible = ak > 0 && t < T.logoEnd + 0.5;
    R.arc.material.uniforms.uHead.value = ak;
    R.arc.material.uniforms.uLen.value = 1;
    R.arc.material.uniforms.uOpacity.value = 1 - prog(t, T.logoEnd, 0.4);
    o.dot.style.visibility = t > T.outro + 0.4 && t < T.logoEnd + 0.4 ? 'visible' : 'hidden';
    if (t > T.outro + 0.4) {
      const dk = spring(t - T.outro - 0.4, 1.8, 0.5);
      o.dot.style.transform = `translate(-50%, -50%) translateY(${lerp(-260, 0, Math.min(1.2, dk))}px) scale(${lerp(0.4, 1, clamp(dk))})`;
      o.dot.style.opacity = 1 - prog(t, T.logoEnd, 0.3);
    }

    // answer card on the kid's shot
    const aOn = t > T.toC4 + 0.35 && t < T.toPhone5 + 0.2;
    S.answer.mesh.visible = aOn;
    answerRing.visible = false;
    if (aOn) {
      const ink = EASE.cine(prog(t, T.toC4 + 0.4, 0.6));
      const out = EASE.accel(prog(t, T.toPhone5 - 0.35, 0.5));
      const sel = prog(t, T.tapC4, 0.55, E.outCubic);
      const key = sel.toFixed(3);
      if (key !== lastAnswerKey) {
        lastAnswerKey = key;
        drawCard(assets.answerCanvas, 0, sel);
        S.answer.tex.needsUpdate = true;
      }
      const pop = 1 + 0.035 * Math.sin(Math.PI * clamp((t - T.tapC4) / 0.3));
      S.answer.mesh.position.set(ans.cx, H - ans.cy + (1 - ink) * -40 + out * 120, 0);
      S.answer.mesh.scale.setScalar(lerp(0.9, 1, ink) * pop * (1 - out * 0.4));
      S.answer.mesh.material.opacity = ink * (1 - out);
      const rk = prog(t, T.tapC4 + 0.12, 0.6, EASE.cine);
      answerRing.visible = rk > 0 && out < 0.5;
      answerRing.material.uniforms.uHead.value = rk;
      answerRing.material.uniforms.uLen.value = 1;
      answerRing.material.uniforms.uOpacity.value = 1 - out * 2;
    }
    S.sparks.visible = t > T.tapC4 && t < T.tapC4 + 1.6;
    S.sparks.material.uniforms.uT.value = t - T.tapC4 - 0.15;
    S.sparks.material.uniforms.uOrigin.value.set(sparkOrigin[0], H - sparkOrigin[1]);

    S.film.uniforms.uTime.value = t;

    updateOverlay(o, t, { phoneScreen: screenPx ? { x: screenPx[0], y: screenPx[1] } : null });
    S.composer.render();
  };
}
