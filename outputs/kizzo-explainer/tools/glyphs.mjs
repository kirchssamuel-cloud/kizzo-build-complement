// Extrait les contours vectoriels de textes en Outfit (pour l'extrusion 3D) -> src/glyphs.js
import fs from 'node:fs';
import opentype from 'opentype.js';

const font = opentype.loadSync('node_modules/@fontsource/outfit/files/outfit-latin-800-normal.woff');
const strings = { plus15: '+15' };
const out = {};
for (const [key, str] of Object.entries(strings)) {
  const size = 100;
  const path = font.getPath(str, 0, 0, size, { kerning: true });
  const bb = path.getBoundingBox();
  // normalisé : hauteur de capitale ~ 1, centré, y vers le haut (on inverse y)
  const capH = font.tables.os2.sCapHeight / font.unitsPerEm * size;
  const cx = (bb.x1 + bb.x2) / 2, cy = (bb.y1 + bb.y2) / 2;
  const cmds = path.commands.map((c) => {
    const m = (x, y) => [+((x - cx) / capH).toFixed(4), +(-(y - cy) / capH).toFixed(4)];
    switch (c.type) {
      case 'M': return ['M', ...m(c.x, c.y)];
      case 'L': return ['L', ...m(c.x, c.y)];
      case 'Q': return ['Q', ...m(c.x1, c.y1), ...m(c.x, c.y)];
      case 'C': return ['C', ...m(c.x1, c.y1), ...m(c.x2, c.y2), ...m(c.x, c.y)];
      case 'Z': return ['Z'];
    }
  });
  out[key] = { cmds, w: +((bb.x2 - bb.x1) / capH).toFixed(4), h: +((bb.y2 - bb.y1) / capH).toFixed(4) };
}
fs.writeFileSync('src/glyphs.js',
  '// Généré par tools/glyphs.mjs (Outfit ExtraBold) — commandes de chemin normalisées (hauteur de capitale = 1).\n' +
  'export const GLYPHS = ' + JSON.stringify(out) + ';\n');
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { n: v.cmds.length, w: v.w, h: v.h }])));
