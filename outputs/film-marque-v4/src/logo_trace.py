#!/usr/bin/env python3
"""Trace the supplied Kizzo logo (logo-source.jpg) into the vector data the film draws (logo_vec.json).
Each pixel is un-mixed against the navy background, so anti-aliased edges keep sub-pixel accuracy.
Needs numpy, Pillow and scikit-image."""
import json, os, re
import numpy as np
from PIL import Image
from skimage import measure

HERE = os.path.dirname(os.path.abspath(__file__))
im = np.asarray(Image.open(os.path.join(HERE, 'logo-source.jpg')).convert('RGB')).astype(np.float32)
H, W, _ = im.shape
bg = np.median(np.concatenate([im[:50, :50].reshape(-1, 3), im[-50:, -50:].reshape(-1, 3), im[:50, -50:].reshape(-1, 3)]), axis=0)
med = lambda m: np.median(im[m], axis=0)
inks = [med((im[..., 2] > 220) & (im[..., 0] < 80)), med((im[..., 0] > 240) & (im[..., 2] < 60)), med(im.min(axis=2) > 235)]  # blue, orange, white
best_res = np.full((H, W), 1e9); alpha = np.zeros((H, W)); kind = np.zeros((H, W), int)
for k, F in enumerate(inks):
    v = F - bg; a = np.clip(((im - bg) @ v) / (v @ v), 0, 1)
    res = np.linalg.norm(im - (bg + a[..., None] * v), axis=2); m = res < best_res
    best_res[m] = res[m]; alpha[m] = a[m]; kind[m] = k
alpha[alpha < .04] = 0; alpha = np.clip((alpha - .02) / .96, 0, 1)
yy, xx = np.mgrid[0:H, 0:W]
split = 550  # gap row between the head and the body
layers = {'head': alpha * ((kind == 0) & (yy < split)), 'body': alpha * ((kind == 0) & (yy >= split)),
          'orange': alpha * (kind == 1), 'word': alpha * (kind == 2)}
ys, xs = np.nonzero(alpha > .5); X0, X1, Y0, Y1 = xs.min(), xs.max(), ys.min(), ys.max()
OX, OY = (X0 + X1) / 2, (Y0 + Y1) / 2

def circle(m):
    s = m.sum(); return [round(float((m * xx).sum() / s - OX), 2), round(float((m * yy).sum() / s - OY), 2), round(float(np.sqrt(s / np.pi)), 2)]
def rdp(pts, tol):
    keep = np.zeros(len(pts), bool); keep[0] = keep[-1] = True; stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1: continue
        p, q = pts[i], pts[j]; d = q - p; n = np.hypot(*d); seg = pts[i + 1:j]
        dist = np.hypot(*(seg - p).T) if n < 1e-9 else np.abs(d[0] * (seg[:, 1] - p[1]) - d[1] * (seg[:, 0] - p[0])) / n
        m = int(np.argmax(dist))
        if dist[m] > tol: keep[i + 1 + m] = True; stack += [(i, i + 1 + m), (i + 1 + m, j)]
    return pts[keep]
paths = {}
for name in ('body', 'word', 'head', 'orange'):
    d = []
    for c in measure.find_contours(np.pad(layers[name], 1), .5):
        if len(c) < 20: continue
        pts = rdp(np.stack([c[:, 1] - 1 - OX + .5, c[:, 0] - 1 - OY + .5], 1), .2)
        d.append('M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z')
    paths[name] = ' '.join(d)
nums = list(map(float, re.findall(r'-?\d+\.?\d*', paths['word'])))
out = {'origin': [float(OX), float(OY)], 'bbox': [float(X0 - OX), float(Y0 - OY), float(X1 - OX), float(Y1 - OY)],
       'headCircle': circle(layers['head']), 'orangeCircle': circle(layers['orange']), 'paths': paths,
       'wordBox': [min(nums[0::2]), min(nums[1::2]), max(nums[0::2]), max(nums[1::2])]}
json.dump(out, open(os.path.join(HERE, 'logo_vec.json'), 'w'))
print('logo_vec.json written', out['headCircle'], out['orangeCircle'])
