// Rend la bande-son hors-ligne depuis la page et l'écrit en WAV (contrôle + export).
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
const out = process.argv[2] || 'dist/kizzo-soundtrack.wav';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 270, height: 480 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto('file://' + path.resolve('dist/kizzo-explainer.html') + '?export=1&h=480');
await page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 300000 });
const b64 = await page.evaluate(() => window.KIZZO.renderAudioWav());
fs.writeFileSync(out, Buffer.from(b64, 'base64'));
console.log('wav', out, (fs.statSync(out).size / 1e6).toFixed(1) + ' Mo');
await browser.close();
