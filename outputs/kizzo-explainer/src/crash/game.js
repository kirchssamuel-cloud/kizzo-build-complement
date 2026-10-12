// Jeu affiché sur le téléphone de l'enfant : niveau « nuit » aux couleurs néon, plus sombre
// que le jeu des autres films pour que la pointe, son reflet et les sous-pixels se lisent.
// Repère logique 390 × 860.
import { rr, txt, disp, icon, statusBar, F_NUM } from '../ui-canvas.js';
import { rng, TAU } from '../util.js';

export function drawNightGame(ctx, W, H, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#060B22');
  g.addColorStop(0.6, '#0D1C44');
  g.addColorStop(1, '#13285A');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // étoiles
  const r = rng(12);
  for (let i = 0; i < 70; i++) {
    const x = r() * W, y = r() * H * 0.8, s = 0.6 + r() * 1.6;
    ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * (1 + r() * 2) + i));
    ctx.fillStyle = i % 9 ? '#DDE7FF' : '#FFE08A';
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
  // lune
  ctx.fillStyle = '#FFF1C2';
  ctx.beginPath();
  ctx.arc(318, 168, 34, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(230,214,170,0.7)';
  ctx.beginPath();
  ctx.arc(306, 160, 7, 0, TAU);
  ctx.arc(326, 182, 5, 0, TAU);
  ctx.fill();
  // collines lointaines
  ctx.fillStyle = '#18306A';
  ctx.beginPath();
  ctx.moveTo(0, 640);
  for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 600 + Math.sin(x * 0.018 + 1) * 26 + Math.sin(x * 0.05) * 8);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
  // plateformes néon
  const plats = [
    [26, 650, 140, '#22D3EE'],
    [214, 560, 150, '#F472B6'],
    [60, 470, 120, '#FACC15'],
    [236, 360, 120, '#22D3EE'],
    [40, 270, 110, '#F472B6'],
  ];
  plats.forEach(([x, y, w, c], i) => {
    const dx = Math.sin(t * 1.3 + i) * 8;
    ctx.fillStyle = c;
    rr(ctx, x + dx, y, w, 18, 9);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    rr(ctx, x + dx + 8, y + 3, w - 16, 4, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    rr(ctx, x + dx + 4, y + 18, w - 8, 6, 3);
    ctx.fill();
  });
  // pièces
  for (let i = 0; i < 7; i++) {
    const x = 70 + ((i * 53) % 260), y = 230 + ((i * 89) % 360) + Math.sin(t * 3 + i) * 5;
    const sx = Math.abs(Math.cos(t * 2.5 + i));
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.ellipse(x, y, 10 * (0.25 + 0.75 * sx), 10, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.ellipse(x, y, 5 * (0.25 + 0.75 * sx), 5, 0, 0, TAU);
    ctx.fill();
  }
  // personnage en plein saut, juste sous le point d'impact
  const ph = (t * 1.25) % 1;
  const jx = 168 + ph * 50, jy = 520 - Math.sin(ph * Math.PI) * 120;
  ctx.fillStyle = '#F97316';
  ctx.beginPath();
  ctx.arc(jx, jy - 26, 25, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#FFB27A';
  ctx.beginPath();
  ctx.arc(jx - 8, jy - 36, 7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(jx - 7, jy - 28, 6.5, 0, TAU);
  ctx.arc(jx + 9, jy - 28, 6.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(jx - 5, jy - 27, 3.2, 0, TAU);
  ctx.arc(jx + 11, jy - 27, 3.2, 0, TAU);
  ctx.fill();
  // traînée de vitesse
  ctx.fillStyle = 'rgba(249,115,22,0.35)';
  for (let i = 1; i <= 3; i++) {
    ctx.globalAlpha = 0.3 / i;
    ctx.beginPath();
    ctx.arc(jx - i * 14, jy - 26 + i * 6, 22 - i * 3, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // sol
  ctx.fillStyle = '#1D3F86';
  rr(ctx, -20, 720, W + 40, 200, 24);
  ctx.fill();
  ctx.fillStyle = '#22D3EE';
  rr(ctx, -20, 720, W + 40, 8, 4);
  ctx.fill();
  // HUD du jeu
  statusBar(ctx, '#fff', '23:47');
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  rr(ctx, 18, 60, 122, 40, 20);
  ctx.fill();
  icon.star(ctx, 28, 68, 24, '#FACC15');
  txt(ctx, String(48210 + Math.floor(t * 41)), 60, 87, { size: 18, weight: 700, color: '#fff', font: F_NUM });
  txt(ctx, 'NIVEAU 48', W - 20, 87, disp({ size: 16, weight: 800, align: 'right', color: '#fff', ls: 1 }));
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < 2 ? '#F472B6' : 'rgba(255,255,255,0.25)';
    const hx = W - 112 + i * 22, hy = 108;
    ctx.beginPath();
    ctx.arc(hx - 4, hy, 5, 0, TAU);
    ctx.arc(hx + 4, hy, 5, 0, TAU);
    ctx.moveTo(hx - 9, hy + 2);
    ctx.lineTo(hx, hy + 11);
    ctx.lineTo(hx + 9, hy + 2);
    ctx.fill();
  }
  // commandes tactiles
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(70, 790, 34, 0, TAU);
  ctx.arc(320, 790, 34, 0, TAU);
  ctx.fill();
  icon.play(ctx, 305, 775, 30, 'rgba(255,255,255,0.7)');
  ctx.save();
  ctx.translate(70, 790);
  ctx.scale(-1, 1);
  icon.play(ctx, -15, -15, 30, 'rgba(255,255,255,0.7)');
  ctx.restore();
}
