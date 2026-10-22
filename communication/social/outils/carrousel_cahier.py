# Style de carrousel Kizzo « Le Cahier » : papier Seyès, marge orange, barre de progression de quiz, cartes-réponses A/B/C
# usage (depuis communication/social/outils) :
#   python3 carrousel_cahier.py polices assets/kizzo_logo.png DOSSIER_SORTIE spec.json 45    -> Instagram 1080×1350
#   python3 carrousel_cahier.py polices assets/kizzo_logo.png DOSSIER_SORTIE spec.json 916   -> TikTok 1080×1920
# dépendances : Pillow, police Inter Display installée (paquet fonts-inter) ; Outfit et Caveat sont dans polices/ (licence OFL)
import sys, json, re, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
FD, LOGO, OUT, SPEC = sys.argv[1:5]
FMT = sys.argv[5] if len(sys.argv) > 5 else '45'
W, H = (1080, 1920) if FMT == '916' else (1080, 1350)
K = 2                                                    # rendu en 2x puis réduction : formes et traits lissés
PROG_Y = 196 if FMT == '916' else 64                     # en 9:16, on laisse le haut à l'interface TikTok
ZONE = (330, 1330) if FMT == '916' else (200, 1180)      # zone du contenu, centré verticalement
FOOT_Y = 1420 if FMT == '916' else 1268
PAPER = (253, 249, 243); NAVY = (15, 23, 42); SLATE = (51, 65, 85); MUTED = (100, 116, 139)
ORANGE = (249, 115, 22); ORANGE_SOFT = (255, 237, 213); BLUE = (46, 179, 227); BEIGE = (231, 223, 211)
GREEN = (22, 163, 74); GREEN_SOFT = (220, 252, 231); RED = (220, 38, 38); RED_SOFT = (254, 226, 226); WHITE = (255, 255, 255)
MARGIN_X, X0, X1 = 76, 116, 996; MAXW = X1 - X0
def mix(c, a, bg=PAPER): return tuple(int(bg[i]*(1-a) + c[i]*a) for i in range(3))
def S(v): return int(round(v*K))

def F(size, w=800):
    f = ImageFont.truetype(f'{FD}/Outfit.ttf', S(size)); f.set_variation_by_axes([w]); return f
def I(size, w='Medium'): return ImageFont.truetype(f'/usr/share/fonts/opentype/inter/InterDisplay-{w}.otf', S(size))
def HW(size, w=600):
    f = ImageFont.truetype(f'{FD}/caveat/Caveat.ttf', S(size)); f.set_variation_by_axes([w]); return f
def tl(f, t): return f.getlength(t)/K                    # largeur en px « design »

# --- logo : pictogramme (bleu + orange) et mot « kizzo » recoloré en bleu nuit pour le fond clair ---
src = Image.open(LOGO).convert('RGBA')
PIC = src.crop((0, 0, src.size[0], 339)); PIC = PIC.crop(PIC.getbbox())
WORD = src.crop((0, 341, src.size[0], src.size[1])); WORD = WORD.crop(WORD.getbbox())
WORD = Image.merge('RGBA', [Image.new('L', WORD.size, c) for c in NAVY] + [WORD.getchannel('A')])

class C:
    """toile en 2x, coordonnées en px de la maquette 1080"""
    def __init__(s, w, h): s.im = Image.new('RGB', (S(w), S(h)), PAPER); s.d = ImageDraw.Draw(s.im)
    def rect(s, x0, y0, x1, y1, r=20, fill=None, outline=None, width=0):
        s.d.rounded_rectangle((S(x0), S(y0), S(x1), S(y1)), S(r), fill=fill, outline=outline, width=S(width) if width else 0)
    def circle(s, cx, cy, r, fill=None, outline=None, width=0):
        s.d.ellipse((S(cx-r), S(cy-r), S(cx+r), S(cy+r)), fill=fill, outline=outline, width=S(width) if width else 0)
    def line(s, pts, fill, width, round_caps=True):
        s.d.line([(S(x), S(y)) for x, y in pts], fill=fill, width=S(width), joint='curve')
        if round_caps:
            for x, y in (pts[0], pts[-1]): s.circle(x, y, width/2, fill=fill)
    def poly(s, pts, fill=None, outline=None, width=0):
        s.d.polygon([(S(x), S(y)) for x, y in pts], fill=fill, outline=outline, width=S(width) if width else 0)
    def text(s, x, y, t, f, fill, anchor='la'): s.d.text((S(x), S(y)), t, font=f, fill=fill, anchor=anchor)
    def paste(s, img, x, y): s.im.paste(img, (S(x), S(y)), img if img.mode == 'RGBA' else None)
    def shadow(s, x0, y0, x1, y1, r=20, a=0.10, blur=16, dy=10):
        pad = blur*3; box = (S(x0-pad), S(y0-pad+dy), S(x1+pad), S(y1+pad+dy))
        m = Image.new('L', (box[2]-box[0], box[3]-box[1]), 0)
        ImageDraw.Draw(m).rounded_rectangle((S(pad), S(pad), S(pad+x1-x0), S(pad+y1-y0)), S(r), fill=int(255*a))
        m = m.filter(ImageFilter.GaussianBlur(S(blur)))
        s.im.paste(Image.new('RGB', m.size, NAVY), box[:2], m)
    def card(s, x0, y0, x1, y1, fill=WHITE, a=0.09, outline=None, width=0):
        s.shadow(x0, y0, x1, y1, a=a); s.rect(x0, y0, x1, y1, 20, fill=fill, outline=outline, width=width)

