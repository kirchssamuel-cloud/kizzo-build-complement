// Export MP4 1080×1920 image par image (rendu déterministe) + bande-son mixée.
// usage : node tools/export-video.mjs [--fps 60] [--h 1920] [--seg 240] [--out dist/kizzo-explainer-1080x1920.mp4]
// Reprenable : les segments déjà rendus (dist/parts/*.done) sont conservés.
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i > 0 ? process.argv[i + 1] : d;
};
const FPS = +arg('fps', 60);
const H = +arg('h', 1920);
const W = Math.round((H * 9) / 16);
const SEG = +arg('seg', 240);
const OUT = arg('out', `dist/kizzo-explainer-${W}x${H}-${FPS}fps.mp4`);
const DUR = 30;
const TOTAL = Math.round(DUR * FPS);
const partsDir = path.resolve('dist/parts');
fs.mkdirSync(partsDir, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`file://${path.resolve('dist/kizzo-explainer.html')}?export=1&h=${H}`);
await page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 900000 });

// bande-son (rendu hors-ligne dans la page)
const wav = path.join(partsDir, 'soundtrack.wav');
if (!fs.existsSync(wav)) {
  const b64 = await page.evaluate(() => window.KIZZO.renderAudioWav());
  fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
}

const t0 = Date.now();
let done = 0;
const nSeg = Math.ceil(TOTAL / SEG);
for (let s = 0; s < nSeg; s++) {
  const name = path.join(partsDir, `seg_${String(s).padStart(2, '0')}_${FPS}`);
  if (fs.existsSync(name + '.done')) continue;
  const from = s * SEG, to = Math.min(TOTAL, from + SEG);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv420p', name + '.mp4'], {
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  for (let i = from; i < to; i++) {
    await page.evaluate((t) => window.KIZZO.renderAt(t), i / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    done++;
    if (i % 20 === 0) {
      const el = (Date.now() - t0) / 1000;
      const left = TOTAL - i;
      const eta = (el / done) * left;
      console.log(`frame ${i}/${TOTAL} · ${(el / done).toFixed(2)} s/img · reste ~${Math.round(eta / 60)} min`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  fs.writeFileSync(name + '.done', '');
  console.log(`segment ${s + 1}/${nSeg} ok`);
}
await browser.close();

// assemblage + mix audio (normalisé -14 LUFS, réseaux sociaux)
const list = path.join(partsDir, `list_${FPS}.txt`);
fs.writeFileSync(
  list,
  Array.from({ length: nSeg }, (_, s) => `file '${path.join(partsDir, `seg_${String(s).padStart(2, '0')}_${FPS}.mp4`)}'`).join('\n')
);
execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'concat', '-safe', '0', '-i', list,
  '-i', wav,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-maxrate', '12M', '-bufsize', '24M', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-r', String(FPS),
  '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-t', String(DUR),
  '-movflags', '+faststart',
  OUT,
]);
console.log('✓', OUT, (fs.statSync(OUT).size / 1e6).toFixed(1) + ' Mo');
