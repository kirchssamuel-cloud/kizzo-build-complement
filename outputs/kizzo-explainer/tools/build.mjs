// Build : un seul fichier HTML autonome (Three.js + code + polices embarqués),
// lisible hors-ligne par double-clic. Produit aussi une variante "artifact".
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { LOGO } from '../src/logo-shape.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const r = (...p) => path.join(root, ...p);

const result = await esbuild.build({
  entryPoints: [r('src/main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  write: false,
  legalComments: 'none',
  alias: { 'three/addons': 'three/examples/jsm' },
  logLevel: 'warning',
});
const app = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const fonts = [
  ['Outfit', 500, 'outfit'],
  ['Outfit', 600, 'outfit'],
  ['Outfit', 700, 'outfit'],
  ['Outfit', 800, 'outfit'],
  ['Inter', 400, 'inter'],
  ['Inter', 500, 'inter'],
  ['Inter', 600, 'inter'],
  ['Inter', 700, 'inter'],
];
const fontCss = fonts
  .map(([fam, w, pkg]) => {
    const file = r(`node_modules/@fontsource/${pkg}/files/${pkg}-latin-${w}-normal.woff2`);
    const b64 = fs.readFileSync(file).toString('base64');
    return `@font-face{font-family:"${fam}";font-style:normal;font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${b64}) format("woff2");}`;
  })
  .join('\n');

const P = (x, y) => `${x.toFixed(4)} ${(-y).toFixed(4)}`;
const logoSvg =
  `<path fill="#3DB5DA" d="M${LOGO.body.map(([x, y]) => P(x, y)).join('L')}Z"/>` +
  `<circle fill="#3DB5DA" cx="${LOGO.head.c[0]}" cy="${-LOGO.head.c[1]}" r="${LOGO.head.r}"/>` +
  `<circle fill="#F97316" cx="${LOGO.child.c[0]}" cy="${-LOGO.child.c[1]}" r="${LOGO.child.r}"/>`;

const tpl = fs.readFileSync(r('src/index.html'), 'utf8');
const html = tpl
  .replace('/*FONTS*/', () => fontCss)
  .replace('<!--LOGO_SVG-->', () => logoSvg)
  .replace('/*APP*/', () => app);

const strip = (s) =>
  s
    .replace(/<!--HEAD_START-->[\s\S]*?<!--HEAD_END-->\n?/, '')
    .replace(/<!--HEAD_CLOSE-->[\s\S]*?<!--BODY_OPEN-->\n?/, '')
    .replace(/<!--BODY_CLOSE-->[\s\S]*?<!--DOC_END-->\n?/, '');
const clean = (s) => s.replace(/<!--(HEAD_START|HEAD_END|HEAD_CLOSE|BODY_OPEN|BODY_CLOSE|DOC_END)-->/g, '');

fs.mkdirSync(r('dist'), { recursive: true });
// livrable principal (versionné) + copie de travail pour les scripts d'aperçu / d'export
fs.writeFileSync(r('kizzo-explainer.html'), clean(html));
fs.writeFileSync(r('dist/kizzo-explainer.html'), clean(html));
fs.writeFileSync(r('dist/kizzo-explainer.artifact.html'), strip(html));
const kb = (f) => (fs.statSync(r(f)).size / 1024).toFixed(0) + ' Ko';
console.log('✓ kizzo-explainer.html', kb('kizzo-explainer.html'));
console.log('✓ dist/kizzo-explainer.artifact.html', kb('dist/kizzo-explainer.artifact.html'));
