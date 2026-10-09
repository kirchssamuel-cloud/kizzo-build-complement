// Offline renderer: drives the film page in headless Chromium and writes PNG frames.
// node render.mjs --lang en --fps 30 --sub 3 --out build/frames-en [--from 0 --to 765] [--stills 0.5,2.1] [--workers 4]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const lang = arg('lang', 'en'), fps = +arg('fps', 30), sub = +arg('sub', 1), out = path.resolve(HERE, arg('out', 'build/frames'));
const workers = +arg('workers', 4), stills = arg('stills', null);
const page_url = pathToFileURL(path.join(HERE, '..', 'kizzo-film.html')).href + `?render=1&lang=${lang}`;
fs.mkdirSync(out, { recursive: true });

const browsers = [];
async function makePage() {
  // one browser process per worker: pages inside a single browser share one raster thread
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb'] });
  browsers.push(browser);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto(page_url);
  await page.evaluate(() => window.KZ_READY);
  return page;
}
async function shoot(page, t, file) {
  // read the canvas back directly (much faster than a page screenshot)
  const [ms, url] = await page.evaluate(([t, sub, fps]) => { const a = performance.now(); KZ.renderFrame(t, { subframes: sub, shutter: .5 / fps });
    return [performance.now() - a, document.getElementById('kz-canvas').toDataURL('image/png')]; }, [t, sub, fps]);
  fs.writeFileSync(file, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  return ms;
}
const Q_DURATION = JSON.parse(fs.readFileSync(path.join(HERE, 'cues.json'), 'utf8')).duration;
const t0 = Date.now();
if (stills) {
  const page = await makePage();
  for (const s of stills.split(',')) { const ms = await shoot(page, +s, path.join(out, `still-${lang}-${(+s).toFixed(2)}.png`)); console.log('still', s, ms.toFixed(0) + 'ms'); }
} else {
  const total = Math.round(Q_DURATION * fps);
  const from = +arg('from', 0), to = Math.min(+arg('to', total), total);
  const frames = []; for (let i = from; i <= to; i++) frames.push(i);
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await makePage();
    while (next < frames.length) {
      const i = frames[next++];
      await shoot(page, i / fps, path.join(out, `f${String(i).padStart(5, '0')}.png`));
      if (++done % 30 === 0) console.log(`${done}/${frames.length} frames · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }));
}
await Promise.all(browsers.map(b => b.close()));
console.log('done in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
