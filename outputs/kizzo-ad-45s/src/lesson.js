// The physical lesson page that Léa photographs. Same text and look as the
// page in the real camera screenshot (assets/screens/appareil-photo.jpg):
// lined school paper, red margin, blue handwriting, "Le cycle de l'eau".
export const LESSON = [
  { t: 'Le cycle de l’eau', title: true },
  { t: 'L’eau circule sans cesse entre les océans, l’air et les continents.' },
  { t: '1. L’évaporation : la chaleur du Soleil transforme l’eau des océans et des lacs en vapeur d’eau, qui monte dans l’atmosphère.', key: true },
  { t: '2. La condensation : en altitude, l’air est froid. La vapeur se refroidit et forme des gouttelettes : ce sont les nuages.', key: true },
  { t: '3. Les précipitations : les gouttelettes grossissent et retombent en pluie, en neige ou en grêle.', key: true },
  { t: '4. Le ruissellement et l’infiltration : une partie de l’eau rejoint les rivières puis la mer ; l’autre s’infiltre dans le sol et forme les nappes souterraines.' },
  { t: 'À retenir : l’eau change d’état (liquide, gazeux, solide), mais sa quantité sur Terre reste presque la même.', key: true },
];

export const PAGE = { w: 1000, h: 1380 };

export function drawLesson() {
  const c = document.createElement('canvas');
  c.width = PAGE.w;
  c.height = PAGE.h;
  const ctx = c.getContext('2d');
  // paper
  const g = ctx.createLinearGradient(0, 0, PAGE.w, PAGE.h);
  g.addColorStop(0, '#FBF8F1');
  g.addColorStop(1, '#F3EEE3');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PAGE.w, PAGE.h);
  // rules + margin
  const rule = 46, top = 120;
  ctx.strokeStyle = 'rgba(120, 160, 210, 0.45)';
  ctx.lineWidth = 2;
  for (let y = top; y < PAGE.h - 20; y += rule) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(PAGE.w, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(214, 90, 90, 0.55)';
  ctx.beginPath();
  ctx.moveTo(108, 0);
  ctx.lineTo(108, PAGE.h);
  ctx.stroke();

  // handwriting
  const lines = [];
  const x0 = 136, maxW = PAGE.w - x0 - 50;
  let y = top + rule * 1 - 10;
  ctx.fillStyle = '#23408E';
  ctx.textBaseline = 'alphabetic';
  for (const p of LESSON) {
    ctx.font = p.title ? '700 44px Kalam, "Comic Sans MS", cursive' : '400 33px Kalam, "Comic Sans MS", cursive';
    const words = p.t.split(' ');
    let line = '';
    const rows = [];
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        rows.push(line);
        line = w;
      } else line = test;
    }
    rows.push(line);
    for (const r of rows) {
      ctx.fillText(r, x0, y);
      const w = ctx.measureText(r).width;
      lines.push({ x: x0, y: y - 34, w, h: 44, key: !!p.key, title: !!p.title });
      y += rule;
    }
    y += p.title ? rule * 0.5 : rule * 0.5;
  }
  // gentle paper tooth
  const img = ctx.getImageData(0, 0, PAGE.w, PAGE.h);
  let s = 7;
  for (let i = 0; i < img.data.length; i += 4) {
    s = (s * 16807) % 2147483647;
    const n = ((s / 2147483647) - 0.5) * 6;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: c, lines };
}

// Ink pixels of the page (for particles that lift off the handwriting).
export function inkPoints(canvas, n, seed = 5) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const pool = [];
  for (let y = 0; y < canvas.height; y += 2)
    for (let x = 0; x < canvas.width; x += 2) {
      const i = (y * canvas.width + x) * 4;
      if (d[i + 2] > 110 && d[i] < 90 && d[i + 1] < 110) pool.push(x / canvas.width, y / canvas.height);
    }
  let s = seed;
  const r = () => ((s = (s * 48271) % 2147483647) / 2147483647);
  const out = new Float32Array(n * 2);
  const count = pool.length / 2;
  for (let i = 0; i < n; i++) {
    const j = Math.floor(r() * count);
    out[i * 2] = pool[j * 2];
    out[i * 2 + 1] = pool[j * 2 + 1];
  }
  return out;
}
