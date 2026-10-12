"""Trace le logo Kizzo (PNG/JPG 512px) en contours vectoriels normalisés -> src/logo-shape.js"""
import sys, json
import numpy as np
from PIL import Image
from skimage import measure

src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255.0
H, W, _ = im.shape
navy = np.array([0x1e, 0x29, 0x3b]) / 255
cyan = np.array([0x3d, 0xb5, 0xda]) / 255
orange = np.array([0xf9, 0x72, 0x16]) / 255

def weight(c):
    # projection du pixel sur le segment navy -> c (gère l'anti-aliasing)
    d = c - navy
    return np.clip(((im - navy) @ d) / (d @ d), 0, 1)

def smooth(pts, k=3):
    n = len(pts)
    ker = np.exp(-0.5 * (np.arange(-k, k + 1) / (k / 2)) ** 2); ker /= ker.sum()
    out = np.zeros_like(pts)
    for i, w in zip(range(-k, k + 1), ker):
        out += w * np.roll(pts, i, axis=0)
    return out

def resample(pts, n):
    p = np.vstack([pts, pts[:1]])
    seg = np.linalg.norm(np.diff(p, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = np.linspace(0, s[-1], n, endpoint=False)
    return np.stack([np.interp(t, s, p[:, 0]), np.interp(t, s, p[:, 1])], 1)

# cyan : on exclut l'orange (dont la projection sur cyan est non nulle)
wc = weight(cyan)
wo = weight(orange)
dist_o = np.linalg.norm(im - orange, axis=2)
wc[dist_o < 0.35] = 0
cs = measure.find_contours(np.pad(wc, 2), 0.5)
cs = sorted(cs, key=len, reverse=True)
shapes = []
for c in cs[:3]:
    pts = c[:, ::-1] - 2  # (x,y)
    area = 0.5 * np.sum(pts[:, 0] * np.roll(pts[:, 1], -1) - np.roll(pts[:, 0], -1) * pts[:, 1])
    if abs(area) < 500: continue
    shapes.append(pts)

def circle_fit(pts):
    x, y = pts[:, 0], pts[:, 1]
    A = np.stack([x, y, np.ones_like(x)], 1)
    b = x ** 2 + y ** 2
    cx, cy, c = np.linalg.lstsq(A, b, rcond=None)[0]
    cx, cy = cx / 2, cy / 2
    return cx, cy, np.sqrt(c + cx ** 2 + cy ** 2)

result = {}
# head = shape la plus "circulaire" parmi les cyan
info = []
for pts in shapes:
    cx, cy, r = circle_fit(pts)
    err = np.std(np.linalg.norm(pts - [cx, cy], axis=1)) / r
    info.append((err, pts, (cx, cy, r)))
info.sort(key=lambda a: a[0])
head = info[0][2]
body = info[-1][1]
co = measure.find_contours(np.pad(wo, 2), 0.5)
co = max(co, key=len)[:, ::-1] - 2
child = circle_fit(co)

body = resample(smooth(resample(body, 900), 4), 220)
# normalisation : centre de la bbox globale, hauteur = 1
allpts = np.vstack([body, [[head[0], head[1] - head[2]]]])
minx, maxx = min(body[:, 0].min(), head[0] - head[2]), max(body[:, 0].max(), child[0] + child[2])
miny, maxy = head[1] - head[2], body[:, 1].max()
cx, cy = (minx + maxx) / 2, (miny + maxy) / 2
s = 1.0 / (maxy - miny)
def N(x, y): return [round((x - cx) * s, 5), round(-(y - cy) * s, 5)]
bodyN = [N(x, y) for x, y in body]
# orientation CCW (y vers le haut) pour THREE.Shape
a = 0.5 * sum(bodyN[i][0] * bodyN[(i + 1) % len(bodyN)][1] - bodyN[(i + 1) % len(bodyN)][0] * bodyN[i][1] for i in range(len(bodyN)))
if a < 0: bodyN = bodyN[::-1]
data = {
    'body': bodyN,
    'head': {'c': N(head[0], head[1]), 'r': round(head[2] * s, 5)},
    'child': {'c': N(child[0], child[1]), 'r': round(child[2] * s, 5)},
    'aspect': round((maxx - minx) / (maxy - miny), 5),
}
with open(out, 'w') as f:
    f.write('// Généré par tools/trace_logo.py depuis le logo officiel Kizzo (512px).\n')
    f.write('// Coordonnées normalisées : hauteur totale = 1, centre = (0,0), y vers le haut.\n')
    f.write('export const LOGO = ' + json.dumps(data, separators=(',', ':')) + ';\n')
print('head', data['head'], 'child', data['child'], 'aspect', data['aspect'], 'pts', len(bodyN))
