#!/usr/bin/env node
// Export the Kizzo explainer (index.html) to an MP4: 1920x1080, 30 fps, H.264 + AAC.
// Every frame is rendered from the same timeline the browser plays, so the file
// matches the live animation exactly (captions included, voice-over excluded).
//
// Usage:  node render.mjs [output.mp4] [--fps 30]
// Needs:  Node 18+, ffmpeg on the PATH, Playwright with Chromium
//         (npm i -D playwright && npx playwright install chromium)

import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const fpsIdx = args.indexOf('--fps');
const FPS = fpsIdx >= 0 ? Number(args.splice(fpsIdx, 2)[1]) : 30;
const outFile = path.resolve(args[0] || path.join(here, 'kizzo-explainer.mp4'));

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try { return require('playwright'); } catch { /* fall through to the global install */ }
  try { return require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); } catch { /* not installed */ }
  console.error('Playwright not found. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(pathToFileURL(path.join(here, 'index.html')).href + '?render=1');
await page.waitForFunction(() => window.KIZZO && window.KIZZO.ready, null, { timeout: 60000 });
const DUR = await page.evaluate(() => window.KIZZO.duration);

process.stdout.write('Rendering soundtrack… ');
const wav = path.join(os.tmpdir(), `kizzo-explainer-${process.pid}.wav`);
fs.writeFileSync(wav, Buffer.from(await page.evaluate(() => window.KIZZO.renderAudio()), 'base64'));
console.log('done');

const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-i', wav,
  '-map', '0:v', '-map', '1:a',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS),
  '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
  '-t', String(DUR), '-movflags', '+faststart',
  outFile,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const frames = Math.round(DUR * FPS);
const started = Date.now();
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.KIZZO.seek(t), i / FPS);
  const png = await page.screenshot({ type: 'png' });
  if (!ff.stdin.write(png)) await once(ff.stdin, 'drain');
  if (i % FPS === 0 || i === frames - 1) {
    process.stdout.write(`\rFrames ${i + 1}/${frames} · ${Math.round((Date.now() - started) / 1000)}s`);
  }
}
ff.stdin.end();
const [code] = await once(ff, 'close');
await browser.close();
fs.rmSync(wav, { force: true });
if (code !== 0) { console.error(`\nffmpeg exited with code ${code}`); process.exit(code); }
console.log(`\nSaved ${outFile}`);
