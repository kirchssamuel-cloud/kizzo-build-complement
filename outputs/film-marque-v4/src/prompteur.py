#!/usr/bin/env python3
"""Teleprompter video for the voice-over: the film on top, and under it the line to say,
in large type, at the exact moment — words light up at the pace they should be spoken,
with a 3·2·1 countdown before each line and the next line shown in grey.

  python3 prompteur.py fr   ->  ../kizzo-film-v4-FR-prompteur-voix-off.mp4
"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
Q = json.load(open(os.path.join(HERE, 'cues.json')))
VO, DUR, FPS = Q['vo'], Q['duration'], 30
LANG = sys.argv[1] if len(sys.argv) > 1 else 'fr'
W, H = 1080, 1920
FD = '/usr/share/fonts/opentype/inter/'
F = lambda name, size: ImageFont.truetype(FD + name, size)
f_line, f_tag, f_tc, f_dir, f_next, f_cnt, f_lab = (F('InterDisplay-Bold.otf', 62), F('Inter-SemiBold.otf', 30), F('Inter-SemiBold.otf', 40),
    F('Inter-Medium.otf', 28), F('Inter-Medium.otf', 36), F('InterDisplay-Bold.otf', 150), F('Inter-SemiBold.otf', 26))
WHITE, GREY, DIM, ORANGE, BLUE, BG = (245, 245, 247), (134, 134, 139), (72, 72, 76), (255, 122, 27), (76, 201, 240), (0, 0, 0)
T = {'fr': dict(child='ENFANT', narr='NARRATEUR', file='Fichier', nxt='Ensuite', ready='Prépare la réplique', silence='Pas de voix ici', head='PROMPTEUR VOIX OFF', end='Fin'),
     'en': dict(child='CHILD', narr='NARRATOR', file='File', nxt='Next', ready='Get ready for line', silence='No voice here', head='VOICE-OVER PROMPTER', end='End')}[LANG]
PANEL = (604, 1074); PX, PY = (W - PANEL[0]) // 2, 36

def tc(s): m, r = divmod(max(0.0, s), 60); return f"{int(m)}:{r:04.1f}".replace('.', ',' if LANG == 'fr' else '.')
def wrap(draw, text, font, maxw):
    words, lines, cur = text.split(' '), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=font) > maxw and cur: lines.append(cur); cur = w
        else: cur = t
    if cur: lines.append(cur)
    return lines
mask = Image.new('L', PANEL, 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, PANEL[0] - 1, PANEL[1] - 1], 36, fill=255)
src = os.path.join(HERE, 'build', f'frames-{LANG}')
dst_dir = os.path.join(HERE, 'build', f'prompteur-{LANG}'); os.makedirs(dst_dir, exist_ok=True)
N = int(round(DUR * FPS)) + 1
for n in range(N):
    t = n / FPS
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    film = Image.open(os.path.join(src, f'f{min(n, N - 1):05d}.png')).convert('RGB').resize(PANEL, Image.LANCZOS)
    im.paste(film, (PX, PY), mask); d.rounded_rectangle([PX - 1, PY - 1, PX + PANEL[0], PY + PANEL[1]], 36, outline=(40, 40, 44), width=2)
    y0 = PY + PANEL[1] + 40
    d.text((60, y0), T['head'], font=f_lab, fill=GREY); d.text((W - 60, y0 - 8), tc(t), font=f_tc, fill=WHITE, anchor='ra')
    cur = next((i for i, v in enumerate(VO) if v['t'] <= t < v['t'] + v['d'] + .25), None)
    nxt = next((i for i, v in enumerate(VO) if v['t'] > t), None)
    y = y0 + 70
    if cur is not None:
        v = VO[cur]; child = v.get('who') == 'child'
        tag = f"{T['file']} {cur:02d} · {T['child'] if child else T['narr']}"
        tw = d.textlength(tag, font=f_tag) + 40
        d.rounded_rectangle([60, y, 60 + tw, y + 50], 25, fill=BLUE if child else ORANGE); d.text((80, y + 9), tag, font=f_tag, fill=(10, 10, 12))
        y += 80
        # karaoke: each word lights up when it should be spoken (paced by its length across the line's duration)
        words = v[LANG].split(' '); total = sum(len(w) + 1 for w in words); acc = 0; due = []
        for w in words: due.append(v['t'] + v['d'] * acc / total); acc += len(w) + 1
        lines = wrap(d, v[LANG], f_line, W - 120); k = 0
        for ln in lines:
            x = 60
            for w in ln.split(' '):
                col = WHITE if t >= due[k] - .02 else DIM
                d.text((x, y), w, font=f_line, fill=col); x += d.textlength(w + ' ', font=f_line); k += 1
            y += 76
        y += 6
        for ln in wrap(d, v.get('dir_' + LANG, ''), f_dir, W - 120)[:2]: d.text((60, y), ln, font=f_dir, fill=GREY); y += 37
        p = min(1.0, max(0.0, (t - v['t']) / v['d']))
        y += 14; d.rounded_rectangle([60, y, W - 60, y + 10], 5, fill=(40, 40, 44)); d.rounded_rectangle([60, y, 60 + max(10, (W - 120) * p), y + 10], 5, fill=ORANGE)
    elif nxt is not None and VO[nxt]['t'] - t <= 1.5:
        left = VO[nxt]['t'] - t
        d.text((60, y), f"{T['ready']} {nxt:02d}", font=f_tag, fill=GREY)
        d.text((W // 2, y + 70), str(int(left / .5) + 1 if left < 1.5 else 3), font=f_cnt, fill=ORANGE, anchor='ma')
    else:
        d.text((60, y), T['silence'] if nxt is not None else T['end'], font=f_tag, fill=GREY)
    if nxt is not None:
        v = VO[nxt]; yb = H - 150
        d.text((60, yb), f"{T['nxt']} · {nxt:02d} · {tc(v['t'])}", font=f_lab, fill=GREY)
        ln = wrap(d, v[LANG], f_next, W - 120); d.text((60, yb + 38), ln[0] + (' …' if len(ln) > 1 else ''), font=f_next, fill=(110, 110, 115))
    im.save(os.path.join(dst_dir, f'p{n:05d}.png'), optimize=False, compress_level=1)
dst = os.path.join(OUT, f'kizzo-film-v4-{LANG.upper()}-prompteur-voix-off.mp4')
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(dst_dir, 'p%05d.png'),
                '-i', os.path.join(OUT, f'kizzo-film-v4-{LANG.upper()}-9x16.mp4'), '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium',
                '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', dst], check=True)
print('wrote', dst)
