// Images de la pub, dessinées en 2D plein cadre (repère logique 390 × 693, soit 1080 × 1920) :
// écran verrouillé de nuit, conversation, bascule, démo enfant, démo parent, fond de fin.
import { rr, txt, disp, icon, shadow, noShadow, statusBar, makeCanvas, drawGameScene, drawCountdownPill, F_BODY, F_DISPLAY, F_NUM } from '../ui-canvas.js';
import { K as KC, appBg, button, ic, wrap, lockedCard, rgba, tapRipple, cameraScreen, readScreen, questionsScreen } from '../ui-kizzo.js';
import { rulesScreen, FREQ_CHIPS } from '../regles/ui.js';
import { clamp, lerp, seg, ease, springT, decay, rng, TAU } from '../util.js';
import { S, T, K, PD, OUT } from './config.js';

export const FW = 390;
export const FH = (390 * 16) / 9;

const sp = (t, t0, stiffness = 170, damping = 15) => springT(t - t0, { stiffness, damping });

// ===========================================================================
// 1. Écran verrouillé, 23:47

function notifIcon(ctx, kind, x, y, s) {
  const cols = { hourglass: ['#A78BFA', '#6D28D9'], game: ['#FDBA74', '#EA580C'], msg: ['#4ADE80', '#16A34A'] }[kind];
  const g = ctx.createLinearGradient(x, y, x + s, y + s);
  g.addColorStop(0, cols[0]);
  g.addColorStop(1, cols[1]);
  ctx.fillStyle = g;
  rr(ctx, x, y, s, s, s * 0.26);
  ctx.fill();
  const c = s * 0.62, ox = x + (s - c) / 2, oy = y + (s - c) / 2;
  if (kind === 'hourglass') ic.hourglass(ctx, ox, oy, c, '#fff');
  else if (kind === 'game') {
    ctx.fillStyle = '#fff';
    rr(ctx, ox + c * 0.08, oy + c * 0.3, c * 0.84, c * 0.42, c * 0.21);
    ctx.fill();
    ctx.fillStyle = cols[1];
    ctx.fillRect(ox + c * 0.2, oy + c * 0.48, c * 0.2, c * 0.06);
    ctx.fillRect(ox + c * 0.27, oy + c * 0.41, c * 0.06, c * 0.2);
    ctx.beginPath();
    ctx.arc(ox + c * 0.66, oy + c * 0.46, c * 0.045, 0, TAU);
    ctx.arc(ox + c * 0.75, oy + c * 0.56, c * 0.045, 0, TAU);
    ctx.fill();
  } else {
    ctx.fillStyle = '#fff';
    rr(ctx, ox + c * 0.1, oy + c * 0.18, c * 0.8, c * 0.56, c * 0.24);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ox + c * 0.28, oy + c * 0.7);
    ctx.lineTo(ox + c * 0.2, oy + c * 0.9);
    ctx.lineTo(ox + c * 0.46, oy + c * 0.72);
    ctx.fill();
  }
}