def paper(c):
    """quadrillage Seyès (grands carreaux) très discret + marge orange"""
    main, thin, vert = mix(BLUE, 0.20), mix(BLUE, 0.09), mix(BLUE, 0.13)
    for y in range(0, H, 16):
        c.d.line((0, S(y), S(W), S(y)), fill=main if y % 64 == 0 else thin, width=S(1.5 if y % 64 == 0 else 1))
    for x in range(MARGIN_X + 64, W, 64): c.d.line((S(x), 0, S(x), S(H)), fill=vert, width=S(1))
    c.d.line((S(MARGIN_X), 0, S(MARGIN_X), S(H)), fill=mix(ORANGE, 0.75), width=S(3))

def spaced(c, x, y, t, f, fill, sp):
    for ch in t: c.text(x, y, ch, f, fill, 'lm'); x += tl(f, ch) + sp
    return x
def label_w(t, f, sp): return sum(tl(f, ch) for ch in t) + sp*(len(t)-1)

def header(c, n, total, label):
    gap = 10; seg = (MAXW - gap*(total-1))/total
    for i in range(total):
        x = X0 + i*(seg+gap); c.rect(x, PROG_Y, x+seg, PROG_Y+10, 5, fill=ORANGE if i < n else BEIGE)
    if label:
        f = F(24, 700); w = label_w(label, f, 2.4)
        c.rect(X0, PROG_Y+36, X0+w+40, PROG_Y+84, 20, fill=ORANGE_SOFT); spaced(c, X0+20, PROG_Y+61, label, f, ORANGE, 2.4)

def footer(c, last):
    ph = 46; pic = PIC.resize((S(PIC.size[0]*ph/PIC.size[1]), S(ph)), Image.LANCZOS)
    wd = WORD.resize((S(WORD.size[0]*25/WORD.size[1]), S(25)), Image.LANCZOS)
    c.paste(pic, X0, FOOT_Y - ph/2); c.paste(wd, X0 + pic.size[0]/K + 10, FOOT_Y - 25/2 + 3)
    if not last:
        cx = X1 - 36; c.circle(cx, FOOT_Y, 36, fill=ORANGE)
        c.line([(cx-14, FOOT_Y), (cx+13, FOOT_Y)], WHITE, 5); c.line([(cx+2, FOOT_Y-12), (cx+14, FOOT_Y), (cx+2, FOOT_Y+12)], WHITE, 5)

# --- titres : casse normale, mots-clés **orange** soulignés d'un coup de stylo ---
BR = ('\n', False)
def tokens(txt):
    """mots -> unités insécables : un groupe **surligné** reste sur une ligne, la ponctuation reste collée au mot"""
    out = []
    for k, para_ in enumerate(txt.split('\n')):
        if k: out.append(BR)
        for i, seg in enumerate(re.split(r'\*\*', para_)):
            ws = [w for w in seg.split(' ') if w]
            if not ws: continue
            if i % 2 == 1: out.append((' '.join(ws), True)); continue
            for w in ws:
                if out and out[-1] is not BR and re.fullmatch(r'[?!:;»]+', w): out[-1] = (out[-1][0] + ' ' + w, out[-1][1])
                else: out.append((w, False))
    merged = []                                          # « s'accroche au mot suivant
    for t in out:
        if merged and merged[-1] is not BR and merged[-1][0] == '«' and t is not BR: merged[-1] = ('« ' + t[0], t[1])
        else: merged.append(t)
    for j in range(len(merged)-1):                       # un mot ordinaire suivi d'un « ? » surligné : on garde l'ensemble lisible
        pass
    return merged
