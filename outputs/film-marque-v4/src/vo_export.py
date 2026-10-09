#!/usr/bin/env python3
"""Voice-over deliverables from cues.json:
- voix-off-FR.srt / voix-off-EN.srt (captions, also usable for social subtitles)
- a "guide" video per language: the film with the lines (child or narrator) and a running timecode
  in a band under the picture, for the voice actor to record to picture."""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
Q = json.load(open(os.path.join(HERE, 'cues.json')))
VO = Q['vo']
FONT = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
FONT_B = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'

def srt_tc(s):
    ms = int(round(s * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{sec:02d},{ms:03d}'

def write_srt(lang):
    path = os.path.join(OUT, f'voix-off-{lang.upper()}.srt')
    with open(path, 'w', encoding='utf-8') as f:
        for i, v in enumerate(VO, 1):
            f.write(f"{i}\n{srt_tc(v['t'])} --> {srt_tc(v['t'] + v['d'])}\n{v[lang]}\n\n")
    print('wrote', path)

def guide(lang):
    src = os.path.join(OUT, f'kizzo-film-v4-{lang.upper()}-9x16.mp4')
    if not os.path.exists(src): print('missing', src); return
    tdir = os.path.join(HERE, 'build', 'vo-lines'); os.makedirs(tdir, exist_ok=True)
    label = {'fr': {'narrator': 'VOIX OFF', 'child': 'ENFANT', 'next': 'SUIVANT'},
             'en': {'narrator': 'VOICE-OVER', 'child': 'CHILD', 'next': 'NEXT'}}[lang]
    lf = {}
    for name, txt in label.items():
        p = os.path.join(tdir, f'{lang}-{name}.txt'); open(p, 'w', encoding='utf-8').write(txt); lf[name] = p
    parts = ["[0:v]pad=1080:2200:0:0:color=0x000000[v0]",
             f"[v0]drawbox=x=0:y=1920:w=1080:h=4:color=0xff7a1b@0.9:t=fill[v1]",
             f"[v1]drawtext=fontfile={FONT}:text='%{{pts\\:hms}}':x=40:y=1996:fontsize=28:fontcolor=0x8da2bf[v3]"]
    cur = 'v3'
    for i, v in enumerate(VO):
        p = os.path.join(tdir, f'{lang}-{i:02d}.txt'); open(p, 'w', encoding='utf-8').write(v[lang])
        a, b = v['t'], v['t'] + v['d'] + .25
        who = v.get('who', 'narrator')  # the speaker, in the left column while the line runs
        parts.append(f"[{cur}]drawtext=fontfile={FONT_B}:textfile={lf[who]}:x=40:y=1958:fontsize=24:fontcolor={'0x4cc9f0' if who == 'child' else '0xff7a1b'}:enable='between(t,{a:.2f},{b:.2f})'[l{i}]")
        parts.append(f"[l{i}]drawtext=fontfile={FONT}:textfile={p}:x=40:y=2048:fontsize=34:fontcolor=white:enable='between(t,{a:.2f},{b:.2f})'[a{i}]")
        cur = f'a{i}'
        pa = max(0, a - 1.6)  # pre-roll: the next line, in grey, under the current one
        if who == 'child':
            p = os.path.join(tdir, f'{lang}-{i:02d}-next.txt'); open(p, 'w', encoding='utf-8').write(f"({label['child'].lower()}) {v[lang]}")
        parts.append(f"[{cur}]drawtext=fontfile={FONT_B}:textfile={lf['next']}:x=40:y=2130:fontsize=20:fontcolor=0x8da2bf:enable='between(t,{pa:.2f},{a:.2f})'[n{i}]")
        parts.append(f"[n{i}]drawtext=fontfile={FONT}:textfile={p}:x=170:y=2124:fontsize=26:fontcolor=0x8da2bf:enable='between(t,{pa:.2f},{a:.2f})'[b{i}]")
        cur = f'b{i}'
    script = os.path.join(HERE, 'build', f'guide-{lang}.filter')
    open(script, 'w').write(';\n'.join(parts))
    dst = os.path.join(OUT, f'kizzo-film-v4-{lang.upper()}-guide-voix-off.mp4')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-filter_complex_script', script, '-map', f'[{cur}]', '-map', '0:a',
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', dst], check=True)
    print('wrote', dst)

if __name__ == '__main__':
    for lang in ('fr', 'en'):
        write_srt(lang)
        if '--guide' in sys.argv: guide(lang)
