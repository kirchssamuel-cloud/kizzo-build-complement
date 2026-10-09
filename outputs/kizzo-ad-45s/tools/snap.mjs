// QA helper: renders chosen timestamps to PNG.  node tools/snap.mjs <outDir> t1 t2 …
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [outDir, ...times] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && console.log('[page]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.addInitScript(() => { window.__KIZZO_RENDER__ = true; });
await page.goto('file://' + path.join(root, 'kizzo-pub-45s.html'));
await page.waitForFunction(() => window.__film, null, { timeout: 180000 });
await page.addStyleTag({ content: '#controls{display:none!important} #viewport{padding:0!important}' });
await page.evaluate(() => window.dispatchEvent(new Event('resize')));
console.log('shots on disk:', JSON.stringify(await page.evaluate(() => window.__film.shots())));
for (const t of times) {
  await page.evaluate((x) => window.__film.seek(x), Number(t));
  await page.screenshot({ path: path.join(outDir, `ad_${Number(t).toFixed(2)}.png`) });
}
await browser.close();