def layout(txt, size, maxw):
    f = F(size, 800); sp = tl(f, ' '); lines, cur, cw, widest = [], [], 0, 0
    for tok in tokens(txt):
        if tok is BR: lines.append(cur); widest = max(widest, cw); cur, cw = [], 0; continue
        wl = tl(f, tok[0])
        if cur and cw + sp + wl > maxw: lines.append(cur); widest = max(widest, cw); cur, cw = [], 0
        cw += (sp if cur else 0) + wl; cur.append(tok)
    widest = max(widest, cw)
    return lines + [cur], f, widest
def title(c, x, y, txt, size=92, maxw=MAXW, max_lines=4, color=NAVY):
    lines, f, wd = layout(txt, size, maxw)
    while (len(lines) > max_lines or wd > maxw) and size > 40:
        size -= 2; lines, f, wd = layout(txt, size, maxw)
    lh = size*1.1; _, top, _, base = f.getbbox('H'); top, base = top/K, base/K; sp = tl(f, ' ')
    for i, ln in enumerate(lines):
        yy = y + i*lh; cx = x; run = None
        for j, (w, hl) in enumerate(ln):
            if c: c.text(cx, yy - top, w, f, ORANGE if hl else color)
            wl = tl(f, w)
            if hl: run = (run[0] if run else cx, cx + wl)
            if run and (not hl or j == len(ln)-1):
                if c: swoosh(c, run[0], run[1], yy - top + base + size*0.09, size)
                run = None
            cx += wl + sp
    return y + (len(lines)-1)*lh + (base - top) + size*0.16
def swoosh(c, x0, x1, y, size):
    """soulignement manuscrit : courbe légèrement creusée, qui remonte en fin de trait"""
    w = max(5, size*0.075); pts = []
    for i in range(41):
        t = i/40; px = (x0-4)*(1-t)**2 + (x0+x1)/2*2*t*(1-t) + (x1+10)*t*t
        py = (y+2)*(1-t)**2 + (y+size*0.11)*2*t*(1-t) + (y-size*0.04)*t*t
        pts.append((px, py))
    c.line(pts, ORANGE, w)

def para(c, x, y, txt, size=36, maxw=MAXW, color=SLATE, w='Medium', lh=1.38):
    f = I(size, w); words = txt.split(); line = ''; out = []
    for wd in words:
        t = (line + ' ' + wd).strip()
        if tl(f, t) <= maxw or not line: line = t
        else: out.append(line); line = wd
    out.append(line)
    for i, ln in enumerate(out):
        if c: c.text(x, y + i*size*lh, ln, f, color)
    return y + len(out)*size*lh

# --- éléments ---
def check(c, cx, cy, r, col=WHITE, w=None):
    w = w or r*0.32; c.line([(cx-r*0.45, cy+r*0.02), (cx-r*0.12, cy+r*0.34), (cx+r*0.48, cy-r*0.34)], col, w)
def cross(c, cx, cy, r, col, w=None):
    w = w or r*0.3; c.line([(cx-r*0.36, cy-r*0.36), (cx+r*0.36, cy+r*0.36)], col, w); c.line([(cx-r*0.36, cy+r*0.36), (cx+r*0.36, cy-r*0.36)], col, w)
def answer(c, y, letter, txt, state=None, note=None, x0=X0, x1=X1, size=40):
    """carte-réponse ; state : None, 'bad', 'good'"""
    h = 108 if not note else 150
    if c is None: return h
    if state == 'good': c.card(x0, y, x1, y+h, outline=GREEN, width=4)
    else: c.card(x0, y, x1, y+h, fill=WHITE if state != 'bad' else (250, 247, 243), a=0.07 if state == 'bad' else 0.09)
    cy = y + 54; bx = x0 + 34 + 26
    if state == 'good': c.circle(bx, cy, 27, fill=GREEN); check(c, bx, cy, 27)
    elif state == 'bad': c.circle(bx, cy, 27, fill=RED_SOFT); cross(c, bx, cy, 27, RED)
    else: c.circle(bx, cy, 27, fill=ORANGE_SOFT); c.text(bx, cy+1, letter, F(30, 800), ORANGE, 'mm')
    f = F(size, 650 if state != 'good' else 760); col = MUTED if state == 'bad' else NAVY
    c.text(bx + 50, cy, txt, f, col, 'lm')
    if state == 'bad':
        _, t0, _, t1 = f.getbbox('x'); ym = cy + 1; c.line([(bx+48, ym), (bx+52+tl(f, txt), ym)], mix(MUTED, 0.8, WHITE), 3, False)
    if note: c.text(bx + 50, y + 104, note, I(30, 'Medium'), RED if state == 'bad' else GREEN, 'lm')
    return h

