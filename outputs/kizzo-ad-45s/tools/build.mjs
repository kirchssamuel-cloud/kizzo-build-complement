// Bundles the ad player into kizzo-pub-45s.html (three.js, fonts, logo and
// the real app screenshots inlined). Character shots stay external files in
// assets/clips/ next to the HTML.
//   node tools/build.mjs
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(root, p);

const res = await build({
  entryPoints: [r('src/main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  loader: { '.png': 'dataurl', '.jpg': 'dataurl' },
  legalComments: 'eof',
  write: false,
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const b64 = (p) => fs.readFileSync(r(p)).toString('base64');
const face = (family, file, weight) =>
  `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${b64(file)}) format('woff2');}`;
const fonts =
  face('Outfit', 'node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2', '100 900') +
  face('Kalam', 'node_modules/@fontsource/kalam/files/kalam-latin-400-normal.woff2', '400') +
  face('Kalam', 'node_modules/@fontsource/kalam/files/kalam-latin-700-normal.woff2', '700');

const tpl = fs.readFileSync(r('src/film.html'), 'utf8');
const filled = tpl.replace('/*FONTS*/', () => fonts).replace('/*SCRIPT*/', () => js);
const [headPart, bodyPart] = filled.replace('<!--HEAD-->', '').split('<!--BODY-->');
const html =
  '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  headPart.trim() + '\n</head>\n<body>\n' + bodyPart.trim() + '\n</body>\n</html>\n';
fs.writeFileSync(r('kizzo-pub-45s.html'), html);
console.log(`wrote kizzo-pub-45s.html (${(html.length / 1024).toFixed(0)} KB)`);
