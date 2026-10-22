import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'path';
const root = '/home/user/kizzo-build-complement/motion-demo';
const out = process.argv[2];
const times = process.argv.slice(3).map(Number);
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'});
const composition = await selectComposition({serveUrl, id: 'Reel', puppeteerInstance: browser});
for (const t of times) {
  const frame = Math.round(t * 60);
  const s = Date.now();
  await renderStill({serveUrl, composition, frame, output: `${out}/t${t.toFixed(2)}.png`, puppeteerInstance: browser, imageFormat: 'png'});
  console.log(t, Date.now() - s, 'ms');
}
await browser.close({silent: true});