def illus_notebook(c, y):
    """page de cahier photographiée : coins de viseur orange + matière détectée"""
    pw, ph = 600, 400; img = C(pw+80, ph+80); img.im = Image.new('RGBA', img.im.size, (0, 0, 0, 0)); img.d = ImageDraw.Draw(img.im)
    img.shadow(40, 40, 40+pw, 40+ph, a=0.16); img.rect(40, 40, 40+pw, 40+ph, 20, fill=WHITE)
    for yy in range(100, 40+ph-10, 48): img.d.line((S(40), S(yy), S(40+pw), S(yy)), fill=mix(BLUE, 0.28, WHITE), width=S(1.5))
    img.d.line((S(100), S(40), S(100), S(40+ph)), fill=mix(RED, 0.55, WHITE), width=S(2.5))
    img.text(122, 94, 'Les Francs', HW(52, 700), (30, 64, 175), 'ls')
    lines = ['Clovis devient roi des Francs', 'en 481. Baptisé à Reims', 'vers 496. Capitale : Paris.']
    for i, t in enumerate(lines): img.text(122, 143 + i*48, t, HW(40, 520), (37, 56, 120), 'ls')
    img.im = img.im.rotate(-3, Image.BICUBIC, expand=False)
    x = (W - (pw+80))/2 - 40; c.paste(img.im, x, y)
    gx0, gy0, gx1, gy1 = x+40-34, y+40-30, x+40+pw+34, y+40+ph+30; L = 56
    for (px, py, dx, dy) in ((gx0, gy0, 1, 1), (gx1, gy0, -1, 1), (gx0, gy1, 1, -1), (gx1, gy1, -1, -1)):
        c.line([(px, py+dy*L), (px, py), (px+dx*L, py)], ORANGE, 8)
    chip = 'Matière détectée : Histoire'; f = F(28, 700); cw = tl(f, chip) + 92; cx0 = (W - cw)/2; cy0 = gy1 + 30
    c.card(cx0, cy0, cx0+cw, cy0+60); spark(c, cx0+38, cy0+30, 14, ORANGE); c.text(cx0+62, cy0+31, chip, f, NAVY, 'lm')
    return cy0 + 60 - y
def spark(c, cx, cy, r, col):
    q = r*0.3; c.poly([(cx, cy-r), (cx+q, cy-q), (cx+r, cy), (cx+q, cy+q), (cx, cy+r), (cx-q, cy+q), (cx-r, cy), (cx-q, cy-q)], fill=col)

def illus_quiz(c, y):
    x0, x1 = X0 + 40, X1 - 40; h = 520
    c.card(x0, y, x1, y+h)
    c.text(x0+40, y+50, 'QUESTION 2 / 5  ·  HISTOIRE', F(22, 700), MUTED, 'lm')
    yy = title(c, x0+40, y+92, 'Qui était le premier roi des Francs ?', 46, x1-x0-80, 2)
    yy += 20
    for L, t, st in (('A', 'Clovis', 'good'), ('B', 'Charlemagne', None), ('C', 'Louis XIV', None)):
        answer(c, yy, L, t, st, None, x0+30, x1-30, 36); yy += 108 + 14
    sticker(c, x1 - 70, y + 6, '+5 min')
    return h
def sticker(c, cx, cy, t, size=40):
    f = F(size, 850); w = tl(f, t) + 52; h = size*1.85
    lay = C(w+40, h+40); lay.im = Image.new('RGBA', lay.im.size, (0, 0, 0, 0)); lay.d = ImageDraw.Draw(lay.im)
    lay.shadow(20, 20, 20+w, 20+h, a=0.22, blur=8, dy=6); lay.rect(20, 20, 20+w, 20+h, 20, fill=ORANGE); lay.text(20+w/2, 20+h/2+1, t, f, WHITE, 'mm')
    lay.im = lay.im.rotate(8, Image.BICUBIC, expand=True)
    c.paste(lay.im, cx - lay.im.size[0]/K/2, cy - lay.im.size[1]/K/2)

def illus_ring(c, y):
    x0, x1 = X0 + 120, X1 - 120; h = 470; c.card(x0, y, x1, y+h)
    cx, cy, r = (x0+x1)/2, y + 205, 140
    c.d.arc((S(cx-r), S(cy-r), S(cx+r), S(cy+r)), 0, 360, fill=BEIGE, width=S(26))
    c.d.arc((S(cx-r), S(cy-r), S(cx+r), S(cy+r)), -90, 180, fill=ORANGE, width=S(26))
    for a in (-90, 180):
        ax, ay = cx + (r-13)*math.cos(math.radians(a)), cy + (r-13)*math.sin(math.radians(a)); c.circle(ax, ay, 13, fill=ORANGE)
    c.text(cx, cy - 8, '+5 min', F(66, 850), NAVY, 'mm'); c.text(cx, cy + 50, "d'écran", I(30, 'Medium'), MUTED, 'mm')
    c.text(cx, y + h - 52, '3 bonnes réponses sur 3', F(32, 700), GREEN, 'mm')
    return h

