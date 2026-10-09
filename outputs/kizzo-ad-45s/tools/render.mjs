// Frame-accurate export: 1080×1920, 30 fps, exactly 45 s (1350 frames), H.264.
//   node tools/render.mjs [out.mp4] [--workers 3]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const out = path.resolve(args.find((a) => a.endsWith('.mp4')) || path.join(root, 'kizzo-pub-45s.mp4'));
const workers = Number(opt('--workers', 3));
const fps = 30, frames = 45 * fps;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kizzo-ad-'));

async function worker(id) {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.addInitScript(() => { window.__KIZZO_RENDER__ = true; });
  await page.goto('file://' + path.join(root, 'kizzo-pub-45s.html'));
  await page.waitForFunction(() => window.__film, null, { timeout: 180000 });
  await page.addStyleTag({ content: '#controls{display:none!important} #viewport{padding:0!important}' });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  for (let f = id; f < frames; f += workers) {
    await page.evaluate((x) => window.__film.seek(x), f / fps);
    await page.screenshot({ path: path.join(tmp, `f${String(f).padStart(5, '0')}.png`), timeout: 180000 });
    if (f % 90 === id) console.log(`frame ${f}/${frames}`);
  }
  await browser.close();
}

const t0 = Date.now();
await Promise.all([...Array(workers).keys()].map(worker));
console.log(`rendered ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
await new Promise((res, rej) => {
  const ff = spawn('ffmpeg', ['-y', '-framerate', String(fps), '-i', path.join(tmp, 'f%05d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-movflags', '+faststart', '-t', '45', out], { stdio: ['ignore', 'inherit', 'inherit'] });
  ff.on('exit', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
});
fs.rmSync(tmp, { recursive: true, force: true });
console.log('wrote', out);
