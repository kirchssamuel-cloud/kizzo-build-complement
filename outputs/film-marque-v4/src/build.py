#!/usr/bin/env python3
"""Inline fonts, logo vectors, cues, strings, sound and the film engine into self-contained HTML files."""
import base64, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)

def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, 'rb').read()).decode()

def build(with_audio=True):
    fonts = {w: b64(os.path.join(HERE, 'fonts', f'outfit-latin-{w}-normal.woff2'), 'font/woff2') for w in (200, 300, 500, 600, 700, 800)}
    logo = json.load(open(os.path.join(HERE, 'logo_vec.json')))
    logo = {k: logo[k] for k in ('headCircle', 'orangeCircle', 'paths', 'wordBox', 'bbox')}
    data = [
        'window.KZ_CUES = ' + open(os.path.join(HERE, 'cues.json')).read().strip() + ';',
        'window.KZ_STRINGS = ' + open(os.path.join(HERE, 'strings.json')).read().strip() + ';',
        'window.KZ_LOGO = ' + json.dumps(logo, separators=(',', ':')) + ';',
        'window.KZ_FONTS = ' + json.dumps(fonts) + ';',
        'window.KZ_INTER = ' + json.dumps({fam: {w: b64(os.path.join(HERE, 'fonts', f), 'font/woff2') for w, f in ws.items()} for fam, ws in
            {'InterD': {500: 'InterDisplay-Medium.woff2', 600: 'InterDisplay-SemiBold.woff2', 700: 'InterDisplay-Bold.woff2'},
             'Inter': {400: 'Inter-Regular.woff2', 500: 'Inter-Medium.woff2', 600: 'Inter-SemiBold.woff2'}}.items()}) + ';',
        'window.KZ_HAND = ' + json.dumps(b64(os.path.join(HERE, 'fonts', 'patrick-hand-latin-400-normal.woff2'), 'font/woff2')) + ';',
    ]
    audio = os.path.join(HERE, 'build', 'kizzo-sfx.m4a')
    if with_audio and os.path.exists(audio):
        data.append('window.KZ_AUDIO = ' + json.dumps(b64(audio, 'audio/mp4')) + ';')
    body = open(os.path.join(HERE, 'template.html')).read()
    body = body.replace('/*@@DATA@@*/', '\n'.join(data)).replace('/*@@FILM@@*/', open(os.path.join(HERE, 'film.js')).read())
    # artifact body (the host adds the document skeleton) and a full standalone document
    os.makedirs(os.path.join(HERE, 'build'), exist_ok=True)
    open(os.path.join(HERE, 'build', 'artifact.html'), 'w').write(body)
    full = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n' + body + '\n</body>\n</html>\n'
    open(os.path.join(OUT, 'kizzo-film.html'), 'w').write(full)
    print('built', len(full) // 1024, 'KB')

if __name__ == '__main__':
    build('--no-audio' not in sys.argv)
