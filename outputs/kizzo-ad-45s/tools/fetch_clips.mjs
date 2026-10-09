// Downloads the generated character shots listed in assets/clips/clips.local.json,
// then extracts 30 fps JPEG frames used by the frame-accurate renderer.
//   node tools/fetch_clips.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'assets/clips');
const localFile = path.join(dir, 'clips.local.json');
if (!fs.existsSync(localFile)) {
  console.error('Missing assets/clips/clips.local.json: { "clips": { "c1": "<url>", … } }.');
  console.error('Get each URL from your Higgsfield library (job ids are in assets/clips/clips.json).');
  process.exit(1);
}
const urls = JSON.parse(fs.readFileSync(localFile, 'utf8')).clips;

for (const [id, url] of Object.entries(urls)) {
  const mp4 = path.join(dir, `${id}.mp4`);
  if (!fs.existsSync(mp4)) {
    console.log(`downloading ${id}…`);
    execFileSync('curl', ['-sSfL', '-o', mp4, url], { stdio: 'inherit' });
  }
  const frames = path.join(dir, id);
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  execFileSync('ffmpeg', ['-v', 'error', '-i', mp4, '-vf', 'fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920', '-q:v', '3', path.join(frames, '%04d.jpg')], { stdio: 'inherit' });
  console.log(`${id}: ${fs.readdirSync(frames).length} frames`);
}
