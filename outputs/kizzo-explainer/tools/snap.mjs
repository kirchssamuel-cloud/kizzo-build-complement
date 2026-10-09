// Aperçus : rend des images fixes à des instants donnés (contrôle qualité).
// usage : node tools/snap.mjs <outDir> <h> t1 t2 ...
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const [outDir, hArg, ...times] = process.argv.slice(2);
const H = parseInt(hArg, 10) || 960;
const W = Math.round((H * 9) / 16);
fs.mkdirSync(outDir, { recursive: true });
const file = path.resolve('dist/kizzo-explainer.html');
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const t0 = Date.now();
await page.goto(`file://${file}?export=1&h=${H}${process.env.LANGQ || ''}`);
await page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 600000 }).catch((e) => logs.push('TIMEOUT ' + e.message));
console.log('boot', ((Date.now() - t0) / 1000).toFixed(1) + 's');
for (const t of times) {
  const s = Date.now();
  await page.evaluate((tt) => window.KIZZO.renderAt(tt), parseFloat(t));
  await page.screenshot({ path: path.join(outDir, `t${String(t).padStart(5, '0')}.png`), timeout: 0 });
  console.log('t=' + t, ((Date.now() - s) / 1000).toFixed(2) + 's');
}
console.log(logs.slice(0, 40).join('\n'));
await browser.close();
