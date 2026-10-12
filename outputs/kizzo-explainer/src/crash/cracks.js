// Écran fissuré plein cadre (version promo, juste après l'accroche filmée où le téléphone est
// écrasé) : on est « dans » l'écran cassé. Motif de fracture radial (fissures rayonnantes +
// anneaux) ; l'écran se rallume en orange derrière les fissures, puis les éclats de verre
// explosent vers la caméra sur le temps fort et révèlent la forme orange du motion design.
import { rng, TAU, clamp, lerp, ease, seg } from '../util.js';

/** Cellules de fracture autour de (ix, iy), sur un cadre [x0, y0, x1, y1] (repère monde). */
function fracture(x0, y0, x1, y1, ix, iy, seed = 7) {
  const r = rng(seed);
  const NA = 19;
  const angles = [];
  for (let i = 0; i < NA; i++) angles.push(((i + 0.5 + (r() - 0.5) * 0.6) / NA) * TAU);
  const RINGS = [0, 10, 26, 50, 86, 132, 192, 268, 360, 480, 640];
  const V = angles.map((a) =>
    RINGS.map((rad, j) => {
      const rr = j === 0 ? 0 : rad * (0.84 + r() * 0.32);
      const aa = a + (j ? (r() - 0.5) * 0.12 : 0);
      return [ix + Math.cos(aa) * rr, iy + Math.sin(aa) * rr];
    })
  );
  const cells = [];
  const cracks = [];
  for (let i = 0; i < NA; i++) {
    const i2 = (i + 1) % NA;
    for (let j = 0; j < RINGS.length - 1; j++) {
      const poly = j === 0 ? [V[i][0], V[i][1], V[i2][1]] : [V[i][j], V[i2][j], V[i2][j + 1], V[i][j + 1]];
      const cx = poly.reduce((s, q) => s + q[0], 0) / poly.length;
      const cy = poly.reduce((s, q) => s + q[1], 0) / poly.length;
      if (cx < x0 - 120 || cx > x1 + 120 || cy < y0 - 120 || cy > y1 + 120) continue;
      cells.push({ poly, cx, cy, dist: Math.hypot(cx - ix, cy - iy), rnd: [r(), r(), r(), r()] });
      cracks.push([V[i][j], V[i][j + 1]]);
      if (j > 0) cracks.push([V[i][j], V[i2][j]]);
    }
  }
  return { cells, cracks, ix, iy };
}

const IX = 206, IY = 318;
const FR = fracture(-20, -20, 410, 713, IX, IY);
const path = (ctx, poly) => {
  ctx.beginPath();
  poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
};

/**
 * Calque de l'écran cassé, dessiné par-dessus la forme orange (repère monde, caméra appliquée).
 * @param {number} t temps ; on = début du rallumage ; burst = explosion (temps fort)
 */
export function drawCrackedScreen(ctx, t, on, burst) {
  if (t >= burst + 0.6) return;
  ctx.save();
  if (t < burst) {
    // dalle éteinte, puis l'orange revient depuis le point d'impact
    const k = ease.inCubic(seg(t, on, burst));
    const rad = 30 + k * 900;
    const g = ctx.createRadialGradient(IX, IY, rad * 0.55, IX, IY, rad + 90);
    g.addColorStop(0, 'rgba(6,7,11,0)');
    g.addColorStop(1, 'rgba(6,7,11,0.95)');
    ctx.fillStyle = k > 0 ? g : 'rgba(6,7,11,0.95)';
    ctx.fillRect(-60, -60, 520, 820);
    // lignes de pixels morts qui clignotent (écran cassé)
    if (k < 0.6) {
      const flick = Math.sin(t * 90) * Math.sin(t * 37 + 1) > 0 ? 1 : 0.35;
      ctx.globalAlpha = 0.35 * flick * (1 - k / 0.6);
      [
        [120, '#3DB5DA'],
        [127, '#F472B6'],
        [480, '#FACC15'],
      ].forEach(([y, c]) => {
        ctx.fillStyle = c;
        ctx.fillRect(-20, y, 430, 2.2);
      });
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(258, -20, 1.6, 740);
      ctx.globalAlpha = 1;
    }
    // fissures
    ctx.lineCap = 'round';
    for (const [a, b] of FR.cracks) {
      ctx.strokeStyle = `rgba(0,0,0,${(0.35 + 0.2 * k).toFixed(3)})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(a[0] + 0.7, a[1] + 1);
      ctx.lineTo(b[0] + 0.7, b[1] + 1);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${(0.5 + 0.4 * k).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
    // point d'impact écrasé
    ctx.fillStyle = `rgba(255,255,255,${(0.55 + 0.35 * k).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(IX, IY, 5, 0, TAU);
    ctx.fill();
  } else {
    // explosion : les éclats partent vers la caméra en tournant
    for (const c of FR.cells) {
      const d0 = burst + Math.min(0.08, c.dist / 4000);
      const k = ease.outCubic(seg(t, d0, d0 + 0.42 + c.rnd[0] * 0.12));
      if (k >= 1) continue;
      const dx = c.cx - IX, dy = c.cy - IY;
      const dl = Math.hypot(dx, dy) || 1;
      const push = (140 + 420 * c.rnd[1]) * k;
      const sc = 1 + k * (0.8 + 1.6 * c.rnd[2]);
      ctx.save();
      ctx.translate(c.cx + (dx / dl) * push, c.cy + (dy / dl) * push);
      ctx.rotate((c.rnd[3] - 0.5) * 2.4 * k);
      ctx.scale(sc, sc);
      ctx.translate(-c.cx, -c.cy);
      ctx.globalAlpha = 1 - k * k;
      path(ctx, c.poly);
      const tone = c.rnd[0];
      ctx.fillStyle = `rgb(${lerp(236, 255, tone) | 0},${lerp(98, 150, tone) | 0},${lerp(14, 70, tone) | 0})`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
  void clamp;
}
