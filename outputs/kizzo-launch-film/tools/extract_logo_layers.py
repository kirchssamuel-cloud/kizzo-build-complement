"""Extract the supplied Kizzo logo into pixel-aligned transparent layers.

The logo is flat colour on a flat navy ground, so every pixel is a mix of
the navy background and exactly one foreground colour. Un-mixing each pixel
against the background gives an exact alpha matte per brand element without
redrawing anything.

Usage: python3 -I tools/extract_logo_layers.py assets/kizzo-logo-source.jpg assets/
"""
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image

src, out = Path(sys.argv[1]), Path(sys.argv[2])
img = np.asarray(Image.open(src).convert("RGB")).astype(np.float64)
H, W, _ = img.shape

def median_color(mask):
    return np.median(img[mask], axis=0)

# Ground and the three brand colours, measured from the file itself.
edge = np.concatenate([img[:200].reshape(-1, 3), img[-200:].reshape(-1, 3)])
BG = np.median(edge, axis=0)
r, g, b = img[..., 0], img[..., 1], img[..., 2]
BLUE = median_color((b > 200) & (r < 80) & (g > 150))
ORANGE = median_color((r > 220) & (g > 90) & (g < 160) & (b < 80))
WHITE = np.array([255.0, 255.0, 255.0])  # wordmark is pure white; JPEG reads 254

def unmix(F):
    d = F - BG
    a = ((img - BG) @ d) / (d @ d)
    a = np.clip(a, 0, 1)
    resid = np.linalg.norm(img - (BG + a[..., None] * d), axis=-1)
    return a, resid

aB, rB = unmix(BLUE)
aO, rO = unmix(ORANGE)
aW, rW = unmix(WHITE)

yy, xx = np.mgrid[0:H, 0:W]
mark_zone = yy < 975          # symbol above, wordmark below
word_zone = ~mark_zone
# The orange dot is a separate disc: only un-mix it as orange near its core.
core = (r > 220) & (g > 90) & (g < 160) & (b < 80)
cy, cx = np.nonzero(core)
m = 8
orange_zone = (yy >= cy.min() - m) & (yy <= cy.max() + m) & (xx >= cx.min() - m) & (xx <= cx.max() + m)
pick_orange = mark_zone & orange_zone & (rO < rB) & (aO > 0.02)
pick_blue = mark_zone & ~pick_orange

def clean(a):
    a = a.copy()
    a[a < 0.035] = 0
    a[a > 0.965] = 1
    return a

layers = {
    "blue": clean(np.where(pick_blue, aB, 0)),
    "orange": clean(np.where(pick_orange, aO, 0)),
    "wordmark": clean(np.where(word_zone, aW, 0)),
}

# One shared crop so the layers stack pixel-perfectly.
union = sum(layers.values()) > 0
ys, xs = np.nonzero(union)
pad = 24
x0, x1 = xs.min() - pad, xs.max() + pad + 1
y0, y1 = ys.min() - pad, ys.max() + pad + 1

colors = {"blue": BLUE, "orange": ORANGE, "wordmark": WHITE}
meta = {"crop": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)],
        "colors": {k: "#%02X%02X%02X" % tuple(int(round(c)) for c in v) for k, v in colors.items()},
        "background": "#%02X%02X%02X" % tuple(int(round(c)) for c in BG)}

full = np.zeros((y1 - y0, x1 - x0, 4))
for name, a in layers.items():
    a = a[y0:y1, x0:x1]
    rgba = np.zeros((*a.shape, 4))
    rgba[..., :3] = np.round(colors[name])
    rgba[..., 3] = a * 255
    Image.fromarray(rgba.astype(np.uint8), "RGBA").save(out / f"logo-{name}.png", optimize=True)
    # premultiplied "over" composite for the full lockup
    full[..., :3] = full[..., :3] * (1 - a[..., None]) + np.round(colors[name]) * a[..., None]
    full[..., 3] = full[..., 3] * (1 - a) + a
    ys2, xs2 = np.nonzero(a > 0)
    meta[name] = {"bbox": [int(xs2.min()), int(ys2.min()), int(xs2.max() + 1), int(ys2.max() + 1)]}
full_rgba = full.copy(); full_rgba[..., 3] *= 255
Image.fromarray(np.round(full_rgba).astype(np.uint8), "RGBA").save(out / "logo-full.png", optimize=True)
(out / "logo-meta.json").write_text(json.dumps(meta, indent=2))
print(json.dumps(meta, indent=2))