def checklist(c, y, items):
    for t, sub in items:
        h = 136 if sub else 104
        if c:
            c.card(X0, y, X1, y+h); bx, by = X0 + 34, y + 30
            c.rect(bx, by, bx+44, by+44, 12, fill=ORANGE); check(c, bx+22, by+22, 22)
            c.text(bx + 72, by + 22, t, F(38, 700), NAVY, 'lm')
            if sub: c.text(bx + 72, by + 68, sub, I(29, 'Medium'), SLATE, 'lm')
        y += h + 18
    return y - 18

def plane(c, cx, cy, r, col):
    c.poly([(cx-r, cy-r*0.15), (cx+r, cy-r*0.8), (cx+r*0.25, cy+r*0.85), (cx-r*0.05, cy+r*0.1)], outline=col, width=4)
    c.line([(cx-r*0.05, cy+r*0.1), (cx+r, cy-r*0.8)], col, 4)
def bookmark(c, cx, cy, r, col):
    c.poly([(cx-r*0.62, cy-r), (cx+r*0.62, cy-r), (cx+r*0.62, cy+r), (cx, cy+r*0.45), (cx-r*0.62, cy+r)], outline=col, width=4)

def block(c, s, y):
    """dessine (c) ou mesure (c=None) le contenu d'un visuel ; renvoie le y de fin"""
    t = s['type']
    if 'title' in s: y = title(c, X0, y, s['title'], s.get('size', 92), MAXW, s.get('max_lines', 4)) + (40 if 'text' in s else 24)
    if 'text' in s: y = para(c, X0, y, s['text']) + 10
    y += 26
    if t in ('quiz', 'reveal'):
        for a in s['answers']:
            y += answer(c, y, a[0], a[1], a[2] if len(a) > 2 else None, a[3] if len(a) > 3 else None) + 18
        y -= 18
        if s.get('annot') and c:
            c.text(X1 - 10, y + 54, s['annot'], HW(50, 700), ORANGE, 'rm');
        if s.get('annot'): y += 80
    elif t == 'notebook': y += illus_notebook(c, y) if c else 500
    elif t == 'quizcard': y += illus_quiz(c, y) if c else 520
    elif t == 'ring': y += illus_ring(c, y) if c else 470
    elif t == 'check': y = checklist(c, y, s['items'])
    elif t == 'cta':
        f = F(42, 760); bw = tl(f, s['button']) + 150
        if c:
            c.shadow(X0, y, X0+bw, y+108, a=0.18); c.rect(X0, y, X0+bw, y+108, 20, fill=ORANGE)
            c.text(X0 + 44, y + 54, s['button'], f, WHITE, 'lm')
            ax = X0 + bw - 46; c.line([(ax-14, y+54), (ax+12, y+54)], WHITE, 5); c.line([(ax+1, y+42), (ax+13, y+54), (ax+1, y+66)], WHITE, 5)
        y += 108 + 52
        for icon, txt in s.get('actions', []):
            if c:
                (plane if icon == 'plane' else bookmark)(c, X0 + 22, y + 22, 18, NAVY); c.text(X0 + 64, y + 22, txt, F(34, 650), NAVY, 'lm')
            y += 62
        y -= 18
    return y

spec = json.load(open(SPEC)); total = len(spec)
for n, s in enumerate(spec, 1):
    c = C(W, H); paper(c); header(c, n, total, s.get('label')); footer(c, n == total)
    hgt = block(None, s, 0)
    y = ZONE[0] + max(0, (ZONE[1] - ZONE[0] - hgt)/2 - 20)
    block(c, s, y)
    if s.get('hint'): c.text(X1 - 92, FOOT_Y, s['hint'], F(30, 650), MUTED, 'rm')
    if s.get('sticker'):                                 # CTA tôt (méthode de script) : mot-clé en haut à droite
        sw = tl(F(34, 850), s['sticker']) + 52; sticker(c, X1 - sw/2 - 6, PROG_Y + 62, s['sticker'], 34)
    c.im.resize((W, H), Image.LANCZOS).save(f'{OUT}/slide_{n:02d}.png', optimize=True)
print('ok', total, FMT)
