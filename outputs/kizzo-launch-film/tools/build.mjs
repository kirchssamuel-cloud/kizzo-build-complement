// Bundles the film into one self-contained HTML file (three.js, fonts and the
// logo layers are all inlined), plus a fragment variant for Claude Artifacts.
//   node tools/build.mjs [--artifact <path>]
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
  loader: { '.png': 'dataurl' },
  legalComments: 'eof',
  write: false,
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const b64 = (p) => fs.readFileSync(r(p)).toString('base64');
const face = (family, file) =>
  `@font-face{font-family:'${family}';font-style:normal;font-weight:100 900;font-display:block;` +
  `src:url(data:font/woff2;base64,${b64(file)}) format('woff2');}`;
const fonts =
  face('Outfit', 'node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2') +
  face('Inter', 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');

const tpl = fs.readFileSync(r('src/film.html'), 'utf8');
const filled = tpl.replace('/*FONTS*/', () => fonts).replace('/*SCRIPT*/', () => js);
const [headPart, bodyPart] = filled.replace('<!--HEAD-->', '').split('<!--BODY-->');

const full =
  '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<meta name="description" content="Kizzo — 15-second launch film. Screen time, reimagined.">\n' +
  headPart.trim() +
  '\n</head>\n<body>\n' +
  bodyPart.trim() +
  '\n</body>\n</html>\n';

const out = r('kizzo-launch-film.html');
fs.writeFileSync(out, full);
console.log(`wrote ${path.relative(process.cwd(), out)} (${(full.length / 1024).toFixed(0)} KB)`);

const ai = process.argv.indexOf('--artifact');
if (ai > 0) {
  const frag = headPart.trim() + '\n' + bodyPart.trim() + '\n';
  fs.writeFileSync(process.argv[ai + 1], frag);
  console.log(`wrote artifact fragment ${process.argv[ai + 1]} (${(frag.length / 1024).toFixed(0)} KB)`);
}
