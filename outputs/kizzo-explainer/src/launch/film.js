// Mise en scène du film « La demande » : tout est fonction pure de t, dessiné en 2D.
// Monde = 1080 × 1920 (zoom 1), caméra = un seul transform (zoom interpolé en log), ressorts
// analytiques pour chaque apparition, textes qui montent derrière une ligne de masque.
// Ordre des calques : toile → téléphone (écran de discussion) → bol + matières → inondation orange
// (= bulle de l'enfant) → cartes → page navy (= bouton) → fin (titre, parcours, logo, phrase, CTA).
import { rr, txt, icon, statusBar, F_DISPLAY, F_BODY, F_NUM } from '../ui-canvas.js';
import { LOGO } from '../logo-shape.js';
import { E, T, C, BEAT, DURATION, WIDTH as W, HEIGHT as H } from './config.js';
import { clamp, lerp, seg, ease, springT, rng, TAU } from '../util.js';

// ---------------------------------------------------------------------------
// Géométrie du téléphone : écran logique 390 × 822 → monde (× S), centré dans le cadre
const S = 560 / 390;
const PX = 260, PY = 370;
const pw = (x) => PX + x * S;
const ph = (y) => PY + y * S;
const SCREEN = { x: 260, y: 370, w: 560, h: 1180, r: 72 };
const BODY = { x: 246, y: 356, w: 588, h: 1208, r: 92 };
// composer (logique) et bulle de l'enfant (logique)
const COMP = { x: 16, y: 690, w: 358, h: 116, r: 28, yUp: 412 };
const SEND = { x: 344, y: 776, r: 20 };
const KB = { y: 540, rows: ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'] };
/** Hauteur du composer (logique) : au-dessus du clavier, puis en bas quand le clavier se retire. */
const compY = (t) => lerp(COMP.yUp, COMP.y, k(t, E.send, E.send + 0.45, ease.inOutCubic));
const sendY = (t) => compY(t) + 86;
const BUB = { x: 74, y: 214, w: 300, h: 100, r: 20 };
const GO = { x: 16, y: 584, w: 160, h: 44 }; // bouton « C'est parti »
const LATER = { x: 188, y: 584, w: 138, h: 44 };
const SLOT = { x: 30, y: 386, w: 84, h: 112 }; // logement de la carte dans la réponse
// bol (monde)
const BOWL = { x: 540, y: 1130, r: 215 };
/** Instant où la carte choisie se pose dans la bulle de réponse. */
const CARD_LAND = E.reply1 + 0.14;
// cartes (monde)
const CARD = { w: 432, h: 576, r: 36, pitch: 472, y: 1120 };
// logo de fin (écran)
const MARK = { x: 285, y: 960, h: 230 };
const CHILD = { x: MARK.x + LOGO.child.c[0] * MARK.h, y: MARK.y - LOGO.child.c[1] * MARK.h, r: LOGO.child.r * MARK.h };

/** Instants où chaque mot de la phrase de marque s'allume (calés sur la voix off). */
const TAG_AT = [14.0, 14.2, 14.45, 14.85, 15.05, 15.45, 15.65];

// ---------------------------------------------------------------------------
// Helpers temps
const pop = (t, t0, s = 170, d = 14) => (t < t0 ? 0 : springT(t - t0, { stiffness: s, damping: d }));
const k = (t, a, b, f = ease.inOutQuint) => f(seg(t, a, b));
const frac = (t, t0, dur, f = ease.outQuint) => (t < t0 ? 0 : f(clamp((t - t0) / dur)));

// ---------------------------------------------------------------------------
// Caméra : clés [t, zoom, x, y, easing vers la clé suivante]
const CAM = [
  [0, 1.95, 540, 1012, ease.inOutSine],
  [E.send, 2.02, 540, 994, ease.inOutCubic],
  [E.send + 0.9, 1.0, 540, 1000, ease.inOutSine],
  [E.drop, 1.2, 540, 1010, ease.inOutSine],
  [E.shrink, 1.24, 540, 1090, ease.inOutSine],
  [E.page, 1.6, 540, 1090, ease.inOutCubic],
  [E.page + 0.6, 2.0, 470, 1200, null],
];
export function camera(t) {
  let i = 0;
  while (i < CAM.length - 1 && t >= CAM[i + 1][0]) i++;
  const a = CAM[i], c = CAM[Math.min(i + 1, CAM.length - 1)];
  const kk = a === c ? 1 : (a[4] || ease.inOutSine)(seg(t, a[0], c[0]));
  return { z: Math.exp(lerp(Math.log(a[1]), Math.log(c[1]), kk)), x: lerp(a[2], c[2], kk), y: lerp(a[3], c[3], kk) };
}
const toFrame = (cam, x, y) => [W / 2 + (x - cam.x) * cam.z, H / 2 + (y - cam.y) * cam.z];

// ---------------------------------------------------------------------------
// Texte qui monte derrière une ligne de masque
function rise(ctx, s, x, y, o, kk, lh) {
  if (kk <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 3000, y - lh * 0.92, 6000, lh * 1.22);
  ctx.clip();
  txt(ctx, s, x, y + (1 - kk) * lh * 1.25, o);
  ctx.restore();
}
/** Mots qui montent un par un (décalés d'une double-croche). */
function riseWords(ctx, words, x, y, o, t, t0, lh, gap = BEAT / 4, exitK = 0) {
  ctx.save();
  ctx.font = `${o.weight || 800} ${o.size}px ${o.font || F_DISPLAY}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${o.ls || 0}px`;
  const sp = ctx.measureText(' ').width + 4;
  const ws = words.map((w) => ctx.measureText(w).width);
  const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let cx = x - total / 2;
  words.forEach((w, i) => {
    const kk = frac(t, t0 + i * gap, 0.42, ease.outQuint);
    rise(ctx, w, cx + ws[i] / 2, y - exitK * lh * 1.3, { ...o, align: 'center' }, kk, lh);
    cx += ws[i] + sp;
  });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Frappe : horaires des caractères (rythme naturel, déterministe)
const KEYS = (() => {
  const r = rng(7);
  const out = [];
  let acc = 0;
  T.lines.forEach((line, li) => {
    [...line].forEach((ch) => {
      acc += 0.7 + r() * 0.9 + (ch === ' ' ? 0.9 : 0);
      out.push({ ch, li, at: acc });
    });
    acc += 2.2;
  });
  const total = acc - 2.2;
  for (const kch of out) kch.at = E.type0 + ((kch.at - 0.7) / total) * (E.typeEnd - E.type0);
  return out;
})();

// ---------------------------------------------------------------------------
// Sprites mis en cache (ombre du téléphone, halo irisé)
let phoneSprite = null;
function getPhoneSprite() {
  if (phoneSprite) return phoneSprite;
  const m = 180;
  const c = document.createElement('canvas');
  c.width = BODY.w + m * 2;
  c.height = BODY.h + m * 2;
  const g = c.getContext('2d');
  g.shadowColor = 'rgba(15,23,42,0.28)';
  g.shadowBlur = 70;
  g.shadowOffsetY = 36;
  g.fillStyle = '#0B0F1A';
  rr(g, m, m, BODY.w, BODY.h, BODY.r);
  g.fill();
  phoneSprite = { c, m };
  return phoneSprite;
}
const glow = { c: document.createElement('canvas'), m: 70, sc: 2 };
function drawGlow(ctx, t, alpha, cy0 = COMP.y) {
  // halo irisé façon Apple Intelligence : dégradé conique flouté qui tourne autour du composer
  const { c, m, sc } = glow;
  const w = COMP.w + m * 2, h = COMP.h + m * 2;
  if (c.width !== w * sc) (c.width = w * sc), (c.height = h * sc);
  const g = c.getContext('2d');
  g.setTransform(sc, 0, 0, sc, 0, 0);
  g.clearRect(0, 0, w, h);
  g.filter = 'blur(16px)';
  const grad = g.createConicGradient(t * 1.4, w / 2, h / 2);
  ['#F472B6', '#FB923C', '#A3E635', '#22D3EE', '#8B5CF6', '#F472B6'].forEach((col, i) => grad.addColorStop(i / 5, col));
  g.fillStyle = grad;
  rr(g, m - 10, m - 10, COMP.w + 20, COMP.h + 20, COMP.r + 10);
  g.fill();
  g.filter = 'none';
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(c, COMP.x - m, cy0 - m, w, h);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Clavier (logique) : la touche frappée s'assombrit ; tout le clavier glisse vers le bas à l'envoi
function drawKeyboard(ctx, t) {
  const ky = KB.y + 320 * k(t, E.send, E.send + 0.45, ease.inOutCubic);
  if (ky >= 822) return;
  ctx.save();
  ctx.translate(0, ky - KB.y);
  ctx.fillStyle = '#D1D4DB';
  ctx.fillRect(0, KB.y, 390, 300);
  let hot = null;
  for (const kc of KEYS) {
    if (t < kc.at) break;
    hot = t - kc.at < 0.13 ? kc.ch : null;
  }
  const hotK = hot ? (/[a-z]/i.test(hot) && hot !== 'é' ? hot.toUpperCase() : hot === ' ' ? ' ' : '123') : null;
  const key = (x, y, w, h, label, isHot, size = 19, fill = '#FFFFFF') => {
    ctx.fillStyle = '#9CA3AF';
    rr(ctx, x, y + 1.5, w, h, 6);
    ctx.fill();
    ctx.fillStyle = isHot ? '#A9AEB8' : fill;
    rr(ctx, x, y, w, h, 6);
    ctx.fill();
    if (label) txt(ctx, label, x + w / 2, y + h / 2 + size * 0.36, { size, weight: 500, color: C.navy, align: 'center', font: F_BODY });
  };
  const kw = 32, kh = 42, gap = 6;
  KB.rows.forEach((row, ri) => {
    const y = KB.y + 12 + ri * 52;
    const x0 = (390 - (row.length * kw + (row.length - 1) * gap)) / 2;
    [...row].forEach((ch, i) => key(x0 + i * (kw + gap), y, kw, kh, ch, hotK === ch));
    if (ri === 2) {
      key(x0 - 48 - gap, y, 48, kh, '⇧', false, 18, '#B7BCC6');
      key(x0 + row.length * (kw + gap) - gap + gap, y, 48, kh, '⌫', false, 18, '#B7BCC6');
    }
  });
  const y4 = KB.y + 12 + 3 * 52;
  key(8, y4, 84, kh, '123', hotK === '123', 16, '#B7BCC6');
  key(100, y4, 190, kh, 'espace', hotK === ' ', 16);
  key(298, y4, 84, kh, 'retour', false, 16, '#B7BCC6');
  ctx.fillStyle = C.navy;
  rr(ctx, 128, 806, 134, 5, 3);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Écran de discussion (coordonnées logiques 390 × 822)
function drawScreen(ctx, t) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 390, 822);
  statusBar(ctx, C.navy, '9:41');
  // en-tête
  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(24, 76);
  ctx.lineTo(16, 86);
  ctx.lineTo(24, 96);
  ctx.stroke();
  ctx.fillStyle = '#FDE1CC';
  ctx.beginPath();
  ctx.arc(56, 86, 19, 0, TAU);
  ctx.fill();
  txt(ctx, 'M', 56, 93, { size: 18, weight: 800, color: C.orangeDeep, align: 'center', font: F_DISPLAY });
  txt(ctx, T.contact, 86, 83, { size: 17, weight: 700, color: C.navy, font: F_DISPLAY });
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.arc(90, 100, 3.5, 0, TAU);
  ctx.fill();
  txt(ctx, 'en ligne', 99, 104, { size: 12, weight: 600, color: C.gray, font: F_BODY });
  ctx.fillStyle = C.grayLight;
  ctx.fillRect(0, 120, 390, 1.5);
  // message précédent de Maman
  ctx.fillStyle = C.bubbleGray;
  rr(ctx, 16, 150, 232, 44, 20);
  ctx.fill();
  txt(ctx, T.prev, 32, 178, { size: 17, weight: 500, color: C.ink, font: F_BODY });

  // --- réponse de Kizzo (révélée quand l'orange se rétracte)
  if (t >= E.sys) {
    rise(ctx, T.sys, 195, 350, { size: 12, weight: 600, color: C.gray, align: 'center', font: F_BODY }, frac(t, E.sys, 0.4), 16);
  }
  if (t >= E.reply1) {
    const s1 = pop(t, E.reply1, 160, 15);
    ctx.save();
    ctx.translate(16, 512);
    ctx.scale(lerp(0.6, 1, s1), lerp(0.6, 1, s1));
    ctx.translate(-16, -512);
    ctx.fillStyle = C.bubbleGray;
    rr(ctx, 16, 372, 336, 140, 22);
    ctx.fill();
    // avatar Kizzo
    ctx.fillStyle = C.orange;
    rr(ctx, 26, 382, 26, 26, 8);
    ctx.fill();
    icon.logo(ctx, 39, 395, 18, { body: '#fff', child: C.navy });
    txt(ctx, 'Kizzo', 58, 401, { size: 12, weight: 800, color: C.orangeDeep, font: F_BODY, ls: 0.6 });
    // logement de la carte ; une fois posée, la carte fait partie de la bulle
    ctx.fillStyle = '#DDD9D0';
    rr(ctx, SLOT.x, SLOT.y + 28, SLOT.w, SLOT.h - 28, 12);
    ctx.fill();
    if (t >= CARD_LAND) {
      ctx.save();
      ctx.translate(SLOT.x + SLOT.w / 2, SLOT.y + SLOT.h / 2);
      ctx.scale(SLOT.w / CARD.w, SLOT.w / CARD.w);
      drawCardFace(ctx, T.cards[2], CARD.w, CARD.h, 0);
      ctx.restore();
    }
    T.reply1.forEach((l, i) => rise(ctx, l, 128, 440 + i * 24, { size: 16, weight: 600, color: C.ink, font: F_BODY }, frac(t, E.reply1 + 0.08 + i * 0.07, 0.4), 24));
    ctx.restore();
  }
  if (t >= E.reply2) {
    const s2 = pop(t, E.reply2, 160, 15);
    ctx.save();
    ctx.translate(16, 568);
    ctx.scale(lerp(0.6, 1, s2), lerp(0.6, 1, s2));
    ctx.translate(-16, -568);
    ctx.fillStyle = C.bubbleGray;
    rr(ctx, 16, 526, 124, 42, 20);
    ctx.fill();
    rise(ctx, T.reply2, 32, 553, { size: 17, weight: 600, color: C.ink, font: F_BODY }, frac(t, E.reply2 + 0.06, 0.4), 24);
    ctx.restore();
  }
  // --- boutons C'est parti / Plus tard
  if (t >= E.pills && t < E.page) {
    const sLater = pop(t, E.pills + 0.08, 170, 14);
    const outLater = frac(t, E.click, 0.28, ease.inQuart);
    if (outLater < 1) {
      ctx.save();
      ctx.translate(LATER.x + LATER.w / 2, LATER.y + LATER.h / 2 + outLater * 90);
      ctx.scale(sLater, sLater);
      ctx.strokeStyle = C.navy;
      ctx.lineWidth = 2;
      rr(ctx, -LATER.w / 2, -LATER.h / 2, LATER.w, LATER.h, 22);
      ctx.stroke();
      txt(ctx, T.later, 0, 6, { size: 16, weight: 700, color: C.navy, align: 'center', font: F_DISPLAY });
      ctx.restore();
    }
    drawGoButton(ctx, t, 1);
  }

  // --- clavier (se retire à l'envoi), composer + halo + bouton d'envoi
  drawKeyboard(ctx, t);
  const sent = t >= E.send;
  const cy0 = compY(t);
  const glowA = sent ? 1 - frac(t, E.send, 0.5, ease.inOutCubic) : 0.85 + 0.15 * Math.sin(t * 2.1);
  if (glowA > 0.002) drawGlow(ctx, t, glowA, cy0);
  ctx.fillStyle = '#FFFFFF';
  rr(ctx, COMP.x, cy0, COMP.w, COMP.h, COMP.r);
  ctx.fill();
  ctx.strokeStyle = C.grayLight;
  ctx.lineWidth = 1.5;
  rr(ctx, COMP.x, cy0, COMP.w, COMP.h, COMP.r);
  ctx.stroke();
  if (!sent) {
    // frappe caractère par caractère, chaque lettre apparaît avec un petit ressort
    ctx.font = `600 17px ${F_BODY}`;
    const xs = [34, 34, 34];
    let lastLine = 0, caretX = 34;
    for (const kc of KEYS) {
      if (t < kc.at) break;
      const s = lerp(0.82, 1, pop(t, kc.at, 900, 30));
      const wch = ctx.measureText(kc.ch).width;
      const y = cy0 + 38 + kc.li * 26;
      ctx.save();
      ctx.translate(xs[kc.li] + wch / 2, y);
      ctx.scale(s, s);
      txt(ctx, kc.ch, -wch / 2, 0, { size: 17, weight: 600, color: C.ink, font: F_BODY });
      ctx.restore();
      xs[kc.li] += wch;
      lastLine = kc.li;
      caretX = xs[kc.li];
    }
    if (Math.floor(t * 2.4) % 2 === 0 || t > E.typeEnd - 0.3) {
      ctx.fillStyle = C.navy;
      ctx.fillRect(caretX + 1, cy0 + 22 + lastLine * 26, 2, 22);
    }
  } else txt(ctx, 'Message', 34, cy0 + 38, { size: 17, weight: 500, color: '#A8ADB7', font: F_BODY });
  if (t < E.bowl || t >= E.sys) {
    const press = t >= E.sys ? pop(t, E.sys, 200, 12) : 1 - 0.18 * Math.max(0, 1 - pop(t, E.send, 260, 12)) * (t >= E.send ? 1 : 0);
    ctx.save();
    ctx.translate(SEND.x, sendY(t));
    ctx.scale(press, press);
    ctx.fillStyle = C.cyan;
    ctx.beginPath();
    ctx.arc(0, 0, SEND.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, -8);
    ctx.moveTo(-6, -2);
    ctx.lineTo(0, -8);
    ctx.lineTo(6, -2);
    ctx.stroke();
    ctx.restore();
    // onde cyan à l'envoi
    if (t >= E.send && t < E.bowl) {
      const kr = frac(t, E.send, 0.6, ease.outCubic);
      ctx.save();
      ctx.globalAlpha = (1 - kr) * 0.9;
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth = 3 * (1 - kr) + 1;
      ctx.beginPath();
      ctx.arc(SEND.x, sendY(t), SEND.r + kr * 230, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
  // curseur
  if (t >= E.cursor && t < E.page) {
    const ka = k(t, E.cursor, E.click, ease.inOutCubic);
    const kb = frac(t, E.click + 0.35, 0.5, ease.inCubic);
    const cx = lerp(lerp(300, GO.x + GO.w / 2 + 10, ka), 150, kb);
    const cy = lerp(lerp(770, GO.y + GO.h / 2 + 8, ka), 900, kb);
    const press = t >= E.click ? lerp(0.78, 1, pop(t, E.click, 300, 14)) : 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(press, press);
    ctx.fillStyle = 'rgba(15,23,42,0.55)';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (t >= E.click) {
      const kr = frac(t, E.click, 0.45, ease.outCubic);
      ctx.save();
      ctx.globalAlpha = 1 - kr;
      ctx.strokeStyle = C.navy;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 14 + kr * 40, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/** Bouton « C'est parti » (logique) : pop, clic, roue, puis « ✓ 30 min débloquées » (s'élargit). */
function drawGoButton(ctx, t, alpha = 1) {
  const sGo = pop(t, E.pills, 170, 14);
  const press = t >= E.click ? lerp(0.9, 1, pop(t, E.click, 300, 13)) : 1;
  const wide = lerp(GO.w, 250, pop(t, E.ok, 150, 14));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(GO.x + wide / 2, GO.y + GO.h / 2);
  ctx.scale(sGo * press, sGo * press);
  ctx.fillStyle = C.navy;
  rr(ctx, -wide / 2, -GO.h / 2, wide, GO.h, 22);
  ctx.fill();
  const outGo = frac(t, E.click, 0.25, ease.inCubic);
  // libellé initial descend derrière le masque
  if (outGo < 1) {
    ctx.save();
    rr(ctx, -wide / 2, -GO.h / 2, wide, GO.h, 22);
    ctx.clip();
    txt(ctx, T.go, 0, 6 + outGo * 40, { size: 16, weight: 700, color: '#fff', align: 'center', font: F_DISPLAY });
    ctx.restore();
  }
  // roue
  if (t >= E.spin && t < E.ok + 0.2) {
    const kin = pop(t, E.spin, 300, 14);
    const kout = frac(t, E.ok, 0.2, ease.inCubic);
    const s = kin * (1 - kout);
    if (s > 0.01) {
      ctx.save();
      ctx.scale(s, s);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const a0 = (t - E.spin) * 9;
      ctx.beginPath();
      ctx.arc(0, 0, 11, a0, a0 + 4.4);
      ctx.stroke();
      ctx.restore();
    }
  }
  if (t >= E.ok) {
    const kk = frac(t, E.ok + 0.05, 0.4, ease.outQuint);
    ctx.save();
    rr(ctx, -wide / 2, -GO.h / 2, wide, GO.h, 22);
    ctx.clip();
    const y = 6 + (1 - kk) * 40;
    icon.check(ctx, -wide / 2 + 22, y - 14, 18, '#fff', 3);
    txt(ctx, T.done, 8, y, { size: 16, weight: 700, color: '#fff', align: 'center', font: F_DISPLAY });
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Téléphone (monde)
function drawPhone(ctx, t) {
  const sp = getPhoneSprite();
  ctx.drawImage(sp.c, BODY.x - sp.m, BODY.y - sp.m);
  ctx.save();
  rr(ctx, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, SCREEN.r);
  ctx.clip();
  ctx.translate(PX, PY);
  ctx.scale(S, S);
  drawScreen(ctx, t);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Bol cyan (né du bouton d'envoi) + matières lancées + texte scintillant
function drawChip(ctx, sub, x, y, rot, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.font = `700 24px ${F_DISPLAY}`;
  const tw = ctx.measureText(sub.n).width;
  const w = tw + 84, h = 60;
  ctx.fillStyle = sub.col;
  rr(ctx, -w / 2, -h / 2, w, h, 30);
  ctx.fill();
  icon[sub.icon](ctx, -w / 2 + 18, -15, 30, '#fff');
  txt(ctx, sub.n, -w / 2 + 60, 9, { size: 24, weight: 700, color: '#fff', font: F_DISPLAY });
  ctx.restore();
}
function drawBowl(ctx, t) {
  if (t < E.bowl || t >= E.drop + 0.05) return;
  const kg = k(t, E.bowl, E.bowl + 0.55, ease.inOutCubic);
  // le bouton (monde) voyage vers le centre et grossit ; son sommet se coupe : cercle → demi-disque
  const sx = pw(SEND.x), sy = ph(sendY(E.bowl));
  const cx = lerp(sx, BOWL.x, kg), cy = lerp(sy, BOWL.y, kg);
  const r = lerp(SEND.r * S, BOWL.r, kg);
  // secousse à chaque lancer
  let dip = 0, tilt = 0;
  for (const tt of E.toss) {
    if (t >= tt) {
      const s = pop(t, tt, 220, 9);
      dip += (1 - s) * 22;
      tilt += (1 - s) * 0.05 * (Math.floor(tt * 7) % 2 ? 1 : -1);
    }
  }
  // texte scintillant
  if (t >= E.cook) {
    const kt = frac(t, E.cook, 0.45);
    ctx.save();
    const grad = ctx.createLinearGradient(240, 0, 840, 0);
    const p = ((t - E.cook) * 0.55) % 1.6 - 0.3;
    grad.addColorStop(0, C.navy);
    grad.addColorStop(clamp(p - 0.12), C.navy);
    grad.addColorStop(clamp(p), C.cyan);
    grad.addColorStop(clamp(p + 0.12), C.navy);
    grad.addColorStop(1, C.navy);
    rise(ctx, T.cook, 540, 960, { size: 46, weight: 600, color: grad, align: 'center', font: F_DISPLAY, ls: -0.5 }, kt, 54);
    ctx.restore();
  }
  // matières : paraboles depuis le bord du bol, coupées sous le bord (elles retombent dedans)
  ctx.save();
  ctx.beginPath();
  ctx.rect(-2000, -2000, 5000, 2000 + cy + dip);
  ctx.clip();
  const r2 = rng(3);
  E.toss.forEach((tt, i) => {
    const sub = T.subjects[i];
    const ox = (r2() - 0.5) * 220, hgt = 380 + r2() * 160, spin = (r2() - 0.5) * 7, dur = 0.95;
    if (t < tt || t > tt + dur) return;
    const tau = t - tt;
    const g = (8 * hgt) / (dur * dur), v = (4 * hgt) / dur;
    const y = cy + dip - 6 - v * tau + 0.5 * g * tau * tau;
    const x = cx + ox * (tau / dur) * 1.4 - ox * 0.2;
    drawChip(ctx, sub, x, y, spin * tau, 1.35);
  });
  ctx.restore();
  // le bol
  ctx.save();
  ctx.translate(cx, cy + dip);
  ctx.rotate(tilt);
  const kh = clamp((kg - 0.4) / 0.6);
  // anse (derrière le bol)
  if (kh > 0) {
    ctx.save();
    ctx.translate(r - 12, 0);
    ctx.rotate(-0.1);
    ctx.fillStyle = C.cyanDeep;
    rr(ctx, 0, -9, 12 + kh * 200, 18, 9);
    ctx.fill();
    ctx.restore();
  }
  // corps : cercle dont le haut se coupe (cercle → demi-disque)
  ctx.save();
  ctx.beginPath();
  ctx.rect(-r * 2, -r + kg * r, r * 4, r * 2);
  ctx.clip();
  ctx.fillStyle = C.cyan;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  const gi = ctx.createLinearGradient(-r * 0.6, 0, r * 0.4, r);
  gi.addColorStop(0, 'rgba(255,255,255,0.12)');
  gi.addColorStop(0.5, 'rgba(0,0,0,0)');
  gi.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = gi;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.restore();
  // ouverture du bol : ellipse sombre, bord clair
  if (kh > 0) {
    const ry = r * 0.14 * kh;
    ctx.fillStyle = '#157FA3';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, ry, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, r - 2, ry, 0, Math.PI, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Inondation orange = bulle de l'enfant (élément partagé : les mots voyagent avec elle)
const bubW = () => ({ x: pw(BUB.x), y: ph(BUB.y), w: BUB.w * S, h: BUB.h * S, r: BUB.r * S });
function drawFlood(ctx, t) {
  if (t < E.send) return;
  const B = bubW();
  // 1) composer → bulle (E.send → +0.45)
  const km = k(t, E.send, E.send + 0.45);
  const from = { x: pw(COMP.x), y: ph(COMP.yUp), w: COMP.w * S, h: COMP.h * S, r: COMP.r * S };
  let shape = { x: lerp(from.x, B.x, km), y: lerp(from.y, B.y, km), w: lerp(from.w, B.w, km), h: lerp(from.h, B.h, km), r: lerp(from.r, B.r, km) };
  let fill = km < 0.5 ? `rgb(${Math.round(lerp(255, 249, km * 2))},${Math.round(lerp(255, 115, km * 2))},${Math.round(lerp(255, 22, km * 2))})` : C.orange;
  const kc = clamp((km - 0.3) / 0.35);
  let textCol = `rgb(${Math.round(lerp(28, 255, kc))},${Math.round(lerp(35, 255, kc))},${Math.round(lerp(51, 255, kc))})`;
  // 2) inondation depuis le bol (E.drop) puis rétractation dans la bulle (E.shrink)
  if (t >= E.drop) {
    const R = 1300 * frac(t, E.drop, 0.35, ease.outQuad);
    const ks = k(t, E.shrink, E.shrink + 0.45);
    const circ = { x: BOWL.x - R, y: BOWL.y - R, w: 2 * R, h: 2 * R, r: R };
    if (ks < 1) {
      shape = { x: lerp(circ.x, B.x, ks), y: lerp(circ.y, B.y, ks), w: lerp(circ.w, B.w, ks), h: lerp(circ.h, B.h, ks), r: lerp(circ.r, B.r, ks) };
      // la bulle reste visible sous le disque pendant l'expansion
      ctx.fillStyle = C.orange;
      rr(ctx, B.x, B.y, B.w, B.h, B.r);
      ctx.fill();
    }
    fill = C.orange;
    textCol = '#fff';
  }
  ctx.fillStyle = fill;
  rr(ctx, shape.x, shape.y, shape.w, shape.h, shape.r);
  ctx.fill();
  // les mots : du composer vers la bulle, puis fixés dans la bulle
  ctx.save();
  rr(ctx, shape.x, shape.y, shape.w, shape.h, shape.r);
  ctx.clip();
  const lh0 = 26 * S, lh1 = 34 * S;
  const kw = t >= E.drop ? 1 : km;
  // pendant l'inondation, les mots grossissent et se centrent, puis reviennent dans la bulle
  const big = t >= E.drop ? frac(t, E.drop + 0.05, 0.45, ease.outCubic) * (1 - k(t, E.shrink, E.shrink + 0.4, ease.inOutCubic)) : 0;
  const bx = B.x + B.w / 2, by = B.y + B.h / 2;
  ctx.save();
  ctx.translate(lerp(0, 540 - bx, big), lerp(0, -165, big));
  ctx.translate(bx, by);
  ctx.scale(lerp(1, 1.45, big), lerp(1, 1.45, big));
  ctx.translate(-bx, -by);
  T.lines.forEach((l, i) => {
    const x = lerp(pw(COMP.x + 18), B.x + 24 * S, kw);
    const y = lerp(ph(COMP.yUp + 38) + i * lh0, B.y + 46 * S + i * (lh1 - 14 * S) + 10, kw);
    txt(ctx, l, x, y, { size: 17 * S, weight: 600, color: textCol, font: F_BODY });
  });
  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Cartes de quiz (monde)
function drawCardFace(ctx, card, w, h, lift = 0) {
  ctx.fillStyle = C.navy2;
  rr(ctx, -w / 2, -h / 2, w, h, CARD.r);
  ctx.fill();
  ctx.save();
  rr(ctx, -w / 2, -h / 2, w, h, CARD.r);
  ctx.clip();
  const top = h * 0.55;
  const g = ctx.createLinearGradient(0, -h / 2, w / 2, -h / 2 + top);
  g.addColorStop(0, card.col);
  g.addColorStop(1, shade(card.col, -0.35));
  ctx.fillStyle = g;
  ctx.fillRect(-w / 2, -h / 2, w, top);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(w * 0.32, -h / 2 + top * 0.2, w * 0.3, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-w * 0.36, -h / 2 + top * 0.85, w * 0.22, 0, TAU);
  ctx.fill();
  icon[card.icon](ctx, -w * 0.16, -h / 2 + top * 0.5 - w * 0.16, w * 0.32, '#fff');
  ctx.restore();
  txt(ctx, card.n, -w / 2 + 30, -h / 2 + top + 60, { size: 40, weight: 700, color: '#fff', font: F_DISPLAY, ls: -0.8 });
  txt(ctx, card.d, -w / 2 + 30, -h / 2 + top + 100, { size: 23, weight: 500, color: 'rgba(255,255,255,0.62)', font: F_BODY });
  txt(ctx, T.reward, -w / 2 + 30, h / 2 - 44, { size: 25, weight: 700, color: C.orange, font: F_NUM });
  icon.star(ctx, w / 2 - 104, h / 2 - 68, 26, C.yellow);
  txt(ctx, card.lvl, w / 2 - 30, h / 2 - 44, { size: 24, weight: 700, color: '#fff', align: 'right', font: F_NUM });
  if (lift > 0) {
    // pastille « Leçon de mardi »
    ctx.save();
    ctx.translate(0, -h / 2 - 8);
    ctx.scale(lift, lift);
    ctx.font = `700 26px ${F_DISPLAY}`;
    const tw = ctx.measureText(T.best).width + 70;
    ctx.fillStyle = '#fff';
    rr(ctx, -tw / 2, -30, tw, 60, 30);
    ctx.fill();
    icon.check(ctx, -tw / 2 + 18, -12, 24, C.orange, 3.2);
    txt(ctx, T.best, 12, 9, { size: 26, weight: 700, color: C.navy, align: 'center', font: F_DISPLAY });
    ctx.restore();
  }
}
function shade(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(clamp(v * (1 + a), 0, 255)));
  return `rgb(${c.join(',')})`;
}
function drawCards(ctx, t) {
  if (t < E.cards) return;
  const slide = k(t, E.slide, E.slide + 0.55) * CARD.pitch;
  // logement dans la bulle de réponse, qui apparaît par un ressort autour de (16, 512)
  const s1 = t >= E.reply1 ? pop(t, E.reply1, 160, 15) : 0.6;
  const slot = { x: pw(16 + (SLOT.x + SLOT.w / 2 - 16) * s1), y: ph(512 + (SLOT.y + SLOT.h / 2 - 512) * s1), s: ((SLOT.w * S) / CARD.w) * s1 };
  T.cards.forEach((card, i) => {
    const s = pop(t, E.cards + i * 0.05, 120, 13);
    if (s <= 0) return;
    let x = lerp(540, 540 + (i - 1) * CARD.pitch, s) - slide;
    let y = CARD.y;
    let sc = s;
    let lift = 0;
    if (i === 2 && t >= E.land) {
      const kl = pop(t, E.land, 150, 13);
      y -= kl * 36;
      sc *= 1 + kl * 0.05;
      lift = pop(t, E.pill, 190, 13);
    }
    if (t >= E.shrink) {
      const ks = k(t, E.shrink, CARD_LAND, ease.inOutCubic);
      if (i === 2) {
        if (t >= CARD_LAND) return;
        // la carte choisie file dans son logement, en arc
        x = lerp(x, slot.x, ks) - Math.sin(ks * Math.PI) * 120;
        y = lerp(y, slot.y, ks);
        sc = lerp(sc, slot.s, ks);
        lift *= 1 - clamp(ks * 3);
      } else {
        x -= ks * 1400;
      }
    }
    if (t >= E.page + 0.6) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    drawCardFace(ctx, card, CARD.w, CARD.h, lift);
    ctx.restore();
  });
}

// ---------------------------------------------------------------------------
// Page navy née du bouton (monde), puis fin (écran)
function drawPagePill(ctx, t, cam) {
  if (t < E.page) return;
  const kp = k(t, E.page, E.page + 0.55, ease.inOutCubic);
  const wide = 250;
  const g = { x: pw(GO.x), y: ph(GO.y), w: wide * S, h: GO.h * S };
  const size = lerp(0, 3400, kp);
  const w = g.w + size, h = g.h + size;
  const cx = lerp(g.x + g.w / 2, 540, kp), cy = lerp(g.y + g.h / 2, 1050, kp);
  ctx.fillStyle = C.navy;
  rr(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fill();
  // libellé dans le bouton (monde) jusqu'à E.label
  if (t < E.label) {
    const fs = 16 * S;
    icon.check(ctx, g.x + 22 * S, g.y + 8 * S, 18 * S, '#fff', 3);
    txt(ctx, T.done, g.x + g.w / 2 + 8 * S, g.y + 28 * S, { size: fs, weight: 700, color: '#fff', align: 'center', font: F_DISPLAY });
  }
}
// parcours (écran) : courbe de Bézier échantillonnée
const ROUTE = (() => {
  const P = [
    [150, 1520],
    [980, 1480],
    [-120, 1080],
    [CHILD.x, CHILD.y],
  ];
  const pts = [];
  for (let i = 0; i <= 200; i++) {
    const u = i / 200, v = 1 - u;
    pts.push([v * v * v * P[0][0] + 3 * v * v * u * P[1][0] + 3 * v * u * u * P[2][0] + u * u * u * P[3][0], v * v * v * P[0][1] + 3 * v * v * u * P[1][1] + 3 * v * u * u * P[2][1] + u * u * u * P[3][1]]);
  }
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const at = (f) => {
    const L = f * len[len.length - 1];
    let i = 1;
    while (i < len.length - 1 && len[i] < L) i++;
    const kk = (L - len[i - 1]) / (len[i] - len[i - 1] || 1);
    return [lerp(pts[i - 1][0], pts[i][0], kk), lerp(pts[i - 1][1], pts[i][1], kk)];
  };
  return { pts, len, at };
})();
function drawMark(ctx, x, y, h, reveal, dotR) {
  // corps + tête cyan révélés par un disque qui grandit depuis le rond orange ; le rond est continu
  ctx.save();
  if (reveal < 1) {
    ctx.beginPath();
    ctx.arc(CHILD.x, CHILD.y, 4 + reveal * 420, 0, TAU);
    ctx.clip();
  }
  ctx.translate(x, y);
  ctx.scale(h, -h);
  ctx.fillStyle = C.cyan;
  ctx.beginPath();
  LOGO.body.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(LOGO.head.c[0], LOGO.head.c[1], LOGO.head.r, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(CHILD.x, CHILD.y, dotR, 0, TAU);
  ctx.fill();
}
function drawOutro(ctx, t, cam) {
  if (t < E.label) return;
  const covered = t >= E.page + 0.55;
  if (covered) {
    ctx.fillStyle = C.navy;
    ctx.fillRect(0, 0, W, H);
  }
  // dérive lente de tout le contenu de fin (un seul mouvement)
  const drift = (1 - k(t, E.label, E.cta + 0.6, ease.outSine)) * 50;
  ctx.save();
  ctx.translate(0, drift);
  // libellé du bouton → titre, puis file à gauche
  if (t >= E.label && t < E.labelOut + 0.35) {
    const c0 = camera(E.label);
    const [fx, fy] = toFrame(c0, pw(GO.x + 125), ph(GO.y + 28));
    const kl = pop(t, E.label, 110, 13);
    const ko = frac(t, E.labelOut, 0.32, ease.inQuart);
    const x = lerp(fx, 540, kl) - ko * 1500, y = lerp(fy, 980, kl);
    const fs = lerp(16 * S * c0.z, 92, kl);
    ctx.save();
    ctx.font = `700 ${fs}px ${F_DISPLAY}`;
    const tw = ctx.measureText(T.done).width;
    icon.check(ctx, x - tw / 2 - fs * 1.1, y - fs * 0.86, fs * 1.05, '#fff', 3.4);
    txt(ctx, T.done, x + fs * 0.3, y, { size: fs, weight: 700, color: '#fff', align: 'center', font: F_DISPLAY, ls: -fs * 0.02 });
    ctx.restore();
  }
  // titre, mot par mot, puis sortie par le haut
  if (t >= E.h1 && t < E.hOut + 0.45) {
    const ko = frac(t, E.hOut, 0.4, ease.inQuart);
    const o = { size: 104, weight: 800, color: '#fff', font: F_DISPLAY, ls: -3 };
    riseWords(ctx, T.h1, 540, 900, o, t, E.h1, 118, BEAT / 4, ko);
    riseWords(ctx, T.h2, 540, 1024, { ...o, color: C.orange }, t, E.h2, 118, BEAT / 4, ko);
  }
  // parcours en 3 étapes jusqu'au rond orange
  if (t >= E.route) {
    const kr = k(t, E.route, E.pin, ease.inOutCubic);
    const n = Math.max(2, Math.round(kr * (ROUTE.pts.length - 1)) + 1);
    const vanish = frac(t, E.mark, 0.4, ease.inCubic); // le tracé se replie derrière le logo
    if (vanish < 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.setLineDash([16, 20]);
      ctx.beginPath();
      const start = Math.round(vanish * (n - 1));
      for (let i = start; i < n; i++) i === start ? ctx.moveTo(ROUTE.pts[i][0], ROUTE.pts[i][1]) : ctx.lineTo(ROUTE.pts[i][0], ROUTE.pts[i][1]);
      ctx.stroke();
      ctx.restore();
      // étapes 1, 2, 3
      [0.27, 0.54, 0.8].forEach((f, i) => {
        const [x, y] = ROUTE.at(f);
        const passed = kr >= f;
        const s = passed ? lerp(1, 1.25, pop(t, E.route + f * (E.pin - E.route), 240, 11)) : 1;
        const hide = clamp(vanish * 3 - i);
        if (hide >= 1) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s * (1 - hide), s * (1 - hide));
        ctx.fillStyle = passed ? C.orange : C.navy;
        ctx.strokeStyle = passed ? C.orange : 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, TAU);
        ctx.fill();
        ctx.stroke();
        if (passed) icon.check(ctx, -15, -15, 30, '#fff', 3.4);
        else txt(ctx, T.steps[i], 0, 10, { size: 28, weight: 700, color: '#fff', align: 'center', font: F_NUM });
        ctx.restore();
      });
    }
    // cible à l'arrivée
    if (t < E.mark) {
      const ks = pop(t, E.route, 120, 12);
      const kl = t >= E.pin ? 1 + pop(t, E.pin, 200, 10) * 0.6 : 1;
      ctx.save();
      ctx.globalAlpha = t >= E.pin ? 1 - frac(t, E.pin, 0.25) : 1;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(CHILD.x, CHILD.y, 40 * ks * kl, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    // le point (puis rond orange du logo) + le logo révélé
    const [dx, dy] = ROUTE.at(kr);
    const land = pop(t, E.pin, 260, 11);
    const dotR = t >= E.mark ? CHILD.r : lerp(22, 30, land);
    if (t >= E.mark) drawMark(ctx, MARK.x, MARK.y, MARK.h, frac(t, E.mark, 0.4, ease.outCubic), dotR);
    else {
      const hop = Math.abs(Math.sin(kr * Math.PI * 7)) * 26 * (1 - kr * 0.5);
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(dx, dy - hop * (kr < 1 ? 1 : 0), dotR, 0, TAU);
      ctx.fill();
    }
  }
  // « kizzo » sort de derrière le logo
  if (t >= E.word) {
    const kw = frac(t, E.word, 0.5, ease.outQuint);
    ctx.save();
    const x0 = MARK.x + MARK.h * LOGO.aspect * 0.5 + 6;
    ctx.beginPath();
    ctx.rect(x0, MARK.y - 200, kw * 700, 400);
    ctx.clip();
    txt(ctx, 'kizzo', x0 + 26 - (1 - kw) * 240, MARK.y + 74, { size: 212, weight: 800, color: '#fff', font: F_DISPLAY, ls: -9 });
    ctx.restore();
  }
  if (t >= E.tag) {
    const kt = frac(t, E.tag, 0.5);
    const o = { size: 42, weight: 600, font: F_BODY, ls: -0.4 };
    ctx.save();
    ctx.font = `${o.weight} ${o.size}px ${o.font}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${o.ls}px`;
    const words = T.tag.split(' ');
    const sp = ctx.measureText(' ').width;
    const ws = words.map((w) => ctx.measureText(w).width);
    const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    let cx = 540 - total / 2;
    words.forEach((w, i) => {
      const lit = pop(t, TAG_AT[i], 220, 14);
      const col = lit > 0.5 ? C.orange : 'rgba(255,255,255,0.85)';
      ctx.save();
      ctx.translate(cx + ws[i] / 2, 1170);
      ctx.scale(1 + 0.08 * Math.sin(Math.PI * clamp(lit)), 1 + 0.08 * Math.sin(Math.PI * clamp(lit)));
      rise(ctx, w, 0, 0, { ...o, color: col, align: 'center' }, kt, 52);
      ctx.restore();
      cx += ws[i] + sp;
    });
    ctx.restore();
  }
  if (t >= E.cta) {
    const s = pop(t, E.cta, 170, 13) * (1 + 0.018 * Math.sin((t - E.cta) * 4.2));
    ctx.save();
    ctx.translate(540, 1300);
    ctx.scale(s, s);
    ctx.font = `700 36px ${F_DISPLAY}`;
    const tw = ctx.measureText(T.cta).width + 90;
    ctx.fillStyle = C.orange;
    rr(ctx, -tw / 2, -40, tw, 80, 40);
    ctx.fill();
    txt(ctx, T.cta, 0, 13, { size: 36, weight: 700, color: '#fff', align: 'center', font: F_DISPLAY });
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
export function render(ctx, t) {
  ctx.fillStyle = C.canvas;
  ctx.fillRect(0, 0, W, H);
  const cam = camera(t);
  const covered = t >= E.page + 0.55;
  if (!covered) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(cam.z, cam.z);
    ctx.translate(-cam.x, -cam.y);
    drawPhone(ctx, t);
    drawBowl(ctx, t);
    drawFlood(ctx, t);
    drawCards(ctx, t);
    drawPagePill(ctx, t, cam);
    ctx.restore();
  }
  drawOutro(ctx, t, cam);
}

/** Sous-images pour le flou de bougé (export) : plus aux moments rapides. */
export function subframes(t) {
  if (t >= E.send && t <= E.send + 0.8) return 16;
  const fastest = [
    [E.drop - 0.05, E.cards + 0.5],
    [E.shrink, E.shrink + 0.55],
    [E.page, E.page + 0.6],
    [E.labelOut, E.labelOut + 0.4],
  ];
  for (const [a, b] of fastest) if (t >= a && t <= b) return 12;
  const fast = [
    [E.bowl, E.bowl + 0.6],
    [E.slide, E.slide + 0.6],
    [E.hOut, E.hOut + 0.45],
    [E.route, E.mark + 0.4],
  ];
  for (const [a, b] of fast) if (t >= a && t <= b) return 8;
  return 4;
}