function lockScene(ctx, W, H, t) {
  // fond d'écran : chambre dans le noir, halos colorés de l'écran
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0A0E1F');
  g.addColorStop(0.55, '#1A1035');
  g.addColorStop(1, '#2B0F22');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const blob = (x, y, r, col, a) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, rgba(col, a));
    rg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  };
  blob(70 + Math.sin(t * 0.7) * 20, 520, 260, '#F97316', 0.22);
  blob(330, 160 + Math.cos(t * 0.6) * 20, 240, '#3DB4D9', 0.18);
  blob(200, 680, 300, '#A21CAF', 0.16);
  statusBar(ctx, '#fff', '');
  icon.lock(ctx, 183, 52, 24, 'rgba(255,255,255,0.9)');
  txt(ctx, T.lock.date, W / 2, 104, { size: 18, weight: 600, color: 'rgba(255,255,255,0.85)', align: 'center', font: F_DISPLAY });
  txt(ctx, T.lock.time, W / 2, 186, { size: 92, weight: 700, color: '#fff', align: 'center', font: F_DISPLAY, ls: -3 });

  // notifications : la plus récente arrive en haut et pousse les autres
  const NH = 80, GAP = 9, Y0 = 214;
  const list = T.lock.notifs;
  list.forEach((n, i) => {
    if (t < n.at) return;
    const kin = ease.outBack(seg(t, n.at, n.at + 0.42), 1.4);
    let idx = 0;
    list.forEach((m, j) => {
      if (j !== i && m.at > n.at) idx += ease.outCubic(seg(t, m.at, m.at + 0.38));
    });
    const y = Y0 + idx * (NH + GAP) - (1 - kin) * 50;
    ctx.save();
    ctx.globalAlpha = clamp(kin * 1.6);
    const sc = 0.92 + 0.08 * kin;
    ctx.translate(W / 2, y + NH / 2);
    ctx.scale(sc, sc);
    ctx.translate(-W / 2, -(y + NH / 2));
    shadow(ctx, 22, 6, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = 'rgba(40,40,54,0.78)';
    rr(ctx, 12, y, W - 24, NH, 22);
    ctx.fill();
    noShadow(ctx);
    if (n.hot) {
      ctx.strokeStyle = rgba('#FF6A3D', 0.55 + 0.25 * Math.sin(t * 6));
      ctx.lineWidth = 2;
      rr(ctx, 13, y + 1, W - 26, NH - 2, 21);
      ctx.stroke();
    }
    notifIcon(ctx, n.icon, 26, y + 18, 42);
    txt(ctx, n.app, 82, y + 26, { size: 11.5, weight: 700, color: 'rgba(255,255,255,0.6)', ls: 0.8, font: F_BODY });
    txt(ctx, 'maintenant', W - 28, y + 26, { size: 11.5, weight: 500, color: 'rgba(255,255,255,0.5)', align: 'right', font: F_BODY });
    txt(ctx, n.title, 82, y + 48, { size: 16, weight: 800, color: n.hot ? '#FFB27A' : '#fff', font: F_BODY });
    txt(ctx, n.body, 82, y + 67, { size: 13.5, weight: 500, color: 'rgba(255,255,255,0.78)', font: F_BODY });
    ctx.restore();
  });

  // lampe / appareil photo / barre d'accueil
  for (const x of [62, W - 62]) {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.arc(x, H - 70, 25, 0, TAU);
    ctx.fill();
  }
  ic.camera(ctx, W - 74, H - 82, 24, 'rgba(255,255,255,0.9)');
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  rr(ctx, 56, H - 84, 12, 22, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  rr(ctx, W / 2 - 66, H - 14, 132, 5, 3);
  ctx.fill();
}

// ===========================================================================
// 2. Conversation qui dégénère

function bubbleSize(ctx, text) {
  ctx.font = `500 17px ${F_BODY}`;
  const maxW = 238;
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  lines.push(line);
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 30;
  return { lines, w, h: lines.length * 22 + 18 };
}

function chatScene(ctx, W, H, t) {
  ctx.fillStyle = '#0B0F17';
  ctx.fillRect(0, 0, W, H);
  const tense = clamp((t - 8.4) / 1.6);
  if (tense > 0) {
    const rg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
    rg.addColorStop(0, 'rgba(220,38,38,0)');
    rg.addColorStop(1, `rgba(220,38,38,${0.32 * tense * (0.75 + 0.25 * Math.sin(t * 9))})`);
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }
  // messages, ancrés en bas au-dessus du champ de saisie
  const items = [];
  for (const m of T.chat.msgs) {
    if (m.typing !== undefined && t >= m.typing && t < m.at) items.push({ who: 'kid', isTyping: true, at: m.typing });
    if (t >= m.at) items.push(m);
  }
  let y = H - 86;
  for (let i = items.length - 1; i >= 0; i--) {
    const m = items[i];
    const sz = m.isTyping ? { lines: [], w: 66, h: 40 } : bubbleSize(ctx, m.text);
    const k = ease.outBack(seg(t, m.at, m.at + 0.3), 1.5);
    const grow = ease.outCubic(seg(t, m.at, m.at + 0.22));
    const h = sz.h * (i === items.length - 1 ? grow : 1);
    y -= h;
    const mine = m.who === 'me';
    const x = mine ? W - 14 - sz.w : 14;
    ctx.save();
    ctx.globalAlpha = clamp(k * 1.5);
    ctx.translate(mine ? x + sz.w : x, y + sz.h);
    ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
    ctx.translate(-(mine ? x + sz.w : x), -(y + sz.h));
    if (mine) {
      const g = ctx.createLinearGradient(0, y, 0, y + sz.h);
      g.addColorStop(0, '#3D8BFD');
      g.addColorStop(1, '#2563EB');
      ctx.fillStyle = g;
    } else ctx.fillStyle = '#262B37';
    rr(ctx, x, y, sz.w, sz.h, 18);
    ctx.fill();
    if (m.isTyping) {
      for (let d = 0; d < 3; d++) {
        const b = Math.sin(t * 9 - d * 0.9) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.5 * b})`;
        ctx.beginPath();
        ctx.arc(x + 18 + d * 15, y + 20 - b * 3, 4, 0, TAU);
        ctx.fill();
      }
    } else sz.lines.forEach((l, li) => txt(ctx, l, x + 15, y + 27 + li * 22, { size: 17, weight: 500, color: '#fff', font: F_BODY }));
    ctx.restore();
    y -= 8;
  }
  // en-tête
  ctx.fillStyle = 'rgba(18,22,32,0.96)';
  ctx.fillRect(0, 0, W, 108);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 108, W, 1);
  statusBar(ctx, '#fff', '23:48');
  ctx.strokeStyle = '#3D8BFD';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(24, 70);
  ctx.lineTo(16, 79);
  ctx.lineTo(24, 88);
  ctx.stroke();
  ctx.fillStyle = '#F97316';
  ctx.beginPath();
  ctx.arc(60, 79, 19, 0, TAU);
  ctx.fill();
  txt(ctx, 'B', 60, 86, { size: 18, weight: 800, color: '#fff', align: 'center', font: F_DISPLAY });
  txt(ctx, T.child, 88, 76, { size: 18, weight: 800, color: '#fff', font: F_DISPLAY });
  ctx.fillStyle = '#34D399';
  ctx.beginPath();
  ctx.arc(92, 92, 3.5, 0, TAU);
  ctx.fill();
  txt(ctx, T.chat.status, 100, 96, { size: 13, weight: 600, color: '#34D399', font: F_BODY });
  // champ de saisie
  ctx.fillStyle = 'rgba(18,22,32,0.96)';
  ctx.fillRect(0, H - 74, W, 74);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.5;
  rr(ctx, 56, H - 60, W - 112, 38, 19);
  ctx.stroke();
  txt(ctx, T.chat.input, 74, H - 35, { size: 15, weight: 500, color: 'rgba(255,255,255,0.4)', font: F_BODY });
  ic.camera(ctx, 16, H - 53, 24, 'rgba(255,255,255,0.6)');
  ctx.fillStyle = '#2563EB';
  ctx.beginPath();
  ctx.arc(W - 30, H - 41, 17, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(W - 30, H - 33);
  ctx.lineTo(W - 30, H - 49);
  ctx.moveTo(W - 37, H - 42);
  ctx.lineTo(W - 30, H - 49);
  ctx.lineTo(W - 23, H - 42);
  ctx.stroke();
}

// ===========================================================================
// 3. Bascule : fond noir vivant (les mots sont en DOM, nets)

function turnScene(ctx, W, H, t) {
  ctx.fillStyle = '#05070C';
  ctx.fillRect(0, 0, W, H);
  const k = seg(t, S.turn[0], S.turn[1]);
  const rg = ctx.createRadialGradient(W / 2, H * 0.48, 0, W / 2, H * 0.48, H * 0.55);
  rg.addColorStop(0, rgba('#F97316', 0.1 + 0.18 * k));
  rg.addColorStop(1, rgba('#F97316', 0));
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
}

// ===========================================================================
// 4. Démo enfant : le jeu se fige, quiz, +15 min

const gameScratch = makeCanvas(FW, FH, 2.4);
function game(ctx, W, H, t, freeze = 0) {
  const g = gameScratch.ctx;
  g.save();
  g.setTransform(gameScratch.scale, 0, 0, gameScratch.scale, 0, 0);
  drawGameScene(g, W, H + 20, t);
  g.restore();
  ctx.save();
  if (freeze > 0) ctx.filter = `grayscale(${freeze * 0.85}) blur(${freeze * 6}px) brightness(${1 - freeze * 0.1})`;
  ctx.drawImage(gameScratch.canvas, 0, 0, W, H);
  ctx.restore();
}

function confetti(ctx, W, t, t0, seed, n = 60) {
  const age = t - t0;
  if (age < 0 || age > 2.2) return;
  const r = rng(seed);
  const cols = ['#F97316', '#3DB4D9', '#FAB43B', '#4ADE80', '#A78BFA', '#FFFFFF'];
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, v = 160 + r() * 260;
    const x = W / 2 + Math.cos(a) * v * age * 0.9;
    const y = 300 + Math.sin(a) * v * age * 0.7 + 260 * age * age;
    const rot = age * (4 + r() * 6) + r() * 6;
    ctx.save();
    ctx.globalAlpha = clamp(1.6 - age * 0.8);
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = cols[i % cols.length];
    ctx.fillRect(-4, -7 * Math.abs(Math.cos(rot * 1.3)), 8, 14 * Math.abs(Math.cos(rot * 1.3)) + 1);
    ctx.restore();
  }
}

function quizScreen(ctx, W, H, t) {
  appBg(ctx, W, H);
  statusBar(ctx, '#fff', '23:49');
  const q = T.quiz;
  // en-tête : matière + progression
  ctx.fillStyle = KC.cyan;
  rr(ctx, 20, 62, 86, 30, 15);
  ctx.fill();
  txt(ctx, q.subject, 63, 82, { size: 13, weight: 800, color: '#fff', align: 'center', ls: 1, font: F_BODY });
  txt(ctx, q.of, W - 20, 82, { size: 13.5, weight: 600, color: KC.inkMuted, align: 'right', font: F_BODY });
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  rr(ctx, 20, 104, W - 40, 8, 4);
  ctx.fill();
  ctx.fillStyle = KC.orange;
  rr(ctx, 20, 104, (W - 40) / 3, 8, 4);
  ctx.fill();
  wrap(ctx, q.q, W / 2, 196, W - 60, 40, { size: 34, weight: 800, color: '#fff', font: F_DISPLAY, align: 'center' });
  // réponses en grandes tuiles 2 × 2
  const tapK = seg(t, K.tapOk, K.tapOk + 0.18);
  const okK = ease.outCubic(seg(t, K.tapOk + 0.15, K.tapOk + 0.4));
  q.options.forEach((o, i) => {
    const x = 20 + (i % 2) * 180, y = 262 + Math.floor(i / 2) * 104;
    const isOk = i === q.ok;
    const press = isOk ? Math.sin(clamp(tapK) * Math.PI) : 0;
    ctx.save();
    ctx.translate(x + 85, y + 46);
    ctx.scale(1 - press * 0.05 + (isOk ? okK * 0.04 : 0), 1 - press * 0.05 + (isOk ? okK * 0.04 : 0));
    ctx.translate(-(x + 85), -(y + 46));
    ctx.globalAlpha = !isOk && okK > 0 ? 1 - okK * 0.55 : 1;
    if (isOk && okK > 0) shadow(ctx, 24, 0, rgba('#22C55E', 0.7 * okK));
    ctx.fillStyle = isOk && okK > 0 ? rgba('#22C55E', 0.3 + 0.6 * okK) : isOk && tapK > 0 ? rgba(KC.cyan, 0.5) : 'rgba(255,255,255,0.08)';
    rr(ctx, x, y, 170, 92, 22);
    ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = isOk && okK > 0 ? '#4ADE80' : 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    rr(ctx, x + 1, y + 1, 168, 90, 21);
    ctx.stroke();
    txt(ctx, o, x + 85, y + 59, { size: 38, weight: 800, color: '#fff', align: 'center', font: F_NUM });
    if (isOk && okK > 0.1) icon.check(ctx, x + 132, y + 10, 26, '#fff', 3.2);
    ctx.restore();
  });
  tapRipple(ctx, 290, 308, seg(t, K.tapOk - 0.02, K.tapOk + 0.45));
}

function resultScene(ctx, W, H, t) {
  appBg(ctx, W, H);
  statusBar(ctx, '#fff', '23:49');
  const k = ease.outBack(seg(t, K.result, K.result + 0.45), 1.6);
  const cy = 170;
  ctx.save();
  ctx.translate(W / 2, cy);
  ctx.scale(k, k);
  shadow(ctx, 40, 0, rgba('#22C55E', 0.8));
  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.arc(0, 0, 54, 0, TAU);
  ctx.fill();
  noShadow(ctx);
  icon.check(ctx, -30, -30, 60, '#fff', 3.6);
  ctx.restore();
  txt(ctx, T.result.title, W / 2, 278, disp({ size: 34, weight: 800, align: 'center' }));
  const pk = ease.outBack(seg(t, K.result + 0.15, K.result + 0.6), 2);
  ctx.save();
  ctx.translate(W / 2, 372);
  ctx.scale(0.5 + 0.5 * pk, 0.5 + 0.5 * pk);
  shadow(ctx, 30, 0, rgba('#4ADE80', 0.75));
  txt(ctx, '+15 min', 0, 0, { size: 76, weight: 700, color: '#4ADE80', align: 'center', font: F_NUM });
  noShadow(ctx);
  ctx.restore();
  txt(ctx, T.result.unlocked, W / 2, 418, { size: 18, weight: 600, color: KC.inkSoft, align: 'center', font: F_BODY });
  button(ctx, 30, 560, W - 60, 56, T.result.back);
  confetti(ctx, W, t, K.result + 0.1, 12);
}

function kidScene(ctx, W, H, t) {
  if (t < K.quiz) {
    const freeze = ease.outCubic(seg(t, K.zero, K.zero + 0.25));
    game(ctx, W, H, t < K.zero ? t * 1.3 : K.zero * 1.3, freeze);
    if (freeze < 1) drawCountdownPill(ctx, W / 2, 150, Math.max(0, (K.zero - t) * 4), 1, 1.15);
    if (freeze > 0) {
      ctx.fillStyle = `rgba(10,21,38,${0.58 * freeze})`;
      ctx.fillRect(0, 0, W, H);
      lockedCard(ctx, W / 2, 292, ease.outBack(seg(t, K.lock, K.lock + 0.4), 1.4), t);
      tapRipple(ctx, W / 2, 316, seg(t, K.tapCta - 0.02, K.tapCta + 0.45));
    }
    statusBar(ctx, '#fff', '23:49');
  } else if (t < K.result) {
    // le quiz glisse depuis la droite
    const k = ease.outCubic(seg(t, K.quiz, K.quiz + 0.28));
    ctx.save();
    ctx.translate((1 - k) * W, 0);
    quizScreen(ctx, W, H, t);
    ctx.restore();
    if (k < 1) {
      ctx.save();
      ctx.translate(-k * W * 0.3, 0);
      ctx.globalAlpha = 1 - k;
      game(ctx, W, H, K.zero * 1.3, 1);
      ctx.restore();
    }
  } else if (t < K.back) {
    resultScene(ctx, W, H, t);
  } else {
    game(ctx, W, H, t * 1.3, 1 - ease.outCubic(seg(t, K.back, K.back + 0.3)));
    // le temps de jeu reprend
    const k = ease.outBack(seg(t, K.back + 0.1, K.back + 0.5), 1.5);
    ctx.save();
    ctx.translate(W / 2, 150);
    ctx.scale(k, k);
    shadow(ctx, 22, 0, rgba('#22C55E', 0.8));
    ctx.fillStyle = 'rgba(21,42,74,0.94)';
    rr(ctx, -112, -24, 224, 48, 24);
    ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = '#4ADE80';
    ctx.lineWidth = 2;
    rr(ctx, -112, -24, 224, 48, 24);
    ctx.stroke();
    icon.unlock(ctx, -98, -12, 24, '#4ADE80');
    txt(ctx, 'Temps de jeu', -66, 6, { size: 15, weight: 600, color: 'rgba(250,250,250,0.85)', font: F_BODY });
    txt(ctx, '15:00', 78, 8, { size: 22, weight: 700, color: '#4ADE80', align: 'center', font: F_NUM });
    ctx.restore();
    statusBar(ctx, '#fff', '23:50');
  }
}

// ===========================================================================
// 5. Démo parent : photo de la leçon -> questions -> règles

function full(ctx, draw, scroll = 0) {
  ctx.save();
  ctx.translate(0, -scroll);
  draw(ctx, FW, 860);
  ctx.restore();
}

function parentScene(ctx, W, H, t) {
  const screens = [
    [S.parent[0], (c) => full(c, (cc, w, h) => cameraScreen(cc, w, h, { scan: ease.inOutSine(seg(t, PD.scan[0], PD.scan[1])), shutter: decay(t, PD.shutter, 6) * (t > PD.shutter ? 1 : 0), t }), 70)],
    [PD.read, (c) => full(c, (cc, w, h) => readScreen(cc, w, h, { k: ease.inOutSine(seg(t, PD.read, PD.questions - 0.05)), t }), 40)],
    [PD.questions, (c) => full(c, (cc, w, h) => questionsScreen(cc, w, h, { scroll: ease.inOutCubic(seg(t, PD.questions + 0.4, PD.rules)) * 120, reveal: seg(t, PD.questions, PD.questions + 0.4) }), 0)],
    [
      PD.rules,
      (c) => {
        const freq = springT(t - PD.tap15, { stiffness: 200, damping: 15 });
        const tapK = seg(t, PD.tap15 - 0.02, PD.tap15 + 0.4);
        const chip = FREQ_CHIPS[1];
        const st = { toggle: 1, freq, q: 2, subj: 6, focus: 1, focusK: ease.outCubic(seg(t, PD.rules + 0.1, PD.rules + 0.4)), tap: tapK > 0 && tapK < 1 ? [chip[0] + chip[2] / 2, chip[1] + 13, tapK] : null };
        full(c, (cc, w, h) => rulesScreen(cc, w, h, st), ease.inOutCubic(seg(t, PD.tap15 + 0.5, S.parent[1] - 0.05)) * 150);
      },
    ],
  ];
  let i = 0;
  for (let j = 0; j < screens.length; j++) if (t >= screens[j][0]) i = j;
  const k = i > 0 ? ease.outCubic(seg(t, screens[i][0], screens[i][0] + 0.26)) : 1;
  if (k < 1) {
    ctx.save();
    ctx.translate(-k * W * 0.3, 0);
    screens[i - 1][1](ctx);
    ctx.restore();
  }
  ctx.save();
  ctx.translate((1 - k) * W, 0);
  shadow(ctx, 30, 0, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  noShadow(ctx);
  screens[i][1](ctx);
  ctx.restore();
}

// ===========================================================================
// 6. Fin : fond de marque + logo

function outroScene(ctx, W, H, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#152A4A');
  g.addColorStop(1, '#0A1526');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const blob = (x, y, r, col, a) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, rgba(col, a));
    rg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  };
  blob(60, 140, 300, '#3DB4D9', 0.24);
  blob(340, 560, 320, '#F97316', 0.2);
  // anneaux qui partent du logo
  const lk = seg(t, OUT.logo, OUT.logo + 1.4);
  for (let i = 0; i < 3; i++) {
    const k = seg(t, OUT.logo + i * 0.18, OUT.logo + 1.3 + i * 0.18);
    if (k <= 0 || k >= 1) continue;
    ctx.strokeStyle = rgba(i === 1 ? '#F97316' : '#7FD3EC', 0.6 * (1 - k));
    ctx.lineWidth = 3 * (1 - k) + 0.5;
    ctx.beginPath();
    ctx.arc(W / 2, 200, 60 + k * 260, 0, TAU);
    ctx.stroke();
  }
  if (t > OUT.logo) {
    const k = ease.outBack(seg(t, OUT.logo, OUT.logo + 0.6), 1.7);
    ctx.save();
    ctx.translate(W / 2, 200 + Math.sin((t - OUT.logo) * 1.6) * 3 * clamp(t - OUT.logo - 0.6));
    ctx.scale(k, k);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 150);
    glow.addColorStop(0, rgba('#7FD3EC', 0.35 + decay(t, OUT.logo + 0.3, 3) * 0.4));
    glow.addColorStop(1, rgba('#7FD3EC', 0));
    ctx.fillStyle = glow;
    ctx.fillRect(-160, -160, 320, 320);
    icon.logo(ctx, 4, 0, 168);
    ctx.restore();
  }
  void lk;
}

/** Dessine l'image complète de la pub à l'instant t. */
export function drawFrame(ctx, W, H, t) {
  if (t < S.lock[1]) lockScene(ctx, W, H, t);
  else if (t < S.chat[1]) chatScene(ctx, W, H, t);
  else if (t < S.turn[1]) turnScene(ctx, W, H, t);
  else if (t < S.kid[1]) kidScene(ctx, W, H, t);
  else if (t < S.parent[1]) parentScene(ctx, W, H, t);
  else outroScene(ctx, W, H, t);
}
