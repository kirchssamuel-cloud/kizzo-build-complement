// Aperçu des écrans Canvas 2D sans la 3D : node tools/ui-preview.mjs <out.png> <expr> [<expr>...]
// <expr> = appel JS sur le module src/regles/ui.js, ex. "rulesScreen(c,390,860,{freq:1})".
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import * as esbuild from 'esbuild';

const [out, ...exprs] = process.argv.slice(2);
const fontCss = [['Outfit', 500, 'outfit'], ['Outfit', 600, 'outfit'], ['Outfit', 700, 'outfit'], ['Outfit', 800, 'outfit'], ['Plus Jakarta Sans', 500, 'plus-jakarta-sans'], ['Plus Jakarta Sans', 600, 'plus-jakarta-sans'], ['Plus Jakarta Sans', 700, 'plus-jakarta-sans'], ['Space Grotesk', 700, 'space-grotesk']]
  .map(([f, w, p]) => `@font-face{font-family:"${f}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(`node_modules/@fontsource/${p}/files/${p}-latin-${w}-normal.woff2`).toString('base64')})}`)
  .join('\n');
const src = `import * as U from './src/regles/ui.js'; import { makeCanvas } from './src/ui-canvas.js';
window.draw = (list) => list.map((e) => { const m = /^(\\w+)\\(c,(\\d+),(\\d+)/.exec(e); const w = +m[2], h = +m[3];
  const { canvas, ctx } = makeCanvas(w, h, 2); const c = ctx; new Function('U', 'c', 'with (U) { ' + e + ' }')(U, c); canvas.style.margin = '6px'; document.body.appendChild(canvas); return w; });`;
const r = await esbuild.build({ stdin: { contents: src, resolveDir: process.cwd(), loader: 'js' }, bundle: true, write: false, format: 'iife', alias: { 'three/addons': 'three/examples/jsm' }, logLevel: 'error' });
const html = `<!doctype html><html><head><style>${fontCss} body{margin:0;background:#333;display:flex;flex-wrap:wrap;align-items:flex-start} canvas{zoom:0.5}</style></head><body><script>${r.outputFiles[0].text}</script></body></html>`;
const tmp = path.resolve('dist/_ui-preview.html');
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync(tmp, html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('file://' + tmp);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => {
  for (const f of ['600 20px Outfit', '700 20px Outfit', '500 20px Outfit', '600 20px "Plus Jakarta Sans"', '700 20px "Plus Jakarta Sans"', '700 20px "Space Grotesk"']) await document.fonts.load(f);
});
await page.evaluate((l) => window.draw(l), exprs);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
