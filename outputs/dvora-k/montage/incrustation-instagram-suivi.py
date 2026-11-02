import cv2, numpy as np, glob, os, sys

D = os.path.dirname(os.path.abspath(__file__))
ins = sorted(glob.glob(f"{D}/in/*.png"))
igs = sorted(glob.glob(f"{D}/ig/*.png"))

def corners(frame):
    g = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    m = (g > 200).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    i = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    comp = (lab == i).astype(np.uint8)
    pts = cv2.findNonZero(comp).reshape(-1, 2).astype(np.float32)
    hull = cv2.convexHull(pts).reshape(-1, 2)
    s, d = hull.sum(1), hull[:, 0] - hull[:, 1]
    q = np.array([hull[s.argmin()], hull[d.argmax()], hull[s.argmax()], hull[d.argmin()]], np.float32)
    return q, comp

raw = []
for p in ins:
    q, _ = corners(cv2.imread(p))
    raw.append(q)
raw = np.array(raw)
# temporal smoothing (median over 5 frames) to remove jitter
sm = np.array([np.median(raw[max(0, k - 2):k + 3], axis=0) for k in range(len(raw))])
print("corners frame0", sm[0].tolist(), "frame-1", sm[-1].tolist())

for k, p in enumerate(ins):
    f = cv2.imread(p)
    ig = cv2.imread(igs[min(k, len(igs) - 1)])
    h, w = ig.shape[:2]
    src = np.array([[0, 0], [w, 0], [w, h], [0, h]], np.float32)
    # slight inset so the content sits inside the rounded screen edge
    q = sm[k].copy()
    c = q.mean(0)
    q = c + (q - c) * 1.025
    M = cv2.getPerspectiveTransform(src, q)
    warped = cv2.warpPerspective(ig, M, (f.shape[1], f.shape[0]), flags=cv2.INTER_CUBIC)
    # mask: bright screen pixels (thumb stays on top), restricted to the quad
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
    poly = np.zeros_like(g)
    cv2.fillConvexPoly(poly, (c + (sm[k] - c) * 1.03).astype(np.int32), 255)
    m = ((g > 170) & (poly > 0)).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    m = cv2.dilate(m, np.ones((3, 3), np.uint8), iterations=4)
    m = cv2.bitwise_and(m, poly)
    a = cv2.GaussianBlur(m, (5, 5), 0).astype(np.float32)[..., None] / 255.0
    screen = warped.astype(np.float32) * 0.93
    out = f.astype(np.float32) * (1 - a) + screen * a
    cv2.imwrite(f"{D}/out/{k:03d}.png", np.clip(out, 0, 255).astype(np.uint8))
print("done", len(ins))
